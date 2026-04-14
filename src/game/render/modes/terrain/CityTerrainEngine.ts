import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import { SeededRng } from '@/game/world/rng';
import type { CityTerrainInput, TerrainGeometryConfig } from '@/game/render/modes/terrain/CityTerrainTypes';
import { CITY_BIOME_SPECS } from '@/game/render/modes/terrain/CityBiomeSpecs';

export type CityTerrainAlgorithm = 'simplex' | 'simplexLayers' | 'perlin' | 'perlinLayers' | 'diamondSquare' | 'fault';
export type CityTerrainViewMode = 'normal' | 'build' | 'flat';
export type CityTerrainMaterialMode = 'standard' | 'heightBlend';

export interface CityTerrainBuildResult {
  nearGeometry: THREE.PlaneGeometry;
  farGeometry: THREE.PlaneGeometry;
  buildSurface: {
    width: number;
    depth: number;
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
  const biome = CITY_BIOME_SPECS[input.archetype];
  const near = buildField(input, config.terrainWidth, config.terrainDepth, config.nearSegmentsX, config.nearSegmentsZ, false, viewMode);
  const far = buildField(input, config.farWidth, config.farDepth, config.farSegmentsX, config.farSegmentsZ, true, viewMode);

  return {
    nearGeometry: near.geometry,
    farGeometry: far.geometry,
    buildSurface: {
      width: config.terrainWidth,
      depth: config.terrainDepth,
      stableMask: near.stableMask,
      slopes: near.slopeMask,
    },
    waterLevel: biome.water.level,
    materialMode: biome.materialMode,
    viewMode,
  };
}

function buildField(
  input: CityTerrainInput,
  width: number,
  depth: number,
  xSegments: number,
  zSegments: number,
  farField: boolean,
  viewMode: CityTerrainViewMode,
) {
  const geometry = new THREE.PlaneGeometry(width, depth, xSegments, zSegments);
  geometry.rotateX(-Math.PI / 2);

  const spec = CITY_BIOME_SPECS[input.archetype];
  const terrainOptions = {
    xSegments,
    ySegments: zSegments,
    xSize: width,
    ySize: depth,
    minHeight: farField ? spec.minHeight - 10 : spec.minHeight,
    maxHeight: farField ? spec.maxHeight - 3 : spec.maxHeight,
    frequency: farField ? spec.frequency * 0.6 : spec.frequency,
    stretch: true,
  };

  const heights = new Float32Array((xSegments + 1) * (zSegments + 1));
  applyAlgorithm(heights, terrainOptions, spec.algorithm, input.seed + (farField ? 991 : 0));
  clampHeights(heights, terrainOptions);

  if (!farField) {
    shapeBuildZone(heights, terrainOptions, spec, viewMode);
  }

  if (farField) {
    applyEdges(heights, terrainOptions, false, Math.min(width, depth) * 0.16);
  }

  smooth(heights, terrainOptions, farField ? 1.25 : 0.35);

  const slopeMask = estimateSlopeMask(heights, xSegments + 1, zSegments + 1, width, depth);
  const stableMask = computeStableMask(heights, slopeMask, xSegments + 1, zSegments + 1, spec);

  const pos = geometry.attributes.position;
  const count = pos.count;
  const height01 = new Float32Array(count);
  const wetness = new Float32Array(count);
  const shoreline = new Float32Array(count);
  const frozen = new Float32Array(count);
  const thermal = new Float32Array(count);
  const mineralized = new Float32Array(count);
  const vegetation = new Float32Array(count);
  const cliff = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    const h = heights[i];
    pos.setY(i, h);
    height01[i] = invLerp(terrainOptions.minHeight, terrainOptions.maxHeight, h);
    const slope = slopeMask[i];
    const coast = 1 - smoothstep(0.03, 0.11, Math.abs(h - spec.water.level) / Math.max(spec.maxHeight - spec.minHeight, 1));
    shoreline[i] = coast;
    cliff[i] = smoothstep(0.36, 0.74, slope);
    wetness[i] = clamp(spec.moisture + coast * 0.42 - slope * 0.18, 0, 1);
    frozen[i] = clamp(spec.frozen + input.climate.frozen * 0.35 + (h > spec.maxHeight * 0.55 ? 0.12 : 0), 0, 1);
    thermal[i] = clamp(spec.thermal + input.climate.thermal * 0.45 + (input.archetype === 'volcanic' ? slope * 0.24 : 0), 0, 1);
    mineralized[i] = clamp(spec.minerality + input.climate.minerality * 0.44 + slope * 0.18, 0, 1);
    vegetation[i] = clamp(wetness[i] * (1 - thermal[i] * 0.85) * (1 - cliff[i] * 0.7) * (0.3 + input.climate.vegetation), 0, 1);
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

  return { geometry, slopeMask, stableMask };
}

interface TerrainOptions {
  xSegments: number;
  ySegments: number;
  xSize: number;
  ySize: number;
  minHeight: number;
  maxHeight: number;
  frequency: number;
  stretch: boolean;
}

function applyAlgorithm(heights: Float32Array, options: TerrainOptions, algorithm: CityTerrainAlgorithm, seed: number) {
  if (algorithm === 'simplex') return simplex(heights, options, seed);
  if (algorithm === 'perlin') return perlin(heights, options, seed);
  if (algorithm === 'diamondSquare') return diamondSquare(heights, options, seed);
  if (algorithm === 'fault') return fault(heights, options, seed);
  if (algorithm === 'perlinLayers') {
    multiPass(heights, options, [
      { method: perlin, frequency: 1.25 },
      { method: perlin, frequency: 2.5, amplitude: 0.05 },
      { method: perlin, frequency: 5, amplitude: 0.35 },
      { method: perlin, frequency: 10, amplitude: 0.15 },
    ], seed);
    return;
  }
  multiPass(heights, options, [
    { method: simplex, frequency: 1.25 },
    { method: simplex, frequency: 2.5, amplitude: 0.5 },
    { method: simplex, frequency: 5, amplitude: 0.25 },
    { method: simplex, frequency: 10, amplitude: 0.125 },
    { method: simplex, frequency: 20, amplitude: 0.0625 },
  ], seed);
}

function multiPass(
  heights: Float32Array,
  options: TerrainOptions,
  passes: Array<{ method: (h: Float32Array, o: TerrainOptions, s: number) => void; amplitude?: number; frequency?: number }>,
  seed: number,
) {
  const range = options.maxHeight - options.minHeight;
  for (let i = 0; i < passes.length; i += 1) {
    const amp = passes[i].amplitude ?? 1;
    const move = 0.5 * (range - range * amp);
    passes[i].method(heights, {
      ...options,
      maxHeight: options.maxHeight - move,
      minHeight: options.minHeight + move,
      frequency: passes[i].frequency ?? options.frequency,
    }, seed + i * 1619);
  }
}

function simplex(heights: Float32Array, options: TerrainOptions, seed: number) {
  const rng = new SeededRng(seed ^ 0x9e3779b9);
  const noise2d = createNoise2D(() => rng.next());
  const range = (options.maxHeight - options.minHeight) * 0.5;
  const divisor = ((Math.min(options.xSegments, options.ySegments) + 1) * 2) / options.frequency;
  const w = options.xSegments + 1;
  const h = options.ySegments + 1;
  for (let x = 0; x < w; x += 1) {
    for (let y = 0; y < h; y += 1) {
      heights[y * w + x] += noise2d(x / divisor, y / divisor) * range;
    }
  }
}

function perlin(heights: Float32Array, options: TerrainOptions, seed: number) {
  const rng = new SeededRng(seed ^ 0x85ebca6b);
  const noise2d = createNoise2D(() => rng.next());
  const range = (options.maxHeight - options.minHeight) * 0.5;
  const divisor = (Math.min(options.xSegments, options.ySegments) + 1) / options.frequency;
  const w = options.xSegments + 1;
  const h = options.ySegments + 1;
  for (let x = 0; x < w; x += 1) {
    for (let y = 0; y < h; y += 1) {
      heights[y * w + x] += noise2d(x / divisor, y / divisor) * range;
    }
  }
}

function diamondSquare(heights: Float32Array, options: TerrainOptions, seed: number) {
  const rng = new SeededRng(seed ^ 0xc2b2ae35);
  const segments = THREE.MathUtils.ceilPowerOfTwo(Math.max(options.xSegments, options.ySegments) + 1);
  const size = segments + 1;
  const data = new Array<Float64Array>(size);
  for (let i = 0; i <= segments; i += 1) data[i] = new Float64Array(size);
  let smoothing = options.maxHeight - options.minHeight;

  for (let l = segments; l >= 2; l /= 2) {
    const half = Math.round(l * 0.5);
    const whole = Math.round(l);
    smoothing /= 2;
    for (let x = 0; x < segments; x += whole) {
      for (let y = 0; y < segments; y += whole) {
        const d = rng.range(-smoothing, smoothing);
        let avg = data[x][y] + data[x + whole][y] + data[x][y + whole] + data[x + whole][y + whole];
        avg *= 0.25;
        data[x + half][y + half] = avg + d;
      }
    }
    for (let x = 0; x < segments; x += half) {
      for (let y = (x + half) % l; y < segments; y += l) {
        const d = rng.range(-smoothing, smoothing);
        let avg = data[(x - half + size) % size][y] + data[(x + half) % size][y] + data[x][(y + half) % size] + data[x][(y - half + size) % size];
        avg = avg * 0.25 + d;
        data[x][y] = avg;
        if (x === 0) data[segments][y] = avg;
        if (y === 0) data[x][segments] = avg;
      }
    }
  }

  const w = options.xSegments + 1;
  const h = options.ySegments + 1;
  for (let x = 0; x < w; x += 1) {
    for (let y = 0; y < h; y += 1) {
      heights[y * w + x] += data[x][y];
    }
  }
}

function fault(heights: Float32Array, options: TerrainOptions, seed: number) {
  const rng = new SeededRng(seed ^ 0x27d4eb2f);
  const d = Math.sqrt(options.xSegments * options.xSegments + options.ySegments * options.ySegments);
  const iterations = Math.max(1, Math.floor(d * options.frequency));
  const range = (options.maxHeight - options.minHeight) * 0.5;
  const displacement = range / iterations;
  const smoothDistance = Math.min(options.xSize / options.xSegments, options.ySize / options.ySegments) * options.frequency;
  const w = options.xSegments + 1;
  const h = options.ySegments + 1;
  for (let k = 0; k < iterations; k += 1) {
    const v = rng.next();
    const a = Math.sin(v * Math.PI * 2);
    const b = Math.cos(v * Math.PI * 2);
    const c = rng.range(-d * 0.5, d * 0.5);
    for (let x = 0; x < w; x += 1) {
      for (let y = 0; y < h; y += 1) {
        const idx = y * w + x;
        const distance = a * x + b * y - c;
        if (distance > smoothDistance) heights[idx] += displacement;
        else if (distance < -smoothDistance) heights[idx] -= displacement;
        else heights[idx] += Math.cos((distance / smoothDistance) * Math.PI * 2) * displacement;
      }
    }
  }
}

function clampHeights(heights: Float32Array, options: TerrainOptions) {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < heights.length; i += 1) {
    min = Math.min(min, heights[i]);
    max = Math.max(max, heights[i]);
  }
  const actualRange = Math.max(max - min, 1e-5);
  const range = options.maxHeight - options.minHeight;
  for (let i = 0; i < heights.length; i += 1) {
    const t = (heights[i] - min) / actualRange;
    heights[i] = t * range + options.minHeight;
  }
}

