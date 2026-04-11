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

export interface PlanetSurfaceMaterialConfig {
  roughness: number;
  metalness: number;
  specularStrength: number;
  roughnessVariance: number;
  metalnessVariance: number;
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
    climate: {
      temperatureBias: number;
      moistureBias: number;
      transitionSharpness: number;
    };
    material: PlanetSurfaceMaterialConfig;
  };
  postfx: {
    bloom: { strength: number; radius: number; threshold: number };
    exposure: number;
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
  climate: PlanetArchetypePreset['surface']['climate'];
  material: PlanetSurfaceMaterialConfig;
  postfx: PlanetArchetypePreset['postfx'];
}
