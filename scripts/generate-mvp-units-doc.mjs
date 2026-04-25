import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

const repoRoot = '/workspace/coinage';
const configPath = path.join(repoRoot, 'src/game/city/economy/cityEconomyConfig.ts');
const tablesPath = path.join(repoRoot, 'src/game/city/economy/cityBuildingLevelTables.ts');
const systemPath = path.join(repoRoot, 'src/game/city/economy/cityEconomySystem.ts');
const docPath = path.join(repoRoot, 'docs/06-Troupes-Formation.md');

const sourceTs =
  fs.readFileSync(tablesPath, 'utf8') +
  '\n' +
  fs.readFileSync(configPath, 'utf8').replace("import { CITY_BUILDING_LEVEL_TABLES } from './cityBuildingLevelTables';", '');
const require = createRequire(import.meta.url);
const { outputText } = ts.transpileModule(sourceTs, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 } });

const moduleRef = { exports: {} };
const context = vm.createContext({ module: moduleRef, exports: moduleRef.exports, require, console, process, Math });
new vm.Script(outputText, { filename: 'cityEconomyConfig.js' }).runInContext(context);

const { CITY_ECONOMY_CONFIG } = moduleRef.exports;
const troopIds = Object.keys(CITY_ECONOMY_CONFIG.troops);
const categories = [...new Set(troopIds.map((id) => CITY_ECONOMY_CONFIG.troops[id].category))];
const systemSource = fs.readFileSync(systemPath, 'utf8');
const hasTrainingGuards = systemSource.includes('canStartTroopTraining') && systemSource.includes('startTroopTraining');
const researchEnforced = Boolean(CITY_ECONOMY_CONFIG.troopResearchEnforcementEnabled);

let doc = '# Unités\n\n';
doc += 'Documentation alignée sur le runtime (`src/game/city/economy/cityEconomyConfig.ts` et `src/game/city/economy/cityEconomySystem.ts`).\n\n';
doc += '## Vue d’ensemble\n\n';
doc += '| ID | Nom affiché | Catégorie | Bâtiment de production | Niveau bâtiment requis | Recherche requise | ore | stone | iron | favor | trainingSeconds | populationCost | attack | attackType | def blunt | def sharp | def distance | speed | transport | Rôle |\n';
doc += '|---|---|---|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|---|\n';
for (const unitId of troopIds) {
  const troop = CITY_ECONOMY_CONFIG.troops[unitId];
  doc += `| ${unitId} | ${troop.name} | ${troop.category} | ${troop.requiredBuildingId} | ${troop.requiredBuildingLevel} | ${troop.requiredResearch ?? '—'} | ${troop.cost.ore} | ${troop.cost.stone} | ${troop.cost.iron} | ${troop.favorCost} | ${troop.trainingSeconds} | ${troop.populationCost} | ${troop.attack} | ${troop.attackType} | ${troop.defenseBlunt} | ${troop.defenseSharp} | ${troop.defenseDistance} | ${troop.speed} | ${troop.transportCapacity} | ${troop.notes ?? '—'} |\n`;
}

doc += '\n## Regroupement par famille\n\n';
for (const category of categories) {
  doc += `### ${category}\n\n`;
  doc += '| ID | Nom | Bâtiment | Niveau requis | Recherche | ore | stone | iron | favor | trainingSeconds | populationCost | attack | type | defB | defS | defD | speed | transport |\n';
  doc += '|---|---|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|\n';
  for (const unitId of troopIds.filter((id) => CITY_ECONOMY_CONFIG.troops[id].category === category)) {
    const troop = CITY_ECONOMY_CONFIG.troops[unitId];
    doc += `| ${unitId} | ${troop.name} | ${troop.requiredBuildingId} | ${troop.requiredBuildingLevel} | ${troop.requiredResearch ?? '—'} | ${troop.cost.ore} | ${troop.cost.stone} | ${troop.cost.iron} | ${troop.favorCost} | ${troop.trainingSeconds} | ${troop.populationCost} | ${troop.attack} | ${troop.attackType} | ${troop.defenseBlunt} | ${troop.defenseSharp} | ${troop.defenseDistance} | ${troop.speed} | ${troop.transportCapacity} |\n`;
  }
  doc += '\n';
}

doc += '## Détail par unité\n\n';
for (const unitId of troopIds) {
  const troop = CITY_ECONOMY_CONFIG.troops[unitId];
  doc += `### ${troop.name}\n`;
  doc += `- **id**: \`${unitId}\`\n`;
  doc += `- **catégorie**: \`${troop.category}\`\n`;
  doc += `- **bâtiment de production**: \`${troop.requiredBuildingId}\`\n`;
  doc += `- **prérequis runtime**: \`${troop.requiredBuildingId} >= ${troop.requiredBuildingLevel}\`${troop.requiredResearch ? ` + méta recherche \`${troop.requiredResearch}\`${researchEnforced ? ' (enforcement actif)' : ' (enforcement désactivé pour ce build)'}` : ''}\n`;
  doc += `- **coûts**: ore=${troop.cost.ore}, stone=${troop.cost.stone}, iron=${troop.cost.iron}, favor=${troop.favorCost}\n`;
  doc += `- **temps d’entraînement**: ${troop.trainingSeconds} secondes\n`;
  doc += `- **coût en population**: ${troop.populationCost}\n`;
  doc += `- **combat/logistique runtime**: attack=${troop.attack} (${troop.attackType}), defense=[blunt:${troop.defenseBlunt}, sharp:${troop.defenseSharp}, distance:${troop.defenseDistance}], speed=${troop.speed}, transport=${troop.transportCapacity}\n`;
  if (troop.category === 'militia') {
    doc += '- **statut spécial**: milice temporaire défensive locale, non recrutable via queue standard, activation 3h avec malus production -50%.\n';
  }
  doc += `- **intégration runtime**: ${hasTrainingGuards ? 'validation de prérequis + coûts + population via canStartTroopTraining(), puis enqueue via startTroopTraining().' : 'non détectée'}\n\n`;
}

fs.writeFileSync(docPath, doc);
console.log(`Documentation generated: ${path.relative(repoRoot, docPath)}`);
