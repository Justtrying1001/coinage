import * as THREE from 'three';
import type { CityTerrainInput, TerrainGeometryConfig } from '@/game/render/modes/terrain/CityTerrainTypes';
import { CITY_BIOME_SPECS } from '@/game/render/modes/terrain/CityBiomeSpecs';
import { generateCityHeightComposition } from '@/game/render/modes/terrain/CityTerrainShaping';

export type CityTerrainAlgorithm = 'simplex' | 'simplexLayers' | 'perlin' | 'perlinLayers' | 'diamondSquare' | 'fault';
export type CityTerrainViewMode = 'normal' | 'build' | 'flat';
export type CityTerrainMaterialMode = 'standard' | 'heightBlend';

export interface CityTerrainBuildResult {
  nearGeometry: THREE.PlaneGeometry;
  farGeometry: THREE.PlaneGeometry;
  buildSurface: {
    center: { x: number; z: number };
    width: number;
    depth: number;
    plateauHeight: number;
    transitionFalloff: number;
    maxSlope: number;
    stableMask: Float32Array;
    slopes: Float32Array;
  };
  waterLevel: number;
  materialMode: CityTerrainMaterialMode;
  viewMode: CityTerrainViewMode;
}

export function buildCityTerrainEngine(
  input: CityTerrainInput,
  config: TerrainGeometryConfig,
  viewMode: CityTerrainViewMode = 'normal',
): CityTerrainBuildResult {
  const spec = CITY_BIOME_SPECS[input.archetype];

  const near = buildField(input, {
    width: config.terrainWidth,
    depth: config.terrainDepth,
    xSegments: config.nearSegmentsX,
    zSegments: config.nearSegmentsZ,
    minHeight: spec.minHeight,
    maxHeight: spec.maxHeight,
    frequency: spec.frequency,
  }, viewMode, false, 0);

  const far = buildField(input, {
    width: config.farWidth,
    depth: config.farDepth,
    xSegments: config.farSegmentsX,
    zSegments: config.farSegmentsZ,
    minHeight: spec.minHeight - 8,
    maxHeight: spec.maxHeight + 8,
    frequency: spec.frequency * 0.78,
  }, viewMode, true, 0);

  return {
    nearGeometry: near.geometry,
    farGeometry: far.geometry,
    buildSurface: {
      center: near.buildCenter,
      width: config.terrainWidth,
      depth: config.terrainDepth,
      plateauHeight: spec.buildArea.plateauHeight,
      transitionFalloff: spec.buildArea.transitionFalloff,
      maxSlope: spec.buildArea.maxSlope,
      stableMask: near.stableMask,
      slopes: near.slopeMask,
    },
    waterLevel: spec.water.level,
    materialMode: spec.materialMode,
    viewMode,
  };
}

