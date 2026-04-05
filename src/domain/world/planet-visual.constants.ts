import type { MaterialFamily, PaletteFamily, PlanetSizeCategory } from './planet-visual.types';

export const DEFAULT_VISUAL_GEN_VERSION = 2;

export const SIZE_CATEGORY_WEIGHTS: Array<{ category: PlanetSizeCategory; weight: number }> = [
  { category: 'small', weight: 0.35 },
  { category: 'medium', weight: 0.45 },
  { category: 'large', weight: 0.2 },
];

export const SIZE_RADIUS_RANGES: Record<PlanetSizeCategory, { min: number; max: number }> = {
  small: { min: 0.8, max: 1.0 },
  medium: { min: 1.0, max: 1.3 },
  large: { min: 1.3, max: 1.7 },
};

export const MATERIAL_FAMILIES: MaterialFamily[] = ['rocky', 'dusty', 'metallic', 'icy'];

export const PALETTE_FAMILIES: Array<{ name: PaletteFamily; materialBias: MaterialFamily[] }> = [
  { name: 'ember-dust', materialBias: ['dusty', 'rocky'] },
  { name: 'basalt-moss', materialBias: ['rocky'] },
  { name: 'cobalt-ice', materialBias: ['icy', 'metallic'] },
  { name: 'sulfur-stone', materialBias: ['rocky', 'metallic'] },
  { name: 'violet-ash', materialBias: ['dusty', 'metallic'] },
];

export const BOUNDS = {
  wobbleFrequency: { min: 0.5, max: 3.5 },
  wobbleAmplitude: { min: 0, max: 0.2 },
  ridgeWarp: { min: 0, max: 1 },
  macroStrength: { min: 0.14, max: 0.82 },
  microStrength: { min: 0.08, max: 0.5 },
  roughness: { min: 0.22, max: 1 },
  craterDensity: { min: 0, max: 0.95 },
  oceanLevel: { min: 0.22, max: 0.66 },
  biomeScale: { min: 0.7, max: 2.3 },
  heatBias: { min: -0.35, max: 0.35 },
  moistureBias: { min: -0.35, max: 0.35 },
  ridgeSharpness: { min: 0.4, max: 1.3 },
  hueShift: { min: -25, max: 25 },
  saturation: { min: 0.25, max: 0.95 },
  lightness: { min: 0.25, max: 0.8 },
  accentMix: { min: 0, max: 1 },
  atmosphereIntensity: { min: 0.15, max: 0.9 },
  atmosphereThickness: { min: 0.015, max: 0.09 },
  atmosphereTintShift: { min: -20, max: 20 },
} as const;
