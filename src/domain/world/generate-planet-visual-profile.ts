import {
  BOUNDS,
  DEFAULT_VISUAL_GEN_VERSION,
  MATERIAL_FAMILIES,
  PALETTE_FAMILIES,
  SIZE_CATEGORY_WEIGHTS,
  SIZE_RADIUS_RANGES,
} from './planet-visual.constants';
import type {
  MaterialFamily,
  PaletteFamily,
  PlanetSizeCategory,
  PlanetVisualGeneratorConfig,
  PlanetVisualProfile,
  SeedInputs,
} from './planet-visual.types';
import { createSeededRng, deriveSeed, pickWeighted, range } from './seeded-rng';

function pickMaterialFamily(rng: () => number): MaterialFamily {
  return MATERIAL_FAMILIES[Math.floor(rng() * MATERIAL_FAMILIES.length)] ?? 'rocky';
}

function pickPaletteFamily(rng: () => number, materialFamily: MaterialFamily): PaletteFamily {
  const filtered = PALETTE_FAMILIES.filter((palette) => palette.materialBias.includes(materialFamily));
  const source = filtered.length > 0 ? filtered : PALETTE_FAMILIES;

  return source[Math.floor(rng() * source.length)]?.name ?? 'basalt-moss';
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
  const surfaceSeed = deriveSeed(base, 'surface');

  const shapeRng = createSeededRng(shapeSeed);
  const reliefRng = createSeededRng(reliefSeed);
  const colorRng = createSeededRng(colorSeed);
  const atmoRng = createSeededRng(atmoSeed);
  const surfaceRng = createSeededRng(surfaceSeed);

  const sizeCategory = pickSizeCategory(shapeRng);
  const radiusRange = SIZE_RADIUS_RANGES[sizeCategory];

  const materialFamily = pickMaterialFamily(colorRng);
  const paletteFamily = pickPaletteFamily(colorRng, materialFamily);

  const atmosphereEnabled = atmoRng() > 0.35;

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
      surfaceSeed,
    },
    sizeCategory,
    materialFamily,
    paletteFamily,
    shape: {
      radius: range(shapeRng, radiusRange.min, radiusRange.max),
      wobbleFrequency: range(shapeRng, BOUNDS.wobbleFrequency.min, BOUNDS.wobbleFrequency.max),
      wobbleAmplitude: range(shapeRng, BOUNDS.wobbleAmplitude.min, BOUNDS.wobbleAmplitude.max),
      ridgeWarp: range(shapeRng, BOUNDS.ridgeWarp.min, BOUNDS.ridgeWarp.max),
    },
    relief: {
      macroStrength: range(reliefRng, BOUNDS.macroStrength.min, BOUNDS.macroStrength.max),
      microStrength: range(reliefRng, BOUNDS.microStrength.min, BOUNDS.microStrength.max),
      roughness: range(reliefRng, BOUNDS.roughness.min, BOUNDS.roughness.max),
      craterDensity: range(reliefRng, BOUNDS.craterDensity.min, BOUNDS.craterDensity.max),
    },
    surface: {
      oceanLevel: range(surfaceRng, BOUNDS.oceanLevel.min, BOUNDS.oceanLevel.max),
      biomeScale: range(surfaceRng, BOUNDS.biomeScale.min, BOUNDS.biomeScale.max),
      heatBias: range(surfaceRng, BOUNDS.heatBias.min, BOUNDS.heatBias.max),
      moistureBias: range(surfaceRng, BOUNDS.moistureBias.min, BOUNDS.moistureBias.max),
      ridgeSharpness: range(surfaceRng, BOUNDS.ridgeSharpness.min, BOUNDS.ridgeSharpness.max),
    },
    color: {
      hueShift: range(colorRng, BOUNDS.hueShift.min, BOUNDS.hueShift.max),
      saturation: range(colorRng, BOUNDS.saturation.min, BOUNDS.saturation.max),
      lightness: range(colorRng, BOUNDS.lightness.min, BOUNDS.lightness.max),
      accentMix: range(colorRng, BOUNDS.accentMix.min, BOUNDS.accentMix.max),
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
    profile.surface.oceanLevel >= BOUNDS.oceanLevel.min &&
    profile.surface.oceanLevel <= BOUNDS.oceanLevel.max &&
    profile.surface.biomeScale >= BOUNDS.biomeScale.min &&
    profile.surface.biomeScale <= BOUNDS.biomeScale.max &&
    profile.surface.heatBias >= BOUNDS.heatBias.min &&
    profile.surface.heatBias <= BOUNDS.heatBias.max &&
    profile.surface.moistureBias >= BOUNDS.moistureBias.min &&
    profile.surface.moistureBias <= BOUNDS.moistureBias.max &&
    profile.surface.ridgeSharpness >= BOUNDS.ridgeSharpness.min &&
    profile.surface.ridgeSharpness <= BOUNDS.ridgeSharpness.max &&
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
    profile.sizeCategory,
    profile.materialFamily,
    profile.paletteFamily,
    profile.shape.radius.toFixed(3),
    profile.relief.macroStrength.toFixed(3),
    profile.surface.oceanLevel.toFixed(3),
    profile.color.hueShift.toFixed(2),
    profile.atmosphere.enabled ? 'atmo:on' : 'atmo:off',
  ].join('|');
}