function buildField(
  input: CityTerrainInput,
  config: {
    width: number;
    depth: number;
    xSegments: number;
    zSegments: number;
    minHeight: number;
    maxHeight: number;
    frequency: number;
  },
  viewMode: CityTerrainViewMode,
  farField: boolean,
  seedOffset: number,
) {
  const geometry = new THREE.PlaneGeometry(config.width, config.depth, config.xSegments, config.zSegments);
  geometry.rotateX(-Math.PI / 2);

  const spec = CITY_BIOME_SPECS[input.archetype];
  const composition = generateCityHeightComposition(input, spec, config, viewMode, farField, seedOffset);

  const slopeMask = estimateSlopeMask(composition.heights, config.xSegments + 1, config.zSegments + 1, config.width, config.depth);
  const stableMask = computeStableMask(composition.buildMask, slopeMask);

  const pos = geometry.attributes.position;
  const count = pos.count;
  const height01 = new Float32Array(count);
  const shoreline = new Float32Array(count);
  const cliff = new Float32Array(count);
  const wetness = new Float32Array(count);
  const frozen = new Float32Array(count);
  const thermal = new Float32Array(count);
  const mineralized = new Float32Array(count);
  const vegetation = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    const h = composition.heights[i];
    pos.setY(i, h);

    const coast = 1 - smoothstep(0.02, 0.12, Math.abs(h - spec.water.level) / Math.max(spec.maxHeight - spec.minHeight, 1));
    const slope = slopeMask[i];
    const bg = composition.backgroundMask[i];

    height01[i] = invLerp(config.minHeight, config.maxHeight, h);
    shoreline[i] = coast;
    cliff[i] = smoothstep(0.36, 0.72, slope + bg * 0.12);
    wetness[i] = clamp(spec.moisture + coast * 0.35 - slope * 0.16, 0, 1);
    frozen[i] = clamp(spec.frozen + input.climate.frozen * 0.35 + (bg > 0.7 ? 0.08 : 0), 0, 1);
    thermal[i] = clamp(spec.thermal + input.climate.thermal * 0.45 + (input.archetype === 'volcanic' ? cliff[i] * 0.24 : 0), 0, 1);
    mineralized[i] = clamp(spec.minerality + input.climate.minerality * 0.4 + slope * 0.16, 0, 1);
    vegetation[i] = clamp(wetness[i] * (1 - thermal[i] * 0.84) * (1 - cliff[i] * 0.72), 0, 1);
  }

  pos.needsUpdate = true;
  geometry.computeVertexNormals();

  geometry.setAttribute('aHeight01', new THREE.BufferAttribute(height01, 1));
  geometry.setAttribute('aSlope', new THREE.BufferAttribute(slopeMask, 1));
  geometry.setAttribute('aCliff', new THREE.BufferAttribute(cliff, 1));
  geometry.setAttribute('aWetness', new THREE.BufferAttribute(wetness, 1));
  geometry.setAttribute('aShoreline', new THREE.BufferAttribute(shoreline, 1));
  geometry.setAttribute('aFrozen', new THREE.BufferAttribute(frozen, 1));
  geometry.setAttribute('aThermal', new THREE.BufferAttribute(thermal, 1));
  geometry.setAttribute('aMineralized', new THREE.BufferAttribute(mineralized, 1));
  geometry.setAttribute('aVegetation', new THREE.BufferAttribute(vegetation, 1));
  geometry.setAttribute('aBuildMask', new THREE.BufferAttribute(composition.buildMask, 1));
  geometry.setAttribute('aTransitionMask', new THREE.BufferAttribute(composition.transitionMask, 1));
  geometry.setAttribute('aBackgroundMask', new THREE.BufferAttribute(composition.backgroundMask, 1));
  geometry.setAttribute('aDepthMask', new THREE.BufferAttribute(composition.depthMask, 1));

  return { geometry, slopeMask, stableMask, buildCenter: composition.buildCenter };
}

function estimateSlopeMask(heights: Float32Array, widthVertices: number, depthVertices: number, width: number, depth: number) {
  const mask = new Float32Array(heights.length);
  const dx = width / Math.max(widthVertices - 1, 1);
  const dz = depth / Math.max(depthVertices - 1, 1);
  for (let x = 0; x < widthVertices; x += 1) {
    for (let z = 0; z < depthVertices; z += 1) {
      const idx = z * widthVertices + x;
      const xm1 = Math.max(x - 1, 0);
      const xp1 = Math.min(x + 1, widthVertices - 1);
      const zm1 = Math.max(z - 1, 0);
      const zp1 = Math.min(z + 1, depthVertices - 1);
      const sx = (heights[z * widthVertices + xp1] - heights[z * widthVertices + xm1]) / (dx * Math.max(xp1 - xm1, 1));
      const sz = (heights[zp1 * widthVertices + x] - heights[zm1 * widthVertices + x]) / (dz * Math.max(zp1 - zm1, 1));
      mask[idx] = clamp(Math.sqrt(sx * sx + sz * sz) * 0.3, 0, 1);
    }
  }
  return mask;
}

function computeStableMask(buildMask: Float32Array, slopeMask: Float32Array) {
  const stable = new Float32Array(buildMask.length);
  for (let i = 0; i < stable.length; i += 1) {
    stable[i] = clamp(buildMask[i] * (1 - smoothstep(0.2, 0.6, slopeMask[i])), 0, 1);
  }
  return stable;
}

function invLerp(a: number, b: number, v: number) {
  return clamp((v - a) / (b - a || 1), 0, 1);
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1), 0, 1);
  return t * t * (3 - 2 * t);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
