import type { PlanetVisualProfile } from './planet-visual.types';
import { buildGalaxyPlanetManifest } from './build-galaxy-planet-manifest';

export interface ResolvedPlanetIdentity {
  planetId: string;
  planetSeed: string;
  profile: PlanetVisualProfile;
}

export function resolvePlanetIdentity(worldSeed: string, planetId: string): ResolvedPlanetIdentity | null {
  const matchedPlanet = buildGalaxyPlanetManifest(worldSeed).find((planet) => planet.id === planetId);

  if (!matchedPlanet) {
    return null;
  }

  return {
    planetId: matchedPlanet.id,
    planetSeed: matchedPlanet.planetSeed,
    profile: matchedPlanet.profile,
  };
}
