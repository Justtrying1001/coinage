import type { PlanetArchetype, PlanetVisualProfile } from '@/game/render/types';
import type { PlanetGenerationConfig } from '@/game/planet/types';

export interface TerrainGridSpec {
  size: number;
  resolution: number;
}

export interface TerrainSampleField {
  width: number;
  height: number;
  data: Float32Array;
}

export interface MaskField {
  width: number;
  height: number;
  data: Uint8Array;
}

export interface CameraAnchors {
  eye: [number, number, number];
  target: [number, number, number];
  horizon: [number, number, number];
  inspectEye: [number, number, number];
}

export interface BuildZoneMetrics {
  meanSlopeBuildZone: number;
  p90SlopeBuildZone: number;
  contiguousUsableAreaScore: number;
  cameraBuildZoneRelevance: number;
  reservedCellCount: number;
  buildableCellCount: number;
}

export interface BuildZonePlan {
  buildableMask: MaskField;
  reservedZoneMask: MaskField;
  metrics: BuildZoneMetrics;
}

export interface CityBiomeRecipe {
  archetype: PlanetArchetype;
  terrainSize: number;
  resolution: number;
  macroAmplitude: number;
  macroFrequency: number;
  mesoAmplitude: number;
  mesoFrequency: number;
  microAmplitude: number;
  microFrequency: number;
  reliefBias: number;
  reservedZoneCenter: [number, number];
  reservedZoneRadius: [number, number];
  preferredViewAzimuth: number;
  preferredViewPitch: number;
  skylineLift: number;
}

export interface CityTerrainContext {
  seed: number;
  profile: PlanetVisualProfile;
  config: PlanetGenerationConfig;
  recipe: CityBiomeRecipe;
}

export interface TerrainResult {
  grid: TerrainGridSpec;
  heights: TerrainSampleField;
  elevations: TerrainSampleField;
  slopeField: TerrainSampleField;
  buildZone: BuildZonePlan;
  cameraAnchors: CameraAnchors;
  context: CityTerrainContext;
}
