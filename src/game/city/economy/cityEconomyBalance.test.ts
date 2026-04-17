import { describe, expect, it } from 'vitest';
import { CITY_ECONOMY_CONFIG, STANDARD_BUILDING_ORDER } from '@/game/city/economy/cityEconomyConfig';
import { createInitialCityEconomyState, getPopulationSnapshot, getStorageCaps } from '@/game/city/economy/cityEconomySystem';

function levelTotalCost(ore: number, stone: number, iron: number) {
  return ore + stone + iron;
}

describe('city economy rebalance validation', () => {
  it('normalizes all building and troop timers to 0/5 endings', () => {
    STANDARD_BUILDING_ORDER.forEach((buildingId) => {
      CITY_ECONOMY_CONFIG.buildings[buildingId].levels.forEach((levelRow) => {
        expect(levelRow.buildSeconds % 5).toBe(0);
      });
    });

    Object.values(CITY_ECONOMY_CONFIG.troops).forEach((troop) => {
      expect(troop.trainingSeconds % 5).toBe(0);
    });
  });

  it('ensures final building levels are meaningful long-form commitments (>=24h)', () => {
    STANDARD_BUILDING_ORDER.forEach((buildingId) => {
      const rows = CITY_ECONOMY_CONFIG.buildings[buildingId].levels;
      expect(rows[19].buildSeconds).toBeGreaterThanOrEqual(24 * 60 * 60);
    });
  });

  it('keeps resource-building ROI in a rational range over 1→20', () => {
    const checks = [
      { buildingId: 'mine' as const, effectKey: 'orePerHour' as const, maxPaybackHours: 70 },
      { buildingId: 'quarry' as const, effectKey: 'stonePerHour' as const, maxPaybackHours: 85 },
      { buildingId: 'refinery' as const, effectKey: 'ironPerHour' as const, maxPaybackHours: 260 },
    ];

    checks.forEach(({ buildingId, effectKey, maxPaybackHours }) => {
      const levels = CITY_ECONOMY_CONFIG.buildings[buildingId].levels;
      const paybacks: number[] = [];

      for (let i = 0; i < levels.length; i += 1) {
        const current = levels[i];
        const prevProduction = i === 0 ? 0 : Number(levels[i - 1].effect[effectKey] ?? 0);
        const currentProduction = Number(current.effect[effectKey] ?? 0);
        const delta = currentProduction - prevProduction;
        const payback = levelTotalCost(current.resources.ore, current.resources.stone, current.resources.iron) / delta;

        expect(delta).toBeGreaterThan(0);
        paybacks.push(payback);
      }

      expect(Math.max(...paybacks)).toBeLessThan(maxPaybackHours);
    });
  });

  it('uses explicit warehouse caps that cover nearby progression costs', () => {
    const warehouseRows = CITY_ECONOMY_CONFIG.buildings.warehouse.levels;
    warehouseRows.forEach((row) => {
      expect(row.effect.storageCap).toBeDefined();
      const cap = row.effect.storageCap!;
      expect(cap.ore % 100).toBe(0);
      expect(cap.stone % 100).toBe(0);
      expect(cap.iron % 100).toBe(0);
    });

    const levelChecks = [3, 8, 12];
    levelChecks.forEach((warehouseLevel) => {
      const state = createInitialCityEconomyState({ cityId: `w-${warehouseLevel}`, owner: 'p1', nowMs: 0 });
      state.levels.warehouse = warehouseLevel;
      const caps = getStorageCaps(state);
      const mineCost = CITY_ECONOMY_CONFIG.buildings.mine.levels[Math.min(warehouseLevel + 1, 20) - 1].resources;
      const quarryCost = CITY_ECONOMY_CONFIG.buildings.quarry.levels[Math.min(warehouseLevel + 1, 20) - 1].resources;
      const refineryCost = CITY_ECONOMY_CONFIG.buildings.refinery.levels[Math.min(Math.max(warehouseLevel, 3), 20) - 1].resources;

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
      combat_forge: 0,
      space_dock: 0,
    };
    economy.troops.infantry = 70;
    economy.troops.marksman = 20;

    const economyPop = getPopulationSnapshot(economy);
    expect(economyPop.free).toBeGreaterThan(100);

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
      combat_forge: 8,
      space_dock: 5,
    };
    military.troops.infantry = 80;
    military.troops.shield_guard = 40;
    military.troops.assault = 30;
    military.troops.interception_sentinel = 15;

    const militaryPop = getPopulationSnapshot(military);
    expect(militaryPop.free).toBeGreaterThan(50);

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
      combat_forge: 6,
      space_dock: 3,
    };
    mixed.troops.infantry = 60;
    mixed.troops.marksman = 25;
    mixed.troops.shield_guard = 20;
    mixed.troops.assault = 15;

    const mixedPop = getPopulationSnapshot(mixed);
    expect(mixedPop.free).toBeGreaterThan(60);
  });
});
