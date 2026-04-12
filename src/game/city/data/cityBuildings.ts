import type { ColorRepresentation } from 'three';

export type BuildingType = 'hq' | 'mine' | 'quarry' | 'refinery' | 'warehouse' | 'housing';

export interface BuildingDefinition {
  type: BuildingType;
  label: string;
  baseColor: ColorRepresentation;
}

export const BUILDING_DEFINITIONS: Record<BuildingType, BuildingDefinition> = {
  hq: { type: 'hq', label: 'HQ', baseColor: '#f3f7ff' },
  mine: { type: 'mine', label: 'Mine', baseColor: '#94cbff' },
  quarry: { type: 'quarry', label: 'Quarry', baseColor: '#b8c3d2' },
  refinery: { type: 'refinery', label: 'Refinery', baseColor: '#80f0ef' },
  warehouse: { type: 'warehouse', label: 'Warehouse', baseColor: '#d2caac' },
  housing: { type: 'housing', label: 'Housing', baseColor: '#ffd9b1' },
};

export function toBuildingLabel(type: BuildingType): string {
  return BUILDING_DEFINITIONS[type].label;
}
