import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import { SeededRng } from '@/game/world/rng';
import type { CityTerrainAlgorithm, CityTerrainViewMode } from '@/game/render/modes/terrain/CityTerrainEngine';
import type { CityTerrainInput } from '@/game/render/modes/terrain/CityTerrainTypes';
import type { CityBiomeSpec } from '@/game/render/modes/terrain/CityBiomeSpecs';

export interface HeightFieldContext {
  width: number;
  depth: number;
  xSegments: number;
  zSegments: number;
  minHeight: number;
  maxHeight: number;
  frequency: number;
}

export interface HeightCompositionResult {
  heights: Float32Array;
  buildMask: Float32Array;
  transitionMask: Float32Array;
  backgroundMask: Float32Array;
  depthMask: Float32Array;
}

export function generateCityHeightComposition(
  input: CityTerrainInput,
  spec: CityBiomeSpec,
  context: HeightFieldContext,
  viewMode: CityTerrainViewMode,
  farField: boolean,
  seedOffset: number,
): HeightCompositionResult {
  const heights = new Float32Array((context.xSegments + 1) * (context.zSegments + 1));
  const seed = input.seed + seedOffset;

  composeBaseTerrain(heights, context, spec.algorithm, seed, farField);
  remapHeightsToRange(heights, context.minHeight, context.maxHeight, farField ? 0.84 : 0.9);
  smoothHeights(heights, context.xSegments, context.zSegments, farField ? 0.58 : 0.33);

  const masks = computeDepthMasks(context, spec, farField);
  applyZonedComposition(heights, context, spec, viewMode, farField, masks, seed);
  applyEdgeTreatment(heights, context, farField);
  smoothHeights(heights, context.xSegments, context.zSegments, farField ? 0.38 : 0.24);

  return { heights, ...masks };
}

function composeBaseTerrain(
  heights: Float32Array,
  context: HeightFieldContext,
  algorithm: CityTerrainAlgorithm,
  seed: number,
  farField: boolean,
) {
  const passes = terrainPassesForAlgorithm(algorithm, farField);
  for (let i = 0; i < passes.length; i += 1) {
    applyNoisePass(heights, context, seed + i * 7919, passes[i]);
  }
}

function terrainPassesForAlgorithm(algorithm: CityTerrainAlgorithm, farField: boolean) {
  const macro = farField ? 1.12 : 1;
  if (algorithm === 'diamondSquare') {
    return [
      { kind: 'diamondSquare' as const, frequency: 0.9 * macro, amplitude: 0.8 },
      { kind: 'hill' as const, frequency: 0.6 * macro, amplitude: 0.38 },
      { kind: 'simplex' as const, frequency: 2.1 * macro, amplitude: 0.13 },
    ];
  }
  if (algorithm === 'fault') {
    return [
      { kind: 'fault' as const, frequency: 1.15 * macro, amplitude: 0.9 },
      { kind: 'hill' as const, frequency: 0.7 * macro, amplitude: 0.34 },
      { kind: 'simplex' as const, frequency: 2.3 * macro, amplitude: 0.13 },
    ];
  }
  if (algorithm === 'perlin') {
    return [
      { kind: 'perlin' as const, frequency: 0.9 * macro, amplitude: 0.68 },
      { kind: 'hill' as const, frequency: 0.55 * macro, amplitude: 0.3 },
      { kind: 'perlin' as const, frequency: 2.9 * macro, amplitude: 0.12 },
    ];
  }
  if (algorithm === 'perlinLayers') {
    return [
      { kind: 'perlin' as const, frequency: 0.85 * macro, amplitude: 0.62 },
      { kind: 'perlin' as const, frequency: 1.8 * macro, amplitude: 0.3 },
      { kind: 'hill' as const, frequency: 0.55 * macro, amplitude: 0.24 },
      { kind: 'perlin' as const, frequency: 4.1 * macro, amplitude: 0.1 },
    ];
  }
  if (algorithm === 'simplexLayers') {
    return [
      { kind: 'simplex' as const, frequency: 0.85 * macro, amplitude: 0.62 },
      { kind: 'simplex' as const, frequency: 2.0 * macro, amplitude: 0.3 },
      { kind: 'hill' as const, frequency: 0.58 * macro, amplitude: 0.26 },
      { kind: 'simplex' as const, frequency: 4.6 * macro, amplitude: 0.1 },
    ];
  }
  return [
    { kind: 'simplex' as const, frequency: 0.95 * macro, amplitude: 0.66 },
    { kind: 'hill' as const, frequency: 0.56 * macro, amplitude: 0.31 },
    { kind: 'simplex' as const, frequency: 3.2 * macro, amplitude: 0.1 },
  ];
}

