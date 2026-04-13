import { describe, expect, it } from 'vitest';
import { CityLayoutStore, type BuildingDefinition } from '@/game/city/layout/cityLayout';

const HABITAT: BuildingDefinition = {
  type: 'habitat',
  label: 'Habitat',
  footprint: { width: 2, height: 2 },
};

describe('CityLayoutStore', () => {
  it('seeds a central fixed Town Hall and arterial roads', () => {
    const store = new CityLayoutStore({ width: 20, height: 14 });
    const hq = store.getBuildingById('hq');
    expect(hq).not.toBeNull();
    expect(hq?.fixed).toBe(true);
    expect(store.removeBuilding('hq')).toBe(false);
    expect(store.getTileKind(10, 2)).toBe('road');
  });

  it('places buildings only on valid tiles and rejects collisions', () => {
    const store = new CityLayoutStore({ width: 20, height: 14 });

    expect(store.canPlaceBuilding({ x: 13, y: 5 }, HABITAT.footprint)).toBe(true);
    const placed = store.placeBuilding(HABITAT, { x: 13, y: 5 });
    expect(placed).not.toBeNull();

    expect(store.canPlaceBuilding({ x: 14, y: 5 }, HABITAT.footprint)).toBe(false);
    expect(store.placeBuilding(HABITAT, { x: 14, y: 5 })).toBeNull();

    expect(store.canPlaceBuilding({ x: 0, y: 0 }, HABITAT.footprint)).toBe(false);
    expect(store.canPlaceBuilding({ x: 2, y: 4 }, HABITAT.footprint)).toBe(false);
  });

  it('supports move operations with occupancy validation', () => {
    const store = new CityLayoutStore({ width: 20, height: 14 });
    const first = store.placeBuilding(HABITAT, { x: 13, y: 5 });
    const second = store.placeBuilding({ ...HABITAT, label: 'Habitat B' }, { x: 13, y: 8 });
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();

    expect(store.moveBuilding(first!.id, { x: 13, y: 8 })).toBe(false);
    expect(store.moveBuilding(first!.id, { x: 6, y: 5 })).toBe(true);
  });

  it('allows roads only on free buildable tiles', () => {
    const store = new CityLayoutStore({ width: 20, height: 14 });
    store.placeBuilding(HABITAT, { x: 13, y: 5 });

    expect(store.placeRoad(11, 2)).toBe(true);
    expect(store.placeRoad(13, 5)).toBe(false);
    expect(store.placeRoad(0, 0)).toBe(false);
    expect(store.placeRoad(18, 12)).toBe(false);
    expect(store.clearRoad(11, 2)).toBe(true);
  });
});
