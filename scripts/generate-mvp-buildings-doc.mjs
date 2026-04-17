import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

const repoRoot = '/workspace/coinage';
const configPath = path.join(repoRoot, 'src/game/city/economy/cityEconomyConfig.ts');
const docPath = path.join(repoRoot, 'docs/02-Batiments-Construction.md');

const sourceTs = fs.readFileSync(configPath, 'utf8');
const require = createRequire(import.meta.url);
const { outputText } = ts.transpileModule(sourceTs, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2021,
  },
});

const moduleRef = { exports: {} };
const context = vm.createContext({ module: moduleRef, exports: moduleRef.exports, require, console, process, Math });
new vm.Script(outputText, { filename: 'cityEconomyConfig.js' }).runInContext(context);

const { CITY_ECONOMY_CONFIG, STANDARD_BUILDING_ORDER, BUILDING_ORDER_BY_BRANCH } = moduleRef.exports;

const branchLabelByBuilding = {};
for (const [branch, ids] of Object.entries(BUILDING_ORDER_BY_BRANCH)) {
  ids.forEach((id) => {
    branchLabelByBuilding[id] = branch;
  });
}

const roleByBuilding = {
  hq: 'Colonne vertébrale de progression et hub d\'unlocks.',
  mine: 'Production passive d\'ore.',
  quarry: 'Production passive de stone.',
  refinery: 'Production passive d\'iron.',
  warehouse: 'Augmente les capacités de stockage.',
  housing_complex: 'Augmente le cap de population de la ville.',
  barracks: 'Production des unités terrestres.',
  space_dock: 'Production des unités volantes.',
  defensive_wall: 'Défense principale anti-unités terrestres.',
  watch_tower: 'Défense anti-unités volantes + détection locale.',
  armament_factory: 'Améliorations militaires (puissance, entraînement, upkeep).',
  intelligence_center: 'Renseignement local et contre-renseignement.',
  research_lab: 'Capacité de recherche locale.',
  market: 'Efficacité marché et réduction coût de build.',
  council_chamber: 'Politiques locales et vitesse de construction.',
};

const scalingByBuilding = {
  hq: 'Coûts exponentiels (scale 1.195), temps staged, population escalade (2 + 0.9*(n-1) + 0.06*(n-1)^2).',
  mine: 'Coûts exponentiels (1.16), temps staged, population escalade légère (1 + 0.55*(n-1) + 0.03*(n-1)^2).',
  quarry: 'Coûts exponentiels (1.16), temps staged, population escalade légère (1 + 0.55*(n-1) + 0.03*(n-1)^2).',
  refinery: 'Coûts exponentiels (1.165), temps staged, population escalade (2 + 0.7*(n-1) + 0.04*(n-1)^2).',
  warehouse: 'Coûts exponentiels (1.17), temps staged, population escalade (1 + 0.45*(n-1) + 0.03*(n-1)^2).',
  housing_complex: 'Coûts exponentiels (1.17), temps staged, population escalade (1 + 0.5*(n-1) + 0.035*(n-1)^2).',
  barracks: 'Coûts exponentiels (1.2), temps staged, population escalade (2 + 0.8*(n-1) + 0.05*(n-1)^2).',
  space_dock: 'Coûts exponentiels (1.22), temps staged, population escalade forte (3 + 1.0*(n-1) + 0.06*(n-1)^2).',
  defensive_wall: 'Coûts exponentiels (1.185), temps staged, population escalade forte (3 + 0.9*(n-1) + 0.055*(n-1)^2).',
  watch_tower: 'Coûts exponentiels (1.18), temps staged, population escalade (2 + 0.75*(n-1) + 0.05*(n-1)^2).',
  armament_factory: 'Coûts exponentiels (1.205), temps staged, population escalade très forte (4 + 1.1*(n-1) + 0.07*(n-1)^2).',
  intelligence_center: 'Coûts exponentiels (1.185), temps staged, population escalade (2 + 0.75*(n-1) + 0.045*(n-1)^2).',
  research_lab: 'Coûts exponentiels (1.185), temps staged, population escalade (2 + 0.8*(n-1) + 0.05*(n-1)^2).',
  market: 'Coûts exponentiels (1.18), temps staged, population escalade (2 + 0.7*(n-1) + 0.04*(n-1)^2).',
  council_chamber: 'Coûts exponentiels (1.195), temps staged, population escalade forte (3 + 0.95*(n-1) + 0.06*(n-1)^2).',
};