function applyNoisePass(
  heights: Float32Array,
  context: HeightFieldContext,
  seed: number,
  pass: { kind: 'simplex' | 'perlin' | 'diamondSquare' | 'fault' | 'hill'; frequency: number; amplitude: number },
) {
  if (pass.kind === 'simplex' || pass.kind === 'perlin') {
    const rng = new SeededRng(seed ^ (pass.kind === 'simplex' ? 0x9e3779b9 : 0x85ebca6b));
    const noise = createNoise2D(() => rng.next());
    const width = context.xSegments + 1;
    const height = context.zSegments + 1;
    for (let x = 0; x < width; x += 1) {
      for (let z = 0; z < height; z += 1) {
        const wx = ((x / Math.max(width - 1, 1)) - 0.5) * context.width;
        const wz = ((z / Math.max(height - 1, 1)) - 0.5) * context.depth;
        const sx = (wx / Math.max(context.width, 1)) * context.frequency * pass.frequency * 3.4;
        const sz = (wz / Math.max(context.depth, 1)) * context.frequency * pass.frequency * 3.4;
        heights[z * width + x] += noise(sx, sz) * pass.amplitude;
      }
    }
    return;
  }

  if (pass.kind === 'hill') {
    addHillPass(heights, context, seed, pass.amplitude, pass.frequency);
    return;
  }

  if (pass.kind === 'diamondSquare') {
    addDiamondSquarePass(heights, context, seed, pass.amplitude);
    return;
  }

  addFaultPass(heights, context, seed, pass.amplitude, pass.frequency);
}

function addHillPass(heights: Float32Array, context: HeightFieldContext, seed: number, amplitude: number, frequency: number) {
  const rng = new SeededRng(seed ^ 0x27d4eb2f);
  const width = context.xSegments + 1;
  const height = context.zSegments + 1;
  const hills = Math.max(8, Math.floor(20 * frequency));
  for (let i = 0; i < hills; i += 1) {
    const cx = rng.range(0.05, 0.95);
    const cz = rng.range(0.05, 0.95);
    const radius = rng.range(0.09, 0.22) / Math.max(frequency, 0.2);
    const sign = rng.next() > 0.18 ? 1 : -0.35;
    for (let x = 0; x < width; x += 1) {
      for (let z = 0; z < height; z += 1) {
        const nx = x / Math.max(width - 1, 1);
        const nz = z / Math.max(height - 1, 1);
        const dx = nx - cx;
        const dz = nz - cz;
        const d = Math.sqrt(dx * dx + dz * dz) / radius;
        if (d >= 1) continue;
        const influence = (1 - d * d) * amplitude * sign;
        heights[z * width + x] += influence;
      }
    }
  }
}

