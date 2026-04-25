import {
  applyClaimOnAccess,
  canStartResearch,
  canSetPolicy,
  createInitialCityEconomyState,
  getBuildingConfig,
  getStorageCaps,
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
  startEspionageMission,
  depositSpySilver,
  startResearch,
  startTroopTraining,
  evaluateEspionageOutcome,
  getCityDerivedStats,
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
  spyVaultSilver: number;
  espionageMissions: CityEconomyState['espionageMissions'];
  espionageReports: CityEconomyState['espionageReports'];
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
const ESPIONAGE_TRAVEL_MS = 15 * 60 * 1000;
const ECONOMY_RUNTIME_TICK_INTERVAL_MS = 1000;
let lastEconomyRuntimeTickMs = 0;
const LEGACY_RESEARCH_ID_MAP: Partial<Record<string, ResearchId>> = {
  slinger: 'railgun_skirmisher',
  archer: 'assault_ranger',
  hoplite: 'bulwark_trooper',
  horseman: 'raider_interceptor',
  chariot: 'aegis_walker',
  catapult: 'siege_artillery',
  bireme: 'sentinel_interceptor',
  light_ship: 'vanguard_corvette',
  fire_ship: 'ember_frigate',
  trireme: 'bulwark_cruiser',
  light_transport_ships: 'rapid_carrier',
  colony_ship: 'colony_ark',
  booty: 'market_logistics',
  villagers_loyalty: 'workforce_loyalty',
  phalanx: 'defense_formation',
  breakthrough: 'offensive_tempo',
  ram: 'fortification_breach',
  stone_hail: 'anti_air_defense',
  temple_looting: 'recovery_logistics',
  divine_selection: 'command_selection',
  battle_experience: 'veteran_training',
  strong_wine: 'workforce_morale',
  set_sail: 'naval_mobilization',
  signals_intel: 'cryptography',
};
const LEGACY_BUILDING_ID_MAP: Partial<Record<string, EconomyBuildingId>> = {
  watch_tower: 'skyshield_battery',
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
    spyVaultSilver: state.spyVaultSilver,
    espionageMissions: state.espionageMissions.map((item) => ({ ...item })),
    espionageReports: state.espionageReports.map((item) => ({ ...item })),
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
  const rawLevels = (record.levels as Partial<Record<string, unknown>> | undefined) ?? {};
  STANDARD_BUILDING_ORDER.forEach((buildingId) => {
    const raw = rawLevels[buildingId];
    if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0) {
      sanitizedLevels[buildingId] = Math.min(getBuildingConfig(buildingId).maxLevel, Math.floor(raw));
    }
  });
  Object.entries(LEGACY_BUILDING_ID_MAP).forEach(([legacyId, targetId]) => {
    if (!targetId || typeof rawLevels[legacyId] !== 'number') return;
    const raw = rawLevels[legacyId] as number;
    if (!Number.isFinite(raw) || raw < 0) return;
    sanitizedLevels[targetId] = Math.min(getBuildingConfig(targetId).maxLevel, Math.floor(raw));
  });

  const validResearchIds = new Set(Object.keys(CITY_ECONOMY_CONFIG.research) as ResearchId[]);
  const coerceResearchId = (rawId: string) => {
    const mapped = (LEGACY_RESEARCH_ID_MAP[rawId] ?? rawId) as ResearchId;
    return validResearchIds.has(mapped) ? mapped : null;
  };

  const baseState: CityEconomyState = {
    cityId: record.cityId,
    owner: record.ownerId,
    levels: sanitizedLevels,
    resources: {
      ore: Number.isFinite(record.resources?.ore) ? record.resources.ore : defaults.resources.ore,
      stone: Number.isFinite(record.resources?.stone) ? record.resources.stone : defaults.resources.stone,
      iron: Number.isFinite(record.resources?.iron) ? record.resources.iron : defaults.resources.iron,
    },
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
    spyVaultSilver: record.spyVaultSilver ?? 0,
    espionageMissions: (record.espionageMissions ?? []).map((item) => ({ ...item })),
    espionageReports: (record.espionageReports ?? []).map((item) => ({ ...item })),
    lastUpdatedAtMs: record.lastResourceUpdateAtMs,
  };
  const caps = getStorageCaps(baseState);
  baseState.resources.ore = Math.min(caps.ore, Math.max(0, baseState.resources.ore));
  baseState.resources.stone = Math.min(caps.stone, Math.max(0, baseState.resources.stone));
  baseState.resources.iron = Math.min(caps.iron, Math.max(0, baseState.resources.iron));
  return baseState;
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
    spyVaultSilver: state.spyVaultSilver,
    espionageMissions: state.espionageMissions.map((item) => ({ ...item })),
    espionageReports: state.espionageReports.map((item) => ({ ...item })),
  };
}

