import {
  BUILDING_ORDER_BY_BRANCH,
  CITY_ECONOMY_CONFIG,
  STANDARD_BUILDING_ORDER,
  type BuildingLevelBandPrerequisite,
  type BuildingLevelCost,
  type EconomyBuildingConfig,
  type EconomyBuildingId,
  type EconomyResource,
  type LocalPolicyId,
  type ResearchId,
  type ResourceBundle,
  type TroopId,
} from '@/game/city/economy/cityEconomyConfig';

export interface CityConstructionEntry {
  buildingId: EconomyBuildingId;
  targetLevel: number;
  startedAtMs: number;
  endsAtMs: number;
  costPaid: ResourceBundle;
  populationCostPaid: number;
}

export interface TroopTrainingEntry {
  troopId: TroopId;
  quantity: number;
  startedAtMs: number;
  endsAtMs: number;
  costPaid: ResourceBundle;
  populationReserved: number;
}

export interface ResearchQueueEntry {
  researchId: ResearchId;
  startedAtMs: number;
  endsAtMs: number;
  costPaid: ResourceBundle;
}

export interface IntelProjectEntry {
  id: string;
  projectType: 'sweep' | 'network' | 'cipher';
  startedAtMs: number;
  endsAtMs: number;
  readinessGain: number;
}

export interface EspionageMissionEntry {
  id: string;
  targetCityId: string;
  silverCommitted: number;
  startedAtMs: number;
  endsAtMs: number;
}

export interface EspionageReportEntry {
  id: string;
  createdAtMs: number;
  kind: 'attack_success' | 'attack_failed' | 'defense_failed_attempt' | 'mission_cancelled_target_missing';
  sourceCityId: string;
  targetCityId: string;
  silverSent: number;
  targetSilverAtResolution: number;
  defenderEffectiveSpyDefense: number;
  detectionPctAtResolution: number;
  counterIntelPctAtResolution: number;
  wasCryptographyApplied: boolean;
  wasSuccess: boolean;
  defenderSilverSpentOnDefense: number;
  intelSnapshot?: {
    resources: ResourceBundle;
    buildingLevels: Record<EconomyBuildingId, number>;
    troops: TroopCounts;
    defensiveBonuses: {
      cityDefensePct: number;
      antiAirDefensePct: number;
      detectionPct: number;
      counterIntelPct: number;
    };
  };
}

export type TroopCounts = Record<TroopId, number>;
export interface CityMilitiaState {
  isActive: boolean;
  activatedAtMs: number | null;
  expiresAtMs: number | null;
  currentMilitia: number;
  initialMilitia: number;
  productionPenaltyPct: number;
  sourceBuildingLevelSnapshot: number;
  bonusPerLevel: number;
}

export interface CityEconomyState {
  cityId: string;
  owner: string;
  levels: Record<EconomyBuildingId, number>;
  resources: ResourceBundle;
  queue: CityConstructionEntry[];
  troops: TroopCounts;
  trainingQueue: TroopTrainingEntry[];
  researchQueue: ResearchQueueEntry[];
  completedResearch: ResearchId[];
  activePolicy: LocalPolicyId | null;
  militia: CityMilitiaState;
  intelReadiness: number;
  intelProjects: IntelProjectEntry[];
  spyVaultSilver: number;
  espionageMissions: EspionageMissionEntry[];
  espionageReports: EspionageReportEntry[];
  lastUpdatedAtMs: number;
}

export interface GuardResult {
  ok: boolean;
  reason: string | null;
}

const ZERO_TROOPS: TroopCounts = {
  citizen_militia: 0,
  line_infantry: 0,
  phalanx_lanceguard: 0,
  rail_marksman: 0,
  assault_legionnaire: 0,
  aegis_shieldguard: 0,
  raider_hoverbike: 0,
  siege_breacher: 0,
  assault_dropship: 0,
  swift_carrier: 0,
  interceptor_sentinel: 0,
  ember_drifter: 0,
  rapid_escort: 0,
  bulwark_trireme: 0,
  colonization_arkship: 0,
};
const MILITIA_DURATION_MS = 3 * 60 * 60 * 1000;
const MILITIA_PENALTY_PCT = 50;
const MILITIA_BASE_PER_LEVEL = 10;
const MILITIA_BONUS_PER_LEVEL = 5;
const MILITIA_LEVEL_CAP = 25;
const MIN_SPY_SILVER = 1000;
const SENATE_BUILD_TIME_PCT_BY_LEVEL: Record<number, number> = {
  1: 100.0,
  2: 98.6,
  3: 97.0,
  4: 95.3,
  5: 93.5,
  6: 91.5,
  7: 89.5,
  8: 87.4,
  9: 85.3,
  10: 83.0,
  11: 80.8,
  12: 78.4,
  13: 76.1,
  14: 73.7,
  15: 71.2,
  16: 68.7,
  17: 66.1,
  18: 63.6,
  19: 60.9,
  20: 58.3,
  21: 55.6,
  22: 52.9,
  23: 50.1,
  24: 47.4,
  25: 44.5,
};

function getDefaultLevels(): Record<EconomyBuildingId, number> {
  return STANDARD_BUILDING_ORDER.reduce(
    (acc, id) => {
      acc[id] = id === 'hq' || id === 'mine' || id === 'quarry' || id === 'warehouse' || id === 'housing_complex' ? 1 : 0;
      return acc;
    },
    {} as Record<EconomyBuildingId, number>,
  );
}

