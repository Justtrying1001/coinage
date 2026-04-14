import type { PlanetArchetype } from '@/game/render/types';
import type { CityTerrainAlgorithm, CityTerrainMaterialMode } from '@/game/render/modes/terrain/CityTerrainEngine';

export interface CityBiomeSpec {
  algorithm: CityTerrainAlgorithm;
  minHeight: number;
  maxHeight: number;
  frequency: number;
  moisture: number;
  frozen: number;
  thermal: number;
  minerality: number;
  buildArea: {
    centerXPct: number;
    centerZPct: number;
    widthPct: number;
    depthPct: number;
    flatten: number;
    plateauHeight: number;
    transitionFalloff: number;
    maxSlope: number;
  };
  materialMode: CityTerrainMaterialMode;
  water: {
    mode: 'water' | 'ice' | 'lava' | 'none';
    level: number;
    coastBlend: number;
  };
}

export const CITY_BIOME_SPECS: Record<PlanetArchetype, CityBiomeSpec> = {
  oceanic: {
    algorithm: 'simplexLayers', minHeight: -14, maxHeight: 24, frequency: 2.1, moisture: 0.82, frozen: 0.02, thermal: 0.08, minerality: 0.12,
    buildArea: { centerXPct: 0.5, centerZPct: 0.52, widthPct: 0.58, depthPct: 0.5, flatten: 0.96, plateauHeight: -1.4, transitionFalloff: 0.24, maxSlope: 0.11 },
    materialMode: 'heightBlend',
    water: { mode: 'water', level: -4.8, coastBlend: 0.28 },
  },
  frozen: {
    algorithm: 'diamondSquare', minHeight: -18, maxHeight: 19, frequency: 1.9, moisture: 0.48, frozen: 0.94, thermal: 0.04, minerality: 0.2,
    buildArea: { centerXPct: 0.5, centerZPct: 0.51, widthPct: 0.56, depthPct: 0.48, flatten: 0.96, plateauHeight: -0.65, transitionFalloff: 0.22, maxSlope: 0.1 },
    materialMode: 'heightBlend',
    water: { mode: 'ice', level: -3.6, coastBlend: 0.22 },
  },
  arid: {
    algorithm: 'perlinLayers', minHeight: -10, maxHeight: 22, frequency: 2.9, moisture: 0.12, frozen: 0, thermal: 0.25, minerality: 0.26,
    buildArea: { centerXPct: 0.5, centerZPct: 0.52, widthPct: 0.6, depthPct: 0.5, flatten: 0.95, plateauHeight: -0.25, transitionFalloff: 0.26, maxSlope: 0.11 },
    materialMode: 'heightBlend',
    water: { mode: 'none', level: -6.2, coastBlend: 0.15 },
  },
  volcanic: {
    algorithm: 'fault', minHeight: -16, maxHeight: 30, frequency: 2.3, moisture: 0.04, frozen: 0, thermal: 0.96, minerality: 0.46,
    buildArea: { centerXPct: 0.5, centerZPct: 0.52, widthPct: 0.54, depthPct: 0.46, flatten: 0.95, plateauHeight: -1.05, transitionFalloff: 0.24, maxSlope: 0.12 },
    materialMode: 'heightBlend',
    water: { mode: 'lava', level: -7.4, coastBlend: 0.2 },
  },
  mineral: {
    algorithm: 'perlin', minHeight: -12, maxHeight: 24, frequency: 2.4, moisture: 0.08, frozen: 0.04, thermal: 0.16, minerality: 0.92,
    buildArea: { centerXPct: 0.5, centerZPct: 0.51, widthPct: 0.58, depthPct: 0.48, flatten: 0.95, plateauHeight: -0.8, transitionFalloff: 0.23, maxSlope: 0.1 },
    materialMode: 'heightBlend',
    water: { mode: 'none', level: -6.8, coastBlend: 0.12 },
  },
  terrestrial: {
    algorithm: 'simplex', minHeight: -9, maxHeight: 20, frequency: 2.35, moisture: 0.55, frozen: 0.1, thermal: 0.12, minerality: 0.2,
    buildArea: { centerXPct: 0.5, centerZPct: 0.52, widthPct: 0.62, depthPct: 0.52, flatten: 0.96, plateauHeight: 0.02, transitionFalloff: 0.24, maxSlope: 0.1 },
    materialMode: 'heightBlend',
    water: { mode: 'none', level: -5.4, coastBlend: 0.2 },
  },
  jungle: {
    algorithm: 'simplexLayers', minHeight: -8, maxHeight: 18, frequency: 2.55, moisture: 0.92, frozen: 0, thermal: 0.16, minerality: 0.14,
    buildArea: { centerXPct: 0.5, centerZPct: 0.52, widthPct: 0.6, depthPct: 0.52, flatten: 0.95, plateauHeight: 0.08, transitionFalloff: 0.22, maxSlope: 0.1 },
    materialMode: 'heightBlend',
    water: { mode: 'none', level: -4.9, coastBlend: 0.28 },
  },
  barren: {
    algorithm: 'diamondSquare', minHeight: -11, maxHeight: 17, frequency: 1.7, moisture: 0.06, frozen: 0.08, thermal: 0.14, minerality: 0.32,
    buildArea: { centerXPct: 0.5, centerZPct: 0.51, widthPct: 0.58, depthPct: 0.5, flatten: 0.95, plateauHeight: -0.45, transitionFalloff: 0.25, maxSlope: 0.11 },
    materialMode: 'heightBlend',
    water: { mode: 'none', level: -6.4, coastBlend: 0.1 },
  },
};
