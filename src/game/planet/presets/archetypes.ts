import type { PlanetArchetype, PlanetVisualProfile } from '@/game/render/types';
import type { GradientStop, NoiseFilterConfig, PlanetArchetypePreset, PlanetGenerationConfig } from '@/game/planet/types';
import { SeededRng } from '@/game/world/rng';

const s = (anchor: number, color: [number, number, number]): GradientStop => ({ anchor, color });
const simple = (config: Partial<NoiseFilterConfig>): NoiseFilterConfig => ({
  kind: 'simple',
  enabled: true,
  strength: 0.2,
  roughness: 2.4,
  baseRoughness: 1,
  persistence: 0.5,
  minValue: 1.1,
  layerCount: 8,
  useFirstLayerAsMask: false,
  center: [0, 0, 0],
  ...config,
});
const ridgid = (config: Partial<NoiseFilterConfig>): NoiseFilterConfig => ({
  ...simple(config),
  kind: 'ridgid',
  useFirstLayerAsMask: true,
});

const BASE_PLANET_RESOLUTION = 128;
const HIGH_DETAIL_PLANET_RESOLUTION = 144;

const BASE_PRESETS: Record<PlanetArchetype, PlanetArchetypePreset> = {
  oceanic: {
    generation: {
      resolution: BASE_PLANET_RESOLUTION,
      filters: [
        simple({ strength: 0.23, roughness: 2.2, baseRoughness: 1.1, persistence: 0.48, minValue: 1.05 }),
        ridgid({ strength: 0.08, roughness: 2.4, minValue: 1.7, layerCount: 4, center: [12, 3, 27] }),
      ],
    },
    surface: {
      elevationGradient: [s(0, [0.16, 0.42, 0.18]), s(0.4, [0.22, 0.54, 0.23]), s(0.76, [0.48, 0.48, 0.34]), s(1, [0.88, 0.9, 0.92])],
      depthGradient: [s(0, [0.01, 0.06, 0.28]), s(0.58, [0.04, 0.2, 0.56]), s(1, [0.12, 0.42, 0.84])],
      blendDepth: 0.01,
      roughness: 0.42,
      metalness: 0.08,
      vegetationDensity: 0.45,
      wetness: 0.88,
    },
    postfx: { bloom: { strength: 0.014, radius: 0.08, threshold: 0.82 }, exposure: 1.14 },
  },
  terrestrial: {
    generation: {
      resolution: BASE_PLANET_RESOLUTION,
      filters: [
        simple({ strength: 0.21, roughness: 2.3, baseRoughness: 1.05, minValue: 1.08 }),
        ridgid({ strength: 0.09, roughness: 2.5, baseRoughness: 0.95, minValue: 1.85, layerCount: 4, center: [8, 11, 3] }),
      ],
    },
    surface: {
      elevationGradient: [s(0, [0.3, 0.56, 0.2]), s(0.3, [0.2, 0.64, 0.18]), s(0.74, [0.54, 0.4, 0.24]), s(1, [0.93, 0.93, 0.9])],
      depthGradient: [s(0, [0, 0, 0.5]), s(1, [0.2, 0.6, 1])],
      blendDepth: 0.01,
      roughness: 0.5,
      metalness: 0.05,
      vegetationDensity: 0.52,
      wetness: 0.62,
    },
    postfx: { bloom: { strength: 0.012, radius: 0.08, threshold: 0.82 }, exposure: 1.12 },
  },
  arid: {
    generation: {
      resolution: BASE_PLANET_RESOLUTION,
      filters: [
        simple({ strength: 0.19, roughness: 2.5, baseRoughness: 1.15, persistence: 0.52, minValue: 1.1, layerCount: 9 }),
        ridgid({ strength: 0.14, roughness: 2.55, baseRoughness: 1.2, persistence: 0.56, minValue: 1.78, layerCount: 5, center: [5, 18, 6] }),
      ],
    },
    surface: {
      elevationGradient: [s(0, [0.48, 0.37, 0.21]), s(0.34, [0.64, 0.5, 0.27]), s(0.7, [0.72, 0.58, 0.34]), s(0.9, [0.58, 0.45, 0.3]), s(1, [0.86, 0.79, 0.64])],
      depthGradient: [s(0, [0.08, 0.07, 0.06]), s(1, [0.19, 0.14, 0.09])],
      blendDepth: 0.008,
      roughness: 0.72,
      metalness: 0.04,
      vegetationDensity: 0.08,
      wetness: 0.12,
    },
    postfx: { bloom: { strength: 0.008, radius: 0.06, threshold: 0.84 }, exposure: 1.08 },
  },
  frozen: {
    generation: {
      resolution: BASE_PLANET_RESOLUTION,
      filters: [
        simple({ strength: 0.15, roughness: 2.0, baseRoughness: 0.9, persistence: 0.48, minValue: 1.0 }),
        ridgid({ strength: 0.06, roughness: 2.2, baseRoughness: 1.0, minValue: 1.82, layerCount: 4, center: [17, 2, 9] }),
      ],
    },
    surface: {
      elevationGradient: [s(0, [0.42, 0.55, 0.66]), s(0.48, [0.62, 0.76, 0.84]), s(0.84, [0.8, 0.89, 0.94]), s(1, [0.95, 0.98, 1])],
      depthGradient: [s(0, [0.01, 0.1, 0.24]), s(0.6, [0.07, 0.24, 0.42]), s(1, [0.14, 0.32, 0.5])],
      blendDepth: 0.01,
      roughness: 0.38,
      metalness: 0.12,
      vegetationDensity: 0.06,
      wetness: 0.36,
    },
    postfx: { bloom: { strength: 0.012, radius: 0.08, threshold: 0.8 }, exposure: 1.18 },
  },
  volcanic: {
    generation: {
      resolution: BASE_PLANET_RESOLUTION,
      filters: [
        simple({ strength: 0.2, roughness: 2.35, baseRoughness: 1.05, persistence: 0.52, minValue: 1.08 }),
        ridgid({ strength: 0.18, roughness: 2.8, baseRoughness: 1.4, persistence: 0.55, minValue: 1.55, layerCount: 5, center: [14, 14, 1] }),
      ],
    },
    surface: {
      elevationGradient: [s(0, [0.05, 0.05, 0.06]), s(0.3, [0.12, 0.11, 0.12]), s(0.58, [0.24, 0.14, 0.08]), s(0.8, [0.48, 0.18, 0.05]), s(0.92, [0.76, 0.26, 0.04]), s(1, [0.95, 0.62, 0.1])],
      depthGradient: [s(0, [0.01, 0.01, 0.02]), s(0.62, [0.07, 0.03, 0.02]), s(1, [0.16, 0.06, 0.02])],
      blendDepth: 0.006,
      roughness: 0.74,
      metalness: 0.14,
      vegetationDensity: 0.04,
      wetness: 0.04,
    },
    postfx: { bloom: { strength: 0.014, radius: 0.08, threshold: 0.8 }, exposure: 1.14 },
  },
  mineral: {
    generation: {
      resolution: BASE_PLANET_RESOLUTION,
      filters: [
        simple({ strength: 0.2, roughness: 2.4, baseRoughness: 1.0, persistence: 0.5, minValue: 1.07 }),
        ridgid({ strength: 0.1, roughness: 2.45, baseRoughness: 1.1, persistence: 0.54, minValue: 1.75, layerCount: 4, center: [9, 20, 5] }),
      ],
    },
    surface: {
      elevationGradient: [s(0, [0.36, 0.33, 0.28]), s(0.34, [0.52, 0.42, 0.3]), s(0.68, [0.62, 0.46, 0.28]), s(0.9, [0.54, 0.5, 0.44]), s(1, [0.79, 0.74, 0.67])],
      depthGradient: [s(0, [0.06, 0.08, 0.12]), s(1, [0.16, 0.2, 0.26])],
      blendDepth: 0.01,
      roughness: 0.46,
      metalness: 0.28,
      vegetationDensity: 0.1,
      wetness: 0.18,
    },
    postfx: { bloom: { strength: 0.01, radius: 0.06, threshold: 0.84 }, exposure: 1.1 },
  },
  barren: {
    generation: {
      resolution: BASE_PLANET_RESOLUTION,
      filters: [
        simple({ strength: 0.2, roughness: 2.45, baseRoughness: 1.12, persistence: 0.52, minValue: 1.1, layerCount: 9 }),
        ridgid({ strength: 0.12, roughness: 2.6, baseRoughness: 1.3, persistence: 0.56, minValue: 1.72, layerCount: 5, center: [4, 3, 18] }),
      ],
    },
    surface: {
      elevationGradient: [s(0, [0.35, 0.29, 0.25]), s(0.64, [0.5, 0.42, 0.34]), s(1, [0.72, 0.65, 0.56])],
      depthGradient: [s(0, [0.08, 0.08, 0.08]), s(1, [0.2, 0.18, 0.16])],
      blendDepth: 0.006,
      roughness: 0.68,
      metalness: 0.08,
      vegetationDensity: 0.02,
      wetness: 0.05,
    },
    postfx: { bloom: { strength: 0.006, radius: 0.05, threshold: 0.86 }, exposure: 1.06 },
  },
  jungle: {
    generation: {
      resolution: BASE_PLANET_RESOLUTION,
      filters: [
        simple({ strength: 0.16, roughness: 2.05, baseRoughness: 0.95, persistence: 0.48, minValue: 1.02 }),
        ridgid({ strength: 0.06, roughness: 2.28, baseRoughness: 0.96, persistence: 0.5, minValue: 1.86, layerCount: 3, center: [7, 15, 12] }),
      ],
    },
    surface: {
      elevationGradient: [s(0, [0.06, 0.29, 0.11]), s(0.24, [0.08, 0.38, 0.13]), s(0.56, [0.12, 0.49, 0.15]), s(0.76, [0.22, 0.43, 0.16]), s(0.9, [0.36, 0.39, 0.2]), s(1, [0.66, 0.68, 0.52])],
      depthGradient: [s(0, [0.01, 0.09, 0.17]), s(0.55, [0.03, 0.2, 0.3]), s(1, [0.08, 0.28, 0.4])],
      blendDepth: 0.016,
      roughness: 0.58,
      metalness: 0.04,
      vegetationDensity: 0.97,
      wetness: 0.92,
    },
    postfx: { bloom: { strength: 0.008, radius: 0.06, threshold: 0.88 }, exposure: 1.08 },
  },
};

