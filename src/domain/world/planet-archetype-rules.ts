import type { PlanetVisualProfile, PaletteFamily, PlanetArchetype, PlanetMacroStyle, MaterialFamily } from './planet-visual.types';

export type PatternAllowance = 'forbidden' | 'subtle' | 'limited' | 'allowed';
export type CraterAllowance = 'none' | 'light' | 'heavy';
export type SurfaceType = 'ocean' | 'desert' | 'ice' | 'volcanic' | 'lush' | 'mineral' | 'barren' | 'toxic' | 'abyssal';

export interface ArchetypeDefinition {
  name: PlanetArchetype;
  weight: number;
  allowedPalettes: PaletteFamily[];
  hydrology: { oceanMin: number; oceanMax: number };
  surfaceRules: { allowedSurfaceTypes: SurfaceType[] };
  reliefRules: {
    macroMin: number;
    macroMax: number;
    microMin: number;
    microMax: number;
    roughnessMin: number;
    roughnessMax: number;
    ridgeWarpMin: number;
    ridgeWarpMax: number;
  };
  patternRules: {
    banding: PatternAllowance;
    thermal: PatternAllowance;
    crater: CraterAllowance;
  };
  colorRules: {
    hueShiftMin: number;
    hueShiftMax: number;
    saturationMin: number;
    saturationMax: number;
    lightnessMin: number;
    lightnessMax: number;
  };
  atmosphere: {
    allowed: boolean;
    intensityRange?: [number, number];
    thicknessRange?: [number, number];
    tintShiftRange?: [number, number];
  };
  materialWeights: Record<MaterialFamily, number>;
  macroStyleWeights: Record<PlanetMacroStyle, number>;
}

export const PALETTE_LIBRARY: Record<PaletteFamily, { owner: PlanetArchetype; water: string; land: string }> = {
  'emerald-sea': { owner: 'oceanic', water: '#2f8671', land: '#4b7b5d' },
  'verdant-umber': { owner: 'lush', water: '#3f7562', land: '#688c52' },
  'basalt-moss': { owner: 'superterran', water: '#465f55', land: '#586f50' },
  'cobalt-ice': { owner: 'icy', water: '#3f6796', land: '#7f91a2' },
  'glacier-mint': { owner: 'icy', water: '#6e8f9f', land: '#b9c6c3' },
  'arid-ochre': { owner: 'arid', water: '#5a4f3f', land: '#c39a5a' },
  'obsidian-lava': { owner: 'volcanic', water: '#2f2926', land: '#4f3b38' },
  'charcoal-abyss': { owner: 'dead', water: '#22262d', land: '#38404d' },
  'toxic-neon': { owner: 'toxic', water: '#536338', land: '#65a349' },
  'sulfur-stone': { owner: 'mineral', water: '#5f5846', land: '#ac9450' },
  'amethyst-haze': { owner: 'clouded', water: '#6f5aa2', land: '#8774a2' },
  'violet-ash': { owner: 'exotic', water: '#5f5f8d', land: '#75677a' },
  'rose-quartz': { owner: 'exotic', water: '#5f5b71', land: '#9e7b8b' },
  'ember-dust': { owner: 'fragmented', water: '#4b4238', land: '#9b6c43' },
};

