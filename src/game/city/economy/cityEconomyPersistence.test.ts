// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { CITY_ECONOMY_CONFIG } from '@/game/city/economy/cityEconomyConfig';
import {
  activateCityMilitia,
  applyCityMilitiaDefensiveLosses,
  clearCityEconomyPersistenceForTests,
  depositCitySpySilver,
  loadCityEconomyState,
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

  it('resolves espionage with Grepolis-like silver comparison and cave depletion on failure', () => {
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
      watch_tower: 0,
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
        trainingQueue: [], researchQueue: [], completedResearch: [], activePolicy: null, militia: null, intelReadiness: 0, intelProjects: [], spyVaultSilver: 0, espionageMissions: [], espionageReports: [],
      },
      [rivalContext.cityId]: {
        cityId: rivalContext.cityId, ownerId: rivalContext.ownerId, planetId: rivalContext.planetId, sectorId: rivalContext.sectorId,
        resources: { ore: 3_000, stone: 3_000, iron: 3_000 }, lastResourceUpdateAtMs: 1_000, levels: baseLevels, queue: [], troops: emptyTroops,
        trainingQueue: [], researchQueue: [], completedResearch: [], activePolicy: null, militia: null, intelReadiness: 0, intelProjects: [], spyVaultSilver: 0, espionageMissions: [], espionageReports: [],
      },
    }));

    depositCitySpySilver(context, 1_500, 100_100);
    depositCitySpySilver(rivalContext, 1_200, 100_100);
    sendCityEspionageMission(context, rivalContext.cityId, 1_000, 100_200);

    const atkResolved = loadCityEconomyState(context, 100_200 + 16 * 60 * 1000);
    const defResolved = loadCityEconomyState(rivalContext, 100_200 + 16 * 60 * 1000);
    expect(atkResolved.economy.espionageReports[0].kind).toBe('attack_failed');
    expect(defResolved.economy.spyVaultSilver).toBe(200);
    expect(defResolved.economy.espionageReports[0].kind).toBe('defense_failed_attempt');
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
});
