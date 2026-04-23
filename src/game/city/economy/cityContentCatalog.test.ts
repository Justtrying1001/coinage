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
        'space_dock',
        'defensive_wall',
        'skyshield_battery',
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

  it('keeps armament_factory catalog entry aligned with runtime unlock and implementation status', () => {
    const armament = FULL_BUILDING_CATALOG.find((entry) => entry.id === 'armament_factory');
    expect(armament).toBeDefined();
    expect(armament?.phase).toBe('mvp');
    expect(armament?.definitionStatus).toBe('fully_defined');
    expect(armament?.gameplayImplemented).toBe(true);
    expect(armament?.maxLevel).toBe(35);
    expect(armament?.unlock).toEqual([
      { type: 'hq', targetId: 'hq', minLevel: 8 },
      { type: 'building', targetId: 'research_lab', minLevel: 10 },
      { type: 'building', targetId: 'barracks', minLevel: 10 },
    ]);
  });

  it('keeps intelligence_center catalog entry aligned with runtime unlock/effects status', () => {
    const intelligence = FULL_BUILDING_CATALOG.find((entry) => entry.id === 'intelligence_center');
    expect(intelligence).toBeDefined();
    expect(intelligence?.phase).toBe('mvp');
    expect(intelligence?.definitionStatus).toBe('fully_defined');
    expect(intelligence?.gameplayImplemented).toBe(true);
    expect(intelligence?.maxLevel).toBe(10);
    expect(intelligence?.unlock).toEqual([
      { type: 'hq', targetId: 'hq', minLevel: 10 },
      { type: 'building', targetId: 'market', minLevel: 4 },
      { type: 'building', targetId: 'warehouse', minLevel: 7 },
    ]);
  });

  it('does not reference impossible intelligence_center levels in catalog dependencies', () => {
    const impossibleRefs = FULL_BUILDING_CATALOG.flatMap((entry) =>
      (entry.levelBandGates ?? []).flatMap((band) =>
        (band.prerequisites ?? []).filter((req) => req.type === 'building' && req.targetId === 'intelligence_center' && req.minLevel > 10),
      ),
    );
    expect(impossibleRefs).toEqual([]);
  });
});
