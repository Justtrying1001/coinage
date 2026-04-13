import { describe, expect, it } from 'vitest';
import { CityLayoutStore, type BuildingDefinition } from '@/game/city/layout/cityLayout';

const HABITAT: BuildingDefinition = {
  type: 'habitat',
  label: 'Habitat',
  footprint: { width: 2, height: 2 },
};

describe('CityLayoutStore', () => {
  it('places buildings only on valid tiles and rejects collisions', () => {
    const store = new CityLayoutStore({ width: 14, height: 10 });

    expect(store.canPlaceBuilding({ x: 2, y: 2 }, HABITAT.footprint)).toBe(true);
    const placed = store.placeBuilding(HABITAT, { x: 2, y: 2 });
    expect(placed).not.toBeNull();

    expect(store.canPlaceBuilding({ x: 3, y: 2 }, HABITAT.footprint)).toBe(false);
    expect(store.placeBuilding(HABITAT, { x: 3, y: 2 })).toBeNull();

    expect(store.canPlaceBuilding({ x: 0, y: 0 }, HABITAT.footprint)).toBe(false);
  });

  it('supports move operations with occupancy validation', () => {
    const store = new CityLayoutStore({ width: 14, height: 10 });
    const first = store.placeBuilding(HABITAT, { x: 2, y: 2 });
    const second = store.placeBuilding({ ...HABITAT, label: 'Habitat B' }, { x: 7, y: 2 });
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();

    expect(store.moveBuilding(first!.id, { x: 7, y: 2 })).toBe(false);
    expect(store.moveBuilding(first!.id, { x: 4, y: 5 })).toBe(true);
  });

  it('allows roads only on free buildable tiles', () => {
    const store = new CityLayoutStore({ width: 12, height: 10 });
    store.placeBuilding(HABITAT, { x: 2, y: 2 });

    expect(store.placeRoad(1, 1)).toBe(true);
    expect(store.placeRoad(2, 2)).toBe(false);
    expect(store.placeRoad(0, 0)).toBe(false);
    expect(store.clearRoad(1, 1)).toBe(true);
  });
});
