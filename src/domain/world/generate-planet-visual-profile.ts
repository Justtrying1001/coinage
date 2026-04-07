import { deriveSeed, createSeededRng, range } from './seeded-rng';
import type {
  CanonicalPlanet,
  PlanetAtmosphereClass,
  PlanetClassification,
  PlanetFamily,
  PlanetGeneratedProfile,
  PlanetIdentity,
  PlanetRadiusClass,
  PlanetReliefClass,
  PlanetRenderProfile,
  PlanetRoughnessClass,
  PlanetScaleProfile,
  PlanetSurfaceModel,
  PlanetViewProfile,
  PlanetVisualDNA,
} from './planet-visual.types';

export interface PlanetSeedInput {
  worldSeed: string;
  planetSeed: string;
  planetId?: string;
  worldPosition?: { x: number; y: number; z?: number };
}

const MIN_RENDER_RADIUS = 2.8;
const MAX_RENDER_RADIUS = 5.9;

type PalettePreset = {
  id: string;
  deep: [number, number, number];
  mid: [number, number, number];
  high: [number, number, number];
  ocean: [number, number, number];
  accent: [number, number, number];
  cloud: [number, number, number];
  atmosphere: [number, number, number];
  ring: [number, number, number];
};

type FamilyRecipe = {
  family: PlanetFamily;
  weight: number;
  surfaceModel: PlanetSurfaceModel;
  reliefClass: PlanetReliefClass;
  roughnessClass: PlanetRoughnessClass;
  atmosphereClass: PlanetAtmosphereClass;
  hasOceans: boolean;
  canHaveClouds: boolean;
  forceRings?: boolean;
  oceanCoverage: [number, number];
  cloudCoverage: [number, number];
  atmosphereDensity: [number, number];
  reliefAmplitude: [number, number];
  roughness: [number, number];
  specular: [number, number];
  emissive: [number, number];
  banding: [number, number];
  palettes: PalettePreset[];
};

