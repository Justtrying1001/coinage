import { generateGalaxyLayout } from './generate-galaxy-layout';
import { generateCanonicalPlanet } from './generate-planet-visual-profile';
import type { CanonicalPlanet } from './planet-visual.types';
import { GALAXY_LAYOUT_RUNTIME_CONFIG } from './world.constants';
import { PLANET_PIPELINE_VERSION, tracePlanetPipeline } from '@/rendering/planet/runtime-audit';

export interface GalaxyPlanetManifestItem {
  id: string;
  planetSeed: string;
  x: number;
  y: number;
  radius: number;
  planet: CanonicalPlanet;
}

const MANIFEST_CACHE = new Map<string, GalaxyPlanetManifestItem[]>();

export function buildGalaxyPlanetManifest(worldSeed: string): GalaxyPlanetManifestItem[] {
  const planetCount = GALAXY_LAYOUT_RUNTIME_CONFIG.planetCount ?? 0;
  const planets = Array.from({ length: planetCount }, (_, index) =>
    generateCanonicalPlanet({ worldSeed, planetSeed: `planet-${index}`, planetId: `planet-${index}` }),
  );
  const estimatedRadii = planets.map((planet) => planet.render.scale.silhouetteProtectedRadius);

  const layout = generateGalaxyLayout(worldSeed, {
    ...GALAXY_LAYOUT_RUNTIME_CONFIG,
    planetRadii: estimatedRadii,
  });

  return layout.map((entry, index) => {
    const current = planets[index]!;
    current.identity.worldPosition = { x: entry.x, y: entry.y, z: 0 };

    return {
      id: entry.id,
      planetSeed: entry.planetSeed,
      x: entry.x,
      y: entry.y,
      radius: estimatedRadii[index] ?? current.render.renderRadius,
      planet: current,
    };
  });
}

export function getGalaxyPlanetManifest(worldSeed: string): GalaxyPlanetManifestItem[] {
  const normalizedSeed = worldSeed.trim();
  const cacheKey = `${PLANET_PIPELINE_VERSION}::${normalizedSeed}`;
  const cached = MANIFEST_CACHE.get(cacheKey);
  if (cached) {
    return cached;
  }

  const manifest = buildGalaxyPlanetManifest(normalizedSeed);
  MANIFEST_CACHE.set(cacheKey, manifest);
  tracePlanetPipeline({ stage: 'manifest:build', worldSeed: normalizedSeed, cacheKey, planetCount: manifest.length });
  return manifest;
}

export function clearGalaxyPlanetManifestCache(): void {
  MANIFEST_CACHE.clear();
  tracePlanetPipeline({ stage: 'manifest:clear-cache' });
}