function resolveGlobalEspionage(map: PersistedCityEconomyMap, nowMs: number) {
  let changed = false;
  const states = new Map<string, CityEconomyState>();
  Object.values(map).forEach((record) => states.set(record.cityId, toEconomyState(record)));

  states.forEach((sourceState) => {
    const pending = sourceState.espionageMissions;
    if (pending.length === 0) return;
    const remaining = [];

    for (const mission of pending) {
      if (mission.endsAtMs > nowMs) {
        remaining.push(mission);
        continue;
      }
      const targetState = states.get(mission.targetCityId);
      if (!targetState) {
        sourceState.espionageReports.unshift({
          id: `rep-atk-missing-${mission.id}`,
          createdAtMs: nowMs,
          kind: 'mission_cancelled_target_missing',
          sourceCityId: sourceState.cityId,
          targetCityId: mission.targetCityId,
          silverSent: mission.silverCommitted,
          targetSilverAtResolution: 0,
          defenderEffectiveSpyDefense: 0,
          detectionPctAtResolution: 0,
          counterIntelPctAtResolution: 0,
          wasCryptographyApplied: false,
          wasSuccess: false,
          defenderSilverSpentOnDefense: 0,
        });
        sourceState.spyVaultSilver += mission.silverCommitted;
        sourceState.espionageReports = sourceState.espionageReports.slice(0, 20);
        changed = true;
        continue;
      }

      const defensiveSilver = targetState.spyVaultSilver;
      const outcome = evaluateEspionageOutcome(mission.silverCommitted, targetState);
      const targetDerived = getCityDerivedStats(targetState);

      sourceState.espionageReports.unshift({
        id: `rep-atk-${mission.id}`,
        createdAtMs: nowMs,
        kind: outcome.wasSuccess ? 'attack_success' : 'attack_failed',
        sourceCityId: sourceState.cityId,
        targetCityId: mission.targetCityId,
        silverSent: mission.silverCommitted,
        targetSilverAtResolution: defensiveSilver,
        defenderEffectiveSpyDefense: outcome.defenderEffectiveSpyDefense,
        detectionPctAtResolution: outcome.detectionPctAtResolution,
        counterIntelPctAtResolution: outcome.counterIntelPctAtResolution,
        wasCryptographyApplied: outcome.wasCryptographyApplied,
        wasSuccess: outcome.wasSuccess,
        defenderSilverSpentOnDefense: 0,
        intelSnapshot: outcome.wasSuccess
          ? {
              resources: { ...targetState.resources },
              buildingLevels: { ...targetState.levels },
              troops: { ...targetState.troops },
              defensiveBonuses: {
                cityDefensePct: targetDerived.cityDefensePct,
                antiAirDefensePct: targetDerived.antiAirDefensePct,
                detectionPct: outcome.detectionPctAtResolution,
                counterIntelPct: outcome.counterIntelPctAtResolution,
              },
            }
          : undefined,
      });
      sourceState.espionageReports = sourceState.espionageReports.slice(0, 20);
      changed = true;

      if (!outcome.wasSuccess) {
        const spent = Math.min(targetState.spyVaultSilver, mission.silverCommitted);
        targetState.spyVaultSilver -= spent;
        targetState.espionageReports.unshift({
          id: `rep-def-${mission.id}`,
          createdAtMs: nowMs,
          kind: 'defense_failed_attempt',
          sourceCityId: sourceState.cityId,
          targetCityId: mission.targetCityId,
          silverSent: mission.silverCommitted,
          targetSilverAtResolution: defensiveSilver,
          defenderEffectiveSpyDefense: outcome.defenderEffectiveSpyDefense,
          detectionPctAtResolution: outcome.detectionPctAtResolution,
          counterIntelPctAtResolution: outcome.counterIntelPctAtResolution,
          wasCryptographyApplied: outcome.wasCryptographyApplied,
          wasSuccess: false,
          defenderSilverSpentOnDefense: spent,
        });
        changed = true;
      }
      targetState.espionageReports = targetState.espionageReports.slice(0, 20);
    }
    sourceState.espionageMissions = remaining;
  });

  states.forEach((state) => {
    const ctxRecord = map[state.cityId];
    if (!ctxRecord) return;
    map[state.cityId] = fromEconomyState(
      {
        cityId: ctxRecord.cityId,
        ownerId: ctxRecord.ownerId,
        planetId: ctxRecord.planetId,
        sectorId: ctxRecord.sectorId,
      },
      state,
    );
  });
  return changed;
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

export function runCityEconomyRuntimeTick(nowMs = Date.now(), options?: { force?: boolean }) {
  const force = options?.force ?? false;
  if (!force && nowMs - lastEconomyRuntimeTickMs < ECONOMY_RUNTIME_TICK_INTERVAL_MS) return false;
  lastEconomyRuntimeTickMs = nowMs;

  const map = readMap();
  const changed = resolveGlobalEspionage(map, nowMs);
  if (changed) writeMap(map);
  return changed;
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

export function depositCitySpySilver(context: CityPersistenceContext, amount: number, nowMs = Date.now()) {
  const loaded = loadCityEconomyState(context, nowMs);
  const mutable = cloneEconomyState(loaded.economy);
  const guard = depositSpySilver(mutable, amount);
  const persisted = fromEconomyState(context, mutable);
  saveRecord(persisted);
  return { state: buildSnapshot(persisted), guard };
}

export function sendCityEspionageMission(
  context: CityPersistenceContext,
  targetCityId: string,
  silverToCommit: number,
  nowMs = Date.now(),
) {
  const map = readMap();
  if (!map[targetCityId]) {
    const loaded = loadCityEconomyState(context, nowMs);
    return { state: loaded, guard: { ok: false, reason: 'Target city not found' } };
  }
  const loaded = loadCityEconomyState(context, nowMs);
  const mutable = cloneEconomyState(loaded.economy);
  const guard = startEspionageMission(mutable, targetCityId, silverToCommit, nowMs, ESPIONAGE_TRAVEL_MS);
  const persisted = fromEconomyState(context, mutable);
  saveRecord(persisted);
  return { state: buildSnapshot(persisted), guard };
}

export function clearCityEconomyPersistenceForTests() {
  lastEconomyRuntimeTickMs = 0;
  const storage = getStorage();
  if (storage) {
    storage.removeItem(STORAGE_KEY);
    return;
  }
  fallbackMemoryStore.delete(STORAGE_KEY);
}
