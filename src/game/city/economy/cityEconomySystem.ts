import {
  CITY_ECONOMY_CONFIG,
  ECONOMY_BUILDING_ORDER,
  MILITARY_BUILDING_ORDER,
  type BuildingLevelCost,
  type BuildingLevelBandPrerequisite,
  type EconomyBuildingConfig,
  type EconomyBuildingId,
  type EconomyResource,
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

export type TroopCounts = Record<TroopId, number>;

export interface CityEconomyState {
  cityId: string;
  owner: string;
  levels: Record<EconomyBuildingId, number>;
  resources: ResourceBundle;
  queue: CityConstructionEntry[];
  troops: TroopCounts;
  trainingQueue: TroopTrainingEntry[];
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

export function createInitialCityEconomyState(input: { cityId: string; owner: string; nowMs?: number }): CityEconomyState {
  return {
    cityId: input.cityId,
    owner: input.owner,
    levels: {
      hq: 1,
      mine: 1,
      quarry: 1,
      refinery: 0,
      warehouse: 1,
      housing_complex: 1,
      barracks: 0,
      combat_forge: 0,
      space_dock: 0,
    },
    resources: { ...CITY_ECONOMY_CONFIG.resources.startingStock },
    queue: [],
    troops: { ...ZERO_TROOPS },
    trainingQueue: [],
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
  return [...ECONOMY_BUILDING_ORDER, ...MILITARY_BUILDING_ORDER].reduce((sum, buildingId) => {
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

export function getProductionPerHour(state: CityEconomyState): ResourceBundle {
  const holdingMultiplier = CITY_ECONOMY_CONFIG.holdingMultiplier;
  const mine = getCurrentLevelRow(state, 'mine');
  const quarry = getCurrentLevelRow(state, 'quarry');
  const refinery = getCurrentLevelRow(state, 'refinery');

  return {
    ore: (mine?.effect.orePerHour ?? 0) * holdingMultiplier,
    stone: (quarry?.effect.stonePerHour ?? 0) * holdingMultiplier,
    iron: (refinery?.effect.ironPerHour ?? 0) * holdingMultiplier,
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
  const canAfford =
    state.resources.ore >= levelCost.resources.ore &&
    state.resources.stone >= levelCost.resources.stone &&
    state.resources.iron >= levelCost.resources.iron;

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

  state.resources.ore = Math.max(0, state.resources.ore - levelCost.resources.ore);
  state.resources.stone = Math.max(0, state.resources.stone - levelCost.resources.stone);
  state.resources.iron = Math.max(0, state.resources.iron - levelCost.resources.iron);

  state.queue.push({
    buildingId,
    targetLevel,
    startedAtMs: nowMs,
    endsAtMs: nowMs + levelCost.buildSeconds * 1000,
    costPaid: levelCost.resources,
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

  state.resources.ore = Math.max(0, state.resources.ore - totalCost.ore);
  state.resources.stone = Math.max(0, state.resources.stone - totalCost.stone);
  state.resources.iron = Math.max(0, state.resources.iron - totalCost.iron);

  state.trainingQueue.push({
    troopId,
    quantity,
    startedAtMs: nowMs,
    endsAtMs: nowMs + troop.trainingSeconds * quantity * 1000,
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

export function getConstructionQueueSlots() {
  return CITY_ECONOMY_CONFIG.queueSlots;
}

export function getEconomyBuildingOrder() {
  return ECONOMY_BUILDING_ORDER;
}

export function getMilitaryBuildingOrder() {
  return MILITARY_BUILDING_ORDER;
}