export const ARCHETYPE_DEFINITIONS: Record<PlanetArchetype, ArchetypeDefinition> = {
  oceanic: {
    name: 'oceanic',
    weight: 1.1,
    allowedPalettes: ['emerald-sea'],
    hydrology: { oceanMin: 0.7, oceanMax: 1 },
    surfaceRules: { allowedSurfaceTypes: ['ocean'] },
    reliefRules: { macroMin: 0.1, macroMax: 0.3, microMin: 0.03, microMax: 0.14, roughnessMin: 0.25, roughnessMax: 0.55, ridgeWarpMin: 0.08, ridgeWarpMax: 0.4 },
    patternRules: { banding: 'forbidden', thermal: 'forbidden', crater: 'light' },
    colorRules: { hueShiftMin: -6, hueShiftMax: 6, saturationMin: 0.48, saturationMax: 0.86, lightnessMin: 0.42, lightnessMax: 0.72 },
    atmosphere: { allowed: true, intensityRange: [0.24, 0.8], thicknessRange: [0.02, 0.08], tintShiftRange: [-8, 8] },
    materialWeights: { rocky: 0.58, dusty: 0.2, metallic: 0.06, icy: 0.16 },
    macroStyleWeights: { supercontinent: 0.1, archipelago: 0.5, 'island-chain': 0.36, fractured: 0.02, 'dual-hemisphere': 0.16, basin: 0.08 },
  },
  lush: {
    name: 'lush',
    weight: 0.9,
    allowedPalettes: ['verdant-umber'],
    hydrology: { oceanMin: 0.3, oceanMax: 0.7 },
    surfaceRules: { allowedSurfaceTypes: ['lush'] },
    reliefRules: { macroMin: 0.14, macroMax: 0.38, microMin: 0.05, microMax: 0.2, roughnessMin: 0.3, roughnessMax: 0.66, ridgeWarpMin: 0.12, ridgeWarpMax: 0.52 },
    patternRules: { banding: 'forbidden', thermal: 'forbidden', crater: 'light' },
    colorRules: { hueShiftMin: -5, hueShiftMax: 5, saturationMin: 0.48, saturationMax: 0.88, lightnessMin: 0.38, lightnessMax: 0.74 },
    atmosphere: { allowed: true, intensityRange: [0.22, 0.78], thicknessRange: [0.02, 0.08], tintShiftRange: [-8, 8] },
    materialWeights: { rocky: 0.52, dusty: 0.34, metallic: 0.04, icy: 0.1 },
    macroStyleWeights: { supercontinent: 0.44, archipelago: 0.18, 'island-chain': 0.14, fractured: 0.08, 'dual-hemisphere': 0.3, basin: 0.28 },
  },
  arid: {
    name: 'arid',
    weight: 1,
    allowedPalettes: ['arid-ochre'],
    hydrology: { oceanMin: 0, oceanMax: 0.1 },
    surfaceRules: { allowedSurfaceTypes: ['desert'] },
    reliefRules: { macroMin: 0.22, macroMax: 0.46, microMin: 0.08, microMax: 0.22, roughnessMin: 0.45, roughnessMax: 0.84, ridgeWarpMin: 0.28, ridgeWarpMax: 0.84 },
    patternRules: { banding: 'forbidden', thermal: 'forbidden', crater: 'heavy' },
    colorRules: { hueShiftMin: -3, hueShiftMax: 3, saturationMin: 0.36, saturationMax: 0.7, lightnessMin: 0.3, lightnessMax: 0.58 },
    atmosphere: { allowed: true, intensityRange: [0.16, 0.5], thicknessRange: [0.015, 0.05], tintShiftRange: [-6, 6] },
    materialWeights: { rocky: 0.44, dusty: 0.48, metallic: 0.06, icy: 0.02 },
    macroStyleWeights: { supercontinent: 0.54, archipelago: 0.03, 'island-chain': 0.08, fractured: 0.22, 'dual-hemisphere': 0.26, basin: 0.44 },
  },
  icy: {
    name: 'icy',
    weight: 0.95,
    allowedPalettes: ['cobalt-ice', 'glacier-mint'],
    hydrology: { oceanMin: 0.2, oceanMax: 0.45 },
    surfaceRules: { allowedSurfaceTypes: ['ice'] },
    reliefRules: { macroMin: 0.08, macroMax: 0.26, microMin: 0.03, microMax: 0.16, roughnessMin: 0.2, roughnessMax: 0.5, ridgeWarpMin: 0.05, ridgeWarpMax: 0.32 },
    patternRules: { banding: 'subtle', thermal: 'forbidden', crater: 'light' },
    colorRules: { hueShiftMin: -5, hueShiftMax: 5, saturationMin: 0.34, saturationMax: 0.62, lightnessMin: 0.56, lightnessMax: 0.82 },
    atmosphere: { allowed: true, intensityRange: [0.28, 0.86], thicknessRange: [0.03, 0.09], tintShiftRange: [-10, 10] },
    materialWeights: { rocky: 0.12, dusty: 0.08, metallic: 0.2, icy: 0.6 },
    macroStyleWeights: { supercontinent: 0.22, archipelago: 0.2, 'island-chain': 0.16, fractured: 0.16, 'dual-hemisphere': 0.34, basin: 0.24 },
  },
  volcanic: {
    name: 'volcanic',
    weight: 0.62,
    allowedPalettes: ['obsidian-lava'],
    hydrology: { oceanMin: 0, oceanMax: 0.2 },
    surfaceRules: { allowedSurfaceTypes: ['volcanic'] },
    reliefRules: { macroMin: 0.28, macroMax: 0.6, microMin: 0.14, microMax: 0.35, roughnessMin: 0.58, roughnessMax: 1, ridgeWarpMin: 0.52, ridgeWarpMax: 1 },
    patternRules: { banding: 'forbidden', thermal: 'allowed', crater: 'heavy' },
    colorRules: { hueShiftMin: -3, hueShiftMax: 3, saturationMin: 0.32, saturationMax: 0.74, lightnessMin: 0.24, lightnessMax: 0.52 },
    atmosphere: { allowed: true, intensityRange: [0.16, 0.46], thicknessRange: [0.015, 0.045], tintShiftRange: [-6, 6] },
    materialWeights: { rocky: 0.28, dusty: 0.14, metallic: 0.54, icy: 0.04 },
    macroStyleWeights: { supercontinent: 0.2, archipelago: 0.03, 'island-chain': 0.04, fractured: 0.56, 'dual-hemisphere': 0.14, basin: 0.2 },
  },
  mineral: {
    name: 'mineral',
    weight: 0.84,
    allowedPalettes: ['sulfur-stone'],
    hydrology: { oceanMin: 0, oceanMax: 0.05 },
    surfaceRules: { allowedSurfaceTypes: ['mineral'] },
    reliefRules: { macroMin: 0.18, macroMax: 0.5, microMin: 0.1, microMax: 0.28, roughnessMin: 0.5, roughnessMax: 0.9, ridgeWarpMin: 0.38, ridgeWarpMax: 0.92 },
    patternRules: { banding: 'forbidden', thermal: 'forbidden', crater: 'heavy' },
    colorRules: { hueShiftMin: -2, hueShiftMax: 2, saturationMin: 0.3, saturationMax: 0.62, lightnessMin: 0.26, lightnessMax: 0.52 },
    atmosphere: { allowed: true, intensityRange: [0.12, 0.38], thicknessRange: [0.015, 0.04], tintShiftRange: [-5, 5] },
    materialWeights: { rocky: 0.3, dusty: 0.1, metallic: 0.58, icy: 0.02 },
    macroStyleWeights: { supercontinent: 0.44, archipelago: 0.02, 'island-chain': 0.03, fractured: 0.3, 'dual-hemisphere': 0.18, basin: 0.34 },
  },
  toxic: {
    name: 'toxic',
    weight: 0.56,
    allowedPalettes: ['toxic-neon'],
    hydrology: { oceanMin: 0.15, oceanMax: 0.35 },
    surfaceRules: { allowedSurfaceTypes: ['toxic'] },
    reliefRules: { macroMin: 0.16, macroMax: 0.44, microMin: 0.08, microMax: 0.26, roughnessMin: 0.44, roughnessMax: 0.82, ridgeWarpMin: 0.34, ridgeWarpMax: 0.88 },
    patternRules: { banding: 'subtle', thermal: 'limited', crater: 'light' },
    colorRules: { hueShiftMin: -8, hueShiftMax: 8, saturationMin: 0.58, saturationMax: 0.94, lightnessMin: 0.3, lightnessMax: 0.6 },
    atmosphere: { allowed: true, intensityRange: [0.34, 0.9], thicknessRange: [0.03, 0.08], tintShiftRange: [-12, 12] },
    materialWeights: { rocky: 0.16, dusty: 0.4, metallic: 0.36, icy: 0.08 },
    macroStyleWeights: { supercontinent: 0.2, archipelago: 0.14, 'island-chain': 0.16, fractured: 0.34, 'dual-hemisphere': 0.22, basin: 0.26 },
  },
  exotic: {
    name: 'exotic',
    weight: 0.5,
    allowedPalettes: ['violet-ash', 'rose-quartz'],
    hydrology: { oceanMin: 0.15, oceanMax: 0.4 },
    surfaceRules: { allowedSurfaceTypes: ['abyssal'] },
    reliefRules: { macroMin: 0.12, macroMax: 0.42, microMin: 0.08, microMax: 0.26, roughnessMin: 0.38, roughnessMax: 0.78, ridgeWarpMin: 0.22, ridgeWarpMax: 0.76 },
    patternRules: { banding: 'subtle', thermal: 'limited', crater: 'light' },
    colorRules: { hueShiftMin: -10, hueShiftMax: 10, saturationMin: 0.44, saturationMax: 0.86, lightnessMin: 0.32, lightnessMax: 0.68 },
    atmosphere: { allowed: true, intensityRange: [0.3, 0.88], thicknessRange: [0.03, 0.08], tintShiftRange: [-14, 14] },
    materialWeights: { rocky: 0.1, dusty: 0.22, metallic: 0.16, icy: 0.52 },
    macroStyleWeights: { supercontinent: 0.14, archipelago: 0.3, 'island-chain': 0.18, fractured: 0.26, 'dual-hemisphere': 0.24, basin: 0.2 },
  },
  fragmented: {
    name: 'fragmented',
    weight: 0.58,
    allowedPalettes: ['ember-dust'],
    hydrology: { oceanMin: 0.05, oceanMax: 0.2 },
    surfaceRules: { allowedSurfaceTypes: ['barren'] },
    reliefRules: { macroMin: 0.28, macroMax: 0.6, microMin: 0.12, microMax: 0.34, roughnessMin: 0.56, roughnessMax: 0.96, ridgeWarpMin: 0.58, ridgeWarpMax: 1 },
    patternRules: { banding: 'forbidden', thermal: 'forbidden', crater: 'heavy' },
    colorRules: { hueShiftMin: -4, hueShiftMax: 4, saturationMin: 0.34, saturationMax: 0.7, lightnessMin: 0.28, lightnessMax: 0.56 },
    atmosphere: { allowed: true, intensityRange: [0.14, 0.38], thicknessRange: [0.015, 0.04], tintShiftRange: [-6, 6] },
    materialWeights: { rocky: 0.44, dusty: 0.36, metallic: 0.16, icy: 0.04 },
    macroStyleWeights: { supercontinent: 0.04, archipelago: 0.24, 'island-chain': 0.28, fractured: 0.84, 'dual-hemisphere': 0.06, basin: 0.06 },
  },
  clouded: {
    name: 'clouded',
    weight: 0.56,
    allowedPalettes: ['amethyst-haze'],
    hydrology: { oceanMin: 0.35, oceanMax: 0.6 },
    surfaceRules: { allowedSurfaceTypes: ['ice'] },
    reliefRules: { macroMin: 0.08, macroMax: 0.24, microMin: 0.02, microMax: 0.12, roughnessMin: 0.2, roughnessMax: 0.42, ridgeWarpMin: 0.04, ridgeWarpMax: 0.34 },
    patternRules: { banding: 'allowed', thermal: 'forbidden', crater: 'none' },
    colorRules: { hueShiftMin: -8, hueShiftMax: 8, saturationMin: 0.34, saturationMax: 0.66, lightnessMin: 0.52, lightnessMax: 0.78 },
    atmosphere: { allowed: true, intensityRange: [0.5, 0.96], thicknessRange: [0.05, 0.09], tintShiftRange: [-12, 12] },
    materialWeights: { rocky: 0.2, dusty: 0.26, metallic: 0.1, icy: 0.44 },
    macroStyleWeights: { supercontinent: 0.1, archipelago: 0.28, 'island-chain': 0.26, fractured: 0.08, 'dual-hemisphere': 0.36, basin: 0.24 },
  },
  dead: {
    name: 'dead',
    weight: 0.64,
    allowedPalettes: ['charcoal-abyss'],
    hydrology: { oceanMin: 0, oceanMax: 0.08 },
    surfaceRules: { allowedSurfaceTypes: ['barren'] },
    reliefRules: { macroMin: 0.16, macroMax: 0.46, microMin: 0.08, microMax: 0.24, roughnessMin: 0.42, roughnessMax: 0.86, ridgeWarpMin: 0.24, ridgeWarpMax: 0.72 },
    patternRules: { banding: 'forbidden', thermal: 'forbidden', crater: 'heavy' },
    colorRules: { hueShiftMin: -3, hueShiftMax: 3, saturationMin: 0.3, saturationMax: 0.5, lightnessMin: 0.25, lightnessMax: 0.48 },
    atmosphere: { allowed: true, intensityRange: [0.12, 0.28], thicknessRange: [0.015, 0.03], tintShiftRange: [-4, 4] },
    materialWeights: { rocky: 0.36, dusty: 0.24, metallic: 0.34, icy: 0.06 },
    macroStyleWeights: { supercontinent: 0.32, archipelago: 0.04, 'island-chain': 0.06, fractured: 0.4, 'dual-hemisphere': 0.16, basin: 0.3 },
  },
  superterran: {
    name: 'superterran',
    weight: 0.22,
    allowedPalettes: ['basalt-moss'],
    hydrology: { oceanMin: 0.35, oceanMax: 0.65 },
    surfaceRules: { allowedSurfaceTypes: ['lush'] },
    reliefRules: { macroMin: 0.14, macroMax: 0.34, microMin: 0.06, microMax: 0.18, roughnessMin: 0.3, roughnessMax: 0.62, ridgeWarpMin: 0.16, ridgeWarpMax: 0.48 },
    patternRules: { banding: 'forbidden', thermal: 'forbidden', crater: 'light' },
    colorRules: { hueShiftMin: -5, hueShiftMax: 5, saturationMin: 0.46, saturationMax: 0.82, lightnessMin: 0.4, lightnessMax: 0.72 },
    atmosphere: { allowed: true, intensityRange: [0.3, 0.9], thicknessRange: [0.02, 0.08], tintShiftRange: [-8, 8] },
    materialWeights: { rocky: 0.62, dusty: 0.16, metallic: 0.06, icy: 0.16 },
    macroStyleWeights: { supercontinent: 0.54, archipelago: 0.08, 'island-chain': 0.08, fractured: 0.08, 'dual-hemisphere': 0.42, basin: 0.36 },
  },
};

