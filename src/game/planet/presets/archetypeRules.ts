import type { PlanetArchetype, PlanetVisualProfile } from '@/game/render/types';
import type { GradientStop, NoiseFilterConfig, PlanetArchetypePreset } from '@/game/planet/types';

export type Range = [number, number];
type Color = [number, number, number];

interface ArchetypeEnvironmentEnvelope {
  oceanCoverage: Range;
  moisture: Range;
  temperature: Range;
  vegetationCoverage: Range;
  reliefStrength: Range;
}

interface ArchetypeTerrainDefaults {
  resolution: number;
  filterStack: 'gentle-basins' | 'balanced-continents' | 'humid-ridges' | 'canyon-dunes' | 'cryo-fractures' | 'fissure-caldera' | 'seam-ridges' | 'impact-regolith';
  macroReliefIntent: string;
  midReliefIntent: string;
  microReliefIntent: string;
  continentStyle: string;
  ridgeStyle: string;
  craterUsage: 'none' | 'light' | 'moderate' | 'heavy';
  filters: NoiseFilterConfig[];
}

interface ArchetypeSurfaceColorRules {
  depthDeep: Color;
  depthShallow: Color;
  lowlands: Color;
  midlands: Color;
  uplands: Color;
  rock: Color;
  peaks: Color;
  accent: Color;
}

interface ArchetypeMaterialRules {
  roughness: {
    water: Range;
    vegetated: Range;
    rock: Range;
    peaks: Range;
  };
  metalness: {
    water: Range;
    vegetated: Range;
    rock: Range;
    peaks: Range;
  };
  wetnessBoost: Range;
  specularBias: Range;
}

interface ArchetypeTransitionRules {
  shorelineBand: Range;
  biomeBlend: 'soft' | 'balanced' | 'banded' | 'hard';
  slopeRockStart: Range;
  peakStart: Range;
  humidityNoise: Range;
  activityBias: Range;
}

interface ArchetypeVisualConstraints {
  mustHave: string[];
  mustAvoid: string[];
  forbiddenColorDrift: string[];
}

interface ArchetypeProfileRanges {
  baseHue: Range;
  accentOffset: Range;
  hueDrift: Range;
  oceanLevel: Range;
  roughness: Range;
  metalness: Range;
  reliefStrength: Range;
  reliefSharpness: Range;
  continentScale: Range;
  ridgeScale: Range;
  ridgeScaleBonus: number;
  craterScale: Range;
  oceanSaturation: Range;
  landSaturation: Range;
  oceanLightness: Range;
  landLightness: Range;
  lightIntensity: Range;
  atmosphereLightness: Range;
  ruggedness: Range;
  macroBias: Range;
  ridgeWeight: Range;
  craterWeight: Range;
  polarWeight: Range;
  humidityStrength: Range;
  emissiveIntensity: Range;
}

export interface PlanetArchetypeDefinition {
  key: PlanetArchetype;
  label: string;
  identity: string;
  environment: ArchetypeEnvironmentEnvelope;
  terrain: ArchetypeTerrainDefaults;
  colors: ArchetypeSurfaceColorRules;
  material: ArchetypeMaterialRules;
  transitions: ArchetypeTransitionRules;
  constraints: ArchetypeVisualConstraints;
  profile: ArchetypeProfileRanges;
  postfx: PlanetArchetypePreset['postfx'];
}

const s = (anchor: number, color: Color): GradientStop => ({ anchor, color });
const simple = (config: Partial<NoiseFilterConfig>): NoiseFilterConfig => ({
  kind: 'simple',
  enabled: true,
  strength: 0.2,
  roughness: 2.4,
  baseRoughness: 1,
  persistence: 0.5,
  minValue: 1.1,
  layerCount: 8,
  useFirstLayerAsMask: false,
  center: [0, 0, 0],
  ...config,
});
const ridgid = (config: Partial<NoiseFilterConfig>): NoiseFilterConfig => ({ ...simple(config), kind: 'ridgid', useFirstLayerAsMask: true });

