import {
  applyClaimOnAccess,
  canStartResearch,
  canSetPolicy,
  createInitialCityEconomyState,
  getBuildingConfig,
  resolveCompletedConstruction,
  resolveCompletedIntelProjects,
  resolveCompletedResearch,
  resolveCompletedTraining,
  resolveMilitiaExpiration,
  setActivePolicy,
  activateMilitia,
  applyMilitiaDefensiveLosses,
  startConstruction,
  startIntelProject,
  startResearch,
  startTroopTraining,
  type CityEconomyState,
  type GuardResult,
} from '@/game/city/economy/cityEconomySystem';
import { CITY_ECONOMY_CONFIG, STANDARD_BUILDING_ORDER, type EconomyBuildingId, type LocalPolicyId, type ResearchId, type TroopId } from '@/game/city/economy/cityEconomyConfig';

const STORAGE_KEY = 'coinage.mvp.cityEconomy.v2';

interface PersistedCityEconomyRecord {
  cityId: string;
  ownerId: string;
  planetId: string;
  sectorId: string;
  resources: CityEconomyState['resources'];
  lastResourceUpdateAtMs: number;
  levels: CityEconomyState['levels'];
  queue: CityEconomyState['queue'];
  troops: CityEconomyState['troops'];
  trainingQueue: CityEconomyState['trainingQueue'];
  researchQueue: CityEconomyState['researchQueue'];
  completedResearch: CityEconomyState['completedResearch'];
  activePolicy: CityEconomyState['activePolicy'];
  militia: CityEconomyState['militia'];
  intelReadiness: number;
  intelProjects: CityEconomyState['intelProjects'];
}

type PersistedCityEconomyMap = Record<string, PersistedCityEconomyRecord>;

export interface CityPersistenceContext {
  cityId: string;
  ownerId: string;
  planetId: string;
  sectorId: string;
}

export interface PersistedCitySnapshot {
  cityId: string;
  ownerId: string;
  planetId: string;
  sectorId: string;
  economy: CityEconomyState;
}

export interface CityStartUpgradeResult {
  state: PersistedCitySnapshot;
  guard: GuardResult;
}

export interface CityStartTrainingResult {
  state: PersistedCitySnapshot;
  guard: GuardResult;
}

const fallbackMemoryStore = new Map<string, string>();
const LEGACY_RESEARCH_ID_MAP: Record<string, ResearchId> = {
  economy_drills: 'diplomacy',
  fortified_districts: 'city_guard',
  logistics_automation: 'booty',
  signals_intel: 'espionage',
  war_protocols: 'meteorology',
};

function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  return null;
}

function readMap(): PersistedCityEconomyMap {
  const storage = getStorage();
  const raw = storage ? storage.getItem(STORAGE_KEY) : fallbackMemoryStore.get(STORAGE_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as PersistedCityEconomyMap;
    return parsed ?? {};
  } catch {
    return {};
  }
}

function writeMap(map: PersistedCityEconomyMap) {
  const payload = JSON.stringify(map);
  const storage = getStorage();
  if (storage) {
    storage.setItem(STORAGE_KEY, payload);
    return;
  }
  fallbackMemoryStore.set(STORAGE_KEY, payload);
}

function cloneEconomyState(state: CityEconomyState): CityEconomyState {
  return {
    cityId: state.cityId,
    owner: state.owner,
    levels: { ...state.levels },
    resources: { ...state.resources },
    queue: state.queue.map((item) => ({ ...item, costPaid: { ...item.costPaid } })),
    lastUpdatedAtMs: state.lastUpdatedAtMs,
    troops: { ...state.troops },
    trainingQueue: state.trainingQueue.map((item) => ({ ...item, costPaid: { ...item.costPaid } })),
    researchQueue: state.researchQueue.map((item) => ({ ...item, costPaid: { ...item.costPaid } })),
    completedResearch: [...state.completedResearch],
    activePolicy: state.activePolicy,
    militia: { ...state.militia },
    intelReadiness: state.intelReadiness,
    intelProjects: state.intelProjects.map((item) => ({ ...item })),
  };
}