function smooth(heights: Float32Array, options: TerrainOptions, weight = 0) {
  const smoothed = new Float32Array(heights.length);
  const w = options.xSegments + 1;
  const h = options.ySegments + 1;
  for (let x = 0; x < w; x += 1) {
    for (let y = 0; y < h; y += 1) {
      let sum = 0;
      let count = 0;
      for (let ox = -1; ox <= 1; ox += 1) {
        for (let oy = -1; oy <= 1; oy += 1) {
          const nx = x + ox;
          const ny = y + oy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          sum += heights[ny * w + nx];
          count += 1;
        }
      }
      smoothed[y * w + x] = sum / Math.max(count, 1);
    }
  }
  const blend = 1 / (1 + weight);
  for (let i = 0; i < heights.length; i += 1) {
    heights[i] = (smoothed[i] + heights[i] * weight) * blend;
  }
}

function applyEdges(heights: Float32Array, options: TerrainOptions, directionUp: boolean, distance: number) {
  const numXSegments = Math.floor(distance / (options.xSize / options.xSegments)) || 1;
  const numYSegments = Math.floor(distance / (options.ySize / options.ySegments)) || 1;
  const peak = directionUp ? options.maxHeight : options.minHeight;
  const clampFn = directionUp ? Math.max : Math.min;
  const w = options.xSegments + 1;
  const h = options.ySegments + 1;

  for (let x = 0; x < w; x += 1) {
    for (let y = 0; y < numYSegments; y += 1) {
      const multiplier = easeInOut(1 - y / numYSegments);
      const top = y * w + x;
      const bottom = (options.ySegments - y) * w + x;
      heights[top] = clampFn(heights[top], (peak - heights[top]) * multiplier + heights[top]);
      heights[bottom] = clampFn(heights[bottom], (peak - heights[bottom]) * multiplier + heights[bottom]);
    }
  }

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < numXSegments; x += 1) {
      const multiplier = easeInOut(1 - x / numXSegments);
      const left = y * w + x;
      const right = (options.ySegments - y) * w + (options.xSegments - x);
      heights[left] = clampFn(heights[left], (peak - heights[left]) * multiplier + heights[left]);
      heights[right] = clampFn(heights[right], (peak - heights[right]) * multiplier + heights[right]);
    }
  }
}

