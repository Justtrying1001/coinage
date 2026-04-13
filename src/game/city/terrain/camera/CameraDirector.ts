import type { CameraAnchors, CityTerrainContext, TerrainSampleField } from '@/game/city/terrain/types';
import { bilinearRadial, indexAt } from '@/game/city/terrain/passes/terrainMath';

export function directCityCamera(context: CityTerrainContext, heights: TerrainSampleField): CameraAnchors {
  const zoneCenter = estimateReservedZoneCenter(context, heights);
  const azimuth = context.recipe.preferredViewAzimuth;
  const pitch = context.recipe.preferredViewPitch;
  const distance = context.recipe.terrainSize * 0.28;

  const eyeX = zoneCenter[0] + Math.cos(azimuth) * distance;
  const eyeZ = zoneCenter[2] + Math.sin(azimuth) * distance;
  const eyeY = zoneCenter[1] + context.recipe.terrainSize * (0.08 + pitch * 0.28);

  return {
    eye: [eyeX, eyeY, eyeZ],
    target: [zoneCenter[0], zoneCenter[1] + 6, zoneCenter[2]],
    horizon: [zoneCenter[0] - Math.cos(azimuth) * distance * 0.9, zoneCenter[1] + context.recipe.skylineLift, zoneCenter[2] - Math.sin(azimuth) * distance * 0.9],
    inspectEye: [zoneCenter[0] + distance * 1.2, eyeY + 12, zoneCenter[2] + distance * 1.15],
  };
}

function estimateReservedZoneCenter(context: CityTerrainContext, heights: TerrainSampleField): [number, number, number] {
  let bestIdx = 0;
  let bestScore = Number.NEGATIVE_INFINITY;
  const { width, height } = heights;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = indexAt(x, y, width);
      const nx = x / (width - 1) * 2 - 1;
      const nz = y / (height - 1) * 2 - 1;
      const reserve = bilinearRadial(nx, nz, context.recipe.reservedZoneCenter[0], context.recipe.reservedZoneCenter[1], context.recipe.reservedZoneRadius[0], context.recipe.reservedZoneRadius[1]);
      const altitudePenalty = Math.abs(heights.data[idx]) * 0.03;
      const score = reserve * 4 - altitudePenalty;
      if (score > bestScore) {
        bestScore = score;
        bestIdx = idx;
      }
    }
  }

  const bestX = bestIdx % width;
  const bestY = Math.floor(bestIdx / width);
  const worldX = (bestX / (width - 1) * 2 - 1) * (context.recipe.terrainSize * 0.5);
  const worldZ = (bestY / (height - 1) * 2 - 1) * (context.recipe.terrainSize * 0.5);
  const worldY = heights.data[bestIdx];
  return [worldX, worldY, worldZ];
}
