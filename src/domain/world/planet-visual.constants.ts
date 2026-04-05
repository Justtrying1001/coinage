import type {
  MaterialFamily,
  PaletteFamily,
  PlanetArchetype,
  PlanetMacroStyle,
  PlanetSizeCategory,
} from './planet-visual.types';

export const DEFAULT_VISUAL_GEN_VERSION = 3;

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

export interface ArchetypeConfig {
  name: PlanetArchetype;
  weight: number;
  materialWeights: Record<MaterialFamily, number>;
  paletteBias: Partial<Record<PaletteFamily, number>>;
  sizeWeights: Record<PlanetSizeCategory, number>;
  macroStyleWeights: Record<PlanetMacroStyle, number>;
  hydrology: {
    oceanBias: { min: number; max: number };
    minLandRatio: { min: number; max: number };
    maxOceanRatio: { min: number; max: number };
  };
  shapeBias: {
    wobbleFrequency: { min: number; max: number };
    wobbleAmplitude: { min: number; max: number };
    ridgeWarp: { min: number; max: number };
  };
  reliefBias: {
    macroStrength: { min: number; max: number };
    microStrength: { min: number; max: number };
    roughness: { min: number; max: number };
    craterDensity: { min: number; max: number };
  };
  colorBias: {
    saturation: { min: number; max: number };
    lightness: { min: number; max: number };
    accentMix: { min: number; max: number };
  };
  atmosphereChance: number;
}

