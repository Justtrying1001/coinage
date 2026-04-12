import * as THREE from 'three';
import type { PlanetGenerationConfig } from '@/game/planet/types';

export interface PlanetSurfaceSample {
  point: THREE.Vector3;
  normal: THREE.Vector3;
  direction: THREE.Vector3;
  elevation: number;
  elev01: number;
  faceIndex: number;
}

export interface PlanetSlotCandidate {
  direction: THREE.Vector3;
  sample: PlanetSurfaceSample;
  slopeMetric: number;
  localNormalVariance: number;
  localElevationVariance: number;
  qualityScore: number;
}

export interface PlanetSlot {
  index: number;
  position: THREE.Vector3;
  normal: THREE.Vector3;
  direction: THREE.Vector3;
  elevation: number;
  elev01: number;
  score: number;
}

export interface PlanetSlotThresholds {
  coastMargin: number;
  lavaMargin: number;
  maxSlopeRad: number;
  maxSlopeMetric: number;
  localProbeCount: number;
  localProbeRadiusRad: number;
  maxNormalVariance: number;
  maxElevationVariance: number;
  minSpacingRad: number;
}

export interface PlanetSlotGenerationInput {
  seed: number;
  surfaceMesh: THREE.Mesh;
  config: PlanetGenerationConfig;
  minElevation: number;
  maxElevation: number;
}

export interface PlanetSlotGenerationDebug {
  attempts: number;
  candidateCount: number;
  projectedCount: number;
  validCount: number;
  targetCount: number;
  relaxedThresholds: number;
}

export interface PlanetSlotGenerationResult {
  slots: PlanetSlot[];
  debug: PlanetSlotGenerationDebug;
}
