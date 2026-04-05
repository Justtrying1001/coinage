import * as THREE from 'three';

function hash3(x: number, y: number, z: number, seed: number): number {
  let h = seed ^ (x * 374761393) ^ (y * 668265263) ^ (z * 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 0xffffffff;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

export function valueNoise3(point: THREE.Vector3, seed: number): number {
  const ix = Math.floor(point.x);
  const iy = Math.floor(point.y);
  const iz = Math.floor(point.z);

  const fx = point.x - ix;
  const fy = point.y - iy;
  const fz = point.z - iz;

  const sx = smoothstep(fx);
  const sy = smoothstep(fy);
  const sz = smoothstep(fz);

  const n000 = hash3(ix, iy, iz, seed);
  const n100 = hash3(ix + 1, iy, iz, seed);
  const n010 = hash3(ix, iy + 1, iz, seed);
  const n110 = hash3(ix + 1, iy + 1, iz, seed);
  const n001 = hash3(ix, iy, iz + 1, seed);
  const n101 = hash3(ix + 1, iy, iz + 1, seed);
  const n011 = hash3(ix, iy + 1, iz + 1, seed);
  const n111 = hash3(ix + 1, iy + 1, iz + 1, seed);

  const nx00 = n000 + (n100 - n000) * sx;
  const nx10 = n010 + (n110 - n010) * sx;
  const nx01 = n001 + (n101 - n001) * sx;
  const nx11 = n011 + (n111 - n011) * sx;

  const nxy0 = nx00 + (nx10 - nx00) * sy;
  const nxy1 = nx01 + (nx11 - nx01) * sy;

  return nxy0 + (nxy1 - nxy0) * sz;
}

export function fbm(point: THREE.Vector3, seed: number, octaves = 5): number {
  let frequency = 1;
  let amplitude = 0.5;
  let value = 0;

  for (let i = 0; i < octaves; i += 1) {
    value += valueNoise3(point.clone().multiplyScalar(frequency), seed + i * 97) * amplitude;
    frequency *= 2.02;
    amplitude *= 0.5;
  }

  return value;
}

export function ridgedFbm(point: THREE.Vector3, seed: number, octaves = 5): number {
  let frequency = 1;
  let amplitude = 0.5;
  let value = 0;
  let weight = 1;

  for (let i = 0; i < octaves; i += 1) {
    let n = valueNoise3(point.clone().multiplyScalar(frequency), seed + i * 131);
    n = 1 - Math.abs(n * 2 - 1);
    n *= n;
    n *= weight;
    weight = Math.max(0, Math.min(1, n * 1.8));

    value += n * amplitude;
    frequency *= 2.12;
    amplitude *= 0.5;
  }

  return value;
}
