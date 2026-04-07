export interface TerrainSample {
  height01: number;
  continentMask: number;
  mountainMask: number;
  landMask: number;
  coastMask: number;
  oceanDepth: number;
}

function fract(value: number): number {
  return value - Math.floor(value);
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / Math.max(1e-6, edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function hash3(x: number, y: number, z: number, seed: number): number {
  const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + seed * 0.0000013) * 43758.5453;
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

function fbm(
  x: number,
  y: number,
  z: number,
  seed: number,
  octaves: number,
  lacunarity: number,
  persistence: number,
  startAmp = 0.5,
): number {
  let value = 0;
  let amplitude = startAmp;
  let frequency = 1;

  for (let i = 0; i < octaves; i += 1) {
    value += noise3(x * frequency, y * frequency, z * frequency, seed) * amplitude;
    frequency *= lacunarity;
    amplitude *= persistence;
  }

  return value;
}

function ridged(x: number, y: number, z: number, seed: number, octaves: number): number {
  let total = 0;
  let amp = 0.65;
  let freq = 1;
  let weight = 1;

  for (let i = 0; i < octaves; i += 1) {
    const n = noise3(x * freq, y * freq, z * freq, seed);
    let ridge = 1 - Math.abs(n * 2 - 1);
    ridge *= ridge;
    ridge *= weight;
    weight = Math.max(0.15, Math.min(1, ridge * 1.8));

    total += ridge * amp;
    freq *= 2.08;
    amp *= 0.55;
  }

  return total;
}

export function sampleTerrain(px: number, py: number, pz: number, seed: number, banding: number): TerrainSample {
  const continentBase = fbm(px * 0.9, py * 0.9, pz * 0.9, seed + 11, 5, 2.01, 0.5, 0.72);
  const continentWarp = fbm(px * 1.7, py * 1.7, pz * 1.7, seed + 19, 3, 2.2, 0.48, 0.34);
  const continentField = continentBase + (continentWarp - 0.22) * 0.26;
  const continentMask = smoothstep(0.36, 0.63, continentField);

  const seaLevel = 0.5 - banding * 0.05;

  const foothills = fbm(px * 2.6, py * 2.6, pz * 2.6, seed + 31, 4, 2.05, 0.52, 0.38);
  const mountainChains = ridged(px * 4.6, py * 4.6, pz * 4.6, seed + 67, 5) * smoothstep(0.45, 0.9, continentMask);
  const alpineDetail = ridged(px * 10.4, py * 10.4, pz * 10.4, seed + 97, 3) * mountainChains * 0.42;

  const landElevation = continentMask * 0.46 + foothills * 0.2 + mountainChains * 0.34 + alpineDetail * 0.08;
  const abyss = fbm(px * 2.2, py * 2.2, pz * 2.2, seed + 131, 3, 2.2, 0.5, 0.28) * 0.14;
  const height01 = Math.max(0, Math.min(1, landElevation + (continentMask - 0.5) * 0.1 - abyss));

  const landMask = smoothstep(seaLevel - 0.02, seaLevel + 0.02, height01);
  const coastMask = smoothstep(seaLevel - 0.016, seaLevel + 0.008, height01) - smoothstep(seaLevel + 0.008, seaLevel + 0.035, height01);
  const mountainMask = smoothstep(seaLevel + 0.14, seaLevel + 0.32, height01) * smoothstep(0.45, 0.95, mountainChains);
  const oceanDepth = 1 - smoothstep(seaLevel - 0.2, seaLevel + 0.01, height01);

  return {
    height01,
    continentMask,
    mountainMask,
    landMask,
    coastMask,
    oceanDepth,
  };
}
