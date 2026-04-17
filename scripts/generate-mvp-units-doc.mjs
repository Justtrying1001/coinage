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

let doc = '# Unités\n\n';
doc += 'Documentation alignée sur le runtime (`src/game/city/economy/cityEconomyConfig.ts` et `src/game/city/economy/cityEconomySystem.ts`).\n\n';
doc += '## Vue d’ensemble\n\n';
doc += '| ID | Nom affiché | Catégorie | Bâtiment de production | Niveau bâtiment requis | ore | stone | iron | trainingSeconds | populationCost | Notes |\n';
doc += '|---|---|---|---|---:|---:|---:|---:|---:|---:|---|\n';
for (const unitId of troopIds) {
  const troop = CITY_ECONOMY_CONFIG.troops[unitId];
  doc += `| ${unitId} | ${troop.name} | ${troop.category} | ${troop.requiredBuildingId} | ${troop.requiredBuildingLevel} | ${troop.cost.ore} | ${troop.cost.stone} | ${troop.cost.iron} | ${troop.trainingSeconds} | ${troop.populationCost} | valeurs runtime |\n`;
}

doc += '\n## Regroupement par famille\n\n';
for (const category of categories) {
  doc += `### ${category}\n\n`;
  doc += '| ID | Nom | Bâtiment | Niveau requis | ore | stone | iron | trainingSeconds | populationCost |\n';
  doc += '|---|---|---|---:|---:|---:|---:|---:|---:|\n';
  for (const unitId of troopIds.filter((id) => CITY_ECONOMY_CONFIG.troops[id].category === category)) {
    const troop = CITY_ECONOMY_CONFIG.troops[unitId];
    doc += `| ${unitId} | ${troop.name} | ${troop.requiredBuildingId} | ${troop.requiredBuildingLevel} | ${troop.cost.ore} | ${troop.cost.stone} | ${troop.cost.iron} | ${troop.trainingSeconds} | ${troop.populationCost} |\n`;
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
  doc += `- **prérequis runtime**: \`${troop.requiredBuildingId} >= ${troop.requiredBuildingLevel}\`\n`;
  doc += `- **coûts**: ore=${troop.cost.ore}, stone=${troop.cost.stone}, iron=${troop.cost.iron}\n`;
  doc += `- **temps d’entraînement**: ${troop.trainingSeconds} secondes\n`;
  doc += `- **coût en population**: ${troop.populationCost}\n`;
  doc += `- **autres stats runtime implémentées**: aucune stat de combat/logistique supplémentaire définie dans \`TroopConfig\`.\n`;
  doc += `- **intégration runtime**: ${hasTrainingGuards ? 'validation de prérequis + coûts + population via canStartTroopTraining(), puis enqueue via startTroopTraining().' : 'non détectée'}\n\n`;
}

fs.writeFileSync(docPath, doc);
console.log(`Documentation generated: ${path.relative(repoRoot, docPath)}`);
