export type CityTileKind = 'buildable' | 'blocked' | 'road' | 'building';

export interface GridSize {
  width: number;
  height: number;
}

export interface TileCoord {
  x: number;
  y: number;
}

export interface BuildingFootprint {
  width: number;
  height: number;
}

export interface BuildingDefinition {
  type: 'habitat' | 'industry';
  label: string;
  footprint: BuildingFootprint;
}

export interface BuildingPlacement {
  id: string;
  type: BuildingDefinition['type'];
  label: string;
  anchor: TileCoord;
  footprint: BuildingFootprint;
}

export interface CityLayoutSnapshot {
  grid: GridSize;
  blocked: Set<string>;
  roads: Set<string>;
  buildings: BuildingPlacement[];
}

const BLOCKED_RING_PADDING = 1;

export class CityLayoutStore {
  private nextBuildingId = 1;
  private readonly blocked = new Set<string>();
  private readonly roads = new Set<string>();
  private readonly buildings = new Map<string, BuildingPlacement>();

  constructor(private readonly grid: GridSize) {
    this.seedBlockedTiles();
  }

  getSnapshot(): CityLayoutSnapshot {
    return {
      grid: this.grid,
      blocked: new Set(this.blocked),
      roads: new Set(this.roads),
      buildings: [...this.buildings.values()],
    };
  }

  getTileKind(x: number, y: number): CityTileKind {
    const key = tileKey(x, y);
    if (this.blocked.has(key)) return 'blocked';
    if (this.findBuildingAt(x, y)) return 'building';
    if (this.roads.has(key)) return 'road';
    return 'buildable';
  }

  canPlaceRoad(x: number, y: number) {
    if (!this.isWithinBounds(x, y)) return false;
    const key = tileKey(x, y);
    if (this.blocked.has(key)) return false;
    if (this.findBuildingAt(x, y)) return false;
    return true;
  }

  placeRoad(x: number, y: number) {
    if (!this.canPlaceRoad(x, y)) return false;
    this.roads.add(tileKey(x, y));
    return true;
  }

  clearRoad(x: number, y: number) {
    return this.roads.delete(tileKey(x, y));
  }

  canPlaceBuilding(anchor: TileCoord, footprint: BuildingFootprint, ignoreBuildingId?: string) {
    for (const tile of iterateFootprint(anchor, footprint)) {
      if (!this.isWithinBounds(tile.x, tile.y)) return false;
      const key = tileKey(tile.x, tile.y);
      if (this.blocked.has(key)) return false;
      if (this.roads.has(key)) return false;

      const occupant = this.findBuildingAt(tile.x, tile.y);
      if (!occupant) continue;
      if (!ignoreBuildingId || occupant.id !== ignoreBuildingId) return false;
    }
    return true;
  }

  placeBuilding(definition: BuildingDefinition, anchor: TileCoord) {
    if (!this.canPlaceBuilding(anchor, definition.footprint)) return null;
    const placement: BuildingPlacement = {
      id: `b-${this.nextBuildingId++}`,
      type: definition.type,
      label: definition.label,
      anchor,
      footprint: definition.footprint,
    };
    this.buildings.set(placement.id, placement);
    return placement;
  }

  moveBuilding(buildingId: string, anchor: TileCoord) {
    const current = this.buildings.get(buildingId);
    if (!current) return false;
    if (!this.canPlaceBuilding(anchor, current.footprint, buildingId)) return false;
    this.buildings.set(buildingId, { ...current, anchor });
    return true;
  }

  removeBuilding(buildingId: string) {
    return this.buildings.delete(buildingId);
  }

  getBuildingById(buildingId: string) {
    return this.buildings.get(buildingId) ?? null;
  }

  getBuildingAt(x: number, y: number) {
    return this.findBuildingAt(x, y);
  }

  private isWithinBounds(x: number, y: number) {
    return x >= 0 && y >= 0 && x < this.grid.width && y < this.grid.height;
  }

  private findBuildingAt(x: number, y: number) {
    for (const building of this.buildings.values()) {
      const insideX = x >= building.anchor.x && x < building.anchor.x + building.footprint.width;
      const insideY = y >= building.anchor.y && y < building.anchor.y + building.footprint.height;
      if (insideX && insideY) return building;
    }
    return null;
  }

  private seedBlockedTiles() {
    const { width, height } = this.grid;
    for (let x = 0; x < width; x += 1) {
      this.blocked.add(tileKey(x, 0));
      this.blocked.add(tileKey(x, height - 1));
    }
    for (let y = 0; y < height; y += 1) {
      this.blocked.add(tileKey(0, y));
      this.blocked.add(tileKey(width - 1, y));
    }

    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    for (let y = centerY - BLOCKED_RING_PADDING; y <= centerY + BLOCKED_RING_PADDING; y += 1) {
      this.blocked.add(tileKey(centerX - 4, y));
      this.blocked.add(tileKey(centerX + 4, y));
    }
  }
}

export function tileKey(x: number, y: number) {
  return `${x},${y}`;
}

function* iterateFootprint(anchor: TileCoord, footprint: BuildingFootprint) {
  for (let y = 0; y < footprint.height; y += 1) {
    for (let x = 0; x < footprint.width; x += 1) {
      yield { x: anchor.x + x, y: anchor.y + y };
    }
  }
}
