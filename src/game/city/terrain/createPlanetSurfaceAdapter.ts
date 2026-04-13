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

  const size = 220;
  const resolution = Math.max(220, config.resolution + 88);
  const arcSpan = MathUtils.lerp(0.22, 0.36, MathUtils.clamp(profile.reliefSharpness * 0.5 + profile.reliefStrength * 2.4, 0, 1));

  const rng = new SeededRng(seed ^ 0x17c9ab2f);
  const phi = rng.range(0.38, 1.18);
  const theta = rng.range(0, Math.PI * 2);
  const patchCenter = new Vector3(
    Math.sin(phi) * Math.cos(theta),
    Math.cos(phi),
    Math.sin(phi) * Math.sin(theta),
  ).normalize();

  const tangent = new Vector3(0, 1, 0).cross(patchCenter);
  if (tangent.lengthSq() < 1e-5) tangent.set(1, 0, 0);
  tangent.normalize();
  const bitangent = new Vector3().crossVectors(patchCenter, tangent).normalize();

  const geometry = new PlaneGeometry(size, size, resolution, resolution);
  const position = geometry.getAttribute('position');
  const vertexCount = position.count;

  const elevations = new Float32Array(vertexCount);
  const unscaledRelief = new Float32Array(vertexCount);

  let minElevation = Number.POSITIVE_INFINITY;
  let maxElevation = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < vertexCount; i += 1) {
    const x = position.getX(i);
    const z = position.getY(i);
    const u = x / (size * 0.5);
    const w = z / (size * 0.5);

    const surfaceDir = new Vector3()
      .copy(patchCenter)
      .addScaledVector(tangent, u * arcSpan)
      .addScaledVector(bitangent, w * arcSpan)
      .normalize();

    const unscaled = calculateUnscaledElevation(surfaceDir, config.filters, seed);
    const elevation = 1 + unscaled;

    elevations[i] = elevation;
    unscaledRelief[i] = unscaled;

    if (elevation < minElevation) minElevation = elevation;
    if (elevation > maxElevation) maxElevation = elevation;
  }

  const surfaceLevel = MathUtils.lerp(minElevation, maxElevation, config.surfaceLevel01);
  const reliefAmplitude = MathUtils.lerp(56, 92, MathUtils.clamp(profile.reliefStrength * 3.2 + profile.reliefSharpness * 0.22, 0, 1));

  for (let i = 0; i < vertexCount; i += 1) {
    const elevation = elevations[i];
    const unscaled = Math.max(0, unscaledRelief[i]);
    const elevN = MathUtils.clamp((elevation - minElevation) / Math.max(0.0001, maxElevation - minElevation), 0, 1);

    const lowlandFlatten = elevation < surfaceLevel ? MathUtils.lerp(0.2, 0.62, config.surfaceLevel01) : 1;
    const peakLift = Math.pow(Math.max(0, elevN - 0.55), 1.5) * reliefAmplitude * 0.45;
    const localHeight = unscaled * reliefAmplitude * lowlandFlatten + peakLift;

    position.setZ(i, localHeight);
  }

  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();
  geometry.setAttribute('aElevation', new BufferAttribute(elevations, 1));

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
    0,
    { useWorldUp: true },
  );

  const mesh = new Mesh(geometry, material);
  return { mesh, profile, config };
}
