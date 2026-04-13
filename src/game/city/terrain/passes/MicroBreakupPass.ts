import type { CityTerrainContext, TerrainSampleField } from '@/game/city/terrain/types';
import { bilinearRadial, fbm2, indexAt } from '@/game/city/terrain/passes/terrainMath';

export function runMicroBreakupPass(context: CityTerrainContext, base: TerrainSampleField): TerrainSampleField {
  const out = new Float32Array(base.data);
  const { width, height } = base;
  const { recipe, seed } = context;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = indexAt(x, y, width);
      const nx = x / (width - 1) * 2 - 1;
      const nz = y / (height - 1) * 2 - 1;
      const reserveMask = bilinearRadial(nx, nz, recipe.reservedZoneCenter[0], recipe.reservedZoneCenter[1], recipe.reservedZoneRadius[0], recipe.reservedZoneRadius[1]);
      const breakup = fbm2(seed ^ 0xcb1ab31f, nx + 3.2, nz + 1.5, 3, recipe.microFrequency, 0.5);
      const safeWeight = 1 - reserveMask * 0.85;

      out[idx] += breakup * recipe.microAmplitude * safeWeight;
    }
  }

  return { width, height, data: out };
}