const effectsByBuilding = {
  hq: 'Déverrouille les branches principales à certains paliers de niveau.',
  mine: 'Augmente `orePerHour`.',
  quarry: 'Augmente `stonePerHour`.',
  refinery: 'Augmente `ironPerHour`.',
  warehouse: 'Augmente `storageCap` (table explicite).',
  housing_complex: 'Augmente `populationCapBonus`.',
  barracks: 'Augmente `trainingSpeedPct`.',
  space_dock: 'Augmente `trainingSpeedPct` pour la branche aérienne.',
  defensive_wall: 'Augmente `cityDefensePct`, `damageMitigationPct`, `siegeResistancePct`.',
  watch_tower: 'Augmente `cityDefensePct` (anti-air), `detectionPct`, `counterIntelPct`.',
  armament_factory: 'Augmente `troopCombatPowerPct`, `troopUpkeepEfficiencyPct`, `trainingSpeedPct`.',
  intelligence_center: 'Augmente `detectionPct` et `counterIntelPct`.',
  research_lab: 'Augmente `researchCapacity`.',
  market: 'Augmente `marketEfficiencyPct` et `buildCostReductionPct`.',
  council_chamber: 'Augmente `cityDefensePct` et `buildSpeedPct` (vitesse de build).',
};

function prereqText(building) {
  const parts = [];
  if (building.unlockAtHq > 1) parts.push(`HQ >= ${building.unlockAtHq}`);
  (building.prerequisites ?? []).forEach((req) => parts.push(`${req.buildingId} >= ${req.minLevel}`));
  (building.levelBandPrerequisites ?? []).forEach((band) => {
    const bandReqs = [];
    if (band.minHqLevel) bandReqs.push(`HQ >= ${band.minHqLevel}`);
    (band.prerequisites ?? []).forEach((req) => bandReqs.push(`${req.buildingId} >= ${req.minLevel}`));
    parts.push(`L${band.minTargetLevel}-${band.maxTargetLevel}: ${bandReqs.join(', ')}`);
  });
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

let doc = '';
doc += '# Bâtiments & Construction — MVP MICRO\n\n';
doc += '## Intro\n';
doc += 'Ce document est généré depuis la config runtime active (`cityEconomyConfig.ts`) pour éviter toute dérive entre design et implémentation.\n\n';
doc += '## Liste des bâtiments MVP actifs\n';
doc += STANDARD_BUILDING_ORDER.map((id) => `- \`${id}\` — ${CITY_ECONOMY_CONFIG.buildings[id].name}`).join('\n');
doc += '\n\n';

doc += '## Détail par bâtiment MVP\n\n';

for (const id of STANDARD_BUILDING_ORDER) {
  const building = CITY_ECONOMY_CONFIG.buildings[id];
  doc += `### ${building.name} (${id})\n`;
  doc += `- **Branche** : ${branchLabelByBuilding[id]}\n`;
  doc += `- **Rôle** : ${roleByBuilding[id] ?? '—'}\n`;
  doc += `- **Prérequis** : ${prereqText(building)}\n`;
  doc += `- **Effets** : ${effectsByBuilding[id] ?? 'Effet local défini dans la config runtime.'}\n`;
  doc += `- **Logique de scaling** : ${scalingByBuilding[id] ?? 'Progression par table runtime.'}\n\n`;
  doc += '| Niveau | Ore | Stone | Iron | Temps (s) | Temps (lisible) | Population requise |\n';
  doc += '|---:|---:|---:|---:|---:|---|---:|\n';
  building.levels.forEach((row) => {
    doc += `| ${row.level} | ${row.resources.ore} | ${row.resources.stone} | ${row.resources.iron} | ${row.buildSeconds} | ${secondsToLabel(row.buildSeconds)} | ${row.populationCost} |\n`;
  });
  doc += '\n';
}

doc += '## Bâtiments spéciaux futurs à implémenter\n';
doc += '- `training_grounds` : bâtiment spécial différé (hors runtime MVP).\n';
doc += '- `shard_vault` : branche premium/shards différée (hors runtime MVP).\n';
doc += '- Les bâtiments retirés du MVP actif (`combat_forge`, `military_academy`) restent hors runtime actuel et pourront être réintroduits plus tard.\n';

fs.writeFileSync(docPath, doc);
console.log(`Documentation generated: ${path.relative(repoRoot, docPath)}`);
