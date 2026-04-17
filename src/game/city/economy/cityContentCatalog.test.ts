import { describe, expect, it } from 'vitest';
import {
  BUILDING_CATALOG_BY_PHASE,
  DEFERRED_BUILDING_CATALOG,
  FULL_BUILDING_CATALOG,
  FULL_UNIT_CATALOG,
  MVP_MICRO_STANDARD_BUILDING_IDS,
  getContentCatalogCompletenessSummary,
} from '@/game/city/economy/cityContentCatalog';

describe('cityContentCatalog MVP MICRO scope', () => {
  it('defines all standard non-special buildings in active MVP MICRO perimeter', () => {
    expect(new Set(MVP_MICRO_STANDARD_BUILDING_IDS)).toEqual(
      new Set([
        'hq',
        'mine',
        'quarry',
        'refinery',
        'warehouse',
        'housing_complex',
        'barracks',
        'combat_forge',
        'space_dock',
        'defensive_wall',
        'watch_tower',
        'military_academy',
        'armament_factory',
        'intelligence_center',
        'research_lab',
        'market',
        'council_chamber',
      ]),
    );
    expect(BUILDING_CATALOG_BY_PHASE.mvp).toEqual([...MVP_MICRO_STANDARD_BUILDING_IDS]);
    expect(BUILDING_CATALOG_BY_PHASE.v0).toEqual([]);
  });

  it('keeps deferred list strictly premium/special', () => {
    const deferredIds = new Set(DEFERRED_BUILDING_CATALOG.map((entry) => entry.id));
    expect(deferredIds).toEqual(new Set(['training_grounds', 'shard_vault']));
    MVP_MICRO_STANDARD_BUILDING_IDS.forEach((id) => {
      expect(deferredIds.has(id)).toBe(false);
    });
  });

  it('keeps standard building identifiers unique and present in full catalog', () => {
    const fullIds = new Set(FULL_BUILDING_CATALOG.map((entry) => entry.id));
    MVP_MICRO_STANDARD_BUILDING_IDS.forEach((id) => expect(fullIds.has(id)).toBe(true));
    expect(new Set(FULL_BUILDING_CATALOG.map((entry) => entry.id)).size).toBe(FULL_BUILDING_CATALOG.length);
    expect(new Set(FULL_UNIT_CATALOG.map((entry) => entry.id)).size).toBe(FULL_UNIT_CATALOG.length);
  });

  it('exposes completeness summary for balancing workflow', () => {
    const summary = getContentCatalogCompletenessSummary();
    expect(summary.building.fullyDefined).toBeGreaterThan(0);
    expect(summary.units.fullyDefined).toBeGreaterThan(0);
  });
});
