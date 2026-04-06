import type * as THREE from 'three';
import type { PlanetVisualProfile } from '@/domain/world/planet-visual.types';

export type TerrainProfileKind = 'smooth' | 'moderate' | 'rough' | 'extreme' | 'fragmented' | 'continental';
export type SurfaceCategoryKind =
  | 'ocean'
  | 'desert'
  | 'ice'
  | 'volcanic'
  | 'lush'
  | 'mineral'
  | 'barren'
  | 'toxic'
  | 'abyssal';

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
  minLandRatio: number;
  simpleFrequency: number;
  simpleStrength: number;
  ridgedFrequency: number;
  ridgedStrength: number;
  maskStrength: number;
  surfaceCategory: SurfaceCategoryKind;
  terrainProfile: TerrainProfileKind;
  elevationCap: number;
  terrainSmoothing: number;
  ridgeAttenuation: number;
  detailAttenuation: number;
  continentThreshold: number;
  continentSharpness: number;
  continentDrift: number;
  trenchDepth: number;
  biomeHarshness: number;
  craterStrength: number;
  thermalActivity: number;
  bandingStrength: number;
  bandingFrequency: number;
  colorContrast: number;
  roughness: number;
  metalness: number;
  atmosphereEnabled: boolean;
  atmosphereIntensity: number;
  atmosphereThickness: number;
  atmosphereColor: [number, number, number];
}

export interface PlanetRendererOptions {
  lod?: 'galaxy' | 'planet';
  enableAtmosphere?: boolean;
}

export interface PrecomputedTerrainBuffers {
  indices: Uint32Array;
  positions: Float32Array;
  colors: Float32Array;
  terrain: Float32Array;
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
  precomputedTerrainBuffers?: PrecomputedTerrainBuffers;
}