function addDiamondSquarePass(heights: Float32Array, context: HeightFieldContext, seed: number, amplitude: number) {
  const rng = new SeededRng(seed ^ 0xc2b2ae35);
  const segments = THREE.MathUtils.ceilPowerOfTwo(Math.max(context.xSegments, context.zSegments) + 1);
  const size = segments + 1;
  const data = Array.from({ length: size }, () => new Float32Array(size));
  let smoothing = amplitude;

  for (let side = segments; side >= 2; side /= 2) {
    const half = side / 2;
    smoothing *= 0.56;
    for (let x = 0; x < segments; x += side) {
      for (let z = 0; z < segments; z += side) {
        const avg = (data[x][z] + data[x + side][z] + data[x][z + side] + data[x + side][z + side]) * 0.25;
        data[x + half][z + half] = avg + rng.range(-smoothing, smoothing);
      }
    }

    for (let x = 0; x < segments; x += half) {
      for (let z = (x + half) % side; z < segments; z += side) {
        const avg = (data[(x - half + size) % size][z] + data[(x + half) % size][z] + data[x][(z + half) % size] + data[x][(z - half + size) % size]) * 0.25;
        const value = avg + rng.range(-smoothing, smoothing);
        data[x][z] = value;
        if (x === 0) data[segments][z] = value;
        if (z === 0) data[x][segments] = value;
      }
    }
  }

  const width = context.xSegments + 1;
  const height = context.zSegments + 1;
  for (let x = 0; x < width; x += 1) {
    for (let z = 0; z < height; z += 1) {
      heights[z * width + x] += data[x][z] * amplitude;
    }
  }
}

function addFaultPass(heights: Float32Array, context: HeightFieldContext, seed: number, amplitude: number, frequency: number) {
  const rng = new SeededRng(seed ^ 0x165667b1);
  const width = context.xSegments + 1;
  const height = context.zSegments + 1;
  const iterations = Math.max(10, Math.floor((context.xSegments + context.zSegments) * 0.09 * frequency));
  for (let i = 0; i < iterations; i += 1) {
    const theta = rng.next() * Math.PI * 2;
    const normalX = Math.cos(theta);
    const normalZ = Math.sin(theta);
    const shift = rng.range(-0.42, 0.42);
    const disp = amplitude * (0.86 - i / iterations) * 0.16;
    for (let x = 0; x < width; x += 1) {
      for (let z = 0; z < height; z += 1) {
        const nx = x / Math.max(width - 1, 1) - 0.5;
        const nz = z / Math.max(height - 1, 1) - 0.5;
        const side = nx * normalX + nz * normalZ - shift;
        const idx = z * width + x;
        if (side > 0.02) heights[idx] += disp;
        else if (side < -0.02) heights[idx] -= disp;
      }
    }
  }
}

function remapHeightsToRange(heights: Float32Array, minHeight: number, maxHeight: number, relief: number) {
  const mid = (minHeight + maxHeight) * 0.5;
  const range = (maxHeight - minHeight) * 0.5;
  for (let i = 0; i < heights.length; i += 1) {
    const curved = Math.tanh(heights[i] * 0.95) * relief;
    heights[i] = mid + curved * range;
  }
}

function computeDepthMasks(context: HeightFieldContext, spec: CityBiomeSpec, farField: boolean) {
  const width = context.xSegments + 1;
  const height = context.zSegments + 1;
  const buildMask = new Float32Array(width * height);
  const transitionMask = new Float32Array(width * height);
  const backgroundMask = new Float32Array(width * height);
  const depthMask = new Float32Array(width * height);

  const buildWidth = farField ? 0.5 : spec.buildArea.widthPct;
  const buildDepth = farField ? 0.42 : spec.buildArea.depthPct;

  for (let x = 0; x < width; x += 1) {
    for (let z = 0; z < height; z += 1) {
      const idx = z * width + x;
      const nx = x / Math.max(width - 1, 1);
      const nz = z / Math.max(height - 1, 1);
      const fx = (nx - 0.5) / Math.max(buildWidth * 0.5, 1e-5);
      const fz = (nz - 0.5) / Math.max(buildDepth * 0.5, 1e-5);
      const radial = Math.sqrt(fx * fx + fz * fz);

      depthMask[idx] = nz;
      buildMask[idx] = clamp(1 - smoothstep(0.45, 1.08, radial), 0, 1);
      transitionMask[idx] = clamp(smoothstep(0.76, 1.45, radial) * (1 - smoothstep(1.45, 2.2, radial)), 0, 1);
      backgroundMask[idx] = clamp(smoothstep(1.04, 2.15, radial) * smoothstep(0.2, 0.95, nz), 0, 1);
    }
  }

  return { buildMask, transitionMask, backgroundMask, depthMask };
}

