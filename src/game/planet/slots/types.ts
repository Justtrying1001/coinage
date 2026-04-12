import type * as THREE from 'three';
import type { PlanetArchetype, PlanetVisualProfile } from '@/game/render/types';
import type { PlanetSurfaceMode } from '@/game/planet/types';

export type PlanetSlotState = 'empty';

export interface PlanetSettlementSlot {
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
}

export interface PlanetSlotGenerationInput {
  seed: number;
  archetype: PlanetArchetype;
  profile: PlanetVisualProfile;
  seaLevel: number;
  surfaceMode: PlanetSurfaceMode;
  radius: number;
}

export interface GeneratedPlanet {
  root: THREE.Group;
  surfaceMesh: THREE.Mesh;
  surfaceGeometry: THREE.BufferGeometry;
  settlementSlots: PlanetSettlementSlot[];
}

export interface PlanetSlotSummary {
  total: number;
  occupied: number;
  available: number;
}
