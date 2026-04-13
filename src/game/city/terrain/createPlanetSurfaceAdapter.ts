import {
  BufferAttribute,
  MathUtils,
  Mesh,
  PlaneGeometry,
  Vector3,
  type Mesh as MeshType,
} from 'three';
import { createPlanetGenerationConfig } from '@/game/planet/presets/archetypes';
import { createPlanetMaterial } from '@/game/planet/materials/PlanetMaterial';
import { evaluateFilter } from '@/game/planet/generation/noise/NoiseFilter';
import { createSeededNoise3D } from '@/game/planet/generation/noise/seededNoise';
import { planetProfileFromSeed } from '@/game/world/galaxyGenerator';
import type { NoiseFilterConfig, PlanetGenerationConfig } from '@/game/planet/types';
import type { PlanetVisualProfile } from '@/game/render/types';

export interface CityPlanetTerrain {
  mesh: MeshType;
  profile: PlanetVisualProfile;
  config: PlanetGenerationConfig;
}

interface TerrainSample {
  height: number;
  semanticElevation: number;
}

interface CityNoiseSamplers {
  warpNoise: ReturnType<typeof createSeededNoise3D>;
  detailNoise: ReturnType<typeof createSeededNoise3D>;
}

export function createPlanetSurfaceAdapter(seed: number): CityPlanetTerrain {
  const profile = planetProfileFromSeed(seed);
  const config = createPlanetGenerationConfig(seed, profile);

  const size = MathUtils.lerp(210, 300, MathUtils.clamp(profile.reliefStrength * 2.8 + profile.reliefSharpness * 0.4, 0, 1));
  const resolution = Math.max(256, config.resolution + 96);

  const geometry = new PlaneGeometry(size, size, resolution, resolution);
  const position = geometry.getAttribute('position');
  const vertexCount = position.count;

  const heights = new Float32Array(vertexCount);
  const semanticElevations = new Float32Array(vertexCount);

  let minHeight = Number.POSITIVE_INFINITY;
  let maxHeight = Number.NEGATIVE_INFINITY;
  let minSemantic = Number.POSITIVE_INFINITY;
  let maxSemantic = Number.NEGATIVE_INFINITY;

  const samplers: CityNoiseSamplers = {
    warpNoise: createSeededNoise3D(seed ^ 0x4fd13a7),
    detailNoise: createSeededNoise3D(seed ^ 0x294ed52f),
  };

  for (let i = 0; i < vertexCount; i += 1) {
    const worldX = position.getX(i);
    const worldZ = position.getY(i);
    const sample = sampleLocalTerrain(worldX / size, worldZ / size, config.filters, seed, profile.reliefStrength, profile.reliefSharpness, samplers);

    heights[i] = sample.height;
    semanticElevations[i] = sample.semanticElevation;

    if (sample.height < minHeight) minHeight = sample.height;
    if (sample.height > maxHeight) maxHeight = sample.height;

    if (sample.semanticElevation < minSemantic) minSemantic = sample.semanticElevation;
    if (sample.semanticElevation > maxSemantic) maxSemantic = sample.semanticElevation;
  }

  const amplitude = MathUtils.lerp(78, 138, MathUtils.clamp(profile.reliefStrength * 3 + profile.reliefSharpness * 0.5, 0, 1));
  const valleyLift = MathUtils.lerp(0.28, 0.5, MathUtils.clamp(config.surfaceLevel01 * 1.4, 0, 1));

  for (let i = 0; i < vertexCount; i += 1) {
    const h01 = MathUtils.clamp((heights[i] - minHeight) / Math.max(0.0001, maxHeight - minHeight), 0, 1);
    const broad = Math.pow(h01, MathUtils.lerp(1.16, 0.9, profile.reliefSharpness));
    const ridge = Math.pow(Math.max(0, h01 - 0.54), MathUtils.lerp(2.2, 1.45, profile.reliefSharpness));
    const valley = Math.pow(1 - h01, 2.1) * valleyLift;
    const terrainHeight = (broad * 0.82 + ridge * 1.2 - valley * 0.5) * amplitude;
    position.setZ(i, terrainHeight);
  }

  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();
  geometry.setAttribute('aElevation', new BufferAttribute(semanticElevations, 1));

  const material = createPlanetMaterial(
    config.elevationGradient,
    config.depthGradient,
    minSemantic,
    maxSemantic,
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

  const mesh = new Mesh(geometry, material);
  return { mesh, profile, config };
}

function sampleLocalTerrain(
  x: number,
  z: number,
  filters: NoiseFilterConfig[],
  seed: number,
  reliefStrength: number,
  reliefSharpness: number,
  samplers: CityNoiseSamplers,
): TerrainSample {
  const { warpNoise, detailNoise } = samplers;

  const warpStrength = MathUtils.lerp(0.15, 0.4, MathUtils.clamp(reliefSharpness * 2 + reliefStrength * 0.6, 0, 1));
  const warpScale = MathUtils.lerp(1.8, 3.4, MathUtils.clamp(reliefStrength * 2.8 + reliefSharpness * 0.5, 0, 1));

  const wx = x + (warpNoise(x * warpScale, z * warpScale, 1.37) - 0.5) * warpStrength;
  const wz = z + (warpNoise(x * warpScale, z * warpScale, 9.11) - 0.5) * warpStrength;

  const macroPoint = new Vector3(wx * 2.7, 0.2 + detailNoise(wx, wz, 0.37) * 0.32, wz * 2.7);
  const continental = evaluateFilter(macroPoint, filters[0], seed + 61, true);

  let layerSum = 0;
  let ridgeBand = 0;
  for (const [index, filter] of filters.entries()) {
    if (!filter.enabled) continue;
    const p = new Vector3(wx * (2.2 + index * 0.36), 0.2 + index * 0.08, wz * (2.2 + index * 0.36));
    const base = evaluateFilter(p, filter, seed + (index + 1) * 7919, true);
    const ridge = 1 - Math.abs(base * 2 - 1);
    const ridgeSharp = Math.pow(MathUtils.clamp(ridge, 0, 1), MathUtils.lerp(2.8, 1.4, reliefSharpness));

    layerSum += base * (index === 0 ? 0.5 : 0.65 + index * 0.08);
    ridgeBand += ridgeSharp * (0.16 + index * 0.08);
  }

  const erosionScale = MathUtils.lerp(4.6, 7.2, MathUtils.clamp(reliefStrength * 2.2, 0, 1));
  const erosion = detailNoise(wx * erosionScale, wz * erosionScale, 13.7);
  const terracing = Math.sin((wx + wz * 0.8) * MathUtils.lerp(18, 29, reliefSharpness)) * 0.018;
  const basinMask = MathUtils.clamp(1 - Math.max(0, continental) * 2.2, 0, 1);

  const semanticElevation = 1 + layerSum * 0.55 + ridgeBand * 0.45;
  const localHeight = layerSum * 0.72 + ridgeBand * (0.8 + reliefSharpness * 0.4) - basinMask * (0.14 + reliefStrength * 0.26)
    + (erosion - 0.5) * 0.18 + terracing;

  return { height: localHeight, semanticElevation };
}
