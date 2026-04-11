import type { PlanetVisualProfile } from '@/game/render/types';
import type { PlanetGenerationConfig } from '@/game/planet/types';
import { SeededRng } from '@/game/world/rng';
import { PLANET_ARCHETYPE_RULES, buildArchetypeSurfaceGradients, deriveDefinitionSignals } from '@/game/planet/presets/archetypeRules';

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function createPlanetGenerationConfig(seed: number, profile: PlanetVisualProfile): PlanetGenerationConfig {
  const definition = PLANET_ARCHETYPE_RULES[profile.archetype];
  const rng = new SeededRng(seed ^ 0x7f4a7c15);
  const gradients = buildArchetypeSurfaceGradients(definition);
  const signals = deriveDefinitionSignals(definition, profile);

  const filters = definition.terrain.filters.map((filter, index) => ({
    ...filter,
    strength: clamp(filter.strength + rng.range(-0.02, 0.02) + profile.reliefStrength * 0.08, 0.04, 0.35),
    roughness: clamp(filter.roughness + rng.range(-0.2, 0.2), 1.6, 3.2),
    minValue: clamp(filter.minValue + rng.range(-0.12, 0.12), 0.8, 2.1),
    center: [
      filter.center[0] + Math.floor(rng.range(-8, 8)),
      filter.center[1] + Math.floor(rng.range(-8, 8)),
      filter.center[2] + Math.floor(rng.range(-8, 8)),
    ] as [number, number, number],
    layerCount: index === 0 ? filter.layerCount : clamp(Math.round(filter.layerCount + profile.craterWeight * 3), 2, 7),
  }));

  return {
    seed,
    archetype: profile.archetype,
    resolution: definition.terrain.resolution,
    radius: 1,
    filters,
    elevationGradient: gradients.elevationGradient,
    depthGradient: gradients.depthGradient,
    blendDepth: signals.shoreline,
    material: {
      roughness: clamp(profile.roughness, 0.1, 0.95),
      metalness: clamp(profile.metalness, 0.02, 0.55),
      vegetatedRoughness: clamp(signals.vegetatedRoughness + profile.roughness * 0.08, 0.15, 0.95),
      rockRoughness: clamp(signals.rockRoughness + profile.roughness * 0.05, 0.2, 0.95),
      peakRoughness: clamp(signals.peakRoughness + profile.roughness * 0.04, 0.1, 0.92),
      waterRoughness: clamp(signals.waterRoughness, 0.06, 0.45),
      vegetatedMetalness: clamp(signals.vegetatedMetalness + profile.metalness * 0.15, 0.01, 0.35),
      rockMetalness: clamp(signals.rockMetalness + profile.metalness * 0.35, 0.01, 0.48),
      peakMetalness: clamp(signals.peakMetalness + profile.metalness * 0.25, 0.01, 0.5),
      waterMetalness: clamp(signals.waterMetalness, 0.01, 0.18),
    },
    surfaceSignals: {
      seaLevel: 1,
      shoreline: signals.shoreline,
      moisture: signals.moisture,
      temperature: signals.temperature,
      biomeBlend: signals.biomeBlend,
      slopeRock: signals.slopeRock,
      peakStart: signals.peakStart,
      humidityNoise: signals.humidityNoise,
      activityBias: signals.activityBias,
      wetnessBoost: signals.wetnessBoost,
      specularBias: signals.specularBias,
      accentColor: signals.accentColor,
    },
    postfx: {
      bloom: definition.postfx.bloom,
      exposure: clamp(definition.postfx.exposure + (profile.lightIntensity - 1) * 0.18, 0.92, 1.26),
    },
  };
}
