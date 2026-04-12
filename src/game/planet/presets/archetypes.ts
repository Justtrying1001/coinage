import type { PlanetArchetype, PlanetVisualProfile } from '@/game/render/types';
import type { GradientStop, NoiseFilterConfig, PlanetArchetypePreset, PlanetGenerationConfig, PlanetSurfaceMode } from '@/game/planet/types';
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
      elevationGradient: [s(0, [0.18, 0.4, 0.24]), s(0.24, [0.21, 0.5, 0.3]), s(0.58, [0.33, 0.46, 0.34]), s(0.82, [0.57, 0.58, 0.5]), s(1, [0.87, 0.86, 0.78])],
      depthGradient: [s(0, [0.01, 0.08, 0.28]), s(0.42, [0.02, 0.2, 0.48]), s(0.76, [0.04, 0.33, 0.62]), s(1, [0.14, 0.59, 0.78])],
      blendDepth: 0.012,
      canopyTint: [0.1, 0.36, 0.22],
      roughness: 0.42,
      metalness: 0.08,
      vegetationDensity: 0.45,
      wetness: 0.88,
      submergedFlattening: 0.92,
      slopeDarkening: 0.34,
      basinDarkening: 0.32,
      uplandLift: 0.16,
      peakLift: 0.18,
      shadowTint: [0.08, 0.12, 0.17],
      shadowTintStrength: 0.2,
      coastTintStrength: 0.22,
      shallowSurfaceBrightness: 0.08,
      lowSurfaceCoverage: 0.74,
      microReliefStrength: 0.1,
      microReliefScale: 11,
      microNormalStrength: 0.04,
      microAlbedoBreakup: 0.06,
      hotspotCoverage: 0.05,
      hotspotIntensity: 0.06,
      fissureScale: 12,
      fissureSharpness: 2.6,
      lavaAccentStrength: 0.08,
      emissiveStrength: 0.04,
      basaltContrast: 0.08,
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
      elevationGradient: [s(0, [0.24, 0.44, 0.18]), s(0.32, [0.3, 0.56, 0.24]), s(0.72, [0.52, 0.42, 0.28]), s(1, [0.9, 0.89, 0.84])],
      depthGradient: [s(0, [0.02, 0.14, 0.34]), s(0.56, [0.05, 0.3, 0.54]), s(1, [0.14, 0.45, 0.72])],
      blendDepth: 0.01,
      canopyTint: [0.15, 0.34, 0.14],
      roughness: 0.5,
      metalness: 0.05,
      vegetationDensity: 0.52,
      wetness: 0.62,
      submergedFlattening: 0.82,
      slopeDarkening: 0.3,
      basinDarkening: 0.26,
      uplandLift: 0.22,
      peakLift: 0.26,
      shadowTint: [0.08, 0.1, 0.08],
      shadowTintStrength: 0.14,
      coastTintStrength: 0.2,
      shallowSurfaceBrightness: 0.07,
      lowSurfaceCoverage: 0.56,
      microReliefStrength: 0.1,
      microReliefScale: 10,
      microNormalStrength: 0.04,
      microAlbedoBreakup: 0.05,
      hotspotCoverage: 0.04,
      hotspotIntensity: 0.04,
      fissureScale: 10,
      fissureSharpness: 2.4,
      lavaAccentStrength: 0.06,
      emissiveStrength: 0.03,
      basaltContrast: 0.06,
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
      elevationGradient: [s(0, [0.42, 0.29, 0.18]), s(0.18, [0.56, 0.38, 0.21]), s(0.44, [0.69, 0.51, 0.28]), s(0.7, [0.74, 0.56, 0.33]), s(0.88, [0.62, 0.43, 0.28]), s(1, [0.88, 0.78, 0.6])],
      depthGradient: [s(0, [0.2, 0.13, 0.09]), s(0.58, [0.34, 0.2, 0.12]), s(1, [0.44, 0.27, 0.16])],
      blendDepth: 0.009,
      canopyTint: [0.28, 0.33, 0.18],
      roughness: 0.72,
      metalness: 0.04,
      vegetationDensity: 0.08,
      wetness: 0.12,
      submergedFlattening: 0.84,
      slopeDarkening: 0.36,
      basinDarkening: 0.34,
      uplandLift: 0.28,
      peakLift: 0.24,
      shadowTint: [0.2, 0.15, 0.1],
      shadowTintStrength: 0.22,
      coastTintStrength: 0.14,
      shallowSurfaceBrightness: 0.03,
      lowSurfaceCoverage: 0.32,
      microReliefStrength: 0.34,
      microReliefScale: 24,
      microNormalStrength: 0.14,
      microAlbedoBreakup: 0.22,
      hotspotCoverage: 0.05,
      hotspotIntensity: 0.04,
      fissureScale: 14,
      fissureSharpness: 2.8,
      lavaAccentStrength: 0.04,
      emissiveStrength: 0.03,
      basaltContrast: 0.1,
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
      elevationGradient: [s(0, [0.34, 0.44, 0.52]), s(0.24, [0.45, 0.57, 0.66]), s(0.5, [0.58, 0.7, 0.79]), s(0.78, [0.78, 0.86, 0.92]), s(1, [0.9, 0.95, 0.98])],
      depthGradient: [s(0, [0.22, 0.32, 0.42]), s(0.44, [0.32, 0.45, 0.57]), s(0.76, [0.45, 0.6, 0.72]), s(1, [0.62, 0.77, 0.87])],
      blendDepth: 0.013,
      canopyTint: [0.62, 0.72, 0.74],
      roughness: 0.38,
      metalness: 0.12,
      vegetationDensity: 0.06,
      wetness: 0.36,
      submergedFlattening: 0.8,
      slopeDarkening: 0.26,
      basinDarkening: 0.34,
      uplandLift: 0.08,
      peakLift: 0.04,
      shadowTint: [0.28, 0.42, 0.56],
      shadowTintStrength: 0.32,
      coastTintStrength: 0.1,
      shallowSurfaceBrightness: 0.05,
      lowSurfaceCoverage: 0.42,
      microReliefStrength: 0.22,
      microReliefScale: 16,
      microNormalStrength: 0.08,
      microAlbedoBreakup: 0.12,
      hotspotCoverage: 0.04,
      hotspotIntensity: 0.04,
      fissureScale: 12,
      fissureSharpness: 2.6,
      lavaAccentStrength: 0.04,
      emissiveStrength: 0.03,
      basaltContrast: 0.06,
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
      elevationGradient: [s(0, [0.04, 0.04, 0.05]), s(0.28, [0.09, 0.08, 0.08]), s(0.54, [0.18, 0.14, 0.11]), s(0.78, [0.29, 0.2, 0.13]), s(0.92, [0.4, 0.25, 0.14]), s(1, [0.52, 0.31, 0.18])],
      depthGradient: [s(0, [0.03, 0.03, 0.04]), s(0.42, [0.07, 0.06, 0.06]), s(0.72, [0.13, 0.09, 0.07]), s(1, [0.2, 0.12, 0.08])],
      blendDepth: 0.008,
      canopyTint: [0.22, 0.18, 0.14],
      roughness: 0.74,
      metalness: 0.14,
      vegetationDensity: 0.04,
      wetness: 0.04,
      submergedFlattening: 0.76,
      slopeDarkening: 0.42,
      basinDarkening: 0.38,
      uplandLift: 0.12,
      peakLift: 0.1,
      shadowTint: [0.12, 0.08, 0.08],
      shadowTintStrength: 0.26,
      coastTintStrength: 0.08,
      shallowSurfaceBrightness: 0.02,
      lowSurfaceCoverage: 0.34,
      microReliefStrength: 0.24,
      microReliefScale: 18,
      microNormalStrength: 0.1,
      microAlbedoBreakup: 0.14,
      hotspotCoverage: 0.22,
      hotspotIntensity: 0.78,
      fissureScale: 26,
      fissureSharpness: 4.2,
      lavaAccentStrength: 0.72,
      emissiveStrength: 0.84,
      basaltContrast: 0.24,
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
      canopyTint: [0.22, 0.25, 0.2],
      roughness: 0.46,
      metalness: 0.28,
      vegetationDensity: 0.1,
      wetness: 0.18,
      submergedFlattening: 0.78,
      slopeDarkening: 0.32,
      basinDarkening: 0.3,
      uplandLift: 0.2,
      peakLift: 0.22,
      shadowTint: [0.12, 0.12, 0.14],
      shadowTintStrength: 0.16,
      coastTintStrength: 0.15,
      shallowSurfaceBrightness: 0.06,
      lowSurfaceCoverage: 0.3,
      microReliefStrength: 0.14,
      microReliefScale: 13,
      microNormalStrength: 0.06,
      microAlbedoBreakup: 0.08,
      hotspotCoverage: 0.05,
      hotspotIntensity: 0.08,
      fissureScale: 15,
      fissureSharpness: 2.8,
      lavaAccentStrength: 0.08,
      emissiveStrength: 0.06,
      basaltContrast: 0.14,
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
      elevationGradient: [s(0, [0.31, 0.26, 0.22]), s(0.24, [0.43, 0.35, 0.29]), s(0.56, [0.52, 0.43, 0.35]), s(0.82, [0.63, 0.54, 0.44]), s(1, [0.78, 0.71, 0.61])],
      depthGradient: [s(0, [0.1, 0.09, 0.08]), s(0.52, [0.19, 0.15, 0.12]), s(1, [0.29, 0.23, 0.18])],
      blendDepth: 0.008,
      canopyTint: [0.22, 0.24, 0.2],
      roughness: 0.68,
      metalness: 0.08,
      vegetationDensity: 0.02,
      wetness: 0.05,
      submergedFlattening: 0.86,
      slopeDarkening: 0.4,
      basinDarkening: 0.36,
      uplandLift: 0.26,
      peakLift: 0.18,
      shadowTint: [0.19, 0.16, 0.14],
      shadowTintStrength: 0.24,
      coastTintStrength: 0.11,
      shallowSurfaceBrightness: 0.02,
      lowSurfaceCoverage: 0.24,
      microReliefStrength: 0.38,
      microReliefScale: 23,
      microNormalStrength: 0.16,
      microAlbedoBreakup: 0.2,
      hotspotCoverage: 0.05,
      hotspotIntensity: 0.05,
      fissureScale: 12,
      fissureSharpness: 2.7,
      lavaAccentStrength: 0.04,
      emissiveStrength: 0.03,
      basaltContrast: 0.12,
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
      elevationGradient: [s(0, [0.05, 0.24, 0.1]), s(0.24, [0.07, 0.34, 0.12]), s(0.56, [0.1, 0.45, 0.14]), s(0.76, [0.17, 0.35, 0.14]), s(0.9, [0.31, 0.35, 0.19]), s(1, [0.61, 0.66, 0.5])],
      depthGradient: [s(0, [0.02, 0.12, 0.2]), s(0.55, [0.03, 0.23, 0.33]), s(1, [0.09, 0.32, 0.44])],
      blendDepth: 0.016,
      canopyTint: [0.08, 0.3, 0.1],
      roughness: 0.58,
      metalness: 0.04,
      vegetationDensity: 0.97,
      wetness: 0.92,
      submergedFlattening: 0.8,
      slopeDarkening: 0.28,
      basinDarkening: 0.24,
      uplandLift: 0.2,
      peakLift: 0.24,
      shadowTint: [0.06, 0.12, 0.08],
      shadowTintStrength: 0.14,
      coastTintStrength: 0.24,
      shallowSurfaceBrightness: 0.09,
      lowSurfaceCoverage: 0.52,
      microReliefStrength: 0.1,
      microReliefScale: 11,
      microNormalStrength: 0.04,
      microAlbedoBreakup: 0.06,
      hotspotCoverage: 0.04,
      hotspotIntensity: 0.04,
      fissureScale: 12,
      fissureSharpness: 2.4,
      lavaAccentStrength: 0.06,
      emissiveStrength: 0.03,
      basaltContrast: 0.06,
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

