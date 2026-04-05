import type * as THREE from 'three';
import type { PlanetVisualProfile } from '@/domain/world/planet-visual.types';

export interface ProceduralPlanetUniforms {
  shapeSeed: number;
  reliefSeed: number;
  baseColor: [number, number, number];
  shallowWaterColor: [number, number, number];
  landColor: [number, number, number];
  mountainColor: [number, number, number];
  iceColor: [number, number, number];
  radius: number;
  meshResolution: number;
  oceanLevel: number;
  mountainLevel: number;
  simpleFrequency: number;
  simpleStrength: number;
  ridgedFrequency: number;
  ridgedStrength: number;
  maskStrength: number;
  roughness: number;
  metalness: number;
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
