import { describe, expect, it } from 'vitest';
import { CITY_ECONOMY_CONFIG, STANDARD_BUILDING_ORDER } from '@/game/city/economy/cityEconomyConfig';
import { createInitialCityEconomyState, getPopulationSnapshot, getStorageCaps } from '@/game/city/economy/cityEconomySystem';

describe('city economy rebalance validation', () => {
  it('keeps active MVP building roster aligned with simplified military branch', () => {
    expect(STANDARD_BUILDING_ORDER).toEqual([
      'hq',
      'mine',
      'quarry',
      'refinery',
      'warehouse',
      'housing_complex',
      'barracks',
      'space_dock',
      'defensive_wall',
      'watch_tower',
      'armament_factory',
      'intelligence_center',
      'research_lab',
      'market',
      'council_chamber',
    ]);
  });

  it('keeps building level tables sequential and with non-zero costs/times', () => {
    STANDARD_BUILDING_ORDER.forEach((buildingId) => {
      const rows = CITY_ECONOMY_CONFIG.buildings[buildingId].levels;
      for (let i = 1; i < rows.length; i += 1) {
        const prev = rows[i - 1];
        const next = rows[i];
        expect(next.level).toBe(prev.level + 1);
        expect(next.resources.ore + next.resources.stone + next.resources.iron).toBeGreaterThan(0);
        expect(next.populationCost).toBeGreaterThanOrEqual(0);
      }
    });
  });

  it('uses differentiated max levels matching runtime tables', () => {
    expect(CITY_ECONOMY_CONFIG.buildings.hq.maxLevel).toBe(25);
    expect(CITY_ECONOMY_CONFIG.buildings.mine.maxLevel).toBe(40);
    expect(CITY_ECONOMY_CONFIG.buildings.quarry.maxLevel).toBe(40);
    expect(CITY_ECONOMY_CONFIG.buildings.refinery.maxLevel).toBe(40);
    expect(CITY_ECONOMY_CONFIG.buildings.warehouse.maxLevel).toBe(35);
    expect(CITY_ECONOMY_CONFIG.buildings.housing_complex.maxLevel).toBe(45);
    expect(CITY_ECONOMY_CONFIG.buildings.barracks.maxLevel).toBe(30);
    expect(CITY_ECONOMY_CONFIG.buildings.space_dock.maxLevel).toBe(30);
    expect(CITY_ECONOMY_CONFIG.buildings.defensive_wall.maxLevel).toBe(25);
    expect(CITY_ECONOMY_CONFIG.buildings.research_lab.maxLevel).toBe(36);
    expect(CITY_ECONOMY_CONFIG.buildings.market.maxLevel).toBe(30);
  });

  it('keeps resource production defined on all economic production rows', () => {
    expect(CITY_ECONOMY_CONFIG.buildings.mine.levels.every((row) => Number(row.effect.orePerHour ?? 0) > 0)).toBe(true);
    expect(CITY_ECONOMY_CONFIG.buildings.quarry.levels.every((row) => Number(row.effect.stonePerHour ?? 0) > 0)).toBe(true);
    expect(CITY_ECONOMY_CONFIG.buildings.refinery.levels.every((row) => Number(row.effect.ironPerHour ?? 0) > 0)).toBe(true);
  });

  it('uses explicit warehouse caps that cover nearby progression costs', () => {
    const warehouseRows = CITY_ECONOMY_CONFIG.buildings.warehouse.levels;
    warehouseRows.forEach((row) => {
      expect(row.effect.storageCap).toBeDefined();
      const cap = row.effect.storageCap!;
      expect(cap.ore).toBeGreaterThan(0);
      expect(cap.stone).toBeGreaterThan(0);
      expect(cap.iron).toBeGreaterThan(0);
    });

    const levelChecks = [3, 8, 12];
    levelChecks.forEach((warehouseLevel) => {
      const state = createInitialCityEconomyState({ cityId: `w-${warehouseLevel}`, owner: 'p1', nowMs: 0 });
      state.levels.warehouse = warehouseLevel;
      const caps = getStorageCaps(state);
      const mineCost = CITY_ECONOMY_CONFIG.buildings.mine.levels[Math.min(warehouseLevel + 1, CITY_ECONOMY_CONFIG.buildings.mine.maxLevel) - 1].resources;
      const quarryCost = CITY_ECONOMY_CONFIG.buildings.quarry.levels[Math.min(warehouseLevel + 1, CITY_ECONOMY_CONFIG.buildings.quarry.maxLevel) - 1].resources;
      const refineryCost = CITY_ECONOMY_CONFIG.buildings.refinery.levels[Math.min(Math.max(warehouseLevel, 3), CITY_ECONOMY_CONFIG.buildings.refinery.maxLevel) - 1].resources;

      expect(caps.ore).toBeGreaterThanOrEqual(Math.max(mineCost.ore, quarryCost.ore, refineryCost.ore));
      expect(caps.stone).toBeGreaterThanOrEqual(Math.max(mineCost.stone, quarryCost.stone, refineryCost.stone));
      expect(caps.iron).toBeGreaterThanOrEqual(Math.max(mineCost.iron, quarryCost.iron, refineryCost.iron));
    });
  });

  it('supports viable economy, military, and mixed archetypes without population deadlock', () => {
    const economy = createInitialCityEconomyState({ cityId: 'eco', owner: 'p1', nowMs: 0 });
    economy.levels = {
      ...economy.levels,
      hq: 12,
      mine: 12,
      quarry: 12,
      refinery: 10,
      warehouse: 10,
      housing_complex: 12,
      barracks: 5,
      space_dock: 0,
      armament_factory: 0,
    };
    economy.troops.infantry = 70;
    economy.troops.marksman = 20;

    const economyPop = getPopulationSnapshot(economy);
    expect(economyPop.free).toBeGreaterThanOrEqual(0);

    const military = createInitialCityEconomyState({ cityId: 'mil', owner: 'p1', nowMs: 0 });
    military.levels = {
      ...military.levels,
      hq: 12,
      mine: 8,
      quarry: 8,
      refinery: 7,
      warehouse: 8,
      housing_complex: 14,
      barracks: 12,
      space_dock: 5,
      armament_factory: 6,
    };
    military.troops.infantry = 80;
    military.troops.shield_guard = 40;
    military.troops.assault = 30;
    military.troops.interception_sentinel = 15;

    const militaryPop = getPopulationSnapshot(military);
    expect(militaryPop.free).toBeGreaterThanOrEqual(0);

    const mixed = createInitialCityEconomyState({ cityId: 'mix', owner: 'p1', nowMs: 0 });
    mixed.levels = {
      ...mixed.levels,
      hq: 15,
      mine: 12,
      quarry: 12,
      refinery: 11,
      warehouse: 11,
      housing_complex: 13,
      barracks: 10,
      space_dock: 3,
      armament_factory: 4,
    };
    mixed.troops.infantry = 60;
    mixed.troops.marksman = 25;
    mixed.troops.shield_guard = 20;
    mixed.troops.assault = 15;

    const mixedPop = getPopulationSnapshot(mixed);
    expect(mixedPop.free).toBeGreaterThanOrEqual(0);
  });
});