export function createInitialCityEconomyState(input: { cityId: string; owner: string; nowMs?: number }): CityEconomyState {
  const baseCaps = CITY_ECONOMY_CONFIG.resources.baseStorageCap;
  const clampedStartingStock = {
    ore: Math.min(baseCaps.ore, Math.max(0, CITY_ECONOMY_CONFIG.resources.startingStock.ore)),
    stone: Math.min(baseCaps.stone, Math.max(0, CITY_ECONOMY_CONFIG.resources.startingStock.stone)),
    iron: Math.min(baseCaps.iron, Math.max(0, CITY_ECONOMY_CONFIG.resources.startingStock.iron)),
  };
  return {
    cityId: input.cityId,
    owner: input.owner,
    levels: getDefaultLevels(),
    resources: clampedStartingStock,
    queue: [],
    troops: { ...ZERO_TROOPS },
    trainingQueue: [],
    researchQueue: [],
    completedResearch: [],
    activePolicy: null,
    militia: {
      isActive: false,
      activatedAtMs: null,
      expiresAtMs: null,
      currentMilitia: 0,
      initialMilitia: 0,
      productionPenaltyPct: MILITIA_PENALTY_PCT,
      sourceBuildingLevelSnapshot: 0,
      bonusPerLevel: 0,
    },
    intelReadiness: 0,
    intelProjects: [],
    spyVaultSilver: 0,
    espionageMissions: [],
    espionageReports: [],
    lastUpdatedAtMs: input.nowMs ?? Date.now(),
  };
}

export function getBuildingConfig(buildingId: EconomyBuildingId): EconomyBuildingConfig {
  return CITY_ECONOMY_CONFIG.buildings[buildingId];
}

export function getBuildingLevel(state: CityEconomyState, buildingId: EconomyBuildingId) {
  return state.levels[buildingId] ?? 0;
}

function getCurrentLevelRow(state: CityEconomyState, buildingId: EconomyBuildingId): BuildingLevelCost | null {
  const level = getBuildingLevel(state, buildingId);
  if (level <= 0) return null;
  return getBuildingConfig(buildingId).levels[level - 1] ?? null;
}

export function isBuildingUnlocked(state: CityEconomyState, buildingId: EconomyBuildingId) {
  const currentLevel = getBuildingLevel(state, buildingId);
  return isBuildingUnlockedForTargetLevel(state, buildingId, currentLevel + 1);
}

function getBandPrerequisiteForTargetLevel(config: EconomyBuildingConfig, targetLevel: number): BuildingLevelBandPrerequisite | null {
  return config.levelBandPrerequisites?.find((band) => targetLevel >= band.minTargetLevel && targetLevel <= band.maxTargetLevel) ?? null;
}

function isBuildingUnlockedForTargetLevel(state: CityEconomyState, buildingId: EconomyBuildingId, targetLevel: number) {
  if (buildingId === 'hq') return true;
  const config = getBuildingConfig(buildingId);
  const hqRequirement = Math.max(config.unlockAtHq, getBandPrerequisiteForTargetLevel(config, targetLevel)?.minHqLevel ?? 0);
  if (getBuildingLevel(state, 'hq') < hqRequirement) return false;

  const prereqs = [...(config.prerequisites ?? []), ...(getBandPrerequisiteForTargetLevel(config, targetLevel)?.prerequisites ?? [])];
  return prereqs.every((req) => getBuildingLevel(state, req.buildingId) >= req.minLevel);
}

export function getUpgradeLevelCost(buildingId: EconomyBuildingId, targetLevel: number) {
  const config = getBuildingConfig(buildingId);
  const row = config.levels[targetLevel - 1];
  if (!row) {
    throw new Error(`Invalid target level ${targetLevel} for ${buildingId}`);
  }
  return row;
}

function getSenateBuildTimePct(level: number) {
  if (level <= 1) return SENATE_BUILD_TIME_PCT_BY_LEVEL[1];
  if (level >= 25) return SENATE_BUILD_TIME_PCT_BY_LEVEL[25];
  return SENATE_BUILD_TIME_PCT_BY_LEVEL[level] ?? SENATE_BUILD_TIME_PCT_BY_LEVEL[1];
}

export function getConstructionDurationSeconds(state: CityEconomyState, buildingId: EconomyBuildingId, targetLevel: number) {
  const levelCost = getUpgradeLevelCost(buildingId, targetLevel);
  const worldSpeed = CITY_ECONOMY_CONFIG.construction.worldSpeed;
  const derived = getCityDerivedStats(state);

  const hqLevel = getBuildingLevel(state, 'hq');
  const currentSenatePct = getSenateBuildTimePct(hqLevel);
  const referencePct = getSenateBuildTimePct(CITY_ECONOMY_CONFIG.construction.referenceSenateLevel);

  const senateMultiplier = buildingId === 'hq' ? 1 : currentSenatePct / referencePct;
  const policyMultiplier = Math.max(0.4, 1 - derived.buildSpeedPct / 100);
  const worldMultiplier = 1 / Math.max(1, worldSpeed);
  return Math.ceil(levelCost.buildSeconds * senateMultiplier * policyMultiplier * worldMultiplier);
}

