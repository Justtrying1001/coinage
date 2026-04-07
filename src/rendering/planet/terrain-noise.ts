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

interface FamilyTerrainRecipe {
  macroFrequency: number;
  macroWarp: number;
  mountainFrequency: number;
  mountainAmplitude: number;
  erosionStrength: number;
  craterStrength: number;
  thermalStrength: number;
  humidityBias: number;
  temperatureBias: number;
  continentThreshold: [number, number];
}

const SOLID_RECIPES: Record<PlanetFamily, FamilyTerrainRecipe> = {
  'terrestrial-lush': {
    macroFrequency: 0.86,
    macroWarp: 0.34,
    mountainFrequency: 5.8,
    mountainAmplitude: 0.32,
    erosionStrength: 0.18,
    craterStrength: 0.06,
    thermalStrength: 0.08,
    humidityBias: 0.22,
    temperatureBias: 0.1,
    continentThreshold: [0.44, 0.62],
  },
  oceanic: {
    macroFrequency: 0.72,
    macroWarp: 0.28,
    mountainFrequency: 4.6,
    mountainAmplitude: 0.18,
    erosionStrength: 0.12,
    craterStrength: 0.03,
    thermalStrength: 0.04,
    humidityBias: 0.34,
    temperatureBias: 0.06,
    continentThreshold: [0.54, 0.72],
  },
  'desert-arid': {
    macroFrequency: 1.06,
    macroWarp: 0.4,
    mountainFrequency: 6.8,
    mountainAmplitude: 0.28,
    erosionStrength: 0.26,
    craterStrength: 0.1,
    thermalStrength: 0.08,
    humidityBias: -0.42,
    temperatureBias: 0.26,
    continentThreshold: [0.42, 0.64],
  },
  'ice-frozen': {
    macroFrequency: 0.96,
    macroWarp: 0.3,
    mountainFrequency: 6.1,
    mountainAmplitude: 0.2,
    erosionStrength: 0.14,
    craterStrength: 0.12,
    thermalStrength: 0.06,
    humidityBias: 0.16,
    temperatureBias: -0.42,
    continentThreshold: [0.45, 0.63],
  },
  'volcanic-infernal': {
    macroFrequency: 1.16,
    macroWarp: 0.46,
    mountainFrequency: 8.2,
    mountainAmplitude: 0.46,
    erosionStrength: 0.08,
    craterStrength: 0.1,
    thermalStrength: 0.78,
    humidityBias: -0.3,
    temperatureBias: 0.42,
    continentThreshold: [0.46, 0.67],
  },
  'barren-rocky': {
    macroFrequency: 1.04,
    macroWarp: 0.38,
    mountainFrequency: 7.5,
    mountainAmplitude: 0.34,
    erosionStrength: 0.14,
    craterStrength: 0.62,
    thermalStrength: 0.04,
    humidityBias: -0.34,
    temperatureBias: -0.1,
    continentThreshold: [0.4, 0.6],
  },
  'toxic-alien': {
    macroFrequency: 0.92,
    macroWarp: 0.48,
    mountainFrequency: 5.4,
    mountainAmplitude: 0.24,
    erosionStrength: 0.17,
    craterStrength: 0.08,
    thermalStrength: 0.36,
    humidityBias: 0.08,
    temperatureBias: 0.12,
    continentThreshold: [0.43, 0.62],
  },
  'gas-giant': {
    macroFrequency: 0.82,
    macroWarp: 0.2,
    mountainFrequency: 0,
    mountainAmplitude: 0,
    erosionStrength: 0,
    craterStrength: 0,
    thermalStrength: 0,
    humidityBias: 0,
    temperatureBias: 0,
    continentThreshold: [0.4, 0.6],
  },
  'ringed-giant': {
    macroFrequency: 0.82,
    macroWarp: 0.2,
    mountainFrequency: 0,
    mountainAmplitude: 0,
    erosionStrength: 0,
    craterStrength: 0,
    thermalStrength: 0,
    humidityBias: 0,
    temperatureBias: 0,
    continentThreshold: [0.4, 0.6],
  },
};

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
  const broad = noise3(x * 7.6, y * 7.6, z * 7.6, seed);
  const rim = ridged(x * 14.5, y * 14.5, z * 14.5, seed + 81, 3);
  const detail = noise3(x * 27.0, y * 27.0, z * 27.0, seed + 171);
  return smoothstep(0.72, 0.94, broad) * smoothstep(0.24, 0.78, rim) * smoothstep(0.32, 0.8, detail);
}