function shapeBuildZone(
  heights: Float32Array,
  options: TerrainOptions,
  spec: (typeof CITY_BIOME_SPECS)[keyof typeof CITY_BIOME_SPECS],
  viewMode: CityTerrainViewMode,
) {
  const w = options.xSegments + 1;
  const h = options.ySegments + 1;
  const targetBuildHeight = viewMode === 'flat' ? spec.buildArea.height : spec.buildArea.height + 0.35;
  const flattenStrength = viewMode === 'build' || viewMode === 'flat' ? 1 : spec.buildArea.flatten;
  const reliefAttenuation = viewMode === 'flat' ? 0.05 : viewMode === 'build' ? 0.25 : 1;

  for (let x = 0; x < w; x += 1) {
    for (let z = 0; z < h; z += 1) {
      const idx = z * w + x;
      const nx = x / Math.max(w - 1, 1);
      const nz = z / Math.max(h - 1, 1);
      const centeredX = Math.abs(nx - 0.5) / (spec.buildArea.widthPct * 0.5);
      const frontDepth = 1 - nz;
      const centeredZ = frontDepth / Math.max(spec.buildArea.depthPct, 1e-5);
      const inside = 1 - smoothstep(0.78, 1, Math.max(centeredX, centeredZ));
      const buildBlend = inside * flattenStrength;
      const shaped = THREE.MathUtils.lerp(heights[idx] * reliefAttenuation, targetBuildHeight, buildBlend);
      heights[idx] = THREE.MathUtils.lerp(shaped, heights[idx], smoothstep(0.82, 1, centeredZ));
    }
  }
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
      mask[idx] = clamp(Math.sqrt(sx * sx + sz * sz) * 0.35, 0, 1);
    }
  }
  return mask;
}

