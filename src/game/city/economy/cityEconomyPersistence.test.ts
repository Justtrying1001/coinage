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
});
