import type { MaterialFamily, PaletteFamily, PlanetSizeCategory } from './planet-visual.types';

export const DEFAULT_VISUAL_GEN_VERSION = 1;

export const SIZE_CATEGORY_WEIGHTS: Array<{ category: PlanetSizeCategory; weight: number }> = [
  { category: 'small', weight: 0.18 },
  { category: 'medium', weight: 0.56 },
  { category: 'large', weight: 0.26 },
];

export const SIZE_RADIUS_RANGES: Record<PlanetSizeCategory, { min: number; max: number }> = {
  small: { min: 1.52, max: 1.94 },
  medium: { min: 2.02, max: 2.88 },
  large: { min: 3.06, max: 4.32 },
};

export const MATERIAL_FAMILIES: MaterialFamily[] = ['rocky', 'dusty', 'metallic', 'icy'];

export const PALETTE_FAMILIES: Array<{ name: PaletteFamily; materialBias: MaterialFamily[]; weight: number }> = [
  { name: 'ember-dust', materialBias: ['dusty', 'rocky'], weight: 0.9 },
  { name: 'basalt-moss', materialBias: ['rocky'], weight: 1 },
  { name: 'cobalt-ice', materialBias: ['icy', 'metallic'], weight: 0.85 },
  { name: 'sulfur-stone', materialBias: ['rocky', 'metallic'], weight: 0.85 },
  { name: 'violet-ash', materialBias: ['dusty', 'metallic'], weight: 0.8 },
  { name: 'verdant-umber', materialBias: ['rocky', 'dusty'], weight: 0.95 },
  { name: 'rose-quartz', materialBias: ['icy', 'metallic', 'dusty'], weight: 0.75 },
  { name: 'glacier-mint', materialBias: ['icy'], weight: 0.62 },
  { name: 'arid-ochre', materialBias: ['dusty', 'rocky'], weight: 0.78 },
  { name: 'obsidian-lava', materialBias: ['metallic', 'rocky'], weight: 0.58 },
  { name: 'toxic-neon', materialBias: ['metallic', 'dusty'], weight: 0.5 },
  { name: 'amethyst-haze', materialBias: ['icy', 'dusty', 'metallic'], weight: 0.52 },
  { name: 'emerald-sea', materialBias: ['rocky', 'icy'], weight: 0.56 },
  { name: 'charcoal-abyss', materialBias: ['metallic', 'rocky'], weight: 0.46 },
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