export const PLANET_ARCHETYPES: ArchetypeConfig[] = [
  {
    name: 'oceanic',
    weight: 1.1,
    materialWeights: { rocky: 0.5, dusty: 0.2, metallic: 0.1, icy: 0.2 },
    paletteBias: { 'emerald-sea': 2.4, 'cobalt-ice': 1.4, 'verdant-umber': 1.25 },
    sizeWeights: { small: 0.05, medium: 0.58, large: 0.37 },
    macroStyleWeights: { supercontinent: 0.2, archipelago: 0.45, 'island-chain': 0.34, fractured: 0.1, 'dual-hemisphere': 0.22, basin: 0.16 },
    hydrology: { oceanBias: { min: 0.65, max: 0.92 }, minLandRatio: { min: 0.38, max: 0.5 }, maxOceanRatio: { min: 0.62, max: 0.72 } },
    shapeBias: { wobbleFrequency: { min: 0.6, max: 2.1 }, wobbleAmplitude: { min: 0.02, max: 0.11 }, ridgeWarp: { min: 0.08, max: 0.45 } },
    reliefBias: { macroStrength: { min: 0.1, max: 0.32 }, microStrength: { min: 0.05, max: 0.2 }, roughness: { min: 0.26, max: 0.64 }, craterDensity: { min: 0.02, max: 0.25 } },
    colorBias: { saturation: { min: 0.5, max: 0.92 }, lightness: { min: 0.4, max: 0.72 }, accentMix: { min: 0.62, max: 1 } },
    atmosphereChance: 0.8,
  },
  {
    name: 'icy',
    weight: 0.95,
    materialWeights: { rocky: 0.15, dusty: 0.1, metallic: 0.2, icy: 0.55 },
    paletteBias: { 'cobalt-ice': 2.2, 'glacier-mint': 2.5, 'rose-quartz': 1.2 },
    sizeWeights: { small: 0.16, medium: 0.62, large: 0.22 },
    macroStyleWeights: { supercontinent: 0.2, archipelago: 0.24, 'island-chain': 0.22, fractured: 0.18, 'dual-hemisphere': 0.32, basin: 0.26 },
    hydrology: { oceanBias: { min: 0.34, max: 0.58 }, minLandRatio: { min: 0.42, max: 0.56 }, maxOceanRatio: { min: 0.52, max: 0.62 } },
    shapeBias: { wobbleFrequency: { min: 0.5, max: 1.7 }, wobbleAmplitude: { min: 0, max: 0.08 }, ridgeWarp: { min: 0.04, max: 0.34 } },
    reliefBias: { macroStrength: { min: 0.08, max: 0.28 }, microStrength: { min: 0.04, max: 0.18 }, roughness: { min: 0.2, max: 0.52 }, craterDensity: { min: 0.04, max: 0.35 } },
    colorBias: { saturation: { min: 0.34, max: 0.68 }, lightness: { min: 0.56, max: 0.82 }, accentMix: { min: 0.42, max: 0.8 } },
    atmosphereChance: 0.86,
  },
  {
    name: 'arid',
    weight: 1,
    materialWeights: { rocky: 0.42, dusty: 0.46, metallic: 0.08, icy: 0.04 },
    paletteBias: { 'arid-ochre': 2.8, 'ember-dust': 1.7, 'sulfur-stone': 1.2 },
    sizeWeights: { small: 0.12, medium: 0.52, large: 0.36 },
    macroStyleWeights: { supercontinent: 0.44, archipelago: 0.1, 'island-chain': 0.16, fractured: 0.24, 'dual-hemisphere': 0.3, basin: 0.4 },
    hydrology: { oceanBias: { min: 0.04, max: 0.24 }, minLandRatio: { min: 0.58, max: 0.72 }, maxOceanRatio: { min: 0.24, max: 0.4 } },
    shapeBias: { wobbleFrequency: { min: 0.9, max: 2.7 }, wobbleAmplitude: { min: 0.04, max: 0.15 }, ridgeWarp: { min: 0.28, max: 0.88 } },
    reliefBias: { macroStrength: { min: 0.2, max: 0.48 }, microStrength: { min: 0.08, max: 0.24 }, roughness: { min: 0.4, max: 0.86 }, craterDensity: { min: 0.18, max: 0.58 } },
    colorBias: { saturation: { min: 0.38, max: 0.78 }, lightness: { min: 0.32, max: 0.62 }, accentMix: { min: 0.08, max: 0.44 } },
    atmosphereChance: 0.42,
  },
  {
    name: 'lush',
    weight: 0.9,
    materialWeights: { rocky: 0.45, dusty: 0.35, metallic: 0.05, icy: 0.15 },
    paletteBias: { 'verdant-umber': 2.1, 'emerald-sea': 1.7, 'basalt-moss': 1.8 },
    sizeWeights: { small: 0.08, medium: 0.56, large: 0.36 },
    macroStyleWeights: { supercontinent: 0.36, archipelago: 0.21, 'island-chain': 0.2, fractured: 0.14, 'dual-hemisphere': 0.34, basin: 0.3 },
    hydrology: { oceanBias: { min: 0.36, max: 0.62 }, minLandRatio: { min: 0.48, max: 0.64 }, maxOceanRatio: { min: 0.42, max: 0.56 } },
    shapeBias: { wobbleFrequency: { min: 0.7, max: 2.2 }, wobbleAmplitude: { min: 0.02, max: 0.12 }, ridgeWarp: { min: 0.1, max: 0.56 } },
    reliefBias: { macroStrength: { min: 0.12, max: 0.4 }, microStrength: { min: 0.06, max: 0.22 }, roughness: { min: 0.3, max: 0.7 }, craterDensity: { min: 0, max: 0.18 } },
    colorBias: { saturation: { min: 0.5, max: 0.98 }, lightness: { min: 0.36, max: 0.74 }, accentMix: { min: 0.44, max: 0.86 } },
    atmosphereChance: 0.78,
  },
  {
    name: 'volcanic',
    weight: 0.62,
    materialWeights: { rocky: 0.28, dusty: 0.16, metallic: 0.5, icy: 0.06 },
    paletteBias: { 'obsidian-lava': 3.2, 'ember-dust': 1.35, 'charcoal-abyss': 1.8 },
    sizeWeights: { small: 0.2, medium: 0.56, large: 0.24 },
    macroStyleWeights: { supercontinent: 0.28, archipelago: 0.08, 'island-chain': 0.1, fractured: 0.46, 'dual-hemisphere': 0.2, basin: 0.22 },
    hydrology: { oceanBias: { min: 0.02, max: 0.16 }, minLandRatio: { min: 0.66, max: 0.8 }, maxOceanRatio: { min: 0.16, max: 0.34 } },
    shapeBias: { wobbleFrequency: { min: 1.1, max: 3.3 }, wobbleAmplitude: { min: 0.08, max: 0.18 }, ridgeWarp: { min: 0.52, max: 1 } },
    reliefBias: { macroStrength: { min: 0.28, max: 0.6 }, microStrength: { min: 0.14, max: 0.35 }, roughness: { min: 0.54, max: 1 }, craterDensity: { min: 0.34, max: 0.9 } },
    colorBias: { saturation: { min: 0.34, max: 0.88 }, lightness: { min: 0.25, max: 0.54 }, accentMix: { min: 0.02, max: 0.34 } },
    atmosphereChance: 0.34,
  },
  {
    name: 'dead',
    weight: 0.64,
    materialWeights: { rocky: 0.35, dusty: 0.25, metallic: 0.3, icy: 0.1 },
    paletteBias: { 'charcoal-abyss': 2.4, 'sulfur-stone': 1.1, 'basalt-moss': 0.8 },
    sizeWeights: { small: 0.16, medium: 0.58, large: 0.26 },
    macroStyleWeights: { supercontinent: 0.28, archipelago: 0.09, 'island-chain': 0.1, fractured: 0.38, 'dual-hemisphere': 0.22, basin: 0.3 },
    hydrology: { oceanBias: { min: 0.06, max: 0.24 }, minLandRatio: { min: 0.6, max: 0.75 }, maxOceanRatio: { min: 0.22, max: 0.4 } },
    shapeBias: { wobbleFrequency: { min: 0.9, max: 2.8 }, wobbleAmplitude: { min: 0.04, max: 0.13 }, ridgeWarp: { min: 0.22, max: 0.76 } },
    reliefBias: { macroStrength: { min: 0.16, max: 0.48 }, microStrength: { min: 0.08, max: 0.28 }, roughness: { min: 0.42, max: 0.9 }, craterDensity: { min: 0.3, max: 0.9 } },
    colorBias: { saturation: { min: 0.3, max: 0.58 }, lightness: { min: 0.25, max: 0.5 }, accentMix: { min: 0, max: 0.22 } },
    atmosphereChance: 0.2,
  },
  {
    name: 'toxic',
    weight: 0.56,
    materialWeights: { rocky: 0.2, dusty: 0.38, metallic: 0.34, icy: 0.08 },
    paletteBias: { 'toxic-neon': 3.8, 'amethyst-haze': 1.5, 'violet-ash': 1.2 },
    sizeWeights: { small: 0.12, medium: 0.56, large: 0.32 },
    macroStyleWeights: { supercontinent: 0.24, archipelago: 0.16, 'island-chain': 0.18, fractured: 0.32, 'dual-hemisphere': 0.26, basin: 0.3 },
    hydrology: { oceanBias: { min: 0.2, max: 0.42 }, minLandRatio: { min: 0.5, max: 0.66 }, maxOceanRatio: { min: 0.3, max: 0.5 } },
    shapeBias: { wobbleFrequency: { min: 0.8, max: 2.5 }, wobbleAmplitude: { min: 0.05, max: 0.16 }, ridgeWarp: { min: 0.32, max: 0.9 } },
    reliefBias: { macroStrength: { min: 0.16, max: 0.45 }, microStrength: { min: 0.08, max: 0.28 }, roughness: { min: 0.44, max: 0.86 }, craterDensity: { min: 0.12, max: 0.5 } },
    colorBias: { saturation: { min: 0.62, max: 1 }, lightness: { min: 0.3, max: 0.62 }, accentMix: { min: 0.32, max: 0.8 } },
    atmosphereChance: 0.9,
  },
  {
    name: 'mineral',
    weight: 0.84,
    materialWeights: { rocky: 0.3, dusty: 0.14, metallic: 0.5, icy: 0.06 },
    paletteBias: { 'sulfur-stone': 1.85, 'charcoal-abyss': 1.4, 'rose-quartz': 1.2 },
    sizeWeights: { small: 0.12, medium: 0.56, large: 0.32 },
    macroStyleWeights: { supercontinent: 0.4, archipelago: 0.08, 'island-chain': 0.11, fractured: 0.32, 'dual-hemisphere': 0.24, basin: 0.32 },
    hydrology: { oceanBias: { min: 0.14, max: 0.32 }, minLandRatio: { min: 0.56, max: 0.7 }, maxOceanRatio: { min: 0.3, max: 0.46 } },
    shapeBias: { wobbleFrequency: { min: 0.9, max: 2.8 }, wobbleAmplitude: { min: 0.04, max: 0.16 }, ridgeWarp: { min: 0.38, max: 0.95 } },
    reliefBias: { macroStrength: { min: 0.18, max: 0.52 }, microStrength: { min: 0.1, max: 0.3 }, roughness: { min: 0.5, max: 0.94 }, craterDensity: { min: 0.18, max: 0.6 } },
    colorBias: { saturation: { min: 0.32, max: 0.74 }, lightness: { min: 0.26, max: 0.56 }, accentMix: { min: 0.08, max: 0.38 } },
    atmosphereChance: 0.36,
  },
  {
    name: 'clouded',
    weight: 0.56,
    materialWeights: { rocky: 0.24, dusty: 0.26, metallic: 0.14, icy: 0.36 },
    paletteBias: { 'glacier-mint': 1.6, 'rose-quartz': 1.2, 'cobalt-ice': 1.4 },
    sizeWeights: { small: 0.08, medium: 0.58, large: 0.34 },
    macroStyleWeights: { supercontinent: 0.18, archipelago: 0.25, 'island-chain': 0.24, fractured: 0.14, 'dual-hemisphere': 0.34, basin: 0.28 },
    hydrology: { oceanBias: { min: 0.42, max: 0.66 }, minLandRatio: { min: 0.42, max: 0.58 }, maxOceanRatio: { min: 0.46, max: 0.62 } },
    shapeBias: { wobbleFrequency: { min: 0.5, max: 1.6 }, wobbleAmplitude: { min: 0, max: 0.08 }, ridgeWarp: { min: 0.04, max: 0.38 } },
    reliefBias: { macroStrength: { min: 0.08, max: 0.26 }, microStrength: { min: 0.02, max: 0.15 }, roughness: { min: 0.2, max: 0.46 }, craterDensity: { min: 0, max: 0.18 } },
    colorBias: { saturation: { min: 0.34, max: 0.7 }, lightness: { min: 0.56, max: 0.8 }, accentMix: { min: 0.26, max: 0.62 } },
    atmosphereChance: 0.98,
  },
  {
    name: 'exotic',
    weight: 0.5,
    materialWeights: { rocky: 0.16, dusty: 0.22, metallic: 0.2, icy: 0.42 },
    paletteBias: { 'amethyst-haze': 2.8, 'violet-ash': 2.1, 'rose-quartz': 1.9, 'toxic-neon': 0.6 },
    sizeWeights: { small: 0.12, medium: 0.54, large: 0.34 },
    macroStyleWeights: { supercontinent: 0.2, archipelago: 0.28, 'island-chain': 0.2, fractured: 0.3, 'dual-hemisphere': 0.24, basin: 0.24 },
    hydrology: { oceanBias: { min: 0.24, max: 0.58 }, minLandRatio: { min: 0.46, max: 0.62 }, maxOceanRatio: { min: 0.34, max: 0.56 } },
    shapeBias: { wobbleFrequency: { min: 0.7, max: 2.6 }, wobbleAmplitude: { min: 0.03, max: 0.14 }, ridgeWarp: { min: 0.22, max: 0.8 } },
    reliefBias: { macroStrength: { min: 0.12, max: 0.44 }, microStrength: { min: 0.08, max: 0.28 }, roughness: { min: 0.36, max: 0.8 }, craterDensity: { min: 0.08, max: 0.42 } },
    colorBias: { saturation: { min: 0.56, max: 1 }, lightness: { min: 0.34, max: 0.72 }, accentMix: { min: 0.3, max: 0.88 } },
    atmosphereChance: 0.88,
  },
  {
    name: 'fragmented',
    weight: 0.58,
    materialWeights: { rocky: 0.42, dusty: 0.3, metallic: 0.2, icy: 0.08 },
    paletteBias: { 'ember-dust': 1.4, 'arid-ochre': 1.2, 'charcoal-abyss': 1.1 },
    sizeWeights: { small: 0.24, medium: 0.56, large: 0.2 },
    macroStyleWeights: { supercontinent: 0.06, archipelago: 0.26, 'island-chain': 0.26, fractured: 0.8, 'dual-hemisphere': 0.1, basin: 0.1 },
    hydrology: { oceanBias: { min: 0.12, max: 0.42 }, minLandRatio: { min: 0.48, max: 0.66 }, maxOceanRatio: { min: 0.3, max: 0.5 } },
    shapeBias: { wobbleFrequency: { min: 1.2, max: 3.4 }, wobbleAmplitude: { min: 0.08, max: 0.18 }, ridgeWarp: { min: 0.58, max: 1 } },
    reliefBias: { macroStrength: { min: 0.26, max: 0.6 }, microStrength: { min: 0.12, max: 0.34 }, roughness: { min: 0.56, max: 0.96 }, craterDensity: { min: 0.16, max: 0.64 } },
    colorBias: { saturation: { min: 0.34, max: 0.84 }, lightness: { min: 0.28, max: 0.58 }, accentMix: { min: 0.06, max: 0.5 } },
    atmosphereChance: 0.32,
  },
  {
    name: 'superterran',
    weight: 0.22,
    materialWeights: { rocky: 0.56, dusty: 0.18, metallic: 0.08, icy: 0.18 },
    paletteBias: { 'verdant-umber': 2.2, 'emerald-sea': 1.8, 'basalt-moss': 1.5, 'cobalt-ice': 0.9 },
    sizeWeights: { small: 0.02, medium: 0.34, large: 0.64 },
    macroStyleWeights: { supercontinent: 0.5, archipelago: 0.12, 'island-chain': 0.1, fractured: 0.12, 'dual-hemisphere': 0.44, basin: 0.38 },
    hydrology: { oceanBias: { min: 0.34, max: 0.58 }, minLandRatio: { min: 0.56, max: 0.72 }, maxOceanRatio: { min: 0.34, max: 0.52 } },
    shapeBias: { wobbleFrequency: { min: 0.8, max: 2 }, wobbleAmplitude: { min: 0.02, max: 0.1 }, ridgeWarp: { min: 0.16, max: 0.52 } },
    reliefBias: { macroStrength: { min: 0.14, max: 0.36 }, microStrength: { min: 0.06, max: 0.2 }, roughness: { min: 0.28, max: 0.64 }, craterDensity: { min: 0, max: 0.16 } },
    colorBias: { saturation: { min: 0.48, max: 0.92 }, lightness: { min: 0.42, max: 0.74 }, accentMix: { min: 0.46, max: 0.88 } },
    atmosphereChance: 0.88,
  },
];
