import type { PlanetFamily } from '@/domain/world/planet-visual.types';

export type NoiseLayerType = 'simple' | 'ridged';

export interface NoiseLayerConfig {
  enabled: boolean;
  type: NoiseLayerType;
  strength: number;
  roughness: number;
  baseRoughness: number;
  persistence: number;
  minValue: number;
  layerCount: number;
  useFirstLayerAsMask: boolean;
}

export interface PlanetCoreXenoConfig {
  seed: number;
  radius: number;
  reliefAmplitude: number;
  oceanLevel: number;
  layers: NoiseLayerConfig[];
}

export interface ElevationSample {
  unscaledElevation: number;
  scaledElevation: number;
}

export interface ElevationMinMax {
  min: number;
  max: number;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function fract(v: number): number {
  return v - Math.floor(v);
}

function hash3(x: number, y: number, z: number, seed: number): number {
  return fract(Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + seed * 0.00000137) * 43758.5453);
}

function valueNoise3(x: number, y: number, z: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);

  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;

  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const uz = fz * fz * (3 - 2 * fz);

  const n000 = hash3(ix, iy, iz, seed);
  const n100 = hash3(ix + 1, iy, iz, seed);
  const n010 = hash3(ix, iy + 1, iz, seed);
  const n110 = hash3(ix + 1, iy + 1, iz, seed);
  const n001 = hash3(ix, iy, iz + 1, seed);
  const n101 = hash3(ix + 1, iy, iz + 1, seed);
  const n011 = hash3(ix, iy + 1, iz + 1, seed);
  const n111 = hash3(ix + 1, iy + 1, iz + 1, seed);

  const nx00 = n000 * (1 - ux) + n100 * ux;
  const nx10 = n010 * (1 - ux) + n110 * ux;
  const nx01 = n001 * (1 - ux) + n101 * ux;
  const nx11 = n011 * (1 - ux) + n111 * ux;

  const nxy0 = nx00 * (1 - uy) + nx10 * uy;
  const nxy1 = nx01 * (1 - uy) + nx11 * uy;

  return nxy0 * (1 - uz) + nxy1 * uz;
}

function evaluateSimpleLayer(x: number, y: number, z: number, seed: number, layer: NoiseLayerConfig): number {
  let noise = 0;
  let frequency = layer.baseRoughness;
  let amplitude = 1;

  for (let i = 0; i < layer.layerCount; i += 1) {
    const v = valueNoise3(x * frequency, y * frequency, z * frequency, seed + i * 17);
    noise += v * amplitude;
    frequency *= layer.roughness;
    amplitude *= layer.persistence;
  }

  const shifted = noise - layer.minValue;
  return shifted * layer.strength;
}

function evaluateRidgedLayer(x: number, y: number, z: number, seed: number, layer: NoiseLayerConfig): number {
  let noise = 0;
  let frequency = layer.baseRoughness;
  let amplitude = 1;
  let weight = 1;

  for (let i = 0; i < layer.layerCount; i += 1) {
    const v = valueNoise3(x * frequency, y * frequency, z * frequency, seed + i * 31);
    let ridge = 1 - Math.abs(v * 2 - 1);
    ridge *= ridge;
    ridge *= weight;
    weight = clamp(ridge * 1.9, 0, 1);

    noise += ridge * amplitude;
    frequency *= layer.roughness;
    amplitude *= layer.persistence;
  }

  const shifted = noise - layer.minValue;
  return shifted * layer.strength;
}

function evaluateLayer(x: number, y: number, z: number, seed: number, layer: NoiseLayerConfig): number {
  if (layer.type === 'ridged') return evaluateRidgedLayer(x, y, z, seed, layer);
  return evaluateSimpleLayer(x, y, z, seed, layer);
}

export function sampleXenoElevation(config: PlanetCoreXenoConfig, point: { x: number; y: number; z: number }): ElevationSample {
  const { x, y, z } = point;
  const first = config.layers[0];
  const mask = first && first.enabled ? Math.max(0, evaluateLayer(x, y, z, config.seed, first)) : 1;

  let elevation = 0;
  let captured = false;

  for (let i = 0; i < config.layers.length; i += 1) {
    const layer = config.layers[i];
    if (!layer.enabled) continue;

    let noiseValue = evaluateLayer(x, y, z, config.seed + i * 97, layer);
    if (layer.useFirstLayerAsMask) noiseValue *= mask;

    elevation += captured ? Math.max(0, noiseValue) : noiseValue;
    if (!captured) captured = true;
  }

  const scaledElevation = Math.max(0, elevation) * config.reliefAmplitude;
  return { unscaledElevation: elevation, scaledElevation };
}

export function createMinMaxTracker(): { add: (v: number) => void; get: () => ElevationMinMax } {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  return {
    add: (v) => {
      min = Math.min(min, v);
      max = Math.max(max, v);
    },
    get: () => ({
      min: Number.isFinite(min) ? min : 0,
      max: Number.isFinite(max) ? max : 0,
    }),
  };
}

