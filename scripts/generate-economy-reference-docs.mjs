import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

const repoRoot = '/workspace/coinage';
const configPath = path.join(repoRoot, 'src/game/city/economy/cityEconomyConfig.ts');
const tablesPath = path.join(repoRoot, 'src/game/city/economy/cityBuildingLevelTables.ts');
const catalogPath = path.join(repoRoot, 'src/game/city/economy/cityContentCatalog.ts');
const systemPath = path.join(repoRoot, 'src/game/city/economy/cityEconomySystem.ts');
const uiPath = path.join(repoRoot, 'src/game/render/modes/CityFoundationMode.ts');

const require = createRequire(import.meta.url);

function loadTsModule(sourceTs, filename) {
  const { outputText } = ts.transpileModule(sourceTs, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 },
  });
  const moduleRef = { exports: {} };
  const context = vm.createContext({ module: moduleRef, exports: moduleRef.exports, require, console, process, Math });
  new vm.Script(outputText, { filename }).runInContext(context);
  return moduleRef.exports;
}

const tablesSource = fs.readFileSync(tablesPath, 'utf8');
const configSource = fs.readFileSync(configPath, 'utf8').replace("import { CITY_BUILDING_LEVEL_TABLES } from './cityBuildingLevelTables';", '');
const catalogSource = fs.readFileSync(catalogPath, 'utf8');
const systemSource = fs.readFileSync(systemPath, 'utf8');
const uiSource = fs.readFileSync(uiPath, 'utf8');

const configModule = loadTsModule(`${tablesSource}\n${configSource}`, 'cityEconomyConfig.js');
const catalogModule = loadTsModule(catalogSource, 'cityContentCatalog.js');

const { CITY_ECONOMY_CONFIG, STANDARD_BUILDING_ORDER, BUILDING_ORDER_BY_BRANCH } = configModule;
const { FULL_BUILDING_CATALOG, FULL_UNIT_CATALOG } = catalogModule;

const buildingCatalogById = new Map(FULL_BUILDING_CATALOG.map((entry) => [entry.id, entry]));
const unitCatalogById = new Map(FULL_UNIT_CATALOG.map((entry) => [entry.id, entry]));

const buildingBranch = {};
for (const [branch, ids] of Object.entries(BUILDING_ORDER_BY_BRANCH)) {
  ids.forEach((id) => {
    buildingBranch[id] = branch;
  });
}

const effectKeysUsedInRuntime = new Set([...systemSource.matchAll(/\.effect\.([a-zA-Z0-9_]+)/g)].map((m) => m[1]));

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function fmt(value) {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : String(value);
  return String(value);
}

function bool(v) {
  return v ? 'oui' : 'non';
}

function effectSummary(effect) {
  const entries = Object.entries(effect ?? {}).filter(([, value]) => {
    if (value === undefined || value === null) return false;
    if (typeof value === 'number') return value !== 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  });
  if (entries.length === 0) return '—';
  return entries
    .map(([key, value]) => {
      if (typeof value === 'object') {
        return `${key}=${Object.entries(value)
          .map(([k, v]) => `${k}:${v}`)
          .join(',')}`;
      }
      return `${key}=${value}`;
    })
    .join(' ; ');
}

function isBuildingUsableInRuntime(buildingId) {
  if (!(buildingId in CITY_ECONOMY_CONFIG.buildings)) return false;
  return systemSource.includes('canStartConstruction') && systemSource.includes('startConstruction');
}

function runtimeStatusForBuilding(buildingId) {
  const config = CITY_ECONOMY_CONFIG.buildings[buildingId];
  const usedEffects = new Set(config.levels.flatMap((row) => Object.keys(row.effect ?? {})).filter((k) => effectKeysUsedInRuntime.has(k)));
  const allEffects = new Set(config.levels.flatMap((row) => Object.keys(row.effect ?? {})));
  if (allEffects.size === 0) return 'implémenté (bâtiment de progression sans effet direct en stats dérivées)';
  if (usedEffects.size === allEffects.size) return 'implémenté';
  if (usedEffects.size === 0) return 'partiel (effets configurés mais non consommés par le runtime actuel)';
  return 'partiel';
}

