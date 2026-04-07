import type { PlanetFamily, PlanetSurfaceModel } from '@/domain/world/planet-visual.types';

export interface TerrainSample {
  height01: number;
  continentMask: number;
  mountainMask: number;
  landMask: number;
  coastMask: number;
  oceanDepth: number;
  humidityMask: number;
  temperatureMask: number;
  erosionMask: number;
  craterMask: number;
  thermalMask: number;
  bandMask: number;
}

export interface TerrainInput {
  px: number;
  py: number;
  pz: number;
  seed: number;
  moistureSeed: number;
  thermalSeed: number;
  oceanLevel: number;
  bandingStrength: number;
  family: PlanetFamily;
  surfaceModel: PlanetSurfaceModel;
}

function fract(value: number): number {
  return value - Math.floor(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / Math.max(1e-6, edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function hash3(x: number, y: number, z: number, seed: number): number {
  const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + seed * 0.0000017) * 43758.5453123;
  return fract(h);
}

function noise3(x: number, y: number, z: number, seed: number): number {
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

  const nx00 = lerp(n000, n100, ux);
  const nx10 = lerp(n010, n110, ux);
  const nx01 = lerp(n001, n101, ux);
  const nx11 = lerp(n011, n111, ux);

  const nxy0 = lerp(nx00, nx10, uy);
  const nxy1 = lerp(nx01, nx11, uy);

  return lerp(nxy0, nxy1, uz);
}

function fbm(x: number, y: number, z: number, seed: number, octaves = 5, lacunarity = 2.07, persistence = 0.5): number {
  let value = 0;
  let amp = 0.58;
  let freq = 1;

  for (let i = 0; i < octaves; i += 1) {
    value += noise3(x * freq, y * freq, z * freq, seed) * amp;
    freq *= lacunarity;
    amp *= persistence;
  }

  return value;
}

function ridged(x: number, y: number, z: number, seed: number, octaves = 5): number {
  let total = 0;
  let amp = 0.66;
  let freq = 1;
  let weight = 1;

  for (let i = 0; i < octaves; i += 1) {
    const n = noise3(x * freq, y * freq, z * freq, seed);
    let ridge = 1 - Math.abs(n * 2 - 1);
    ridge *= ridge;
    ridge *= weight;
    weight = clamp(ridge * 1.75, 0.1, 1);
    total += ridge * amp;
    freq *= 2.03;
    amp *= 0.53;
  }

  return total;
}

function craterField(x: number, y: number, z: number, seed: number): number {
  const broad = noise3(x * 7.2, y * 7.2, z * 7.2, seed);
  const detail = noise3(x * 16.0, y * 16.0, z * 16.0, seed + 81);
  return smoothstep(0.74, 0.92, broad) * smoothstep(0.35, 0.72, detail);
}

function sampleSolid(input: TerrainInput): TerrainSample {
  const { px, py, pz, seed, moistureSeed, thermalSeed, oceanLevel, family } = input;
  const lat = Math.abs(py);

  const continentBase = fbm(px * 0.92, py * 0.92, pz * 0.92, seed + 11, 5, 2.04, 0.52);
  const continentWarp = fbm(px * 1.8, py * 1.8, pz * 1.8, seed + 27, 3, 2.18, 0.48);
  const continentField = continentBase + (continentWarp - 0.5) * 0.34;
  const continentMask = smoothstep(0.38, 0.63, continentField);

  const mountainChains = ridged(px * 4.7, py * 4.7, pz * 4.7, seed + 61, 5) * smoothstep(0.35, 0.9, continentMask);
  const highFreq = ridged(px * 10.3, py * 10.3, pz * 10.3, seed + 89, 3) * 0.22;
  const erosionField = fbm(px * 8.8, py * 8.8, pz * 8.8, seed + 117, 3, 2.15, 0.53);

  const baseElevation = continentMask * 0.5 + mountainChains * 0.32 + highFreq;
  const erosionMask = smoothstep(0.34, 0.71, erosionField);
  const erodedElevation = baseElevation - erosionMask * 0.1;

  const craterMask = family === 'barren-rocky' ? craterField(px, py, pz, seed + 333) : craterField(px, py, pz, seed + 333) * 0.18;
  const thermalMask = family === 'volcanic-infernal' ? smoothstep(0.55, 0.86, fbm(px * 6.2, py * 6.2, pz * 6.2, thermalSeed, 4)) : 0;

  const polarIce = smoothstep(0.64, 0.94, lat);
  const humidityMask = smoothstep(0.28, 0.78, fbm(px * 2.3, py * 2.3, pz * 2.3, moistureSeed, 4));
  const temperatureMask = clamp((1 - lat) * 0.7 + fbm(px * 1.6, py * 1.6, pz * 1.6, thermalSeed, 3) * 0.3, 0, 1);

  let height01 = erodedElevation + (temperatureMask - 0.5) * 0.08 - craterMask * 0.12 + thermalMask * 0.1;
  if (family === 'desert-arid') height01 += (1 - humidityMask) * 0.08;
  if (family === 'ice-frozen') height01 -= polarIce * 0.06;
  height01 = clamp(height01, 0, 1);

  const landMask = smoothstep(oceanLevel - 0.006, oceanLevel + 0.006, height01);
  const coastMask = smoothstep(oceanLevel - 0.01, oceanLevel + 0.004, height01) - smoothstep(oceanLevel + 0.004, oceanLevel + 0.028, height01);
  const mountainMask = smoothstep(oceanLevel + 0.15, oceanLevel + 0.33, height01) * smoothstep(0.4, 0.94, mountainChains);
  const oceanDepth = 1 - smoothstep(oceanLevel - 0.2, oceanLevel + 0.02, height01);

  return {
    height01,
    continentMask,
    mountainMask,
    landMask,
    coastMask,
    oceanDepth,
    humidityMask,
    temperatureMask,
    erosionMask,
    craterMask,
    thermalMask,
    bandMask: 0,
  };
}

function sampleGaseous(input: TerrainInput): TerrainSample {
  const { px, py, pz, seed, moistureSeed, thermalSeed, bandingStrength } = input;
  const latitude = py * 0.5 + 0.5;

  const jets = Math.sin((latitude + seed * 0.00000013) * (12 + bandingStrength * 34)) * 0.5 + 0.5;
  const turbulence = fbm(px * 3.2, py * 3.2, pz * 3.2, seed + 19, 4, 2.2, 0.54);
  const storms = smoothstep(0.62, 0.92, fbm(px * 8.3, py * 8.3, pz * 8.3, thermalSeed + 77, 3));
  const humidityMask = smoothstep(0.22, 0.86, fbm(px * 4.4, py * 4.4, pz * 4.4, moistureSeed, 3));
  const temperatureMask = smoothstep(0.18, 0.82, fbm(px * 2.1, py * 2.1, pz * 2.1, thermalSeed, 3));

  const bandMask = clamp(jets * 0.62 + turbulence * 0.28 + storms * 0.2, 0, 1);
  const height01 = clamp(0.5 + (turbulence - 0.5) * 0.08, 0.44, 0.56);

  return {
    height01,
    continentMask: 0,
    mountainMask: 0,
    landMask: 0,
    coastMask: 0,
    oceanDepth: 0,
    humidityMask,
    temperatureMask,
    erosionMask: turbulence,
    craterMask: 0,
    thermalMask: storms,
    bandMask,
  };
}

export function sampleTerrain(input: TerrainInput): TerrainSample {
  if (input.surfaceModel === 'gaseous') {
    return sampleGaseous(input);
  }
  return sampleSolid(input);
}