function computeStableMask(
  heights: Float32Array,
  slopeMask: Float32Array,
  widthVertices: number,
  depthVertices: number,
  spec: (typeof CITY_BIOME_SPECS)[keyof typeof CITY_BIOME_SPECS],
) {
  const stable = new Float32Array(heights.length);
  for (let x = 0; x < widthVertices; x += 1) {
    for (let z = 0; z < depthVertices; z += 1) {
      const idx = z * widthVertices + x;
      const nx = x / Math.max(widthVertices - 1, 1);
      const nz = z / Math.max(depthVertices - 1, 1);
      const centeredX = Math.abs(nx - 0.5) / (spec.buildArea.widthPct * 0.5);
      const frontDepth = 1 - nz;
      const centeredZ = frontDepth / Math.max(spec.buildArea.depthPct, 1e-5);
      const inBuild = 1 - smoothstep(0.8, 1, Math.max(centeredX, centeredZ));
      stable[idx] = clamp(inBuild * (1 - smoothstep(0.22, 0.58, slopeMask[idx])), 0, 1);
    }
  }
  return stable;
}

function invLerp(a: number, b: number, v: number) {
  return clamp((v - a) / (b - a || 1), 0, 1);
}

function easeInOut(x: number) {
  return x * x * (3 - 2 * x);
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1), 0, 1);
  return t * t * (3 - 2 * t);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
