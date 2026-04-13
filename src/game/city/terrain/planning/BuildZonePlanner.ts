import type { BuildZonePlan, CameraAnchors, CityTerrainContext, TerrainSampleField } from '@/game/city/terrain/types';
import { bilinearRadial, indexAt } from '@/game/city/terrain/passes/terrainMath';

interface BuildZonePlannerInput {
  heights: TerrainSampleField;
  context: CityTerrainContext;
  cameraAnchors: CameraAnchors;
}

export function computeSlopeField(heights: TerrainSampleField, worldSize: number): TerrainSampleField {
  const { width, height } = heights;
  const slopes = new Float32Array(width * height);
  const cellSize = worldSize / Math.max(1, width - 1);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = indexAt(x, y, width);
      const x0 = Math.max(0, x - 1);
      const x1 = Math.min(width - 1, x + 1);
      const y0 = Math.max(0, y - 1);
      const y1 = Math.min(height - 1, y + 1);
      const dzdx = (heights.data[indexAt(x1, y, width)] - heights.data[indexAt(x0, y, width)]) / Math.max(cellSize, 0.001);
      const dzdy = (heights.data[indexAt(x, y1, width)] - heights.data[indexAt(x, y0, width)]) / Math.max(cellSize, 0.001);
      slopes[idx] = Math.atan(Math.sqrt(dzdx * dzdx + dzdy * dzdy)) * (180 / Math.PI);
    }
  }

  return { width, height, data: slopes };
}

export function planBuildZone(input: BuildZonePlannerInput): BuildZonePlan {
  const { heights, context, cameraAnchors } = input;
  const { width, height } = heights;
  const slopes = computeSlopeField(heights, context.recipe.terrainSize);
  const buildableMask = new Uint8Array(width * height);
  const reservedZoneMask = new Uint8Array(width * height);

  const usableSlopeCap = context.recipe.archetype === 'frozen' ? 14 : 12;
  const preferredRadiusX = context.recipe.reservedZoneRadius[0] * 0.92;
  const preferredRadiusZ = context.recipe.reservedZoneRadius[1] * 0.92;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = indexAt(x, y, width);
      const nx = x / (width - 1) * 2 - 1;
      const nz = y / (height - 1) * 2 - 1;
      const inReserve = bilinearRadial(nx, nz, context.recipe.reservedZoneCenter[0], context.recipe.reservedZoneCenter[1], preferredRadiusX, preferredRadiusZ) > 0.14;
      const slope = slopes.data[idx];
      const buildable = slope <= usableSlopeCap;
      if (buildable) buildableMask[idx] = 1;
      if (inReserve && buildable) reservedZoneMask[idx] = 1;
    }
  }

  const component = largestConnectedComponent(reservedZoneMask, width, height);
  const targetReservedCells = Math.round(width * height * 0.068);
  if (component.count < targetReservedCells) {
    enforceCentralFallback({ heights, slopes, reservedZoneMask, buildableMask, context, targetReservedCells });
  }

  const finalComponent = largestConnectedComponent(reservedZoneMask, width, height);
  const reservedSlopes: number[] = [];
  let buildableCount = 0;
  for (let i = 0; i < buildableMask.length; i += 1) {
    if (buildableMask[i] === 1) buildableCount += 1;
    if (reservedZoneMask[i] === 1) reservedSlopes.push(slopes.data[i]);
  }

  reservedSlopes.sort((a, b) => a - b);
  const meanSlope = reservedSlopes.length > 0 ? reservedSlopes.reduce((sum, v) => sum + v, 0) / reservedSlopes.length : 99;
  const p90 = reservedSlopes.length > 0 ? reservedSlopes[Math.floor((reservedSlopes.length - 1) * 0.9)] : 99;
  const contiguousScore = Math.min(1, finalComponent.count / Math.max(1, targetReservedCells));
  const cameraRelevance = estimateCameraRelevance(reservedZoneMask, heights, cameraAnchors);

  return {
    buildableMask: { width, height, data: buildableMask },
    reservedZoneMask: { width, height, data: reservedZoneMask },
    metrics: {
      meanSlopeBuildZone: meanSlope,
      p90SlopeBuildZone: p90,
      contiguousUsableAreaScore: contiguousScore,
      cameraBuildZoneRelevance: cameraRelevance,
      reservedCellCount: finalComponent.count,
      buildableCellCount: buildableCount,
    },
  };
}

