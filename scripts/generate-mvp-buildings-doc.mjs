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

function formatNumber(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function prereqText(building) {
  const parts = [];
  if (building.unlockAtHq > 1) parts.push(`hq >= ${building.unlockAtHq}`);
  (building.prerequisites ?? []).forEach((req) => parts.push(`${req.buildingId} >= ${req.minLevel}`));
  return parts.length > 0 ? parts.join(' · ') : 'aucun';
}

function secondsToLabel(value) {
  const h = Math.floor(value / 3600);
  const m = Math.floor((value % 3600) / 60);
  const s = value % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

function roleText(buildingId, building) {
  const firstEffect = building.levels.find((row) => Object.keys(row.effect).length > 0)?.effect ?? {};
  if (buildingId === 'skyshield_battery') return 'Tour défensive anti-aérienne (équivalent mur défensif contre unités volantes).';
  if (firstEffect.orePerHour !== undefined) return 'Production de ore par heure.';
  if (firstEffect.stonePerHour !== undefined) return 'Production de stone par heure.';
  if (firstEffect.ironPerHour !== undefined) return 'Production de iron par heure.';
  if (firstEffect.storageCap !== undefined) return 'Augmente la capacité de stockage des ressources.';
  if (firstEffect.populationCapBonus !== undefined) return 'Augmente la capacité de population.';
  if (firstEffect.trainingSpeedPct !== undefined) return 'Accélère la formation des unités.';
  if (firstEffect.researchCapacity !== undefined) return 'Augmente la capacité de recherche.';
  if (firstEffect.detectionPct !== undefined || firstEffect.counterIntelPct !== undefined) return 'Améliore la détection et la contre-intelligence.';
  if (firstEffect.marketEfficiencyPct !== undefined) return 'Améliore l’efficacité logistique du marché.';
  if (firstEffect.cityDefensePct !== undefined || firstEffect.damageMitigationPct !== undefined) return 'Renforce la défense de la ville.';
  if (firstEffect.troopCombatPowerPct !== undefined || firstEffect.troopUpkeepEfficiencyPct !== undefined) return 'Renforce la puissance militaire locale.';
  if (firstEffect.buildSpeedPct !== undefined) return 'Améliore la vitesse de construction.';
  if (buildingId === 'hq') return 'Nœud central de progression et de déblocage.';
  return '—';
}

function describePrimaryEffect(effectKeys) {
  if (effectKeys.length === 0) return 'aucun effet runtime explicite';
  return effectKeys.join(', ');
}

function getEffectKeys(building) {
  const all = new Set();
  building.levels.forEach((row) => {
    Object.entries(row.effect).forEach(([key, value]) => {
      if (value !== undefined) all.add(key);
    });
  });
  return [...all].sort((a, b) => a.localeCompare(b));
}

function renderEffectValue(effect, key) {
  const value = effect[key];
  if (value === undefined || value === null) return '—';
  if (typeof value === 'object') return Object.entries(value).map(([k, v]) => `${k}:${v}`).join(' · ');
  return formatNumber(value);
}

let doc = '# Bâtiments\n\n';
doc += 'Documentation générée automatiquement depuis le runtime (`src/game/city/economy/cityEconomyConfig.ts`).\n\n';
doc +=
  'Note timing Grepolis: les `buildSeconds` hors `hq` sont stockés comme valeurs de référence (monde vitesse 1, Senate niveau 15). Le runtime applique ensuite la normalisation de vitesse selon le niveau de `hq` et `worldSpeed`.\n\n';
doc += '## Vue d’ensemble\n\n';
doc += '| ID | Nom affiché | Catégorie | Niveau max | Prérequis de déblocage | Effet principal | Notes |\n';
doc += '|---|---|---|---:|---|---|---|\n';
for (const id of STANDARD_BUILDING_ORDER) {
  const building = CITY_ECONOMY_CONFIG.buildings[id];
  const effectKeys = getEffectKeys(building);
  doc += `| ${id} | ${building.name} | ${branchLabelByBuilding[id]} | ${building.maxLevel} | ${prereqText(building)} | ${describePrimaryEffect(effectKeys)} | source runtime |\n`;
}

doc += '\n## Détail par bâtiment\n\n';
for (const id of STANDARD_BUILDING_ORDER) {
  const building = CITY_ECONOMY_CONFIG.buildings[id];
  const resourceKeys = Object.keys(building.levels[0].resources);
  const effectKeys = getEffectKeys(building);

  doc += `### ${building.name}\n`;
  doc += `- **id**: \`${id}\`\n`;
  doc += `- **catégorie**: \`${branchLabelByBuilding[id]}\`\n`;
  doc += `- **rôle gameplay**: ${roleText(id, building)}\n`;
  doc += `- **niveau max**: ${building.maxLevel}\n`;
  doc += `- **prérequis**: ${prereqText(building)}\n\n`;

  const header = ['Niveau', ...resourceKeys, 'buildSeconds', 'populationCost', ...effectKeys];
  doc += `| ${header.join(' | ')} |\n`;
  doc += `| ${header.map((_, idx) => (idx === 0 ? '---:' : '---')).join(' | ')} |\n`;
  building.levels.forEach((row) => {
    const values = [
      row.level,
      ...resourceKeys.map((key) => formatNumber(row.resources[key])),
      `${row.buildSeconds} (${secondsToLabel(row.buildSeconds)})`,
      row.populationCost,
      ...effectKeys.map((key) => renderEffectValue(row.effect, key)),
    ];
    doc += `| ${values.join(' | ')} |\n`;
  });
  doc += '\n';
}

fs.writeFileSync(docPath, doc);
console.log(`Documentation generated: ${path.relative(repoRoot, docPath)}`);
