import {
  type ArchetypeConfig,
  BOUNDS,
  DEFAULT_VISUAL_GEN_VERSION,
  MATERIAL_FAMILIES,
  PLANET_ARCHETYPES,
  SIZE_RADIUS_RANGES,
} from './planet-visual.constants';
import {
  generatePlanetIdentity,
  pickArchetypeFromIdentityRules,
  validateProfileIdentity,
} from './generate-planet-identity';
import { MIN_GAMEPLAY_LAND_RATIO } from './planet-identity.constants';
import type {
  MaterialFamily,
  PlanetMacroStyle,
  PlanetVisualGeneratorConfig,
  PlanetVisualProfile,
  SeedInputs,
} from './planet-visual.types';
import { createSeededRng, deriveSeed, pickWeighted, range } from './seeded-rng';

function pickMaterialFamily(rng: () => number, archetype: ArchetypeConfig): MaterialFamily {
  return pickWeighted(
    rng,
    MATERIAL_FAMILIES.map((materialFamily) => ({
      value: materialFamily,
      weight: archetype.materialWeights[materialFamily],
    })),
  );
}

function pickMacroStyle(rng: () => number, archetype: ArchetypeConfig): PlanetMacroStyle {
  return pickWeighted(
    rng,
    (Object.entries(archetype.macroStyleWeights) as Array<[PlanetMacroStyle, number]>).map(([value, weight]) => ({
      value,
      weight,
    })),
  );
}

function normalizeSeedInputs({ worldSeed, planetSeed }: SeedInputs): SeedInputs {
  return {
    worldSeed: worldSeed.trim(),
    planetSeed: planetSeed.trim(),
  };
}

function sampleBiasedRange(
  rng: () => number,
  globalBounds: { min: number; max: number },
  archetypeBounds: { min: number; max: number },
): number {
  return range(
    rng,
    Math.max(globalBounds.min, archetypeBounds.min),
    Math.min(globalBounds.max, archetypeBounds.max),
  );
}

function ensureArchetypeConfig(archetype: PlanetVisualProfile['archetype']): ArchetypeConfig {
  const config = PLANET_ARCHETYPES.find((item) => item.name === archetype);
  if (!config) {
    throw new Error(`missing-archetype-config:${archetype}`);
  }
  return config;
}

