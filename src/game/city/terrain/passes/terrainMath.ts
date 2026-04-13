import { createSeededNoise3D } from '@/game/planet/generation/noise/seededNoise';

export const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export function indexAt(x: number, y: number, width: number) {
  return y * width + x;
}

export function bilinearRadial(nx: number, nz: number, centerX: number, centerZ: number, radiusX: number, radiusZ: number) {
  const dx = (nx - centerX) / Math.max(0.0001, radiusX);
  const dz = (nz - centerZ) / Math.max(0.0001, radiusZ);
  const d = Math.sqrt(dx * dx + dz * dz);
  return clamp01(1 - d);
}

export function fbm2(seed: number, x: number, z: number, octaves: number, frequency: number, persistence: number) {
  const noise = createSeededNoise3D(seed);
  let amp = 1;
  let freq = frequency;
  let sum = 0;
  let norm = 0;

  for (let i = 0; i < octaves; i += 1) {
    sum += noise(x * freq, z * freq, i * 1.17) * amp;
    norm += amp;
    amp *= persistence;
    freq *= 2;
  }

  return norm > 0 ? sum / norm : 0;
}
