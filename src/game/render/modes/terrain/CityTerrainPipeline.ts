import * as THREE from 'three';
import { CITY_BIOME_SPECS } from '@/game/render/modes/terrain/CityBiomeSpecs';
import type {
  BuildSurfaceSnapshot,
  CityLayoutMaskSource,
  CityTerrainInput,
  TerrainGeometryConfig,
  TerrainSample,
} from '@/game/render/modes/terrain/CityTerrainTypes';

export const DEFAULT_TERRAIN_GEOMETRY: TerrainGeometryConfig = {
  terrainWidth: 420,
  terrainDepth: 340,
  farWidth: 1320,
  farDepth: 1080,
  nearSegmentsX: 300,
  nearSegmentsZ: 240,
  farSegmentsX: 260,
  farSegmentsZ: 220,
};

interface TerrainBuildResult {
  nearGeometry: THREE.PlaneGeometry;
  farGeometry: THREE.PlaneGeometry;
  buildSurface: BuildSurfaceSnapshot;
}

export function buildTerrainGeometry(
  input: CityTerrainInput,
  layout: CityLayoutMaskSource,
  config: TerrainGeometryConfig = DEFAULT_TERRAIN_GEOMETRY,
): TerrainBuildResult {
  const near = new THREE.PlaneGeometry(config.terrainWidth, config.terrainDepth, config.nearSegmentsX, config.nearSegmentsZ);
  near.rotateX(-Math.PI / 2);
  const nearMasks = applyHeights(near, input, layout, config, false);
  near.computeVertexNormals();

  const far = new THREE.PlaneGeometry(config.farWidth, config.farDepth, config.farSegmentsX, config.farSegmentsZ);
  far.rotateX(-Math.PI / 2);
  applyHeights(far, input, layout, config, true);
  far.computeVertexNormals();

  return {
    nearGeometry: near,
    farGeometry: far,
    buildSurface: extractBuildSurface(near, nearMasks, config),
  };
}

interface RuntimeMasks {
  height: Float32Array;
  slope: Float32Array;
  cliff: Float32Array;
  wetness: Float32Array;
  shoreline: Float32Array;
  frozen: Float32Array;
  thermal: Float32Array;
  mineralized: Float32Array;
  vegetation: Float32Array;
  buildable: Float32Array;
  blocked: Float32Array;
  expansion: Float32Array;
  risk: Float32Array;
}

function applyHeights(
  geometry: THREE.PlaneGeometry,
  input: CityTerrainInput,
  layout: CityLayoutMaskSource,
  config: TerrainGeometryConfig,
  farField: boolean,
): RuntimeMasks {
  const pos = geometry.attributes.position;
  const masks: RuntimeMasks = {
    height: new Float32Array(pos.count),
    slope: new Float32Array(pos.count),
    cliff: new Float32Array(pos.count),
    wetness: new Float32Array(pos.count),
    shoreline: new Float32Array(pos.count),
    frozen: new Float32Array(pos.count),
    thermal: new Float32Array(pos.count),
    mineralized: new Float32Array(pos.count),
    vegetation: new Float32Array(pos.count),
    buildable: new Float32Array(pos.count),
    blocked: new Float32Array(pos.count),
    expansion: new Float32Array(pos.count),
    risk: new Float32Array(pos.count),
  };

  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const sample = sampleTerrain(input, layout, x, z, config, farField);
    pos.setY(i, sample.height);

    masks.height[i] = sample.masks.height01;
    masks.slope[i] = sample.masks.slope;
    masks.cliff[i] = sample.masks.cliff;
    masks.wetness[i] = sample.masks.wetness;
    masks.shoreline[i] = sample.masks.shoreline;
    masks.frozen[i] = sample.masks.frozen;
    masks.thermal[i] = sample.masks.thermal;
    masks.mineralized[i] = sample.masks.mineralized;
    masks.vegetation[i] = sample.masks.vegetationSuitability;

    const state = sampleBuildState(layout, x, z, config, input);
    masks.buildable[i] = state.buildable;
    masks.blocked[i] = state.blocked;
    masks.expansion[i] = state.expansion;
    masks.risk[i] = clamp(
      sample.masks.slope * 0.45
        + (1 - sample.masks.shoreline) * (input.archetype === 'oceanic' ? 0.25 : 0.1)
        + sample.masks.cliff * 0.2,
      0,
      1,
    );
  }

  pos.needsUpdate = true;
  geometry.setAttribute('aHeight01', new THREE.BufferAttribute(masks.height, 1));
  geometry.setAttribute('aSlope', new THREE.BufferAttribute(masks.slope, 1));
  geometry.setAttribute('aCliff', new THREE.BufferAttribute(masks.cliff, 1));
  geometry.setAttribute('aWetness', new THREE.BufferAttribute(masks.wetness, 1));
  geometry.setAttribute('aShoreline', new THREE.BufferAttribute(masks.shoreline, 1));
  geometry.setAttribute('aFrozen', new THREE.BufferAttribute(masks.frozen, 1));
  geometry.setAttribute('aThermal', new THREE.BufferAttribute(masks.thermal, 1));
  geometry.setAttribute('aMineralized', new THREE.BufferAttribute(masks.mineralized, 1));
  geometry.setAttribute('aVegetation', new THREE.BufferAttribute(masks.vegetation, 1));
  geometry.setAttribute('aBuildable', new THREE.BufferAttribute(masks.buildable, 1));
  geometry.setAttribute('aBlocked', new THREE.BufferAttribute(masks.blocked, 1));
  geometry.setAttribute('aExpansion', new THREE.BufferAttribute(masks.expansion, 1));
  geometry.setAttribute('aRisk', new THREE.BufferAttribute(masks.risk, 1));

  return masks;
}

