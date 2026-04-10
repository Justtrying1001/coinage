export type SizeCategory = 'small' | 'medium' | 'large';

export interface Point2D {
  x: number;
  y: number;
}

export interface IslandShapePoint {
  angle: number;
  radiusFactor: number;
}

export interface CitySlot {
  id: string;
  x: number;
  y: number;
  occupied: boolean;
}

export type ShapeFamily = 'compact' | 'stretched' | 'twin-lobed' | 'broken-coast' | 'crescent' | 'plateau';

export interface Faction {
  id: string;
  name: string;
  position: Point2D;
  sizeCategory: SizeCategory;
  radius: number;
  shapeSeed: number;
  shapeFamily: ShapeFamily;
  silhouette: IslandShapePoint[];
  slots: CitySlot[];
}

export interface WorldData {
  seed: number;
  width: number;
  height: number;
  factions: Faction[];
}