export function getFamilyXenoLayers(family: PlanetFamily): NoiseLayerConfig[] {
  const terrestrial: NoiseLayerConfig[] = [
    { enabled: true, type: 'simple', strength: 0.34, roughness: 2.2, baseRoughness: 0.95, persistence: 0.5, minValue: 0.62, layerCount: 6, useFirstLayerAsMask: false },
    { enabled: true, type: 'ridged', strength: 0.24, roughness: 2.4, baseRoughness: 1.8, persistence: 0.48, minValue: 0.35, layerCount: 4, useFirstLayerAsMask: true },
    { enabled: true, type: 'simple', strength: 0.08, roughness: 2.0, baseRoughness: 4.0, persistence: 0.45, minValue: 0.5, layerCount: 2, useFirstLayerAsMask: true },
  ];

  if (family === 'oceanic') {
    return terrestrial.map((l, i) => ({ ...l, strength: l.strength * (i === 0 ? 0.7 : 0.45) }));
  }
  if (family === 'ice-frozen') {
    return terrestrial.map((l, i) => ({ ...l, strength: l.strength * (i === 0 ? 0.8 : 0.6) }));
  }
  if (family === 'volcanic-infernal') {
    return terrestrial.map((l, i) => ({ ...l, strength: l.strength * (i === 0 ? 1.15 : 1.4), minValue: l.minValue * 0.9 }));
  }
  if (family === 'barren-rocky') {
    return terrestrial.map((l, i) => ({ ...l, strength: l.strength * (i === 0 ? 1.0 : 1.15) }));
  }
  if (family === 'desert-arid') {
    return terrestrial.map((l, i) => ({ ...l, strength: l.strength * (i === 0 ? 0.9 : 1.1) }));
  }
  if (family === 'toxic-alien') {
    return terrestrial.map((l, i) => ({ ...l, strength: l.strength * (i === 0 ? 0.95 : 1.25) }));
  }
  if (family === 'gas-giant' || family === 'ringed-giant') {
    return [
      { enabled: true, type: 'simple', strength: 0.03, roughness: 2.0, baseRoughness: 1.2, persistence: 0.5, minValue: 0.58, layerCount: 4, useFirstLayerAsMask: false },
      { enabled: true, type: 'simple', strength: 0.015, roughness: 2.1, baseRoughness: 5.8, persistence: 0.5, minValue: 0.52, layerCount: 2, useFirstLayerAsMask: false },
    ];
  }

  return terrestrial;
}

export function getFamilyGradients(family: PlanetFamily): {
  land: Array<{ anchor: number; color: [number, number, number] }>;
  depth: Array<{ anchor: number; color: [number, number, number] }>;
} {
  const baseLand = [
    { anchor: 0.0, color: [0.22, 0.28, 0.15] as [number, number, number] },
    { anchor: 0.35, color: [0.34, 0.40, 0.20] as [number, number, number] },
    { anchor: 0.72, color: [0.45, 0.36, 0.24] as [number, number, number] },
    { anchor: 1.0, color: [0.9, 0.9, 0.9] as [number, number, number] },
  ];

  const baseDepth = [
    { anchor: 0.0, color: [0.01, 0.03, 0.1] as [number, number, number] },
    { anchor: 1.0, color: [0.12, 0.32, 0.72] as [number, number, number] },
  ];

  if (family === 'desert-arid') {
    return {
      land: [
        { anchor: 0.0, color: [0.45, 0.30, 0.14] },
        { anchor: 0.55, color: [0.62, 0.45, 0.24] },
        { anchor: 1.0, color: [0.82, 0.72, 0.52] },
      ],
      depth: baseDepth,
    };
  }

  if (family === 'ice-frozen') {
    return {
      land: [
        { anchor: 0.0, color: [0.44, 0.56, 0.67] },
        { anchor: 0.6, color: [0.62, 0.74, 0.84] },
        { anchor: 1.0, color: [0.95, 0.98, 1.0] },
      ],
      depth: [
        { anchor: 0.0, color: [0.01, 0.06, 0.14] },
        { anchor: 1.0, color: [0.16, 0.40, 0.72] },
      ],
    };
  }

  if (family === 'volcanic-infernal') {
    return {
      land: [
        { anchor: 0.0, color: [0.10, 0.06, 0.05] },
        { anchor: 0.64, color: [0.28, 0.16, 0.10] },
        { anchor: 1.0, color: [0.50, 0.28, 0.14] },
      ],
      depth: [
        { anchor: 0.0, color: [0.05, 0.03, 0.03] },
        { anchor: 1.0, color: [0.16, 0.08, 0.05] },
      ],
    };
  }

  return { land: baseLand, depth: baseDepth };
}
