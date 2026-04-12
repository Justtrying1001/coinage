import type { PlanetArchetype } from '@/game/render/types';

export type PlanetSlotState = 'empty' | 'occupied';

export interface PlanetSlotOccupant {
  id: string;
  label: string;
}

export interface PlanetCitySlot {
  id: string;
  index: number;
  position: [number, number, number];
  normal: [number, number, number];
  elevation: number;
  slope: number;
  habitability: number;
  latitude: number;
  longitude: number;
  state: PlanetSlotState;
  occupant?: PlanetSlotOccupant;
}

export interface PlanetSlotGenerationOptions {
  seed: number;
  archetype: PlanetArchetype;
  blendDepth: number;
  seaLevel: number;
}

export interface PlanetSlotOccupancyResolver {
  resolve(slots: PlanetCitySlot[], seed: number, archetype: PlanetArchetype): PlanetCitySlot[];
}
