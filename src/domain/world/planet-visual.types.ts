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

export type PlanetMacroStyle =
  | 'supercontinent'
  | 'archipelago'
  | 'island-chain'
  | 'fractured'
  | 'dual-hemisphere'
  | 'basin';

export type PlanetShapeFamily = 'stable-spheroid' | 'eroded' | 'tectonic' | 'fragmented-shell';
export type PlanetReliefFamily = 'gentle' | 'moderate' | 'rugged' | 'extreme' | 'fragmented';
export type PlanetHydrologyFamily = 'waterworld' | 'balanced' | 'arid' | 'dry' | 'cryo';
export type PlanetSurfaceFamily =
  | 'ocean'
  | 'desert'
  | 'ice'
  | 'volcanic'
  | 'lush'
  | 'mineral'
  | 'barren'
  | 'toxic'
  | 'abyssal';
export type PlanetAtmosphereFamily = 'none' | 'thin' | 'standard' | 'dense' | 'reactive';
export type PlanetTerrainFamily = 'smooth' | 'moderate' | 'rough' | 'extreme' | 'fragmented' | 'continental';
export type PlanetEffect = 'craters' | 'thermal' | 'banding' | 'icecaps' | 'aurora';

export interface PlanetRenderTuning {
  colorPresence: number;
  craterBoost: number;
  thermalActivity: number;
  bandingStrength: number;
  bandingFrequency: number;
  colorContrast: number;
  oceanLevelOffset: number;
  mountainLevelOffset: number;
}

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
  hydroSeed: number;
}

export interface PlanetIdentity {
  archetype: PlanetArchetype;
  sizeCategory: PlanetSizeCategory;
  shapeFamily: PlanetShapeFamily;
  reliefFamily: PlanetReliefFamily;
  hydrologyFamily: PlanetHydrologyFamily;
  surfaceFamily: PlanetSurfaceFamily;
  paletteFamily: PaletteFamily;
  atmosphereFamily: PlanetAtmosphereFamily;
  targetLandRatio: number;
  targetOceanRatio: number;
  allowedTerrainProfiles: PlanetTerrainFamily[];
  allowedEffects: PlanetEffect[];
  forbiddenEffects: PlanetEffect[];
  visualConstraints: {
    minLandRatio: number;
    maxOceanRatio: number;
    minElevationCap: number;
    maxElevationCap: number;
  };
  renderTuning: PlanetRenderTuning;
  specialTraits: string[];
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

export interface HydrologyParameters {
  oceanBias: number;
  minLandRatio: number;
  maxOceanRatio: number;
}

export interface PlanetVisualProfile {
  id: string;
  visualGenVersion: number;
  seeds: SeedInputs;
  derivedSubSeeds: DerivedSubSeeds;
  identity: PlanetIdentity;
  archetype: PlanetArchetype;
  macroStyle: PlanetMacroStyle;
  sizeCategory: PlanetSizeCategory;
  materialFamily: MaterialFamily;
  paletteFamily: PaletteFamily;
  hydrology: HydrologyParameters;
  shape: ShapeParameters;
  relief: ReliefParameters;
  color: ColorParameters;
  atmosphere: AtmosphereParameters;
}

export interface PlanetVisualGeneratorConfig {
  visualGenVersion?: number;
}
