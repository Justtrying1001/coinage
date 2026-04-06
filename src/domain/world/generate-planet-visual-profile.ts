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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function pickFamily(rng: () => number): PlanetFamily {
  const roll = rng();
  if (roll < 0.16) return 'oceanic';
  if (roll < 0.3) return 'icy';
  if (roll < 0.45) return 'volcanic';
  if (roll < 0.62) return 'barren';
  if (roll < 0.77) return 'toxic';
  if (roll < 0.9) return 'gas-dwarf';
  return 'terrestrial';
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

function toColor(rng: () => number, base: [number, number, number], variance: number): [number, number, number] {
  return base.map((channel) => clamp(channel + (rng() - 0.5) * variance, 0, 1)) as [number, number, number];
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
    lightingBoost: isGalaxy ? 1 : 1.18,
  };
}

export function generateCanonicalPlanet(input: PlanetSeedInput): CanonicalPlanet {
  const worldSeed = input.worldSeed.trim();
  const planetSeed = input.planetSeed.trim();
  const canonicalSeed = deriveSeed(`${worldSeed}::${planetSeed}`, 'planet-canonical');
  const rng = createSeededRng(canonicalSeed);

  const family = pickFamily(rng);
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

  const visualDNA: PlanetVisualDNA = {
    paletteId: `${family}-${Math.floor(rng() * 5)}`,
    baseColor: toColor(rng, family === 'icy' ? [0.68, 0.82, 0.92] : [0.43, 0.39, 0.33], 0.34),
    secondaryColor: toColor(rng, family === 'volcanic' ? [0.92, 0.33, 0.19] : [0.54, 0.49, 0.42], 0.42),
    oceanColor: toColor(rng, family === 'oceanic' ? [0.1, 0.3, 0.7] : [0.15, 0.22, 0.38], 0.22),
    cloudColor: toColor(rng, [0.93, 0.95, 0.98], 0.08),
    atmosphereTint: toColor(rng, [0.4, 0.58, 0.9], 0.28),
    oceanCoverage: classification.hasOceans ? range(rng, 0.22, 0.74) : 0,
    cloudCoverage: classification.canHaveClouds ? range(rng, 0.12, 0.82) : 0,
    atmosphereDensity: classification.atmosphereClass === 'none' ? 0 : range(rng, 0.12, 0.9),
    reliefAmplitude: range(rng, 0.08, classification.reliefClass === 'extreme' ? 0.42 : 0.24),
    roughness: classification.roughnessClass === 'coarse' ? range(rng, 0.65, 0.96) : range(rng, 0.3, 0.75),
    specularStrength: classification.hasOceans ? range(rng, 0.2, 0.7) : range(rng, 0.05, 0.28),
    emissiveIntensity: family === 'volcanic' ? range(rng, 0.08, 0.32) : range(rng, 0, 0.08),
    bandingStrength: family === 'gas-dwarf' ? range(rng, 0.34, 0.82) : range(rng, 0.02, 0.34),
    noiseSeeds: {
      surface: deriveSeed(String(canonicalSeed), 'surface'),
      clouds: deriveSeed(String(canonicalSeed), 'clouds'),
      bands: deriveSeed(String(canonicalSeed), 'bands'),
      rings: deriveSeed(String(canonicalSeed), 'rings'),
    },
    rotation: {
      surfaceSpeed: range(rng, 0.04, 0.2),
      cloudSpeed: range(rng, 0.05, 0.26),
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
      opacity: range(rng, 0.22, 0.72),
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
      opacity: clamp(visualDNA.cloudCoverage * 0.9, 0, 0.9),
      speed: visualDNA.rotation.cloudSpeed,
      noiseSeed: visualDNA.noiseSeeds.clouds,
    },
    atmosphere: {
      enabled: classification.atmosphereClass !== 'none',
      color: visualDNA.atmosphereTint,
      density: visualDNA.atmosphereDensity,
      thickness: clamp(visualDNA.atmosphereDensity * 0.15, 0, 0.14),
      rimStrength: clamp(0.2 + visualDNA.atmosphereDensity * 0.8, 0.2, 1),
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
