import type { PlanetArchetype } from '@/game/render/types';
import type { PlanetVisualProfile } from '@/game/render/types';
import type { Vector3Tuple } from '@/game/planet/utils/vector';

export interface GradientStop {
  anchor: number;
  color: Vector3Tuple;
}

export type NoiseFilterKind = 'simple' | 'ridgid';
export type PlanetSurfaceMode = 'water' | 'ice' | 'lava';

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
    canopyTint: Vector3Tuple;
    roughness: number;
    metalness: number;
    vegetationDensity: number;
    wetness: number;
  };
  postfx: {
    bloom: { strength: number; radius: number; threshold: number };
    exposure: number;
  };
}

export interface PlanetGenerationConfig {
  seed: number;
  archetype: PlanetArchetype;
  profile: PlanetVisualProfile;
  resolution: number;
  radius: number;
  filters: NoiseFilterConfig[];
  elevationGradient: GradientStop[];
  depthGradient: GradientStop[];
  blendDepth: number;
  seaLevel: number;
  surfaceMode: PlanetSurfaceMode;
  material: {
    roughness: number;
    metalness: number;
    vegetationDensity: number;
    wetness: number;
    canopyTint: Vector3Tuple;
  };
  postfx: PlanetArchetypePreset['postfx'];
}
