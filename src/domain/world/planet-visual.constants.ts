import type { MaterialFamily, PaletteFamily, PlanetSizeCategory } from './planet-visual.types';

export const DEFAULT_VISUAL_GEN_VERSION = 1;

export const SIZE_CATEGORY_WEIGHTS: Array<{ category: PlanetSizeCategory; weight: number }> = [
  { category: 'small', weight: 0.24 },
  { category: 'medium', weight: 0.5 },
  { category: 'large', weight: 0.26 },
];

export const SIZE_RADIUS_RANGES: Record<PlanetSizeCategory, { min: number; max: number }> = {
  small: { min: 1.22, max: 1.58 },
  medium: { min: 1.72, max: 2.48 },
  large: { min: 2.74, max: 4.15 },
};

export const MATERIAL_FAMILIES: MaterialFamily[] = ['rocky', 'dusty', 'metallic', 'icy'];

export const PALETTE_FAMILIES: Array<{ name: PaletteFamily; materialBias: MaterialFamily[] }> = [
  { name: 'ember-dust', materialBias: ['dusty', 'rocky'] },
  { name: 'basalt-moss', materialBias: ['rocky'] },
  { name: 'cobalt-ice', materialBias: ['icy', 'metallic'] },
  { name: 'sulfur-stone', materialBias: ['rocky', 'metallic'] },
  { name: 'violet-ash', materialBias: ['dusty', 'metallic'] },
  { name: 'verdant-umber', materialBias: ['rocky', 'dusty'] },
  { name: 'rose-quartz', materialBias: ['icy', 'metallic', 'dusty'] },
];

export const BOUNDS = {
  wobbleFrequency: { min: 0.5, max: 3.5 },
  wobbleAmplitude: { min: 0, max: 0.18 },
  ridgeWarp: { min: 0, max: 1 },
  macroStrength: { min: 0.08, max: 0.6 },
  microStrength: { min: 0.02, max: 0.35 },
  roughness: { min: 0.2, max: 1 },
  craterDensity: { min: 0, max: 0.9 },
  hueShift: { min: -38, max: 38 },
  saturation: { min: 0.3, max: 1 },
  lightness: { min: 0.25, max: 0.8 },
  accentMix: { min: 0, max: 1 },
  atmosphereIntensity: { min: 0.15, max: 0.9 },
  atmosphereThickness: { min: 0.015, max: 0.09 },
  atmosphereTintShift: { min: -20, max: 20 },
} as const;
