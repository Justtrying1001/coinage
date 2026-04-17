// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { CITY_ECONOMY_CONFIG } from '@/game/city/economy/cityEconomyConfig';
import {
  clearCityEconomyPersistenceForTests,
  loadCityEconomyState,
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
  });

  it('persists construction queue updates across reloads', () => {
    const started = startCityBuildingUpgrade(context, 'mine', 2_000);
    expect(started.guard.ok).toBe(true);

    const reloaded = loadCityEconomyState(context, 2_100);
    expect(reloaded.economy.queue.length).toBe(1);
    expect(reloaded.economy.queue[0].buildingId).toBe('mine');
  });

  it('keeps guards active for locked troop/research/intel actions until unlocked', () => {
    const training = startCityTroopTraining(context, 'infantry', 1, 3_000);
    expect(training.guard.ok).toBe(false);

    const research = startCityResearch(context, 'economy_drills', 3_000);
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
            infantry: 0,
            shield_guard: 0,
            marksman: 0,
            raider_cavalry: 0,
            assault: 0,
            breacher: 0,
            interception_sentinel: 0,
            rapid_escort: 0,
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