export function getConstructionCostResources(state: CityEconomyState, buildingId: EconomyBuildingId, targetLevel: number): ResourceBundle {
  const levelCost = getUpgradeLevelCost(buildingId, targetLevel);
  const derived = getCityDerivedStats(state);
  const reductionPct = Math.max(0, Math.min(90, derived.buildCostReductionPct ?? 0));
  const multiplier = 1 - reductionPct / 100;
  return {
    ore: Math.ceil(levelCost.resources.ore * multiplier),
    stone: Math.ceil(levelCost.resources.stone * multiplier),
    iron: Math.ceil(levelCost.resources.iron * multiplier),
  };
}

export function getStorageCaps(state: CityEconomyState): ResourceBundle {
  const warehouse = getCurrentLevelRow(state, 'warehouse');
  return warehouse?.effect.storageCap ?? CITY_ECONOMY_CONFIG.resources.baseStorageCap;
}

function getBuildingPopulationUsage(state: CityEconomyState) {
  return STANDARD_BUILDING_ORDER.reduce((sum, buildingId) => {
    const currentRow = getCurrentLevelRow(state, buildingId);
    return sum + (currentRow?.populationCost ?? 0);
  }, 0);
}

function getTroopPopulationUsage(state: CityEconomyState) {
  return (Object.keys(CITY_ECONOMY_CONFIG.troops) as TroopId[]).reduce((sum, troopId) => {
    const cfg = CITY_ECONOMY_CONFIG.troops[troopId];
    if (cfg.category === 'militia') return sum;
    return sum + state.troops[troopId] * cfg.populationCost;
  }, 0);
}

function getTrainingReservedPopulation(state: CityEconomyState) {
  return state.trainingQueue.reduce((sum, entry) => sum + entry.populationReserved, 0);
}

export function getPopulationSnapshot(state: CityEconomyState) {
  const housing = getCurrentLevelRow(state, 'housing_complex');
  const populationCap = CITY_ECONOMY_CONFIG.population.baseCap + (housing?.effect.populationCapBonus ?? 0);

  const buildingUsed = getBuildingPopulationUsage(state);
  const troopUsed = getTroopPopulationUsage(state);
  const trainingReserved = getTrainingReservedPopulation(state);
  const used = buildingUsed + troopUsed + trainingReserved;

  return {
    used,
    cap: populationCap,
    free: Math.max(0, populationCap - used),
    breakdown: {
      buildingUsed,
      troopUsed,
      trainingReserved,
    },
  };
}

function getResearchEffectTotals(state: CityEconomyState) {
  return state.completedResearch.reduce(
    (acc, researchId) => {
      const effect = CITY_ECONOMY_CONFIG.research[researchId]?.effect;
      if (!effect) return acc;
      acc.productionPct += effect.productionPct ?? 0;
      acc.trainingSpeedPct += effect.trainingSpeedPct ?? 0;
      acc.defensePct += effect.defensePct ?? 0;
      acc.antiAirDefensePct += effect.antiAirDefensePct ?? 0;
      acc.marketEfficiencyPct += effect.marketEfficiencyPct ?? 0;
      acc.detectionPct += effect.detectionPct ?? 0;
      acc.counterIntelPct += effect.counterIntelPct ?? 0;
      return acc;
    },
    { productionPct: 0, trainingSpeedPct: 0, defensePct: 0, antiAirDefensePct: 0, marketEfficiencyPct: 0, detectionPct: 0, counterIntelPct: 0 },
  );
}

function getResearchPointsCapacity(state: CityEconomyState) {
  // Grepolis rule: 4 points per Academy level (Coinage: research_lab as Academy equivalent).
  return getBuildingLevel(state, 'research_lab') * 4;
}

function getResearchPointsSpent(state: CityEconomyState) {
  return state.completedResearch.reduce((sum, researchId) => sum + CITY_ECONOMY_CONFIG.research[researchId].researchPointsCost, 0);
}

function getPolicyEffect(state: CityEconomyState) {
  if (!state.activePolicy) return null;
  return CITY_ECONOMY_CONFIG.policies[state.activePolicy]?.effect ?? null;
}

export function getCityDerivedStats(state: CityEconomyState) {
  const armament = getCurrentLevelRow(state, 'armament_factory');
  const market = getCurrentLevelRow(state, 'market');
  const council = getCurrentLevelRow(state, 'council_chamber');
  const barracks = getCurrentLevelRow(state, 'barracks');
  const dock = getCurrentLevelRow(state, 'space_dock');
  const intelCenter = getCurrentLevelRow(state, 'intelligence_center');
  const lab = getCurrentLevelRow(state, 'research_lab');

  const research = getResearchEffectTotals(state);
  const policy = getPolicyEffect(state);

  const trainingSpeedPct =
    (barracks?.effect.trainingSpeedPct ?? 0) +
    (dock?.effect.trainingSpeedPct ?? 0) +
    research.trainingSpeedPct +
    (policy?.trainingSpeedPct ?? 0);

  const cityDefensePct =
    (council?.effect.cityDefensePct ?? 0) +
    research.defensePct +
    (policy?.defensePct ?? 0);

  return {
    trainingSpeedPct,
    groundAttackPct: armament?.effect.groundAttackPct ?? 0,
    groundDefensePct: armament?.effect.groundDefensePct ?? 0,
    airAttackPct: armament?.effect.airAttackPct ?? 0,
    airDefensePct: armament?.effect.airDefensePct ?? 0,
    cityDefensePct,
    damageMitigationPct: 0,
    siegeResistancePct: 0,
    antiAirDefensePct: research.antiAirDefensePct,
    detectionPct:
      (intelCenter?.effect.detectionPct ?? 0) + research.detectionPct + (policy?.detectionPct ?? 0),
    counterIntelPct: (intelCenter?.effect.counterIntelPct ?? 0) + research.counterIntelPct,
    researchCapacity: lab?.effect.researchCapacity ?? 0,
    marketEfficiencyPct: (market?.effect.marketEfficiencyPct ?? 0) + research.marketEfficiencyPct,
    buildCostReductionPct: 0,
    buildSpeedPct: council?.effect.buildSpeedPct ?? 0,
    productionPct: research.productionPct + (policy?.productionPct ?? 0),
    intelReadiness: state.intelReadiness,
  };
}

