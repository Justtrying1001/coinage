import type { PlanetFamily, PlanetSurfaceModel } from '@/domain/world/planet-visual.types';

export interface TerrainFields {
  elevation: number;
  waterMask: number;
  slope: number;
  humidity: number;
  temperature: number;
  thermal: number;
  rockMask: number;
  sedimentMask: number;
  snowMask: number;
  lavaMask: number;
}

interface TerrainInput {
  x: number;
  y: number;
  z: number;
  seed: number;
  moistureSeed: number;
  thermalSeed: number;
  oceanLevel: number;
  family: PlanetFamily;
  surfaceModel: PlanetSurfaceModel;
}

function clamp(v: number, min: number, max: number): number { return Math.max(min, Math.min(max, v)); }
function smoothstep(a: number, b: number, x: number): number {
  const t = clamp((x - a) / Math.max(1e-6, b - a), 0, 1);
  return t * t * (3 - 2 * t);
}
function fract(v: number): number { return v - Math.floor(v); }
function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }

function hash3(x: number, y: number, z: number, seed: number): number {
  return fract(Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + seed * 0.0000013) * 43758.5453123);
}

function noise3(x: number, y: number, z: number, seed: number): number {
  const ix = Math.floor(x); const iy = Math.floor(y); const iz = Math.floor(z);
  const fx = x - ix; const fy = y - iy; const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx); const uy = fy * fy * (3 - 2 * fy); const uz = fz * fz * (3 - 2 * fz);

  const n000 = hash3(ix, iy, iz, seed); const n100 = hash3(ix + 1, iy, iz, seed);
  const n010 = hash3(ix, iy + 1, iz, seed); const n110 = hash3(ix + 1, iy + 1, iz, seed);
  const n001 = hash3(ix, iy, iz + 1, seed); const n101 = hash3(ix + 1, iy, iz + 1, seed);
  const n011 = hash3(ix, iy + 1, iz + 1, seed); const n111 = hash3(ix + 1, iy + 1, iz + 1, seed);

  const nx00 = lerp(n000, n100, ux); const nx10 = lerp(n010, n110, ux);
  const nx01 = lerp(n001, n101, ux); const nx11 = lerp(n011, n111, ux);

  const nxy0 = lerp(nx00, nx10, uy); const nxy1 = lerp(nx01, nx11, uy);
  return lerp(nxy0, nxy1, uz);
}

function fbm(x: number, y: number, z: number, seed: number, octaves = 5, lacunarity = 2, persistence = 0.5): number {
  let value = 0;
  let amp = 0.6;
  let freq = 1;
  for (let i = 0; i < octaves; i += 1) {
    value += noise3(x * freq, y * freq, z * freq, seed) * amp;
    freq *= lacunarity;
    amp *= persistence;
  }
  return value;
}

function ridged(x: number, y: number, z: number, seed: number, octaves = 4): number {
  let value = 0;
  let amp = 0.75;
  let freq = 1;
  for (let i = 0; i < octaves; i += 1) {
    const n = noise3(x * freq, y * freq, z * freq, seed);
    const r = 1 - Math.abs(n * 2 - 1);
    value += r * r * amp;
    amp *= 0.55;
    freq *= 2.1;
  }
  return value;
}

export function sampleTerrainFields(input: TerrainInput): TerrainFields {
  const { x, y, z, seed, moistureSeed, thermalSeed, oceanLevel, family, surfaceModel } = input;
  const lat = Math.abs(y);

  if (surfaceModel === 'gaseous') {
    const jets = Math.sin((y * 0.5 + 0.5 + seed * 0.00000007) * 24.0) * 0.5 + 0.5;
    const turbulence = fbm(x * 2.1, y * 2.1, z * 2.1, seed + 19, 3, 2.1, 0.55);
    const storms = smoothstep(0.62, 0.9, fbm(x * 4.5, y * 4.5, z * 4.5, thermalSeed + 71, 3));
    return {
      elevation: clamp((turbulence - 0.5) * 0.04, -0.05, 0.05),
      waterMask: 0,
      slope: clamp((jets * 0.6 + turbulence * 0.4), 0, 1),
      humidity: smoothstep(0.3, 0.85, fbm(x * 2.3, y * 2.3, z * 2.3, moistureSeed, 3)),
      temperature: smoothstep(0.24, 0.84, fbm(x * 1.4, y * 1.4, z * 1.4, thermalSeed, 2)),
      thermal: storms,
      rockMask: 0.35,
      sedimentMask: 0.65,
      snowMask: 0,
      lavaMask: 0,
    };
  }

  const continent = fbm(x * 0.7, y * 0.7, z * 0.7, seed + 7, 4, 2.0, 0.52);
  const macroRidge = ridged(x * 1.1, y * 1.1, z * 1.1, seed + 41, 3);
  const mountain = ridged(x * 2.6, y * 2.6, z * 2.6, seed + 89, 4);
  const micro = fbm(x * 6.5, y * 6.5, z * 6.5, seed + 137, 2, 2.0, 0.5);
  const humidity = smoothstep(0.25, 0.8, fbm(x * 1.9, y * 1.9, z * 1.9, moistureSeed, 3));
  const temperature = clamp((1 - lat) * 0.72 + (fbm(x * 1.4, y * 1.4, z * 1.4, thermalSeed, 2) - 0.5) * 0.3, 0, 1);
  const thermal = family === 'volcanic-infernal' ? smoothstep(0.58, 0.9, fbm(x * 3.8, y * 3.8, z * 3.8, thermalSeed + 109, 3)) : 0;

  const macro = (continent - 0.5) * 0.75 + (macroRidge - 0.5) * 0.7;
  const mid = (mountain - 0.45) * 0.45;
  const detail = (micro - 0.5) * 0.16;
  let elevation = macro + mid + detail + thermal * 0.08;

  if (family === 'oceanic') elevation *= 0.58;
  if (family === 'ice-frozen') elevation *= 0.72;
  if (family === 'barren-rocky') elevation *= 1.08;
  if (family === 'volcanic-infernal') elevation *= 1.22;

  const waterMask = 1 - smoothstep(oceanLevel - 0.03, oceanLevel + 0.03, elevation + 0.5);
  const slope = smoothstep(0.45, 0.95, mountain * 0.72 + macroRidge * 0.28);

  let snowMask = smoothstep(0.62, 0.96, lat) * smoothstep(0.18, 0.65, 1 - temperature);
  if (family === 'ice-frozen') snowMask = clamp(snowMask + 0.46, 0, 1);

  const lavaMask = family === 'volcanic-infernal' ? smoothstep(0.5, 0.92, thermal + slope * 0.2) : 0;
  const rockMask = clamp(slope * 0.75 + (1 - humidity) * 0.25 + lavaMask * 0.3, 0, 1);
  const sedimentMask = clamp((1 - slope) * (0.66 + humidity * 0.34) * (1 - lavaMask * 0.6), 0, 1);

  return {
    elevation: clamp(elevation, -0.6, 0.7),
    waterMask: clamp(waterMask, 0, 1),
    slope,
    humidity,
    temperature,
    thermal,
    rockMask,
    sedimentMask,
    snowMask,
    lavaMask,
  };
}
