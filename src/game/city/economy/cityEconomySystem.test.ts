import { describe, expect, it } from 'vitest';
import {
  CITY_ECONOMY_CONFIG,
} from '@/game/city/economy/cityEconomyConfig';
import {
  canSetPolicy,
  canStartConstruction,
  getConstructionCostResources,
  getStorageCaps,
  getProductionPerHour,
  getPopulationSnapshot,
  getBuildingLevel,
  getDefensiveWallGroundBonuses,
  getAirDefenseStatsWithBattery,
  getGroundDefenseStatsWithWall,
  getSkyshieldBatteryAirBonuses,
  evaluateEspionageOutcome,
  getDefenderEffectiveSpyDefense,
  getMarketShipmentCapacity,
  canStartResearch,
  canSendResourceTransfer,
  canStartIntelProject,
  canStartTroopTraining,
  activateMilitia,
  applyClaimOnAccess,
  applyMilitiaDefensiveLosses,
  canSendMilitiaOnAttack,
  canTransferMilitia,
  canStartEspionageMission,
  canDepositSpySilver,
  createInitialCityEconomyState,
  depositSpySilver,
  getCityDerivedStats,
  getConstructionDurationSeconds,
  getEconomyBuildingOrder,
  getMilitiaMaxSize,
  getMilitiaProductionMultiplier,
  getMilitaryBuildingOrder,
  getSpyVaultCap,
  isMilitiaActive,
  resolveMilitiaExpiration,
  resolveCompletedIntelProjects,
  resolveCompletedResearch,
  resolveCompletedTraining,
  startEspionageMission,
  setActivePolicy,
  startIntelProject,
  startResearch,
  startTroopTraining,
  startConstruction,
  resolveCompletedConstruction,
  sendResourceTransfer,
} from '@/game/city/economy/cityEconomySystem';

