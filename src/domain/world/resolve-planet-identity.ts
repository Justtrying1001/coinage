import type { CanonicalPlanet } from './planet-visual.types';
import { getGalaxyPlanetManifest } from './build-galaxy-planet-manifest';

export interface ResolvedPlanetIdentity {
  planetId: string;
  planetSeed: string;
  planet: CanonicalPlanet;
}

export function resolvePlanetIdentity(worldSeed: string, planetId: string): ResolvedPlanetIdentity | null {
  const matchedPlanet = getGalaxyPlanetManifest(worldSeed).find((planet) => planet.id === planetId);

  if (!matchedPlanet) {
    return null;
  }

  return {
    planetId: matchedPlanet.id,
    planetSeed: matchedPlanet.planetSeed,
    planet: matchedPlanet.planet,
  };
}
