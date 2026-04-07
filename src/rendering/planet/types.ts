import type * as THREE from 'three';
import type { CanonicalPlanet, PlanetDebugSnapshot, PlanetViewProfile } from '@/domain/world/planet-visual.types';

export interface PlanetRendererOptions {
  viewMode: PlanetViewProfile['viewMode'];
  debug?: {
    surfaceOnly?: boolean;
    cloudsOnly?: boolean;
    atmosphereOnly?: boolean;
    ringsOnly?: boolean;
    freezeRotation?: boolean;
  };
}

export interface PlanetRenderInput {
  planet: CanonicalPlanet;
  x: number;
  y: number;
  z: number;
  options: PlanetRendererOptions;
}

export interface PlanetRenderInstance {
  object: THREE.Group;
  dispose: () => void;
  debugSnapshot: PlanetDebugSnapshot;
}
