import { createPlanetMaterial } from '@/game/planet/materials/PlanetMaterial';
import type { CityTerrainContext, TerrainSampleField } from '@/game/city/terrain/types';

export function createCityTerrainMaterial(context: CityTerrainContext, elevations: TerrainSampleField) {
  const { config } = context;

  let minElevation = Number.POSITIVE_INFINITY;
  let maxElevation = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < elevations.data.length; i += 1) {
    minElevation = Math.min(minElevation, elevations.data[i]);
    maxElevation = Math.max(maxElevation, elevations.data[i]);
  }

  return createPlanetMaterial(
    config.elevationGradient,
    config.depthGradient,
    minElevation,
    maxElevation,
    config.blendDepth,
    config.seaLevel,
    config.surfaceLevel01,
    config.surfaceMode,
    config.archetype,
    config.material.roughness,
    config.material.metalness,
    config.material.vegetationDensity,
    config.material.wetness,
    config.material.canopyTint,
    config.material.slopeDarkening,
    config.material.basinDarkening,
    config.material.uplandLift,
    config.material.peakLift,
    config.material.shadowTint,
    config.material.shadowTintStrength,
    config.material.coastTintStrength,
    config.material.shallowSurfaceBrightness,
    config.material.microReliefStrength,
    config.material.microReliefScale,
    config.material.microNormalStrength,
    config.material.microAlbedoBreakup,
    config.material.hotspotCoverage,
    config.material.hotspotIntensity,
    config.material.fissureScale,
    config.material.fissureSharpness,
    config.material.lavaAccentStrength,
    config.material.emissiveStrength,
    config.material.basaltContrast,
    0,
    { useWorldUp: true },
  );
}