describe('cityEconomySystem MVP MICRO full standard building loop', () => {
  it('initial state contains all standard building levels', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-1', owner: 'p1', nowMs: 0 });
    expect(getEconomyBuildingOrder()).toHaveLength(15);
    getEconomyBuildingOrder().forEach((buildingId) => {
      expect(state.levels[buildingId]).toBeDefined();
    });
  });


  it('applies mine orePerHour by level in runtime production snapshot', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-mine-prod', owner: 'p1', nowMs: 0 });

    state.levels.mine = 1;
    const level1 = getProductionPerHour(state).ore;
    expect(level1).toBe(8);

    state.levels.mine = 2;
    const level2 = getProductionPerHour(state).ore;
    expect(level2).toBe(12);
    expect(level2).toBeGreaterThan(level1);
  });

  it('claims offline mine production and clamps ore at storage cap', () => {
    const nowMs = 60 * 60 * 1000;
    const state = createInitialCityEconomyState({ cityId: 'c-mine-claim', owner: 'p1', nowMs: 0 });

    state.levels.mine = 1;
    state.resources = { ore: 299, stone: 0, iron: 0 };

    applyClaimOnAccess(state, nowMs);

    expect(state.resources.ore).toBe(300);
    expect(state.resources.stone).toBe(8);
    expect(state.resources.iron).toBe(0);
  });


  it('applies quarry stonePerHour by level in runtime production snapshot', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-quarry-prod', owner: 'p1', nowMs: 0 });

    state.levels.quarry = 1;
    const level1 = getProductionPerHour(state).stone;
    expect(level1).toBe(8);

    state.levels.quarry = 2;
    const level2 = getProductionPerHour(state).stone;
    expect(level2).toBe(12);
    expect(level2).toBeGreaterThan(level1);
  });

  it('claims offline quarry production and clamps stone at storage cap', () => {
    const nowMs = 60 * 60 * 1000;
    const state = createInitialCityEconomyState({ cityId: 'c-quarry-claim', owner: 'p1', nowMs: 0 });

    state.levels.quarry = 1;
    state.resources = { ore: 0, stone: 299, iron: 0 };

    applyClaimOnAccess(state, nowMs);

    expect(state.resources.ore).toBe(8);
    expect(state.resources.stone).toBe(300);
    expect(state.resources.iron).toBe(0);
  });


  it('increases storage caps with warehouse progression', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-warehouse-cap', owner: 'p1', nowMs: 0 });

    state.levels.warehouse = 1;
    const cap1 = getStorageCaps(state);
    expect(cap1).toEqual({ ore: 300, stone: 300, iron: 300 });

    state.levels.warehouse = 2;
    const cap2 = getStorageCaps(state);
    expect(cap2).toEqual({ ore: 711, stone: 711, iron: 711 });
    expect(cap2.ore).toBeGreaterThan(cap1.ore);
  });

  it('uses current-level housing_complex row for population cap progression', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-housing-cap', owner: 'p1', nowMs: 0 });

    state.levels.housing_complex = 1;
    const cap1 = getPopulationSnapshot(state).cap;
    expect(cap1).toBe(114);

    state.levels.housing_complex = 2;
    const cap2 = getPopulationSnapshot(state).cap;
    expect(cap2).toBe(121);
    expect(cap2).toBeGreaterThan(cap1);
  });

  it('requires zero incremental population for housing_complex upgrades', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-housing-pop-req', owner: 'p1', nowMs: 0 });
    state.resources = { ore: 9_999, stone: 9_999, iron: 9_999 };

    state.levels.housing_complex = 0;
    expect(getPopulationSnapshot(state).free).toBe(0);

    expect(canStartConstruction(state, 'housing_complex').ok).toBe(true);
  });

  it('uses current-level population occupancy for warehouse (levels 1 -> 2 -> 3)', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-warehouse-pop', owner: 'p1', nowMs: 0 });
    state.levels = {
      ...state.levels,
      hq: 1,
      mine: 0,
      quarry: 0,
      refinery: 0,
      warehouse: 0,
      housing_complex: 45,
      barracks: 0,
      space_dock: 0,
      defensive_wall: 0,
      skyshield_battery: 0,
      armament_factory: 0,
      intelligence_center: 0,
      research_lab: 0,
      market: 0,
      council_chamber: 0,
    };

    state.levels.warehouse = 1;
    expect(getPopulationSnapshot(state).breakdown.buildingUsed).toBe(1); // HQ(1)+Warehouse(0)
    state.levels.warehouse = 2;
    expect(getPopulationSnapshot(state).breakdown.buildingUsed).toBe(1); // HQ(1)+Warehouse(0)
    state.levels.warehouse = 3;
    expect(getPopulationSnapshot(state).breakdown.buildingUsed).toBe(1); // HQ(1)+Warehouse(0)
  });

  it('requires zero incremental population for warehouse upgrades', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-warehouse-pop-req', owner: 'p1', nowMs: 0 });
    state.resources = { ore: 9_999, stone: 9_999, iron: 9_999 };

    // Force free population to 0.
    state.levels.housing_complex = 0;
    expect(getPopulationSnapshot(state).free).toBe(0);

    // warehouse 1->2 has targetPop=0 and currentPop=0 => required delta = 0.
    expect(canStartConstruction(state, 'warehouse').ok).toBe(true);
  });

  it('blocks construction when population free is insufficient', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-pop-block', owner: 'p1', nowMs: 0 });
    state.resources = { ore: 9_999, stone: 9_999, iron: 9_999 };

    // Remove housing cap to force free population to 0.
    state.levels.housing_complex = 0;

    expect(getPopulationSnapshot(state).free).toBe(0);
    expect(canStartConstruction(state, 'mine')).toEqual({ ok: false, reason: 'Not enough population' });
    expect(canStartConstruction(state, 'quarry')).toEqual({ ok: false, reason: 'Not enough population' });
    expect(canStartConstruction(state, 'hq')).toEqual({ ok: false, reason: 'Not enough population' });
  });


  it('computes building population from current level row only (HQ/Mine examples)', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-pop-level-cost', owner: 'p1', nowMs: 0 });
    state.levels = {
      ...state.levels,
      hq: 1,
      mine: 0,
      quarry: 0,
      refinery: 0,
      warehouse: 0,
      housing_complex: 45,
      barracks: 0,
      space_dock: 0,
      defensive_wall: 0,
      skyshield_battery: 0,
      armament_factory: 0,
      intelligence_center: 0,
      research_lab: 0,
      market: 0,
      council_chamber: 0,
    };

    state.levels.hq = 1;
    expect(getPopulationSnapshot(state).breakdown.buildingUsed).toBe(1);
    state.levels.hq = 2;
    expect(getPopulationSnapshot(state).breakdown.buildingUsed).toBe(2);
    state.levels.hq = 3;
    expect(getPopulationSnapshot(state).breakdown.buildingUsed).toBe(3);

    state.levels.hq = 1;
    state.levels.mine = 1;
    expect(getPopulationSnapshot(state).breakdown.buildingUsed).toBe(2); // HQ(1) + Mine(1)
    state.levels.mine = 2;
    expect(getPopulationSnapshot(state).breakdown.buildingUsed).toBe(3); // HQ(1) + Mine(2)
    state.levels.mine = 3;
    expect(getPopulationSnapshot(state).breakdown.buildingUsed).toBe(3); // HQ(1) + Mine(1+2+2)
  });


  it('requires incremental population only for construction upgrades', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-pop-increment', owner: 'p1', nowMs: 0 });
    state.levels.housing_complex = 1;
    state.levels.hq = 1;
    state.levels.mine = 1;
    state.levels.quarry = 1;
    state.levels.warehouse = 1;
    state.resources = { ore: 9_999, stone: 9_999, iron: 9_999 };

    // Cap=114, used at start=3 => free=111. Force exactly +1 free.
    state.troops.line_infantry = 110;
    expect(getPopulationSnapshot(state).free).toBe(1);

    // mine 1->2: target=2, current=1 => requires +1 (should pass)
    expect(canStartConstruction(state, 'mine').ok).toBe(true);

    // hq 1->2: target=2, current=1 => requires +1 (should pass)
    expect(canStartConstruction(state, 'hq').ok).toBe(true);
  });


  it('applies refinery ironPerHour by level in runtime production snapshot', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-refinery-prod', owner: 'p1', nowMs: 0 });

    state.levels.refinery = 1;
    const level1 = getProductionPerHour(state).iron;
    expect(level1).toBe(8);

    state.levels.refinery = 2;
    const level2 = getProductionPerHour(state).iron;
    expect(level2).toBe(12);
    expect(level2).toBeGreaterThan(level1);
  });

  it('claims offline refinery production and clamps iron at storage cap', () => {
    const nowMs = 60 * 60 * 1000;
    const state = createInitialCityEconomyState({ cityId: 'c-refinery-claim', owner: 'p1', nowMs: 0 });

    state.levels.refinery = 1;
    state.resources = { ore: 0, stone: 0, iron: 299 };

    applyClaimOnAccess(state, nowMs);

    expect(state.resources.ore).toBe(8);
    expect(state.resources.stone).toBe(8);
    expect(state.resources.iron).toBe(300);
  });

  it('uses current-level population occupancy for refinery (levels 1 -> 2 -> 3)', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-refinery-pop', owner: 'p1', nowMs: 0 });
    state.levels = {
      ...state.levels,
      hq: 1,
      mine: 0,
      quarry: 0,
      refinery: 0,
      warehouse: 0,
      housing_complex: 45,
      barracks: 0,
      space_dock: 0,
      defensive_wall: 0,
      skyshield_battery: 0,
      armament_factory: 0,
      intelligence_center: 0,
      research_lab: 0,
      market: 0,
      council_chamber: 0,
    };

    state.levels.refinery = 1;
    expect(getPopulationSnapshot(state).breakdown.buildingUsed).toBe(2); // HQ(1)+Refinery(1)
    state.levels.refinery = 2;
    expect(getPopulationSnapshot(state).breakdown.buildingUsed).toBe(3); // HQ(1)+Refinery(2)
    state.levels.refinery = 3;
    expect(getPopulationSnapshot(state).breakdown.buildingUsed).toBe(3); // HQ(1)+Refinery(2)
  });

  it('requires incremental population only for refinery upgrade', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-refinery-pop-req', owner: 'p1', nowMs: 0 });
    state.levels.housing_complex = 1;
    state.levels.hq = 1;
    state.levels.mine = 1;
    state.levels.quarry = 1;
    state.levels.warehouse = 1;
    state.levels.refinery = 1;
    state.resources = { ore: 9_999, stone: 9_999, iron: 9_999 };

    // Base used = HQ1 + mine1 + quarry1 + refinery1 = 4, cap=114, free=110.
    // Force exactly +1 free; refinery 1->2 requires +1 (2-1).
    state.troops.line_infantry = 109;
    expect(getPopulationSnapshot(state).free).toBe(1);
    expect(canStartConstruction(state, 'refinery').ok).toBe(true);
  });

  it('uses current-level population occupancy for defensive_wall and incremental upgrade requirement', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-wall-pop', owner: 'p1', nowMs: 0 });
    state.levels = {
      ...state.levels,
      hq: 5,
      housing_complex: 45,
      mine: 1,
      quarry: 1,
      refinery: 1,
      warehouse: 1,
      barracks: 3,
      defensive_wall: 1,
    };
    state.resources = { ore: 9_999, stone: 9_999, iron: 9_999 };

    const usedAtWall1 = getPopulationSnapshot(state).breakdown.buildingUsed;
    state.levels.defensive_wall = 2;
    const usedAtWall2 = getPopulationSnapshot(state).breakdown.buildingUsed;
    expect(usedAtWall2 - usedAtWall1).toBe(2);
    state.levels.defensive_wall = 1;

    // defensive_wall 1->2 uses delta only: 4-2 = 2
    const snapshot = getPopulationSnapshot(state);
    state.troops.line_infantry = snapshot.cap - snapshot.breakdown.buildingUsed - 2;
    expect(getPopulationSnapshot(state).free).toBe(2);
    expect(canStartConstruction(state, 'defensive_wall').ok).toBe(true);
  });

  it('uses current-level population occupancy for skyshield_battery and incremental upgrade requirement', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-tower-pop', owner: 'p1', nowMs: 0 });
    state.levels = {
      ...state.levels,
      hq: 12,
      housing_complex: 45,
      mine: 15,
      quarry: 1,
      refinery: 10,
      warehouse: 1,
      barracks: 3,
      space_dock: 3,
      skyshield_battery: 1,
    };
    state.resources = { ore: 9_999, stone: 9_999, iron: 9_999 };

    const usedAtTower1 = getPopulationSnapshot(state).breakdown.buildingUsed;
    state.levels.skyshield_battery = 2;
    const usedAtTower2 = getPopulationSnapshot(state).breakdown.buildingUsed;
    expect(usedAtTower2 - usedAtTower1).toBe(2);
    state.levels.skyshield_battery = 1;

    const snapshot = getPopulationSnapshot(state);
    state.troops.line_infantry = snapshot.cap - snapshot.breakdown.buildingUsed - 2;
    expect(getPopulationSnapshot(state).free).toBe(2);
    expect(canStartConstruction(state, 'skyshield_battery').ok).toBe(true);
  });

  it('surfaces defensive_wall effects in derived stats with exact runtime values', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-wall-derived', owner: 'p1', nowMs: 0 });
    state.levels.hq = 5;
    state.levels.barracks = 3;
    state.levels.defensive_wall = 1;

    const wall = getDefensiveWallGroundBonuses(state);
    expect(wall.groundWallDefensePct).toBeCloseTo(3.7);
    expect(wall.groundWallBaseDefense).toBeCloseTo(1.5);
  });

  it('enforces unlock chains for newly active standard branches', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-1', owner: 'p1', nowMs: 0 });
    state.resources = { ore: 9_999_999, stone: 9_999_999, iron: 9_999_999 };

    expect(canStartConstruction(state, 'defensive_wall')).toEqual({ ok: false, reason: 'Requires HQ 5' });
    state.levels.hq = 5;
    expect(canStartConstruction(state, 'defensive_wall')).toEqual({ ok: false, reason: 'Requires barracks 3' });
    state.levels.barracks = 3;
    expect(canStartConstruction(state, 'defensive_wall').ok).toBe(true);

    expect(canStartConstruction(state, 'skyshield_battery')).toEqual({ ok: false, reason: 'Requires HQ 12' });
    state.levels.hq = 12;
    expect(canStartConstruction(state, 'skyshield_battery')).toEqual({ ok: false, reason: 'Requires space_dock 3' });
    state.levels.space_dock = 3;
    expect(canStartConstruction(state, 'skyshield_battery').ok).toBe(true);
  });

  it('enforces armament_factory prerequisites in runtime guard order', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-armament-guard', owner: 'p1', nowMs: 0 });
    state.resources = { ore: 9_999, stone: 9_999, iron: 9_999 };

    expect(canStartConstruction(state, 'armament_factory')).toEqual({ ok: false, reason: 'Requires HQ 8' });
    state.levels.hq = 8;
    expect(canStartConstruction(state, 'armament_factory')).toEqual({ ok: false, reason: 'Requires research_lab 10' });
    state.levels.research_lab = 10;
    expect(canStartConstruction(state, 'armament_factory')).toEqual({ ok: false, reason: 'Requires barracks 10' });
    state.levels.barracks = 10;
    expect(canStartConstruction(state, 'armament_factory').ok).toBe(true);
  });

  it('enforces market prerequisites and uses incremental population for market upgrades', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-market-guard', owner: 'p1', nowMs: 0 });
    state.resources = { ore: 9_999_999, stone: 9_999_999, iron: 9_999_999 };

    expect(canStartConstruction(state, 'market')).toEqual({ ok: false, reason: 'Requires HQ 3' });
    state.levels.hq = 3;
    expect(canStartConstruction(state, 'market')).toEqual({ ok: false, reason: 'Requires warehouse 5' });
    state.levels.warehouse = 5;
    expect(canStartConstruction(state, 'market').ok).toBe(true);

    state.levels = {
      ...state.levels,
      housing_complex: 45,
      market: 1,
    };

    const usedAtL1 = getPopulationSnapshot(state).breakdown.buildingUsed;
    state.levels.market = 2;
    const usedAtL2 = getPopulationSnapshot(state).breakdown.buildingUsed;
    expect(usedAtL2 - usedAtL1).toBe(2); // 4 - 2
  });

  it('uses market level as shipment-capacity source of truth', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-market-derived', owner: 'p1', nowMs: 0 });
    state.levels.market = 4;
    expect(getMarketShipmentCapacity(state)).toBe(2000);
    state.levels.market = 10;
    expect(getMarketShipmentCapacity(state)).toBe(5000);
  });

  it('enforces council_chamber construction prerequisites/max level and keeps policies ungated by council in transitional runtime', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-council-guard', owner: 'p1', nowMs: 0 });
    state.resources = { ore: 9_999_999, stone: 9_999_999, iron: 9_999_999 };

    expect(canStartConstruction(state, 'council_chamber')).toEqual({ ok: false, reason: 'Requires HQ 15' });
    state.levels.hq = 15;
    expect(canStartConstruction(state, 'council_chamber')).toEqual({ ok: false, reason: 'Requires market 10' });
    state.levels.market = 10;
    expect(canStartConstruction(state, 'council_chamber')).toEqual({ ok: false, reason: 'Requires research_lab 15' });
    state.levels.research_lab = 15;
    expect(canStartConstruction(state, 'council_chamber').ok).toBe(true);

    state.levels.council_chamber = 25;
    expect(canStartConstruction(state, 'council_chamber')).toEqual({ ok: false, reason: 'Max level' });

    state.levels.council_chamber = 0;
    expect(canSetPolicy(state, 'martial_law').ok).toBe(true);
  });

  it('removes all council_chamber local passive contributions from derived stats and construction duration', () => {
    const low = createInitialCityEconomyState({ cityId: 'c-council-none-1', owner: 'p1', nowMs: 0 });
    const high = createInitialCityEconomyState({ cityId: 'c-council-none-2', owner: 'p1', nowMs: 0 });
    low.levels.council_chamber = 0;
    high.levels.council_chamber = 25;

    const lowStats = getCityDerivedStats(low);
    const highStats = getCityDerivedStats(high);
    expect(highStats.buildSpeedPct - lowStats.buildSpeedPct).toBeCloseTo(0, 6);
    expect(highStats.cityDefensePct - lowStats.cityDefensePct).toBeCloseTo(0, 6);

    expect(getConstructionDurationSeconds(low, 'warehouse', 2)).toBe(getConstructionDurationSeconds(high, 'warehouse', 2));
  });

  it('keeps marketEfficiencyPct as research-only aggregate (market building no longer primary source)', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-market-eff-research', owner: 'p1', nowMs: 0 });
    state.levels.market = 4;
    state.completedResearch.push('market_logistics', 'ceramics', 'cartography'); // +6 +4 +4

    const stats = getCityDerivedStats(state);
    expect(stats.marketEfficiencyPct).toBeCloseTo(14, 6);
  });

  it('enforces shipment capacity and resource checks on resource transfer dispatch', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-market-transfer', owner: 'p1', nowMs: 0 });
    state.levels.hq = 3;
    state.levels.warehouse = 5;
    state.levels.market = 1; // cap 500
    state.resources = { ore: 2_000, stone: 2_000, iron: 2_000 };

    expect(canSendResourceTransfer(state, '', { ore: 100, stone: 0, iron: 0 })).toEqual({ ok: false, reason: 'Target city required' });
    expect(canSendResourceTransfer(state, 'c-market-transfer', { ore: 100, stone: 0, iron: 0 })).toEqual({
      ok: false,
      reason: 'Cannot target own city',
    });
    expect(canSendResourceTransfer(state, 'target-city', { ore: 0, stone: 0, iron: 0 })).toEqual({
      ok: false,
      reason: 'Transfer amount must be greater than 0',
    });
    expect(canSendResourceTransfer(state, 'target-city', { ore: 600, stone: 0, iron: 0 })).toEqual({
      ok: false,
      reason: 'Transfer exceeds shipment capacity (500)',
    });

    expect(sendResourceTransfer(state, 'target-city', { ore: 400, stone: 50, iron: 50 }, 1234)).toEqual({
      ok: true,
      transfer: {
        sourceCityId: 'c-market-transfer',
        targetCityId: 'target-city',
        resources: { ore: 400, stone: 50, iron: 50 },
        totalAmount: 500,
        shipmentCapacityAtDispatch: 500,
        dispatchedAtMs: 1234,
      },
    });
    expect(state.resources).toEqual({ ore: 1_600, stone: 1_950, iron: 1_950 });
  });

  it('uses current-level population occupancy and incremental upgrade requirement for armament_factory', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-armament-pop', owner: 'p1', nowMs: 0 });
    state.levels = {
      ...state.levels,
      hq: 8,
      housing_complex: 45,
      mine: 1,
      quarry: 1,
      refinery: 1,
      warehouse: 1,
      barracks: 10,
      research_lab: 10,
      armament_factory: 1,
    };
    state.resources = { ore: 9_999, stone: 9_999, iron: 9_999 };

    const usedAtL1 = getPopulationSnapshot(state).breakdown.buildingUsed;
    state.levels.armament_factory = 2;
    const usedAtL2 = getPopulationSnapshot(state).breakdown.buildingUsed;
    expect(usedAtL2 - usedAtL1).toBe(3); // 6 - 3
    state.levels.armament_factory = 1;

    const snapshot = getPopulationSnapshot(state);
    state.troops.line_infantry = snapshot.cap - snapshot.breakdown.buildingUsed - 3;
    expect(getPopulationSnapshot(state).free).toBe(3);
    expect(canStartConstruction(state, 'armament_factory').ok).toBe(true);
  });

  it('applies armament_factory effects to derived stats (ground/air combat axes) without training-speed overlap', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-armament-derived', owner: 'p1', nowMs: 0 });
    state.levels.barracks = 1;
    state.levels.armament_factory = 1;

    const stats = getCityDerivedStats(state);
    expect(stats.trainingSpeedPct).toBeCloseTo(0, 6);
    expect(stats.groundAttackPct).toBeCloseTo(0.9, 6);
    expect(stats.groundDefensePct).toBeCloseTo(0, 6);
    expect(stats.airAttackPct).toBeCloseTo(0, 6);
    expect(stats.airDefensePct).toBeCloseTo(0, 6);
  });

  it('armament_factory higher level does not change troop training duration (no training-speed role)', () => {
    const lvl1 = createInitialCityEconomyState({ cityId: 'c-armament-speed-1', owner: 'p1', nowMs: 0 });
    lvl1.resources = { ore: 9_999, stone: 9_999, iron: 9_999 };
    lvl1.levels.housing_complex = 20;
    lvl1.levels.barracks = 1;
    lvl1.levels.armament_factory = 1;
    expect(startTroopTraining(lvl1, 'line_infantry', 1, 0).ok).toBe(true);
    const durationAtL1 = lvl1.trainingQueue[0].endsAtMs;

    const lvl2 = createInitialCityEconomyState({ cityId: 'c-armament-speed-2', owner: 'p1', nowMs: 0 });
    lvl2.resources = { ore: 9_999, stone: 9_999, iron: 9_999 };
    lvl2.levels.housing_complex = 20;
    lvl2.levels.barracks = 1;
    lvl2.levels.armament_factory = 2;
    expect(startTroopTraining(lvl2, 'line_infantry', 1, 0).ok).toBe(true);
    const durationAtL2 = lvl2.trainingQueue[0].endsAtMs;

    expect(durationAtL1).toBe(1_080_000);
    expect(durationAtL2).toBe(1_080_000);
  });

  it('uses L35 as a final all-units tier for armament_factory (ground+air atk/def)', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-armament-l35-all', owner: 'p1', nowMs: 0 });
    state.levels.armament_factory = 35;

    const stats = getCityDerivedStats(state);
    expect(stats.groundAttackPct).toBeGreaterThan(0);
    expect(stats.groundDefensePct).toBeGreaterThan(0);
    expect(stats.airAttackPct).toBeGreaterThan(0);
    expect(stats.airDefensePct).toBeGreaterThan(0);
  });

  it('applies defensive_wall only to barracks units and only in city defense context', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-wall-defense-scope', owner: 'p1', nowMs: 0 });
    state.levels.hq = 5;
    state.levels.barracks = 3;
    state.levels.defensive_wall = 1;

    const barracksCityDefense = getGroundDefenseStatsWithWall(state, 'line_infantry', 'city_defense');
    expect(barracksCityDefense).not.toBeNull();
    expect(barracksCityDefense?.appliesWallBonus).toBe(true);
    expect(barracksCityDefense?.modified.defenseBlunt).toBeCloseTo((14 + 1.5) * 1.037, 6);
    expect(barracksCityDefense?.modified.defenseSharp).toBeCloseTo((8 + 1.5) * 1.037, 6);
    expect(barracksCityDefense?.modified.defenseDistance).toBeCloseTo((30 + 1.5) * 1.037, 6);

    const barracksOffense = getGroundDefenseStatsWithWall(state, 'line_infantry', 'offense');
    expect(barracksOffense?.appliesWallBonus).toBe(false);
    expect(barracksOffense?.modified.defenseBlunt).toBe(14);

    const naval = getGroundDefenseStatsWithWall(state, 'assault_dropship', 'city_defense');
    expect(naval).toBeNull();
  });

  it('applies skyshield_battery only to space_dock units and only in city defense context', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-tower-defense-scope', owner: 'p1', nowMs: 0 });
    state.levels.hq = 12;
    state.levels.space_dock = 3;
    state.levels.skyshield_battery = 1;

    const tower = getSkyshieldBatteryAirBonuses(state);
    expect(tower.airWallDefensePct).toBeCloseTo(2.2);
    expect(tower.airWallBaseDefense).toBeCloseTo(3.3);

    const dockDefense = getAirDefenseStatsWithBattery(state, 'interceptor_sentinel', 'city_defense');
    expect(dockDefense).not.toBeNull();
    expect(dockDefense?.appliesTowerBonus).toBe(true);
    expect(dockDefense?.modifiedAirDefense).toBeCloseTo((160 + 3.3) * 1.022, 6);

    const dockOffense = getAirDefenseStatsWithBattery(state, 'interceptor_sentinel', 'offense');
    expect(dockOffense?.appliesTowerBonus).toBe(false);
    expect(dockOffense?.modifiedAirDefense).toBe(160);

    const barracks = getAirDefenseStatsWithBattery(state, 'line_infantry', 'city_defense');
    expect(barracks).toBeNull();
  });


  it('enforces barracks construction prerequisites in runtime guard order', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-barracks-guard', owner: 'p1', nowMs: 0 });
    state.resources = { ore: 9_999, stone: 9_999, iron: 9_999 };

    state.levels.hq = 2;
    state.levels.mine = 1;
    state.levels.refinery = 0;
    state.levels.housing_complex = 3;
    expect(canStartConstruction(state, 'barracks')).toEqual({ ok: false, reason: 'Requires refinery 1' });

    state.levels.refinery = 1;
    state.levels.housing_complex = 2;
    expect(canStartConstruction(state, 'barracks')).toEqual({ ok: false, reason: 'Requires housing_complex 3' });

    state.levels.housing_complex = 3;
    expect(canStartConstruction(state, 'barracks').ok).toBe(true);
  });

  it('supports troop training loop and resolves queue', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-1', owner: 'p1', nowMs: 0 });
    state.resources = { ore: 9999, stone: 9999, iron: 9999 };
    state.levels.hq = 2;
    state.levels.housing_complex = 2;
    state.levels.barracks = 1;

    expect(canStartTroopTraining(state, 'line_infantry', 2).ok).toBe(true);
    expect(startTroopTraining(state, 'line_infantry', 2, 0).ok).toBe(true);
    const entry = state.trainingQueue[0];
    expect(resolveCompletedTraining(state, entry.endsAtMs - 1)).toBe(false);
    expect(resolveCompletedTraining(state, entry.endsAtMs)).toBe(true);
    expect(state.troops.line_infantry).toBe(2);
  });


  it('blocks barracks-linked unit training when barracks level is below requirement', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-barracks-unit-guard', owner: 'p1', nowMs: 0 });
    state.resources = { ore: 9_999, stone: 9_999, iron: 9_999 };
    state.levels.barracks = 0;
    state.levels.housing_complex = 10;

    expect(canStartTroopTraining(state, 'line_infantry', 1)).toEqual({ ok: false, reason: 'Requires barracks 1' });

    state.levels.barracks = 1;
    expect(canStartTroopTraining(state, 'line_infantry', 1).ok).toBe(true);
  });

  it('applies barracks trainingSpeedPct to queued training duration', () => {
    const base = createInitialCityEconomyState({ cityId: 'c-barracks-speed-a', owner: 'p1', nowMs: 0 });
    base.resources = { ore: 9_999, stone: 9_999, iron: 9_999 };
    base.levels.housing_complex = 20;
    base.levels.barracks = 1;

    expect(startTroopTraining(base, 'line_infantry', 1, 0).ok).toBe(true);
    const durationAtB1 = base.trainingQueue[0].endsAtMs;

    const boosted = createInitialCityEconomyState({ cityId: 'c-barracks-speed-b', owner: 'p1', nowMs: 0 });
    boosted.resources = { ore: 9_999, stone: 9_999, iron: 9_999 };
    boosted.levels.housing_complex = 20;
    boosted.levels.barracks = 2;

    expect(startTroopTraining(boosted, 'line_infantry', 1, 0).ok).toBe(true);
    const durationAtB2 = boosted.trainingQueue[0].endsAtMs;

    expect(durationAtB1).toBe(1_080_000);
    expect(durationAtB2).toBe(1_070_000);
    expect(durationAtB2).toBeLessThan(durationAtB1);
  });

  it('applies space_dock trainingSpeedPct to naval training duration', () => {
    const base = createInitialCityEconomyState({ cityId: 'c-dock-speed-a', owner: 'p1', nowMs: 0 });
    base.resources = { ore: 9_999, stone: 9_999, iron: 9_999 };
    base.levels.housing_complex = 20;
    base.levels.space_dock = 1;
    base.completedResearch.push('rapid_carrier');

    expect(startTroopTraining(base, 'assault_dropship', 1, 0).ok).toBe(true);
    const durationAtD1 = base.trainingQueue[0].endsAtMs;

    const boosted = createInitialCityEconomyState({ cityId: 'c-dock-speed-b', owner: 'p1', nowMs: 0 });
    boosted.resources = { ore: 9_999, stone: 9_999, iron: 9_999 };
    boosted.levels.housing_complex = 20;
    boosted.levels.space_dock = 2;
    boosted.completedResearch.push('rapid_carrier');

    expect(startTroopTraining(boosted, 'assault_dropship', 1, 0).ok).toBe(true);
    const durationAtD2 = boosted.trainingQueue[0].endsAtMs;

    expect(durationAtD1).toBe(9_600_000);
    expect(durationAtD2).toBe(9_504_000);
    expect(durationAtD2).toBeLessThan(durationAtD1);
  });

  it('enforces troop research requirements', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-r', owner: 'p1', nowMs: 0 });
    state.resources = { ore: 9999, stone: 9999, iron: 9999 };
    state.levels.barracks = 1;

    expect(CITY_ECONOMY_CONFIG.troopResearchEnforcementEnabled).toBe(true);
    expect(canStartTroopTraining(state, 'phalanx_lanceguard', 1).ok).toBe(false);
  });

  it('runs timed research queue, then resolves completion and spends academy research points', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-1', owner: 'p1', nowMs: 0 });
    state.resources = { ore: 9999, stone: 9999, iron: 9999 };
    state.levels.hq = 4;
    state.levels.warehouse = 4;
    state.levels.research_lab = 7;
    state.completedResearch.push('city_guard');

    expect(canStartResearch(state, 'diplomacy').ok).toBe(true);
    expect(startResearch(state, 'diplomacy', 0).ok).toBe(true);
    expect(state.completedResearch).not.toContain('diplomacy');
    expect(state.researchQueue.length).toBe(1);
    expect(resolveCompletedResearch(state, state.researchQueue[0].endsAtMs)).toBe(true);
    expect(state.completedResearch).toContain('diplomacy');
    expect(state.researchQueue).toEqual([]);

    const stats = getCityDerivedStats(state);
    expect(stats.productionPct).toBeGreaterThan(0);
    expect(resolveCompletedResearch(state, 0)).toBe(false);
  });

  it('enforces research prerequisites and single active research queue slot', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-rq', owner: 'p1', nowMs: 0 });
    state.resources = { ore: 999_999, stone: 999_999, iron: 999_999 };
    state.levels.research_lab = 20;

    expect(canStartResearch(state, 'cryptography')).toEqual({ ok: false, reason: 'Requires research espionage' });
    state.completedResearch.push('city_guard', 'diplomacy', 'espionage');
    expect(startResearch(state, 'cryptography', 5_000).ok).toBe(true);
    expect(canStartResearch(state, 'democracy')).toEqual({ ok: false, reason: 'Research queue busy' });
    expect(resolveCompletedResearch(state, 5_001)).toBe(false);
    expect(resolveCompletedResearch(state, state.researchQueue[0].endsAtMs)).toBe(true);
    expect(state.completedResearch).toContain('cryptography');
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

  it('keeps espionage modifiers on intelligence_center (not skyshield_battery)', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-1', owner: 'p1', nowMs: 0 });
    state.levels.hq = 6;
    state.levels.defensive_wall = 2;
    state.levels.skyshield_battery = 3;
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
    const withoutIntelCenter = createInitialCityEconomyState({ cityId: 'c-2', owner: 'p2', nowMs: 0 });
    withoutIntelCenter.levels.skyshield_battery = 6;
    const towerOnlyStats = getCityDerivedStats(withoutIntelCenter);
    expect(towerOnlyStats.detectionPct).toBe(0);
    expect(towerOnlyStats.counterIntelPct).toBe(0);
    expect(towerOnlyStats.antiAirDefensePct).toBe(0);
  });

  it('supports cave-like silver vault deposits and dispatch guardrails', () => {
    const state = createInitialCityEconomyState({ cityId: 'atk', owner: 'p1', nowMs: 0 });
    state.resources.iron = 15_000;
    state.levels.intelligence_center = 3;
    state.completedResearch.push('espionage');

    expect(canDepositSpySilver(state, 3_000).ok).toBe(true);
    expect(depositSpySilver(state, 3_000).ok).toBe(true);
    expect(state.spyVaultSilver).toBe(3_000);
    expect(state.resources.iron).toBe(12_000);

    expect(canStartEspionageMission(state, 'def', 999)).toEqual({ ok: false, reason: 'Minimum 1000 silver required' });
    expect(startEspionageMission(state, 'def', 1_200, 0).ok).toBe(true);
    expect(state.spyVaultSilver).toBe(1_800);
    expect(canDepositSpySilver(state, 100)).toEqual({ ok: false, reason: 'Cannot refill vault while mission is active' });
    expect(canStartEspionageMission(state, '', 1_000)).toEqual({ ok: false, reason: 'Target city required' });
    expect(canStartEspionageMission(state, 'atk', 1_000)).toEqual({ ok: false, reason: 'Cannot target own city' });
  });

  it('gates advanced intelligence actions behind research progression', () => {
    const state = createInitialCityEconomyState({ cityId: 'intel-gate', owner: 'p1', nowMs: 0 });
    state.levels.intelligence_center = 5;
    state.resources.iron = 20_000;
    expect(canStartIntelProject(state, 'network')).toEqual({ ok: false, reason: 'Requires research espionage' });
    expect(canStartIntelProject(state, 'cipher')).toEqual({ ok: false, reason: 'Requires research cryptography' });
    expect(canStartEspionageMission(state, 'target-city', 1_000)).toEqual({ ok: false, reason: 'Requires research espionage' });

    state.completedResearch.push('espionage');
    expect(canStartIntelProject(state, 'network').ok).toBe(true);
    expect(canStartEspionageMission(state, 'target-city', 1_000)).toEqual({ ok: false, reason: 'Not enough vault silver' });

    state.completedResearch.push('cryptography');
    expect(canStartIntelProject(state, 'cipher').ok).toBe(true);
  });

  it('applies finite vault cap before level 10, then infinite cap at level 10', () => {
    const state = createInitialCityEconomyState({ cityId: 'vault', owner: 'p1', nowMs: 0 });
    state.resources.iron = 50_000;

    state.levels.intelligence_center = 3;
    expect(getSpyVaultCap(state)).toBe(3_000);
    expect(canDepositSpySilver(state, 3_000)).toEqual({ ok: true, reason: null });
    expect(depositSpySilver(state, 3_000)).toEqual({ ok: true, reason: null });
    expect(canDepositSpySilver(state, 1)).toEqual({ ok: false, reason: 'Vault capacity reached' });

    state.levels.intelligence_center = 10;
    expect(getSpyVaultCap(state)).toBe(Number.POSITIVE_INFINITY);
    expect(canDepositSpySilver(state, 10_000)).toEqual({ ok: true, reason: null });
  });

  it('uses detection+counter-intel derived stats in defender effective spy defense', () => {
    const defender = createInitialCityEconomyState({ cityId: 'def', owner: 'p2', nowMs: 0 });
    defender.levels.intelligence_center = 2;
    defender.levels.research_lab = 7;
    defender.completedResearch.push('espionage');
    defender.spyVaultSilver = 1_000;

    const effective = getDefenderEffectiveSpyDefense(defender);
    expect(effective).toBeGreaterThan(1_000);

    const outcome = evaluateEspionageOutcome(1_500, defender);
    expect(outcome.defenderEffectiveSpyDefense).toBe(effective);
    expect(outcome.wasSuccess).toBe(1_500 > effective);
    expect(outcome.detectionPctAtResolution).toBeGreaterThan(0);
    expect(outcome.counterIntelPctAtResolution).toBeGreaterThan(0);
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

  it('applies Senate construction-speed normalization from reference level 15 tables', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-speed', owner: 'p1', nowMs: 0 });
    state.levels.hq = 15;
    expect(getConstructionDurationSeconds(state, 'barracks', 1)).toBe(CITY_ECONOMY_CONFIG.buildings.barracks.levels[0].buildSeconds);

    state.levels.hq = 1;
    expect(getConstructionDurationSeconds(state, 'barracks', 1)).toBe(891);

    state.levels.hq = 25;
    expect(getConstructionDurationSeconds(state, 'barracks', 1)).toBe(397);
  });


  it('does not apply Senate multiplier to HQ self-upgrade duration', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-hq-self', owner: 'p1', nowMs: 0 });

    state.levels.hq = 1;
    const durationAtHq1 = getConstructionDurationSeconds(state, 'hq', 2);

    state.levels.hq = 25;
    const durationAtHq25 = getConstructionDurationSeconds(state, 'hq', 2);

    expect(CITY_ECONOMY_CONFIG.buildings.hq.levels[1].buildSeconds).toBe(3);
    expect(durationAtHq1).toBe(3);
    expect(durationAtHq25).toBe(3);
  });

  it('keeps Barracks lvl1 ~14m51 at HQ1 from runtime formula (not a bug)', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-barracks-time', owner: 'p1', nowMs: 0 });
    state.resources = { ore: 999_999, stone: 999_999, iron: 999_999 };
    state.levels.hq = 1;
    state.levels.mine = 1;
    state.levels.refinery = 1;
    state.levels.housing_complex = 3;

    // Base table value for barracks lvl1.
    expect(CITY_ECONOMY_CONFIG.buildings.barracks.levels[0].buildSeconds).toBe(634);
    // Runtime duration at HQ1 with current Senate normalization.
    expect(getConstructionDurationSeconds(state, 'barracks', 1)).toBe(891);
  });

  it('build-cost reduction field is now applied by construction cost calculator', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-cost', owner: 'p1', nowMs: 0 });
    state.levels.hq = 15;
    const cost = getConstructionCostResources(state, 'mine', 2);
    expect(cost).toEqual(CITY_ECONOMY_CONFIG.buildings.mine.levels[1].resources);
  });

  it('validates construction guards/cost/duration/resolution across all 15 runtime buildings', () => {
    const allBuildings = Object.keys(CITY_ECONOMY_CONFIG.buildings) as Array<keyof typeof CITY_ECONOMY_CONFIG.buildings>;
    allBuildings.forEach((buildingId) => {
      const state = createInitialCityEconomyState({ cityId: `c-${buildingId}`, owner: 'p1', nowMs: 0 });
      state.resources = { ore: 9_999_999, stone: 9_999_999, iron: 9_999_999 };
      state.levels.hq = 25;
      state.levels.housing_complex = 45;
      state.queue = [];
      // reset target to level 0 for a deterministic first upgrade.
      state.levels[buildingId] = 0;
      const cfg = CITY_ECONOMY_CONFIG.buildings[buildingId];
      (cfg.prerequisites ?? []).forEach((req) => {
        state.levels[req.buildingId] = Math.max(state.levels[req.buildingId], req.minLevel);
      });

      const guard = canStartConstruction(state, buildingId);
      expect(guard.ok, `${buildingId} should be constructible in validation fixture: ${guard.reason}`).toBe(true);
      const targetLevel = getBuildingLevel(state, buildingId) + 1;
      const expectedCost = getConstructionCostResources(state, buildingId, targetLevel);
      const expectedDuration = getConstructionDurationSeconds(state, buildingId, targetLevel);
      const beforeResources = { ...state.resources };

      const beforeProd = getProductionPerHour(state);
      const beforeCaps = getStorageCaps(state);
      const beforePopCap = getPopulationSnapshot(state).cap;

      const start = startConstruction(state, buildingId, 1_000);
      expect(start.ok).toBe(true);
      expect(state.resources.ore).toBe(beforeResources.ore - expectedCost.ore);
      expect(state.resources.stone).toBe(beforeResources.stone - expectedCost.stone);
      expect(state.resources.iron).toBe(beforeResources.iron - expectedCost.iron);
      expect(state.queue).toHaveLength(1);
      expect(state.queue[0].endsAtMs - state.queue[0].startedAtMs).toBe(expectedDuration * 1000);

      expect(resolveCompletedConstruction(state, state.queue[0].endsAtMs)).toBe(true);
      expect(getBuildingLevel(state, buildingId)).toBe(targetLevel);

      const afterProd = getProductionPerHour(state);
      const afterCaps = getStorageCaps(state);
      const afterPopCap = getPopulationSnapshot(state).cap;

      if (buildingId === 'mine' || buildingId === 'quarry' || buildingId === 'refinery') {
        expect(afterProd.ore + afterProd.stone + afterProd.iron).toBeGreaterThanOrEqual(beforeProd.ore + beforeProd.stone + beforeProd.iron);
      }
      if (buildingId === 'warehouse') {
        expect(afterCaps.ore + afterCaps.stone + afterCaps.iron).toBeGreaterThanOrEqual(beforeCaps.ore + beforeCaps.stone + beforeCaps.iron);
      }
      if (buildingId === 'housing_complex') {
        expect(afterPopCap).toBeGreaterThanOrEqual(beforePopCap);
      }
    });
  });



  it('keeps an exhaustive barracks-unit source-of-truth list in config', () => {
    const barracksUnits = (Object.keys(CITY_ECONOMY_CONFIG.troops) as Array<keyof typeof CITY_ECONOMY_CONFIG.troops>)
      .filter((troopId) => CITY_ECONOMY_CONFIG.troops[troopId].requiredBuildingId === 'barracks');

    expect(barracksUnits).toEqual([
      'line_infantry',
      'phalanx_lanceguard',
      'rail_marksman',
      'assault_legionnaire',
      'aegis_shieldguard',
      'raider_hoverbike',
      'siege_breacher',
    ]);
  });

  it('enforces barracks/research/resource/population guards for every barracks unit', () => {
    const barracksUnits = (Object.keys(CITY_ECONOMY_CONFIG.troops) as Array<keyof typeof CITY_ECONOMY_CONFIG.troops>)
      .filter((troopId) => CITY_ECONOMY_CONFIG.troops[troopId].requiredBuildingId === 'barracks');

    barracksUnits.forEach((troopId) => {
      const troop = CITY_ECONOMY_CONFIG.troops[troopId];

      const noBarracks = createInitialCityEconomyState({ cityId: `c-${troopId}-no-barracks`, owner: 'p1', nowMs: 0 });
      noBarracks.resources = { ore: 9_999, stone: 9_999, iron: 9_999 };
      noBarracks.levels.barracks = 0;
      noBarracks.levels.housing_complex = 45;
      expect(canStartTroopTraining(noBarracks, troopId, 1)).toEqual({ ok: false, reason: `Requires barracks ${troop.requiredBuildingLevel}` });

      const noResearch = createInitialCityEconomyState({ cityId: `c-${troopId}-no-research`, owner: 'p1', nowMs: 0 });
      noResearch.resources = { ore: 9_999, stone: 9_999, iron: 9_999 };
      noResearch.levels.barracks = troop.requiredBuildingLevel;
      noResearch.levels.housing_complex = 45;
      if (troop.requiredResearch) {
        expect(canStartTroopTraining(noResearch, troopId, 1)).toEqual({ ok: false, reason: `Requires research ${troop.requiredResearch}` });
      }

      const noResources = createInitialCityEconomyState({ cityId: `c-${troopId}-no-res`, owner: 'p1', nowMs: 0 });
      noResources.resources = { ore: 0, stone: 0, iron: 0 };
      noResources.levels.barracks = troop.requiredBuildingLevel;
      noResources.levels.housing_complex = 45;
      if (troop.requiredResearch) noResources.completedResearch.push(troop.requiredResearch);
      expect(canStartTroopTraining(noResources, troopId, 1)).toEqual({ ok: false, reason: 'Not enough resources' });

      const noPopulation = createInitialCityEconomyState({ cityId: `c-${troopId}-no-pop`, owner: 'p1', nowMs: 0 });
      noPopulation.resources = { ore: 9_999, stone: 9_999, iron: 9_999 };
      noPopulation.levels.barracks = troop.requiredBuildingLevel;
      noPopulation.levels.housing_complex = 0;
      if (troop.requiredResearch) noPopulation.completedResearch.push(troop.requiredResearch);
      expect(canStartTroopTraining(noPopulation, troopId, 1)).toEqual({ ok: false, reason: 'Not enough population' });
    });
  });



  it('uses corrected rail_marksman zero-stone cost in runtime payment', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-rail-cost', owner: 'p1', nowMs: 0 });
    state.resources = { ore: 1_000, stone: 1_000, iron: 1_000 };
    state.levels.barracks = 1;
    state.levels.housing_complex = 45;
    state.completedResearch.push('railgun_skirmisher');

    expect(startTroopTraining(state, 'rail_marksman', 1, 0).ok).toBe(true);
    expect(state.trainingQueue[0].costPaid).toEqual({ ore: 55, stone: 0, iron: 40 });
    expect(state.resources).toEqual({ ore: 945, stone: 1_000, iron: 960 });
  });

  it('uses corrected aegis_shieldguard barracks guard (level 1) with aegis_walker research', () => {
    const blocked = createInitialCityEconomyState({ cityId: 'c-aegis-guard-blocked', owner: 'p1', nowMs: 0 });
    blocked.resources = { ore: 9_999, stone: 9_999, iron: 9_999 };
    blocked.levels.barracks = 0;
    blocked.levels.housing_complex = 45;
    blocked.completedResearch.push('aegis_walker');
    expect(canStartTroopTraining(blocked, 'aegis_shieldguard', 1)).toEqual({ ok: false, reason: 'Requires barracks 1' });

    const ready = createInitialCityEconomyState({ cityId: 'c-aegis-guard-ready', owner: 'p1', nowMs: 0 });
    ready.resources = { ore: 9_999, stone: 9_999, iron: 9_999 };
    ready.levels.barracks = 1;
    ready.levels.housing_complex = 45;
    ready.completedResearch.push('aegis_walker');
    expect(canStartTroopTraining(ready, 'aegis_shieldguard', 1).ok).toBe(true);
  });

  it('uses corrected siege_breacher base training time in queue runtime', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-siege-time', owner: 'p1', nowMs: 0 });
    state.resources = { ore: 9_999, stone: 9_999, iron: 9_999 };
    state.levels.barracks = 5;
    state.levels.housing_complex = 45;
    state.completedResearch.push('siege_artillery');

    expect(CITY_ECONOMY_CONFIG.troops.siege_breacher.trainingSeconds).toBe(12_600);
    expect(startTroopTraining(state, 'siege_breacher', 1, 0).ok).toBe(true);
    expect(state.trainingQueue[0].endsAtMs).toBe(12_096_000);
  });

  it('queues, costs, resolves, and applies barracks training speed for barracks units', () => {
    const unitCases = [
      { troopId: 'line_infantry', withResearch: [] },
      { troopId: 'phalanx_lanceguard', withResearch: ['bulwark_trooper'] },
      { troopId: 'rail_marksman', withResearch: ['railgun_skirmisher'] },
      { troopId: 'assault_legionnaire', withResearch: ['assault_ranger'] },
      { troopId: 'aegis_shieldguard', withResearch: ['aegis_walker'] },
      { troopId: 'raider_hoverbike', withResearch: ['raider_interceptor'] },
      { troopId: 'siege_breacher', withResearch: ['siege_artillery'] },
    ] as const;

    unitCases.forEach(({ troopId, withResearch }) => {
      const troop = CITY_ECONOMY_CONFIG.troops[troopId];

      const state = createInitialCityEconomyState({ cityId: `c-${troopId}-queue`, owner: 'p1', nowMs: 0 });
      state.resources = { ore: 9_999, stone: 9_999, iron: 9_999 };
      state.levels.housing_complex = 45;
      state.levels.barracks = troop.requiredBuildingLevel;
      withResearch.forEach((id) => state.completedResearch.push(id));

      expect(startTroopTraining(state, troopId, 1, 0).ok).toBe(true);
      expect(state.trainingQueue).toHaveLength(1);
      const queued = state.trainingQueue[0];

      expect(queued.costPaid).toEqual(troop.cost);
      expect(queued.populationReserved).toBe(troop.populationCost);
      const expectedMultiplier = Math.max(0.35, 1 - getCityDerivedStats(state).trainingSpeedPct / 100);
      expect(queued.endsAtMs).toBe(Math.ceil(troop.trainingSeconds * expectedMultiplier) * 1000);
      expect(state.resources).toEqual({
        ore: 9_999 - troop.cost.ore,
        stone: 9_999 - troop.cost.stone,
        iron: 9_999 - troop.cost.iron,
      });

      expect(resolveCompletedTraining(state, queued.endsAtMs - 1)).toBe(false);
      expect(resolveCompletedTraining(state, queued.endsAtMs)).toBe(true);
      expect(state.troops[troopId]).toBe(1);
      expect(state.trainingQueue).toHaveLength(0);
    });
  });





  it('uses transportCapacity as canonical carry stat (market_logistics removed)', () => {
    const expectedTransportCapacity = {
      line_infantry: 16,
      phalanx_lanceguard: 8,
      rail_marksman: 8,
      assault_legionnaire: 24,
      aegis_shieldguard: 64,
      raider_hoverbike: 72,
      siege_breacher: 400,
    } as const;

    (Object.keys(expectedTransportCapacity) as Array<keyof typeof expectedTransportCapacity>).forEach((troopId) => {
      const troop = CITY_ECONOMY_CONFIG.troops[troopId];
      expect(troop.transportCapacity).toBe(expectedTransportCapacity[troopId]);
      expect('market_logistics' in troop).toBe(false);
    });
  });

  it('keeps barracks unit research mapping aligned with intended Grepolis equivalents', () => {
    expect(CITY_ECONOMY_CONFIG.troops.line_infantry.requiredResearch).toBeNull();
    expect(CITY_ECONOMY_CONFIG.troops.phalanx_lanceguard.requiredResearch).toBe('bulwark_trooper');
    expect(CITY_ECONOMY_CONFIG.troops.rail_marksman.requiredResearch).toBe('railgun_skirmisher');
    expect(CITY_ECONOMY_CONFIG.troops.assault_legionnaire.requiredResearch).toBe('assault_ranger');
    expect(CITY_ECONOMY_CONFIG.troops.aegis_shieldguard.requiredResearch).toBe('aegis_walker');
    expect(CITY_ECONOMY_CONFIG.troops.raider_hoverbike.requiredResearch).toBe('raider_interceptor');
    expect(CITY_ECONOMY_CONFIG.troops.siege_breacher.requiredResearch).toBe('siege_artillery');

    const barracksResearchIds = new Set(
      (Object.keys(CITY_ECONOMY_CONFIG.troops) as Array<keyof typeof CITY_ECONOMY_CONFIG.troops>)
        .filter((id) => CITY_ECONOMY_CONFIG.troops[id].requiredBuildingId === 'barracks')
        .map((id) => CITY_ECONOMY_CONFIG.troops[id].requiredResearch)
        .filter((id): id is NonNullable<typeof id> => Boolean(id)),
    );

    expect(barracksResearchIds.has('city_guard')).toBe(false);
    expect(barracksResearchIds.has('railgun_skirmisher')).toBe(true);
  });

  it('keeps troop category and production-building wiring coherent', () => {
    const groundTroops = ['line_infantry', 'phalanx_lanceguard', 'rail_marksman', 'assault_legionnaire', 'aegis_shieldguard', 'raider_hoverbike', 'siege_breacher'] as const;
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
      'assault_dropship',
      'swift_carrier',
      'interceptor_sentinel',
      'ember_drifter',
      'rapid_escort',
      'bulwark_trireme',
      'colonization_arkship',
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

  it('keeps an exhaustive runtime list of space_dock units and expected Grepolis research mapping', () => {
    const expectedSpaceDockTroops = [
      'assault_dropship',
      'swift_carrier',
      'interceptor_sentinel',
      'ember_drifter',
      'rapid_escort',
      'bulwark_trireme',
      'colonization_arkship',
    ] as const;

    const runtimeSpaceDockTroops = (Object.keys(CITY_ECONOMY_CONFIG.troops) as Array<keyof typeof CITY_ECONOMY_CONFIG.troops>)
      .filter((troopId) => CITY_ECONOMY_CONFIG.troops[troopId].requiredBuildingId === 'space_dock');

    expect(runtimeSpaceDockTroops).toEqual(expectedSpaceDockTroops);

    expect(CITY_ECONOMY_CONFIG.troops.assault_dropship.requiredResearch).toBeNull();
    expect(CITY_ECONOMY_CONFIG.troops.swift_carrier.requiredResearch).toBe('rapid_carrier');
    expect(CITY_ECONOMY_CONFIG.troops.interceptor_sentinel.requiredResearch).toBe('sentinel_interceptor');
    expect(CITY_ECONOMY_CONFIG.troops.ember_drifter.requiredResearch).toBe('ember_frigate');
    expect(CITY_ECONOMY_CONFIG.troops.rapid_escort.requiredResearch).toBe('vanguard_corvette');
    expect(CITY_ECONOMY_CONFIG.troops.bulwark_trireme.requiredResearch).toBe('bulwark_cruiser');
    expect(CITY_ECONOMY_CONFIG.troops.colonization_arkship.requiredResearch).toBe('colony_ark');

    expect(CITY_ECONOMY_CONFIG.troops.interceptor_sentinel.navalDefense).toBe(160);
    expect(CITY_ECONOMY_CONFIG.troops.rapid_escort.navalDefense).toBe(60);
    expect(CITY_ECONOMY_CONFIG.troops.bulwark_trireme.navalDefense).toBe(250);
    expect(CITY_ECONOMY_CONFIG.troops.colonization_arkship.navalDefense).toBe(300);
    expect(CITY_ECONOMY_CONFIG.troops.interceptor_sentinel.navalAttack).toBe(24);
    expect(CITY_ECONOMY_CONFIG.troops.rapid_escort.navalAttack).toBe(200);
  });

  it('enforces space_dock guards and training runtime loop for every naval unit', () => {
    const navalCases = [
      { troopId: 'assault_dropship', buildingLevel: 1, research: null as null | keyof typeof CITY_ECONOMY_CONFIG.research },
      { troopId: 'swift_carrier', buildingLevel: 1, research: 'rapid_carrier' as const },
      { troopId: 'interceptor_sentinel', buildingLevel: 1, research: 'sentinel_interceptor' as const },
      { troopId: 'ember_drifter', buildingLevel: 1, research: 'ember_frigate' as const },
      { troopId: 'rapid_escort', buildingLevel: 1, research: 'vanguard_corvette' as const },
      { troopId: 'bulwark_trireme', buildingLevel: 1, research: 'bulwark_cruiser' as const },
      { troopId: 'colonization_arkship', buildingLevel: 10, research: 'colony_ark' as const },
    ] as const;

    navalCases.forEach(({ troopId, buildingLevel, research }) => {
      const troop = CITY_ECONOMY_CONFIG.troops[troopId];
      const state = createInitialCityEconomyState({ cityId: `dock-${troopId}`, owner: 'p1', nowMs: 0 });
      state.resources = { ore: 100_000, stone: 100_000, iron: 100_000 };
      state.levels.housing_complex = 45;

      // Building guard.
      state.levels.space_dock = Math.max(0, buildingLevel - 1);
      expect(canStartTroopTraining(state, troopId, 1).ok).toBe(false);

      // Building gate satisfied, then research guard if applicable.
      state.levels.space_dock = buildingLevel;
      if (research) {
        expect(canStartTroopTraining(state, troopId, 1).ok).toBe(false);
        state.completedResearch.push(research);
      }

      expect(canStartTroopTraining(state, troopId, 1).ok).toBe(true);

      // Resource guard.
      state.resources = { ore: 0, stone: 0, iron: 0 };
      expect(canStartTroopTraining(state, troopId, 1).reason).toBe('Not enough resources');

      // Population guard.
      state.resources = { ore: 100_000, stone: 100_000, iron: 100_000 };
      state.troops.line_infantry = 10_000;
      expect(canStartTroopTraining(state, troopId, 1).reason).toBe('Not enough population');

      // Start/queue/cost/resolve.
      state.troops.line_infantry = 0;
      state.levels.housing_complex = 45;
      expect(startTroopTraining(state, troopId, 1, 0).ok).toBe(true);
      const queued = state.trainingQueue[0];
      expect(queued.costPaid).toEqual(troop.cost);
      expect(queued.populationReserved).toBe(troop.populationCost);
      expect(state.resources).toEqual({
        ore: 100_000 - troop.cost.ore,
        stone: 100_000 - troop.cost.stone,
        iron: 100_000 - troop.cost.iron,
      });

      expect(resolveCompletedTraining(state, queued.endsAtMs - 1)).toBe(false);
      expect(resolveCompletedTraining(state, queued.endsAtMs)).toBe(true);
      expect(state.troops[troopId]).toBe(1);
    });
  });

  it('uses transportCapacity as canonical naval carry stat (no legacy market_logistics field)', () => {
    const navalTroops = [
      'assault_dropship',
      'swift_carrier',
      'interceptor_sentinel',
      'ember_drifter',
      'rapid_escort',
      'bulwark_trireme',
      'colonization_arkship',
    ] as const;

    navalTroops.forEach((troopId) => {
      const troop = CITY_ECONOMY_CONFIG.troops[troopId];
      expect(troop.transportCapacity).toBeGreaterThanOrEqual(0);
      expect(typeof troop.navalAttack).toBe('number');
      expect(typeof troop.navalDefense).toBe('number');
      expect(troop.defenseDistance).toBe(0);
      expect('market_logistics' in troop).toBe(false);
    });
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

  it('blocks militia activation when housing_complex is level 0', () => {
    const state = createInitialCityEconomyState({ cityId: 'm0', owner: 'p1', nowMs: 0 });
    state.levels.housing_complex = 0;

    expect(activateMilitia(state, 100)).toEqual({ ok: false, reason: 'Requires housing_complex 1' });
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
    state.completedResearch.push('city_guard');
    expect(getMilitiaMaxSize(state)).toBe(150);
  });
});