function resolvePlanetResolution(profile: PlanetVisualProfile) {
  if (profile.reliefSharpness > 1.45 || profile.reliefStrength > 0.16) {
    return HIGH_DETAIL_PLANET_RESOLUTION;
  }
  return BASE_PLANET_RESOLUTION;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function createPlanetGenerationConfig(seed: number, profile: PlanetVisualProfile): PlanetGenerationConfig {
  const preset = BASE_PRESETS[profile.archetype];
  const rng = new SeededRng(seed ^ 0x7f4a7c15);
  const wetness = clamp(profile.humidityStrength * 0.7 + profile.oceanLevel * 0.3, 0, 1);
  const dryness = 1 - wetness;

  const filters = preset.generation.filters.map((filter, index) => ({
    ...filter,
    strength: clamp(filter.strength + rng.range(-0.02, 0.02) + profile.reliefStrength * 0.08, 0.04, 0.35),
    roughness: clamp(filter.roughness + rng.range(-0.2, 0.2) + dryness * 0.06 - wetness * 0.04, 1.6, 3.2),
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
    resolution: resolvePlanetResolution(profile),
    radius: 1,
    filters,
    elevationGradient: preset.surface.elevationGradient,
    depthGradient: preset.surface.depthGradient,
    blendDepth: preset.surface.blendDepth,
    material: {
      roughness: clamp(preset.surface.roughness + profile.roughness * 0.2 + wetness * 0.06 - dryness * 0.04, 0.1, 0.95),
      metalness: clamp(preset.surface.metalness + profile.metalness * 0.7, 0.02, 0.55),
      vegetationDensity: clamp(preset.surface.vegetationDensity + profile.humidityStrength * 0.28 - profile.craterWeight * 0.12, 0, 1),
      wetness: clamp(preset.surface.wetness + profile.oceanLevel * 0.22 + profile.humidityStrength * 0.18, 0, 1),
    },
    postfx: {
      bloom: preset.postfx.bloom,
      exposure: clamp(preset.postfx.exposure + (profile.lightIntensity - 1) * 0.18, 0.92, 1.26),
    },
  };
}
