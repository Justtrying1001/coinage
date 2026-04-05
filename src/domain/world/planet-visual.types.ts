export type PlanetSizeCategory = 'small' | 'medium' | 'large';

export type MaterialFamily = 'rocky' | 'dusty' | 'metallic' | 'icy';

export type PaletteFamily =
  | 'ember-dust'
  | 'basalt-moss'
  | 'cobalt-ice'
  | 'sulfur-stone'
  | 'violet-ash';

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
  surfaceSeed: number;
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

export interface SurfaceParameters {
  oceanLevel: number;
  biomeScale: number;
  heatBias: number;
  moistureBias: number;
  ridgeSharpness: number;
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
  sizeCategory: PlanetSizeCategory;
  materialFamily: MaterialFamily;
  paletteFamily: PaletteFamily;
  shape: ShapeParameters;
  relief: ReliefParameters;
  surface: SurfaceParameters;
  color: ColorParameters;
  atmosphere: AtmosphereParameters;
}

export interface PlanetVisualGeneratorConfig {
  visualGenVersion?: number;
}