export function generatePlanetVisualProfile(
  seedInputs: SeedInputs,
  config: PlanetVisualGeneratorConfig = {},
): PlanetVisualProfile {
  const seeds = normalizeSeedInputs(seedInputs);

  if (!seeds.worldSeed || !seeds.planetSeed) {
    throw new Error('worldSeed and planetSeed must be non-empty strings');
  }

  const base = `${seeds.worldSeed}::${seeds.planetSeed}`;
  const baseSeed = deriveSeed(base, 'base');
  const shapeSeed = deriveSeed(base, 'shape');
  const reliefSeed = deriveSeed(base, 'relief');
  const colorSeed = deriveSeed(base, 'color');
  const atmoSeed = deriveSeed(base, 'atmo');
  const hydroSeed = deriveSeed(base, 'hydro');

  const shapeRng = createSeededRng(shapeSeed);
  const reliefRng = createSeededRng(reliefSeed);
  const colorRng = createSeededRng(colorSeed);
  const atmoRng = createSeededRng(atmoSeed);
  const hydroRng = createSeededRng(hydroSeed);
  const baseRng = createSeededRng(baseSeed);

  const archetypeName = pickArchetypeFromIdentityRules(baseRng);
  const identity = generatePlanetIdentity({ archetype: archetypeName, baseSeed });
  const archetype = ensureArchetypeConfig(identity.archetype);

  const radiusRange = SIZE_RADIUS_RANGES[identity.sizeCategory];
  const macroStyle = pickMacroStyle(baseRng, archetype);
  const materialFamily = pickMaterialFamily(colorRng, archetype);

  const atmosphereEnabled = identity.atmosphereFamily !== 'none' && atmoRng() < archetype.atmosphereChance;

  const hydrologyRangeByFamily = {
    waterworld: { oceanBias: [0.56, 0.78], minLandRatio: [0.46, 0.56], maxOceanRatio: [0.44, 0.58] },
    balanced: { oceanBias: [0.35, 0.62], minLandRatio: [0.46, 0.68], maxOceanRatio: [0.3, 0.54] },
    arid: { oceanBias: [0.12, 0.34], minLandRatio: [0.58, 0.8], maxOceanRatio: [0.14, 0.34] },
    dry: { oceanBias: [0.02, 0.18], minLandRatio: [0.68, 0.9], maxOceanRatio: [0.02, 0.18] },
    cryo: { oceanBias: [0.2, 0.42], minLandRatio: [0.48, 0.72], maxOceanRatio: [0.22, 0.44] },
  } as const;

  const hydroFamilyRange = hydrologyRangeByFamily[identity.hydrologyFamily];

  const profile: PlanetVisualProfile = {
    id: `${seeds.worldSeed}:${seeds.planetSeed}:v${config.visualGenVersion ?? DEFAULT_VISUAL_GEN_VERSION}`,
    visualGenVersion: config.visualGenVersion ?? DEFAULT_VISUAL_GEN_VERSION,
    seeds,
    derivedSubSeeds: {
      baseSeed,
      shapeSeed,
      reliefSeed,
      colorSeed,
      atmoSeed,
      hydroSeed,
    },
    identity,
    archetype: identity.archetype,
    macroStyle,
    sizeCategory: identity.sizeCategory,
    materialFamily,
    paletteFamily: identity.paletteFamily,
    hydrology: {
      oceanBias: sampleBiasedRange(hydroRng, { min: 0, max: 1 }, {
        min: hydroFamilyRange.oceanBias[0],
        max: hydroFamilyRange.oceanBias[1],
      }),
      minLandRatio: sampleBiasedRange(hydroRng, { min: MIN_GAMEPLAY_LAND_RATIO, max: 0.9 }, {
        min: Math.max(hydroFamilyRange.minLandRatio[0], identity.visualConstraints.minLandRatio),
        max: hydroFamilyRange.minLandRatio[1],
      }),
      maxOceanRatio: sampleBiasedRange(hydroRng, { min: 0.02, max: 0.74 }, {
        min: hydroFamilyRange.maxOceanRatio[0],
        max: Math.min(hydroFamilyRange.maxOceanRatio[1], identity.visualConstraints.maxOceanRatio),
      }),
    },
    shape: {
      radius: range(shapeRng, radiusRange.min, radiusRange.max),
      wobbleFrequency: sampleBiasedRange(shapeRng, BOUNDS.wobbleFrequency, archetype.shapeBias.wobbleFrequency),
      wobbleAmplitude: sampleBiasedRange(shapeRng, BOUNDS.wobbleAmplitude, archetype.shapeBias.wobbleAmplitude),
      ridgeWarp: sampleBiasedRange(shapeRng, BOUNDS.ridgeWarp, archetype.shapeBias.ridgeWarp),
    },
    relief: {
      macroStrength: sampleBiasedRange(reliefRng, BOUNDS.macroStrength, archetype.reliefBias.macroStrength),
      microStrength: sampleBiasedRange(reliefRng, BOUNDS.microStrength, archetype.reliefBias.microStrength),
      roughness: sampleBiasedRange(reliefRng, BOUNDS.roughness, archetype.reliefBias.roughness),
      craterDensity: sampleBiasedRange(reliefRng, BOUNDS.craterDensity, archetype.reliefBias.craterDensity),
    },
    color: {
      hueShift: range(colorRng, BOUNDS.hueShift.min, BOUNDS.hueShift.max),
      saturation: sampleBiasedRange(colorRng, BOUNDS.saturation, archetype.colorBias.saturation),
      lightness: sampleBiasedRange(colorRng, BOUNDS.lightness, archetype.colorBias.lightness),
      accentMix: sampleBiasedRange(colorRng, BOUNDS.accentMix, archetype.colorBias.accentMix),
    },
    atmosphere: {
      enabled: atmosphereEnabled,
      intensity: atmosphereEnabled
        ? range(atmoRng, BOUNDS.atmosphereIntensity.min, BOUNDS.atmosphereIntensity.max)
        : 0,
      thickness: atmosphereEnabled
        ? range(atmoRng, BOUNDS.atmosphereThickness.min, BOUNDS.atmosphereThickness.max)
        : 0,
      tintShift: atmosphereEnabled
        ? range(atmoRng, BOUNDS.atmosphereTintShift.min, BOUNDS.atmosphereTintShift.max)
        : 0,
    },
  };

  const identityIssues = validateProfileIdentity(profile);
  if (identityIssues.length > 0) {
    throw new Error(`invalid-planet-identity:${identityIssues.join('|')}`);
  }

  return profile;
}