export function getArchetypeDefinition(archetype: PlanetArchetype): ArchetypeDefinition {
  return ARCHETYPE_DEFINITIONS[archetype];
}

export function validatePlanetProfile(profile: PlanetVisualProfile): void {
  const definition = getArchetypeDefinition(profile.archetype);
  const palette = PALETTE_LIBRARY[profile.paletteFamily];
  if (!definition.allowedPalettes.includes(profile.paletteFamily)) {
    throw new Error(`Palette ${profile.paletteFamily} is forbidden for archetype ${profile.archetype}`);
  }
  if (palette.owner !== profile.archetype) {
    throw new Error(`Palette owner mismatch for ${profile.archetype}/${profile.paletteFamily}`);
  }
  if (profile.hydrology.oceanBias < definition.hydrology.oceanMin || profile.hydrology.oceanBias > definition.hydrology.oceanMax) {
    throw new Error(`Ocean bias out of range for archetype ${profile.archetype}`);
  }
  if (profile.color.hueShift < definition.colorRules.hueShiftMin || profile.color.hueShift > definition.colorRules.hueShiftMax) {
    throw new Error(`Hue shift out of range for archetype ${profile.archetype}`);
  }
  if (profile.color.saturation < definition.colorRules.saturationMin || profile.color.saturation > definition.colorRules.saturationMax) {
    throw new Error(`Saturation out of range for archetype ${profile.archetype}`);
  }
  if (profile.relief.macroStrength < definition.reliefRules.macroMin || profile.relief.macroStrength > definition.reliefRules.macroMax) {
    throw new Error(`Macro relief out of range for archetype ${profile.archetype}`);
  }
  if (profile.relief.microStrength < definition.reliefRules.microMin || profile.relief.microStrength > definition.reliefRules.microMax) {
    throw new Error(`Micro relief out of range for archetype ${profile.archetype}`);
  }
  if (!definition.atmosphere.allowed && profile.atmosphere.enabled) {
    throw new Error(`Atmosphere is forbidden for archetype ${profile.archetype}`);
  }
}
