import { createPlanetGenerationConfig } from '@/game/planet/presets/archetypes';
import { planetProfileFromSeed } from '@/game/world/galaxyGenerator';
import { recipeForArchetype } from '@/game/city/terrain/biome/CityBiomeRecipeRegistry';
import type { CityTerrainContext } from '@/game/city/terrain/types';

export function buildCityTerrainContext(seed: number): CityTerrainContext {
  const profile = planetProfileFromSeed(seed);
  const config = createPlanetGenerationConfig(seed, profile);
  const recipe = recipeForArchetype(profile.archetype);

  return {
    seed,
    profile,
    config,
    recipe: {
      ...recipe,
      macroAmplitude: recipe.macroAmplitude * (0.9 + profile.reliefStrength * 1.2),
      mesoAmplitude: recipe.mesoAmplitude * (0.92 + profile.ridgeWeight * 0.6),
      microAmplitude: recipe.microAmplitude * (0.85 + profile.roughness * 0.4),
    },
  };
}
