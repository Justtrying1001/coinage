import type * as THREE from 'three';
import type { PlanetArchetype, PlanetVisualProfile } from '@/game/render/types';
import type { PlanetGenerationConfig } from '@/game/planet/types';

export interface CityTerrainInput {
  seed: number;
  archetype: PlanetArchetype;
  visual: PlanetVisualProfile;
  planet: PlanetGenerationConfig;
  palettes: {
    low: THREE.Color;
    high: THREE.Color;
    cliff: THREE.Color;
    accent: THREE.Color;
    fog: THREE.Color;
    sky: THREE.Color;
    water: THREE.Color;
  };
  climate: {
    humidity: number;
    oceanLevel: number;
    frozen: number;
    thermal: number;
    minerality: number;
    vegetation: number;
  };
  shape: {
    reliefStrength: number;
    reliefSharpness: number;
    continentScale: number;
    ridgeScale: number;
    craterScale: number;
    macroBias: number;
    ridgeWeight: number;
    craterWeight: number;
    polarWeight: number;
    emissiveIntensity: number;
  };
  material: {
    roughness: number;
    metalness: number;
    wetness: number;
    microReliefStrength: number;
    microReliefScale: number;
    microNormalStrength: number;
    microAlbedoBreakup: number;
  };
}

export interface CityLayoutMaskSource {
  blocked: Set<string>;
  expansion: Set<string>;
}

export interface BuildSurfaceSnapshot {
  center: { x: number; z: number };
  width: number;
  depth: number;
  plateauHeight: number;
  transitionFalloff: number;
  maxSlope: number;
  slopes: Float32Array;
  stableMask: Float32Array;
}

export interface TerrainGeometryConfig {
  terrainWidth: number;
  terrainDepth: number;
  farWidth: number;
  farDepth: number;
  nearSegmentsX: number;
  nearSegmentsZ: number;
  farSegmentsX: number;
  farSegmentsZ: number;
}

export interface TerrainSample {
  height: number;
  masks: {
    height01: number;
    slope: number;
    cliff: number;
    wetness: number;
    shoreline: number;
    frozen: number;
    thermal: number;
    mineralized: number;
    vegetationSuitability: number;
  };
}
