import type { PlanetSizeCategory } from './planet-visual.types';

export const DEFAULT_VISUAL_GEN_VERSION = 5;

export const SIZE_CATEGORY_WEIGHTS: Array<{ category: PlanetSizeCategory; weight: number }> = [
  { category: 'small', weight: 0.08 },
  { category: 'medium', weight: 0.58 },
  { category: 'large', weight: 0.34 },
];

export const SIZE_RADIUS_RANGES: Record<PlanetSizeCategory, { min: number; max: number }> = {
  small: { min: 1.9, max: 2.3 },
  medium: { min: 2.36, max: 3.3 },
  large: { min: 3.34, max: 4.78 },
};

export const BOUNDS = {
  wobbleFrequency: { min: 0.5, max: 3.5 },
  wobbleAmplitude: { min: 0, max: 0.18 },
  ridgeWarp: { min: 0, max: 1 },
  macroStrength: { min: 0.08, max: 0.6 },
  microStrength: { min: 0.02, max: 0.35 },
  roughness: { min: 0.2, max: 1 },
  craterDensity: { min: 0, max: 0.9 },
  hueShift: { min: -18, max: 18 },
  saturation: { min: 0.3, max: 1 },
  lightness: { min: 0.24, max: 0.85 },
  accentMix: { min: 0, max: 1 },
  atmosphereIntensity: { min: 0.1, max: 1 },
  atmosphereThickness: { min: 0.015, max: 0.09 },
  atmosphereTintShift: { min: -20, max: 20 },
} as const;
