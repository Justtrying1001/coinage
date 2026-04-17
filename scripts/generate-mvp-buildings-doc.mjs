import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

const repoRoot = '/workspace/coinage';
const configPath = path.join(repoRoot, 'src/game/city/economy/cityEconomyConfig.ts');
const tablesPath = path.join(repoRoot, 'src/game/city/economy/cityBuildingLevelTables.ts');
const docPath = path.join(repoRoot, 'docs/02-Batiments-Construction.md');

const sourceTs =
  fs.readFileSync(tablesPath, 'utf8') +
  '\n' +
  fs.readFileSync(configPath, 'utf8').replace("import { CITY_BUILDING_LEVEL_TABLES } from './cityBuildingLevelTables';", '');
const require = createRequire(import.meta.url);
const { outputText } = ts.transpileModule(sourceTs, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 } });

const moduleRef = { exports: {} };
const context = vm.createContext({ module: moduleRef, exports: moduleRef.exports, require, console, process, Math });
new vm.Script(outputText, { filename: 'cityEconomyConfig.js' }).runInContext(context);

const { CITY_ECONOMY_CONFIG, STANDARD_BUILDING_ORDER, BUILDING_ORDER_BY_BRANCH } = moduleRef.exports;

const branchLabelByBuilding = {};
for (const [branch, ids] of Object.entries(BUILDING_ORDER_BY_BRANCH)) ids.forEach((id) => (branchLabelByBuilding[id] = branch));

function prereqText(building) {
  const parts = [];
  if (building.unlockAtHq > 1) parts.push(`HQ >= ${building.unlockAtHq}`);
  (building.prerequisites ?? []).forEach((req) => parts.push(`${req.buildingId} >= ${req.minLevel}`));
  return parts.length > 0 ? parts.join(' · ') : 'Aucun prérequis (hors disponibilité de base).';
}

function secondsToLabel(value) {
  const h = Math.floor(value / 3600);
  const m = Math.floor((value % 3600) / 60);
  const s = value % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

function effectLabel(effect) {
  if (effect.orePerHour) return `Ore/h ${effect.orePerHour}`;
  if (effect.stonePerHour) return `Stone/h ${effect.stonePerHour}`;
  if (effect.ironPerHour) return `Iron/h ${effect.ironPerHour}`;
  if (effect.populationCapBonus) return `Cap population ${effect.populationCapBonus}`;
  if (effect.storageCap) return `Cap stock ${effect.storageCap.ore}`;
  if (effect.researchCapacity) return `Cap recherche ${effect.researchCapacity}`;
  if (effect.cityDefensePct || effect.damageMitigationPct) return `Defense ${effect.cityDefensePct ?? 0}%`;
  if (effect.marketEfficiencyPct) return `Transport/market ${effect.marketEfficiencyPct}%`;
  if (effect.trainingSpeedPct) return `Vitesse entraînement ${effect.trainingSpeedPct}%`;
  if (effect.detectionPct || effect.counterIntelPct) return `Détection ${effect.detectionPct ?? 0}% / Contre-intel ${effect.counterIntelPct ?? 0}%`;
  if (effect.troopCombatPowerPct) return `Puissance troupe ${effect.troopCombatPowerPct}%`;
  if (effect.buildSpeedPct) return `Vitesse construction ${effect.buildSpeedPct}%`;
  return '—';
}

let doc = '# Bâtiments & Construction — MVP MICRO\n\n';
doc += '## Intro\nSource of truth runtime: `cityEconomyConfig.ts` (généré automatiquement).\n\n';
doc += '## Liste des bâtiments MVP actifs\n';
doc += STANDARD_BUILDING_ORDER.map((id) => `- \`${id}\` — ${CITY_ECONOMY_CONFIG.buildings[id].name}`).join('\n');
doc += '\n\n## Détail par bâtiment MVP\n\n';

for (const id of STANDARD_BUILDING_ORDER) {
  const building = CITY_ECONOMY_CONFIG.buildings[id];
  doc += `### ${building.name} (${id})\n`;
  doc += `- **Branche** : ${branchLabelByBuilding[id]}\n`;
  doc += `- **Source** : ${'Runtime table'}\n`;
  doc += `- **Max level runtime** : ${building.maxLevel}\n`;
  doc += `- **Prérequis** : ${prereqText(building)}\n\n`;
  doc += '| Niveau | Ore | Stone | Iron | Temps (s) | Temps | Population | Effet principal |\n';
  doc += '|---:|---:|---:|---:|---:|---|---:|---|\n';
  building.levels.forEach((row) => {
    doc += `| ${row.level} | ${row.resources.ore} | ${row.resources.stone} | ${row.resources.iron} | ${row.buildSeconds} | ${secondsToLabel(row.buildSeconds)} | ${row.populationCost} | ${effectLabel(row.effect)} |\n`;
  });
  doc += '\n';
}

doc += '## Bâtiments spéciaux futurs à implémenter\n';
doc += '- `training_grounds` : bâtiment spécial différé (hors runtime MVP).\n';
doc += '- `shard_vault` : branche premium/shards différée (hors runtime MVP).\n';

fs.writeFileSync(docPath, doc);
console.log(`Documentation generated: ${path.relative(repoRoot, docPath)}`);
