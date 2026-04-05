import { generateGalaxyLayout } from './generate-galaxy-layout';
import { generatePlanetVisualProfile } from './generate-planet-visual-profile';
import type { PlanetVisualProfile } from './planet-visual.types';
import { GALAXY_LAYOUT_RUNTIME_CONFIG } from './world.constants';

export interface GalaxyPlanetManifestItem {
  id: string;
  planetSeed: string;
  x: number;
  y: number;
  radius: number;
  profile: PlanetVisualProfile;
}

export function buildGalaxyPlanetManifest(worldSeed: string): GalaxyPlanetManifestItem[] {
  const planetCount = GALAXY_LAYOUT_RUNTIME_CONFIG.planetCount ?? 0;
  const profiles = Array.from({ length: planetCount }, (_, index) =>
    generatePlanetVisualProfile({ worldSeed, planetSeed: `planet-${index}` }),
  );
  const estimatedRadii = profiles.map((profile) => profile.shape.radius * 0.96);
  const layout = generateGalaxyLayout(worldSeed, {
    ...GALAXY_LAYOUT_RUNTIME_CONFIG,
    planetRadii: estimatedRadii,
  });

  return layout.map((planet, index) => ({
    id: planet.id,
    planetSeed: planet.planetSeed,
    x: planet.x,
    y: planet.y,
    radius: estimatedRadii[index] ?? 1,
    profile: profiles[index]!,
  }));
}
