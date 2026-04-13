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
  terrainWidth: 360,
  terrainDepth: 280,
  farWidth: 880,
  farDepth: 760,
  nearSegmentsX: 360,
  nearSegmentsZ: 280,
  farSegmentsX: 170,
  farSegmentsZ: 140,
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
  applyHeights(near, input, layout, config, false);
  near.computeVertexNormals();

  const far = new THREE.PlaneGeometry(config.farWidth, config.farDepth, config.farSegmentsX, config.farSegmentsZ);
  far.rotateX(-Math.PI / 2);
  applyHeights(far, input, layout, config, true);
  far.computeVertexNormals();

  return {
    nearGeometry: near,
    farGeometry: far,
    buildSurface: extractBuildSurface(near, config),
  };
}

function applyHeights(
  geometry: THREE.PlaneGeometry,
  input: CityTerrainInput,
  layout: CityLayoutMaskSource,
  config: TerrainGeometryConfig,
  farField: boolean,
) {
  const pos = geometry.attributes.position;
  const height = new Float32Array(pos.count);
  const slope = new Float32Array(pos.count);
  const cliff = new Float32Array(pos.count);
  const wetness = new Float32Array(pos.count);
  const shoreline = new Float32Array(pos.count);
  const frozen = new Float32Array(pos.count);
  const thermal = new Float32Array(pos.count);
  const mineralized = new Float32Array(pos.count);
  const vegetation = new Float32Array(pos.count);

  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const sample = sampleTerrain(input, layout, x, z, config, farField);
    pos.setY(i, sample.height);
    height[i] = sample.masks.height01;
    slope[i] = sample.masks.slope;
    cliff[i] = sample.masks.cliff;
    wetness[i] = sample.masks.wetness;
    shoreline[i] = sample.masks.shoreline;
    frozen[i] = sample.masks.frozen;
    thermal[i] = sample.masks.thermal;
    mineralized[i] = sample.masks.mineralized;
    vegetation[i] = sample.masks.vegetationSuitability;
  }

  pos.needsUpdate = true;
  geometry.setAttribute('aHeight01', new THREE.BufferAttribute(height, 1));
  geometry.setAttribute('aSlope', new THREE.BufferAttribute(slope, 1));
  geometry.setAttribute('aCliff', new THREE.BufferAttribute(cliff, 1));
  geometry.setAttribute('aWetness', new THREE.BufferAttribute(wetness, 1));
  geometry.setAttribute('aShoreline', new THREE.BufferAttribute(shoreline, 1));
  geometry.setAttribute('aFrozen', new THREE.BufferAttribute(frozen, 1));
  geometry.setAttribute('aThermal', new THREE.BufferAttribute(thermal, 1));
  geometry.setAttribute('aMineralized', new THREE.BufferAttribute(mineralized, 1));
  geometry.setAttribute('aVegetation', new THREE.BufferAttribute(vegetation, 1));
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
  const nx = x / config.terrainWidth;
  const nz = z / config.terrainDepth;
  const radial = Math.max(Math.abs(nx), Math.abs(nz));

  const buildCore = smoothstep(0.78, 0.08, radial);
  const transitionBand = smoothstep(0.2, 0.74, radial) * (1 - smoothstep(0.72, 0.92, radial));

  const macro = fbm2(nx * input.shape.continentScale * 2.4, nz * input.shape.continentScale * 2.4, input.seed ^ 0xaaa1, 5);
  const ridges = ridgeNoise(nx * input.shape.ridgeScale * 0.48, nz * input.shape.ridgeScale * 0.48, input.seed ^ 0x1aa11);
  const craters = fbm2(nx * input.shape.craterScale * 0.4, nz * input.shape.craterScale * 0.4, input.seed ^ 0xcc991, 3);

  const biomeLandforms = macro * (0.74 + input.shape.reliefStrength * 2.4 + input.shape.macroBias * 0.3)
    + ridges * (spec.ridgeGain + input.shape.ridgeWeight * 0.4)
    - craters * (spec.basinBias + input.shape.craterWeight * 0.5)
    + fbm2(nx * 6.3, nz * 6.3, input.seed ^ 0x9d44, 3) * spec.duneStrength;

  const perimeter = smoothstep(spec.rimWidth, 1.08, radial) * spec.edgeDrop;
  const micro = fbm2(nx * input.material.microReliefScale, nz * input.material.microReliefScale, input.seed ^ 0x2f, 3)
    * (0.5 + input.material.microReliefStrength * 0.8);

  let heightValue = biomeLandforms * 14;
  const coreTarget = (Math.round(heightValue / 0.8) * 0.8) + spec.coreLift;
  heightValue = mix(heightValue, coreTarget, buildCore * 0.76);
  heightValue += transitionBand * 1.35;
  heightValue += micro * 2.1;
  heightValue -= perimeter;

  const wetBase = clamp(input.climate.humidity + spec.wetnessBoost, 0, 1);
  let shorelineMask = smoothstep(input.planet.surfaceLevel01 - 0.14, input.planet.surfaceLevel01 + 0.12, 1 - radial + macro * 0.12);

  if (input.archetype === 'oceanic') {
    const lagoon = smoothstep(0.1, 0.56, 1 - radial) * 3.2;
    const shelf = smoothstep(0.22, 0.6, shorelineMask) * 1.8;
    heightValue = heightValue * shorelineMask + lagoon + shelf;
    heightValue -= (1 - shorelineMask) * 10.8;
  }

  if (input.archetype === 'frozen') {
    const shelf = smoothstep(1.02, 0.34, radial + fbm2(nx * 2.2, nz * 2.2, input.seed ^ 0x8181, 2) * 0.08);
    const fracture = smoothstep(0.34, 0.9, Math.abs(fbm2(nx * 12, nz * 12, input.seed ^ 0xa8a8, 3))) * spec.fractureStrength * 2.8;
    heightValue = heightValue * shelf - fracture;
    shorelineMask *= shelf;
  }

  if (input.archetype === 'volcanic') {
    const caldera = smoothstep(0.12, 0.44, 1 - radial) * smoothstep(0.5, 0.86, ridges);
    heightValue += caldera * 4.2;
  }

  if (farField) {
    heightValue = heightValue * 0.58 - 5.2;
  }

  const slopeMask = clamp(Math.abs(ridges) * 0.62 + Math.abs(micro) * 0.42 + radial * 0.34, 0, 1);
  const cliffMask = smoothstep(0.48, 0.88, slopeMask + transitionBand * 0.38);
  const frozenMask = clamp(input.climate.frozen + input.shape.polarWeight * 0.35 + shorelineMask * 0.2, 0, 1);
  const thermalMask = clamp(input.climate.thermal + input.shape.emissiveIntensity * 0.5 + (input.archetype === 'volcanic' ? smoothstep(0.46, 0.88, ridges) * 0.35 : 0), 0, 1);
  const mineralMask = clamp(input.climate.minerality + (input.archetype === 'mineral' ? smoothstep(0.42, 0.88, ridges) * 0.36 : 0), 0, 1);
  const wetnessMask = clamp(wetBase + shorelineMask * 0.52 - slopeMask * 0.2, 0, 1);
  const vegetationSuitability = clamp((wetnessMask * (1 - thermalMask * 0.8) * (1 - cliffMask * 0.7)) * (0.35 + input.climate.vegetation), 0, 1);

  return {
    height: heightValue,
    masks: {
      height01: clamp((heightValue + 30) / 64, 0, 1),
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

function extractBuildSurface(geometry: THREE.PlaneGeometry, config: TerrainGeometryConfig): BuildSurfaceSnapshot {
  const pos = geometry.attributes.position;
  const slopes = new Float32Array(pos.count);
  const stableMask = new Float32Array(pos.count);

  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i) / config.terrainWidth;
    const z = pos.getZ(i) / config.terrainDepth;
    const center = smoothstep(0.72, 0.06, Math.max(Math.abs(x), Math.abs(z)));
    const localSlope = Math.abs(fbm2(x * 7.5, z * 7.5, 0x4411aa, 2));
    slopes[i] = localSlope;
    stableMask[i] = center * (1 - smoothstep(0.34, 0.68, localSlope));
  }

  return {
    width: config.terrainWidth,
    depth: config.terrainDepth,
    slopes,
    stableMask,
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
