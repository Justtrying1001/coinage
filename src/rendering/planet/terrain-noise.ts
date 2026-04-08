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
  macroRelief: number;
  midRelief: number;
  microRelief: number;
  basinMask: number;
  silhouetteMask: number;
  fractureMask: number;
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

  const continentBase = fbm(px * 0.62, py * 0.62, pz * 0.62, seed + 11, 4, 2.03, 0.52);
  const continentWarp = fbm(px * 1.05, py * 1.05, pz * 1.05, seed + 27, 3, 2.12, 0.47);
  const continentRidge = ridged(px * 0.9, py * 0.9, pz * 0.9, seed + 71, 2);
  const continentField = continentBase + (continentWarp - 0.5) * 0.24 - continentRidge * 0.12;
  const continentMask = smoothstep(0.36, 0.64, continentField);

  const mountainChains = ridged(px * 2.7, py * 2.7, pz * 2.7, seed + 61, 4) * smoothstep(0.42, 0.9, continentMask);
  const foothills = fbm(px * 2.2, py * 2.2, pz * 2.2, seed + 95, 3, 2.0, 0.48) * continentMask;
  const erosionField = fbm(px * 3.4, py * 3.4, pz * 3.4, seed + 117, 3, 2.0, 0.5);
  const fractureField = ridged(px * 4.6, py * 4.6, pz * 4.6, seed + 141, 3);

  const baseElevation = continentMask * 0.5 + foothills * 0.22 + mountainChains * 0.34;
  const erosionMask = smoothstep(0.4, 0.7, erosionField);
  const erodedElevation = baseElevation - erosionMask * 0.05;

  const craterMask = family === 'barren-rocky'
    ? craterField(px, py, pz, seed + 333)
    : craterField(px, py, pz, seed + 333) * 0.1;

  const thermalMask = family === 'volcanic-infernal'
    ? smoothstep(0.55, 0.86, fbm(px * 4.0, py * 4.0, pz * 4.0, thermalSeed, 3))
    : 0;

  const polarIce = smoothstep(0.7, 0.95, lat);
  const humidityMask = smoothstep(0.3, 0.72, fbm(px * 1.65, py * 1.65, pz * 1.65, moistureSeed, 3));
  const temperatureMask = clamp((1 - lat) * 0.72 + fbm(px * 1.15, py * 1.15, pz * 1.15, thermalSeed, 2) * 0.28, 0, 1);

  let height01 = erodedElevation + (temperatureMask - 0.5) * 0.05 - craterMask * 0.07 + thermalMask * 0.1;
  if (family === 'desert-arid') height01 += (1 - humidityMask) * 0.06;
  if (family === 'ice-frozen') height01 -= polarIce * 0.04;
  height01 = clamp(height01, 0, 1);

  const landMask = smoothstep(oceanLevel - 0.01, oceanLevel + 0.01, height01);
  const coastMask = smoothstep(oceanLevel - 0.016, oceanLevel + 0.008, height01)
    - smoothstep(oceanLevel + 0.008, oceanLevel + 0.052, height01);
  const mountainMask = smoothstep(oceanLevel + 0.08, oceanLevel + 0.32, height01) * smoothstep(0.3, 0.9, mountainChains);
  const oceanDepth = 1 - smoothstep(oceanLevel - 0.2, oceanLevel + 0.02, height01);

  const basinMask = smoothstep(0.42, 0.9, 1 - continentMask) * smoothstep(oceanLevel - 0.14, oceanLevel + 0.03, height01);
  const plateauMask = smoothstep(oceanLevel + 0.14, oceanLevel + 0.28, height01) * (1 - mountainMask * 0.76);

  const macroPeaks = smoothstep(0.44, 0.84, continentMask) * (0.72 + continentRidge * 0.26);
  const macroBasins = basinMask * 0.82 + smoothstep(0.62, 0.92, oceanDepth) * 0.34;
  const macroRelief = clamp((macroPeaks - macroBasins) * 1.62 - 0.2, -1, 1);

  const midRaw = mountainChains * 0.95 + foothills * 0.58 + plateauMask * 0.34 - erosionMask * 0.28 - basinMask * 0.22;
  const midRelief = clamp((midRaw - 0.34) * 1.7, -1, 1);

  const microField = fbm(px * 6.2, py * 6.2, pz * 6.2, seed + 171, 2, 2.0, 0.5);
  const microRelief = clamp((microField * 2 - 1) * (0.5 + mountainMask * 0.5), -1, 1);

  const silhouetteMask = clamp(
    smoothstep(0.38, 0.86, continentMask) * 0.42 +
    smoothstep(0.2, 0.92, mountainMask) * 0.46 +
    plateauMask * 0.24 +
    (1 - basinMask) * 0.12,
    0,
    1,
  );
  const fractureMask = clamp(
    smoothstep(0.42, 0.86, fractureField) *
    smoothstep(oceanLevel - 0.02, oceanLevel + 0.24, height01) *
    (0.52 + mountainMask * 0.46 + thermalMask * 0.34),
    0,
    1,
  );

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
    macroRelief,
    midRelief,
    microRelief,
    basinMask,
    silhouetteMask,
    fractureMask,
  };
}

function sampleGaseous(input: TerrainInput): TerrainSample {
  const { px, py, pz, seed, moistureSeed, thermalSeed, bandingStrength } = input;
  const latitude = py * 0.5 + 0.5;

  const jets = Math.sin((latitude + seed * 0.00000013) * (10 + bandingStrength * 28)) * 0.5 + 0.5;
  const turbulence = fbm(px * 2.0, py * 2.0, pz * 2.0, seed + 19, 3, 2.0, 0.5);
  const storms = smoothstep(0.65, 0.9, fbm(px * 5.0, py * 5.0, pz * 5.0, thermalSeed + 77, 2));
  const humidityMask = smoothstep(0.25, 0.8, fbm(px * 3.0, py * 3.0, pz * 3.0, moistureSeed, 2));
  const temperatureMask = smoothstep(0.2, 0.8, fbm(px * 1.5, py * 1.5, pz * 1.5, thermalSeed, 2));

  const bandMask = clamp(jets * 0.65 + turbulence * 0.25 + storms * 0.15, 0, 1);
  const height01 = clamp(0.5 + (turbulence - 0.5) * 0.04, 0.46, 0.54);

  const macroRelief = clamp((bandMask - 0.5) * 0.24, -1, 1);
  const midRelief = clamp((turbulence - 0.5) * 0.42, -1, 1);
  const microRelief = clamp((noise3(px * 9, py * 9, pz * 9, seed + 301) - 0.5) * 0.2, -1, 1);

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
    macroRelief,
    midRelief,
    microRelief,
    basinMask: 0,
    silhouetteMask: clamp(0.2 + bandMask * 0.4, 0, 1),
    fractureMask: 0,
  };
}

export function sampleTerrain(input: TerrainInput): TerrainSample {
  if (input.surfaceModel === 'gaseous') {
    return sampleGaseous(input);
  }
  return sampleSolid(input);
}