function surfaceModeForArchetype(archetype: PlanetArchetype): PlanetSurfaceMode {
  if (archetype === 'frozen') return 'ice';
  if (archetype === 'volcanic') return 'lava';
  return 'water';
}

function canopyTintForArchetype(archetype: PlanetArchetype, presetTint: [number, number, number]) {
  if (archetype === 'jungle') return [0.07, 0.28, 0.1] as [number, number, number];
  if (archetype === 'terrestrial') return [0.14, 0.32, 0.14] as [number, number, number];
  if (archetype === 'oceanic') return [0.1, 0.34, 0.24] as [number, number, number];
  return presetTint;
}

export function createPlanetGenerationConfig(seed: number, profile: PlanetVisualProfile): PlanetGenerationConfig {
  const preset = BASE_PRESETS[profile.archetype];
  const rng = new SeededRng(seed ^ 0x7f4a7c15);
  const wetness = clamp(profile.humidityStrength * 0.7 + profile.oceanLevel * 0.3, 0, 1);
  const dryness = 1 - wetness;
  const surfaceMode = surfaceModeForArchetype(profile.archetype);
  const lowSurfaceCoverage = clamp(
    preset.surface.lowSurfaceCoverage
      + (surfaceMode === 'water' ? profile.oceanLevel * 0.2 : 0)
      + (surfaceMode === 'water' ? profile.humidityStrength * 0.05 : 0)
      + rng.range(-0.04, 0.04),
    0.08,
    0.82,
  );
  const seaLevel = 1;
  const baseCanopyTint = canopyTintForArchetype(profile.archetype, preset.surface.canopyTint);
  const canopyTint = [
    clamp(baseCanopyTint[0] + rng.range(-0.015, 0.015), 0.02, 0.78),
    clamp(baseCanopyTint[1] + rng.range(-0.02, 0.02), 0.04, 0.82),
    clamp(baseCanopyTint[2] + rng.range(-0.015, 0.015), 0.02, 0.8),
  ] as [number, number, number];

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
    seaLevel,
    surfaceLevel01: lowSurfaceCoverage,
    surfaceMode,
    material: {
      roughness: clamp(preset.surface.roughness + profile.roughness * 0.2 + wetness * 0.06 - dryness * 0.04, 0.1, 0.95),
      metalness: clamp(preset.surface.metalness + profile.metalness * 0.7, 0.02, 0.55),
      vegetationDensity: clamp(preset.surface.vegetationDensity + profile.humidityStrength * 0.28 - profile.craterWeight * 0.12, 0, 1),
      wetness: clamp(preset.surface.wetness + profile.oceanLevel * 0.22 + profile.humidityStrength * 0.18, 0, 1),
      canopyTint,
      submergedFlattening: preset.surface.submergedFlattening,
      slopeDarkening: preset.surface.slopeDarkening,
      basinDarkening: preset.surface.basinDarkening,
      uplandLift: preset.surface.uplandLift,
      peakLift: preset.surface.peakLift,
      shadowTint: preset.surface.shadowTint,
      shadowTintStrength: preset.surface.shadowTintStrength,
      coastTintStrength: preset.surface.coastTintStrength,
      shallowSurfaceBrightness: preset.surface.shallowSurfaceBrightness,
      microReliefStrength: preset.surface.microReliefStrength,
      microReliefScale: preset.surface.microReliefScale,
      microNormalStrength: preset.surface.microNormalStrength,
      microAlbedoBreakup: preset.surface.microAlbedoBreakup,
      hotspotCoverage: preset.surface.hotspotCoverage,
      hotspotIntensity: preset.surface.hotspotIntensity,
      fissureScale: preset.surface.fissureScale,
      fissureSharpness: preset.surface.fissureSharpness,
      lavaAccentStrength: preset.surface.lavaAccentStrength,
      emissiveStrength: clamp(preset.surface.emissiveStrength + profile.emissiveIntensity * 2.2, 0, 1.2),
      basaltContrast: preset.surface.basaltContrast,
    },
    postfx: {
      bloom: preset.postfx.bloom,
      exposure: clamp(preset.postfx.exposure + (profile.lightIntensity - 1) * 0.18, 0.92, 1.26),
    },
  };
}
