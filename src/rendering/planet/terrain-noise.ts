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
  biomeMask: number;
  iceMask: number;
  crackMask: number;
  bandMask: number;
  waterMask: number;
  soilMask: number;
  sandMask: number;
  rockMask: number;
  lavaMask: number;
  gasMask: number;
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

function clamp(v: number, a = 0, b = 1): number {
  return Math.max(a, Math.min(b, v));
}

function smoothstep(a: number, b: number, x: number): number {
  const t = clamp((x - a) / Math.max(1e-6, b - a));
  return t * t * (3 - 2 * t);
}

function fract(x: number): number {
  return x - Math.floor(x);
}

function hash3(x: number, y: number, z: number, seed: number): number {
  return fract(Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + seed * 0.0000017) * 43758.5453123);
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

  const nx00 = n000 + (n100 - n000) * ux;
  const nx10 = n010 + (n110 - n010) * ux;
  const nx01 = n001 + (n101 - n001) * ux;
  const nx11 = n011 + (n111 - n011) * ux;
  const nxy0 = nx00 + (nx10 - nx00) * uy;
  const nxy1 = nx01 + (nx11 - nx01) * uy;
  return nxy0 + (nxy1 - nxy0) * uz;
}

function fbm(x: number, y: number, z: number, seed: number, octaves = 5, lac = 2, pers = 0.5): number {
  let v = 0;
  let amp = 0.58;
  let freq = 1;
  for (let i = 0; i < octaves; i += 1) {
    v += noise3(x * freq, y * freq, z * freq, seed) * amp;
    freq *= lac;
    amp *= pers;
  }
  return v;
}

function ridged(x: number, y: number, z: number, seed: number): number {
  const n = fbm(x, y, z, seed, 4, 2.05, 0.54);
  return 1 - Math.abs(n * 2 - 1);
}

function sampleSolid(i: TerrainInput): TerrainSample {
  const { px, py, pz, seed, moistureSeed, thermalSeed, oceanLevel, family } = i;
  const lat = Math.abs(py);

  const warp = fbm(px * 1.4, py * 1.4, pz * 1.4, seed + 31, 3, 2.1, 0.5);
  const wx = px + (warp - 0.5) * 0.55;
  const wy = py + (warp - 0.5) * 0.55;
  const wz = pz + (warp - 0.5) * 0.55;

  const continentField = fbm(wx * 0.85, wy * 0.85, wz * 0.85, seed + 11, 5, 2.02, 0.54);
  const continentMask = smoothstep(0.42, 0.64, continentField);
  const continentCore = smoothstep(0.52, 0.7, continentField);

  const midMountain = ridged(wx * 5.2, wy * 5.2, wz * 5.2, seed + 77) * continentMask;
  const micro = fbm(wx * 12, wy * 12, wz * 12, seed + 121, 3, 2.04, 0.46) * (family === 'oceanic' ? 0.04 : 0.08);

  const humidity = clamp(fbm(wx * 2.2, wy * 2.2, wz * 2.2, moistureSeed, 4, 2.03, 0.53));
  const temperature = clamp((1 - lat) * 0.72 + (fbm(wx * 1.8, wy * 1.8, wz * 1.8, thermalSeed, 3, 2.1, 0.5) - 0.5) * 0.3);
  const erosionMask = smoothstep(0.34, 0.78, fbm(wx * 7.5, wy * 7.5, wz * 7.5, seed + 201, 3, 2.15, 0.55));

  let elevation = continentMask * 0.52 + continentCore * 0.1 + midMountain * 0.26 + micro;
  elevation -= erosionMask * 0.08;

  if (family === 'oceanic') elevation -= 0.1;
  if (family === 'desert-arid') elevation += (1 - humidity) * 0.07;
  if (family === 'ice-frozen') elevation -= smoothstep(0.58, 0.95, lat) * 0.05;

  const thermal = family === 'volcanic-infernal' ? smoothstep(0.52, 0.9, ridged(wx * 9, wy * 9, wz * 9, thermalSeed + 33)) : 0;
  const crater = family === 'barren-rocky' ? smoothstep(0.66, 0.94, fbm(wx * 14, wy * 14, wz * 14, seed + 333, 3, 2.2, 0.53)) : 0;

  elevation += thermal * 0.16;
  elevation -= crater * 0.1;

  const height01 = clamp(elevation);
  const landMask = smoothstep(oceanLevel - 0.02, oceanLevel + 0.02, height01);
  const coastMask = smoothstep(oceanLevel - 0.03, oceanLevel + 0.01, height01) - smoothstep(oceanLevel + 0.01, oceanLevel + 0.06, height01);
  const oceanDepth = 1 - smoothstep(oceanLevel - 0.23, oceanLevel + 0.02, height01);
  const mountainMask = smoothstep(oceanLevel + 0.15, oceanLevel + 0.35, height01) * smoothstep(0.3, 0.9, midMountain);

  const iceMask = family === 'ice-frozen'
    ? clamp(smoothstep(0.38, 0.8, fbm(wx * 3.1, wy * 3.1, wz * 3.1, seed + 451, 3, 2.03, 0.55)) * 0.72 + smoothstep(0.48, 0.96, lat) * 0.6)
    : smoothstep(0.82, 0.98, lat) * 0.2;
  const crackMask = family === 'ice-frozen'
    ? smoothstep(0.58, 0.92, ridged(wx * 18, wy * 18, wz * 18, seed + 499)) * iceMask
    : smoothstep(0.72, 0.94, ridged(wx * 14, wy * 14, wz * 14, seed + 219));

  const waterMask = 1 - landMask;
  const sandMask = landMask * (1 - humidity) * smoothstep(0.2, 0.66, temperature) * (1 - mountainMask);
  const iceMatMask = landMask * clamp(iceMask + (1 - temperature) * 0.25);
  const rockMask = landMask * clamp(mountainMask * 0.8 + crater * 0.5 + (1 - humidity) * 0.2);
  const lavaMask = landMask * thermal;
  const soilMask = landMask * clamp(1 - sandMask - iceMatMask - rockMask * 0.52 - lavaMask * 0.9);

  const biomeMask = clamp(temperature * 0.5 + humidity * 0.4 + continentCore * 0.2 - thermal * 0.15);

  return {
    height01,
    continentMask,
    mountainMask,
    landMask,
    coastMask,
    oceanDepth,
    humidityMask: humidity,
    temperatureMask: temperature,
    erosionMask,
    craterMask: crater,
    thermalMask: thermal,
    biomeMask,
    iceMask,
    crackMask,
    bandMask: 0,
    waterMask,
    soilMask,
    sandMask,
    rockMask,
    lavaMask,
    gasMask: 0,
  };
}

