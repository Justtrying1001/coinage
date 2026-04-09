import type { PlanetFamily } from '@/domain/world/planet-visual.types';

export type NoiseFilterType = 'simple' | 'ridged';

export interface NoiseFilter {
  enabled: boolean;
  filterType: NoiseFilterType;
  strength: number;
  roughness: number;
  baseRoughness: number;
  persistence: number;
  minValue: number;
  layerCount: number;
  useFirstLayerAsMask: boolean;
  center: [number, number, number];
}

export interface XenoverseNoiseContract {
  seed: number;
  reliefAmplitude: number;
  filters: NoiseFilter[];
}

export interface ElevationSample {
  unscaledElevation: number;
  scaledElevation: number;
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

function evaluateSimpleLayer(x: number, y: number, z: number, seed: number, filter: NoiseFilter): number {
  let noise = 0;
  let frequency = filter.baseRoughness;
  let amplitude = 1;

  for (let i = 0; i < filter.layerCount; i += 1) {
    const v = valueNoise3(
      x * frequency + filter.center[0],
      y * frequency + filter.center[1],
      z * frequency + filter.center[2],
      seed + i * 17,
    );
    noise += v * amplitude;
    frequency *= filter.roughness;
    amplitude *= filter.persistence;
  }

  return (noise - filter.minValue) * filter.strength;
}

function evaluateRidgedLayer(x: number, y: number, z: number, seed: number, filter: NoiseFilter): number {
  let noise = 0;
  let frequency = filter.baseRoughness;
  let amplitude = 1;
  let weight = 1;

  for (let i = 0; i < filter.layerCount; i += 1) {
    const v = valueNoise3(
      x * frequency + filter.center[0],
      y * frequency + filter.center[1],
      z * frequency + filter.center[2],
      seed + i * 31,
    );
    let ridge = 1 - Math.abs(v * 2 - 1);
    ridge *= ridge;
    ridge *= weight;
    weight = clamp(ridge * 1.9, 0, 1);

    noise += ridge * amplitude;
    frequency *= filter.roughness;
    amplitude *= filter.persistence;
  }

  return (noise - filter.minValue) * filter.strength;
}

function evaluateFilter(x: number, y: number, z: number, seed: number, filter: NoiseFilter): number {
  if (filter.filterType === 'ridged') return evaluateRidgedLayer(x, y, z, seed, filter);
  return evaluateSimpleLayer(x, y, z, seed, filter);
}

export function sampleNoiseContractElevation(contract: XenoverseNoiseContract, point: { x: number; y: number; z: number }): ElevationSample {
  const { x, y, z } = point;

  const first = contract.filters[0];
  const mask = first && first.enabled ? Math.max(0, evaluateFilter(x, y, z, contract.seed, first)) : 1;

  let elevation = 0;
  let captured = false;
  for (let i = 0; i < contract.filters.length; i += 1) {
    const filter = contract.filters[i];
    if (!filter.enabled) continue;

    let value = evaluateFilter(x, y, z, contract.seed + i * 97, filter);
    if (filter.useFirstLayerAsMask) value *= mask;
    elevation += captured ? Math.max(0, value) : value;
    if (!captured) captured = true;
  }

  return {
    unscaledElevation: elevation,
    scaledElevation: Math.max(0, elevation) * contract.reliefAmplitude,
  };
}

export function getFamilyNoiseFilters(family: PlanetFamily): NoiseFilter[] {
  const terrestrial: NoiseFilter[] = [
    { enabled: true, filterType: 'simple', strength: 0.34, roughness: 2.2, baseRoughness: 0.95, persistence: 0.5, minValue: 0.62, layerCount: 6, useFirstLayerAsMask: false, center: [0, 0, 0] },
    { enabled: true, filterType: 'ridged', strength: 0.24, roughness: 2.4, baseRoughness: 1.8, persistence: 0.48, minValue: 0.35, layerCount: 4, useFirstLayerAsMask: true, center: [0.3, -0.2, 0.15] },
    { enabled: true, filterType: 'simple', strength: 0.08, roughness: 2.0, baseRoughness: 4.0, persistence: 0.45, minValue: 0.5, layerCount: 2, useFirstLayerAsMask: true, center: [0.6, 0.4, -0.1] },
  ];

  if (family === 'oceanic') return terrestrial.map((f, i) => ({ ...f, strength: f.strength * (i === 0 ? 0.7 : 0.45) }));
  if (family === 'ice-frozen') return terrestrial.map((f, i) => ({ ...f, strength: f.strength * (i === 0 ? 0.8 : 0.6) }));
  if (family === 'volcanic-infernal') return terrestrial.map((f, i) => ({ ...f, strength: f.strength * (i === 0 ? 1.15 : 1.4), minValue: f.minValue * 0.9 }));
  if (family === 'barren-rocky') return terrestrial.map((f, i) => ({ ...f, strength: f.strength * (i === 0 ? 1.0 : 1.15) }));
  if (family === 'desert-arid') return terrestrial.map((f, i) => ({ ...f, strength: f.strength * (i === 0 ? 0.9 : 1.1) }));
  if (family === 'toxic-alien') return terrestrial.map((f, i) => ({ ...f, strength: f.strength * (i === 0 ? 0.95 : 1.25) }));
  if (family === 'gas-giant' || family === 'ringed-giant') {
    return [
      { enabled: true, filterType: 'simple', strength: 0.03, roughness: 2.0, baseRoughness: 1.2, persistence: 0.5, minValue: 0.58, layerCount: 4, useFirstLayerAsMask: false, center: [0.1, 0.0, -0.2] },
      { enabled: true, filterType: 'simple', strength: 0.015, roughness: 2.1, baseRoughness: 5.8, persistence: 0.5, minValue: 0.52, layerCount: 2, useFirstLayerAsMask: false, center: [-0.35, 0.2, 0.08] },
    ];
  }

  return terrestrial;
}

export function createNoiseContract(input: {
  seed: number;
  reliefAmplitude: number;
  family: PlanetFamily;
}): XenoverseNoiseContract {
  return {
    seed: input.seed,
    reliefAmplitude: input.reliefAmplitude,
    filters: getFamilyNoiseFilters(input.family),
  };
}