export function getDefenderEffectiveSpyDefense(state: CityEconomyState) {
  const derived = getCityDerivedStats(state);
  const baseSilverDefense = Math.max(0, state.spyVaultSilver);
  const intelligenceMultiplier = 1 + Math.max(0, derived.detectionPct + derived.counterIntelPct) / 100;
  return Math.floor(baseSilverDefense * intelligenceMultiplier);
}

export function evaluateEspionageOutcome(attackerSilverSent: number, defenderState: CityEconomyState) {
  const derived = getCityDerivedStats(defenderState);
  const defenderEffectiveSpyDefense = getDefenderEffectiveSpyDefense(defenderState);
  return {
    wasSuccess: attackerSilverSent > defenderEffectiveSpyDefense,
    defenderEffectiveSpyDefense,
    detectionPctAtResolution: derived.detectionPct,
    counterIntelPctAtResolution: derived.counterIntelPct,
    wasCryptographyApplied: defenderState.completedResearch.includes('cryptography'),
  };
}

export function getDefensiveWallGroundBonuses(state: CityEconomyState) {
  const wall = getCurrentLevelRow(state, 'defensive_wall');
  return {
    groundWallDefensePct: wall?.effect.groundWallDefensePct ?? 0,
    groundWallBaseDefense: wall?.effect.groundWallBaseDefense ?? 0,
  };
}

export function getGroundDefenseStatsWithWall(
  state: CityEconomyState,
  troopId: TroopId,
  context: 'city_defense' | 'offense' = 'city_defense',
) {
  const troop = CITY_ECONOMY_CONFIG.troops[troopId];
  if (troop.category !== 'ground') return null;

  const appliesWallBonus = context === 'city_defense' && troop.requiredBuildingId === 'barracks';
  const wallBonuses = appliesWallBonus
    ? getDefensiveWallGroundBonuses(state)
    : { groundWallDefensePct: 0, groundWallBaseDefense: 0 };

  const multiplier = 1 + wallBonuses.groundWallDefensePct / 100;
  const apply = (value: number) => (value + wallBonuses.groundWallBaseDefense) * multiplier;

  return {
    troopId,
    context,
    appliesWallBonus,
    base: {
      defenseBlunt: troop.defenseBlunt,
      defenseSharp: troop.defenseSharp,
      defenseDistance: troop.defenseDistance,
    },
    modified: {
      defenseBlunt: apply(troop.defenseBlunt),
      defenseSharp: apply(troop.defenseSharp),
      defenseDistance: apply(troop.defenseDistance),
    },
    wall: wallBonuses,
  };
}

export function getSkyshieldBatteryAirBonuses(state: CityEconomyState) {
  const tower = getCurrentLevelRow(state, 'skyshield_battery');
  return {
    airWallDefensePct: tower?.effect.airWallDefensePct ?? 0,
    airWallBaseDefense: tower?.effect.airWallBaseDefense ?? 0,
  };
}

export function getAirDefenseStatsWithBattery(
  state: CityEconomyState,
  troopId: TroopId,
  context: 'city_defense' | 'offense' = 'city_defense',
) {
  const troop = CITY_ECONOMY_CONFIG.troops[troopId];
  if (troop.category !== 'naval') return null;

  const appliesTowerBonus = context === 'city_defense' && troop.requiredBuildingId === 'space_dock';
  const towerBonuses = appliesTowerBonus
    ? getSkyshieldBatteryAirBonuses(state)
    : { airWallDefensePct: 0, airWallBaseDefense: 0 };

  const baseDefense = troop.navalDefense ?? 0;
  const multiplier = 1 + towerBonuses.airWallDefensePct / 100;
  const modifiedDefense = (baseDefense + towerBonuses.airWallBaseDefense) * multiplier;

  return {
    troopId,
    context,
    appliesTowerBonus,
    baseAirDefense: baseDefense,
    modifiedAirDefense: modifiedDefense,
    tower: towerBonuses,
  };
}

