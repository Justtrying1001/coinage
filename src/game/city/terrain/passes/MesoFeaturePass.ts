import type { CityTerrainContext, TerrainSampleField } from '@/game/city/terrain/types';
import { bilinearRadial, fbm2, indexAt } from '@/game/city/terrain/passes/terrainMath';

export function runMesoFeaturePass(context: CityTerrainContext, base: TerrainSampleField): TerrainSampleField {
  const out = new Float32Array(base.data);
  const { width, height } = base;
  const { recipe, seed, profile } = context;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = indexAt(x, y, width);
      const nx = x / (width - 1) * 2 - 1;
      const nz = y / (height - 1) * 2 - 1;
      const reserveMask = bilinearRadial(nx, nz, recipe.reservedZoneCenter[0], recipe.reservedZoneCenter[1], recipe.reservedZoneRadius[0], recipe.reservedZoneRadius[1]);
      const edgeMask = 1 - reserveMask;

      const ridges = Math.abs(fbm2(seed ^ 0xa4e281bf, nx - 0.8, nz + 0.2, 3, recipe.mesoFrequency, 0.55)) * recipe.mesoAmplitude;
      const channels = fbm2(seed ^ 0x5f356495, nx + 0.4, nz - 1.1, 4, recipe.mesoFrequency * 1.3, 0.5);
      const channelsCarve = -Math.pow(Math.max(0, 0.3 - Math.abs(channels)), 1.25) * recipe.mesoAmplitude * 0.9;
      const biomeBoost = profile.craterWeight * 0.3 + profile.ridgeWeight * 0.35;

      out[idx] += ridges * edgeMask * (0.42 + biomeBoost) + channelsCarve * edgeMask;

      if (recipe.archetype === 'volcanic') {
        const caldera = Math.exp(-((nx + 0.36) ** 2 * 9 + (nz - 0.18) ** 2 * 7));
        out[idx] -= caldera * 16;
      }

      if (recipe.archetype === 'oceanic') {
        const shelf = Math.exp(-((nx - 0.58) ** 2 * 7 + (nz + 0.2) ** 2 * 6));
        out[idx] -= shelf * 11;
      }

      if (recipe.archetype === 'jungle') {
        const perimeter = Math.pow(Math.max(0, Math.sqrt(nx * nx + nz * nz) - 0.45), 1.3);
        out[idx] += perimeter * 9;
      }
    }
  }

  return { width, height, data: out };
}