function sampleBuildState(
  layout: CityLayoutMaskSource,
  x: number,
  z: number,
  config: TerrainGeometryConfig,
  input: CityTerrainInput,
) {
  const nx = x / config.terrainWidth;
  const nz = z / config.terrainDepth;

  const tx = Math.floor(((nx + 0.5) * 20));
  const ty = Math.floor(((nz + 0.5) * 14));
  const key = `${clamp(tx, 0, 19)},${clamp(ty, 0, 13)}`;

  const blocked = layout.blocked.has(key) ? 1 : 0;
  const expansion = layout.expansion.has(key) ? 1 : 0;
  const ellipse = smoothEllipse(
    nx - input.local.playableOffsetX,
    nz - input.local.playableOffsetZ,
    input.local.playableRadiusX,
    input.local.playableRadiusZ,
  );

  const buildable = clamp(ellipse * (1 - blocked) * (1 - expansion * 0.65), 0, 1);
  return { blocked, expansion, buildable };
}

export function sampleTerrain(
  input: CityTerrainInput,
  _layout: CityLayoutMaskSource,
  x: number,
  z: number,
  config: TerrainGeometryConfig,
  farField: boolean,
): TerrainSample {
  const spec = CITY_BIOME_SPECS[input.archetype];

  const nx = x / (farField ? config.farWidth : config.terrainWidth);
  const nz = z / (farField ? config.farDepth : config.terrainDepth);
  const wx = nx * 3.2 + input.local.originX;
  const wz = nz * 3.2 + input.local.originZ;

  const continental = fbm2(wx * input.shape.continentScale * 0.7, wz * input.shape.continentScale * 0.7, input.seed ^ 0x33a2, 5);
  const ridges = ridgeNoise(wx * input.shape.ridgeScale * 0.2, wz * input.shape.ridgeScale * 0.2, input.seed ^ 0x99d1);
  const basins = fbm2(wx * input.shape.craterScale * 0.2, wz * input.shape.craterScale * 0.2, input.seed ^ 0x118f, 3);
  const micro = fbm2(wx * input.material.microReliefScale * 0.5, wz * input.material.microReliefScale * 0.5, input.seed ^ 0x6f, 3)
    * (0.3 + input.material.microReliefStrength * 0.9);

  const playable = smoothEllipse(
    nx - input.local.playableOffsetX,
    nz - input.local.playableOffsetZ,
    input.local.playableRadiusX,
    input.local.playableRadiusZ,
  );

  const coastDistance = nx * input.local.coastDirX + nz * input.local.coastDirZ + input.local.coastBias;
  let shorelineMask = smoothstep(-0.18, 0.26, coastDistance + continental * 0.14);
  if (input.archetype === 'oceanic') shorelineMask = smoothstep(-0.32, 0.2, coastDistance + continental * 0.16);

  let baseHeight = continental * (20 + input.shape.reliefStrength * 22)
    + ridges * (spec.ridgeGain * 14 + input.shape.ridgeWeight * 8)
    - basins * (spec.basinBias * 12 + input.shape.craterWeight * 7)
    + micro * 3.8;

  const playableTarget = mix(baseHeight, baseHeight * 0.5 + spec.coreLift * 2.3, playable * 0.9);
  baseHeight = mix(baseHeight, playableTarget, playable);

  if (input.archetype === 'oceanic') {
    const lagoon = smoothstep(-0.24, 0.12, coastDistance + continental * 0.1);
    baseHeight = mix(baseHeight - 10.5, baseHeight + 1.3, lagoon);
  }

  if (input.archetype === 'frozen') {
    const fracture = smoothstep(0.32, 0.88, Math.abs(fbm2(wx * 5.8, wz * 5.8, input.seed ^ 0x8181, 3))) * spec.fractureStrength;
    baseHeight -= fracture * 5.8;
    shorelineMask = mix(shorelineMask, shorelineMask * 0.55 + 0.35, 0.4);
  }

  if (input.archetype === 'arid') {
    const dunes = fbm2(wx * 10.5, wz * 10.5, input.seed ^ 0x4a4a, 4) * spec.duneStrength * 5.2;
    baseHeight += dunes;
  }

  if (input.archetype === 'volcanic') {
    const faults = ridgeNoise(wx * 2.6, wz * 2.6, input.seed ^ 0xee11);
    baseHeight += smoothstep(0.4, 0.9, faults) * 8.2;
  }

  if (input.archetype === 'mineral') {
    const strata = ridgeNoise(wx * 3.2, wz * 3.2, input.seed ^ 0x1313);
    baseHeight += smoothstep(0.35, 0.9, strata) * 6.1;
  }

  const edgeMask = smoothstep(0.88, 1.22, Math.max(Math.abs(nx), Math.abs(nz)));
  let heightValue = baseHeight - edgeMask * (12 + spec.edgeDrop * 0.4);

  if (farField) {
    heightValue = heightValue * 1.25 - 10.5;
  }

  const slopeMask = clamp(Math.abs(ridges) * 0.6 + Math.abs(micro) * 0.42 + edgeMask * 0.25, 0, 1);
  const cliffMask = smoothstep(0.48, 0.86, slopeMask + (1 - shorelineMask) * 0.15);

  const wetBase = clamp(input.climate.humidity + spec.wetnessBoost, 0, 1);
  const frozenMask = clamp(input.climate.frozen + input.shape.polarWeight * 0.38 + (input.archetype === 'frozen' ? 0.3 : 0), 0, 1);
  const thermalMask = clamp(input.climate.thermal + (input.archetype === 'volcanic' ? cliffMask * 0.45 : 0), 0, 1);
  const mineralMask = clamp(input.climate.minerality + (input.archetype === 'mineral' ? cliffMask * 0.36 : 0), 0, 1);
  const wetnessMask = clamp(wetBase + shorelineMask * 0.4 - slopeMask * 0.22, 0, 1);
  const vegetationSuitability = clamp(
    wetnessMask * (1 - thermalMask * 0.84) * (1 - cliffMask * 0.68) * (0.35 + input.climate.vegetation),
    0,
    1,
  );

  return {
    height: heightValue,
    masks: {
      height01: clamp((heightValue + 52) / 120, 0, 1),
      slope: slopeMask,
      cliff: cliffMask,
      wetness: wetnessMask,
      shoreline: shorelineMask,
      frozen: frozenMask,
      thermal: thermalMask,
      mineralized: mineralMask,
      vegetationSuitability,
    },
  };
}

