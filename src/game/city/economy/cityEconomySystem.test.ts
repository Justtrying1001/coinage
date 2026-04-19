import { describe, expect, it } from 'vitest';
import {
  CITY_ECONOMY_CONFIG,
} from '@/game/city/economy/cityEconomyConfig';
import {
  canSetPolicy,
  canStartConstruction,
  canStartResearch,
  canStartTroopTraining,
  activateMilitia,
  applyMilitiaDefensiveLosses,
  canSendMilitiaOnAttack,
  canTransferMilitia,
  createInitialCityEconomyState,
  getCityDerivedStats,
  getEconomyBuildingOrder,
  getMilitiaMaxSize,
  getMilitiaProductionMultiplier,
  getMilitaryBuildingOrder,
  isMilitiaActive,
  resolveMilitiaExpiration,
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

  it('keeps requiredResearch metadata non-blocking while enforcement flag is disabled', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-r', owner: 'p1', nowMs: 0 });
    state.resources = { ore: 9999, stone: 9999, iron: 9999 };
    state.levels.barracks = 1;

    expect(CITY_ECONOMY_CONFIG.troopResearchEnforcementEnabled).toBe(false);
    expect(canStartTroopTraining(state, 'phalanx_lancer', 1).ok).toBe(true);
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

  it('keeps economy/military prerequisite integrity for key progression gates', () => {
    expect(CITY_ECONOMY_CONFIG.buildings.refinery.prerequisites).toEqual([{ buildingId: 'mine', minLevel: 1 }]);
    expect(CITY_ECONOMY_CONFIG.buildings.market.prerequisites).toEqual([{ buildingId: 'warehouse', minLevel: 5 }]);
    expect(CITY_ECONOMY_CONFIG.buildings.barracks.prerequisites).toEqual([
      { buildingId: 'refinery', minLevel: 1 },
      { buildingId: 'housing_complex', minLevel: 3 },
      { buildingId: 'mine', minLevel: 1 },
    ]);
    expect(CITY_ECONOMY_CONFIG.buildings.space_dock.prerequisites).toEqual([
      { buildingId: 'mine', minLevel: 15 },
      { buildingId: 'refinery', minLevel: 10 },
    ]);
    expect(CITY_ECONOMY_CONFIG.buildings.intelligence_center.prerequisites).toEqual([
      { buildingId: 'market', minLevel: 4 },
      { buildingId: 'warehouse', minLevel: 7 },
    ]);
  });

  it('keeps troop category and production-building wiring coherent', () => {
    const groundTroops = ['infantry', 'phalanx_lancer', 'marksman', 'assault', 'shield_guard', 'raider_cavalry', 'breacher'] as const;
    groundTroops.forEach((troopId) => {
      const troop = CITY_ECONOMY_CONFIG.troops[troopId];
      expect(troop.category).toBe('ground');
      expect(troop.requiredBuildingId).toBe('barracks');
      expect(troop.attackType === 'blunt' || troop.attackType === 'sharp' || troop.attackType === 'distance').toBe(true);
      expect(troop.trainingSeconds).toBeGreaterThan(0);
      expect(troop.populationCost).toBeGreaterThan(0);
      expect(troop.cost.ore + troop.cost.stone + troop.cost.iron).toBeGreaterThan(0);
    });

    const navalTroops = [
      'assault_convoy',
      'swift_carrier',
      'interception_sentinel',
      'ember_drifter',
      'rapid_escort',
      'bulwark_trireme',
      'colonization_convoy',
    ] as const;
    navalTroops.forEach((troopId) => {
      const troop = CITY_ECONOMY_CONFIG.troops[troopId];
      expect(troop.category).toBe('naval');
      expect(troop.requiredBuildingId).toBe('space_dock');
      expect(troop.trainingSeconds).toBeGreaterThan(0);
      expect(troop.populationCost).toBeGreaterThan(0);
    });

    expect(CITY_ECONOMY_CONFIG.troops.citizen_militia.category).toBe('militia');
    expect(canStartTroopTraining(createInitialCityEconomyState({ cityId: 'm1', owner: 'p1', nowMs: 0 }), 'citizen_militia', 1).ok).toBe(false);
  });

  it('activates militia from housing_complex and applies capped size formula', () => {
    const state = createInitialCityEconomyState({ cityId: 'm2', owner: 'p1', nowMs: 0 });
    state.levels.housing_complex = 30;
    expect(getMilitiaMaxSize(state)).toBe(250);
    expect(activateMilitia(state, 100).ok).toBe(true);
    expect(state.militia.initialMilitia).toBe(250);
    expect(state.militia.sourceBuildingLevelSnapshot).toBe(25);
    expect(activateMilitia(state, 101)).toEqual({ ok: false, reason: 'Militia already active' });
  });

  it('applies production malus and resolves militia expiration/losses', () => {
    const state = createInitialCityEconomyState({ cityId: 'm3', owner: 'p1', nowMs: 0 });
    state.levels.housing_complex = 10;
    expect(activateMilitia(state, 1_000).ok).toBe(true);
    expect(isMilitiaActive(state, 1_500)).toBe(true);
    expect(getMilitiaProductionMultiplier(state, 1_500)).toBe(0.5);
    expect(applyMilitiaDefensiveLosses(state, 12, 2_000)).toBe(12);
    expect(state.militia.currentMilitia).toBe(88);
    expect(resolveMilitiaExpiration(state, 1_000 + 3 * 60 * 60 * 1000 + 1)).toBe(true);
    expect(isMilitiaActive(state, 1_000 + 3 * 60 * 60 * 1000 + 1)).toBe(false);
    expect(state.militia.currentMilitia).toBe(0);
  });

  it('never allows militia attack/transfer usage', () => {
    expect(canSendMilitiaOnAttack()).toBe(false);
    expect(canTransferMilitia()).toBe(false);
  });

  it('supports militia bonus hook without requiring full research-lab completion flow', () => {
    const state = createInitialCityEconomyState({ cityId: 'm4', owner: 'p1', nowMs: 0 });
    state.levels.housing_complex = 10;
    expect(getMilitiaMaxSize(state)).toBe(100);
    state.completedResearch.push('war_protocols');
    expect(getMilitiaMaxSize(state)).toBe(150);
  });
});
