import * as THREE from 'three';

type MaterialMaps = {
  albedo: THREE.DataTexture;
  normal: THREE.DataTexture;
  roughness: THREE.DataTexture;
  ao: THREE.DataTexture;
};

export interface PlanetMaterialTextureStack {
  rock: MaterialMaps;
  sediment: MaterialMaps;
  snow: MaterialMaps;
  lava: MaterialMaps;
  wetness: MaterialMaps;
  waterNormal: THREE.DataTexture;
}

let CACHE: PlanetMaterialTextureStack | null = null;

function fract(x: number): number {
  return x - Math.floor(x);
}

function hash2(x: number, y: number, seed: number): number {
  return fract(Math.sin(x * 127.1 + y * 311.7 + seed * 13.37) * 43758.5453);
}

function makeTexture(size: number, fn: (x: number, y: number) => [number, number, number, number]): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const idx = (y * size + x) * 4;
      const [r, g, b, a] = fn(x / size, y / size);
      data[idx] = Math.max(0, Math.min(255, Math.round(r * 255)));
      data[idx + 1] = Math.max(0, Math.min(255, Math.round(g * 255)));
      data[idx + 2] = Math.max(0, Math.min(255, Math.round(b * 255)));
      data[idx + 3] = Math.max(0, Math.min(255, Math.round(a * 255)));
    }
  }

  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeMaterial(seed: number, c1: [number, number, number], c2: [number, number, number], roughBase: number): MaterialMaps {
  const size = 128;

  const albedo = makeTexture(size, (u, v) => {
    const n1 = hash2(u * 64, v * 64, seed);
    const n2 = hash2(u * 140 + 3.1, v * 140 - 2.7, seed + 7);
    const streak = Math.sin((u * 22 + v * 13 + seed) * Math.PI) * 0.5 + 0.5;
    const t = Math.max(0, Math.min(1, n1 * 0.55 + n2 * 0.35 + streak * 0.1));
    return [
      c1[0] * (1 - t) + c2[0] * t,
      c1[1] * (1 - t) + c2[1] * t,
      c1[2] * (1 - t) + c2[2] * t,
      1,
    ];
  });

  const normal = makeTexture(size, (u, v) => {
    const nx = Math.sin((u * 33 + seed) * Math.PI * 2) * 0.5 + 0.5;
    const ny = Math.cos((v * 31 + seed * 0.7) * Math.PI * 2) * 0.5 + 0.5;
    const nz = 1.0;
    return [nx, ny, nz, 1];
  });
  normal.colorSpace = THREE.NoColorSpace;

  const roughness = makeTexture(size, (u, v) => {
    const n = hash2(u * 96.0, v * 96.0, seed + 17);
    const r = Math.max(0.04, Math.min(0.98, roughBase + (n - 0.5) * 0.25));
    return [r, r, r, 1];
  });
  roughness.colorSpace = THREE.NoColorSpace;

  const ao = makeTexture(size, (u, v) => {
    const n = hash2(u * 55.0, v * 55.0, seed + 29);
    const a = 0.7 + n * 0.3;
    return [a, a, a, 1];
  });
  ao.colorSpace = THREE.NoColorSpace;

  return { albedo, normal, roughness, ao };
}

function makeWaterNormal(seed: number): THREE.DataTexture {
  const tex = makeTexture(128, (u, v) => {
    const wave1 = Math.sin((u * 28 + v * 16 + seed) * Math.PI * 2);
    const wave2 = Math.cos((u * 19 - v * 22 + seed * 0.6) * Math.PI * 2);
    const nx = wave1 * 0.35 + 0.5;
    const ny = wave2 * 0.35 + 0.5;
    const nz = 1;
    return [nx, ny, nz, 1];
  });
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

export function getPlanetMaterialTextureStack(): PlanetMaterialTextureStack {
  if (CACHE) return CACHE;

  CACHE = {
    rock: makeMaterial(11, [0.22, 0.20, 0.19], [0.52, 0.50, 0.48], 0.74),
    sediment: makeMaterial(19, [0.38, 0.30, 0.22], [0.70, 0.62, 0.48], 0.62),
    snow: makeMaterial(29, [0.68, 0.74, 0.82], [0.95, 0.97, 1.0], 0.36),
    lava: makeMaterial(37, [0.32, 0.08, 0.02], [0.98, 0.42, 0.08], 0.44),
    wetness: makeMaterial(43, [0.10, 0.14, 0.18], [0.24, 0.30, 0.36], 0.22),
    waterNormal: makeWaterNormal(53),
  };

  return CACHE;
}
