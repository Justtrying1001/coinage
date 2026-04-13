import type { Mesh as MeshType } from 'three';
import { generateLocalCityTerrain } from '@/game/city/terrain/LocalTerrainGenerator';
import type { PlanetGenerationConfig } from '@/game/planet/types';
import type { PlanetVisualProfile } from '@/game/render/types';
import type { TerrainResult } from '@/game/city/terrain/types';

export interface CityPlanetTerrain {
  mesh: MeshType;
  profile: PlanetVisualProfile;
  config: PlanetGenerationConfig;
  analysis: TerrainResult;
}

export function createCityLandscapeTerrain(seed: number): CityPlanetTerrain {
  const bundle = generateLocalCityTerrain(seed);
  return {
    mesh: bundle.mesh,
    profile: bundle.profile,
    config: bundle.config,
    analysis: bundle.result,
  };
}
