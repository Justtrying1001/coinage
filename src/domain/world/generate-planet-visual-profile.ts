import {
  type ArchetypeConfig,
  BOUNDS,
  DEFAULT_VISUAL_GEN_VERSION,
  MATERIAL_FAMILIES,
  PALETTE_FAMILIES,
  PLANET_ARCHETYPES,
  SIZE_CATEGORY_WEIGHTS,
  SIZE_RADIUS_RANGES,
} from './planet-visual.constants';
import type {
  MaterialFamily,
  PaletteFamily,
  PlanetArchetype,
  PlanetSizeCategory,
  PlanetVisualGeneratorConfig,
  PlanetVisualProfile,
  SeedInputs,
} from './planet-visual.types';
import { createSeededRng, deriveSeed, pickWeighted, range } from './seeded-rng';


function pickArchetype(rng: () => number): ArchetypeConfig {
  return pickWeighted(
    rng,
    PLANET_ARCHETYPES.map((archetype) => ({ value: archetype, weight: archetype.weight })),
  );
}

function pickMaterialFamily(rng: () => number, archetype: ArchetypeConfig): MaterialFamily {
  return pickWeighted(
    rng,
    MATERIAL_FAMILIES.map((materialFamily) => ({
      value: materialFamily,
      weight: archetype.materialWeights[materialFamily],
    })),
  );
}

function pickPaletteFamily(rng: () => number, materialFamily: MaterialFamily, archetype: ArchetypeConfig): PaletteFamily {
  const weighted = PALETTE_FAMILIES.map((palette) => {
    const compatibilityWeight = palette.materialBias.includes(materialFamily) ? 1.35 : 0.52;
    const diversityJitter = 0.72 + rng() * 0.9;
    const archetypeBias = archetype.paletteBias[palette.name] ?? 1;
    return {
      value: palette.name,
      weight: palette.weight * compatibilityWeight * diversityJitter * archetypeBias,
    };
  });

  return pickWeighted(rng, weighted);
}

function pickSizeCategory(rng: () => number): PlanetSizeCategory {
  return pickWeighted(
    rng,
    SIZE_CATEGORY_WEIGHTS.map((item) => ({ value: item.category, weight: item.weight })),
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

  const shapeRng = createSeededRng(shapeSeed);
  const reliefRng = createSeededRng(reliefSeed);
  const colorRng = createSeededRng(colorSeed);
  const atmoRng = createSeededRng(atmoSeed);
  const baseRng = createSeededRng(baseSeed);

  const archetype = pickArchetype(baseRng);

  const sizeCategory = pickSizeCategory(shapeRng);
  const radiusRange = SIZE_RADIUS_RANGES[sizeCategory];

  const materialFamily = pickMaterialFamily(colorRng, archetype);
  const paletteFamily = pickPaletteFamily(colorRng, materialFamily, archetype);

  const atmosphereEnabled = atmoRng() < archetype.atmosphereChance;

  return {
    id: `${seeds.worldSeed}:${seeds.planetSeed}:v${config.visualGenVersion ?? DEFAULT_VISUAL_GEN_VERSION}`,
    visualGenVersion: config.visualGenVersion ?? DEFAULT_VISUAL_GEN_VERSION,
    seeds,
    derivedSubSeeds: {
      baseSeed,
      shapeSeed,
      reliefSeed,
      colorSeed,
      atmoSeed,
    },
    archetype: archetype.name,
    sizeCategory,
    materialFamily,
    paletteFamily,
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
    profile.sizeCategory,
    profile.materialFamily,
    profile.paletteFamily,
    profile.shape.radius.toFixed(3),
    profile.relief.macroStrength.toFixed(3),
    profile.color.hueShift.toFixed(2),
    profile.atmosphere.enabled ? 'atmo:on' : 'atmo:off',
  ].join('|');
}