function buildingGameplayRole(buildingId) {
  const row1 = CITY_ECONOMY_CONFIG.buildings[buildingId].levels.find((r) => Object.keys(r.effect).length > 0);
  const effect = row1?.effect ?? {};
  if (effect.orePerHour) return 'Production d’ore.';
  if (effect.stonePerHour) return 'Production de stone.';
  if (effect.ironPerHour) return 'Production d’iron.';
  if (effect.storageCap) return 'Augmente les caps de stockage de ressources.';
  if (effect.populationCapBonus) return 'Augmente le cap de population (et sert de base à la milice).';
  if (buildingId === 'barracks') return 'Débloque l’entraînement des unités terrestres.';
  if (buildingId === 'space_dock') return 'Débloque l’entraînement des unités navales.';
  if (buildingId === 'defensive_wall') return 'Bonus défensifs de ville (défense, mitigation, résistance siège).';
  if (buildingId === 'skyshield_battery') return 'Bonus anti-aérien de défense de ville pour unités space_dock (city_defense uniquement).';
  if (buildingId === 'armament_factory') return 'Bonus puissance/entretien/formation des troupes.';
  if (buildingId === 'intelligence_center') return 'Détection, contre-intel, projets intel, coffre espion.';
  if (buildingId === 'research_lab') return 'Capacité de recherche et gate des recherches.';
  if (buildingId === 'market') return 'Efficacité de marché.';
  if (buildingId === 'council_chamber') return 'Bonus build speed + city defense, déblocage politiques locales.';
  if (buildingId === 'hq') return 'Colonne de progression: déverrouille les autres bâtiments et normalise les temps de construction.';
  return 'Rôle non déterminé automatiquement.';
}

function dependenciesForBuilding(buildingId) {
  const unlocksBuildings = STANDARD_BUILDING_ORDER
    .filter((id) => id !== buildingId)
    .filter((id) => {
      const cfg = CITY_ECONOMY_CONFIG.buildings[id];
      return (cfg.prerequisites ?? []).some((req) => req.buildingId === buildingId);
    });

  const linkedTroops = Object.values(CITY_ECONOMY_CONFIG.troops).filter((troop) => troop.requiredBuildingId === buildingId).map((troop) => troop.id);

  const linkedResearch = Object.values(CITY_ECONOMY_CONFIG.research)
    .filter((r) => buildingId === 'research_lab' && r.requiredBuildingLevel > 0)
    .map((r) => `${r.id} (lab ${r.requiredBuildingLevel})`);

  const linkedPolicies = Object.values(CITY_ECONOMY_CONFIG.policies)
    .filter((p) => buildingId === 'council_chamber')
    .map((p) => `${p.id} (council ${p.requiredCouncilLevel})`);

  return { unlocksBuildings, linkedTroops, linkedResearch, linkedPolicies };
}

