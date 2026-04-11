import type { PlanetArchetype } from '@/game/render/types';
import type { Vector3Tuple } from '@/game/planet/utils/vector';

export interface GradientStop {
  anchor: number;
  color: Vector3Tuple;
}

export type NoiseFilterKind = 'simple' | 'ridgid';

export interface NoiseFilterConfig {
  kind: NoiseFilterKind;
  enabled: boolean;
  strength: number;
  roughness: number;
  baseRoughness: number;
  persistence: number;
  minValue: number;
  layerCount: number;
  useFirstLayerAsMask: boolean;
  center: Vector3Tuple;
}

export interface PlanetArchetypePreset {
  generation: {
    resolution: number;
    filters: NoiseFilterConfig[];
  };
  surface: {
    elevationGradient: GradientStop[];
    depthGradient: GradientStop[];
    blendDepth: number;
    roughness: number;
    metalness: number;
  };
  postfx: {
    bloom: { strength: number; radius: number; threshold: number };
    exposure: number;
  };
}

export interface PlanetSurfaceSignalConfig {
  seaLevel: number;
  shoreline: number;
  moisture: number;
  temperature: number;
  biomeBlend: number;
  slopeRock: number;
  peakStart: number;
  humidityNoise: number;
  activityBias: number;
  wetnessBoost: number;
  specularBias: number;
  accentColor: Vector3Tuple;
}

export interface PlanetGenerationConfig {
  seed: number;
  archetype: PlanetArchetype;
  resolution: number;
  radius: number;
  filters: NoiseFilterConfig[];
  elevationGradient: GradientStop[];
  depthGradient: GradientStop[];
  blendDepth: number;
  material: {
    roughness: number;
    metalness: number;
    vegetatedRoughness: number;
    rockRoughness: number;
    peakRoughness: number;
    waterRoughness: number;
    vegetatedMetalness: number;
    rockMetalness: number;
    peakMetalness: number;
    waterMetalness: number;
  };
  surfaceSignals: PlanetSurfaceSignalConfig;
  postfx: PlanetArchetypePreset['postfx'];
}
