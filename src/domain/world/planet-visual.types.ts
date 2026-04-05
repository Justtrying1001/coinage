export type PlanetSizeCategory = 'small' | 'medium' | 'large';

export type MaterialFamily = 'rocky' | 'dusty' | 'metallic' | 'icy';

export type PaletteFamily =
  | 'ember-dust'
  | 'basalt-moss'
  | 'cobalt-ice'
  | 'sulfur-stone'
  | 'violet-ash'
  | 'verdant-umber'
  | 'rose-quartz'
  | 'glacier-mint'
  | 'arid-ochre'
  | 'obsidian-lava'
  | 'toxic-neon'
  | 'amethyst-haze'
  | 'emerald-sea'
  | 'charcoal-abyss';

export type PlanetArchetype =
  | 'oceanic'
  | 'icy'
  | 'arid'
  | 'lush'
  | 'volcanic'
  | 'dead'
  | 'toxic'
  | 'mineral'
  | 'clouded'
  | 'exotic'
  | 'fragmented'
  | 'superterran';

export interface SeedInputs {
  worldSeed: string;
  planetSeed: string;
}

export interface DerivedSubSeeds {
  baseSeed: number;
  shapeSeed: number;
  reliefSeed: number;
  colorSeed: number;
  atmoSeed: number;
}

export interface ShapeParameters {
  radius: number;
  wobbleFrequency: number;
  wobbleAmplitude: number;
  ridgeWarp: number;
}

export interface ReliefParameters {
  macroStrength: number;
  microStrength: number;
  roughness: number;
  craterDensity: number;
}

export interface ColorParameters {
  hueShift: number;
  saturation: number;
  lightness: number;
  accentMix: number;
}

export interface AtmosphereParameters {
  enabled: boolean;
  intensity: number;
  thickness: number;
  tintShift: number;
}

export interface PlanetVisualProfile {
  id: string;
  visualGenVersion: number;
  seeds: SeedInputs;
  derivedSubSeeds: DerivedSubSeeds;
  archetype: PlanetArchetype;
  sizeCategory: PlanetSizeCategory;
  materialFamily: MaterialFamily;
  paletteFamily: PaletteFamily;
  shape: ShapeParameters;
  relief: ReliefParameters;
  color: ColorParameters;
  atmosphere: AtmosphereParameters;
}

export interface PlanetVisualGeneratorConfig {
  visualGenVersion?: number;
}
