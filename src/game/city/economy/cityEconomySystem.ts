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

export type TroopCounts = Record<TroopId, number>;

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
  intelReadiness: number;
  intelProjects: IntelProjectEntry[];
  lastUpdatedAtMs: number;
}

export interface GuardResult {
  ok: boolean;
  reason: string | null;
}

const ZERO_TROOPS: TroopCounts = {
  infantry: 0,
  shield_guard: 0,
  marksman: 0,
  raider_cavalry: 0,
  assault: 0,
  breacher: 0,
  interception_sentinel: 0,
  rapid_escort: 0,
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
  return {
    cityId: input.cityId,
    owner: input.owner,
    levels: getDefaultLevels(),
    resources: { ...CITY_ECONOMY_CONFIG.resources.startingStock },
    queue: [],
    troops: { ...ZERO_TROOPS },
    trainingQueue: [],
    researchQueue: [],
    completedResearch: [],
    activePolicy: null,
    intelReadiness: 0,
    intelProjects: [],
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

export function getStorageCaps(state: CityEconomyState): ResourceBundle {
  const warehouse = getCurrentLevelRow(state, 'warehouse');
  return warehouse?.effect.storageCap ?? CITY_ECONOMY_CONFIG.resources.baseStorageCap;
}

function getBuildingPopulationUsage(state: CityEconomyState) {
  return STANDARD_BUILDING_ORDER.reduce((sum, buildingId) => {
    const level = getBuildingLevel(state, buildingId);
    if (level <= 0) return sum;

    const rows = getBuildingConfig(buildingId).levels.slice(0, level);
    return sum + rows.reduce((buildingTotal, row) => buildingTotal + row.populationCost, 0);
  }, 0);
}

function getTroopPopulationUsage(state: CityEconomyState) {
  return (Object.keys(CITY_ECONOMY_CONFIG.troops) as TroopId[]).reduce((sum, troopId) => {
    const cfg = CITY_ECONOMY_CONFIG.troops[troopId];
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
      acc.marketEfficiencyPct += effect.marketEfficiencyPct ?? 0;
      acc.detectionPct += effect.detectionPct ?? 0;
      acc.counterIntelPct += effect.counterIntelPct ?? 0;
      return acc;
    },
    { productionPct: 0, trainingSpeedPct: 0, defensePct: 0, marketEfficiencyPct: 0, detectionPct: 0, counterIntelPct: 0 },
  );
}

function getPolicyEffect(state: CityEconomyState) {
  if (!state.activePolicy) return null;
  return CITY_ECONOMY_CONFIG.policies[state.activePolicy]?.effect ?? null;
}

export function getCityDerivedStats(state: CityEconomyState) {
  const wall = getCurrentLevelRow(state, 'defensive_wall');
  const tower = getCurrentLevelRow(state, 'watch_tower');
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
    (armament?.effect.trainingSpeedPct ?? 0) +
    research.trainingSpeedPct +
    (policy?.trainingSpeedPct ?? 0);

  const cityDefensePct =
    (wall?.effect.cityDefensePct ?? 0) +
    (tower?.effect.cityDefensePct ?? 0) +
    (council?.effect.cityDefensePct ?? 0) +
    research.defensePct +
    (policy?.defensePct ?? 0);

  return {
    trainingSpeedPct,
    troopCombatPowerPct: armament?.effect.troopCombatPowerPct ?? 0,
    troopUpkeepEfficiencyPct: armament?.effect.troopUpkeepEfficiencyPct ?? 0,
    cityDefensePct,
    damageMitigationPct: wall?.effect.damageMitigationPct ?? 0,
    siegeResistancePct: wall?.effect.siegeResistancePct ?? 0,
    detectionPct:
      (tower?.effect.detectionPct ?? 0) +
      (intelCenter?.effect.detectionPct ?? 0) +
      research.detectionPct +
      (policy?.detectionPct ?? 0),
    counterIntelPct: (tower?.effect.counterIntelPct ?? 0) + (intelCenter?.effect.counterIntelPct ?? 0) + research.counterIntelPct,
    researchCapacity: lab?.effect.researchCapacity ?? 0,
    marketEfficiencyPct: (market?.effect.marketEfficiencyPct ?? 0) + research.marketEfficiencyPct,
    buildCostReductionPct: market?.effect.buildCostReductionPct ?? 0,
    buildSpeedPct: council?.effect.buildSpeedPct ?? 0,
    productionPct: research.productionPct + (policy?.productionPct ?? 0),
    intelReadiness: state.intelReadiness,
  };
}

export function getProductionPerHour(state: CityEconomyState): ResourceBundle {
  const holdingMultiplier = CITY_ECONOMY_CONFIG.holdingMultiplier;
  const mine = getCurrentLevelRow(state, 'mine');
  const quarry = getCurrentLevelRow(state, 'quarry');
  const refinery = getCurrentLevelRow(state, 'refinery');
  const derived = getCityDerivedStats(state);
  const productionMultiplier = 1 + derived.productionPct / 100;

  return {
    ore: (mine?.effect.orePerHour ?? 0) * holdingMultiplier * productionMultiplier,
    stone: (quarry?.effect.stonePerHour ?? 0) * holdingMultiplier * productionMultiplier,
    iron: (refinery?.effect.ironPerHour ?? 0) * holdingMultiplier * productionMultiplier,
  };
}

export function applyClaimOnAccess(state: CityEconomyState, nowMs = Date.now()) {
  if (nowMs <= state.lastUpdatedAtMs) return;

  const elapsedHours = (nowMs - state.lastUpdatedAtMs) / (1000 * 60 * 60);
  const prod = getProductionPerHour(state);
  const caps = getStorageCaps(state);

  (['ore', 'stone', 'iron'] as EconomyResource[]).forEach((resource) => {
    const next = state.resources[resource] + prod[resource] * elapsedHours;
    state.resources[resource] = Math.min(caps[resource], next);
  });

  state.lastUpdatedAtMs = nowMs;
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
  const derived = getCityDerivedStats(state);
  const costMultiplier = Math.max(0.5, 1 - derived.buildCostReductionPct / 100);
  const adjustedCost = {
    ore: Math.ceil(levelCost.resources.ore * costMultiplier),
    stone: Math.ceil(levelCost.resources.stone * costMultiplier),
    iron: Math.ceil(levelCost.resources.iron * costMultiplier),
  };

  const canAfford =
    state.resources.ore >= adjustedCost.ore && state.resources.stone >= adjustedCost.stone && state.resources.iron >= adjustedCost.iron;

  if (!canAfford) {
    return { ok: false, reason: 'Not enough resources' };
  }

  const population = getPopulationSnapshot(state);
  if (levelCost.populationCost > population.free) {
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
  const derived = getCityDerivedStats(state);
  const costMultiplier = Math.max(0.5, 1 - derived.buildCostReductionPct / 100);
  const adjustedCost = {
    ore: Math.ceil(levelCost.resources.ore * costMultiplier),
    stone: Math.ceil(levelCost.resources.stone * costMultiplier),
    iron: Math.ceil(levelCost.resources.iron * costMultiplier),
  };

  state.resources.ore = Math.max(0, state.resources.ore - adjustedCost.ore);
  state.resources.stone = Math.max(0, state.resources.stone - adjustedCost.stone);
  state.resources.iron = Math.max(0, state.resources.iron - adjustedCost.iron);

  const durationMultiplier = Math.max(0.4, 1 - derived.buildSpeedPct / 100);

  state.queue.push({
    buildingId,
    targetLevel,
    startedAtMs: nowMs,
    endsAtMs: nowMs + Math.ceil(levelCost.buildSeconds * durationMultiplier) * 1000,
    costPaid: adjustedCost,
    populationCostPaid: levelCost.populationCost,
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

  if (getBuildingLevel(state, troop.requiredBuildingId) < troop.requiredBuildingLevel) {
    return { ok: false, reason: `Requires ${troop.requiredBuildingId} ${troop.requiredBuildingLevel}` };
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
  if (state.researchQueue.length > 0) return { ok: false, reason: 'Research queue busy' };
  if (getBuildingLevel(state, 'research_lab') < CITY_ECONOMY_CONFIG.research[researchId].requiredBuildingLevel) {
    return { ok: false, reason: `Requires research_lab ${CITY_ECONOMY_CONFIG.research[researchId].requiredBuildingLevel}` };
  }
  const derived = getCityDerivedStats(state);
  if (derived.researchCapacity <= state.completedResearch.length * 6) return { ok: false, reason: 'Not enough research capacity' };
  const cost = CITY_ECONOMY_CONFIG.research[researchId].cost;
  if (state.resources.ore < cost.ore || state.resources.stone < cost.stone || state.resources.iron < cost.iron) {
    return { ok: false, reason: 'Not enough resources' };
  }
  return { ok: true, reason: null };
}

export function startResearch(state: CityEconomyState, researchId: ResearchId, nowMs = Date.now()): GuardResult {
  const guard = canStartResearch(state, researchId);
  if (!guard.ok) return guard;
  const cfg = CITY_ECONOMY_CONFIG.research[researchId];
  state.resources.ore -= cfg.cost.ore;
  state.resources.stone -= cfg.cost.stone;
  state.resources.iron -= cfg.cost.iron;
  state.researchQueue.push({ researchId, startedAtMs: nowMs, endsAtMs: nowMs + cfg.durationSeconds * 1000, costPaid: { ...cfg.cost } });
  return { ok: true, reason: null };
}

export function resolveCompletedResearch(state: CityEconomyState, nowMs = Date.now()) {
  let changed = false;
  const nextQueue: ResearchQueueEntry[] = [];
  state.researchQueue.forEach((entry) => {
    if (entry.endsAtMs > nowMs) {
      nextQueue.push(entry);
      return;
    }
    if (!state.completedResearch.includes(entry.researchId)) {
      state.completedResearch.push(entry.researchId);
      changed = true;
    }
  });
  state.researchQueue = nextQueue;
  return changed;
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