export function getProductionPerHour(state: CityEconomyState): ResourceBundle {
  const holdingMultiplier = CITY_ECONOMY_CONFIG.holdingMultiplier;
  const mine = getCurrentLevelRow(state, 'mine');
  const quarry = getCurrentLevelRow(state, 'quarry');
  const refinery = getCurrentLevelRow(state, 'refinery');
  const derived = getCityDerivedStats(state);
  const productionMultiplier = 1 + derived.productionPct / 100;

  const penaltyMultiplier = getMilitiaProductionMultiplier(state);
  return {
    ore: (mine?.effect.orePerHour ?? 0) * holdingMultiplier * productionMultiplier * penaltyMultiplier,
    stone: (quarry?.effect.stonePerHour ?? 0) * holdingMultiplier * productionMultiplier * penaltyMultiplier,
    iron: (refinery?.effect.ironPerHour ?? 0) * holdingMultiplier * productionMultiplier * penaltyMultiplier,
  };
}

export function applyClaimOnAccess(state: CityEconomyState, nowMs = Date.now()) {
  if (nowMs <= state.lastUpdatedAtMs) return;

  const elapsedHours = (nowMs - state.lastUpdatedAtMs) / (1000 * 60 * 60);
  const holdingMultiplier = CITY_ECONOMY_CONFIG.holdingMultiplier;
  const mine = getCurrentLevelRow(state, 'mine');
  const quarry = getCurrentLevelRow(state, 'quarry');
  const refinery = getCurrentLevelRow(state, 'refinery');
  const derived = getCityDerivedStats(state);
  const productionMultiplier = 1 + derived.productionPct / 100;
  const baseProd = {
    ore: (mine?.effect.orePerHour ?? 0) * holdingMultiplier * productionMultiplier,
    stone: (quarry?.effect.stonePerHour ?? 0) * holdingMultiplier * productionMultiplier,
    iron: (refinery?.effect.ironPerHour ?? 0) * holdingMultiplier * productionMultiplier,
  };
  const effectiveHours = getEffectiveProductionHours(state, state.lastUpdatedAtMs, nowMs, elapsedHours);
  const caps = getStorageCaps(state);

  (['ore', 'stone', 'iron'] as EconomyResource[]).forEach((resource) => {
    const next = state.resources[resource] + baseProd[resource] * effectiveHours;
    state.resources[resource] = Math.min(caps[resource], next);
  });

  state.lastUpdatedAtMs = nowMs;
}

export function getMilitiaFarmEquivalentLevel(state: CityEconomyState) {
  return getBuildingLevel(state, 'housing_complex');
}

export function getMilitiaBonusPerLevel(state: CityEconomyState) {
  return state.completedResearch.includes('city_guard') ? MILITIA_BONUS_PER_LEVEL : 0;
}

export function getMilitiaMaxSize(state: CityEconomyState) {
  const level = Math.min(MILITIA_LEVEL_CAP, getMilitiaFarmEquivalentLevel(state));
  return level * (MILITIA_BASE_PER_LEVEL + getMilitiaBonusPerLevel(state));
}

export function isMilitiaActive(state: CityEconomyState, nowMs = Date.now()) {
  return Boolean(state.militia.isActive && state.militia.expiresAtMs && state.militia.expiresAtMs > nowMs && state.militia.currentMilitia > 0);
}

export function getMilitiaProductionMultiplier(state: CityEconomyState, nowMs = Date.now()) {
  return isMilitiaActive(state, nowMs) ? 1 - state.militia.productionPenaltyPct / 100 : 1;
}

function getEffectiveProductionHours(state: CityEconomyState, startMs: number, endMs: number, fallbackHours: number) {
  const activatedAt = state.militia.activatedAtMs;
  const expiresAt = state.militia.expiresAtMs;
  if (!activatedAt || !expiresAt || state.militia.productionPenaltyPct <= 0) return fallbackHours;

  const overlapMs = Math.max(0, Math.min(endMs, expiresAt) - Math.max(startMs, activatedAt));
  if (overlapMs <= 0) return fallbackHours;
  const totalMs = Math.max(0, endMs - startMs);
  if (totalMs <= 0) return 0;

  const overlapHours = overlapMs / (1000 * 60 * 60);
  return fallbackHours - overlapHours * (state.militia.productionPenaltyPct / 100);
}

export function activateMilitia(state: CityEconomyState, nowMs = Date.now()): GuardResult {
  resolveMilitiaExpiration(state, nowMs);
  if (isMilitiaActive(state, nowMs)) {
    return { ok: false, reason: 'Militia already active' };
  }
  const sourceLevel = getMilitiaFarmEquivalentLevel(state);
  if (sourceLevel <= 0) {
    return { ok: false, reason: 'Requires housing_complex 1' };
  }

  const maxMilitia = getMilitiaMaxSize(state);
  state.militia = {
    isActive: true,
    activatedAtMs: nowMs,
    expiresAtMs: nowMs + MILITIA_DURATION_MS,
    currentMilitia: maxMilitia,
    initialMilitia: maxMilitia,
    productionPenaltyPct: MILITIA_PENALTY_PCT,
    sourceBuildingLevelSnapshot: Math.min(MILITIA_LEVEL_CAP, sourceLevel),
    bonusPerLevel: getMilitiaBonusPerLevel(state),
  };
  return { ok: true, reason: null };
}

