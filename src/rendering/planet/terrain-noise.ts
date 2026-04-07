export interface TerrainSample {
  height01: number;
  landMask: number;
  mountainMask: number;
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

function fbm(x: number, y: number, z: number, seed: number, octaves: number, lacunarity: number, persistence: number): number {
  let value = 0;
  let amplitude = 0.56;
  let frequency = 1;

  for (let i = 0; i < octaves; i += 1) {
    value += noise3(x * frequency, y * frequency, z * frequency, seed) * amplitude;
    frequency *= lacunarity;
    amplitude *= persistence;
  }

  return value;
}

function ridged(x: number, y: number, z: number, seed: number): number {
  let total = 0;
  let amp = 0.62;
  let freq = 1;

  for (let i = 0; i < 4; i += 1) {
    const n = noise3(x * freq, y * freq, z * freq, seed);
    const ridge = 1 - Math.abs(n * 2 - 1);
    total += ridge * ridge * amp;
    freq *= 2.1;
    amp *= 0.55;
  }

  return total;
}

export function sampleTerrain(px: number, py: number, pz: number, seed: number, banding: number): TerrainSample {
  const continents = smoothstep(0.32, 0.68, fbm(px * 1.2, py * 1.2, pz * 1.2, seed + 13, 6, 2.03, 0.52));
  const erosion = fbm(px * 2.4, py * 2.4, pz * 2.4, seed + 37, 5, 2.1, 0.5);
  const mountains = ridged(px * 4.8, py * 4.8, pz * 4.8, seed + 73) * smoothstep(0.44, 0.78, continents);
  const detail = fbm(px * 9.2, py * 9.2, pz * 9.2, seed + 131, 3, 2.4, 0.5) * 0.08;

  const height01 = continents * 0.58 + erosion * 0.23 + mountains * 0.42 + detail;
  const oceanThreshold = 0.5 - banding * 0.06;

  return {
    height01,
    landMask: smoothstep(oceanThreshold - 0.03, oceanThreshold + 0.02, height01),
    mountainMask: smoothstep(0.64, 0.87, height01),
  };
}
