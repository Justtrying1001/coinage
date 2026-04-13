import type { PlanetArchetype } from '@/game/render/types';
import type { CityBiomeRecipe } from '@/game/city/terrain/types';

const RECIPES: Record<PlanetArchetype, CityBiomeRecipe> = {
  oceanic: {
    archetype: 'oceanic', terrainSize: 420, resolution: 320,
    macroAmplitude: 30, macroFrequency: 0.9,
    mesoAmplitude: 12, mesoFrequency: 2.1,
    microAmplitude: 2.5, microFrequency: 8.8,
    reliefBias: -0.06,
    reservedZoneCenter: [0.08, -0.02], reservedZoneRadius: [0.35, 0.24],
    preferredViewAzimuth: 0.95, preferredViewPitch: 0.3, skylineLift: 16,
  },
  frozen: {
    archetype: 'frozen', terrainSize: 400, resolution: 300,
    macroAmplitude: 26, macroFrequency: 0.8,
    mesoAmplitude: 9, mesoFrequency: 2,
    microAmplitude: 1.8, microFrequency: 7,
    reliefBias: -0.08,
    reservedZoneCenter: [0.02, 0.06], reservedZoneRadius: [0.33, 0.22],
    preferredViewAzimuth: 1.2, preferredViewPitch: 0.32, skylineLift: 13,
  },
  terrestrial: {
    archetype: 'terrestrial', terrainSize: 420, resolution: 320,
    macroAmplitude: 24, macroFrequency: 0.75,
    mesoAmplitude: 10, mesoFrequency: 1.9,
    microAmplitude: 2, microFrequency: 8,
    reliefBias: -0.04,
    reservedZoneCenter: [0, -0.04], reservedZoneRadius: [0.34, 0.24],
    preferredViewAzimuth: 0.85, preferredViewPitch: 0.3, skylineLift: 12,
  },
  jungle: {
    archetype: 'jungle', terrainSize: 430, resolution: 320,
    macroAmplitude: 27, macroFrequency: 0.82,
    mesoAmplitude: 11, mesoFrequency: 2.2,
    microAmplitude: 2.1, microFrequency: 9,
    reliefBias: -0.05,
    reservedZoneCenter: [-0.04, 0], reservedZoneRadius: [0.33, 0.23],
    preferredViewAzimuth: 1.05, preferredViewPitch: 0.29, skylineLift: 14,
  },
  arid: {
    archetype: 'arid', terrainSize: 440, resolution: 320,
    macroAmplitude: 28, macroFrequency: 0.72,
    mesoAmplitude: 10, mesoFrequency: 1.8,
    microAmplitude: 2.8, microFrequency: 10,
    reliefBias: -0.03,
    reservedZoneCenter: [0.05, -0.05], reservedZoneRadius: [0.36, 0.24],
    preferredViewAzimuth: 0.72, preferredViewPitch: 0.28, skylineLift: 15,
  },
  volcanic: {
    archetype: 'volcanic', terrainSize: 420, resolution: 320,
    macroAmplitude: 33, macroFrequency: 0.86,
    mesoAmplitude: 13, mesoFrequency: 2.5,
    microAmplitude: 2.4, microFrequency: 9,
    reliefBias: -0.02,
    reservedZoneCenter: [-0.08, 0.04], reservedZoneRadius: [0.32, 0.21],
    preferredViewAzimuth: 1.3, preferredViewPitch: 0.33, skylineLift: 20,
  },
  mineral: {
    archetype: 'mineral', terrainSize: 420, resolution: 320,
    macroAmplitude: 29, macroFrequency: 0.8,
    mesoAmplitude: 11, mesoFrequency: 2.25,
    microAmplitude: 2.2, microFrequency: 9.3,
    reliefBias: -0.04,
    reservedZoneCenter: [0.02, 0.02], reservedZoneRadius: [0.34, 0.23],
    preferredViewAzimuth: 0.92, preferredViewPitch: 0.31, skylineLift: 16,
  },
  barren: {
    archetype: 'barren', terrainSize: 430, resolution: 320,
    macroAmplitude: 30, macroFrequency: 0.84,
    mesoAmplitude: 11, mesoFrequency: 2.2,
    microAmplitude: 2.5, microFrequency: 9.8,
    reliefBias: -0.03,
    reservedZoneCenter: [0, 0.03], reservedZoneRadius: [0.34, 0.23],
    preferredViewAzimuth: 1.0, preferredViewPitch: 0.3, skylineLift: 17,
  },
};

export function recipeForArchetype(archetype: PlanetArchetype): CityBiomeRecipe {
  return RECIPES[archetype];
}