function toEconomyState(record: PersistedCityEconomyRecord): CityEconomyState {
  const defaults = createInitialCityEconomyState({
    cityId: record.cityId,
    owner: record.ownerId,
    nowMs: record.lastResourceUpdateAtMs,
  });

  const validBuildingIdSet = new Set(STANDARD_BUILDING_ORDER);
  const sanitizedLevels = { ...defaults.levels };
  STANDARD_BUILDING_ORDER.forEach((buildingId) => {
    const raw = (record.levels as Partial<Record<EconomyBuildingId, unknown>> | undefined)?.[buildingId];
    if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0) {
      sanitizedLevels[buildingId] = Math.min(getBuildingConfig(buildingId).maxLevel, Math.floor(raw));
    }
  });

  const validResearchIds = new Set(Object.keys(CITY_ECONOMY_CONFIG.research) as ResearchId[]);
  const coerceResearchId = (rawId: string) => {
    const mapped = (LEGACY_RESEARCH_ID_MAP[rawId] ?? rawId) as ResearchId;
    return validResearchIds.has(mapped) ? mapped : null;
  };

  return {
    cityId: record.cityId,
    owner: record.ownerId,
    levels: sanitizedLevels,
    resources: { ...record.resources },
    queue: (record.queue ?? [])
      .filter((item) => validBuildingIdSet.has(item.buildingId))
      .map((item) => ({ ...item, costPaid: { ...item.costPaid } })),
    troops: { ...record.troops },
    trainingQueue: record.trainingQueue.map((item) => ({ ...item, costPaid: { ...item.costPaid } })),
    researchQueue: (record.researchQueue ?? [])
      .map((item) => {
        const normalizedId = coerceResearchId(item.researchId);
        if (!normalizedId) return null;
        return { ...item, researchId: normalizedId, costPaid: { ...item.costPaid } };
      })
      .filter((item): item is CityEconomyState['researchQueue'][number] => Boolean(item)),
    completedResearch: [...new Set((record.completedResearch ?? []).map((id) => coerceResearchId(id)).filter((id): id is ResearchId => Boolean(id)))],
    activePolicy: record.activePolicy ?? null,
    militia: { ...defaults.militia, ...(record.militia ?? {}) },
    intelReadiness: record.intelReadiness ?? 0,
    intelProjects: (record.intelProjects ?? []).map((item) => ({ ...item })),
    lastUpdatedAtMs: record.lastResourceUpdateAtMs,
  };
}

function fromEconomyState(context: CityPersistenceContext, state: CityEconomyState): PersistedCityEconomyRecord {
  return {
    cityId: context.cityId,
    ownerId: context.ownerId,
    planetId: context.planetId,
    sectorId: context.sectorId,
    resources: { ...state.resources },
    lastResourceUpdateAtMs: state.lastUpdatedAtMs,
    levels: { ...state.levels },
    queue: state.queue.map((item) => ({ ...item, costPaid: { ...item.costPaid } })),
    troops: { ...state.troops },
    trainingQueue: state.trainingQueue.map((item) => ({ ...item, costPaid: { ...item.costPaid } })),
    researchQueue: state.researchQueue.map((item) => ({ ...item, costPaid: { ...item.costPaid } })),
    completedResearch: [...state.completedResearch],
    activePolicy: state.activePolicy,
    militia: { ...state.militia },
    intelReadiness: state.intelReadiness,
    intelProjects: state.intelProjects.map((item) => ({ ...item })),
  };
}

function loadOrCreateRecord(context: CityPersistenceContext, nowMs: number): PersistedCityEconomyRecord {
  const map = readMap();
  const existing = map[context.cityId];
  if (existing) return existing;

  const created = createInitialCityEconomyState({
    cityId: context.cityId,
    owner: context.ownerId,
    nowMs,
  });

  const record = fromEconomyState(context, created);
  map[context.cityId] = record;
  writeMap(map);

  return record;
}

function saveRecord(record: PersistedCityEconomyRecord) {
  const map = readMap();
  map[record.cityId] = record;
  writeMap(map);
}

function buildSnapshot(record: PersistedCityEconomyRecord): PersistedCitySnapshot {
  return {
    cityId: record.cityId,
    ownerId: record.ownerId,
    planetId: record.planetId,
    sectorId: record.sectorId,
    economy: cloneEconomyState(toEconomyState(record)),
  };
}

