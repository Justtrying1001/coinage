export type CityTileKind = 'buildable' | 'blocked' | 'road' | 'building' | 'expansion';
export type CityZone = 'core' | 'expansion' | 'blocked';

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
  fixed?: boolean;
}

export interface CityLayoutSnapshot {
  grid: GridSize;
  blocked: Set<string>;
  expansion: Set<string>;
  roads: Set<string>;
  buildings: BuildingPlacement[];
}

export class CityLayoutStore {
  private nextBuildingId = 1;
  private readonly blocked = new Set<string>();
  private readonly expansion = new Set<string>();
  private readonly roads = new Set<string>();
  private readonly buildings = new Map<string, BuildingPlacement>();

  constructor(private readonly grid: GridSize) {
    this.seedSpatialScaffold();
  }

  getSnapshot(): CityLayoutSnapshot {
    return {
      grid: this.grid,
      blocked: new Set(this.blocked),
      expansion: new Set(this.expansion),
      roads: new Set(this.roads),
      buildings: [...this.buildings.values()],
    };
  }

  getTileKind(x: number, y: number): CityTileKind {
    const key = tileKey(x, y);
    if (this.blocked.has(key)) return 'blocked';
    if (this.expansion.has(key)) return 'expansion';
    if (this.findBuildingAt(x, y)) return 'building';
    if (this.roads.has(key)) return 'road';
    return 'buildable';
  }

  getTileZone(x: number, y: number): CityZone {
    const key = tileKey(x, y);
    if (this.blocked.has(key)) return 'blocked';
    if (this.expansion.has(key)) return 'expansion';
    return 'core';
  }

  canPlaceRoad(x: number, y: number) {
    if (!this.isWithinBounds(x, y)) return false;
    const key = tileKey(x, y);
    if (this.blocked.has(key)) return false;
    if (this.findBuildingAt(x, y)) return false;
    if (!this.isRoadConnectedToNetwork(x, y)) return false;
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
    let touchesRoadNetwork = false;
    for (const tile of iterateFootprint(anchor, footprint)) {
      if (!this.isWithinBounds(tile.x, tile.y)) return false;
      const key = tileKey(tile.x, tile.y);
      if (this.blocked.has(key)) return false;
      if (this.expansion.has(key)) return false;
      if (this.roads.has(key)) return false;

      const occupant = this.findBuildingAt(tile.x, tile.y);
      if (!occupant) continue;
      if (!ignoreBuildingId || occupant.id !== ignoreBuildingId) return false;
    }

    for (const tile of iterateFootprint(anchor, footprint)) {
      if (this.hasRoadOrHubNeighbor(tile.x, tile.y, ignoreBuildingId)) {
        touchesRoadNetwork = true;
        break;
      }
    }

    return touchesRoadNetwork;
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
    const building = this.buildings.get(buildingId);
    if (building?.fixed) return false;
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

  private seedSpatialScaffold() {
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

    for (let x = 2; x <= 4; x += 1) {
      for (let y = 3; y <= height - 4; y += 1) {
        this.expansion.add(tileKey(x, y));
      }
    }

    for (let x = width - 5; x <= width - 3; x += 1) {
      for (let y = 3; y <= height - 4; y += 1) {
        this.expansion.add(tileKey(x, y));
      }
    }

    const hq: BuildingPlacement = {
      id: 'hq',
      type: 'industry',
      label: 'Town Hall',
      anchor: { x: centerX - 1, y: centerY - 1 },
      footprint: { width: 3, height: 3 },
      fixed: true,
    };
    this.buildings.set(hq.id, hq);

    for (let x = 2; x <= width - 3; x += 1) {
      if (x >= hq.anchor.x && x < hq.anchor.x + hq.footprint.width) continue;
      this.roads.add(tileKey(x, centerY));
    }
    for (let y = 2; y <= height - 3; y += 1) {
      if (y >= hq.anchor.y && y < hq.anchor.y + hq.footprint.height) continue;
      this.roads.add(tileKey(centerX, y));
    }

    for (let x = hq.anchor.x - 1; x <= hq.anchor.x + hq.footprint.width; x += 1) {
      if (x <= 1 || x >= width - 1) continue;
      this.roads.add(tileKey(x, hq.anchor.y - 1));
      this.roads.add(tileKey(x, hq.anchor.y + hq.footprint.height));
    }
    for (let y = hq.anchor.y - 1; y <= hq.anchor.y + hq.footprint.height; y += 1) {
      if (y <= 1 || y >= height - 1) continue;
      this.roads.add(tileKey(hq.anchor.x - 1, y));
      this.roads.add(tileKey(hq.anchor.x + hq.footprint.width, y));
    }
  }

  private hasRoadOrHubNeighbor(x: number, y: number, ignoreBuildingId?: string) {
    const deltas: TileCoord[] = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ];

    for (const delta of deltas) {
      const nx = x + delta.x;
      const ny = y + delta.y;
      if (!this.isWithinBounds(nx, ny)) continue;
      const key = tileKey(nx, ny);
      if (this.roads.has(key)) return true;
      const neighborBuilding = this.findBuildingAt(nx, ny);
      if (!neighborBuilding) continue;
      if (neighborBuilding.fixed) return true;
      if (ignoreBuildingId && neighborBuilding.id === ignoreBuildingId) continue;
    }

    return false;
  }

  private isRoadConnectedToNetwork(x: number, y: number) {
    if (this.roads.size === 0) return true;
    return this.hasRoadOrHubNeighbor(x, y);
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