function enforceCentralFallback(input: {
  heights: TerrainSampleField;
  slopes: TerrainSampleField;
  reservedZoneMask: Uint8Array;
  buildableMask: Uint8Array;
  context: CityTerrainContext;
  targetReservedCells: number;
}) {
  const { heights, slopes, reservedZoneMask, buildableMask, context, targetReservedCells } = input;
  const entries: Array<{ idx: number; score: number }> = [];

  for (let y = 0; y < heights.height; y += 1) {
    for (let x = 0; x < heights.width; x += 1) {
      const idx = indexAt(x, y, heights.width);
      const nx = x / (heights.width - 1) * 2 - 1;
      const nz = y / (heights.height - 1) * 2 - 1;
      const reserveAffinity = bilinearRadial(nx, nz, context.recipe.reservedZoneCenter[0], context.recipe.reservedZoneCenter[1], context.recipe.reservedZoneRadius[0], context.recipe.reservedZoneRadius[1]);
      const score = reserveAffinity * 5 - slopes.data[idx] * 0.08;
      entries.push({ idx, score });
    }
  }

  entries.sort((a, b) => b.score - a.score);

  for (let i = 0; i < Math.min(targetReservedCells, entries.length); i += 1) {
    const idx = entries[i].idx;
    reservedZoneMask[idx] = 1;
    buildableMask[idx] = 1;
    slopes.data[idx] = Math.min(slopes.data[idx], 9.5);
  }
}

function largestConnectedComponent(mask: Uint8Array, width: number, height: number) {
  const visited = new Uint8Array(mask.length);
  let bestCount = 0;

  for (let i = 0; i < mask.length; i += 1) {
    if (mask[i] === 0 || visited[i] === 1) continue;
    let count = 0;
    const queue = [i];
    visited[i] = 1;

    while (queue.length > 0) {
      const current = queue.pop() as number;
      count += 1;
      const x = current % width;
      const y = Math.floor(current / width);
      const neighbors = [
        [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1],
      ];

      for (const [nx, ny] of neighbors) {
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const nIdx = indexAt(nx, ny, width);
        if (mask[nIdx] === 0 || visited[nIdx] === 1) continue;
        visited[nIdx] = 1;
        queue.push(nIdx);
      }
    }

    bestCount = Math.max(bestCount, count);
  }

  return { count: bestCount };
}

function estimateCameraRelevance(mask: Uint8Array, heights: TerrainSampleField, camera: CameraAnchors) {
  const eye = camera.eye;
  const target = camera.target;
  const forward: [number, number, number] = [target[0] - eye[0], target[1] - eye[1], target[2] - eye[2]];
  const forwardLen = Math.hypot(forward[0], forward[1], forward[2]) || 1;
  const dir: [number, number, number] = [forward[0] / forwardLen, forward[1] / forwardLen, forward[2] / forwardLen];

  let relevant = 0;
  let total = 0;

  for (let y = 0; y < heights.height; y += 1) {
    for (let x = 0; x < heights.width; x += 1) {
      const idx = indexAt(x, y, heights.width);
      if (mask[idx] !== 1) continue;
      total += 1;
      const nx = x / (heights.width - 1) * 2 - 1;
      const nz = y / (heights.height - 1) * 2 - 1;
      const wx = nx * 0.5;
      const wy = heights.data[idx] / 150;
      const wz = nz * 0.5;
      const viewDot = (wx - eye[0] / 420) * dir[0] + (wy - eye[1] / 420) * dir[1] + (wz - eye[2] / 420) * dir[2];
      if (viewDot > 0) relevant += 1;
    }
  }

  if (total === 0) return 0;
  return relevant / total;
}