function applyZonedComposition(
  heights: Float32Array,
  context: HeightFieldContext,
  spec: CityBiomeSpec,
  viewMode: CityTerrainViewMode,
  farField: boolean,
  masks: Pick<HeightCompositionResult, 'buildMask' | 'transitionMask' | 'backgroundMask' | 'depthMask'>,
  seed: number,
) {
  const width = context.xSegments + 1;
  const targetBuildHeight = viewMode === 'flat' ? spec.buildArea.height : spec.buildArea.height + 0.22;
  const flatten = viewMode === 'normal' ? spec.buildArea.flatten : 1;
  const globalRelief = viewMode === 'flat' ? 0.09 : viewMode === 'build' ? 0.38 : 1;
  const rng = new SeededRng(seed ^ 0x3141592);
  const horizonBias = farField ? 0.17 : 0.08;

  for (let i = 0; i < heights.length; i += 1) {
    const build = masks.buildMask[i];
    const transition = masks.transitionMask[i];
    const background = masks.backgroundMask[i];
    const depth = masks.depthMask[i];

    let value = heights[i] * globalRelief;
    const undulation = Math.sin((i % width) * 0.09 + depth * 5.4) * (spec.maxHeight - spec.minHeight) * 0.006;
    value = THREE.MathUtils.lerp(value, targetBuildHeight + undulation, Math.pow(build, 1.25) * flatten);

    value += transition * Math.sin((i % width) * 0.044 + depth * 8.1) * (spec.maxHeight - spec.minHeight) * 0.017;
    value += background * smoothstep(0.42, 0.98, depth) * (spec.maxHeight - spec.minHeight) * (horizonBias + rng.range(-0.012, 0.018));

    heights[i] = value;
  }
}

function applyEdgeTreatment(heights: Float32Array, context: HeightFieldContext, farField: boolean) {
  const width = context.xSegments + 1;
  const height = context.zSegments + 1;
  const edgeThickness = farField ? 0.1 : 0.06;

  for (let x = 0; x < width; x += 1) {
    for (let z = 0; z < height; z += 1) {
      const idx = z * width + x;
      const nx = x / Math.max(width - 1, 1);
      const nz = z / Math.max(height - 1, 1);
      const edge = Math.max(Math.abs(nx - 0.5) / 0.5, Math.abs(nz - 0.5) / 0.5);
      const edgeBlend = smoothstep(1 - edgeThickness, 1, edge);
      const target = farField ? context.minHeight + 5.2 : context.minHeight + 4.5;
      heights[idx] = THREE.MathUtils.lerp(heights[idx], target, edgeBlend * 0.58);
    }
  }
}

export function smoothHeights(heights: Float32Array, xSegments: number, zSegments: number, weight: number) {
  const width = xSegments + 1;
  const height = zSegments + 1;
  const next = new Float32Array(heights.length);
  for (let x = 0; x < width; x += 1) {
    for (let z = 0; z < height; z += 1) {
      let sum = 0;
      let count = 0;
      for (let dx = -1; dx <= 1; dx += 1) {
        for (let dz = -1; dz <= 1; dz += 1) {
          const px = x + dx;
          const pz = z + dz;
          if (px < 0 || pz < 0 || px >= width || pz >= height) continue;
          sum += heights[pz * width + px];
          count += 1;
        }
      }
      next[z * width + x] = sum / Math.max(count, 1);
    }
  }

  for (let i = 0; i < heights.length; i += 1) {
    heights[i] = THREE.MathUtils.lerp(heights[i], next[i], weight);
  }
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0 || 1), 0, 1);
  return t * t * (3 - 2 * t);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