export function applyMilitiaDefensiveLosses(state: CityEconomyState, losses: number, nowMs = Date.now()) {
  resolveMilitiaExpiration(state, nowMs);
  if (!isMilitiaActive(state, nowMs)) return 0;
  const clampedLosses = Math.max(0, Math.floor(losses));
  const applied = Math.min(clampedLosses, state.militia.currentMilitia);
  state.militia.currentMilitia -= applied;
  if (state.militia.currentMilitia <= 0) {
    state.militia.currentMilitia = 0;
  }
  return applied;
}

export function resolveMilitiaExpiration(state: CityEconomyState, nowMs = Date.now()) {
  if (!state.militia.isActive) return false;
  if (!state.militia.expiresAtMs || state.militia.expiresAtMs > nowMs) return false;
  state.militia = {
    isActive: false,
    activatedAtMs: null,
    expiresAtMs: null,
    currentMilitia: 0,
    initialMilitia: 0,
    productionPenaltyPct: MILITIA_PENALTY_PCT,
    sourceBuildingLevelSnapshot: 0,
    bonusPerLevel: 0,
  };
  return true;
}

export function canSendMilitiaOnAttack() {
  return false;
}

export function canTransferMilitia() {
  return false;
}

export function canStartConstruction(state: CityEconomyState, buildingId: EconomyBuildingId): GuardResult {
  const config = getBuildingConfig(buildingId);
  const currentLevel = getBuildingLevel(state, buildingId);
  const targetLevel = currentLevel + 1;

  const band = getBandPrerequisiteForTargetLevel(config, targetLevel);
  const hqRequirement = Math.max(config.unlockAtHq, band?.minHqLevel ?? 0);
  if (!isBuildingUnlockedForTargetLevel(state, buildingId, targetLevel)) {
    if (getBuildingLevel(state, 'hq') < hqRequirement) {
      return { ok: false, reason: `Requires HQ ${hqRequirement}` };
    }
    const prereq = [...(config.prerequisites ?? []), ...(band?.prerequisites ?? [])].find(
      (req) => getBuildingLevel(state, req.buildingId) < req.minLevel,
    );
    if (prereq) return { ok: false, reason: `Requires ${prereq.buildingId} ${prereq.minLevel}` };
    return { ok: false, reason: 'Locked' };
  }

  if (targetLevel > config.maxLevel) {
    return { ok: false, reason: 'Max level' };
  }

  if (state.queue.length >= CITY_ECONOMY_CONFIG.queueSlots) {
    return { ok: false, reason: `Queue full (${CITY_ECONOMY_CONFIG.queueSlots}/${CITY_ECONOMY_CONFIG.queueSlots})` };
  }

  if (state.queue.some((entry) => entry.buildingId === buildingId)) {
    return { ok: false, reason: 'Already queued' };
  }

  const levelCost = getUpgradeLevelCost(buildingId, targetLevel);
  const adjustedCost = getConstructionCostResources(state, buildingId, targetLevel);

  const canAfford =
    state.resources.ore >= adjustedCost.ore && state.resources.stone >= adjustedCost.stone && state.resources.iron >= adjustedCost.iron;

  if (!canAfford) {
    return { ok: false, reason: 'Not enough resources' };
  }

  const currentLevelCost = currentLevel > 0 ? getUpgradeLevelCost(buildingId, currentLevel).populationCost : 0;
  const requiredPopulation = Math.max(0, levelCost.populationCost - currentLevelCost);
  const population = getPopulationSnapshot(state);
  if (requiredPopulation > population.free) {
    return { ok: false, reason: 'Not enough population' };
  }

  return { ok: true, reason: null };
}

export function startConstruction(state: CityEconomyState, buildingId: EconomyBuildingId, nowMs = Date.now()): GuardResult {
  const guard = canStartConstruction(state, buildingId);
  if (!guard.ok) return guard;

  const currentLevel = getBuildingLevel(state, buildingId);
  const targetLevel = currentLevel + 1;
  const levelCost = getUpgradeLevelCost(buildingId, targetLevel);
  const adjustedCost = getConstructionCostResources(state, buildingId, targetLevel);

  state.resources.ore = Math.max(0, state.resources.ore - adjustedCost.ore);
  state.resources.stone = Math.max(0, state.resources.stone - adjustedCost.stone);
  state.resources.iron = Math.max(0, state.resources.iron - adjustedCost.iron);

  const durationSeconds = getConstructionDurationSeconds(state, buildingId, targetLevel);

  state.queue.push({
    buildingId,
    targetLevel,
    startedAtMs: nowMs,
    endsAtMs: nowMs + durationSeconds * 1000,
    costPaid: adjustedCost,
    populationCostPaid: Math.max(0, levelCost.populationCost - (currentLevel > 0 ? getUpgradeLevelCost(buildingId, currentLevel).populationCost : 0)),
  });

  return { ok: true, reason: null };
}

export function resolveCompletedConstruction(state: CityEconomyState, nowMs = Date.now()) {
  let changed = false;
  const nextQueue: CityConstructionEntry[] = [];

  state.queue.forEach((entry) => {
    if (entry.endsAtMs > nowMs) {
      nextQueue.push(entry);
      return;
    }
    state.levels[entry.buildingId] = entry.targetLevel;
    changed = true;
  });

  state.queue = nextQueue;
  return changed;
}

