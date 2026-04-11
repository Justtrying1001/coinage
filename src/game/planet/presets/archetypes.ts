import type { PlanetArchetype, PlanetVisualProfile } from '@/game/render/types';
import type { GradientStop, NoiseFilterConfig, PlanetArchetypePreset, PlanetGenerationConfig } from '@/game/planet/types';
import { SeededRng } from '@/game/world/rng';

const s = (anchor: number, color: [number, number, number]): GradientStop => ({ anchor, color });
const hs = (anchor: number, h: number, sat: number, light: number): GradientStop => s(anchor, hslToRgb(h, sat, light));

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

const BASE_PRESETS: Record<PlanetArchetype, PlanetArchetypePreset> = {
  oceanic: {
    generation: {
      resolution: 96,
      filters: [
        simple({ strength: 0.24, roughness: 2.15, baseRoughness: 1.05, persistence: 0.47, minValue: 1.03 }),
        ridgid({ strength: 0.09, roughness: 2.32, minValue: 1.66, layerCount: 4, center: [12, 3, 27] }),
      ],
    },
    surface: {
      elevationGradient: [
        hs(0, 146, 0.34, 0.24),
        hs(0.34, 138, 0.32, 0.32),
        hs(0.62, 35, 0.24, 0.42),
        hs(0.82, 24, 0.19, 0.56),
        hs(1, 0, 0.02, 0.93),
      ],
      depthGradient: [hs(0, 224, 0.75, 0.17), hs(0.35, 212, 0.72, 0.27), hs(0.72, 198, 0.66, 0.41), hs(1, 188, 0.6, 0.53)],
      blendDepth: 0.012,
      climate: { temperatureBias: 0.42, moistureBias: 0.94, transitionSharpness: 0.5 },
      material: { roughness: 0.4, metalness: 0.05, specularStrength: 0.74, roughnessVariance: 0.2, metalnessVariance: 0.08 },
    },
    postfx: { bloom: { strength: 0.045, radius: 0.22, threshold: 0.62 }, exposure: 1.15 },
  },
  terrestrial: {
    generation: {
      resolution: 96,
      filters: [
        simple({ strength: 0.2, roughness: 2.28, baseRoughness: 1.02, minValue: 1.07 }),
        ridgid({ strength: 0.1, roughness: 2.48, baseRoughness: 0.94, minValue: 1.84, layerCount: 4, center: [8, 11, 3] }),
      ],
    },
    surface: {
      elevationGradient: [hs(0, 102, 0.42, 0.34), hs(0.28, 114, 0.49, 0.39), hs(0.56, 42, 0.32, 0.38), hs(0.83, 26, 0.22, 0.53), hs(1, 0, 0.03, 0.91)],
      depthGradient: [hs(0, 219, 0.68, 0.2), hs(0.45, 204, 0.64, 0.34), hs(1, 192, 0.56, 0.48)],
      blendDepth: 0.014,
      climate: { temperatureBias: 0.58, moistureBias: 0.56, transitionSharpness: 0.52 },
      material: { roughness: 0.52, metalness: 0.04, specularStrength: 0.43, roughnessVariance: 0.18, metalnessVariance: 0.05 },
    },
    postfx: { bloom: { strength: 0.04, radius: 0.18, threshold: 0.62 }, exposure: 1.12 },
  },
  arid: {
    generation: {
      resolution: 96,
      filters: [
        simple({ strength: 0.19, roughness: 2.52, baseRoughness: 1.17, persistence: 0.53, minValue: 1.12, layerCount: 9 }),
        ridgid({ strength: 0.16, roughness: 2.62, baseRoughness: 1.24, persistence: 0.56, minValue: 1.74, layerCount: 5, center: [5, 18, 6] }),
      ],
    },
    surface: {
      elevationGradient: [hs(0, 34, 0.49, 0.31), hs(0.34, 38, 0.56, 0.44), hs(0.7, 28, 0.44, 0.4), hs(0.9, 24, 0.32, 0.57), hs(1, 35, 0.26, 0.74)],
      depthGradient: [hs(0, 18, 0.25, 0.11), hs(0.5, 28, 0.24, 0.17), hs(1, 34, 0.22, 0.24)],
      blendDepth: 0.009,
      climate: { temperatureBias: 0.86, moistureBias: 0.12, transitionSharpness: 0.74 },
      material: { roughness: 0.78, metalness: 0.04, specularStrength: 0.19, roughnessVariance: 0.14, metalnessVariance: 0.02 },
    },
    postfx: { bloom: { strength: 0.028, radius: 0.14, threshold: 0.66 }, exposure: 1.07 },
  },
  frozen: {
    generation: {
      resolution: 96,
      filters: [
        simple({ strength: 0.16, roughness: 2.02, baseRoughness: 0.88, persistence: 0.47, minValue: 0.98 }),
        ridgid({ strength: 0.08, roughness: 2.24, baseRoughness: 0.98, minValue: 1.8, layerCount: 4, center: [17, 2, 9] }),
      ],
    },
    surface: {
      elevationGradient: [hs(0, 198, 0.24, 0.46), hs(0.35, 208, 0.2, 0.62), hs(0.7, 214, 0.16, 0.77), hs(0.9, 220, 0.12, 0.87), hs(1, 0, 0.02, 0.95)],
      depthGradient: [hs(0, 220, 0.54, 0.19), hs(0.4, 206, 0.46, 0.31), hs(0.78, 196, 0.36, 0.44), hs(1, 188, 0.28, 0.56)],
      blendDepth: 0.012,
      climate: { temperatureBias: 0.08, moistureBias: 0.42, transitionSharpness: 0.62 },
      material: { roughness: 0.34, metalness: 0.09, specularStrength: 0.81, roughnessVariance: 0.24, metalnessVariance: 0.08 },
    },
    postfx: { bloom: { strength: 0.04, radius: 0.2, threshold: 0.58 }, exposure: 1.18 },
  },
  volcanic: {
    generation: {
      resolution: 96,
      filters: [
        simple({ strength: 0.22, roughness: 2.42, baseRoughness: 1.1, persistence: 0.53, minValue: 1.06 }),
        ridgid({ strength: 0.2, roughness: 2.9, baseRoughness: 1.42, persistence: 0.58, minValue: 1.5, layerCount: 5, center: [14, 14, 1] }),
      ],
    },
    surface: {
      elevationGradient: [hs(0, 10, 0.23, 0.12), hs(0.38, 18, 0.31, 0.2), hs(0.68, 14, 0.54, 0.28), hs(0.84, 12, 0.74, 0.42), hs(1, 24, 0.78, 0.6)],
      depthGradient: [hs(0, 240, 0.16, 0.05), hs(0.6, 12, 0.28, 0.09), hs(1, 20, 0.42, 0.14)],
      blendDepth: 0.006,
      climate: { temperatureBias: 0.95, moistureBias: 0.08, transitionSharpness: 0.82 },
      material: { roughness: 0.72, metalness: 0.18, specularStrength: 0.33, roughnessVariance: 0.22, metalnessVariance: 0.14 },
    },
    postfx: { bloom: { strength: 0.06, radius: 0.25, threshold: 0.54 }, exposure: 1.16 },
  },
  mineral: {
    generation: {
      resolution: 96,
      filters: [
        simple({ strength: 0.2, roughness: 2.36, baseRoughness: 0.98, persistence: 0.5, minValue: 1.05 }),
        ridgid({ strength: 0.12, roughness: 2.52, baseRoughness: 1.16, persistence: 0.56, minValue: 1.68, layerCount: 4, center: [9, 20, 5] }),
      ],
    },
    surface: {
      elevationGradient: [hs(0, 34, 0.16, 0.29), hs(0.26, 30, 0.24, 0.39), hs(0.58, 42, 0.19, 0.47), hs(0.82, 24, 0.34, 0.56), hs(1, 38, 0.16, 0.74)],
      depthGradient: [hs(0, 214, 0.28, 0.16), hs(0.5, 202, 0.22, 0.26), hs(1, 196, 0.16, 0.36)],
      blendDepth: 0.01,
      climate: { temperatureBias: 0.52, moistureBias: 0.2, transitionSharpness: 0.66 },
      material: { roughness: 0.42, metalness: 0.34, specularStrength: 0.66, roughnessVariance: 0.18, metalnessVariance: 0.18 },
    },
    postfx: { bloom: { strength: 0.03, radius: 0.16, threshold: 0.63 }, exposure: 1.1 },
  },
  barren: {
    generation: {
      resolution: 96,
      filters: [
        simple({ strength: 0.21, roughness: 2.5, baseRoughness: 1.14, persistence: 0.52, minValue: 1.09, layerCount: 9 }),
        ridgid({ strength: 0.14, roughness: 2.66, baseRoughness: 1.34, persistence: 0.56, minValue: 1.68, layerCount: 5, center: [4, 3, 18] }),
      ],
    },
    surface: {
      elevationGradient: [hs(0, 24, 0.24, 0.24), hs(0.3, 28, 0.28, 0.32), hs(0.62, 22, 0.21, 0.38), hs(0.84, 18, 0.18, 0.49), hs(1, 22, 0.15, 0.6)],
      depthGradient: [hs(0, 18, 0.1, 0.09), hs(0.6, 26, 0.12, 0.15), hs(1, 30, 0.14, 0.22)],
      blendDepth: 0.008,
      climate: { temperatureBias: 0.62, moistureBias: 0.06, transitionSharpness: 0.7 },
      material: { roughness: 0.74, metalness: 0.07, specularStrength: 0.2, roughnessVariance: 0.16, metalnessVariance: 0.04 },
    },
    postfx: { bloom: { strength: 0.016, radius: 0.13, threshold: 0.68 }, exposure: 1.05 },
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
    strength: clamp(filter.strength + rng.range(-0.018, 0.018) + profile.reliefStrength * 0.09, 0.04, 0.36),
    roughness: clamp(filter.roughness + rng.range(-0.18, 0.18), 1.6, 3.2),
    minValue: clamp(filter.minValue + rng.range(-0.12, 0.12), 0.8, 2.1),
    center: [
      filter.center[0] + Math.floor(rng.range(-8, 8)),
      filter.center[1] + Math.floor(rng.range(-8, 8)),
      filter.center[2] + Math.floor(rng.range(-8, 8)),
    ] as [number, number, number],
    layerCount: index === 0 ? filter.layerCount : clamp(Math.round(filter.layerCount + profile.craterWeight * 3), 2, 7),
  }));

  const climate = {
    temperatureBias: clamp(preset.surface.climate.temperatureBias + profile.lightIntensity * 0.08 - profile.polarWeight * 0.35, 0, 1),
    moistureBias: clamp(preset.surface.climate.moistureBias + profile.humidityStrength * 0.4 + profile.oceanLevel * 0.2, 0, 1),
    transitionSharpness: clamp(preset.surface.climate.transitionSharpness + profile.reliefSharpness * 0.08 - profile.humidityStrength * 0.06, 0.25, 0.95),
  };

  return {
    seed,
    archetype: profile.archetype,
    resolution: preset.generation.resolution,
    radius: 1,
    filters,
    elevationGradient: tuneGradient(preset.surface.elevationGradient, profile, rng, 'land'),
    depthGradient: tuneGradient(preset.surface.depthGradient, profile, rng, 'ocean'),
    blendDepth: preset.surface.blendDepth,
    climate,
    material: {
      roughness: clamp(preset.surface.material.roughness + profile.roughness * 0.16, 0.1, 0.95),
      metalness: clamp(preset.surface.material.metalness + profile.metalness * 0.7, 0.02, 0.62),
      specularStrength: clamp(preset.surface.material.specularStrength + (1 - profile.roughness) * 0.16 + profile.emissiveIntensity * 0.4, 0.12, 0.95),
      roughnessVariance: clamp(preset.surface.material.roughnessVariance + profile.reliefStrength * 0.15, 0.05, 0.35),
      metalnessVariance: clamp(preset.surface.material.metalnessVariance + profile.metalness * 0.2, 0.02, 0.28),
    },
    postfx: {
      bloom: preset.postfx.bloom,
      exposure: clamp(preset.postfx.exposure + (profile.lightIntensity - 1) * 0.18, 0.9, 1.28),
    },
  };
}

