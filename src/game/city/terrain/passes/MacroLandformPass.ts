import type { CityTerrainContext, TerrainSampleField } from '@/game/city/terrain/types';
import { bilinearRadial, fbm2, indexAt } from '@/game/city/terrain/passes/terrainMath';

export function runMacroLandformPass(context: CityTerrainContext, width: number, height: number): TerrainSampleField {
  const heights = new Float32Array(width * height);
  const { recipe, seed } = context;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = indexAt(x, y, width);
      const nx = x / (width - 1) * 2 - 1;
      const nz = y / (height - 1) * 2 - 1;

      const radial = Math.sqrt(nx * nx + nz * nz);
      const basin = -Math.pow(Math.max(0, 1 - radial), 1.6) * (7 + recipe.macroAmplitude * 0.2);
      const rim = Math.pow(Math.max(0, radial - 0.55), 1.8) * recipe.skylineLift;
      const continental = fbm2(seed ^ 0x92f17d3b, nx + 1.3, nz - 0.7, 4, recipe.macroFrequency, 0.54) * recipe.macroAmplitude;

      const reserveShape = bilinearRadial(nx, nz, recipe.reservedZoneCenter[0], recipe.reservedZoneCenter[1], recipe.reservedZoneRadius[0], recipe.reservedZoneRadius[1]);
      const reserveFlatten = -reserveShape * recipe.macroAmplitude * (0.24 - recipe.reliefBias);

      heights[idx] = continental + basin + rim + reserveFlatten;
    }
  }

  return { width, height, data: heights };
}