function runtimeNotesForBuilding(buildingId) {
  const notes = [];
  if (buildingId === 'hq') notes.push('- `getConstructionDurationSeconds` applique une normalisation de type Senate basée sur le niveau HQ, sauf pour l’upgrade HQ lui-même.');
  if (['mine', 'quarry', 'refinery'].includes(buildingId)) notes.push('- La production est calculée dans `getProductionPerHour` / `applyClaimOnAccess` avec bonus de recherche/politique puis malus milice actif.');
  if (buildingId === 'warehouse') notes.push('- Les caps de ressources viennent de `getStorageCaps`; fallback base si niveau 0.');
  if (buildingId === 'housing_complex') notes.push('- `getPopulationSnapshot` prend le cap depuis `populationCapBonus`; `activateMilitia` utilise ce niveau pour la taille de milice (cap niveau 25).');
  if (buildingId === 'barracks') notes.push('- `canStartTroopTraining` vérifie le niveau bâtiment requis de chaque unité ground, et son `trainingSpeedPct` alimente `getCityDerivedStats`.');
  if (buildingId === 'space_dock') notes.push('- Même logique que barracks pour les unités navales; son `trainingSpeedPct` est cumulé.');
  if (buildingId === 'defensive_wall') notes.push('- Contribue à `cityDefensePct`, `damageMitigationPct`, `siegeResistancePct` via `getCityDerivedStats`.');
  if (buildingId === 'skyshield_battery') notes.push('- Applique `airWallDefensePct`/`airWallBaseDefense` aux unités space_dock en `city_defense` via helper runtime dédié.');
  if (buildingId === 'armament_factory') notes.push('- Contribue à `trainingSpeedPct`, `troopCombatPowerPct`, `troopUpkeepEfficiencyPct` via `getCityDerivedStats`.');
  if (buildingId === 'intelligence_center') notes.push('- Garde l’accès à `canStartIntelProject`, `canDepositSpySilver`, `canStartEspionageMission`; `getSpyVaultCap` dépend du niveau.');
  if (buildingId === 'research_lab') notes.push('- `canStartResearch` exige un niveau mini par recherche; capacité calculée par `getResearchPointsCapacity` (= niveau * 4), pas via `effect.researchCapacity`.');
  if (buildingId === 'market') notes.push('- `marketEfficiencyPct` est calculé dans stats dérivées mais son impact runtime direct n’est pas branché hors exposition de stat.');
  if (buildingId === 'council_chamber') notes.push('- `canSetPolicy` vérifie son niveau; `buildSpeedPct` impacte les durées de construction (plafond multiplicateur 0.4).');

  const cfg = CITY_ECONOMY_CONFIG.buildings[buildingId];
  const allKeys = [...new Set(cfg.levels.flatMap((r) => Object.keys(r.effect ?? {})))];
  const unhooked = allKeys.filter((k) => !effectKeysUsedInRuntime.has(k));
  if (unhooked.length > 0) {
    notes.push(`- Effets configurés non lus explicitement par ` + '`cityEconomySystem`' + `: ${unhooked.map((k) => `\`${k}\``).join(', ')}.`);
  }
  if (notes.length === 0) notes.push('- Aucun comportement runtime spécifique détecté au-delà du pipeline de construction.');
  return notes;
}

function runtimeStatusForUnit(unit) {
  if (unit.category === 'militia') return 'partiel (définie en config, non entraînable via queue standard)';
  return 'partiel (recrutement branché; combat/déplacement/transport/conquête non implémentés dans ce runtime)';
}

function unitRole(unit) {
  if (unit.category === 'militia') return 'Défense locale temporaire uniquement.';
  if (unit.transportCapacity > 0) return 'Transport logistique/naval.';
  if (unit.id === 'colonization_convoy') return 'Colonisation/conquête (selon notes), avec consommation attendue mais non implémentée ici.';
  if (unit.attackType === 'none') return 'Support non-combattant (dans cette base de code).';
  if (unit.attackType === 'naval') return 'Combat naval (stat configurée; résolution absente du runtime).';
  if (unit.id === 'breacher') return 'Siège terrestre lent à forte pression structurelle (intent config).';
  return unit.category === 'ground' ? 'Unité terrestre de combat.' : 'Unité navale de combat.';
}

function runtimeNotesForUnit(unit) {
  const notes = [];
  if (unit.category === 'militia') {
    notes.push('- Refus explicite dans `canStartTroopTraining`: la milice ne passe jamais par la queue standard.');
    notes.push('- Activée via `activateMilitia` (3h), pénalité production -50%, local defense only (`canSendMilitiaOnAttack` et `canTransferMilitia` retournent `false`).');
    return notes;
  }

  notes.push('- `canStartTroopTraining` vérifie quantité entière positive, bâtiment requis, recherche requise (enforcement activé), ressources et population libre.');
  notes.push('- `startTroopTraining` applique un multiplicateur de vitesse basé sur `trainingSpeedPct` (borné à `Math.max(0.35, 1 - pct/100)`).');
  notes.push('- La population est réservée pendant l’entraînement (`populationReserved`) puis consommée via le stock de troupes.');

  if (!systemSource.includes('transportCapacity')) notes.push('- `transportCapacity` est en config mais pas exploité dans les systèmes runtime actuels.');
  if (!systemSource.includes('defenseBlunt') && !systemSource.includes('attackType')) {
    notes.push('- Les stats de combat (`attack`, `attackType`, défenses) sont configurées mais aucune résolution de combat n’est branchée ici.');
  }

  if (unit.id === 'colonization_convoy') {
    notes.push('- La note parle de consommation à la colonisation/conquête, mais aucun flux de colonisation/conquête runtime n’est implémenté dans ce module.');
  }
  if (unit.transportCapacity > 0) notes.push('- Unité de transport dans la config; aucune logique de chargement/déchargement n’est implémentée dans ce repo.');

  return notes;
}

function markdownTableForBuilding(cfg) {
  const effectKeys = [...new Set(cfg.levels.flatMap((row) => Object.keys(row.effect ?? {})))].sort();
  const lines = [];
  lines.push('| Niveau | Ore | Stone | Iron | Temps construction (s) | Population | Effets non nuls | Pré requis HQ (target) | Pré requis additionnels (target) |');
  lines.push('|---:|---:|---:|---:|---:|---:|---|---|---|');

  for (const row of cfg.levels) {
    const band = (cfg.levelBandPrerequisites ?? []).find((b) => row.level >= b.minTargetLevel && row.level <= b.maxTargetLevel);
    const hqReq = Math.max(cfg.unlockAtHq, band?.minHqLevel ?? 0);
    const bandReqs = [...(cfg.prerequisites ?? []), ...(band?.prerequisites ?? [])];
    const reqText = bandReqs.length > 0 ? bandReqs.map((r) => `${r.buildingId}>=${r.minLevel}`).join(', ') : '—';

    const nonZero = effectKeys
      .filter((key) => {
        const value = row.effect[key];
        if (value === undefined || value === null) return false;
        if (typeof value === 'number') return value !== 0;
        if (typeof value === 'object') return Object.keys(value).length > 0;
        return true;
      })
      .map((key) => `${key}=${effectSummary({ [key]: row.effect[key] }).replace(`${key}=`, '')}`)
      .join(' ; ');

    lines.push(`| ${row.level} | ${row.resources.ore} | ${row.resources.stone} | ${row.resources.iron} | ${row.buildSeconds} | ${row.populationCost} | ${nonZero || '—'} | HQ>=${hqReq} | ${reqText} |`);
  }
  return lines.join('\n');
}

function writeBuildingDocs() {
  const outDir = path.join(repoRoot, 'docs/building');
  ensureDir(outDir);

  const readmeRows = [];

  for (const buildingId of STANDARD_BUILDING_ORDER) {
    const cfg = CITY_ECONOMY_CONFIG.buildings[buildingId];
    const catalog = buildingCatalogById.get(buildingId);
    const deps = dependenciesForBuilding(buildingId);
    const initial = ['hq', 'mine', 'quarry', 'warehouse', 'housing_complex'].includes(buildingId);

    const text = `# ${cfg.name}\n\n## 1. Résumé\n- ID technique: \`${buildingId}\`\n- Branche / catégorie: \`${buildingBranch[buildingId]}\`\n- Statut dans le code: ${runtimeStatusForBuilding(buildingId)}\n- Rôle gameplay réel: ${buildingGameplayRole(buildingId)}\n- Réellement utilisable dans le runtime actuel: ${bool(isBuildingUsableInRuntime(buildingId))}\n\n## 2. Position dans la progression\n- Niveau max: ${cfg.maxLevel}\n- Condition de déblocage HQ: HQ >= ${cfg.unlockAtHq}\n- Prérequis globaux: ${(cfg.prerequisites ?? []).length ? (cfg.prerequisites ?? []).map((r) => `${r.buildingId} >= ${r.minLevel}`).join(', ') : 'aucun'}\n- Prérequis par band / palier: ${(cfg.levelBandPrerequisites ?? []).length ? 'présents (voir tableau)' : 'aucun dans la config runtime'}\n- Présent dans l’état initial d’une ville: ${bool(initial)}\n\n## 3. Ce que ce bâtiment fait réellement\n- Effets configurés (union de tous niveaux): ${[...new Set(cfg.levels.flatMap((row) => Object.keys(row.effect ?? {})))].join(', ') || 'aucun'}\n- Effets lus explicitement par le runtime ('cityEconomySystem'): ${[...new Set(cfg.levels.flatMap((row) => Object.keys(row.effect ?? {})).filter((k) => effectKeysUsedInRuntime.has(k)))].join(', ') || 'aucun'}\n- Entrée de catalogue correspondante: ${catalog ? `oui (phase=${catalog.phase}, definitionStatus=${catalog.definitionStatus}, gameplayImplemented=${catalog.gameplayImplemented})` : 'non'}\n\n## 4. Table complète des niveaux\n${markdownTableForBuilding(cfg)}\n\n## 5. Contenus débloqués / dépendances aval\n### Bâtiments débloqués\n${deps.unlocksBuildings.length ? deps.unlocksBuildings.map((id) => `- \`${id}\``).join('\n') : '- aucun bâtiment ne référence ce bâtiment comme prérequis direct'}\n\n### Unités liées\n${deps.linkedTroops.length ? deps.linkedTroops.map((id) => `- \`${id}\``).join('\n') : '- aucune unité liée directement'}\n\n### Recherches liées\n${deps.linkedResearch.length ? deps.linkedResearch.map((x) => `- ${x}`).join('\n') : '- aucune liaison directe hors gate global research_lab'}\n\n### Politiques liées\n${deps.linkedPolicies.length ? deps.linkedPolicies.map((x) => `- ${x}`).join('\n') : '- aucune'}\n\n## 6. Détails runtime importants\n${runtimeNotesForBuilding(buildingId).join('\n')}\n\n## 7. Statut d’implémentation / zones d’attention\n- Runtime construction: implémenté (canStartConstruction, startConstruction, resolveCompletedConstruction).\n- Divergence config/runtime: ${catalog ? `catalog présent, comparer son statut (phase=${catalog.phase}, gameplayImplemented=${catalog.gameplayImplemented}) avec l’état runtime réel ci-dessus.` : 'pas d’entrée catalogue correspondante.'}\n- Écarts docs existantes: non utilisés comme source de vérité dans cette génération (code prioritaire).\n\n## 8. Sources de vérité utilisées\n- src/game/city/economy/cityEconomyConfig.ts\n- src/game/city/economy/cityBuildingLevelTables.ts\n- src/game/city/economy/cityEconomySystem.ts\n- src/game/city/economy/cityContentCatalog.ts\n- src/game/render/modes/CityFoundationMode.ts (exposition UI)\n`;

    fs.writeFileSync(path.join(outDir, `${buildingId}.md`), text);
    readmeRows.push(`| ${buildingId} | ${cfg.name} | ${buildingBranch[buildingId]} | ${buildingGameplayRole(buildingId)} | [voir](./${buildingId}.md) |`);
  }

  const readme = `# Référence bâtiments (runtime)\n\nDocumentation générée automatiquement depuis la config runtime et la logique exécutée.\n\n| ID | Nom affiché | Catégorie / branche | Rôle principal | Lien |\n|---|---|---|---|---|\n${readmeRows.join('\n')}\n\n## Régénération\n\n\`node scripts/generate-economy-reference-docs.mjs\`\n`;
  fs.writeFileSync(path.join(outDir, 'README.md'), readme);
}

