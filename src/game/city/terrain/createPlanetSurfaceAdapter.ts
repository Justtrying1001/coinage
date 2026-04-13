import {
  BufferAttribute,
  BufferGeometry,
  MathUtils,
  Mesh,
  Vector3,
  type Mesh as MeshType,
} from 'three';
import { createPlanetGenerationConfig } from '@/game/planet/presets/archetypes';
import { createPlanetMaterial } from '@/game/planet/materials/PlanetMaterial';
import { calculateUnscaledElevation } from '@/game/planet/generation/noise/NoiseFilter';
import { planetProfileFromSeed } from '@/game/world/galaxyGenerator';
import type { PlanetGenerationConfig } from '@/game/planet/types';
import type { PlanetVisualProfile } from '@/game/render/types';
import { SeededRng } from '@/game/world/rng';

export interface CityPlanetTerrain {
  mesh: MeshType;
  profile: PlanetVisualProfile;
  config: PlanetGenerationConfig;
}

export function createPlanetSurfaceAdapter(seed: number): CityPlanetTerrain {
  const profile = planetProfileFromSeed(seed);
  const config = createPlanetGenerationConfig(seed, profile);

  const patchResolution = Math.max(196, config.resolution + 64);
  const patchArc = MathUtils.lerp(0.36, 0.52, MathUtils.clamp(profile.reliefStrength * 1.4 + profile.reliefSharpness * 0.35, 0, 1));
  const worldScale = 54;

  const rng = new SeededRng(seed ^ 0x17c9ab2f);
  const phi = rng.range(0.45, 1.05);
  const theta = rng.range(0.2, Math.PI * 1.85);
  const patchCenter = new Vector3(
    Math.sin(phi) * Math.cos(theta),
    Math.cos(phi),
    Math.sin(phi) * Math.sin(theta),
  ).normalize();

  const tangent = new Vector3(0, 1, 0).cross(patchCenter);
  if (tangent.lengthSq() < 1e-5) tangent.set(1, 0, 0);
  tangent.normalize();
  const bitangent = new Vector3().crossVectors(patchCenter, tangent).normalize();

  const geometry = new BufferGeometry();
  const vertCount = patchResolution * patchResolution;
  const positions = new Float32Array(vertCount * 3);
  const elevations = new Float32Array(vertCount);
  const indices = new Uint32Array((patchResolution - 1) * (patchResolution - 1) * 6);

  let minElevation = Number.POSITIVE_INFINITY;
  let maxElevation = Number.NEGATIVE_INFINITY;

  let v = 0;
  for (let y = 0; y < patchResolution; y += 1) {
    for (let x = 0; x < patchResolution; x += 1) {
      const i = x + y * patchResolution;
      const u = (x / (patchResolution - 1)) * 2 - 1;
      const w = (y / (patchResolution - 1)) * 2 - 1;

      const surfaceDir = new Vector3()
        .copy(patchCenter)
        .addScaledVector(tangent, u * patchArc)
        .addScaledVector(bitangent, w * patchArc)
        .normalize();

      const unscaled = calculateUnscaledElevation(surfaceDir, config.filters, seed);
      const clampedRelief = Math.max(0, unscaled);
      const elevation = 1 + unscaled;
      const point = surfaceDir.multiplyScalar(1 + clampedRelief);

      positions[v++] = point.x * worldScale;
      positions[v++] = point.y * worldScale;
      positions[v++] = point.z * worldScale;
      elevations[i] = elevation;

      if (elevation < minElevation) minElevation = elevation;
      if (elevation > maxElevation) maxElevation = elevation;
    }
  }

  let t = 0;
  for (let y = 0; y < patchResolution - 1; y += 1) {
    for (let x = 0; x < patchResolution - 1; x += 1) {
      const i = x + y * patchResolution;
      indices[t++] = i + patchResolution;
      indices[t++] = i + patchResolution + 1;
      indices[t++] = i;
      indices[t++] = i + patchResolution + 1;
      indices[t++] = i + 1;
      indices[t++] = i;
    }
  }

  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('aElevation', new BufferAttribute(elevations, 1));
  geometry.setIndex(new BufferAttribute(indices, 1));
  geometry.computeVertexNormals();

  const material = createPlanetMaterial(
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
  );

  const mesh = new Mesh(geometry, material);
  return { mesh, profile, config };
}
