import { describe, expect, it } from 'vitest';
import {
  canSetPolicy,
  canStartConstruction,
  canStartResearch,
  canStartTroopTraining,
  createInitialCityEconomyState,
  getCityDerivedStats,
  getEconomyBuildingOrder,
  getMilitaryBuildingOrder,
  resolveCompletedIntelProjects,
  resolveCompletedResearch,
  resolveCompletedTraining,
  setActivePolicy,
  startIntelProject,
  startResearch,
  startTroopTraining,
} from '@/game/city/economy/cityEconomySystem';

describe('cityEconomySystem MVP MICRO full standard building loop', () => {
  it('initial state contains all standard building levels', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-1', owner: 'p1', nowMs: 0 });
    expect(getEconomyBuildingOrder()).toHaveLength(15);
    getEconomyBuildingOrder().forEach((buildingId) => {
      expect(state.levels[buildingId]).toBeDefined();
    });
  });

  it('enforces unlock chains for newly active standard branches', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-1', owner: 'p1', nowMs: 0 });
    state.resources = { ore: 9_999_999, stone: 9_999_999, iron: 9_999_999 };

    expect(canStartConstruction(state, 'defensive_wall')).toEqual({ ok: false, reason: 'Requires HQ 5' });
    state.levels.hq = 5;
    expect(canStartConstruction(state, 'defensive_wall').ok).toBe(true);

    expect(canStartConstruction(state, 'watch_tower')).toEqual({ ok: false, reason: 'Requires HQ 12' });
    state.levels.hq = 12;
    expect(canStartConstruction(state, 'watch_tower')).toEqual({ ok: false, reason: 'Requires defensive_wall 15' });
  });

  it('supports troop training loop and resolves queue', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-1', owner: 'p1', nowMs: 0 });
    state.resources = { ore: 9999, stone: 9999, iron: 9999 };
    state.levels.hq = 2;
    state.levels.housing_complex = 2;
    state.levels.barracks = 1;

    expect(canStartTroopTraining(state, 'infantry', 2).ok).toBe(true);
    expect(startTroopTraining(state, 'infantry', 2, 0).ok).toBe(true);
    const entry = state.trainingQueue[0];
    expect(resolveCompletedTraining(state, entry.endsAtMs - 1)).toBe(false);
    expect(resolveCompletedTraining(state, entry.endsAtMs)).toBe(true);
    expect(state.troops.infantry).toBe(2);
  });

  it('supports research queue persistence model and bonuses', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-1', owner: 'p1', nowMs: 0 });
    state.resources = { ore: 9999, stone: 9999, iron: 9999 };
    state.levels.hq = 4;
    state.levels.warehouse = 4;
    state.levels.research_lab = 6;

    expect(canStartResearch(state, 'economy_drills').ok).toBe(true);
    expect(startResearch(state, 'economy_drills', 0).ok).toBe(true);
    const entry = state.researchQueue[0];
    expect(resolveCompletedResearch(state, entry.endsAtMs)).toBe(true);
    expect(state.completedResearch).toContain('economy_drills');

    const stats = getCityDerivedStats(state);
    expect(stats.productionPct).toBeGreaterThan(0);
  });

  it('supports governance policy persistence and bonuses', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-1', owner: 'p1', nowMs: 0 });
    state.levels.hq = 8;
    state.levels.warehouse = 5;
    state.levels.research_lab = 5;
    state.levels.market = 4;
    state.levels.council_chamber = 3;

    expect(canSetPolicy(state, 'martial_law').ok).toBe(true);
    expect(setActivePolicy(state, 'martial_law').ok).toBe(true);
    const stats = getCityDerivedStats(state);
    expect(stats.trainingSpeedPct).toBeGreaterThan(0);
    expect(stats.cityDefensePct).toBeGreaterThan(0);
  });

  it('supports intelligence readiness projects with derived detection/counter-intel', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-1', owner: 'p1', nowMs: 0 });
    state.levels.hq = 6;
    state.levels.defensive_wall = 2;
    state.levels.watch_tower = 3;
    state.levels.warehouse = 7;
    state.levels.market = 4;
    state.levels.intelligence_center = 3;

    expect(startIntelProject(state, 'sweep', 0).ok).toBe(true);
    const entry = state.intelProjects[0];
    expect(resolveCompletedIntelProjects(state, entry.endsAtMs)).toBe(true);
    expect(state.intelReadiness).toBeGreaterThan(0);

    const stats = getCityDerivedStats(state);
    expect(stats.detectionPct).toBeGreaterThan(0);
    expect(stats.counterIntelPct).toBeGreaterThan(0);
  });

  it('exposes all military branch buildings in order helper', () => {
    expect(getMilitaryBuildingOrder()).toEqual(['barracks', 'space_dock', 'armament_factory']);
  });
});