export const PLANET_ARCHETYPE_RULES: Record<PlanetArchetype, PlanetArchetypeDefinition> = {
  oceanic: {
    key: 'oceanic',
    label: 'Oceanic',
    identity: 'Water-dominant world with archipelagos and shallow shelves.',
    environment: { oceanCoverage: [0.62, 0.9], moisture: [0.62, 0.95], temperature: [0.35, 0.72], vegetationCoverage: [0.28, 0.58], reliefStrength: [0.03, 0.12] },
    terrain: {
      resolution: 96,
      filterStack: 'gentle-basins',
      macroReliefIntent: 'Broad ocean basins with sparse island chains.',
      midReliefIntent: 'Soft continental shelves and low islands.',
      microReliefIntent: 'Minimal noisy breakup to preserve smooth seas.',
      continentStyle: 'Fragmented archipelagos',
      ridgeStyle: 'Soft submarine ridges',
      craterUsage: 'light',
      filters: [simple({ strength: 0.2, roughness: 2.1, baseRoughness: 1.05, minValue: 1.04 }), ridgid({ strength: 0.07, roughness: 2.25, minValue: 1.7, layerCount: 4, center: [12, 3, 27] })],
    },
    colors: {
      depthDeep: [0.01, 0.07, 0.35], depthShallow: [0.09, 0.46, 0.82],
      lowlands: [0.18, 0.5, 0.24], midlands: [0.28, 0.58, 0.3], uplands: [0.42, 0.5, 0.37], rock: [0.48, 0.5, 0.46], peaks: [0.86, 0.9, 0.92], accent: [0.56, 0.83, 0.88],
    },
    material: { roughness: { water: [0.18, 0.3], vegetated: [0.56, 0.72], rock: [0.62, 0.78], peaks: [0.45, 0.6] }, metalness: { water: [0.02, 0.05], vegetated: [0.01, 0.04], rock: [0.04, 0.08], peaks: [0.03, 0.07] }, wetnessBoost: [0.22, 0.38], specularBias: [0.08, 0.15] },
    transitions: { shorelineBand: [0.012, 0.028], biomeBlend: 'soft', slopeRockStart: [0.38, 0.52], peakStart: [0.86, 0.94], humidityNoise: [0.1, 0.24], activityBias: [0.1, 0.24] },
    constraints: { mustHave: ['Dominant deep-to-shallow ocean gradient', 'Visible island chains not mega-continents'], mustAvoid: ['Large dry deserts', 'Aggressive red/orange lava tones'], forbiddenColorDrift: ['purple-magenta oceans', 'sand-yellow dominant landmass'] },
    profile: {
      baseHue: [186, 242], accentOffset: [14, 40], hueDrift: [-14, 8], oceanLevel: [0.62, 0.86], roughness: [0.32, 0.58], metalness: [0.01, 0.05],
      reliefStrength: [0.04, 0.12], reliefSharpness: [0.82, 1.22], continentScale: [1.8, 4.0], ridgeScale: [5.6, 9.4], ridgeScaleBonus: 1.8, craterScale: [3.0, 5.6], oceanSaturation: [52, 74], landSaturation: [26, 46], oceanLightness: [34, 52], landLightness: [30, 48], lightIntensity: [1.22, 1.72], atmosphereLightness: [72, 84], ruggedness: [0.04, 0.38], macroBias: [-0.15, 0.05], ridgeWeight: [0.1, 0.22], craterWeight: [0.08, 0.14], polarWeight: [0.08, 0.22], humidityStrength: [0.52, 0.82], emissiveIntensity: [0, 0.02],
    },
    postfx: { bloom: { strength: 0.04, radius: 0.2, threshold: 0.62 }, exposure: 1.16 },
  },
  terrestrial: {
    key: 'terrestrial', label: 'Terrestrial', identity: 'Balanced habitable world with mixed continents, forests, and mountains.',
    environment: { oceanCoverage: [0.32, 0.62], moisture: [0.3, 0.62], temperature: [0.32, 0.72], vegetationCoverage: [0.34, 0.68], reliefStrength: [0.08, 0.17] },
    terrain: { resolution: 96, filterStack: 'balanced-continents', macroReliefIntent: 'Balanced continents with open oceans.', midReliefIntent: 'Moderate mountain chains and plains.', microReliefIntent: 'Natural erosion-like micro variation.', continentStyle: 'Mixed continental masses', ridgeStyle: 'Moderate mountain spines', craterUsage: 'light', filters: [simple({ strength: 0.22, roughness: 2.3, baseRoughness: 1.05, minValue: 1.08 }), ridgid({ strength: 0.09, roughness: 2.5, baseRoughness: 0.95, minValue: 1.84, layerCount: 4, center: [8, 11, 3] })] },
    colors: { depthDeep: [0, 0.06, 0.42], depthShallow: [0.16, 0.54, 0.88], lowlands: [0.2, 0.58, 0.2], midlands: [0.34, 0.5, 0.18], uplands: [0.48, 0.38, 0.24], rock: [0.5, 0.45, 0.39], peaks: [0.93, 0.93, 0.92], accent: [0.35, 0.71, 0.44] },
    material: { roughness: { water: [0.2, 0.34], vegetated: [0.52, 0.66], rock: [0.6, 0.78], peaks: [0.42, 0.56] }, metalness: { water: [0.02, 0.05], vegetated: [0.01, 0.04], rock: [0.03, 0.08], peaks: [0.02, 0.06] }, wetnessBoost: [0.14, 0.28], specularBias: [0.06, 0.12] },
    transitions: { shorelineBand: [0.01, 0.022], biomeBlend: 'balanced', slopeRockStart: [0.42, 0.58], peakStart: [0.84, 0.92], humidityNoise: [0.08, 0.2], activityBias: [0.08, 0.2] },
    constraints: { mustHave: ['Readable green lowlands and brown uplands', 'Snow only at high peaks/cold zones'], mustAvoid: ['Fully flooded globe', 'Large neon color shifts'], forbiddenColorDrift: ['pink deserts', 'teal rocks in highlands'] },
    profile: {
      baseHue: [88, 162], accentOffset: [10, 34], hueDrift: [-10, 10], oceanLevel: [0.34, 0.62], roughness: [0.6, 0.88], metalness: [0.01, 0.06], reliefStrength: [0.08, 0.16], reliefSharpness: [1.05, 1.78], continentScale: [1.5, 3.3], ridgeScale: [7.1, 12.4], ridgeScaleBonus: 2.8, craterScale: [3.8, 7.2], oceanSaturation: [34, 62], landSaturation: [30, 58], oceanLightness: [28, 48], landLightness: [36, 58], lightIntensity: [1.12, 1.5], atmosphereLightness: [70, 84], ruggedness: [0.2, 0.76], macroBias: [0.02, 0.24], ridgeWeight: [0.18, 0.4], craterWeight: [0.1, 0.24], polarWeight: [0.08, 0.24], humidityStrength: [0.24, 0.52], emissiveIntensity: [0, 0.03],
    },
    postfx: { bloom: { strength: 0.045, radius: 0.2, threshold: 0.6 }, exposure: 1.12 },
  },
  jungle: {
    key: 'jungle', label: 'Jungle', identity: 'Hot, overgrown rainforest world with humid basins, wetlands, and dense canopy.',
    environment: { oceanCoverage: [0.24, 0.48], moisture: [0.72, 1], temperature: [0.65, 0.95], vegetationCoverage: [0.74, 0.98], reliefStrength: [0.06, 0.16] },
    terrain: { resolution: 96, filterStack: 'humid-ridges', macroReliefIntent: 'Broad wet basins connected by river valleys.', midReliefIntent: 'Ridges emerge through heavy canopy.', microReliefIntent: 'Soft but rich terrain breakup under vegetation.', continentStyle: 'River-basin continents', ridgeStyle: 'Wet ridges with sparse exposed rock', craterUsage: 'none', filters: [simple({ strength: 0.2, roughness: 2.2, baseRoughness: 1.02, minValue: 1.05, persistence: 0.48 }), ridgid({ strength: 0.07, roughness: 2.35, baseRoughness: 0.94, minValue: 1.78, layerCount: 4, center: [7, 15, 4] })] },
    colors: { depthDeep: [0.02, 0.16, 0.3], depthShallow: [0.12, 0.44, 0.38], lowlands: [0.08, 0.34, 0.11], midlands: [0.12, 0.42, 0.12], uplands: [0.22, 0.34, 0.16], rock: [0.36, 0.34, 0.3], peaks: [0.62, 0.66, 0.56], accent: [0.2, 0.52, 0.2] },
    material: { roughness: { water: [0.16, 0.28], vegetated: [0.6, 0.78], rock: [0.62, 0.82], peaks: [0.58, 0.76] }, metalness: { water: [0.02, 0.04], vegetated: [0.01, 0.03], rock: [0.02, 0.06], peaks: [0.02, 0.05] }, wetnessBoost: [0.28, 0.42], specularBias: [0.1, 0.16] },
    transitions: { shorelineBand: [0.012, 0.024], biomeBlend: 'soft', slopeRockStart: [0.58, 0.72], peakStart: [0.9, 0.96], humidityNoise: [0.14, 0.28], activityBias: [0.14, 0.26] },
    constraints: { mustHave: ['Dense dark-green canopy in low/mid elevations', 'Wetlands and humid basin tone shifts'], mustAvoid: ['Large tan desert bands', 'Wide exposed rock plains'], forbiddenColorDrift: ['bright cyan vegetation', 'purple/brown dominant lowlands'] },
    profile: {
      baseHue: [104, 148], accentOffset: [8, 22], hueDrift: [-8, 6], oceanLevel: [0.26, 0.46], roughness: [0.64, 0.9], metalness: [0.01, 0.05], reliefStrength: [0.08, 0.16], reliefSharpness: [1.02, 1.66], continentScale: [1.6, 3.1], ridgeScale: [6.8, 11.4], ridgeScaleBonus: 2.4, craterScale: [2.8, 5.4], oceanSaturation: [26, 46], landSaturation: [44, 74], oceanLightness: [22, 42], landLightness: [24, 46], lightIntensity: [1.08, 1.38], atmosphereLightness: [74, 86], ruggedness: [0.12, 0.56], macroBias: [0.06, 0.24], ridgeWeight: [0.16, 0.32], craterWeight: [0.02, 0.1], polarWeight: [0.01, 0.08], humidityStrength: [0.68, 0.94], emissiveIntensity: [0, 0.02],
    },
    postfx: { bloom: { strength: 0.035, radius: 0.18, threshold: 0.62 }, exposure: 1.1 },
  },
  arid: {
    key: 'arid', label: 'Arid', identity: 'Dry desert world with dunes, plateaus, and carved canyons.',
    environment: { oceanCoverage: [0, 0.16], moisture: [0, 0.22], temperature: [0.58, 1], vegetationCoverage: [0.02, 0.16], reliefStrength: [0.11, 0.22] },
    terrain: { resolution: 96, filterStack: 'canyon-dunes', macroReliefIntent: 'Large dry basins and plateaus.', midReliefIntent: 'Canyon carving and dune belts.', microReliefIntent: 'Wind-eroded texture with crisp ridges.', continentStyle: 'Connected desert supercontinents', ridgeStyle: 'Mesa and canyon edges', craterUsage: 'moderate', filters: [simple({ strength: 0.19, roughness: 2.5, baseRoughness: 1.15, persistence: 0.52, minValue: 1.1, layerCount: 9 }), ridgid({ strength: 0.14, roughness: 2.55, baseRoughness: 1.2, persistence: 0.56, minValue: 1.78, layerCount: 5, center: [5, 18, 6] })] },
    colors: { depthDeep: [0.08, 0.08, 0.12], depthShallow: [0.18, 0.14, 0.18], lowlands: [0.62, 0.46, 0.22], midlands: [0.74, 0.58, 0.28], uplands: [0.66, 0.48, 0.3], rock: [0.58, 0.42, 0.3], peaks: [0.92, 0.84, 0.68], accent: [0.8, 0.64, 0.34] },
    material: { roughness: { water: [0.34, 0.5], vegetated: [0.68, 0.84], rock: [0.74, 0.9], peaks: [0.7, 0.85] }, metalness: { water: [0.03, 0.08], vegetated: [0.02, 0.04], rock: [0.04, 0.1], peaks: [0.03, 0.08] }, wetnessBoost: [0.02, 0.12], specularBias: [0.03, 0.08] },
    transitions: { shorelineBand: [0.006, 0.014], biomeBlend: 'banded', slopeRockStart: [0.34, 0.48], peakStart: [0.82, 0.9], humidityNoise: [0.04, 0.12], activityBias: [0.08, 0.18] },
    constraints: { mustHave: ['Sand-dominant lowlands', 'Harsh dry plateau contrast'], mustAvoid: ['Lush green belts', 'Blue saturated oceans'], forbiddenColorDrift: ['neon greens', 'glacial cyan/white dominance'] },
    profile: {
      baseHue: [22, 54], accentOffset: [12, 36], hueDrift: [-10, 7], oceanLevel: [0.02, 0.18], roughness: [0.7, 0.95], metalness: [0.03, 0.1], reliefStrength: [0.11, 0.21], reliefSharpness: [1.2, 2.2], continentScale: [1.4, 2.7], ridgeScale: [7, 13], ridgeScaleBonus: 3.2, craterScale: [4.5, 8.4], oceanSaturation: [28, 38], landSaturation: [42, 64], oceanLightness: [22, 34], landLightness: [39, 61], lightIntensity: [1.05, 1.35], atmosphereLightness: [64, 74], ruggedness: [0.35, 1], macroBias: [0.2, 0.44], ridgeWeight: [0.34, 0.56], craterWeight: [0.15, 0.32], polarWeight: [0.05, 0.2], humidityStrength: [0.02, 0.22], emissiveIntensity: [0.01, 0.04],
    },
    postfx: { bloom: { strength: 0.03, radius: 0.16, threshold: 0.64 }, exposure: 1.08 },
  },
  frozen: {
    key: 'frozen', label: 'Frozen', identity: 'Cryo world of ice shelves, snow fields, and fractured glaciers.',
    environment: { oceanCoverage: [0.12, 0.46], moisture: [0.08, 0.34], temperature: [0, 0.28], vegetationCoverage: [0, 0.08], reliefStrength: [0.05, 0.13] },
    terrain: { resolution: 96, filterStack: 'cryo-fractures', macroReliefIntent: 'Broad ice shelves and frozen basins.', midReliefIntent: 'Fractured glacier ridges.', microReliefIntent: 'Fine frost breakup and smooth snowfields.', continentStyle: 'Ice-locked continents', ridgeStyle: 'Glacial fractures', craterUsage: 'light', filters: [simple({ strength: 0.15, roughness: 2.0, baseRoughness: 0.9, persistence: 0.48, minValue: 1.0 }), ridgid({ strength: 0.06, roughness: 2.2, baseRoughness: 1.0, minValue: 1.82, layerCount: 4, center: [17, 2, 9] })] },
    colors: { depthDeep: [0.03, 0.16, 0.35], depthShallow: [0.22, 0.52, 0.78], lowlands: [0.7, 0.82, 0.9], midlands: [0.78, 0.87, 0.93], uplands: [0.88, 0.93, 0.96], rock: [0.62, 0.68, 0.72], peaks: [0.98, 0.99, 1], accent: [0.72, 0.86, 0.94] },
    material: { roughness: { water: [0.2, 0.34], vegetated: [0.5, 0.64], rock: [0.46, 0.64], peaks: [0.24, 0.4] }, metalness: { water: [0.03, 0.08], vegetated: [0.02, 0.04], rock: [0.08, 0.14], peaks: [0.1, 0.18] }, wetnessBoost: [0.16, 0.3], specularBias: [0.12, 0.2] },
    transitions: { shorelineBand: [0.01, 0.02], biomeBlend: 'soft', slopeRockStart: [0.46, 0.64], peakStart: [0.74, 0.86], humidityNoise: [0.06, 0.14], activityBias: [0.06, 0.14] },
    constraints: { mustHave: ['Dominant ice/snow palette', 'Cold ocean tones when water exists'], mustAvoid: ['Green equatorial forests', 'Warm orange deserts'], forbiddenColorDrift: ['saturated red crust', 'warm yellow dominant lows'] },
    profile: {
      baseHue: [174, 224], accentOffset: [16, 40], hueDrift: [-12, 8], oceanLevel: [0.22, 0.52], roughness: [0.5, 0.78], metalness: [0.02, 0.09], reliefStrength: [0.05, 0.13], reliefSharpness: [0.95, 1.5], continentScale: [1.8, 3.6], ridgeScale: [6.4, 10.2], ridgeScaleBonus: 2.1, craterScale: [3.8, 6.4], oceanSaturation: [22, 38], landSaturation: [18, 36], oceanLightness: [40, 54], landLightness: [57, 75], lightIntensity: [1.12, 1.55], atmosphereLightness: [76, 88], ruggedness: [0.1, 0.6], macroBias: [0.04, 0.2], ridgeWeight: [0.12, 0.26], craterWeight: [0.08, 0.16], polarWeight: [0.2, 0.44], humidityStrength: [0.05, 0.2], emissiveIntensity: [0.01, 0.03],
    },
    postfx: { bloom: { strength: 0.04, radius: 0.2, threshold: 0.58 }, exposure: 1.18 },
  },
  volcanic: {
    key: 'volcanic', label: 'Volcanic', identity: 'Basaltic, fractured hot crust with lava seams and caldera scars.',
    environment: { oceanCoverage: [0, 0.08], moisture: [0, 0.16], temperature: [0.72, 1], vegetationCoverage: [0, 0.06], reliefStrength: [0.13, 0.25] },
    terrain: { resolution: 96, filterStack: 'fissure-caldera', macroReliefIntent: 'Broken crust slabs and collapse basins.', midReliefIntent: 'Fissure networks and caldera rims.', microReliefIntent: 'Sharp fractured lava rock grain.', continentStyle: 'Connected basalt sheets', ridgeStyle: 'Fractured tectonic ridges', craterUsage: 'moderate', filters: [simple({ strength: 0.2, roughness: 2.35, baseRoughness: 1.05, persistence: 0.52, minValue: 1.08 }), ridgid({ strength: 0.18, roughness: 2.8, baseRoughness: 1.4, persistence: 0.55, minValue: 1.55, layerCount: 5, center: [14, 14, 1] })] },
    colors: { depthDeep: [0.03, 0.03, 0.04], depthShallow: [0.16, 0.08, 0.08], lowlands: [0.2, 0.12, 0.12], midlands: [0.34, 0.2, 0.18], uplands: [0.48, 0.26, 0.19], rock: [0.28, 0.24, 0.23], peaks: [0.85, 0.34, 0.14], accent: [0.92, 0.42, 0.12] },
    material: { roughness: { water: [0.3, 0.42], vegetated: [0.64, 0.8], rock: [0.72, 0.9], peaks: [0.58, 0.76] }, metalness: { water: [0.04, 0.1], vegetated: [0.02, 0.06], rock: [0.1, 0.2], peaks: [0.08, 0.16] }, wetnessBoost: [0.01, 0.08], specularBias: [0.08, 0.18] },
    transitions: { shorelineBand: [0.004, 0.012], biomeBlend: 'hard', slopeRockStart: [0.24, 0.4], peakStart: [0.74, 0.86], humidityNoise: [0.04, 0.12], activityBias: [0.6, 0.92] },
    constraints: { mustHave: ['Dark basalt base', 'Localized hot lava highlights'], mustAvoid: ['Lush vegetation carpets', 'Bright blue oceans'], forbiddenColorDrift: ['pastel green land', 'cool cyan dominant peaks'] },
    profile: {
      baseHue: [6, 24], accentOffset: [18, 52], hueDrift: [6, 22], oceanLevel: [0, 0.06], roughness: [0.58, 0.84], metalness: [0.04, 0.16], reliefStrength: [0.13, 0.24], reliefSharpness: [1.25, 2.1], continentScale: [1.1, 2.3], ridgeScale: [8.8, 15.6], ridgeScaleBonus: 4.5, craterScale: [5.8, 9.6], oceanSaturation: [20, 34], landSaturation: [48, 78], oceanLightness: [18, 28], landLightness: [26, 44], lightIntensity: [1.35, 1.95], atmosphereLightness: [56, 68], ruggedness: [0.4, 1], macroBias: [0.22, 0.42], ridgeWeight: [0.34, 0.58], craterWeight: [0.2, 0.34], polarWeight: [0.01, 0.12], humidityStrength: [0.02, 0.14], emissiveIntensity: [0.06, 0.12],
    },
    postfx: { bloom: { strength: 0.055, radius: 0.24, threshold: 0.56 }, exposure: 1.14 },
  },
  mineral: {
    key: 'mineral', label: 'Mineral', identity: 'Exposed deposits and oxidized seams with metallic sheen pockets.',
    environment: { oceanCoverage: [0.04, 0.24], moisture: [0.06, 0.3], temperature: [0.26, 0.72], vegetationCoverage: [0, 0.18], reliefStrength: [0.08, 0.18] },
    terrain: { resolution: 96, filterStack: 'seam-ridges', macroReliefIntent: 'Eroded mineral plains with exposed belts.', midReliefIntent: 'Ridges revealing seams and strata.', microReliefIntent: 'Hard rocky micro noise.', continentStyle: 'Patchy mineral plateaus', ridgeStyle: 'Seam-following ridges', craterUsage: 'moderate', filters: [simple({ strength: 0.2, roughness: 2.4, baseRoughness: 1.0, persistence: 0.5, minValue: 1.07 }), ridgid({ strength: 0.1, roughness: 2.45, baseRoughness: 1.1, persistence: 0.54, minValue: 1.75, layerCount: 4, center: [9, 20, 5] })] },
    colors: { depthDeep: [0.08, 0.1, 0.18], depthShallow: [0.22, 0.29, 0.4], lowlands: [0.42, 0.45, 0.4], midlands: [0.56, 0.54, 0.44], uplands: [0.66, 0.58, 0.44], rock: [0.5, 0.46, 0.4], peaks: [0.84, 0.82, 0.75], accent: [0.74, 0.52, 0.3] },
    material: { roughness: { water: [0.24, 0.38], vegetated: [0.56, 0.72], rock: [0.48, 0.66], peaks: [0.4, 0.58] }, metalness: { water: [0.04, 0.08], vegetated: [0.04, 0.08], rock: [0.2, 0.34], peaks: [0.24, 0.38] }, wetnessBoost: [0.06, 0.16], specularBias: [0.1, 0.18] },
    transitions: { shorelineBand: [0.008, 0.018], biomeBlend: 'balanced', slopeRockStart: [0.32, 0.46], peakStart: [0.82, 0.9], humidityNoise: [0.05, 0.14], activityBias: [0.34, 0.56] },
    constraints: { mustHave: ['Visible oxidized/mineral color seams', 'Higher metallic response on exposed rock'], mustAvoid: ['Dense forests', 'Pure monochrome gray everywhere'], forbiddenColorDrift: ['lush tropical greens', 'saturated cyan oceans'] },
    profile: {
      baseHue: [30, 76], accentOffset: [32, 66], hueDrift: [-9, 11], oceanLevel: [0.05, 0.22], roughness: [0.34, 0.68], metalness: [0.12, 0.28], reliefStrength: [0.08, 0.17], reliefSharpness: [1.05, 1.74], continentScale: [1.3, 2.6], ridgeScale: [7.2, 12.7], ridgeScaleBonus: 2.6, craterScale: [4.1, 7.3], oceanSaturation: [18, 32], landSaturation: [30, 56], oceanLightness: [25, 35], landLightness: [35, 52], lightIntensity: [1.18, 1.6], atmosphereLightness: [64, 75], ruggedness: [0.2, 0.75], macroBias: [0.15, 0.31], ridgeWeight: [0.2, 0.39], craterWeight: [0.14, 0.26], polarWeight: [0.05, 0.16], humidityStrength: [0.08, 0.28], emissiveIntensity: [0.02, 0.05],
    },
    postfx: { bloom: { strength: 0.035, radius: 0.16, threshold: 0.62 }, exposure: 1.1 },
  },
  barren: {
    key: 'barren', label: 'Barren', identity: 'Dusty dead regolith with impact scars and worn plateaus.',
    environment: { oceanCoverage: [0, 0.08], moisture: [0, 0.14], temperature: [0.2, 0.78], vegetationCoverage: [0, 0.04], reliefStrength: [0.08, 0.2] },
    terrain: { resolution: 96, filterStack: 'impact-regolith', macroReliefIntent: 'Worn plateaus and broad dead basins.', midReliefIntent: 'Impact crater fields and ejecta rims.', microReliefIntent: 'Powdery regolith noise.', continentStyle: 'Near-global exposed crust', ridgeStyle: 'Eroded impact ridges', craterUsage: 'heavy', filters: [simple({ strength: 0.2, roughness: 2.45, baseRoughness: 1.12, persistence: 0.52, minValue: 1.1, layerCount: 9 }), ridgid({ strength: 0.12, roughness: 2.6, baseRoughness: 1.3, persistence: 0.56, minValue: 1.72, layerCount: 5, center: [4, 3, 18] })] },
    colors: { depthDeep: [0.06, 0.06, 0.06], depthShallow: [0.16, 0.14, 0.12], lowlands: [0.4, 0.34, 0.3], midlands: [0.52, 0.44, 0.37], uplands: [0.62, 0.54, 0.44], rock: [0.52, 0.46, 0.4], peaks: [0.78, 0.7, 0.58], accent: [0.64, 0.54, 0.46] },
    material: { roughness: { water: [0.3, 0.46], vegetated: [0.68, 0.84], rock: [0.72, 0.9], peaks: [0.7, 0.88] }, metalness: { water: [0.02, 0.06], vegetated: [0.02, 0.05], rock: [0.06, 0.14], peaks: [0.05, 0.12] }, wetnessBoost: [0, 0.06], specularBias: [0.02, 0.08] },
    transitions: { shorelineBand: [0.004, 0.012], biomeBlend: 'hard', slopeRockStart: [0.3, 0.45], peakStart: [0.82, 0.9], humidityNoise: [0.02, 0.1], activityBias: [0.16, 0.3] },
    constraints: { mustHave: ['Dry regolith tone continuity', 'Crater/impact visual rhythm'], mustAvoid: ['Visible liquid oceans', 'Saturated lush colors'], forbiddenColorDrift: ['vivid green bands', 'high-saturation blue land'] },
    profile: {
      baseHue: [32, 88], accentOffset: [14, 32], hueDrift: [-8, 6], oceanLevel: [0, 0.1], roughness: [0.56, 0.88], metalness: [0.02, 0.12], reliefStrength: [0.08, 0.19], reliefSharpness: [1.08, 1.92], continentScale: [1.3, 2.9], ridgeScale: [6.8, 11.8], ridgeScaleBonus: 3.5, craterScale: [5.1, 9.2], oceanSaturation: [15, 26], landSaturation: [20, 38], oceanLightness: [20, 30], landLightness: [30, 46], lightIntensity: [1.05, 1.42], atmosphereLightness: [58, 70], ruggedness: [0.3, 0.9], macroBias: [0.12, 0.29], ridgeWeight: [0.24, 0.43], craterWeight: [0.18, 0.32], polarWeight: [0.03, 0.14], humidityStrength: [0.02, 0.16], emissiveIntensity: [0.01, 0.04],
    },
    postfx: { bloom: { strength: 0.02, radius: 0.14, threshold: 0.66 }, exposure: 1.06 },
  },
};

