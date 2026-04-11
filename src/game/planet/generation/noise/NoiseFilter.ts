import * as THREE from 'three';
import type { NoiseFilterConfig } from '@/game/planet/types';
import { createSeededNoise3D } from '@/game/planet/generation/noise/seededNoise';

export function evaluateFilter(point: THREE.Vector3, filter: NoiseFilterConfig, seed: number, unscaled = false) {
  if (!filter.enabled) return 0;
  const noise = createSeededNoise3D(seed);

  let noiseValue = 0;
  let frequency = filter.baseRoughness;
  let amplitude = 1;
  let weight = 1;

  for (let i = 0; i < filter.layerCount; i += 1) {
    const p = point.clone().multiplyScalar(frequency).add(new THREE.Vector3(...filter.center));

    if (filter.kind === 'ridgid') {
      let v = Math.abs(noise(p.x, p.y, p.z));
      v = 1 - v;
      v *= v;
      v *= weight;
      weight = v;
      noiseValue += v * amplitude;
    } else {
      noiseValue += (noise(p.x, p.y, p.z) + 1) * 0.5 * amplitude;
    }

    frequency *= filter.roughness;
    amplitude *= filter.persistence;
  }

  const shifted = unscaled ? noiseValue - filter.minValue : Math.max(0, noiseValue - filter.minValue);
  return shifted * filter.strength;
}

export function calculateUnscaledElevation(point: THREE.Vector3, filters: NoiseFilterConfig[], seed: number) {
  if (filters.length === 0) return 0;

  const mask = Math.max(0, evaluateFilter(point, filters[0], seed, false));
  let elevation = 0;
  let captured = false;

  for (const [index, filter] of filters.entries()) {
    if (!filter.enabled) continue;
    let value = evaluateFilter(point, filter, seed + index * 9973, true);
    if (filter.useFirstLayerAsMask) value *= mask * 7;
    elevation += captured ? Math.max(0, value) : value;
    if (!captured) captured = true;
  }

  return elevation;
}
