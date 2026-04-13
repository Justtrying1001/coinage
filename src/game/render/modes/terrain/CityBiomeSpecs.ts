import type { PlanetArchetype } from '@/game/render/types';

export interface CityBiomeSpec {
  coreLift: number;
  edgeDrop: number;
  rimWidth: number;
  basinBias: number;
  ridgeGain: number;
  duneStrength: number;
  shelfStrength: number;
  fractureStrength: number;
  wetnessBoost: number;
  thermalBoost: number;
  mineralBoost: number;
  decorDensity: number;
  decorType: 'coastal' | 'frozen' | 'arid' | 'volcanic' | 'mineral' | 'temperate' | 'jungle' | 'barren';
  waterMode: 'water' | 'ice' | 'lava' | 'none';
}

export const CITY_BIOME_SPECS: Record<PlanetArchetype, CityBiomeSpec> = {
  oceanic: {
    coreLift: 2.4, edgeDrop: 26, rimWidth: 0.54, basinBias: 0.32, ridgeGain: 0.5, duneStrength: 0.08, shelfStrength: 0.86, fractureStrength: 0.08,
    wetnessBoost: 0.4, thermalBoost: 0, mineralBoost: 0.04, decorDensity: 1.1, decorType: 'coastal', waterMode: 'water',
  },
  frozen: {
    coreLift: 1.5, edgeDrop: 22, rimWidth: 0.58, basinBias: 0.24, ridgeGain: 0.62, duneStrength: 0.05, shelfStrength: 0.72, fractureStrength: 0.88,
    wetnessBoost: 0.18, thermalBoost: 0, mineralBoost: 0.1, decorDensity: 0.95, decorType: 'frozen', waterMode: 'ice',
  },
  arid: {
    coreLift: 2.1, edgeDrop: 18, rimWidth: 0.6, basinBias: 0.2, ridgeGain: 0.64, duneStrength: 0.82, shelfStrength: 0.18, fractureStrength: 0.22,
    wetnessBoost: -0.18, thermalBoost: 0.08, mineralBoost: 0.12, decorDensity: 0.85, decorType: 'arid', waterMode: 'none',
  },
  volcanic: {
    coreLift: 2.7, edgeDrop: 24, rimWidth: 0.57, basinBias: 0.26, ridgeGain: 0.9, duneStrength: 0.18, shelfStrength: 0.08, fractureStrength: 0.74,
    wetnessBoost: -0.24, thermalBoost: 0.9, mineralBoost: 0.22, decorDensity: 0.7, decorType: 'volcanic', waterMode: 'lava',
  },
  mineral: {
    coreLift: 2.2, edgeDrop: 20, rimWidth: 0.6, basinBias: 0.18, ridgeGain: 0.76, duneStrength: 0.14, shelfStrength: 0.12, fractureStrength: 0.36,
    wetnessBoost: -0.06, thermalBoost: 0.15, mineralBoost: 0.92, decorDensity: 0.92, decorType: 'mineral', waterMode: 'none',
  },
  terrestrial: {
    coreLift: 1.8, edgeDrop: 16, rimWidth: 0.64, basinBias: 0.15, ridgeGain: 0.52, duneStrength: 0.12, shelfStrength: 0.2, fractureStrength: 0.16,
    wetnessBoost: 0.22, thermalBoost: 0.05, mineralBoost: 0.08, decorDensity: 1.08, decorType: 'temperate', waterMode: 'none',
  },
  jungle: {
    coreLift: 1.9, edgeDrop: 17, rimWidth: 0.62, basinBias: 0.24, ridgeGain: 0.56, duneStrength: 0.06, shelfStrength: 0.24, fractureStrength: 0.14,
    wetnessBoost: 0.34, thermalBoost: 0.08, mineralBoost: 0.05, decorDensity: 1.2, decorType: 'jungle', waterMode: 'none',
  },
  barren: {
    coreLift: 2.1, edgeDrop: 15, rimWidth: 0.65, basinBias: 0.12, ridgeGain: 0.58, duneStrength: 0.3, shelfStrength: 0.1, fractureStrength: 0.2,
    wetnessBoost: -0.22, thermalBoost: 0.06, mineralBoost: 0.12, decorDensity: 0.72, decorType: 'barren', waterMode: 'none',
  },
};