function writeUnitDocs() {
  const outDir = path.join(repoRoot, 'docs/units');
  ensureDir(outDir);

  const readmeRows = [];

  for (const [unitId, unit] of Object.entries(CITY_ECONOMY_CONFIG.troops)) {
    const catalog = unitCatalogById.get(unitId);

    const text = `# ${unit.name}\n\n## 1. Résumé\n- ID technique: \`${unitId}\`\n- Catégorie: \`${unit.category}\`\n- Bâtiment requis: \`${unit.requiredBuildingId}\`\n- Niveau du bâtiment requis: ${unit.requiredBuildingLevel}\n- Recherche requise: ${unit.requiredResearch ?? 'aucune'}\n- Statut dans le code: ${runtimeStatusForUnit(unit)}\n- Rôle gameplay réel: ${unitRole(unit)}\n- Réellement recrutable / utilisable dans le runtime actuel: ${unit.category === 'militia' ? 'partiel' : 'partiel'}\n\n## 2. Déblocage et accès\n- Bâtiment requis: \`${unit.requiredBuildingId}\`\n- Niveau requis: ${unit.requiredBuildingLevel}\n- Recherche requise éventuelle: ${unit.requiredResearch ?? 'aucune'}\n- Branche concernée: ${unit.category === 'naval' ? 'naval / space_dock' : unit.category === 'ground' ? 'ground / barracks' : 'militia'}\n- Conditions spécifiques: ${unit.category === 'militia' ? 'milice non entraînable via queue standard; activation dédiée.' : 'vérification ressources + population + prereqs via canStartTroopTraining.'}\n- Passe par la queue standard: ${bool(unit.category !== 'militia')}\n\n## 3. Fiche de stats complète\n| Nom | ID | Catégorie | Ore | Stone | Iron | Favor cost | Temps d’entraînement | Population | Attaque | Type d’attaque | Défense blunt | Défense sharp | Défense distance | Vitesse | Booty | Capacité transport | Notes |\n|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|---|\n| ${unit.name} | ${unitId} | ${unit.category} | ${unit.cost.ore} | ${unit.cost.stone} | ${unit.cost.iron} | ${unit.favorCost} | ${unit.trainingSeconds} | ${unit.populationCost} | ${unit.attack} | ${unit.attackType} | ${unit.defenseBlunt} | ${unit.defenseSharp} | ${unit.defenseDistance} | ${unit.speed} | ${unit.booty} | ${unit.transportCapacity} | ${unit.notes ?? '—'} |\n\n## 4. Rôle gameplay réel\n- ${unitRole(unit)}\n- Interprétation limitée au code: ${unit.notes ? `note config présente (\`${unit.notes}\`)` : 'aucune note spécifique'}; pas d’extrapolation hors runtime.\n\n## 5. Comment elle est réellement utilisée dans le code\n${runtimeNotesForUnit(unit).map((n) => n).join('\n')}\n\n## 6. Pré requis et dépendances liées\n- Bâtiment source: \`${unit.requiredBuildingId}\`\n- Recherche source: ${unit.requiredResearch ?? 'aucune'}\n- Interaction avec armament/barracks/space_dock/research_lab: ${unit.category === 'militia' ? 'milice dépend de housing_complex via activateMilitia; pas de queue barracks/space_dock.' : 'temps d’entraînement dépend de trainingSpeedPct dérivé (barracks + space_dock + armament_factory + recherches + politique).'}\n\n## 7. Cas spéciaux / edge cases\n- Unité avec \`attackType: ${unit.attackType}\`.\n- ${unit.category === 'militia' ? 'Milice: non transférable et non envoyable en attaque.' : unit.transportCapacity > 0 ? 'Transport: capacité configurée mais aucune mécanique de transport runtime implémentée.' : 'Aucun edge case supplémentaire détecté au runtime.'}\n- ${unit.id === 'colonization_convoy' ? 'Colonisation/conquête mentionnée en note, mais pas de flux runtime dédié trouvé.' : 'Colonisation: non concernée.'}\n\n## 8. Statut d’implémentation / zones d’attention\n- Config: présente dans CITY_ECONOMY_CONFIG.troops.\n- Branché runtime: ${unit.category === 'militia' ? 'partiel (activation spéciale uniquement)' : 'oui pour entraînement/stockage; non pour combat/déplacement/conquête/transport'}\n- Exposé au joueur: ${unit.category === 'militia' ? 'oui via panneau militia UI' : 'oui dans la liste training UI (si guard ok)'}\n- Divergence catalogue: ${catalog ? `catalog: phase=${catalog.phase}, gameplayImplemented=${catalog.gameplayImplemented}, definitionStatus=${catalog.definitionStatus}` : 'pas d’entrée dans FULL_UNIT_CATALOG'}\n\n## 9. Sources de vérité utilisées\n- src/game/city/economy/cityEconomyConfig.ts\n- src/game/city/economy/cityEconomySystem.ts\n- src/game/city/economy/cityContentCatalog.ts\n- src/game/render/modes/CityFoundationMode.ts (exposition UI)\n`;

    fs.writeFileSync(path.join(outDir, `${unitId}.md`), text);
    const branch = unit.category === 'ground' ? 'ground' : unit.category === 'naval' ? 'naval' : 'militia';
    readmeRows.push(`| ${unitId} | ${unit.name} | ${branch} | ${unitRole(unit)} | [voir](./${unitId}.md) |`);
  }

  const readme = `# Référence unités (runtime)\n\nDocumentation générée automatiquement depuis la config runtime et la logique exécutée.\n\n| ID | Nom affiché | Catégorie / branche | Rôle principal | Lien |\n|---|---|---|---|---|\n${readmeRows.join('\n')}\n\n## Régénération\n\n\`node scripts/generate-economy-reference-docs.mjs\`\n\n## Notes\n- Les unités documentées ici sont strictement celles de CITY_ECONOMY_CONFIG.troops.\n- Les entrées présentes uniquement dans le catalog mais absentes de la config runtime ne sont pas documentées ici.\n`;
  fs.writeFileSync(path.join(outDir, 'README.md'), readme);
}

writeBuildingDocs();
writeUnitDocs();
console.log('Generated docs/building and docs/units from runtime config.');