function sampleSolid(input: TerrainInput): TerrainSample {
  const { px, py, pz, seed, moistureSeed, thermalSeed, oceanLevel, family } = input;
  const recipe = SOLID_RECIPES[family];
  const lat = Math.abs(py);

  const macroBase = fbm(
    px * recipe.macroFrequency,
    py * recipe.macroFrequency,
    pz * recipe.macroFrequency,
    seed + 11,
    5,
    2.02,
    0.54,
  );
  const macroWarp = fbm(px * 1.9, py * 1.9, pz * 1.9, seed + 27, 3, 2.22, 0.48);
  const macroField = macroBase + (macroWarp - 0.5) * recipe.macroWarp;
  const continentMask = smoothstep(recipe.continentThreshold[0], recipe.continentThreshold[1], macroField);

  const midRelief = ridged(
    px * recipe.mountainFrequency,
    py * recipe.mountainFrequency,
    pz * recipe.mountainFrequency,
    seed + 73,
    5,
  );
  const microRelief = ridged(px * 12.2, py * 12.2, pz * 12.2, seed + 121, 3) * 0.18;
  const mountainChains = midRelief * smoothstep(0.2, 0.88, continentMask) * recipe.mountainAmplitude;

  const erosionField = fbm(px * 7.8, py * 7.8, pz * 7.8, seed + 187, 4, 2.17, 0.53);
  const erosionMask = smoothstep(0.3, 0.8, erosionField);

  const craterRaw = craterField(px, py, pz, seed + 347);
  const craterMask = craterRaw * recipe.craterStrength;

  const rawHumidity = fbm(px * 2.6, py * 2.6, pz * 2.6, moistureSeed, 4, 2.09, 0.53);
  const humidityMask = clamp(smoothstep(0.24, 0.8, rawHumidity) + recipe.humidityBias * 0.5, 0, 1);

  const thermalField = fbm(px * 2.0, py * 2.0, pz * 2.0, thermalSeed, 4, 2.06, 0.52);
  const baseTemp = clamp((1 - lat) * 0.72 + (thermalField - 0.5) * 0.46 + recipe.temperatureBias * 0.22, 0, 1);
  const temperatureMask = baseTemp;

  const fractureNoise = ridged(px * 16.4, py * 16.4, pz * 16.4, thermalSeed + 19, 3);
  const thermalMask =
    recipe.thermalStrength > 0
      ? smoothstep(0.54, 0.9, thermalField * 0.68 + fractureNoise * 0.32) * recipe.thermalStrength
      : 0;

  let baseElevation = continentMask * 0.56 + mountainChains + microRelief;
  baseElevation -= erosionMask * recipe.erosionStrength;
  baseElevation -= craterMask * 0.22;
  baseElevation += (temperatureMask - 0.5) * 0.06;

  if (family === 'oceanic') {
    baseElevation -= 0.09;
    baseElevation += smoothstep(0.86, 1.0, continentMask) * 0.05;
  }

  if (family === 'desert-arid') {
    baseElevation += (1 - humidityMask) * 0.09;
    baseElevation -= smoothstep(0.68, 0.96, erosionMask) * 0.05;
  }

  if (family === 'ice-frozen') {
    const polarCap = smoothstep(0.58, 0.96, lat);
    baseElevation -= polarCap * 0.05;
  }

  if (family === 'toxic-alien') {
    baseElevation += Math.sin((px + pz + seed * 1e-6) * 8.0) * 0.03;
  }

  if (family === 'volcanic-infernal') {
    baseElevation += thermalMask * 0.18;
  }

  const height01 = clamp(baseElevation, 0, 1);
  const landMask = smoothstep(oceanLevel - 0.018, oceanLevel + 0.018, height01);
  const coastMask =
    smoothstep(oceanLevel - 0.024, oceanLevel + 0.012, height01) -
    smoothstep(oceanLevel + 0.008, oceanLevel + 0.05, height01);
  const mountainMask = smoothstep(oceanLevel + 0.14, oceanLevel + 0.36, height01) * smoothstep(0.38, 0.95, midRelief);
  const oceanDepth = 1 - smoothstep(oceanLevel - 0.24, oceanLevel + 0.028, height01);

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
  const { px, py, pz, seed, moistureSeed, thermalSeed, bandingStrength, family } = input;
  const latitude = py * 0.5 + 0.5;

  const broadBands = Math.sin((latitude + seed * 1.3e-7) * (18 + bandingStrength * 42)) * 0.5 + 0.5;
  const sheared = Math.sin((latitude * 1.8 + px * 0.14 + seed * 1.9e-7) * (11 + bandingStrength * 18)) * 0.5 + 0.5;
  const turbulence = fbm(px * 4.4, py * 2.4, pz * 4.4, seed + 19, 5, 2.18, 0.55);
  const vortices = ridged(px * 10.3, py * 4.2, pz * 10.3, thermalSeed + 47, 4);
  const storms = smoothstep(0.58, 0.92, vortices * 0.58 + turbulence * 0.42);

  const humidityMask = smoothstep(0.2, 0.86, fbm(px * 3.8, py * 2.2, pz * 3.8, moistureSeed, 4));
  const temperatureMask = smoothstep(0.18, 0.82, fbm(px * 2.3, py * 1.9, pz * 2.3, thermalSeed, 4));

  const bandMask = clamp(broadBands * 0.54 + sheared * 0.2 + turbulence * 0.16 + storms * 0.24, 0, 1);
  const thermalMask = family === 'ringed-giant' ? storms * 0.84 : storms;
  const height01 = clamp(0.5 + (turbulence - 0.5) * 0.06, 0.45, 0.56);

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
    thermalMask,
    bandMask,
  };
}

export function sampleTerrain(input: TerrainInput): TerrainSample {
  if (input.surfaceModel === 'gaseous') {
    return sampleGaseous(input);
  }
  return sampleSolid(input);
}
