// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { CITY_ECONOMY_CONFIG } from '@/game/city/economy/cityEconomyConfig';
import {
  activateCityMilitia,
  applyCityMilitiaDefensiveLosses,
  clearCityEconomyPersistenceForTests,
  depositCitySpySilver,
  loadCityEconomyState,
  runCityEconomyRuntimeTick,
  sendCityEspionageMission,
  startCityBuildingUpgrade,
  startCityIntelProject,
  startCityResearch,
  startCityTroopTraining,
} from '@/game/city/economy/cityEconomyPersistence';

const context = {
  cityId: 'planet-a',
  ownerId: 'user-1',
  planetId: 'planet-a',
  sectorId: 'sector-planet-a',
};
const rivalContext = {
  cityId: 'planet-b',
  ownerId: 'user-2',
  planetId: 'planet-b',
  sectorId: 'sector-planet-b',
};
const STORAGE_KEY = 'coinage.mvp.cityEconomy.v2';

describe('cityEconomyPersistence MVP MICRO flow', () => {
  beforeEach(() => {
    clearCityEconomyPersistenceForTests();
    window.localStorage.clear();
  });

  it('keeps premium queue disabled in persisted config', () => {
    expect(CITY_ECONOMY_CONFIG.premiumQueueEnabled).toBe(false);
  });

  it('stores expanded state fields for research/governance/intel', () => {
    const snapshot = loadCityEconomyState(context, 1_000);
    expect(snapshot.economy.researchQueue).toEqual([]);
    expect(snapshot.economy.completedResearch).toEqual([]);
    expect(snapshot.economy.activePolicy).toBeNull();
    expect(snapshot.economy.intelProjects).toEqual([]);
    expect(snapshot.economy.intelReadiness).toBe(0);
    expect(snapshot.economy.spyVaultSilver).toBe(0);
    expect(snapshot.economy.espionageMissions).toEqual([]);
    expect(snapshot.economy.espionageReports).toEqual([]);
    expect(snapshot.economy.militia.isActive).toBe(false);
  });

  it('resolves espionage failure with defender report and defense silver spending', () => {
    const baseLevels = {
      hq: 10,
      mine: 1,
      quarry: 1,
      refinery: 1,
      warehouse: 7,
      housing_complex: 1,
      barracks: 0,
      space_dock: 0,
      defensive_wall: 0,
      skyshield_battery: 0,
      armament_factory: 0,
      intelligence_center: 2,
      research_lab: 0,
      market: 4,
      council_chamber: 0,
    };
    const emptyTroops = {
      citizen_militia: 0, line_infantry: 0, phalanx_lanceguard: 0, rail_marksman: 0, assault_legionnaire: 0, aegis_shieldguard: 0, raider_hoverbike: 0, siege_breacher: 0,
      assault_dropship: 0, swift_carrier: 0, interceptor_sentinel: 0, ember_drifter: 0, rapid_escort: 0, bulwark_trireme: 0, colonization_arkship: 0,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      [context.cityId]: {
        cityId: context.cityId, ownerId: context.ownerId, planetId: context.planetId, sectorId: context.sectorId,
        resources: { ore: 3_000, stone: 3_000, iron: 3_000 }, lastResourceUpdateAtMs: 1_000, levels: baseLevels, queue: [], troops: emptyTroops,
        trainingQueue: [], researchQueue: [], completedResearch: ['espionage'], activePolicy: null, militia: null, intelReadiness: 0, intelProjects: [], spyVaultSilver: 0, espionageMissions: [], espionageReports: [],
      },
      [rivalContext.cityId]: {
        cityId: rivalContext.cityId, ownerId: rivalContext.ownerId, planetId: rivalContext.planetId, sectorId: rivalContext.sectorId,
        resources: { ore: 3_000, stone: 3_000, iron: 3_000 }, lastResourceUpdateAtMs: 1_000, levels: baseLevels, queue: [], troops: emptyTroops,
        trainingQueue: [], researchQueue: [], completedResearch: ['espionage'], activePolicy: null, militia: null, intelReadiness: 0, intelProjects: [], spyVaultSilver: 0, espionageMissions: [], espionageReports: [],
      },
    }));

    depositCitySpySilver(context, 1_500, 100_100);
    depositCitySpySilver(rivalContext, 1_200, 100_100);
    sendCityEspionageMission(context, rivalContext.cityId, 1_000, 100_200);

    expect(runCityEconomyRuntimeTick(100_200 + 16 * 60 * 1000, { force: true })).toBe(true);
    const atkResolved = loadCityEconomyState(context, 100_200 + 16 * 60 * 1000);
    const defResolved = loadCityEconomyState(rivalContext, 100_200 + 16 * 60 * 1000);
    expect(atkResolved.economy.espionageReports[0].kind).toBe('attack_failed');
    expect(atkResolved.economy.espionageReports[0].wasSuccess).toBe(false);
    expect(atkResolved.economy.espionageReports[0].defenderEffectiveSpyDefense).toBeGreaterThanOrEqual(1_200);
    expect(defResolved.economy.spyVaultSilver).toBe(200);
    expect(defResolved.economy.espionageReports[0].kind).toBe('defense_failed_attempt');
    expect(defResolved.economy.espionageReports[0].defenderSilverSpentOnDefense).toBe(1_000);
  });

  it('resolves espionage success with attacker intel snapshot and no defender report by default', () => {
    const baseLevels = {
      hq: 10,
      mine: 1,
      quarry: 1,
      refinery: 1,
      warehouse: 7,
      housing_complex: 1,
      barracks: 0,
      space_dock: 0,
      defensive_wall: 0,
      skyshield_battery: 0,
      armament_factory: 0,
      intelligence_center: 10,
      research_lab: 0,
      market: 4,
      council_chamber: 0,
    };
    const emptyTroops = {
      citizen_militia: 0, line_infantry: 0, phalanx_lanceguard: 0, rail_marksman: 0, assault_legionnaire: 0, aegis_shieldguard: 0, raider_hoverbike: 0, siege_breacher: 0,
      assault_dropship: 0, swift_carrier: 0, interceptor_sentinel: 0, ember_drifter: 0, rapid_escort: 0, bulwark_trireme: 0, colonization_arkship: 0,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      [context.cityId]: {
        cityId: context.cityId, ownerId: context.ownerId, planetId: context.planetId, sectorId: context.sectorId,
        resources: { ore: 9_000, stone: 9_000, iron: 9_000 }, lastResourceUpdateAtMs: 1_000, levels: baseLevels, queue: [], troops: emptyTroops,
        trainingQueue: [], researchQueue: [], completedResearch: ['espionage'], activePolicy: null, militia: null, intelReadiness: 0, intelProjects: [], spyVaultSilver: 0, espionageMissions: [], espionageReports: [],
      },
      [rivalContext.cityId]: {
        cityId: rivalContext.cityId, ownerId: rivalContext.ownerId, planetId: rivalContext.planetId, sectorId: rivalContext.sectorId,
        resources: { ore: 9_000, stone: 9_000, iron: 9_000 }, lastResourceUpdateAtMs: 1_000, levels: baseLevels, queue: [], troops: emptyTroops,
        trainingQueue: [], researchQueue: [], completedResearch: ['espionage'], activePolicy: null, militia: null, intelReadiness: 0, intelProjects: [], spyVaultSilver: 0, espionageMissions: [], espionageReports: [],
      },
    }));

    depositCitySpySilver(context, 3_000, 2_000);
    depositCitySpySilver(rivalContext, 1_000, 2_000);
    sendCityEspionageMission(context, rivalContext.cityId, 2_500, 2_100);

    expect(runCityEconomyRuntimeTick(2_100 + 16 * 60 * 1000, { force: true })).toBe(true);
    const atkResolved = loadCityEconomyState(context, 2_100 + 16 * 60 * 1000);
    const defResolved = loadCityEconomyState(rivalContext, 2_100 + 16 * 60 * 1000);

    expect(atkResolved.economy.espionageReports[0].kind).toBe('attack_success');
    expect(atkResolved.economy.espionageReports[0].wasSuccess).toBe(true);
    expect(atkResolved.economy.espionageReports[0].intelSnapshot).toBeDefined();
    expect(atkResolved.economy.espionageReports[0].intelSnapshot?.buildingLevels.hq).toBeGreaterThanOrEqual(1);
    expect(atkResolved.economy.espionageReports[0].intelSnapshot?.troops.citizen_militia).toBeDefined();
    expect(defResolved.economy.espionageReports).toEqual([]);
  });

  it('rejects espionage mission when target city does not exist', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      [context.cityId]: {
        cityId: context.cityId,
        ownerId: context.ownerId,
        planetId: context.planetId,
        sectorId: context.sectorId,
        resources: { ore: 3_000, stone: 3_000, iron: 3_000 },
        lastResourceUpdateAtMs: 4_000,
        levels: {
          hq: 10,
          mine: 1,
          quarry: 1,
          refinery: 1,
          warehouse: 7,
          housing_complex: 1,
          barracks: 0,
          space_dock: 0,
          defensive_wall: 0,
          skyshield_battery: 0,
          armament_factory: 0,
          intelligence_center: 2,
          research_lab: 0,
          market: 4,
          council_chamber: 0,
        },
        queue: [],
        troops: {
          citizen_militia: 0, line_infantry: 0, phalanx_lanceguard: 0, rail_marksman: 0, assault_legionnaire: 0, aegis_shieldguard: 0, raider_hoverbike: 0, siege_breacher: 0,
          assault_dropship: 0, swift_carrier: 0, interceptor_sentinel: 0, ember_drifter: 0, rapid_escort: 0, bulwark_trireme: 0, colonization_arkship: 0,
        },
        trainingQueue: [],
        researchQueue: [],
        completedResearch: [],
        activePolicy: null,
        militia: null,
        intelReadiness: 0,
        intelProjects: [],
        spyVaultSilver: 0,
        espionageMissions: [],
        espionageReports: [],
      },
    }));

    depositCitySpySilver(context, 2_000, 5_000);
    const invalid = sendCityEspionageMission(context, 'missing-city', 1_000, 5_100);
    expect(invalid.guard).toEqual({ ok: false, reason: 'Target city not found' });
    expect(invalid.state.economy.spyVaultSilver).toBe(2_000);
  });

  it('applies detection/counter-intel derived stats to defender effective spy defense', () => {
    const baseLevels = {
      hq: 10,
      mine: 1,
      quarry: 1,
      refinery: 1,
      warehouse: 7,
      housing_complex: 1,
      barracks: 0,
      space_dock: 0,
      defensive_wall: 0,
      skyshield_battery: 0,
      armament_factory: 0,
      intelligence_center: 10,
      research_lab: 7,
      market: 4,
      council_chamber: 5,
    };
    const emptyTroops = {
      citizen_militia: 0, line_infantry: 0, phalanx_lanceguard: 0, rail_marksman: 0, assault_legionnaire: 0, aegis_shieldguard: 0, raider_hoverbike: 0, siege_breacher: 0,
      assault_dropship: 0, swift_carrier: 0, interceptor_sentinel: 0, ember_drifter: 0, rapid_escort: 0, bulwark_trireme: 0, colonization_arkship: 0,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      [context.cityId]: {
        cityId: context.cityId, ownerId: context.ownerId, planetId: context.planetId, sectorId: context.sectorId,
        resources: { ore: 9_000, stone: 9_000, iron: 9_000 }, lastResourceUpdateAtMs: 1_000, levels: baseLevels, queue: [], troops: emptyTroops,
        trainingQueue: [], researchQueue: [], completedResearch: ['espionage'], activePolicy: null, militia: null, intelReadiness: 0, intelProjects: [], spyVaultSilver: 0, espionageMissions: [], espionageReports: [],
      },
      [rivalContext.cityId]: {
        cityId: rivalContext.cityId, ownerId: rivalContext.ownerId, planetId: rivalContext.planetId, sectorId: rivalContext.sectorId,
        resources: { ore: 9_000, stone: 9_000, iron: 9_000 }, lastResourceUpdateAtMs: 1_000, levels: baseLevels, queue: [], troops: emptyTroops,
        trainingQueue: [], researchQueue: [], completedResearch: ['espionage'], activePolicy: 'civic_watch', militia: null, intelReadiness: 0, intelProjects: [], spyVaultSilver: 0, espionageMissions: [], espionageReports: [],
      },
    }));

    depositCitySpySilver(context, 1_500, 6_000);
    depositCitySpySilver(rivalContext, 1_000, 6_000);
    sendCityEspionageMission(context, rivalContext.cityId, 1_300, 6_100);

    expect(runCityEconomyRuntimeTick(6_100 + 16 * 60 * 1000, { force: true })).toBe(true);
    const atkResolved = loadCityEconomyState(context, 6_100 + 16 * 60 * 1000);
    expect(atkResolved.economy.espionageReports[0].kind).toBe('attack_failed');
    expect(atkResolved.economy.espionageReports[0].defenderEffectiveSpyDefense).toBeGreaterThan(1_000);
    expect(atkResolved.economy.espionageReports[0].detectionPctAtResolution).toBeGreaterThan(0);
    expect(atkResolved.economy.espionageReports[0].counterIntelPctAtResolution).toBeGreaterThan(0);
  });

  it('persists active militia timer across reload and cleans post-expiration', () => {
    const activation = activateCityMilitia(context, 10_100);
    expect(activation.guard.ok).toBe(true);
    expect(activation.state.economy.militia.isActive).toBe(true);

    const mid = loadCityEconomyState(context, 10_100 + 60 * 60 * 1000);
    expect(mid.economy.militia.isActive).toBe(true);
    expect(mid.economy.militia.currentMilitia).toBeGreaterThan(0);

    const applied = applyCityMilitiaDefensiveLosses(context, 15, 10_100 + 90 * 60 * 1000);
    expect(applied.applied).toBe(Math.min(15, mid.economy.militia.currentMilitia));
    expect(applied.state.economy.militia.currentMilitia).toBe(mid.economy.militia.currentMilitia - applied.applied);

    const expired = loadCityEconomyState(context, 10_100 + 3 * 60 * 60 * 1000 + 1);
    expect(expired.economy.militia.isActive).toBe(false);
    expect(expired.economy.militia.currentMilitia).toBe(0);
  });

  it('keeps espionage resolution idempotent under double runtime tick', () => {
    const baseLevels = {
      hq: 10,
      mine: 1,
      quarry: 1,
      refinery: 1,
      warehouse: 7,
      housing_complex: 1,
      barracks: 0,
      space_dock: 0,
      defensive_wall: 0,
      skyshield_battery: 0,
      armament_factory: 0,
      intelligence_center: 2,
      research_lab: 0,
      market: 4,
      council_chamber: 0,
    };
    const emptyTroops = {
      citizen_militia: 0, line_infantry: 0, phalanx_lanceguard: 0, rail_marksman: 0, assault_legionnaire: 0, aegis_shieldguard: 0, raider_hoverbike: 0, siege_breacher: 0,
      assault_dropship: 0, swift_carrier: 0, interceptor_sentinel: 0, ember_drifter: 0, rapid_escort: 0, bulwark_trireme: 0, colonization_arkship: 0,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      [context.cityId]: {
        cityId: context.cityId, ownerId: context.ownerId, planetId: context.planetId, sectorId: context.sectorId,
        resources: { ore: 3_000, stone: 3_000, iron: 3_000 }, lastResourceUpdateAtMs: 1_000, levels: baseLevels, queue: [], troops: emptyTroops,
        trainingQueue: [], researchQueue: [], completedResearch: ['espionage'], activePolicy: null, militia: null, intelReadiness: 0, intelProjects: [], spyVaultSilver: 0, espionageMissions: [], espionageReports: [],
      },
      [rivalContext.cityId]: {
        cityId: rivalContext.cityId, ownerId: rivalContext.ownerId, planetId: rivalContext.planetId, sectorId: rivalContext.sectorId,
        resources: { ore: 3_000, stone: 3_000, iron: 3_000 }, lastResourceUpdateAtMs: 1_000, levels: baseLevels, queue: [], troops: emptyTroops,
        trainingQueue: [], researchQueue: [], completedResearch: [], activePolicy: null, militia: null, intelReadiness: 0, intelProjects: [], spyVaultSilver: 0, espionageMissions: [], espionageReports: [],
      },
    }));

    depositCitySpySilver(context, 2_000, 20_000);
    sendCityEspionageMission(context, rivalContext.cityId, 1_200, 20_100);

    const dueAt = 20_100 + 16 * 60 * 1000;
    expect(runCityEconomyRuntimeTick(dueAt, { force: true })).toBe(true);
    expect(runCityEconomyRuntimeTick(dueAt + 5, { force: true })).toBe(false);

    const atk = loadCityEconomyState(context, dueAt + 5);
    expect(atk.economy.espionageMissions).toEqual([]);
    expect(atk.economy.espionageReports.length).toBe(1);
  });

  it('keeps militia guard blocked when loaded housing_complex is level 0', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        [context.cityId]: {
          cityId: context.cityId,
          ownerId: context.ownerId,
          planetId: context.planetId,
          sectorId: context.sectorId,
          resources: { ore: 0, stone: 0, iron: 0 },
          lastResourceUpdateAtMs: 10_000,
          levels: {
            hq: 1,
            mine: 1,
            quarry: 1,
            refinery: 0,
            warehouse: 1,
            housing_complex: 0,
            barracks: 0,
            space_dock: 0,
            defensive_wall: 0,
            skyshield_battery: 0,
            armament_factory: 0,
            intelligence_center: 0,
            research_lab: 0,
            market: 0,
            council_chamber: 0,
          },
          queue: [],
          troops: {
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
          },
          trainingQueue: [],
          researchQueue: [],
          completedResearch: [],
          activePolicy: null,
          militia: null,
          intelReadiness: 0,
          intelProjects: [],
          spyVaultSilver: 0,
          espionageMissions: [],
          espionageReports: [],
        },
      }),
    );

    const activation = activateCityMilitia(context, 10_100);
    expect(activation.guard).toEqual({ ok: false, reason: 'Requires housing_complex 1' });
  });

  it('persists construction queue updates across reloads', () => {
    const started = startCityBuildingUpgrade(context, 'mine', 2_000);
    expect(started.guard.ok).toBe(true);

    const reloaded = loadCityEconomyState(context, 2_100);
    expect(reloaded.economy.queue.length).toBe(1);
    expect(reloaded.economy.queue[0].buildingId).toBe('mine');
  });

  it('keeps guards active for locked troop/research/intel actions until unlocked', () => {
    const training = startCityTroopTraining(context, 'line_infantry', 1, 3_000);
    expect(training.guard.ok).toBe(false);

    const research = startCityResearch(context, 'diplomacy', 3_000);
    expect(research.guard.ok).toBe(false);

    const intel = startCityIntelProject(context, 'sweep', 3_000);
    expect(intel.guard.ok).toBe(false);
  });

  it('persists timed research queue and resolves completion on load', () => {
    const loaded = loadCityEconomyState(context, 30_000);
    const state = loaded.economy;
    state.levels.hq = 8;
    state.levels.housing_complex = 6;
    state.levels.barracks = 5;
    state.levels.research_lab = 8;
    state.levels.warehouse = 35;
    state.resources = { ore: 20_000, stone: 20_000, iron: 20_000 };
    state.completedResearch = ['city_guard'];
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        [context.cityId]: {
          cityId: context.cityId,
          ownerId: context.ownerId,
          planetId: context.planetId,
          sectorId: context.sectorId,
          resources: state.resources,
          lastResourceUpdateAtMs: 30_000,
          levels: state.levels,
          queue: [],
          troops: state.troops,
          trainingQueue: [],
          researchQueue: [],
          completedResearch: state.completedResearch,
          activePolicy: null,
          militia: null,
          intelReadiness: 0,
          intelProjects: [],
          spyVaultSilver: 0,
          espionageMissions: [],
          espionageReports: [],
        },
      }),
    );

    const started = startCityResearch(context, 'diplomacy', 31_000);
    expect(started.guard.ok).toBe(true);
    expect(started.state.economy.researchQueue.length).toBe(1);
    expect(started.state.economy.completedResearch.includes('diplomacy')).toBe(false);

    const endsAt = started.state.economy.researchQueue[0].endsAtMs;
    const resolved = loadCityEconomyState(context, endsAt + 1);
    expect(resolved.economy.researchQueue).toEqual([]);
    expect(resolved.economy.completedResearch).toContain('diplomacy');
  });


  it('clamps loaded resources to warehouse-derived storage caps', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        [context.cityId]: {
          cityId: context.cityId,
          ownerId: context.ownerId,
          planetId: context.planetId,
          sectorId: context.sectorId,
          resources: { ore: 9_999, stone: 9_999, iron: 9_999 },
          lastResourceUpdateAtMs: 1_000,
          levels: {
            hq: 1,
            mine: 1,
            quarry: 1,
            refinery: 0,
            warehouse: 2,
            housing_complex: 1,
            barracks: 0,
            space_dock: 0,
            defensive_wall: 0,
            skyshield_battery: 0,
            armament_factory: 0,
            intelligence_center: 0,
            research_lab: 0,
            market: 0,
            council_chamber: 0,
          },
          queue: [],
          troops: {
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
          },
          trainingQueue: [],
          researchQueue: [],
          completedResearch: [],
          activePolicy: null,
          militia: null,
          intelReadiness: 0,
          intelProjects: [],
          spyVaultSilver: 0,
          espionageMissions: [],
          espionageReports: [],
        },
      }),
    );

    const snapshot = loadCityEconomyState(context, 2_000);
    expect(snapshot.economy.resources).toEqual({ ore: 711, stone: 711, iron: 711 });
  });

  it('migrates legacy persisted watch_tower level into skyshield_battery', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        [context.cityId]: {
          cityId: context.cityId,
          ownerId: context.ownerId,
          planetId: context.planetId,
          sectorId: context.sectorId,
          resources: { ore: 0, stone: 0, iron: 0 },
          lastResourceUpdateAtMs: 5_000,
          levels: {
            hq: 12,
            mine: 1,
            quarry: 1,
            refinery: 1,
            warehouse: 1,
            housing_complex: 1,
            barracks: 1,
            space_dock: 3,
            defensive_wall: 0,
            watch_tower: 4,
            skyshield_battery: 0,
            armament_factory: 0,
            intelligence_center: 0,
            research_lab: 0,
            market: 0,
            council_chamber: 0,
          },
          queue: [],
          troops: {
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
          },
          trainingQueue: [],
          researchQueue: [],
          completedResearch: [],
          activePolicy: null,
          militia: null,
          intelReadiness: 0,
          intelProjects: [],
          spyVaultSilver: 0,
          espionageMissions: [],
          espionageReports: [],
        },
      }),
    );

    const snapshot = loadCityEconomyState(context, 6_000);
    expect(snapshot.economy.levels.skyshield_battery).toBe(4);
  });


  it('sanitizes legacy saves that still reference removed building ids', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        [context.cityId]: {
          cityId: context.cityId,
          ownerId: context.ownerId,
          planetId: context.planetId,
          sectorId: context.sectorId,
          resources: { ore: 1_000, stone: 1_000, iron: 1_000 },
          lastResourceUpdateAtMs: 5_000,
          levels: {
            hq: 10,
            mine: 10,
            quarry: 10,
            refinery: 8,
            warehouse: 8,
            housing_complex: 8,
            barracks: 8,
            combat_forge: 8,
            military_academy: 4,
          },
          queue: [
            {
              buildingId: 'combat_forge',
              targetLevel: 9,
              startedAtMs: 4_000,
              endsAtMs: 8_000,
              costPaid: { ore: 100, stone: 100, iron: 100 },
              populationCostPaid: 3,
            },
          ],
          troops: {
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
          },
          trainingQueue: [],
          researchQueue: [],
          completedResearch: [],
          activePolicy: null,
          intelReadiness: 0,
          intelProjects: [],
        },
      }),
    );

    const snapshot = loadCityEconomyState(context, 6_000);
    expect(snapshot.economy.queue).toEqual([]);
    expect(snapshot.economy.levels.armament_factory).toBe(0);
    expect((snapshot.economy.levels as Record<string, number>).combat_forge).toBeUndefined();
    expect((snapshot.economy.levels as Record<string, number>).military_academy).toBeUndefined();
  });

  it('migrates legacy research ids to canonical ids on load and deduplicates', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        [context.cityId]: {
          cityId: context.cityId,
          ownerId: context.ownerId,
          planetId: context.planetId,
          sectorId: context.sectorId,
          resources: { ore: 0, stone: 0, iron: 0 },
          lastResourceUpdateAtMs: 5_000,
          levels: {
            hq: 12,
            mine: 1,
            quarry: 1,
            refinery: 1,
            warehouse: 1,
            housing_complex: 1,
            barracks: 1,
            space_dock: 1,
            defensive_wall: 0,
            skyshield_battery: 0,
            armament_factory: 0,
            intelligence_center: 0,
            research_lab: 10,
            market: 0,
            council_chamber: 0,
          },
          queue: [],
          troops: {
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
          },
          trainingQueue: [],
          researchQueue: [
            {
              researchId: 'slinger',
              startedAtMs: 4_000,
              endsAtMs: 8_000,
              costPaid: { ore: 300, stone: 500, iron: 200 },
            },
            {
              researchId: 'signals_intel',
              startedAtMs: 4_000,
              endsAtMs: 8_000,
              costPaid: { ore: 2500, stone: 3000, iron: 5100 },
            },
            {
              researchId: 'unknown_research_id',
              startedAtMs: 4_000,
              endsAtMs: 8_000,
              costPaid: { ore: 1, stone: 1, iron: 1 },
            },
          ],
          completedResearch: ['booty', 'market_logistics', 'villagers_loyalty', 'slinger', 'railgun_skirmisher', 'unknown_research_id'],
          activePolicy: null,
          militia: null,
          intelReadiness: 0,
          intelProjects: [],
          spyVaultSilver: 0,
          espionageMissions: [],
          espionageReports: [],
        },
      }),
    );

    const snapshot = loadCityEconomyState(context, 6_000);
    expect(snapshot.economy.researchQueue.map((entry) => entry.researchId)).toEqual(['railgun_skirmisher', 'cryptography']);
    expect(snapshot.economy.completedResearch).toContain('market_logistics');
    expect(snapshot.economy.completedResearch).toContain('workforce_loyalty');
    expect(snapshot.economy.completedResearch).toContain('railgun_skirmisher');
    expect(snapshot.economy.completedResearch).not.toContain('booty');
    expect(snapshot.economy.completedResearch).not.toContain('villagers_loyalty');
    expect(snapshot.economy.completedResearch).not.toContain('unknown_research_id');
    expect(snapshot.economy.completedResearch.filter((id) => id === 'railgun_skirmisher')).toHaveLength(1);
  });
});