export function loadCityEconomyState(context: CityPersistenceContext, nowMs = Date.now()): PersistedCitySnapshot {
  const record = loadOrCreateRecord(context, nowMs);
  const mutable = toEconomyState(record);

  applyClaimOnAccess(mutable, nowMs);
  resolveCompletedConstruction(mutable, nowMs);
  resolveCompletedTraining(mutable, nowMs);
  resolveCompletedResearch(mutable, nowMs);
  resolveMilitiaExpiration(mutable, nowMs);
  resolveCompletedIntelProjects(mutable, nowMs);

  const persisted = fromEconomyState(context, mutable);
  saveRecord(persisted);

  return buildSnapshot(persisted);
}

export function startCityBuildingUpgrade(
  context: CityPersistenceContext,
  buildingId: EconomyBuildingId,
  nowMs = Date.now(),
): CityStartUpgradeResult {
  const loaded = loadCityEconomyState(context, nowMs);
  const mutable = cloneEconomyState(loaded.economy);
  const guard = startConstruction(mutable, buildingId, nowMs);

  const persisted = fromEconomyState(context, mutable);
  saveRecord(persisted);

  return {
    state: buildSnapshot(persisted),
    guard,
  };
}

export function startCityTroopTraining(
  context: CityPersistenceContext,
  troopId: TroopId,
  quantity: number,
  nowMs = Date.now(),
): CityStartTrainingResult {
  const loaded = loadCityEconomyState(context, nowMs);
  const mutable = cloneEconomyState(loaded.economy);
  const guard = startTroopTraining(mutable, troopId, quantity, nowMs);

  const persisted = fromEconomyState(context, mutable);
  saveRecord(persisted);

  return {
    state: buildSnapshot(persisted),
    guard,
  };
}

export function activateCityMilitia(context: CityPersistenceContext, nowMs = Date.now()) {
  const loaded = loadCityEconomyState(context, nowMs);
  const mutable = cloneEconomyState(loaded.economy);
  const guard = activateMilitia(mutable, nowMs);
  const persisted = fromEconomyState(context, mutable);
  saveRecord(persisted);
  return { state: buildSnapshot(persisted), guard };
}

export function applyCityMilitiaDefensiveLosses(context: CityPersistenceContext, losses: number, nowMs = Date.now()) {
  const loaded = loadCityEconomyState(context, nowMs);
  const mutable = cloneEconomyState(loaded.economy);
  const applied = applyMilitiaDefensiveLosses(mutable, losses, nowMs);
  const persisted = fromEconomyState(context, mutable);
  saveRecord(persisted);
  return { state: buildSnapshot(persisted), applied };
}

export function startCityResearch(context: CityPersistenceContext, researchId: ResearchId, nowMs = Date.now()) {
  const loaded = loadCityEconomyState(context, nowMs);
  const mutable = cloneEconomyState(loaded.economy);
  const guard = startResearch(mutable, researchId, nowMs);
  const persisted = fromEconomyState(context, mutable);
  saveRecord(persisted);
  return { state: buildSnapshot(persisted), guard };
}

export function getCityResearchGuard(context: CityPersistenceContext, researchId: ResearchId, nowMs = Date.now()) {
  const loaded = loadCityEconomyState(context, nowMs);
  return canStartResearch(loaded.economy, researchId);
}

export function setCityPolicy(context: CityPersistenceContext, policyId: LocalPolicyId, nowMs = Date.now()) {
  const loaded = loadCityEconomyState(context, nowMs);
  const mutable = cloneEconomyState(loaded.economy);
  const guard = setActivePolicy(mutable, policyId);
  const persisted = fromEconomyState(context, mutable);
  saveRecord(persisted);
  return { state: buildSnapshot(persisted), guard };
}

export function getCityPolicyGuard(context: CityPersistenceContext, policyId: LocalPolicyId, nowMs = Date.now()) {
  const loaded = loadCityEconomyState(context, nowMs);
  return canSetPolicy(loaded.economy, policyId);
}

export function startCityIntelProject(
  context: CityPersistenceContext,
  projectType: 'sweep' | 'network' | 'cipher',
  nowMs = Date.now(),
) {
  const loaded = loadCityEconomyState(context, nowMs);
  const mutable = cloneEconomyState(loaded.economy);
  const guard = startIntelProject(mutable, projectType, nowMs);
  const persisted = fromEconomyState(context, mutable);
  saveRecord(persisted);
  return { state: buildSnapshot(persisted), guard };
}

export function clearCityEconomyPersistenceForTests() {
  const storage = getStorage();
  if (storage) {
    storage.removeItem(STORAGE_KEY);
    return;
  }
  fallbackMemoryStore.delete(STORAGE_KEY);
}
