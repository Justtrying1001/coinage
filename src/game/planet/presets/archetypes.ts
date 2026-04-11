import type { PlanetArchetype, PlanetVisualProfile } from '@/game/render/types';
import type {
  GradientStop,
  NoiseFilterConfig,
  PlanetArchetypePreset,
  PlanetGenerationConfig,
  PlanetMaterialResponse,
} from '@/game/planet/types';
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

const response = (cfg: Partial<PlanetMaterialResponse>): PlanetMaterialResponse => ({
  baseRoughness: 0.6,
  baseMetalness: 0.08,
  waterRoughness: 0.12,
  waterMetalness: 0.02,
  iceBoost: 0,
  wetBoost: 0.08,
  ridgeBoost: 0.15,
  basinBoost: 0.1,
  lavaBoost: 0,
  specularStrength: 0.2,
  ...cfg,
});

const BASE_PRESETS: Record<PlanetArchetype, PlanetArchetypePreset> = {
  oceanic: {
    generation: {
      resolution: 96,
      filters: [
        simple({ strength: 0.2, roughness: 2.1, baseRoughness: 1.05, persistence: 0.5, minValue: 1.03 }),
        ridgid({ strength: 0.05, roughness: 2.35, minValue: 1.76, layerCount: 4, center: [12, 3, 27] }),
      ],
    },
    surface: {
      elevationGradient: [s(0, [0.12, 0.52, 0.24]), s(0.65, [0.52, 0.6, 0.3]), s(1, [0.9, 0.95, 0.98])],
      depthGradient: [s(0, [0.01, 0.06, 0.24]), s(1, [0.12, 0.4, 0.76])],
      blendDepth: 0.014,
      roughness: 0.42,
      metalness: 0.06,
      palette: {
        waterDeep: [0.02, 0.09, 0.28], waterShallow: [0.12, 0.45, 0.78], humidLow: [0.08, 0.48, 0.22], dryLow: [0.42, 0.56, 0.34],
        temperateHigh: [0.52, 0.56, 0.42], rocky: [0.46, 0.5, 0.52], peak: [0.9, 0.95, 0.98], special: [0.35, 0.68, 0.62],
      },
      climate: { moistureScale: 1.5, moistureWarp: 0.22, moistureBias: 0.2, temperatureBias: 0.08, temperatureNoiseScale: 1.2, latitudeInfluence: 0.45, ridgeScale: 5.2, basinScale: 2.2 },
      response: response({ baseRoughness: 0.52, waterRoughness: 0.06, wetBoost: 0.16, basinBoost: 0.16, specularStrength: 0.34 }),
    },
    postfx: { bloom: { strength: 0.012, radius: 0.1, threshold: 0.84 }, exposure: 1.08, contrast: 1.08, saturation: 1.06 },
  },
  terrestrial: {
    generation: {
      resolution: 96,
      filters: [
        simple({ strength: 0.21, roughness: 2.3, baseRoughness: 1.05, minValue: 1.08 }),
        ridgid({ strength: 0.08, roughness: 2.5, baseRoughness: 0.95, minValue: 1.85, layerCount: 4, center: [8, 11, 3] }),
      ],
    },
    surface: {
      elevationGradient: [s(0, [0.38, 0.6, 0.22]), s(0.46, [0.22, 0.68, 0.18]), s(0.82, [0.56, 0.42, 0.24]), s(1, [0.95, 0.96, 0.94])],
      depthGradient: [s(0, [0.0, 0.06, 0.33]), s(1, [0.16, 0.5, 0.84])],
      blendDepth: 0.012,
      roughness: 0.52,
      metalness: 0.04,
      palette: {
        waterDeep: [0.01, 0.08, 0.34], waterShallow: [0.14, 0.52, 0.86], humidLow: [0.12, 0.52, 0.2], dryLow: [0.45, 0.44, 0.22],
        temperateHigh: [0.4, 0.44, 0.32], rocky: [0.56, 0.48, 0.38], peak: [0.93, 0.94, 0.92], special: [0.5, 0.56, 0.45],
      },
      climate: { moistureScale: 1.9, moistureWarp: 0.18, moistureBias: 0.04, temperatureBias: 0.03, temperatureNoiseScale: 1.6, latitudeInfluence: 0.56, ridgeScale: 6.2, basinScale: 2.6 },
      response: response({ baseRoughness: 0.58, wetBoost: 0.14, ridgeBoost: 0.18, specularStrength: 0.22 }),
    },
    postfx: { bloom: { strength: 0.008, radius: 0.08, threshold: 0.9 }, exposure: 1.05, contrast: 1.08, saturation: 1.03 },
  },
  arid: {
    generation: {
      resolution: 96,
      filters: [
        simple({ strength: 0.2, roughness: 2.5, baseRoughness: 1.15, persistence: 0.52, minValue: 1.1, layerCount: 9 }),
        ridgid({ strength: 0.12, roughness: 2.55, baseRoughness: 1.2, persistence: 0.56, minValue: 1.78, layerCount: 5, center: [5, 18, 6] }),
      ],
    },
    surface: {
      elevationGradient: [s(0, [0.62, 0.46, 0.23]), s(0.5, [0.75, 0.6, 0.3]), s(0.86, [0.64, 0.5, 0.33]), s(1, [0.95, 0.88, 0.7])],
      depthGradient: [s(0, [0.08, 0.08, 0.14]), s(1, [0.2, 0.14, 0.18])],
      blendDepth: 0.008,
      roughness: 0.74,
      metalness: 0.03,
      palette: {
        waterDeep: [0.05, 0.09, 0.18], waterShallow: [0.16, 0.22, 0.3], humidLow: [0.45, 0.45, 0.24], dryLow: [0.7, 0.54, 0.28],
        temperateHigh: [0.72, 0.6, 0.38], rocky: [0.58, 0.44, 0.3], peak: [0.92, 0.84, 0.66], special: [0.84, 0.58, 0.38],
      },
      climate: { moistureScale: 1.6, moistureWarp: 0.16, moistureBias: -0.26, temperatureBias: 0.22, temperatureNoiseScale: 1.3, latitudeInfluence: 0.26, ridgeScale: 7.2, basinScale: 3.3 },
      response: response({ baseRoughness: 0.78, waterRoughness: 0.2, wetBoost: 0.04, ridgeBoost: 0.24, specularStrength: 0.14 }),
    },
    postfx: { bloom: { strength: 0, radius: 0, threshold: 1 }, exposure: 1.02, contrast: 1.1, saturation: 0.98 },
  },
  frozen: {
    generation: {
      resolution: 96,
      filters: [
        simple({ strength: 0.15, roughness: 2.0, baseRoughness: 0.9, persistence: 0.48, minValue: 1.0 }),
        ridgid({ strength: 0.07, roughness: 2.2, baseRoughness: 1.0, minValue: 1.82, layerCount: 4, center: [17, 2, 9] }),
      ],
    },
    surface: {
      elevationGradient: [s(0, [0.66, 0.78, 0.86]), s(0.65, [0.82, 0.88, 0.93]), s(1, [0.97, 0.98, 1])],
      depthGradient: [s(0, [0.02, 0.14, 0.3]), s(1, [0.18, 0.46, 0.7])],
      blendDepth: 0.01,
      roughness: 0.42,
      metalness: 0.08,
      palette: {
        waterDeep: [0.01, 0.12, 0.32], waterShallow: [0.24, 0.58, 0.78], humidLow: [0.58, 0.7, 0.76], dryLow: [0.7, 0.8, 0.86],
        temperateHigh: [0.84, 0.89, 0.93], rocky: [0.66, 0.72, 0.78], peak: [0.97, 0.98, 1], special: [0.72, 0.82, 0.92],
      },
      climate: { moistureScale: 1.3, moistureWarp: 0.14, moistureBias: 0.02, temperatureBias: -0.22, temperatureNoiseScale: 1.1, latitudeInfluence: 0.8, ridgeScale: 5.6, basinScale: 2.8 },
      response: response({ baseRoughness: 0.5, waterRoughness: 0.08, waterMetalness: 0.03, iceBoost: 0.26, wetBoost: 0.12, specularStrength: 0.3 }),
    },
    postfx: { bloom: { strength: 0.01, radius: 0.09, threshold: 0.86 }, exposure: 1.03, contrast: 1.05, saturation: 0.94 },
  },
  volcanic: {
    generation: {
      resolution: 96,
      filters: [
        simple({ strength: 0.21, roughness: 2.35, baseRoughness: 1.05, persistence: 0.52, minValue: 1.08 }),
        ridgid({ strength: 0.19, roughness: 2.8, baseRoughness: 1.4, persistence: 0.55, minValue: 1.55, layerCount: 5, center: [14, 14, 1] }),
      ],
    },
    surface: {
      elevationGradient: [s(0, [0.19, 0.12, 0.11]), s(0.45, [0.34, 0.21, 0.18]), s(0.83, [0.58, 0.3, 0.22]), s(1, [0.92, 0.52, 0.24])],
      depthGradient: [s(0, [0.03, 0.02, 0.05]), s(1, [0.12, 0.06, 0.08])],
      blendDepth: 0.005,
      roughness: 0.66,
      metalness: 0.13,
      palette: {
        waterDeep: [0.04, 0.03, 0.06], waterShallow: [0.11, 0.07, 0.08], humidLow: [0.24, 0.16, 0.13], dryLow: [0.4, 0.24, 0.18],
        temperateHigh: [0.46, 0.28, 0.2], rocky: [0.28, 0.18, 0.16], peak: [0.7, 0.42, 0.24], special: [0.98, 0.45, 0.16],
      },
      climate: { moistureScale: 1.9, moistureWarp: 0.26, moistureBias: -0.34, temperatureBias: 0.28, temperatureNoiseScale: 2, latitudeInfluence: 0.12, ridgeScale: 8.2, basinScale: 3.8 },
      response: response({ baseRoughness: 0.72, baseMetalness: 0.14, waterRoughness: 0.32, ridgeBoost: 0.26, lavaBoost: 0.4, specularStrength: 0.26 }),
    },
    postfx: { bloom: { strength: 0.014, radius: 0.12, threshold: 0.82 }, exposure: 1.08, contrast: 1.12, saturation: 1.04 },
  },
  mineral: {
    generation: {
      resolution: 96,
      filters: [
        simple({ strength: 0.19, roughness: 2.4, baseRoughness: 1.0, persistence: 0.5, minValue: 1.07 }),
        ridgid({ strength: 0.11, roughness: 2.45, baseRoughness: 1.1, persistence: 0.54, minValue: 1.75, layerCount: 4, center: [9, 20, 5] }),
      ],
    },
    surface: {
      elevationGradient: [s(0, [0.42, 0.45, 0.42]), s(0.62, [0.56, 0.54, 0.5]), s(1, [0.86, 0.86, 0.82])],
      depthGradient: [s(0, [0.08, 0.1, 0.16]), s(1, [0.2, 0.24, 0.33])],
      blendDepth: 0.009,
      roughness: 0.48,
      metalness: 0.24,
      palette: {
        waterDeep: [0.07, 0.11, 0.18], waterShallow: [0.24, 0.3, 0.4], humidLow: [0.4, 0.44, 0.4], dryLow: [0.52, 0.48, 0.4],
        temperateHigh: [0.6, 0.56, 0.48], rocky: [0.46, 0.42, 0.38], peak: [0.88, 0.86, 0.8], special: [0.7, 0.62, 0.48],
      },
      climate: { moistureScale: 1.7, moistureWarp: 0.2, moistureBias: -0.12, temperatureBias: 0.02, temperatureNoiseScale: 1.5, latitudeInfluence: 0.35, ridgeScale: 6.6, basinScale: 2.7 },
      response: response({ baseRoughness: 0.53, baseMetalness: 0.24, waterRoughness: 0.2, waterMetalness: 0.08, ridgeBoost: 0.22, specularStrength: 0.3 }),
    },
    postfx: { bloom: { strength: 0.006, radius: 0.08, threshold: 0.88 }, exposure: 1.04, contrast: 1.1, saturation: 0.96 },
  },
  barren: {
    generation: {
      resolution: 96,
      filters: [
        simple({ strength: 0.21, roughness: 2.45, baseRoughness: 1.12, persistence: 0.52, minValue: 1.1, layerCount: 9 }),
        ridgid({ strength: 0.14, roughness: 2.6, baseRoughness: 1.3, persistence: 0.56, minValue: 1.72, layerCount: 5, center: [4, 3, 18] }),
      ],
    },
    surface: {
      elevationGradient: [s(0, [0.36, 0.32, 0.28]), s(0.68, [0.5, 0.44, 0.36]), s(1, [0.72, 0.64, 0.54])],
      depthGradient: [s(0, [0.06, 0.06, 0.07]), s(1, [0.16, 0.14, 0.13])],
      blendDepth: 0.006,
      roughness: 0.7,
      metalness: 0.07,
      palette: {
        waterDeep: [0.05, 0.06, 0.08], waterShallow: [0.16, 0.14, 0.13], humidLow: [0.34, 0.32, 0.3], dryLow: [0.48, 0.4, 0.32],
        temperateHigh: [0.54, 0.46, 0.38], rocky: [0.42, 0.36, 0.32], peak: [0.72, 0.64, 0.54], special: [0.82, 0.56, 0.38],
      },
      climate: { moistureScale: 1.8, moistureWarp: 0.22, moistureBias: -0.28, temperatureBias: 0.1, temperatureNoiseScale: 1.6, latitudeInfluence: 0.22, ridgeScale: 7.8, basinScale: 3.4 },
      response: response({ baseRoughness: 0.74, waterRoughness: 0.3, wetBoost: 0.03, ridgeBoost: 0.2, basinBoost: 0.2, specularStrength: 0.12 }),
    },
    postfx: { bloom: { strength: 0, radius: 0, threshold: 1 }, exposure: 1.0, contrast: 1.13, saturation: 0.94 },
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function createPlanetGenerationConfig(seed: number, profile: PlanetVisualProfile): PlanetGenerationConfig {
  const preset = BASE_PRESETS[profile.archetype];
  const rng = new SeededRng(seed ^ 0x7f4a7c15);

  const filters = preset.generation.filters.map((filter, index) => ({
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
    resolution: preset.generation.resolution,
    radius: 1,
    filters,
    elevationGradient: preset.surface.elevationGradient,
    depthGradient: preset.surface.depthGradient,
    blendDepth: preset.surface.blendDepth,
    material: {
      roughness: clamp(preset.surface.roughness + profile.roughness * 0.22, 0.1, 0.95),
      metalness: clamp(preset.surface.metalness + profile.metalness * 0.7, 0.01, 0.55),
      palette: preset.surface.palette,
      climate: {
        moistureScale: preset.surface.climate.moistureScale + profile.continentScale * 0.2,
        moistureWarp: clamp(preset.surface.climate.moistureWarp + profile.macroBias * 0.2, 0.08, 0.35),
        moistureBias: clamp(preset.surface.climate.moistureBias + (profile.humidityStrength - 0.3) * 0.6, -0.4, 0.35),
        temperatureBias: clamp(preset.surface.climate.temperatureBias + (profile.lightIntensity - 1.2) * 0.24, -0.35, 0.35),
        temperatureNoiseScale: clamp(preset.surface.climate.temperatureNoiseScale + profile.hueDrift * 0.01, 0.8, 2.4),
        latitudeInfluence: clamp(preset.surface.climate.latitudeInfluence + profile.polarWeight * 0.4, 0.08, 0.9),
        ridgeScale: clamp(preset.surface.climate.ridgeScale + profile.ridgeScale * 0.16, 4.2, 11.8),
        basinScale: clamp(preset.surface.climate.basinScale + profile.craterScale * 0.08, 1.8, 4.8),
      },
      response: {
        ...preset.surface.response,
        baseRoughness: clamp(preset.surface.response.baseRoughness + profile.roughness * 0.12, 0.18, 0.9),
        baseMetalness: clamp(preset.surface.response.baseMetalness + profile.metalness * 0.5, 0.01, 0.5),
        lavaBoost: clamp(preset.surface.response.lavaBoost + profile.emissiveIntensity * 1.8, 0, 0.55),
      },
    },
    postfx: {
      bloom: preset.postfx.bloom,
      exposure: clamp(preset.postfx.exposure + (profile.lightIntensity - 1) * 0.15, 0.94, 1.2),
      contrast: clamp(preset.postfx.contrast + profile.reliefSharpness * 0.02, 1.0, 1.18),
      saturation: clamp(preset.postfx.saturation + (profile.landSaturation - 42) * 0.0015, 0.9, 1.14),
    },
  };
}
