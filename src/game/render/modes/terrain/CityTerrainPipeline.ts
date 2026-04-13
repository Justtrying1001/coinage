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
  terrainWidth: 620,
  terrainDepth: 560,
  farWidth: 2000,
  farDepth: 1700,
  nearSegmentsX: 260,
  nearSegmentsZ: 220,
  farSegmentsX: 240,
  farSegmentsZ: 200,
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

    const state = sampleBuildState(layout, x, z, config, input, sample.masks.slope);
    masks.buildable[i] = state.buildable;
    masks.blocked[i] = state.blocked;
    masks.expansion[i] = state.expansion;
    masks.risk[i] = state.risk;
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
  slope: number,
) {
  const nx = x / config.terrainWidth;
  const nz = z / config.terrainDepth;

  const tx = Math.floor((nx + 0.5) * 20);
  const ty = Math.floor((nz + 0.5) * 14);
  const key = `${clamp(Math.round(tx), 0, 19)},${clamp(Math.round(ty), 0, 13)}`;

  const blocked = layout.blocked.has(key) ? 1 : 0;
  const expansion = layout.expansion.has(key) ? 1 : 0;

  const foregroundBand = smoothstep(-0.02, 0.46, nz);
  const sideFalloff = smoothstep(0.72, 0.08, Math.abs(nx));
  const buildPad = foregroundBand * sideFalloff;
  const slopePenalty = smoothstep(0.08, 0.2, slope);

  const buildable = clamp(buildPad * (1 - blocked) * (1 - expansion * 0.45) * (1 - slopePenalty), 0, 1);
  const risk = clamp((1 - buildPad) * 0.65 + slopePenalty * 0.55 + blocked * 0.3, 0, 1);

  return { blocked, expansion, buildable, risk };
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

  const foregroundBand = smoothstep(0.0, 0.46, nz);
  const midBand = smoothstep(-0.22, 0.12, nz) * (1 - foregroundBand * 0.85);
  const backgroundBand = smoothstep(0.06, -0.56, nz);

  const continental = fbm2(wx * input.shape.continentScale * 0.6, wz * input.shape.continentScale * 0.6, input.seed ^ 0x33a2, 5);
  const ridges = ridgeNoise(wx * input.shape.ridgeScale * 0.22, wz * input.shape.ridgeScale * 0.22, input.seed ^ 0x99d1);
  const basins = fbm2(wx * input.shape.craterScale * 0.18, wz * input.shape.craterScale * 0.18, input.seed ^ 0x118f, 3);
  const micro = fbm2(wx * input.material.microReliefScale * 0.34, wz * input.material.microReliefScale * 0.34, input.seed ^ 0x6f, 2);

  const coastDistance = nx * input.local.coastDirX + nz * input.local.coastDirZ + input.local.coastBias;
  let shorelineMask = smoothstep(-0.16, 0.24, coastDistance + continental * 0.12);
  if (input.archetype === 'oceanic') shorelineMask = smoothstep(-0.3, 0.16, coastDistance + continental * 0.14);

  const padMicro = micro * 0.08;
  const baseFlat = 10.5 + spec.coreLift * 0.6 + continental * 0.35 + padMicro;

  let midRelief = (continental * 2.2 + ridges * 1.8 - basins * 1.2) * midBand;
  let backRelief = (continental * 22 + ridges * 18 - basins * 12 + micro * 5.2) * backgroundBand;

  if (input.archetype === 'arid') {
    backRelief += fbm2(wx * 8.4, wz * 8.4, input.seed ^ 0x4a4a, 3) * 12.5 * backgroundBand;
  }

  if (input.archetype === 'frozen') {
    const fracture = smoothstep(0.34, 0.9, Math.abs(fbm2(wx * 6.2, wz * 6.2, input.seed ^ 0x8181, 3))) * spec.fractureStrength;
    backRelief -= fracture * 11.2 * backgroundBand;
    midRelief -= fracture * 1.8 * midBand;
    shorelineMask = mix(shorelineMask, shorelineMask * 0.62 + 0.28, 0.38);
  }

  if (input.archetype === 'volcanic') {
    const faults = ridgeNoise(wx * 2.4, wz * 2.4, input.seed ^ 0xee11);
    backRelief += smoothstep(0.42, 0.9, faults) * 15 * backgroundBand;
  }

  if (input.archetype === 'mineral') {
    const strata = ridgeNoise(wx * 3.1, wz * 3.1, input.seed ^ 0x1313);
    backRelief += smoothstep(0.34, 0.9, strata) * 11 * backgroundBand;
  }

  if (input.archetype === 'oceanic') {
    const coastalShelf = smoothstep(-0.26, 0.12, coastDistance + continental * 0.08);
    backRelief = mix(backRelief - 30, backRelief + 4, coastalShelf);
    midRelief = mix(midRelief - 8, midRelief, coastalShelf);
  }

  const sideMask = smoothstep(1.2, 0.2, Math.abs(nx));
  let heightValue = baseFlat * foregroundBand + midRelief + backRelief * sideMask;

  const platformMask = foregroundBand * smoothstep(0.74, 0.08, Math.abs(nx));
  heightValue = mix(heightValue, 10.2 + padMicro, platformMask * 0.96);

  if (farField) {
    const horizonRamp = smoothstep(0.02, -0.6, nz);
    heightValue = heightValue + horizonRamp * 34 - 22;
  }

  const edgeMask = smoothstep(0.86, 1.18, Math.max(Math.abs(nx), Math.abs(nz)));
  heightValue -= edgeMask * (8 + spec.edgeDrop * 0.2);

  const slopeMask = clamp(
    Math.abs(backRelief) * 0.03
      + Math.abs(midRelief) * 0.06
      + Math.abs(micro) * 0.04
      + (1 - foregroundBand) * 0.24,
    0,
    1,
  );

  const cliffMask = smoothstep(0.42, 0.86, slopeMask + backgroundBand * 0.24);

  const wetBase = clamp(input.climate.humidity + spec.wetnessBoost, 0, 1);
  const frozenMask = clamp(input.climate.frozen + input.shape.polarWeight * 0.34 + (input.archetype === 'frozen' ? 0.35 : 0), 0, 1);
  const thermalMask = clamp(input.climate.thermal + (input.archetype === 'volcanic' ? cliffMask * 0.5 : 0), 0, 1);
  const mineralMask = clamp(input.climate.minerality + (input.archetype === 'mineral' ? cliffMask * 0.34 : 0), 0, 1);
  const wetnessMask = clamp(wetBase + shorelineMask * 0.4 - slopeMask * 0.18, 0, 1);
  const vegetationSuitability = clamp(wetnessMask * (1 - thermalMask * 0.82) * (1 - cliffMask * 0.72) * (0.32 + input.climate.vegetation), 0, 1);

  return {
    height: heightValue,
    masks: {
      height01: clamp((heightValue + 80) / 170, 0, 1),
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

    const foregroundBand = smoothstep(0.0, 0.46, nz);
    const sideFalloff = smoothstep(0.72, 0.08, Math.abs(nx));

    stableMask[i] = clamp(
      masks.buildable[i] * foregroundBand * sideFalloff * (1 - smoothstep(0.08, 0.2, masks.slope[i])) * (1 - masks.risk[i] * 0.35),
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
