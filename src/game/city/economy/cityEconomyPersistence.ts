import {
  applyClaimOnAccess,
  createInitialCityEconomyState,
  resolveCompletedConstruction,
  resolveCompletedTraining,
  startConstruction,
  startTroopTraining,
  type CityEconomyState,
  type GuardResult,
} from '@/game/city/economy/cityEconomySystem';
import type { EconomyBuildingId, TroopId } from '@/game/city/economy/cityEconomyConfig';

const STORAGE_KEY = 'coinage.mvp.cityEconomy.v1';

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
  };
}

function toEconomyState(record: PersistedCityEconomyRecord): CityEconomyState {
  return {
    cityId: record.cityId,
    owner: record.ownerId,
    levels: { ...record.levels },
    resources: { ...record.resources },
    queue: record.queue.map((item) => ({ ...item, costPaid: { ...item.costPaid } })),
    troops: { ...record.troops },
    trainingQueue: record.trainingQueue.map((item) => ({ ...item, costPaid: { ...item.costPaid } })),
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

export function clearCityEconomyPersistenceForTests() {
  const storage = getStorage();
  if (storage) {
    storage.removeItem(STORAGE_KEY);
    return;
  }
  fallbackMemoryStore.delete(STORAGE_KEY);
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
