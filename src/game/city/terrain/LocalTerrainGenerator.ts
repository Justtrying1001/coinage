import { BufferAttribute, MathUtils, Mesh, PlaneGeometry, type Mesh as MeshType } from 'three';
import { buildCityTerrainContext } from '@/game/city/terrain/adapters/PlanetBiomeAdapter';
import { runMacroLandformPass } from '@/game/city/terrain/passes/MacroLandformPass';
import { runMesoFeaturePass } from '@/game/city/terrain/passes/MesoFeaturePass';
import { runMicroBreakupPass } from '@/game/city/terrain/passes/MicroBreakupPass';
import { directCityCamera } from '@/game/city/terrain/camera/CameraDirector';
import { computeSlopeField, planBuildZone } from '@/game/city/terrain/planning/BuildZonePlanner';
import { bilinearRadial, indexAt } from '@/game/city/terrain/passes/terrainMath';
import { createCityTerrainMaterial } from '@/game/city/terrain/material/CityTerrainMaterialLayer';
import type { TerrainResult, TerrainSampleField } from '@/game/city/terrain/types';
import type { PlanetGenerationConfig } from '@/game/planet/types';
import type { PlanetVisualProfile } from '@/game/render/types';

export interface CityTerrainBundle {
  mesh: MeshType;
  profile: PlanetVisualProfile;
  config: PlanetGenerationConfig;
  result: TerrainResult;
}

export function generateLocalCityTerrain(seed: number): CityTerrainBundle {
  const context = buildCityTerrainContext(seed);
  const width = context.recipe.resolution + 1;
  const height = context.recipe.resolution + 1;

  const macro = runMacroLandformPass(context, width, height);
  const meso = runMesoFeaturePass(context, macro);
  const micro = runMicroBreakupPass(context, meso);
  const shaped = enforceReservedZoneStability(context, micro);

  const cameraAnchors = directCityCamera(context, shaped);
  const buildZone = planBuildZone({ heights: shaped, context, cameraAnchors });
  const slopeField = computeSlopeField(shaped, context.recipe.terrainSize);
  const elevations = normalizeToElevation(shaped);

  const geometry = createTerrainGeometry(context.recipe.terrainSize, shaped, elevations);
  const material = createCityTerrainMaterial(context, elevations);
  const mesh = new Mesh(geometry, material);

  const result: TerrainResult = {
    grid: { size: context.recipe.terrainSize, resolution: context.recipe.resolution },
    heights: shaped,
    elevations,
    slopeField,
    buildZone,
    cameraAnchors,
    context,
  };

  return {
    mesh,
    profile: context.profile,
    config: context.config,
    result,
  };
}

function normalizeToElevation(heights: TerrainSampleField): TerrainSampleField {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < heights.data.length; i += 1) {
    min = Math.min(min, heights.data[i]);
    max = Math.max(max, heights.data[i]);
  }

  const elevations = new Float32Array(heights.data.length);
  const range = Math.max(0.001, max - min);
  for (let i = 0; i < heights.data.length; i += 1) {
    elevations[i] = MathUtils.clamp((heights.data[i] - min) / range, 0, 1);
  }

  return { width: heights.width, height: heights.height, data: elevations };
}

function createTerrainGeometry(size: number, heights: TerrainSampleField, elevations: TerrainSampleField) {
  const geometry = new PlaneGeometry(size, size, heights.width - 1, heights.height - 1);
  geometry.rotateX(-Math.PI / 2);

  const position = geometry.getAttribute('position');
  const elevArray = new Float32Array(position.count);

  for (let i = 0; i < position.count; i += 1) {
    position.setY(i, heights.data[i]);
    elevArray[i] = elevations.data[i];
  }

  geometry.setAttribute('aElevation', new BufferAttribute(elevArray, 1));
  geometry.computeVertexNormals();

  return geometry;
}

function enforceReservedZoneStability(context: TerrainResult['context'], field: TerrainSampleField): TerrainSampleField {
  const out = new Float32Array(field.data);
  const { width, height } = field;
  const cx = context.recipe.reservedZoneCenter[0];
  const cz = context.recipe.reservedZoneCenter[1];
  const rx = context.recipe.reservedZoneRadius[0];
  const rz = context.recipe.reservedZoneRadius[1];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = indexAt(x, y, width);
      const nx = x / (width - 1) * 2 - 1;
      const nz = y / (height - 1) * 2 - 1;
      const reserveMask = bilinearRadial(nx, nz, cx, cz, rx, rz);
      if (reserveMask < 0.04) continue;
      const x0 = Math.max(0, x - 1);
      const x1 = Math.min(width - 1, x + 1);
      const y0 = Math.max(0, y - 1);
      const y1 = Math.min(height - 1, y + 1);
      const localMean = (
        field.data[indexAt(x0, y, width)] +
        field.data[indexAt(x1, y, width)] +
        field.data[indexAt(x, y0, width)] +
        field.data[indexAt(x, y1, width)] +
        field.data[idx]
      ) / 5;

      out[idx] = MathUtils.lerp(out[idx], localMean, reserveMask * 0.65);
    }
  }

  return { width, height, data: out };
}