function extractBuildSurface(geometry: THREE.PlaneGeometry, masks: RuntimeMasks, config: TerrainGeometryConfig): BuildSurfaceSnapshot {
  const pos = geometry.attributes.position;
  const stableMask = new Float32Array(pos.count);

  for (let i = 0; i < pos.count; i += 1) {
    const nx = pos.getX(i) / config.terrainWidth;
    const nz = pos.getZ(i) / config.terrainDepth;
    const inner = smoothEllipse(nx, nz, 0.45, 0.34);
    stableMask[i] = clamp(
      masks.buildable[i]
      * inner
      * (1 - smoothstep(0.34, 0.72, masks.slope[i]))
      * (1 - masks.risk[i] * 0.5),
      0,
      1,
    );
  }

  return {
    width: config.terrainWidth,
    depth: config.terrainDepth,
    heights: masks.height,
    slopes: masks.slope,
    stableMask,
    buildableMask: masks.buildable,
    blockedMask: masks.blocked,
    expansionMask: masks.expansion,
    riskMask: masks.risk,
  };
}

function smoothEllipse(x: number, z: number, rx: number, rz: number) {
  const d = Math.sqrt((x * x) / (rx * rx) + (z * z) / (rz * rz));
  return smoothstep(1.05, 0.08, d);
}

function fbm2(x: number, y: number, seed: number, octaves: number) {
  let amplitude = 0.5;
  let frequency = 1;
  let value = 0;
  for (let i = 0; i < octaves; i += 1) {
    value += amplitude * valueNoise2(x * frequency, y * frequency, seed + i * 31);
    amplitude *= 0.5;
    frequency *= 2;
  }
  return value;
}

function ridgeNoise(x: number, y: number, seed: number) {
  return 1 - Math.abs(fbm2(x, y, seed, 4));
}

function valueNoise2(x: number, y: number, seed: number) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = x0 + 1;
  const y1 = y0 + 1;

  const sx = smooth(fract(x));
  const sy = smooth(fract(y));

  const n00 = hash2(x0, y0, seed);
  const n10 = hash2(x1, y0, seed);
  const n01 = hash2(x0, y1, seed);
  const n11 = hash2(x1, y1, seed);

  const nx0 = mix(n00, n10, sx);
  const nx1 = mix(n01, n11, sx);
  return mix(nx0, nx1, sy) * 2 - 1;
}

function hash2(x: number, y: number, seed: number) {
  let n = x * 374761393 + y * 668265263 + seed * 69069;
  n = (n ^ (n >> 13)) * 1274126177;
  n ^= n >> 16;
  return ((n >>> 0) & 0xffffffff) / 0xffffffff;
}

function fract(value: number) {
  return value - Math.floor(value);
}

function smooth(t: number) {
  return t * t * (3 - 2 * t);
}

function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1), 0, 1);
  return t * t * (3 - 2 * t);
}
