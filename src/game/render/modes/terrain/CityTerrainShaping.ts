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
  normalizeToRange(heights, context.minHeight, context.maxHeight);
  smoothHeights(heights, context.xSegments, context.zSegments, farField ? 0.72 : 0.45);

  const masks = computeDepthMasks(context, spec, farField);
  applyZonedComposition(heights, context, spec, viewMode, farField, masks, seed);
  applyEdgeTreatment(heights, context, farField);
  smoothHeights(heights, context.xSegments, context.zSegments, farField ? 0.52 : 0.35);

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
  const macro = farField ? 1.15 : 1;
  if (algorithm === 'diamondSquare') {
    return [
      { kind: 'diamondSquare' as const, frequency: 0.9 * macro, amplitude: 0.82 },
      { kind: 'hill' as const, frequency: 0.65 * macro, amplitude: 0.45 },
      { kind: 'simplex' as const, frequency: 1.9 * macro, amplitude: 0.12 },
    ];
  }
  if (algorithm === 'fault') {
    return [
      { kind: 'fault' as const, frequency: 1.2 * macro, amplitude: 0.92 },
      { kind: 'hill' as const, frequency: 0.7 * macro, amplitude: 0.42 },
      { kind: 'simplex' as const, frequency: 2.2 * macro, amplitude: 0.1 },
    ];
  }
  if (algorithm === 'perlin') {
    return [
      { kind: 'perlin' as const, frequency: 0.95 * macro, amplitude: 0.78 },
      { kind: 'hill' as const, frequency: 0.55 * macro, amplitude: 0.34 },
      { kind: 'perlin' as const, frequency: 2.8 * macro, amplitude: 0.08 },
    ];
  }
  if (algorithm === 'perlinLayers') {
    return [
      { kind: 'perlin' as const, frequency: 0.9 * macro, amplitude: 0.7 },
      { kind: 'perlin' as const, frequency: 1.9 * macro, amplitude: 0.33 },
      { kind: 'hill' as const, frequency: 0.6 * macro, amplitude: 0.28 },
      { kind: 'perlin' as const, frequency: 4.2 * macro, amplitude: 0.05 },
    ];
  }
  if (algorithm === 'simplexLayers') {
    return [
      { kind: 'simplex' as const, frequency: 0.9 * macro, amplitude: 0.68 },
      { kind: 'simplex' as const, frequency: 2.1 * macro, amplitude: 0.3 },
      { kind: 'hill' as const, frequency: 0.65 * macro, amplitude: 0.32 },
      { kind: 'simplex' as const, frequency: 4.6 * macro, amplitude: 0.06 },
    ];
  }
  return [
    { kind: 'simplex' as const, frequency: 1 * macro, amplitude: 0.78 },
    { kind: 'hill' as const, frequency: 0.62 * macro, amplitude: 0.35 },
    { kind: 'simplex' as const, frequency: 3.1 * macro, amplitude: 0.07 },
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
    const stride = Math.max(Math.min(context.xSegments, context.zSegments), 1) / Math.max(context.frequency * pass.frequency, 0.0001);
    const width = context.xSegments + 1;
    const height = context.zSegments + 1;
    for (let x = 0; x < width; x += 1) {
      for (let z = 0; z < height; z += 1) {
        heights[z * width + x] += noise(x / stride, z / stride) * pass.amplitude;
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
  const hills = Math.max(6, Math.floor(24 * frequency));
  for (let i = 0; i < hills; i += 1) {
    const cx = rng.range(0.1, 0.9);
    const cz = rng.range(0.15, 0.95);
    const radius = rng.range(0.08, 0.25) / Math.max(frequency, 0.2);
    const sign = rng.next() > 0.22 ? 1 : -0.45;
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
    smoothing *= 0.54;
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
  const iterations = Math.max(8, Math.floor((context.xSegments + context.zSegments) * 0.1 * frequency));
  for (let i = 0; i < iterations; i += 1) {
    const theta = rng.next() * Math.PI * 2;
    const normalX = Math.cos(theta);
    const normalZ = Math.sin(theta);
    const shift = rng.range(-0.45, 0.45);
    const disp = amplitude * (0.9 - i / iterations) * 0.2;
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

function normalizeToRange(heights: Float32Array, minHeight: number, maxHeight: number) {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < heights.length; i += 1) {
    min = Math.min(min, heights[i]);
    max = Math.max(max, heights[i]);
  }
  const sourceRange = Math.max(max - min, 1e-6);
  const targetRange = maxHeight - minHeight;
  for (let i = 0; i < heights.length; i += 1) {
    heights[i] = ((heights[i] - min) / sourceRange) * targetRange + minHeight;
  }
}

function computeDepthMasks(context: HeightFieldContext, spec: CityBiomeSpec, farField: boolean) {
  const width = context.xSegments + 1;
  const height = context.zSegments + 1;
  const buildMask = new Float32Array(width * height);
  const transitionMask = new Float32Array(width * height);
  const backgroundMask = new Float32Array(width * height);
  const depthMask = new Float32Array(width * height);

  const buildWidth = farField ? 0.34 : spec.buildArea.widthPct;
  const buildDepth = farField ? 0.26 : spec.buildArea.depthPct;

  for (let x = 0; x < width; x += 1) {
    for (let z = 0; z < height; z += 1) {
      const idx = z * width + x;
      const nx = x / Math.max(width - 1, 1);
      const nz = z / Math.max(height - 1, 1);
      const frontDepth = 1 - nz;
      depthMask[idx] = frontDepth;

      const ex = Math.abs(nx - 0.5) / Math.max(buildWidth * 0.5, 1e-5);
      const ez = frontDepth / Math.max(buildDepth, 1e-5);
      const radial = Math.max(ex, ez);

      buildMask[idx] = 1 - smoothstep(0.74, 1.04, radial);
      transitionMask[idx] = smoothstep(0.52, 1.05, radial) * (1 - smoothstep(1.05, 1.7, radial));
      backgroundMask[idx] = smoothstep(0.98, 1.55, radial) * smoothstep(0.28, 0.76, nz);
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
  const targetBuildHeight = viewMode === 'flat' ? spec.buildArea.height : spec.buildArea.height + 0.4;
  const flatten = viewMode === 'normal' ? spec.buildArea.flatten : 1;
  const globalRelief = viewMode === 'flat' ? 0.06 : viewMode === 'build' ? 0.34 : 1;

  const rng = new SeededRng(seed ^ 0x3141592);
  const horizonBias = farField ? 0.22 : 0.12;

  for (let i = 0; i < heights.length; i += 1) {
    const build = masks.buildMask[i];
    const transition = masks.transitionMask[i];
    const background = masks.backgroundMask[i];
    const depth = masks.depthMask[i];

    let value = heights[i] * globalRelief;
    value = THREE.MathUtils.lerp(value, targetBuildHeight, build * flatten);

    const midWave = Math.sin((i % width) * 0.07 + depth * 8.4) * 0.55;
    value += transition * midWave * (spec.maxHeight - spec.minHeight) * 0.02;

    const silhouetteStep = smoothstep(0.4, 0.95, depth);
    const mountainLift = background * silhouetteStep * (spec.maxHeight - spec.minHeight) * (horizonBias + rng.range(-0.025, 0.03));
    value += mountainLift;

    heights[i] = value;
  }
}

function applyEdgeTreatment(heights: Float32Array, context: HeightFieldContext, farField: boolean) {
  const width = context.xSegments + 1;
  const height = context.zSegments + 1;
  const edgeThickness = farField ? 0.16 : 0.09;

  for (let x = 0; x < width; x += 1) {
    for (let z = 0; z < height; z += 1) {
      const idx = z * width + x;
      const nx = x / Math.max(width - 1, 1);
      const nz = z / Math.max(height - 1, 1);
      const edge = Math.max(Math.abs(nx - 0.5) / 0.5, Math.abs(nz - 0.5) / 0.5);
      const edgeBlend = smoothstep(1 - edgeThickness, 1, edge);
      const target = farField ? context.minHeight + 2.4 : context.minHeight + 1.8;
      heights[idx] = THREE.MathUtils.lerp(heights[idx], target, edgeBlend);
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