const FAMILY_RECIPES: FamilyRecipe[] = [
  {
    family: 'terrestrial-lush',
    weight: 16,
    surfaceModel: 'solid',
    reliefClass: 'rugged',
    roughnessClass: 'balanced',
    atmosphereClass: 'standard',
    hasOceans: true,
    canHaveClouds: true,
    oceanCoverage: [0.36, 0.64],
    cloudCoverage: [0.2, 0.62],
    atmosphereDensity: [0.36, 0.74],
    reliefAmplitude: [0.12, 0.26],
    roughness: [0.38, 0.64],
    specular: [0.24, 0.52],
    emissive: [0, 0.02],
    banding: [0.03, 0.15],
    palettes: [
      {
        id: 'lush-emerald',
        deep: [0.16, 0.26, 0.13],
        mid: [0.29, 0.5, 0.24],
        high: [0.54, 0.44, 0.29],
        ocean: [0.12, 0.33, 0.66],
        accent: [0.76, 0.74, 0.68],
        cloud: [0.93, 0.95, 0.98],
        atmosphere: [0.42, 0.65, 0.9],
        ring: [0.68, 0.64, 0.56],
      },
      {
        id: 'lush-boreal',
        deep: [0.13, 0.2, 0.11],
        mid: [0.25, 0.43, 0.24],
        high: [0.47, 0.42, 0.31],
        ocean: [0.09, 0.29, 0.6],
        accent: [0.7, 0.71, 0.72],
        cloud: [0.94, 0.96, 0.99],
        atmosphere: [0.4, 0.63, 0.88],
        ring: [0.7, 0.69, 0.62],
      },
    ],
  },
  {
    family: 'oceanic',
    weight: 12,
    surfaceModel: 'solid',
    reliefClass: 'gentle',
    roughnessClass: 'polished',
    atmosphereClass: 'dense',
    hasOceans: true,
    canHaveClouds: true,
    oceanCoverage: [0.78, 0.96],
    cloudCoverage: [0.35, 0.82],
    atmosphereDensity: [0.5, 0.9],
    reliefAmplitude: [0.06, 0.16],
    roughness: [0.28, 0.52],
    specular: [0.56, 0.9],
    emissive: [0, 0.02],
    banding: [0.02, 0.11],
    palettes: [
      {
        id: 'ocean-deep',
        deep: [0.05, 0.19, 0.41],
        mid: [0.08, 0.29, 0.58],
        high: [0.22, 0.56, 0.74],
        ocean: [0.07, 0.27, 0.65],
        accent: [0.78, 0.87, 0.92],
        cloud: [0.9, 0.95, 0.99],
        atmosphere: [0.38, 0.61, 0.92],
        ring: [0.62, 0.75, 0.84],
      },
      {
        id: 'ocean-cobalt',
        deep: [0.04, 0.14, 0.33],
        mid: [0.06, 0.25, 0.51],
        high: [0.2, 0.51, 0.76],
        ocean: [0.05, 0.23, 0.61],
        accent: [0.75, 0.84, 0.93],
        cloud: [0.9, 0.94, 0.98],
        atmosphere: [0.35, 0.56, 0.88],
        ring: [0.65, 0.78, 0.88],
      },
    ],
  },
  {
    family: 'desert-arid',
    weight: 14,
    surfaceModel: 'solid',
    reliefClass: 'rugged',
    roughnessClass: 'coarse',
    atmosphereClass: 'thin',
    hasOceans: false,
    canHaveClouds: true,
    oceanCoverage: [0, 0.02],
    cloudCoverage: [0.02, 0.22],
    atmosphereDensity: [0.16, 0.42],
    reliefAmplitude: [0.14, 0.31],
    roughness: [0.58, 0.88],
    specular: [0.06, 0.2],
    emissive: [0, 0.02],
    banding: [0.04, 0.18],
    palettes: [
      {
        id: 'arid-ochre',
        deep: [0.31, 0.22, 0.12],
        mid: [0.55, 0.38, 0.2],
        high: [0.74, 0.6, 0.38],
        ocean: [0.19, 0.17, 0.14],
        accent: [0.88, 0.8, 0.66],
        cloud: [0.86, 0.8, 0.72],
        atmosphere: [0.82, 0.58, 0.34],
        ring: [0.76, 0.65, 0.47],
      },
      {
        id: 'arid-mineral',
        deep: [0.28, 0.2, 0.16],
        mid: [0.48, 0.33, 0.23],
        high: [0.67, 0.52, 0.36],
        ocean: [0.2, 0.18, 0.16],
        accent: [0.86, 0.78, 0.62],
        cloud: [0.85, 0.8, 0.74],
        atmosphere: [0.78, 0.54, 0.3],
        ring: [0.74, 0.62, 0.5],
      },
    ],
  },
  {
    family: 'ice-frozen',
    weight: 12,
    surfaceModel: 'frozen',
    reliefClass: 'gentle',
    roughnessClass: 'balanced',
    atmosphereClass: 'thin',
    hasOceans: false,
    canHaveClouds: true,
    oceanCoverage: [0.04, 0.16],
    cloudCoverage: [0.08, 0.38],
    atmosphereDensity: [0.14, 0.45],
    reliefAmplitude: [0.08, 0.22],
    roughness: [0.34, 0.62],
    specular: [0.22, 0.54],
    emissive: [0.01, 0.06],
    banding: [0.02, 0.1],
    palettes: [
      {
        id: 'ice-glacial',
        deep: [0.52, 0.66, 0.79],
        mid: [0.69, 0.81, 0.91],
        high: [0.9, 0.95, 0.99],
        ocean: [0.37, 0.57, 0.77],
        accent: [0.76, 0.89, 0.98],
        cloud: [0.95, 0.97, 1],
        atmosphere: [0.63, 0.79, 0.96],
        ring: [0.82, 0.9, 0.96],
      },
      {
        id: 'ice-cyan',
        deep: [0.48, 0.62, 0.78],
        mid: [0.65, 0.78, 0.91],
        high: [0.87, 0.94, 0.99],
        ocean: [0.33, 0.53, 0.75],
        accent: [0.73, 0.87, 0.99],
        cloud: [0.95, 0.98, 1],
        atmosphere: [0.59, 0.76, 0.95],
        ring: [0.84, 0.92, 0.98],
      },
    ],
  },
  {
    family: 'volcanic-infernal',
    weight: 10,
    surfaceModel: 'volatile',
    reliefClass: 'extreme',
    roughnessClass: 'coarse',
    atmosphereClass: 'reactive',
    hasOceans: false,
    canHaveClouds: true,
    oceanCoverage: [0, 0.02],
    cloudCoverage: [0.04, 0.34],
    atmosphereDensity: [0.3, 0.82],
    reliefAmplitude: [0.2, 0.36],
    roughness: [0.72, 0.95],
    specular: [0.02, 0.12],
    emissive: [0.2, 0.52],
    banding: [0.05, 0.16],
    palettes: [
      {
        id: 'infernal-basalts',
        deep: [0.07, 0.07, 0.08],
        mid: [0.18, 0.13, 0.12],
        high: [0.35, 0.19, 0.13],
        ocean: [0.11, 0.09, 0.08],
        accent: [0.95, 0.43, 0.18],
        cloud: [0.48, 0.38, 0.34],
        atmosphere: [0.74, 0.31, 0.19],
        ring: [0.63, 0.35, 0.21],
      },
      {
        id: 'infernal-sulfur',
        deep: [0.08, 0.08, 0.07],
        mid: [0.2, 0.16, 0.1],
        high: [0.38, 0.24, 0.12],
        ocean: [0.09, 0.08, 0.07],
        accent: [0.97, 0.5, 0.14],
        cloud: [0.52, 0.42, 0.31],
        atmosphere: [0.8, 0.35, 0.16],
        ring: [0.67, 0.38, 0.2],
      },
    ],
  },
  {
    family: 'barren-rocky',
    weight: 12,
    surfaceModel: 'solid',
    reliefClass: 'rugged',
    roughnessClass: 'coarse',
    atmosphereClass: 'none',
    hasOceans: false,
    canHaveClouds: false,
    oceanCoverage: [0, 0],
    cloudCoverage: [0, 0],
    atmosphereDensity: [0, 0],
    reliefAmplitude: [0.1, 0.26],
    roughness: [0.6, 0.92],
    specular: [0.01, 0.08],
    emissive: [0, 0.02],
    banding: [0.02, 0.12],
    palettes: [
      {
        id: 'rocky-lunar',
        deep: [0.2, 0.2, 0.22],
        mid: [0.36, 0.35, 0.36],
        high: [0.58, 0.56, 0.53],
        ocean: [0.16, 0.16, 0.17],
        accent: [0.74, 0.7, 0.64],
        cloud: [0.75, 0.75, 0.74],
        atmosphere: [0.48, 0.48, 0.52],
        ring: [0.66, 0.65, 0.63],
      },
      {
        id: 'rocky-basaltic',
        deep: [0.16, 0.15, 0.16],
        mid: [0.3, 0.29, 0.31],
        high: [0.5, 0.48, 0.46],
        ocean: [0.14, 0.14, 0.15],
        accent: [0.68, 0.66, 0.62],
        cloud: [0.72, 0.72, 0.72],
        atmosphere: [0.44, 0.44, 0.47],
        ring: [0.63, 0.62, 0.6],
      },
    ],
  },
  {
    family: 'toxic-alien',
    weight: 10,
    surfaceModel: 'volatile',
    reliefClass: 'gentle',
    roughnessClass: 'balanced',
    atmosphereClass: 'reactive',
    hasOceans: true,
    canHaveClouds: true,
    oceanCoverage: [0.18, 0.52],
    cloudCoverage: [0.22, 0.66],
    atmosphereDensity: [0.45, 0.92],
    reliefAmplitude: [0.09, 0.22],
    roughness: [0.42, 0.72],
    specular: [0.14, 0.34],
    emissive: [0.06, 0.24],
    banding: [0.09, 0.32],
    palettes: [
      {
        id: 'toxic-neon',
        deep: [0.15, 0.24, 0.1],
        mid: [0.27, 0.39, 0.16],
        high: [0.45, 0.51, 0.2],
        ocean: [0.19, 0.35, 0.13],
        accent: [0.74, 0.94, 0.32],
        cloud: [0.8, 0.87, 0.71],
        atmosphere: [0.55, 0.78, 0.3],
        ring: [0.58, 0.72, 0.36],
      },
      {
        id: 'toxic-violet',
        deep: [0.24, 0.15, 0.29],
        mid: [0.35, 0.25, 0.42],
        high: [0.48, 0.35, 0.57],
        ocean: [0.24, 0.23, 0.31],
        accent: [0.38, 0.92, 0.79],
        cloud: [0.82, 0.8, 0.9],
        atmosphere: [0.53, 0.43, 0.84],
        ring: [0.62, 0.53, 0.86],
      },
    ],
  },
  {
    family: 'gas-giant',
    weight: 9,
    surfaceModel: 'gaseous',
    reliefClass: 'flat',
    roughnessClass: 'polished',
    atmosphereClass: 'dense',
    hasOceans: false,
    canHaveClouds: true,
    oceanCoverage: [0, 0],
    cloudCoverage: [0.45, 0.88],
    atmosphereDensity: [0.62, 0.96],
    reliefAmplitude: [0.01, 0.05],
    roughness: [0.24, 0.52],
    specular: [0.14, 0.32],
    emissive: [0.02, 0.08],
    banding: [0.52, 0.94],
    palettes: [
      {
        id: 'gas-amber',
        deep: [0.33, 0.2, 0.14],
        mid: [0.58, 0.4, 0.24],
        high: [0.78, 0.62, 0.43],
        ocean: [0.2, 0.19, 0.2],
        accent: [0.92, 0.81, 0.56],
        cloud: [0.9, 0.84, 0.74],
        atmosphere: [0.74, 0.58, 0.35],
        ring: [0.82, 0.74, 0.62],
      },
      {
        id: 'gas-azure',
        deep: [0.2, 0.27, 0.43],
        mid: [0.34, 0.46, 0.65],
        high: [0.6, 0.69, 0.85],
        ocean: [0.21, 0.23, 0.31],
        accent: [0.88, 0.92, 0.99],
        cloud: [0.88, 0.9, 0.95],
        atmosphere: [0.5, 0.63, 0.9],
        ring: [0.76, 0.83, 0.94],
      },
    ],
  },
  {
    family: 'ringed-giant',
    weight: 5,
    surfaceModel: 'gaseous',
    reliefClass: 'flat',
    roughnessClass: 'polished',
    atmosphereClass: 'dense',
    hasOceans: false,
    canHaveClouds: true,
    forceRings: true,
    oceanCoverage: [0, 0],
    cloudCoverage: [0.54, 0.9],
    atmosphereDensity: [0.64, 0.99],
    reliefAmplitude: [0.01, 0.04],
    roughness: [0.2, 0.48],
    specular: [0.18, 0.36],
    emissive: [0.01, 0.06],
    banding: [0.6, 0.98],
    palettes: [
      {
        id: 'ringed-saturnian',
        deep: [0.35, 0.3, 0.2],
        mid: [0.6, 0.51, 0.33],
        high: [0.83, 0.75, 0.57],
        ocean: [0.2, 0.19, 0.17],
        accent: [0.95, 0.88, 0.74],
        cloud: [0.91, 0.87, 0.78],
        atmosphere: [0.75, 0.65, 0.46],
        ring: [0.9, 0.84, 0.72],
      },
      {
        id: 'ringed-silver',
        deep: [0.28, 0.31, 0.38],
        mid: [0.45, 0.53, 0.63],
        high: [0.74, 0.81, 0.89],
        ocean: [0.2, 0.22, 0.28],
        accent: [0.95, 0.96, 0.99],
        cloud: [0.9, 0.92, 0.97],
        atmosphere: [0.63, 0.73, 0.91],
        ring: [0.9, 0.92, 0.96],
      },
    ],
  },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function jitterColor(rng: () => number, base: [number, number, number], variance = 0.04): [number, number, number] {
  return base.map((channel) => clamp(channel + (rng() - 0.5) * variance, 0, 1)) as [number, number, number];
}

function weightedRecipe(rng: () => number): FamilyRecipe {
  const total = FAMILY_RECIPES.reduce((acc, recipe) => acc + recipe.weight, 0);
  let cursor = rng() * total;

  for (const recipe of FAMILY_RECIPES) {
    cursor -= recipe.weight;
    if (cursor <= 0) {
      return recipe;
    }
  }

  return FAMILY_RECIPES[FAMILY_RECIPES.length - 1]!;
}

function pickRadiusClass(recipe: FamilyRecipe, rng: () => number): PlanetRadiusClass {
  if (recipe.surfaceModel === 'gaseous') {
    return rng() > 0.16 ? 'giant' : 'standard';
  }
  const roll = rng();
  if (roll < 0.25) return 'dwarf';
  if (roll < 0.86) return 'standard';
  return 'giant';
}

function radiusRangeForClass(radiusClass: PlanetRadiusClass, surfaceModel: PlanetSurfaceModel): { min: number; max: number } {
  if (surfaceModel === 'gaseous') return { min: 8200, max: 15500 };
  if (radiusClass === 'dwarf') return { min: 1800, max: 3900 };
  if (radiusClass === 'giant') return { min: 7200, max: 11800 };
  return { min: 4000, max: 7900 };
}

function pickPalette(recipe: FamilyRecipe, rng: () => number): PalettePreset {
  return recipe.palettes[Math.floor(rng() * recipe.palettes.length)] ?? recipe.palettes[0]!;
}

function buildScaleProfile(physicalRadius: number, surfaceModel: PlanetSurfaceModel): PlanetScaleProfile {
  const normalizedRadius = clamp((physicalRadius - 1800) / (15500 - 1800), 0, 1);
  const renderRadiusBase = MIN_RENDER_RADIUS + normalizedRadius * (MAX_RENDER_RADIUS - MIN_RENDER_RADIUS);
  const galaxyViewScaleMultiplier = surfaceModel === 'gaseous' ? 1.08 : 1;
  const planetViewScaleMultiplier = surfaceModel === 'gaseous' ? 1.02 : 1;

  return {
    physicalRadius,
    renderRadiusBase,
    normalizedRadius,
    galaxyViewScaleMultiplier,
    planetViewScaleMultiplier,
    silhouetteProtectedRadius: Math.max(3.05, renderRadiusBase),
    minRadiusGuardrail: MIN_RENDER_RADIUS,
    maxRadiusGuardrail: MAX_RENDER_RADIUS,
  };
}

function buildViewProfile(viewMode: PlanetViewProfile['viewMode']): PlanetViewProfile {
  const isGalaxy = viewMode === 'galaxy';
  return {
    viewMode,
    lod: isGalaxy ? 'low' : 'high',
    meshSegments: isGalaxy ? 36 : 180,
    cloudSegments: isGalaxy ? 28 : 120,
    atmosphereSegments: isGalaxy ? 24 : 112,
    ringSegments: isGalaxy ? 224 : 640,
    enableRings: true,
    lightingBoost: isGalaxy ? 1.02 : 1.18,
  };
}

export function generateCanonicalPlanet(input: PlanetSeedInput): CanonicalPlanet {
  const worldSeed = input.worldSeed.trim();
  const planetSeed = input.planetSeed.trim();
  const canonicalSeed = deriveSeed(`${worldSeed}::${planetSeed}`, 'planet-canonical-v2');
  const rng = createSeededRng(canonicalSeed);

  const recipe = weightedRecipe(rng);
  const palette = pickPalette(recipe, rng);
  const radiusClass = pickRadiusClass(recipe, rng);
  const radiusRange = radiusRangeForClass(radiusClass, recipe.surfaceModel);
  const physicalRadius = range(rng, radiusRange.min, radiusRange.max);

  const identity: PlanetIdentity = {
    planetId: input.planetId ?? planetSeed,
    planetSeed,
    worldSeed,
    canonicalSeed,
    family: recipe.family,
    radiusClass,
    worldPosition: {
      x: input.worldPosition?.x ?? 0,
      y: input.worldPosition?.y ?? 0,
      z: input.worldPosition?.z ?? 0,
    },
  };

  const classification: PlanetClassification = {
    family: recipe.family,
    surfaceModel: recipe.surfaceModel,
    atmosphereClass: recipe.atmosphereClass,
    roughnessClass: recipe.roughnessClass,
    reliefClass: recipe.reliefClass,
    hasOceans: recipe.hasOceans,
    canHaveClouds: recipe.canHaveClouds,
    canHaveRings: recipe.forceRings === true ? true : recipe.surfaceModel === 'gaseous' || rng() > 0.9,
  };

  const visualDNA: PlanetVisualDNA = {
    paletteId: palette.id,
    colorDeep: jitterColor(rng, palette.deep),
    colorMid: jitterColor(rng, palette.mid),
    colorHigh: jitterColor(rng, palette.high),
    oceanColor: jitterColor(rng, palette.ocean, 0.03),
    accentColor: jitterColor(rng, palette.accent, 0.03),
    cloudColor: jitterColor(rng, palette.cloud, 0.025),
    atmosphereTint: jitterColor(rng, palette.atmosphere, 0.035),
    oceanCoverage: classification.hasOceans ? range(rng, recipe.oceanCoverage[0], recipe.oceanCoverage[1]) : 0,
    cloudCoverage: classification.canHaveClouds ? range(rng, recipe.cloudCoverage[0], recipe.cloudCoverage[1]) : 0,
    atmosphereDensity: classification.atmosphereClass === 'none' ? 0 : range(rng, recipe.atmosphereDensity[0], recipe.atmosphereDensity[1]),
    reliefAmplitude: range(rng, recipe.reliefAmplitude[0], recipe.reliefAmplitude[1]),
    roughness: range(rng, recipe.roughness[0], recipe.roughness[1]),
    specularStrength: range(rng, recipe.specular[0], recipe.specular[1]),
    emissiveIntensity: range(rng, recipe.emissive[0], recipe.emissive[1]),
    bandingStrength: range(rng, recipe.banding[0], recipe.banding[1]),
    noiseSeeds: {
      surface: deriveSeed(String(canonicalSeed), 'surface'),
      moisture: deriveSeed(String(canonicalSeed), 'moisture'),
      thermal: deriveSeed(String(canonicalSeed), 'thermal'),
      clouds: deriveSeed(String(canonicalSeed), 'clouds'),
      bands: deriveSeed(String(canonicalSeed), 'bands'),
      rings: deriveSeed(String(canonicalSeed), 'rings'),
    },
    rotation: {
      surfaceSpeed: range(rng, 0.04, recipe.surfaceModel === 'gaseous' ? 0.12 : 0.22),
      cloudSpeed: range(rng, 0.06, recipe.surfaceModel === 'gaseous' ? 0.18 : 0.3),
      axialTilt: range(rng, -0.42, 0.42),
    },
  };

  const generated: PlanetGeneratedProfile = {
    identity,
    classification,
    visualDNA,
    physicalRadius,
    ring: {
      enabled: classification.canHaveRings,
      innerRadiusRatio: recipe.surfaceModel === 'gaseous' ? range(rng, 1.35, 1.72) : range(rng, 1.3, 1.6),
      outerRadiusRatio: recipe.surfaceModel === 'gaseous' ? range(rng, 2.0, 2.7) : range(rng, 1.82, 2.22),
      tilt: range(rng, -0.66, 0.66),
      opacity: recipe.surfaceModel === 'gaseous' ? range(rng, 0.3, 0.78) : range(rng, 0.18, 0.48),
    },
  };

  const scale = buildScaleProfile(physicalRadius, recipe.surfaceModel);

  const render: PlanetRenderProfile = {
    planetId: identity.planetId,
    renderRadius: scale.renderRadiusBase,
    scale,
    family: recipe.family,
    surfaceModel: recipe.surfaceModel,
    surface: {
      colorDeep: visualDNA.colorDeep,
      colorMid: visualDNA.colorMid,
      colorHigh: visualDNA.colorHigh,
      oceanColor: visualDNA.oceanColor,
      accentColor: visualDNA.accentColor,
      reliefAmplitude: visualDNA.reliefAmplitude,
      roughness: visualDNA.roughness,
      specularStrength: visualDNA.specularStrength,
      emissiveIntensity: visualDNA.emissiveIntensity,
      bandingStrength: visualDNA.bandingStrength,
      oceanLevel: clamp(1 - visualDNA.oceanCoverage * 0.88, 0.14, 0.94),
      noiseSeed: visualDNA.noiseSeeds.surface,
      moistureSeed: visualDNA.noiseSeeds.moisture,
      thermalSeed: visualDNA.noiseSeeds.thermal,
    },
    clouds: {
      enabled: classification.canHaveClouds,
      color: visualDNA.cloudColor,
      coverage: visualDNA.cloudCoverage,
      opacity: clamp(visualDNA.cloudCoverage * (recipe.surfaceModel === 'gaseous' ? 0.76 : 0.68), 0, 0.9),
      speed: visualDNA.rotation.cloudSpeed,
      stormBanding: recipe.surfaceModel === 'gaseous' ? visualDNA.bandingStrength : visualDNA.bandingStrength * 0.42,
      noiseSeed: visualDNA.noiseSeeds.clouds,
    },
    atmosphere: {
      enabled: classification.atmosphereClass !== 'none',
      color: visualDNA.atmosphereTint,
      density: visualDNA.atmosphereDensity,
      thickness: clamp(visualDNA.atmosphereDensity * (recipe.surfaceModel === 'gaseous' ? 0.14 : 0.1), 0, 0.17),
      rimStrength: clamp(0.22 + visualDNA.atmosphereDensity * 0.48, 0.22, 0.72),
    },
    rings: {
      enabled: generated.ring.enabled,
      color: palette.ring,
      innerRadius: scale.renderRadiusBase * generated.ring.innerRadiusRatio,
      outerRadius: scale.renderRadiusBase * generated.ring.outerRadiusRatio,
      tilt: generated.ring.tilt,
      opacity: generated.ring.opacity,
      noiseSeed: visualDNA.noiseSeeds.rings,
    },
    debug: {
      paletteId: visualDNA.paletteId,
      activeNoiseFamilies:
        recipe.surfaceModel === 'gaseous'
          ? ['jet-stream', 'banding', 'storm-cells']
          : ['continents', 'ridged', 'erosion', 'crater'],
    },
  };

  if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined' && (window as { __COINAGE_PIPELINE_TRACE?: boolean }).__COINAGE_PIPELINE_TRACE) {
    console.info('[PlanetPipelineTrace]', {
      stage: 'generateCanonicalPlanet',
      planetId: identity.planetId,
      family: recipe.family,
      surfaceModel: recipe.surfaceModel,
      palette: visualDNA.paletteId,
    });
  }

  return { identity, classification, visualDNA, generated, render };
}


export function createPlanetViewProfile(viewMode: PlanetViewProfile['viewMode']): PlanetViewProfile {
  return buildViewProfile(viewMode);
}

export function isPlanetVisualProfileInBounds(planet: CanonicalPlanet): boolean {
  const radius = planet.render.scale.renderRadiusBase;
  return radius >= MIN_RENDER_RADIUS && radius <= MAX_RENDER_RADIUS;
}

export function profileSignature(planet: CanonicalPlanet): string {
  return [
    planet.identity.planetId,
    planet.identity.family,
    planet.identity.radiusClass,
    planet.visualDNA.paletteId,
    planet.render.renderRadius.toFixed(3),
  ].join('|');
}
