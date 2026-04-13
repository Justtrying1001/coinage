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

interface SamplingFrame {
  origin: Vector3;
  tangent: Vector3;
  bitangent: Vector3;
  macroScale: number;
}

export function createCityLandscapeTerrain(seed: number): CityPlanetTerrain {
  const profile = planetProfileFromSeed(seed);
  const config = createPlanetGenerationConfig(seed, profile);

  const rng = new SeededRng(seed ^ 0x6ea6bb5d);
  const frames = [createSamplingFrame(rng), createSamplingFrame(rng), createSamplingFrame(rng)];

  const size = 320;
  const resolution = Math.max(260, config.resolution + 140);
  const geometry = new PlaneGeometry(size, size, resolution, resolution);
  geometry.rotateX(-Math.PI / 2);

  const position = geometry.getAttribute('position');
  const vertexCount = position.count;

  const elevations = new Float32Array(vertexCount);
  const localHeights = new Float32Array(vertexCount);

  let minElevation = Number.POSITIVE_INFINITY;
  let maxElevation = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < vertexCount; i += 1) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const nx = x / (size * 0.5);
    const nz = z / (size * 0.5);

    const dnaUnscaled = samplePlanetDna(nx, nz, frames, config, seed);
    const elevation = 1 + dnaUnscaled;

    elevations[i] = elevation;
    if (elevation < minElevation) minElevation = elevation;
    if (elevation > maxElevation) maxElevation = elevation;

    const radial = Math.sqrt(nx * nx + nz * nz);
    const valley = Math.exp(-((nx * 0.85 + 0.12) ** 2 * 7.8 + (nz - 0.2) ** 2 * 3.8));
    const ridge = Math.exp(-((nx - 0.24) ** 2 * 4.3 + (nz + 0.04) ** 2 * 20));
    const horizonMass = Math.exp(-((nz + 0.72) ** 2) * 6.8) * (0.56 + Math.max(0, 1 - Math.abs(nx) * 0.75));
    const framingFalloff = Math.pow(MathUtils.clamp(1 - radial, 0, 1), 0.52);

    const composedHeight =
      dnaUnscaled * 58 * framingFalloff +
      ridge * 22 +
      horizonMass * 30 -
      valley * 20 -
      Math.pow(Math.max(0, radial - 0.84), 2) * 55;

    localHeights[i] = composedHeight;
  }

  const surfaceLevel = MathUtils.lerp(minElevation, maxElevation, config.surfaceLevel01);
  const heightBias = MathUtils.lerp(-4, 11, config.surfaceLevel01);

  for (let i = 0; i < vertexCount; i += 1) {
    const elevation = elevations[i];
    const elevationN = MathUtils.clamp(
      (elevation - minElevation) / Math.max(0.0001, maxElevation - minElevation),
      0,
      1,
    );

    const lowlandDamping = elevation < surfaceLevel ? MathUtils.lerp(0.42, 0.76, config.surfaceLevel01) : 1;
    const ridgeLift = Math.pow(Math.max(0, elevationN - 0.56), 1.4) * 26;
    const height = localHeights[i] * lowlandDamping + ridgeLift + heightBias;
    position.setY(i, height);
  }

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

function samplePlanetDna(
  nx: number,
  nz: number,
  frames: SamplingFrame[],
  config: PlanetGenerationConfig,
  seed: number,
): number {
  const warpX = Math.sin((nx + seed * 0.00031) * 6.3) * 0.07 + Math.cos((nz - seed * 0.00019) * 4.7) * 0.04;
  const warpZ = Math.cos((nz - seed * 0.00027) * 5.8) * 0.06 + Math.sin((nx + seed * 0.00013) * 7.1) * 0.03;

  const sampleA = sampleFrame(nx + warpX, nz + warpZ, frames[0], config, seed);
  const sampleB = sampleFrame(nx * 1.24 - warpZ * 0.75, nz * 1.18 + warpX * 0.68, frames[1], config, seed ^ 0x9e3779b9);
  const sampleC = sampleFrame(nx * 0.66 + warpZ * 0.42, nz * 0.72 - warpX * 0.35, frames[2], config, seed ^ 0x85ebca6b);

  return sampleA * 0.52 + sampleB * 0.31 + sampleC * 0.17;
}

function sampleFrame(
  nx: number,
  nz: number,
  frame: SamplingFrame,
  config: PlanetGenerationConfig,
  seed: number,
): number {
  const direction = new Vector3()
    .copy(frame.origin)
    .addScaledVector(frame.tangent, nx * frame.macroScale)
    .addScaledVector(frame.bitangent, nz * frame.macroScale)
    .normalize();

  return calculateUnscaledElevation(direction, config.filters, seed);
}

function createSamplingFrame(rng: SeededRng): SamplingFrame {
  const phi = rng.range(0.2, Math.PI - 0.2);
  const theta = rng.range(0, Math.PI * 2);
  const origin = new Vector3(
    Math.sin(phi) * Math.cos(theta),
    Math.cos(phi),
    Math.sin(phi) * Math.sin(theta),
  ).normalize();

  const tangent = new Vector3(0, 1, 0).cross(origin);
  if (tangent.lengthSq() < 1e-5) tangent.set(1, 0, 0);
  tangent.normalize();

  const bitangent = new Vector3().crossVectors(origin, tangent).normalize();

  return {
    origin,
    tangent,
    bitangent,
    macroScale: rng.range(0.21, 0.48),
  };
}
