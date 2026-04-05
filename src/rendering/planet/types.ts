import type * as THREE from 'three';
import type { PlanetVisualProfile } from '@/domain/world/planet-visual.types';

export interface ProceduralPlanetUniforms {
  baseColor: [number, number, number];
  accentColor: [number, number, number];
  seedA: number;
  seedB: number;
  radius: number;
  wobbleFrequency: number;
  wobbleAmplitude: number;
  ridgeWarp: number;
  macroStrength: number;
  microStrength: number;
  roughness: number;
  craterDensity: number;
  atmosphereEnabled: boolean;
  atmosphereIntensity: number;
  atmosphereThickness: number;
  atmosphereColor: [number, number, number];
}

export interface PlanetRendererOptions {
  lod?: 'galaxy';
}

export interface PlanetRenderInstance {
  object: THREE.Group;
  dispose: () => void;
}

export interface PlanetRenderInput {
  profile: PlanetVisualProfile;
  x: number;
  y: number;
  z: number;
  options?: PlanetRendererOptions;
}
