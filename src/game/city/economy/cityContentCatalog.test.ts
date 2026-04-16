import { describe, expect, it } from 'vitest';
import {
  BUILDING_CATALOG_BY_PHASE,
  DEFERRED_BUILDING_CATALOG,
  FULL_BUILDING_CATALOG,
  FULL_UNIT_CATALOG,
  UNIT_CATALOG_BY_PHASE,
  getContentCatalogCompletenessSummary,
} from '@/game/city/economy/cityContentCatalog';

describe('cityContentCatalog full-game source of truth', () => {
  it('covers all intended building categories across MVP/V0/later', () => {
    const categories = new Set(FULL_BUILDING_CATALOG.map((entry) => entry.category));
    expect(categories).toEqual(new Set(['economy', 'military', 'defense', 'support_logistics', 'research', 'intelligence', 'governance']));

    expect(BUILDING_CATALOG_BY_PHASE.mvp.length).toBeGreaterThan(0);
    expect(BUILDING_CATALOG_BY_PHASE.v0.length).toBeGreaterThan(0);
    expect(BUILDING_CATALOG_BY_PHASE.later.length).toBeGreaterThan(0);
  });

  it('keeps prestige/premium branches deferred from active balancing scope', () => {
    const activeIds = new Set(FULL_BUILDING_CATALOG.map((entry) => entry.id));
    const deferredIds = new Set(DEFERRED_BUILDING_CATALOG.map((entry) => entry.id));

    expect(deferredIds).toEqual(new Set(['training_grounds', 'shard_vault']));
    expect(activeIds.has('training_grounds')).toBe(false);
    expect(activeIds.has('shard_vault')).toBe(false);
  });

  it('covers all intended unit categories and keeps later projection/siege/colonization visible', () => {
    const categories = new Set(FULL_UNIT_CATALOG.map((entry) => entry.category));
    expect(categories).toEqual(new Set(['ground_line', 'projection', 'siege', 'colonization']));

    expect(UNIT_CATALOG_BY_PHASE.v0).toContain('infantry');
    expect(UNIT_CATALOG_BY_PHASE.later).toContain('assault_convoy');
    expect(UNIT_CATALOG_BY_PHASE.later).toContain('colonization_convoy');
  });

  it('exposes explicit completeness summary for balancing workflow', () => {
    const summary = getContentCatalogCompletenessSummary();
    expect(summary.building.fullyDefined).toBeGreaterThan(0);
    expect(summary.building.partiallyDefined).toBeGreaterThan(0);
    expect(summary.units.fullyDefined).toBeGreaterThan(0);
    expect(summary.units.partiallyDefined).toBeGreaterThan(0);
  });

  it('ensures catalog identifiers remain unique', () => {
    const buildingIds = FULL_BUILDING_CATALOG.map((entry) => entry.id);
    const unitIds = FULL_UNIT_CATALOG.map((entry) => entry.id);

    expect(new Set(buildingIds).size).toBe(buildingIds.length);
    expect(new Set(unitIds).size).toBe(unitIds.length);
  });
});