function tuneGradient(stops: GradientStop[], profile: PlanetVisualProfile, rng: SeededRng, type: 'land' | 'ocean'): GradientStop[] {
  const satFactor = (type === 'land' ? profile.landSaturation : profile.oceanSaturation) / 50;
  const lightFactor = ((type === 'land' ? profile.landLightness : profile.oceanLightness) - 50) / 120;
  const moisture = profile.humidityStrength;

  return stops.map((stop) => {
    const hsl = rgbToHsl(stop.color);
    const hueShift = profile.hueDrift * 0.35 + (type === 'ocean' ? 8 : 4) * (profile.baseHue / 360 - 0.5) + rng.range(-1.5, 1.5);
    const saturation = clamp(hsl[1] * (0.86 + satFactor * 0.32 + (type === 'land' ? moisture * 0.08 : 0)), 0.05, 0.96);
    const lightness = clamp(hsl[2] + lightFactor + (type === 'ocean' ? moisture * 0.03 : 0), 0.03, 0.97);
    return s(stop.anchor, hslToRgb(hsl[0] + hueShift, saturation, lightness));
  });
}

function rgbToHsl(color: [number, number, number]): [number, number, number] {
  const [r, g, b] = color;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta > 0.00001) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
  }

  h = ((h * 60) + 360) % 360;
  const l = (max + min) * 0.5;
  const sVal = delta < 0.00001 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return [h, sVal, l];
}

function hslToRgb(hue: number, saturation: number, lightness: number): [number, number, number] {
  const h = ((hue % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lightness - c / 2;

  let rgb: [number, number, number] = [0, 0, 0];
  if (h < 60) rgb = [c, x, 0];
  else if (h < 120) rgb = [x, c, 0];
  else if (h < 180) rgb = [0, c, x];
  else if (h < 240) rgb = [0, x, c];
  else if (h < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];

  return [rgb[0] + m, rgb[1] + m, rgb[2] + m];
}
