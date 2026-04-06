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
const MAX_RENDER_RADIUS = 5.8;

type PalettePreset = {
  id: string;
  baseColor: [number, number, number];
  secondaryColor: [number, number, number];
  oceanColor: [number, number, number];
  cloudColor: [number, number, number];
  atmosphereTint: [number, number, number];
  emissiveColor: [number, number, number];
  ringTint: [number, number, number];
};

const FAMILY_PALETTES: Record<PlanetFamily, PalettePreset[]> = {
  oceanic: [
    {
      id: 'oceanic-abyss',
      baseColor: [0.11, 0.27, 0.58],
      secondaryColor: [0.2, 0.45, 0.72],
      oceanColor: [0.05, 0.21, 0.58],
      cloudColor: [0.92, 0.95, 0.99],
      atmosphereTint: [0.34, 0.58, 0.9],
      emissiveColor: [0.18, 0.32, 0.6],
      ringTint: [0.5, 0.64, 0.82],
    },
    {
      id: 'oceanic-cyan',
      baseColor: [0.08, 0.34, 0.62],
      secondaryColor: [0.21, 0.56, 0.75],
      oceanColor: [0.06, 0.3, 0.64],
      cloudColor: [0.9, 0.96, 1],
      atmosphereTint: [0.39, 0.67, 0.94],
      emissiveColor: [0.14, 0.4, 0.6],
      ringTint: [0.53, 0.7, 0.84],
    },
  ],
  terrestrial: [
    {
      id: 'earthlike-temperate',
      baseColor: [0.24, 0.42, 0.24],
      secondaryColor: [0.46, 0.36, 0.23],
      oceanColor: [0.12, 0.29, 0.6],
      cloudColor: [0.92, 0.94, 0.97],
      atmosphereTint: [0.45, 0.62, 0.9],
      emissiveColor: [0.18, 0.24, 0.3],
      ringTint: [0.62, 0.58, 0.5],
    },
    {
      id: 'earthlike-lush',
      baseColor: [0.2, 0.49, 0.26],
      secondaryColor: [0.52, 0.38, 0.24],
      oceanColor: [0.14, 0.34, 0.64],
      cloudColor: [0.93, 0.95, 0.97],
      atmosphereTint: [0.42, 0.64, 0.88],
      emissiveColor: [0.14, 0.24, 0.29],
      ringTint: [0.64, 0.61, 0.52],
    },
  ],
  volcanic: [
    {
      id: 'volcanic-basalts',
      baseColor: [0.11, 0.11, 0.12],
      secondaryColor: [0.33, 0.13, 0.09],
      oceanColor: [0.08, 0.08, 0.09],
      cloudColor: [0.5, 0.45, 0.42],
      atmosphereTint: [0.71, 0.32, 0.2],
      emissiveColor: [0.9, 0.3, 0.14],
      ringTint: [0.57, 0.31, 0.21],
    },
    {
      id: 'volcanic-magma',
      baseColor: [0.08, 0.08, 0.09],
      secondaryColor: [0.38, 0.15, 0.1],
      oceanColor: [0.07, 0.07, 0.08],
      cloudColor: [0.44, 0.4, 0.35],
      atmosphereTint: [0.76, 0.35, 0.2],
      emissiveColor: [0.95, 0.38, 0.18],
      ringTint: [0.59, 0.33, 0.18],
    },
  ],
  icy: [
    {
      id: 'ice-glacier',
      baseColor: [0.74, 0.84, 0.92],
      secondaryColor: [0.58, 0.72, 0.86],
      oceanColor: [0.39, 0.56, 0.74],
      cloudColor: [0.93, 0.96, 0.99],
      atmosphereTint: [0.61, 0.78, 0.95],
      emissiveColor: [0.3, 0.45, 0.62],
      ringTint: [0.76, 0.84, 0.92],
    },
    {
      id: 'ice-cyan',
      baseColor: [0.8, 0.9, 0.97],
      secondaryColor: [0.64, 0.79, 0.9],
      oceanColor: [0.47, 0.63, 0.8],
      cloudColor: [0.94, 0.97, 1],
      atmosphereTint: [0.66, 0.82, 0.96],
      emissiveColor: [0.27, 0.42, 0.57],
      ringTint: [0.78, 0.87, 0.95],
    },
  ],
  'gas-dwarf': [
    {
      id: 'gas-amethyst',
      baseColor: [0.43, 0.27, 0.61],
      secondaryColor: [0.21, 0.64, 0.67],
      oceanColor: [0.16, 0.34, 0.49],
      cloudColor: [0.86, 0.88, 0.95],
      atmosphereTint: [0.53, 0.47, 0.8],
      emissiveColor: [0.54, 0.42, 0.75],
      ringTint: [0.72, 0.62, 0.81],
    },
    {
      id: 'gas-aurora',
      baseColor: [0.29, 0.51, 0.66],
      secondaryColor: [0.71, 0.48, 0.35],
      oceanColor: [0.22, 0.39, 0.54],
      cloudColor: [0.9, 0.9, 0.95],
      atmosphereTint: [0.49, 0.64, 0.86],
      emissiveColor: [0.54, 0.56, 0.72],
      ringTint: [0.76, 0.7, 0.6],
    },
  ],
  toxic: [
    {
      id: 'toxic-neon',
      baseColor: [0.24, 0.35, 0.16],
      secondaryColor: [0.41, 0.32, 0.11],
      oceanColor: [0.18, 0.3, 0.16],
      cloudColor: [0.81, 0.89, 0.76],
      atmosphereTint: [0.55, 0.74, 0.33],
      emissiveColor: [0.62, 0.8, 0.33],
      ringTint: [0.56, 0.66, 0.35],
    },
    {
      id: 'toxic-swamp',
      baseColor: [0.19, 0.28, 0.13],
      secondaryColor: [0.36, 0.27, 0.1],
      oceanColor: [0.14, 0.23, 0.12],
      cloudColor: [0.78, 0.84, 0.71],
      atmosphereTint: [0.48, 0.67, 0.28],
      emissiveColor: [0.54, 0.72, 0.28],
      ringTint: [0.53, 0.62, 0.36],
    },
  ],
  barren: [
    {
      id: 'barren-umber',
      baseColor: [0.45, 0.39, 0.32],
      secondaryColor: [0.34, 0.28, 0.23],
      oceanColor: [0.22, 0.2, 0.18],
      cloudColor: [0.82, 0.8, 0.77],
      atmosphereTint: [0.56, 0.5, 0.43],
      emissiveColor: [0.3, 0.24, 0.2],
      ringTint: [0.67, 0.59, 0.5],
    },
    {
      id: 'barren-charcoal',
      baseColor: [0.34, 0.33, 0.35],
      secondaryColor: [0.22, 0.21, 0.23],
      oceanColor: [0.16, 0.16, 0.18],
      cloudColor: [0.8, 0.8, 0.79],
      atmosphereTint: [0.52, 0.52, 0.56],
      emissiveColor: [0.24, 0.24, 0.26],
      ringTint: [0.62, 0.62, 0.66],
    },
  ],
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function jitterColor(rng: () => number, base: [number, number, number], variance = 0.04): [number, number, number] {
  return base.map((channel) => clamp(channel + (rng() - 0.5) * variance, 0, 1)) as [number, number, number];
}

function pickFamily(rng: () => number): PlanetFamily {
  const roll = rng();
  if (roll < 0.16) return 'oceanic';
  if (roll < 0.32) return 'terrestrial';
  if (roll < 0.46) return 'icy';
  if (roll < 0.6) return 'volcanic';
  if (roll < 0.74) return 'barren';
  if (roll < 0.86) return 'toxic';
  return 'gas-dwarf';
}

function pickRadiusClass(rng: () => number): PlanetRadiusClass {
  const roll = rng();
  if (roll < 0.26) return 'dwarf';
  if (roll < 0.82) return 'standard';
  return 'giant';
}

function radiusRangeForClass(radiusClass: PlanetRadiusClass): { min: number; max: number } {
  if (radiusClass === 'dwarf') return { min: 1900, max: 4100 };
  if (radiusClass === 'giant') return { min: 7900, max: 14000 };
  return { min: 4200, max: 7800 };
}

function pickPalette(family: PlanetFamily, rng: () => number): PalettePreset {
  const presets = FAMILY_PALETTES[family];
  return presets[Math.floor(rng() * presets.length)] ?? presets[0]!;
}

function classificationFromFamily(family: PlanetFamily, rng: () => number): PlanetClassification {
  const reliefClass: PlanetReliefClass = family === 'volcanic' ? 'extreme' : rng() > 0.55 ? 'rugged' : 'gentle';
  const roughnessClass: PlanetRoughnessClass = reliefClass === 'extreme' ? 'coarse' : rng() > 0.5 ? 'balanced' : 'polished';
  const atmosphereClass: PlanetAtmosphereClass =
    family === 'barren' ? 'none' : family === 'toxic' ? 'reactive' : rng() > 0.7 ? 'dense' : 'standard';

  return {
    family,
    biomeArchetype:
      family === 'oceanic'
        ? 'lush'
        : family === 'icy'
          ? 'ice'
          : family === 'volcanic'
            ? 'molten'
            : family === 'toxic'
              ? 'toxic'
              : family === 'gas-dwarf'
                ? 'storm'
                : 'rocky',
    atmosphereClass,
    roughnessClass,
    reliefClass,
    hasOceans: family === 'oceanic' || family === 'terrestrial',
    canHaveClouds: atmosphereClass !== 'none' && family !== 'volcanic',
    canHaveRings: family === 'gas-dwarf' || rng() > 0.82,
  };
}

function buildScaleProfile(physicalRadius: number): PlanetScaleProfile {
  const normalizedRadius = clamp((physicalRadius - 1900) / (14000 - 1900), 0, 1);
  const renderRadiusBase = MIN_RENDER_RADIUS + normalizedRadius * (MAX_RENDER_RADIUS - MIN_RENDER_RADIUS);

  return {
    physicalRadius,
    renderRadiusBase,
    normalizedRadius,
    galaxyViewScaleMultiplier: 1,
    planetViewScaleMultiplier: 1,
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
    meshSegments: isGalaxy ? 28 : 96,
    cloudSegments: isGalaxy ? 24 : 72,
    atmosphereSegments: isGalaxy ? 20 : 60,
    enableRings: true,
    lightingBoost: isGalaxy ? 1 : 1.2,
  };
}

export function generateCanonicalPlanet(input: PlanetSeedInput): CanonicalPlanet {
  const worldSeed = input.worldSeed.trim();
  const planetSeed = input.planetSeed.trim();
  const canonicalSeed = deriveSeed(`${worldSeed}::${planetSeed}`, 'planet-canonical');
  const rng = createSeededRng(canonicalSeed);

  const family = pickFamily(rng);
  const palette = pickPalette(family, rng);
  const radiusClass = pickRadiusClass(rng);
  const physicalRadius = range(rng, radiusRangeForClass(radiusClass).min, radiusRangeForClass(radiusClass).max);

  const identity: PlanetIdentity = {
    planetId: input.planetId ?? planetSeed,
    planetSeed,
    worldSeed,
    canonicalSeed,
    family,
    radiusClass,
    worldPosition: {
      x: input.worldPosition?.x ?? 0,
      y: input.worldPosition?.y ?? 0,
      z: input.worldPosition?.z ?? 0,
    },
  };

  const classification = classificationFromFamily(family, rng);
  const oceanCoverageByFamily: Record<PlanetFamily, { min: number; max: number }> = {
    oceanic: { min: 0.7, max: 0.9 },
    terrestrial: { min: 0.32, max: 0.58 },
    volcanic: { min: 0, max: 0.05 },
    icy: { min: 0.08, max: 0.24 },
    'gas-dwarf': { min: 0, max: 0 },
    toxic: { min: 0.04, max: 0.18 },
    barren: { min: 0, max: 0.05 },
  };

  const cloudCoverageByFamily: Record<PlanetFamily, { min: number; max: number }> = {
    oceanic: { min: 0.45, max: 0.82 },
    terrestrial: { min: 0.22, max: 0.62 },
    volcanic: { min: 0.04, max: 0.2 },
    icy: { min: 0.16, max: 0.42 },
    'gas-dwarf': { min: 0.52, max: 0.88 },
    toxic: { min: 0.2, max: 0.5 },
    barren: { min: 0, max: 0.2 },
  };

  const visualDNA: PlanetVisualDNA = {
    paletteId: palette.id,
    baseColor: jitterColor(rng, palette.baseColor),
    secondaryColor: jitterColor(rng, palette.secondaryColor),
    oceanColor: jitterColor(rng, palette.oceanColor, 0.03),
    cloudColor: jitterColor(rng, palette.cloudColor, 0.025),
    atmosphereTint: jitterColor(rng, palette.atmosphereTint, 0.035),
    oceanCoverage: classification.hasOceans ? range(rng, oceanCoverageByFamily[family].min, oceanCoverageByFamily[family].max) : 0,
    cloudCoverage: classification.canHaveClouds ? range(rng, cloudCoverageByFamily[family].min, cloudCoverageByFamily[family].max) : 0,
    atmosphereDensity: classification.atmosphereClass === 'none'
      ? 0
      : family === 'oceanic'
        ? range(rng, 0.45, 0.9)
        : family === 'volcanic'
          ? range(rng, 0.3, 0.7)
          : family === 'icy'
            ? range(rng, 0.2, 0.55)
            : range(rng, 0.18, 0.76),
    reliefAmplitude: family === 'gas-dwarf'
      ? range(rng, 0.02, 0.08)
      : range(rng, 0.08, classification.reliefClass === 'extreme' ? 0.34 : 0.22),
    roughness: family === 'oceanic'
      ? range(rng, 0.35, 0.56)
      : classification.roughnessClass === 'coarse'
        ? range(rng, 0.68, 0.92)
        : range(rng, 0.42, 0.78),
    specularStrength: family === 'oceanic'
      ? range(rng, 0.62, 0.88)
      : family === 'terrestrial'
        ? range(rng, 0.34, 0.6)
        : range(rng, 0.08, 0.28),
    emissiveIntensity: family === 'volcanic' ? range(rng, 0.2, 0.45) : family === 'toxic' ? range(rng, 0.08, 0.18) : range(rng, 0, 0.07),
    bandingStrength: family === 'gas-dwarf' ? range(rng, 0.48, 0.84) : range(rng, 0.02, 0.2),
    noiseSeeds: {
      surface: deriveSeed(String(canonicalSeed), 'surface'),
      clouds: deriveSeed(String(canonicalSeed), 'clouds'),
      bands: deriveSeed(String(canonicalSeed), 'bands'),
      rings: deriveSeed(String(canonicalSeed), 'rings'),
    },
    rotation: {
      surfaceSpeed: range(rng, 0.04, 0.2),
      cloudSpeed: range(rng, 0.06, 0.24),
      axialTilt: range(rng, -0.36, 0.36),
    },
  };

  const generated: PlanetGeneratedProfile = {
    identity,
    classification,
    visualDNA,
    physicalRadius,
    ring: {
      enabled: classification.canHaveRings,
      innerRadiusRatio: range(rng, 1.3, 1.7),
      outerRadiusRatio: range(rng, 1.85, 2.4),
      tilt: range(rng, -0.72, 0.72),
      opacity: range(rng, 0.22, 0.68),
    },
  };

  const scale = buildScaleProfile(physicalRadius);

  const render: PlanetRenderProfile = {
    planetId: identity.planetId,
    renderRadius: scale.renderRadiusBase,
    scale,
    surface: {
      colorA: visualDNA.baseColor,
      colorB: visualDNA.secondaryColor,
      oceanColor: visualDNA.oceanColor,
      reliefAmplitude: visualDNA.reliefAmplitude,
      roughness: visualDNA.roughness,
      specularStrength: visualDNA.specularStrength,
      bandingStrength: visualDNA.bandingStrength,
      noiseSeed: visualDNA.noiseSeeds.surface,
    },
    clouds: {
      enabled: classification.canHaveClouds,
      color: visualDNA.cloudColor,
      coverage: visualDNA.cloudCoverage,
      opacity: clamp(visualDNA.cloudCoverage * 0.78, 0, 0.86),
      speed: visualDNA.rotation.cloudSpeed,
      noiseSeed: visualDNA.noiseSeeds.clouds,
    },
    atmosphere: {
      enabled: classification.atmosphereClass !== 'none',
      color: visualDNA.atmosphereTint,
      density: visualDNA.atmosphereDensity,
      thickness: clamp(visualDNA.atmosphereDensity * 0.14, 0, 0.14),
      rimStrength: clamp(0.25 + visualDNA.atmosphereDensity * 0.72, 0.25, 0.95),
    },
    rings: {
      enabled: generated.ring.enabled,
      innerRadius: scale.renderRadiusBase * generated.ring.innerRadiusRatio,
      outerRadius: scale.renderRadiusBase * generated.ring.outerRadiusRatio,
      tilt: generated.ring.tilt,
      opacity: generated.ring.opacity,
      noiseSeed: visualDNA.noiseSeeds.rings,
    },
    debug: {
      paletteId: visualDNA.paletteId,
      activeNoiseFamilies: ['fbm', family === 'gas-dwarf' ? 'banding' : 'ridged'],
    },
  };

  return { identity, classification, visualDNA, generated, render };
}

export function generatePlanetVisualProfile(input: PlanetSeedInput): CanonicalPlanet {
  return generateCanonicalPlanet(input);
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
