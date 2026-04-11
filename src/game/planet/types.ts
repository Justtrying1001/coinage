import * as THREE from 'three';
import type { PlanetArchetype, PlanetVisualProfile } from '@/game/render/types';
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
  atmosphere: {
    enabled: boolean;
    color: Vector3Tuple;
    shellScale: number;
    intensity: number;
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
  material: {
    roughness: number;
    metalness: number;
  };
  atmosphere: PlanetArchetypePreset['atmosphere'];
  postfx: PlanetArchetypePreset['postfx'];
}

export interface PlanetBuildResult {
  planetMesh: THREE.Mesh;
  atmosphereMesh: THREE.Mesh | null;
}

export interface PlanetConfigFactoryInput {
  seed: number;
  profile: PlanetVisualProfile;
}