export function isPlanetVisualProfileInBounds(profile: PlanetVisualProfile): boolean {
  const radiusRange = SIZE_RADIUS_RANGES[profile.sizeCategory];

  return (
    profile.shape.radius >= radiusRange.min &&
    profile.shape.radius <= radiusRange.max &&
    profile.shape.wobbleFrequency >= BOUNDS.wobbleFrequency.min &&
    profile.shape.wobbleFrequency <= BOUNDS.wobbleFrequency.max &&
    profile.shape.wobbleAmplitude >= BOUNDS.wobbleAmplitude.min &&
    profile.shape.wobbleAmplitude <= BOUNDS.wobbleAmplitude.max &&
    profile.shape.ridgeWarp >= BOUNDS.ridgeWarp.min &&
    profile.shape.ridgeWarp <= BOUNDS.ridgeWarp.max &&
    profile.relief.macroStrength >= BOUNDS.macroStrength.min &&
    profile.relief.macroStrength <= BOUNDS.macroStrength.max &&
    profile.relief.microStrength >= BOUNDS.microStrength.min &&
    profile.relief.microStrength <= BOUNDS.microStrength.max &&
    profile.relief.roughness >= BOUNDS.roughness.min &&
    profile.relief.roughness <= BOUNDS.roughness.max &&
    profile.relief.craterDensity >= BOUNDS.craterDensity.min &&
    profile.relief.craterDensity <= BOUNDS.craterDensity.max &&
    profile.color.hueShift >= BOUNDS.hueShift.min &&
    profile.color.hueShift <= BOUNDS.hueShift.max &&
    profile.color.saturation >= BOUNDS.saturation.min &&
    profile.color.saturation <= BOUNDS.saturation.max &&
    profile.color.lightness >= BOUNDS.lightness.min &&
    profile.color.lightness <= BOUNDS.lightness.max &&
    profile.color.accentMix >= BOUNDS.accentMix.min &&
    profile.color.accentMix <= BOUNDS.accentMix.max &&
    profile.hydrology.oceanBias >= 0 &&
    profile.hydrology.oceanBias <= 1 &&
    profile.hydrology.minLandRatio >= MIN_GAMEPLAY_LAND_RATIO &&
    profile.hydrology.minLandRatio <= 0.9 &&
    profile.hydrology.maxOceanRatio >= 0.02 &&
    profile.hydrology.maxOceanRatio <= 0.74 &&
    (profile.atmosphere.enabled
      ? profile.atmosphere.intensity >= BOUNDS.atmosphereIntensity.min &&
        profile.atmosphere.intensity <= BOUNDS.atmosphereIntensity.max &&
        profile.atmosphere.thickness >= BOUNDS.atmosphereThickness.min &&
        profile.atmosphere.thickness <= BOUNDS.atmosphereThickness.max &&
        profile.atmosphere.tintShift >= BOUNDS.atmosphereTintShift.min &&
        profile.atmosphere.tintShift <= BOUNDS.atmosphereTintShift.max
      : profile.atmosphere.intensity === 0 &&
        profile.atmosphere.thickness === 0 &&
        profile.atmosphere.tintShift === 0)
  );
}

export function profileSignature(profile: PlanetVisualProfile): string {
  return [
    profile.identity.archetype,
    profile.identity.shapeFamily,
    profile.identity.reliefFamily,
    profile.identity.surfaceFamily,
    profile.macroStyle,
    profile.sizeCategory,
    profile.materialFamily,
    profile.paletteFamily,
    profile.shape.radius.toFixed(3),
    profile.relief.macroStrength.toFixed(3),
    profile.hydrology.minLandRatio.toFixed(3),
    profile.color.hueShift.toFixed(2),
    profile.atmosphere.enabled ? 'atmo:on' : 'atmo:off',
  ].join('|');
}