export const ARCHETYPE_SPAWN_WEIGHTS: Array<{ archetype: PlanetArchetype; weight: number }> = [
  { archetype: 'oceanic', weight: 0.12 },
  { archetype: 'terrestrial', weight: 0.18 },
  { archetype: 'jungle', weight: 0.12 },
  { archetype: 'arid', weight: 0.14 },
  { archetype: 'frozen', weight: 0.14 },
  { archetype: 'volcanic', weight: 0.1 },
  { archetype: 'mineral', weight: 0.1 },
  { archetype: 'barren', weight: 0.1 },
];

export function buildArchetypeSurfaceGradients(definition: PlanetArchetypeDefinition): { elevationGradient: GradientStop[]; depthGradient: GradientStop[] } {
  return {
    elevationGradient: [
      s(0, definition.colors.lowlands),
      s(0.36, definition.colors.midlands),
      s(0.68, definition.colors.uplands),
      s(0.88, definition.colors.rock),
      s(1, definition.colors.peaks),
    ],
    depthGradient: [s(0, definition.colors.depthDeep), s(1, definition.colors.depthShallow)],
  };
}

export function meanRange([min, max]: Range) {
  return (min + max) * 0.5;
}

export function biomeBlendFactor(mode: ArchetypeTransitionRules['biomeBlend']) {
  if (mode === 'soft') return 0.72;
  if (mode === 'balanced') return 0.55;
  if (mode === 'banded') return 0.38;
  return 0.24;
}