export function canStartTroopTraining(state: CityEconomyState, troopId: TroopId, quantity: number): GuardResult {
  if (quantity <= 0 || !Number.isInteger(quantity)) {
    return { ok: false, reason: 'Invalid quantity' };
  }

  const troop = CITY_ECONOMY_CONFIG.troops[troopId];
  if (!troop) {
    return { ok: false, reason: 'Unknown troop' };
  }
  if (troop.category === 'militia') {
    return { ok: false, reason: 'Militia cannot be trained in barracks/harbor queues' };
  }

  if (getBuildingLevel(state, troop.requiredBuildingId) < troop.requiredBuildingLevel) {
    return { ok: false, reason: `Requires ${troop.requiredBuildingId} ${troop.requiredBuildingLevel}` };
  }
  if (CITY_ECONOMY_CONFIG.troopResearchEnforcementEnabled && troop.requiredResearch && !state.completedResearch.includes(troop.requiredResearch)) {
    return { ok: false, reason: `Requires research ${troop.requiredResearch}` };
  }

  const totalCost = {
    ore: troop.cost.ore * quantity,
    stone: troop.cost.stone * quantity,
    iron: troop.cost.iron * quantity,
  };

  const canAfford =
    state.resources.ore >= totalCost.ore && state.resources.stone >= totalCost.stone && state.resources.iron >= totalCost.iron;
  if (!canAfford) {
    return { ok: false, reason: 'Not enough resources' };
  }

  const population = getPopulationSnapshot(state);
  const requiredPop = troop.populationCost * quantity;
  if (requiredPop > population.free) {
    return { ok: false, reason: 'Not enough population' };
  }

  return { ok: true, reason: null };
}

export function startTroopTraining(state: CityEconomyState, troopId: TroopId, quantity: number, nowMs = Date.now()): GuardResult {
  const guard = canStartTroopTraining(state, troopId, quantity);
  if (!guard.ok) return guard;

  const troop = CITY_ECONOMY_CONFIG.troops[troopId];
  const totalCost = {
    ore: troop.cost.ore * quantity,
    stone: troop.cost.stone * quantity,
    iron: troop.cost.iron * quantity,
  };
  const derived = getCityDerivedStats(state);
  const trainingMultiplier = Math.max(0.35, 1 - derived.trainingSpeedPct / 100);

  state.resources.ore = Math.max(0, state.resources.ore - totalCost.ore);
  state.resources.stone = Math.max(0, state.resources.stone - totalCost.stone);
  state.resources.iron = Math.max(0, state.resources.iron - totalCost.iron);

  state.trainingQueue.push({
    troopId,
    quantity,
    startedAtMs: nowMs,
    endsAtMs: nowMs + Math.ceil(troop.trainingSeconds * quantity * trainingMultiplier) * 1000,
    costPaid: totalCost,
    populationReserved: troop.populationCost * quantity,
  });

  return { ok: true, reason: null };
}

export function resolveCompletedTraining(state: CityEconomyState, nowMs = Date.now()) {
  let changed = false;
  const nextQueue: TroopTrainingEntry[] = [];

  state.trainingQueue.forEach((entry) => {
    if (entry.endsAtMs > nowMs) {
      nextQueue.push(entry);
      return;
    }

    state.troops[entry.troopId] += entry.quantity;
    changed = true;
  });

  state.trainingQueue = nextQueue;
  return changed;
}

export function canStartResearch(state: CityEconomyState, researchId: ResearchId): GuardResult {
  if (state.completedResearch.includes(researchId)) return { ok: false, reason: 'Already researched' };
  if (getBuildingLevel(state, 'research_lab') < CITY_ECONOMY_CONFIG.research[researchId].requiredBuildingLevel) {
    return { ok: false, reason: `Requires research_lab ${CITY_ECONOMY_CONFIG.research[researchId].requiredBuildingLevel}` };
  }
  const capacity = getResearchPointsCapacity(state);
  const spent = getResearchPointsSpent(state);
  const nextCost = CITY_ECONOMY_CONFIG.research[researchId].researchPointsCost;
  if (spent + nextCost > capacity) return { ok: false, reason: 'Not enough research points' };
  const cost = CITY_ECONOMY_CONFIG.research[researchId].cost;
  if (state.resources.ore < cost.ore || state.resources.stone < cost.stone || state.resources.iron < cost.iron) {
    return { ok: false, reason: 'Not enough resources' };
  }
  return { ok: true, reason: null };
}

export function startResearch(state: CityEconomyState, researchId: ResearchId, nowMs = Date.now()): GuardResult {
  void nowMs;
  const guard = canStartResearch(state, researchId);
  if (!guard.ok) return guard;
  const cfg = CITY_ECONOMY_CONFIG.research[researchId];
  state.resources.ore -= cfg.cost.ore;
  state.resources.stone -= cfg.cost.stone;
  state.resources.iron -= cfg.cost.iron;
  state.completedResearch.push(researchId);
  return { ok: true, reason: null };
}

export function resolveCompletedResearch(state: CityEconomyState, nowMs = Date.now()) {
  void state;
  void nowMs;
  return false;
}

export function canSetPolicy(state: CityEconomyState, policyId: LocalPolicyId): GuardResult {
  const policy = CITY_ECONOMY_CONFIG.policies[policyId];
  if (!policy) return { ok: false, reason: 'Unknown policy' };
  if (getBuildingLevel(state, 'council_chamber') < policy.requiredCouncilLevel) {
    return { ok: false, reason: `Requires council_chamber ${policy.requiredCouncilLevel}` };
  }
  return { ok: true, reason: null };
}