function sampleGaseous(i: TerrainInput): TerrainSample {
  const { px, py, pz, seed, moistureSeed, thermalSeed, bandingStrength, family } = i;
  const latitude = py * 0.5 + 0.5;

  const jets = Math.sin((latitude + seed * 1.3e-7) * (16 + bandingStrength * 40)) * 0.5 + 0.5;
  const shear = Math.sin((latitude * 1.7 + px * 0.16 + seed * 1.9e-7) * (10 + bandingStrength * 21)) * 0.5 + 0.5;
  const turbulence = fbm(px * 4.5, py * 2.3, pz * 4.5, seed + 19, 5, 2.18, 0.55);
  const storms = smoothstep(0.56, 0.9, ridged(px * 9.8, py * 4.2, pz * 9.8, thermalSeed + 47));

  const humidity = smoothstep(0.22, 0.86, fbm(px * 3.8, py * 2.2, pz * 3.8, moistureSeed, 4, 2.04, 0.53));
  const temperature = smoothstep(0.18, 0.82, fbm(px * 2.2, py * 2.0, pz * 2.2, thermalSeed, 4, 2.01, 0.52));

  const bandMask = clamp(jets * 0.5 + shear * 0.24 + turbulence * 0.16 + storms * 0.25);
  const thermalMask = family === 'ringed-giant' ? storms * 0.86 : storms;

  return {
    height01: 0.5,
    continentMask: 0,
    mountainMask: 0,
    landMask: 0,
    coastMask: 0,
    oceanDepth: 0,
    humidityMask: humidity,
    temperatureMask: temperature,
    erosionMask: turbulence,
    craterMask: 0,
    thermalMask,
    biomeMask: clamp(temperature * 0.6 + humidity * 0.4),
    iceMask: 0,
    crackMask: storms * 0.28,
    bandMask,
    waterMask: 0,
    soilMask: 0,
    sandMask: 0,
    rockMask: 0,
    lavaMask: 0,
    gasMask: 1,
  };
}

export function sampleTerrain(input: TerrainInput): TerrainSample {
  if (input.surfaceModel === 'gaseous') return sampleGaseous(input);
  return sampleSolid(input);
}