export function deriveDefinitionSignals(definition: PlanetArchetypeDefinition, profile: PlanetVisualProfile) {
  const moisture = Math.min(1, Math.max(0, meanRange(definition.environment.moisture) + profile.humidityStrength * 0.22));
  const temperature = Math.min(1, Math.max(0, meanRange(definition.environment.temperature) + (profile.lightIntensity - 1) * 0.2));
  const shoreline = Math.max(0.002, meanRange(definition.transitions.shorelineBand));
  const slopeRock = Math.min(0.92, Math.max(0.18, meanRange(definition.transitions.slopeRockStart)));
  const peakStart = Math.min(0.98, Math.max(0.58, meanRange(definition.transitions.peakStart)));

  return {
    moisture,
    temperature,
    biomeBlend: biomeBlendFactor(definition.transitions.biomeBlend),
    shoreline,
    slopeRock,
    peakStart,
    humidityNoise: meanRange(definition.transitions.humidityNoise),
    activityBias: meanRange(definition.transitions.activityBias),
    wetnessBoost: meanRange(definition.material.wetnessBoost),
    specularBias: meanRange(definition.material.specularBias),
    accentColor: definition.colors.accent,
    vegetatedRoughness: meanRange(definition.material.roughness.vegetated),
    rockRoughness: meanRange(definition.material.roughness.rock),
    peakRoughness: meanRange(definition.material.roughness.peaks),
    waterRoughness: meanRange(definition.material.roughness.water),
    vegetatedMetalness: meanRange(definition.material.metalness.vegetated),
    rockMetalness: meanRange(definition.material.metalness.rock),
    peakMetalness: meanRange(definition.material.metalness.peaks),
    waterMetalness: meanRange(definition.material.metalness.water),
  };
}