export function setActivePolicy(state: CityEconomyState, policyId: LocalPolicyId): GuardResult {
  const guard = canSetPolicy(state, policyId);
  if (!guard.ok) return guard;
  state.activePolicy = policyId;
  return { ok: true, reason: null };
}

export function canStartIntelProject(state: CityEconomyState): GuardResult {
  if (getBuildingLevel(state, 'intelligence_center') <= 0) return { ok: false, reason: 'Requires intelligence_center 1' };
  if (state.intelProjects.length >= 1) return { ok: false, reason: 'Intel project busy' };
  return { ok: true, reason: null };
}

export function getSpyVaultCap(state: CityEconomyState) {
  const level = getBuildingLevel(state, 'intelligence_center');
  if (level >= 10) return Number.POSITIVE_INFINITY;
  return Math.max(0, level * 1000);
}

export function getSpySilverCommittedInTransit(state: CityEconomyState) {
  return state.espionageMissions.reduce((sum, mission) => sum + mission.silverCommitted, 0);
}

export function canDepositSpySilver(state: CityEconomyState, amount: number): GuardResult {
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, reason: 'Invalid silver amount' };
  if (getBuildingLevel(state, 'intelligence_center') <= 0) return { ok: false, reason: 'Requires intelligence_center 1' };
  if (state.espionageMissions.length > 0) return { ok: false, reason: 'Cannot refill vault while mission is active' };
  if (state.resources.iron < amount) return { ok: false, reason: 'Not enough iron' };

  const next = state.spyVaultSilver + amount;
  const cap = getSpyVaultCap(state);
  if (Number.isFinite(cap) && next + getSpySilverCommittedInTransit(state) > cap) {
    return { ok: false, reason: 'Vault capacity reached' };
  }
  return { ok: true, reason: null };
}

export function depositSpySilver(state: CityEconomyState, amount: number): GuardResult {
  const guard = canDepositSpySilver(state, amount);
  if (!guard.ok) return guard;
  const rounded = Math.floor(amount);
  state.resources.iron = Math.max(0, state.resources.iron - rounded);
  state.spyVaultSilver += rounded;
  return { ok: true, reason: null };
}

export function canStartEspionageMission(
  state: CityEconomyState,
  targetCityId: string,
  silverToCommit: number,
): GuardResult {
  if (!targetCityId) return { ok: false, reason: 'Target city required' };
  if (targetCityId === state.cityId) return { ok: false, reason: 'Cannot target own city' };
  if (getBuildingLevel(state, 'intelligence_center') <= 0) return { ok: false, reason: 'Requires intelligence_center 1' };
  if (state.espionageMissions.length > 0) return { ok: false, reason: 'Spy is already on mission' };
  if (!Number.isFinite(silverToCommit) || silverToCommit < MIN_SPY_SILVER) return { ok: false, reason: 'Minimum 1000 silver required' };
  if (state.spyVaultSilver < silverToCommit) return { ok: false, reason: 'Not enough vault silver' };
  return { ok: true, reason: null };
}

export function startEspionageMission(
  state: CityEconomyState,
  targetCityId: string,
  silverToCommit: number,
  nowMs = Date.now(),
  travelMs = 15 * 60 * 1000,
): GuardResult {
  const guard = canStartEspionageMission(state, targetCityId, silverToCommit);
  if (!guard.ok) return guard;
  const rounded = Math.floor(silverToCommit);
  state.spyVaultSilver -= rounded;
  state.espionageMissions.push({
    id: `esp-${state.cityId}-${targetCityId}-${nowMs}`,
    targetCityId,
    silverCommitted: rounded,
    startedAtMs: nowMs,
    endsAtMs: nowMs + travelMs,
  });
  return { ok: true, reason: null };
}

export function startIntelProject(
  state: CityEconomyState,
  projectType: IntelProjectEntry['projectType'],
  nowMs = Date.now(),
): GuardResult {
  const guard = canStartIntelProject(state);
  if (!guard.ok) return guard;

  const durationSeconds = projectType === 'sweep' ? 70 : projectType === 'network' ? 120 : 160;
  const readinessGain = projectType === 'sweep' ? 8 : projectType === 'network' ? 14 : 20;
  state.intelProjects.push({
    id: `${projectType}-${nowMs}`,
    projectType,
    startedAtMs: nowMs,
    endsAtMs: nowMs + durationSeconds * 1000,
    readinessGain,
  });
  return { ok: true, reason: null };
}

export function resolveCompletedIntelProjects(state: CityEconomyState, nowMs = Date.now()) {
  let changed = false;
  const next: IntelProjectEntry[] = [];
  state.intelProjects.forEach((entry) => {
    if (entry.endsAtMs > nowMs) {
      next.push(entry);
      return;
    }
    state.intelReadiness = Math.min(100, state.intelReadiness + entry.readinessGain);
    changed = true;
  });
  state.intelProjects = next;
  return changed;
}

export function getConstructionQueueSlots() {
  return CITY_ECONOMY_CONFIG.queueSlots;
}

export function getEconomyBuildingOrder() {
  return STANDARD_BUILDING_ORDER;
}

export function getMilitaryBuildingOrder() {
  return BUILDING_ORDER_BY_BRANCH.military;
}
