import type { NoiseFilterConfig } from '@/game/planet/types';
import { createSeededNoise3D } from '@/game/planet/generation/noise/seededNoise';
import type { Vector3Tuple } from '@/game/planet/utils/vector';

interface CpuFaceResult {
  positions: Float32Array;
  elevations: Float32Array;
  indices: Uint32Array;
}

const noiseCache = new Map<number, ReturnType<typeof createSeededNoise3D>>();
const indexCache = new Map<number, Uint32Array>();

export function generateCpuFace(localUp: Vector3Tuple, resolution: number, filters: NoiseFilterConfig[], seed: number): CpuFaceResult {
  const positions = new Float32Array(resolution * resolution * 3);
  const elevations = new Float32Array(resolution * resolution);

  const axisA: Vector3Tuple = [localUp[1], localUp[2], localUp[0]];
  const axisB = cross(localUp, axisA);
  const invRes = 1 / Math.max(1, resolution - 1);

  let v = 0;
  for (let y = 0; y < resolution; y += 1) {
    const percentY = y * invRes;
    for (let x = 0; x < resolution; x += 1) {
      const i = x + y * resolution;
      const percentX = x * invRes;
      const px = localUp[0] + axisA[0] * ((percentX - 0.5) * 2) + axisB[0] * ((percentY - 0.5) * 2);
      const py = localUp[1] + axisA[1] * ((percentX - 0.5) * 2) + axisB[1] * ((percentY - 0.5) * 2);
      const pz = localUp[2] + axisA[2] * ((percentX - 0.5) * 2) + axisB[2] * ((percentY - 0.5) * 2);

      const spherePoint = normalize(spherize(px, py, pz));
      const unscaled = calculateUnscaledElevation(spherePoint, filters, seed);
      const scaled = Math.max(0, unscaled);
      const scale = 1 + scaled;

      positions[v++] = spherePoint[0] * scale;
      positions[v++] = spherePoint[1] * scale;
      positions[v++] = spherePoint[2] * scale;
      elevations[i] = 1 + unscaled;
    }
  }

  return {
    positions,
    elevations,
    indices: getIndices(resolution),
  };
}

function getIndices(resolution: number) {
  const cached = indexCache.get(resolution);
  if (cached) return cached;

  const indices = new Uint32Array((resolution - 1) * (resolution - 1) * 6);
  let t = 0;
  for (let y = 0; y < resolution - 1; y += 1) {
    for (let x = 0; x < resolution - 1; x += 1) {
      const i = x + y * resolution;
      indices[t++] = i + resolution + 1;
      indices[t++] = i + 1;
      indices[t++] = i;
      indices[t++] = i + resolution;
      indices[t++] = i + resolution + 1;
      indices[t++] = i;
    }
  }

  indexCache.set(resolution, indices);
  return indices;
}

function evaluateFilter(point: Vector3Tuple, filter: NoiseFilterConfig, seed: number, unscaled = false) {
  if (!filter.enabled) return 0;
  const noise = getNoise(seed);
  const [cx, cy, cz] = filter.center;

  let noiseValue = 0;
  let frequency = filter.baseRoughness;
  let amplitude = 1;
  let weight = 1;

  for (let i = 0; i < filter.layerCount; i += 1) {
    const px = point[0] * frequency + cx;
    const py = point[1] * frequency + cy;
    const pz = point[2] * frequency + cz;

    if (filter.kind === 'ridgid') {
      let value = Math.abs(noise(px, py, pz));
      value = 1 - value;
      value *= value;
      value *= weight;
      weight = value;
      noiseValue += value * amplitude;
    } else {
      noiseValue += (noise(px, py, pz) + 1) * 0.5 * amplitude;
    }

    frequency *= filter.roughness;
    amplitude *= filter.persistence;
  }

  const shifted = unscaled ? noiseValue - filter.minValue : Math.max(0, noiseValue - filter.minValue);
  return shifted * filter.strength;
}

function calculateUnscaledElevation(point: Vector3Tuple, filters: NoiseFilterConfig[], seed: number) {
  if (filters.length === 0) return 0;

  const mask = Math.max(0, evaluateFilter(point, filters[0], seed, false));
  let elevation = 0;
  let captured = false;

  for (let index = 0; index < filters.length; index += 1) {
    const filter = filters[index];
    if (!filter.enabled) continue;
    let value = evaluateFilter(point, filter, seed + index * 9973, true);
    if (filter.useFirstLayerAsMask) value *= mask * 7;
    elevation += captured ? Math.max(0, value) : value;
    if (!captured) captured = true;
  }

  return elevation;
}

function getNoise(seed: number) {
  const cached = noiseCache.get(seed);
  if (cached) return cached;
  const noise = createSeededNoise3D(seed);
  noiseCache.set(seed, noise);
  return noise;
}

function spherize(x: number, y: number, z: number): Vector3Tuple {
  const xSqr = x * x;
  const ySqr = y * y;
  const zSqr = z * z;

  return [
    x * Math.sqrt(1 - ySqr / 2 - zSqr / 2 + (ySqr * zSqr) / 3),
    y * Math.sqrt(1 - zSqr / 2 - xSqr / 2 + (xSqr * zSqr) / 3),
    z * Math.sqrt(1 - xSqr / 2 - ySqr / 2 + (ySqr * xSqr) / 3),
  ];
}

function normalize(vector: Vector3Tuple): Vector3Tuple {
  const length = Math.hypot(vector[0], vector[1], vector[2]);
  if (length <= 1e-6) return [0, 0, 1];
  const inv = 1 / length;
  return [vector[0] * inv, vector[1] * inv, vector[2] * inv];
}

function cross(a: Vector3Tuple, b: Vector3Tuple): Vector3Tuple {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}
