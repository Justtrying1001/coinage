import type { PlanetArchetype, PlanetVisualProfile } from '@/game/render/types';
import type { PlanetArchetypePreset, PlanetGenerationConfig } from '@/game/planet/types';
import { SeededRng } from '@/game/world/rng';

const BASE_PRESETS: Record<PlanetArchetype, PlanetArchetypePreset> = {
  oceanic: {
    generation: { resolution: 96, filters: [
      { kind: 'simple', enabled: true, strength: 0.23, roughness: 2.2, baseRoughness: 1.1, persistence: 0.48, minValue: 1.05, layerCount: 8, useFirstLayerAsMask: false, center: [0,0,0] },
      { kind: 'ridgid', enabled: true, strength: 0.08, roughness: 2.4, baseRoughness: 1.0, persistence: 0.52, minValue: 1.7, layerCount: 4, useFirstLayerAsMask: true, center: [12,3,27] },
    ]},
    surface: {
      elevationGradient: [{anchor:0,color:[0.1,0.45,0.15]},{anchor:0.45,color:[0.4,0.5,0.2]},{anchor:0.8,color:[0.55,0.52,0.38]},{anchor:1,color:[0.95,0.95,0.95]}],
      depthGradient: [{anchor:0,color:[0.02,0.08,0.4]},{anchor:1,color:[0.14,0.45,0.9]}],
      blendDepth: 0.01, roughness: 0.42, metalness: 0.08,
    },
    atmosphere: { enabled: true, color: [0.35, 0.62, 1], shellScale: 1.5, intensity: 1 },
    postfx: { bloom: { strength: 0.2, radius: 0.52, threshold: 0 }, exposure: 1.14 },
  },
  terrestrial: {
    generation: { resolution: 96, filters: [
      { kind: 'simple', enabled: true, strength: 0.21, roughness: 2.3, baseRoughness: 1.05, persistence: 0.5, minValue: 1.08, layerCount: 8, useFirstLayerAsMask: false, center: [0,0,0] },
      { kind: 'ridgid', enabled: true, strength: 0.09, roughness: 2.5, baseRoughness: 0.95, persistence: 0.52, minValue: 1.85, layerCount: 4, useFirstLayerAsMask: true, center: [8,11,3] },
    ]},
    surface: { elevationGradient:[{anchor:0,color:[0.4,0.62,0.2]},{anchor:0.3,color:[0.2,0.7,0.12]},{anchor:0.75,color:[0.58,0.4,0.2]},{anchor:1,color:[1,1,1]}], depthGradient:[{anchor:0,color:[0,0,0.5]},{anchor:1,color:[0.2,0.6,1]}], blendDepth:0.01, roughness:0.5, metalness:0.05 },
    atmosphere: { enabled: true, color: [0.4, 0.66, 1], shellScale: 1.48, intensity: 0.95 },
    postfx: { bloom: { strength: 0.18, radius: 0.5, threshold: 0 }, exposure: 1.12 },
  },
  arid: {
    generation: { resolution: 96, filters: [
      { kind: 'simple', enabled: true, strength: 0.19, roughness: 2.5, baseRoughness: 1.15, persistence: 0.52, minValue: 1.1, layerCount: 9, useFirstLayerAsMask: false, center: [0,0,0] },
      { kind: 'ridgid', enabled: true, strength: 0.14, roughness: 2.55, baseRoughness: 1.2, persistence: 0.56, minValue: 1.78, layerCount: 5, useFirstLayerAsMask: true, center: [5,18,6] },
    ]},
    surface: { elevationGradient:[{anchor:0,color:[0.58,0.42,0.2]},{anchor:0.5,color:[0.74,0.58,0.28]},{anchor:0.85,color:[0.64,0.48,0.3]},{anchor:1,color:[0.94,0.87,0.7]}], depthGradient:[{anchor:0,color:[0.12,0.1,0.2]},{anchor:1,color:[0.28,0.2,0.25]}], blendDepth:0.008, roughness:0.72, metalness:0.04 },
    atmosphere: { enabled: true, color: [0.92, 0.65, 0.4], shellScale: 1.42, intensity: 0.68 },
    postfx: { bloom: { strength: 0.1, radius: 0.45, threshold: 0 }, exposure: 1.08 },
  },
  frozen: {
    generation: { resolution: 96, filters: [
      { kind: 'simple', enabled: true, strength: 0.15, roughness: 2.0, baseRoughness: 0.9, persistence: 0.48, minValue: 1.0, layerCount: 8, useFirstLayerAsMask: false, center: [0,0,0] },
      { kind: 'ridgid', enabled: true, strength: 0.06, roughness: 2.2, baseRoughness: 1.0, persistence: 0.5, minValue: 1.82, layerCount: 4, useFirstLayerAsMask: true, center: [17,2,9] },
    ]},
    surface: { elevationGradient:[{anchor:0,color:[0.68,0.82,0.9]},{anchor:0.65,color:[0.8,0.88,0.94]},{anchor:1,color:[1,1,1]}], depthGradient:[{anchor:0,color:[0.03,0.2,0.45]},{anchor:1,color:[0.22,0.55,0.8]}], blendDepth:0.01, roughness:0.38, metalness:0.12 },
    atmosphere: { enabled: true, color: [0.72, 0.86, 1], shellScale: 1.48, intensity: 0.88 },
    postfx: { bloom: { strength: 0.2, radius: 0.5, threshold: 0 }, exposure: 1.18 },
  },
  volcanic: {
    generation: { resolution: 96, filters: [
      { kind: 'simple', enabled: true, strength: 0.2, roughness: 2.35, baseRoughness: 1.05, persistence: 0.52, minValue: 1.08, layerCount: 8, useFirstLayerAsMask: false, center: [0,0,0] },
      { kind: 'ridgid', enabled: true, strength: 0.18, roughness: 2.8, baseRoughness: 1.4, persistence: 0.55, minValue: 1.55, layerCount: 5, useFirstLayerAsMask: true, center: [14,14,1] },
    ]},
    surface: { elevationGradient:[{anchor:0,color:[0.22,0.14,0.13]},{anchor:0.4,color:[0.4,0.24,0.18]},{anchor:0.8,color:[0.62,0.28,0.18]},{anchor:1,color:[0.96,0.44,0.18]}], depthGradient:[{anchor:0,color:[0.04,0.03,0.06]},{anchor:1,color:[0.2,0.08,0.08]}], blendDepth:0.006, roughness:0.65, metalness:0.14 },
    atmosphere: { enabled: true, color: [1, 0.56, 0.34], shellScale: 1.4, intensity: 0.6 },
    postfx: { bloom: { strength: 0.24, radius: 0.58, threshold: 0 }, exposure: 1.14 },
  },
  mineral: {
    generation: { resolution: 96, filters: [
      { kind: 'simple', enabled: true, strength: 0.2, roughness: 2.4, baseRoughness: 1.0, persistence: 0.5, minValue: 1.07, layerCount: 8, useFirstLayerAsMask: false, center: [0,0,0] },
      { kind: 'ridgid', enabled: true, strength: 0.1, roughness: 2.45, baseRoughness: 1.1, persistence: 0.54, minValue: 1.75, layerCount: 4, useFirstLayerAsMask: true, center: [9,20,5] },
    ]},
    surface: { elevationGradient:[{anchor:0,color:[0.45,0.48,0.42]},{anchor:0.6,color:[0.58,0.56,0.48]},{anchor:1,color:[0.9,0.9,0.84]}], depthGradient:[{anchor:0,color:[0.1,0.14,0.24]},{anchor:1,color:[0.26,0.32,0.45]}], blendDepth:0.01, roughness:0.46, metalness:0.28 },
    atmosphere: { enabled: true, color: [0.72, 0.8, 0.86], shellScale: 1.38, intensity: 0.5 },
    postfx: { bloom: { strength: 0.14, radius: 0.45, threshold: 0 }, exposure: 1.1 },
  },
  barren: {
    generation: { resolution: 96, filters: [
      { kind: 'simple', enabled: true, strength: 0.2, roughness: 2.45, baseRoughness: 1.12, persistence: 0.52, minValue: 1.1, layerCount: 9, useFirstLayerAsMask: false, center: [0,0,0] },
      { kind: 'ridgid', enabled: true, strength: 0.12, roughness: 2.6, baseRoughness: 1.3, persistence: 0.56, minValue: 1.72, layerCount: 5, useFirstLayerAsMask: true, center: [4,3,18] },
    ]},
    surface: { elevationGradient:[{anchor:0,color:[0.42,0.35,0.3]},{anchor:0.7,color:[0.55,0.46,0.38]},{anchor:1,color:[0.76,0.68,0.57]}], depthGradient:[{anchor:0,color:[0.08,0.08,0.08]},{anchor:1,color:[0.2,0.18,0.16]}], blendDepth:0.006, roughness:0.68, metalness:0.08 },
    atmosphere: { enabled: false, color: [0.6, 0.6, 0.6], shellScale: 1.35, intensity: 0.2 },
    postfx: { bloom: { strength: 0.08, radius: 0.42, threshold: 0 }, exposure: 1.06 },
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function createPlanetGenerationConfig(seed: number, profile: PlanetVisualProfile): PlanetGenerationConfig {
  const preset = BASE_PRESETS[profile.archetype];
  const rng = new SeededRng(seed ^ 0x7f4a7c15);

  const filters = preset.generation.filters.map((f, idx) => ({
    ...f,
    strength: clamp(f.strength + rng.range(-0.02, 0.02) + profile.reliefStrength * 0.08, 0.04, 0.35),
    roughness: clamp(f.roughness + rng.range(-0.2, 0.2), 1.6, 3.2),
    minValue: clamp(f.minValue + rng.range(-0.12, 0.12), 0.8, 2.1),
    center: [f.center[0] + Math.floor(rng.range(-8, 8)), f.center[1] + Math.floor(rng.range(-8, 8)), f.center[2] + Math.floor(rng.range(-8, 8))] as [number,number,number],
    layerCount: idx === 0 ? f.layerCount : clamp(Math.round(f.layerCount + profile.craterWeight * 3), 2, 7),
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
      roughness: clamp(preset.surface.roughness + profile.roughness * 0.2, 0.1, 0.95),
      metalness: clamp(preset.surface.metalness + profile.metalness * 0.7, 0.02, 0.55),
    },
    atmosphere: preset.atmosphere,
    postfx: {
      bloom: preset.postfx.bloom,
      exposure: clamp(preset.postfx.exposure + (profile.lightIntensity - 1) * 0.18, 0.92, 1.26),
    },
  };
}
