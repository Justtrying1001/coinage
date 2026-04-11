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

export interface PlanetBiomePalette {
  waterDeep: Vector3Tuple;
  waterShallow: Vector3Tuple;
  humidLow: Vector3Tuple;
  dryLow: Vector3Tuple;
  temperateHigh: Vector3Tuple;
  rocky: Vector3Tuple;
  peak: Vector3Tuple;
  special: Vector3Tuple;
}

export interface PlanetMaterialResponse {
  baseRoughness: number;
  baseMetalness: number;
  waterRoughness: number;
  waterMetalness: number;
  iceBoost: number;
  wetBoost: number;
  ridgeBoost: number;
  basinBoost: number;
  lavaBoost: number;
  specularStrength: number;
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
    palette: PlanetBiomePalette;
    climate: {
      moistureScale: number;
      moistureWarp: number;
      moistureBias: number;
      temperatureBias: number;
      temperatureNoiseScale: number;
      latitudeInfluence: number;
      ridgeScale: number;
      basinScale: number;
    };
    response: PlanetMaterialResponse;
  };
  postfx: {
    bloom: { strength: number; radius: number; threshold: number };
    exposure: number;
    contrast: number;
    saturation: number;
  };
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
    palette: PlanetBiomePalette;
    climate: PlanetArchetypePreset['surface']['climate'];
    response: PlanetMaterialResponse;
  };
  postfx: PlanetArchetypePreset['postfx'];
}
