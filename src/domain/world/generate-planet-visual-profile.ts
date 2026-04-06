import { BOUNDS, DEFAULT_VISUAL_GEN_VERSION, SIZE_CATEGORY_WEIGHTS, SIZE_RADIUS_RANGES } from './planet-visual.constants';
import { ARCHETYPE_DEFINITIONS, type ArchetypeDefinition, validatePlanetProfile } from './planet-archetype-rules';
import type {
  PlanetMacroStyle,
  PlanetArchetype,
  PlanetSizeCategory,
  PlanetVisualGeneratorConfig,
  PlanetVisualProfile,
  SeedInputs,
} from './planet-visual.types';
import { createSeededRng, deriveSeed, pickWeighted, range } from './seeded-rng';

function pickArchetype(rng: () => number): ArchetypeDefinition {
  return pickWeighted(
    rng,
    (Object.values(ARCHETYPE_DEFINITIONS)).map((definition) => ({ value: definition, weight: definition.weight })),
  );
}

function pickFromWeightedRecord<T extends string>(rng: () => number, weights: Record<T, number>): T {
  return pickWeighted(
    rng,
    (Object.entries(weights) as Array<[T, number]>).map(([value, weight]) => ({ value, weight })),
  );
}

function pickPaletteForArchetype(rng: () => number, definition: ArchetypeDefinition): PlanetVisualProfile['paletteFamily'] {
  if (definition.allowedPalettes.length === 1) {
    return definition.allowedPalettes[0];
  }
  const index = Math.floor(rng() * definition.allowedPalettes.length);
  return definition.allowedPalettes[Math.max(0, Math.min(definition.allowedPalettes.length - 1, index))] as PlanetVisualProfile['paletteFamily'];
}

function pickSizeCategory(rng: () => number): PlanetSizeCategory {
  return pickWeighted(rng, SIZE_CATEGORY_WEIGHTS.map((item) => ({ value: item.category, weight: item.weight })));
}

function pickMacroStyle(rng: () => number, definition: ArchetypeDefinition): PlanetMacroStyle {
  return pickFromWeightedRecord(rng, definition.macroStyleWeights);
}

function normalizeSeedInputs({ worldSeed, planetSeed }: SeedInputs): SeedInputs {
  return {
    worldSeed: worldSeed.trim(),
    planetSeed: planetSeed.trim(),
  };
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

  const archetypeDefinition = pickArchetype(baseRng);
  const archetype = archetypeDefinition.name as PlanetArchetype;

  const sizeCategory = pickSizeCategory(shapeRng);
  const radiusRange = SIZE_RADIUS_RANGES[sizeCategory];
  const macroStyle = pickMacroStyle(baseRng, archetypeDefinition);
  const materialFamily = pickFromWeightedRecord(colorRng, archetypeDefinition.materialWeights);
  const paletteFamily = pickPaletteForArchetype(colorRng, archetypeDefinition);

  const oceanBias = range(hydroRng, archetypeDefinition.hydrology.oceanMin, archetypeDefinition.hydrology.oceanMax);
  const maxOceanRatio = oceanBias;
  const minLandRatio = 1 - maxOceanRatio;

  const atmosphereEnabled = archetypeDefinition.atmosphere.allowed;
  const atmosphereIntensity = atmosphereEnabled && archetypeDefinition.atmosphere.intensityRange
    ? range(atmoRng, archetypeDefinition.atmosphere.intensityRange[0], archetypeDefinition.atmosphere.intensityRange[1])
    : 0;
  const atmosphereThickness = atmosphereEnabled && archetypeDefinition.atmosphere.thicknessRange
    ? range(atmoRng, archetypeDefinition.atmosphere.thicknessRange[0], archetypeDefinition.atmosphere.thicknessRange[1])
    : 0;
  const atmosphereTint = atmosphereEnabled && archetypeDefinition.atmosphere.tintShiftRange
    ? range(atmoRng, archetypeDefinition.atmosphere.tintShiftRange[0], archetypeDefinition.atmosphere.tintShiftRange[1])
    : 0;

  const craterDensity =
    archetypeDefinition.patternRules.crater === 'none'
      ? 0
      : archetypeDefinition.patternRules.crater === 'light'
        ? range(reliefRng, 0.02, 0.25)
        : range(reliefRng, 0.28, 0.8);

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
    archetype,
    macroStyle,
    sizeCategory,
    materialFamily,
    paletteFamily,
    hydrology: {
      oceanBias,
      minLandRatio,
      maxOceanRatio,
    },
    shape: {
      radius: range(shapeRng, radiusRange.min, radiusRange.max),
      wobbleFrequency: range(shapeRng, BOUNDS.wobbleFrequency.min, BOUNDS.wobbleFrequency.max),
      wobbleAmplitude: range(shapeRng, BOUNDS.wobbleAmplitude.min, BOUNDS.wobbleAmplitude.max),
      ridgeWarp: range(shapeRng, archetypeDefinition.reliefRules.ridgeWarpMin, archetypeDefinition.reliefRules.ridgeWarpMax),
    },
    relief: {
      macroStrength: range(reliefRng, archetypeDefinition.reliefRules.macroMin, archetypeDefinition.reliefRules.macroMax),
      microStrength: range(reliefRng, archetypeDefinition.reliefRules.microMin, archetypeDefinition.reliefRules.microMax),
      roughness: range(reliefRng, archetypeDefinition.reliefRules.roughnessMin, archetypeDefinition.reliefRules.roughnessMax),
      craterDensity,
    },
    color: {
      hueShift: range(colorRng, archetypeDefinition.colorRules.hueShiftMin, archetypeDefinition.colorRules.hueShiftMax),
      saturation: range(colorRng, archetypeDefinition.colorRules.saturationMin, archetypeDefinition.colorRules.saturationMax),
      lightness: range(colorRng, archetypeDefinition.colorRules.lightnessMin, archetypeDefinition.colorRules.lightnessMax),
      accentMix: range(colorRng, 0.15, 0.85),
    },
    atmosphere: {
      enabled: atmosphereEnabled,
      intensity: atmosphereIntensity,
      thickness: atmosphereThickness,
      tintShift: atmosphereTint,
    },
  };

  validatePlanetProfile(profile);
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
    profile.hydrology.minLandRatio >= 0 &&
    profile.hydrology.minLandRatio <= 1 &&
    profile.hydrology.maxOceanRatio >= 0 &&
    profile.hydrology.maxOceanRatio <= 1 &&
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
    profile.archetype,
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
