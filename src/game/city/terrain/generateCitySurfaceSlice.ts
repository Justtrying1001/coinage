import { BufferGeometry, Float32BufferAttribute, MathUtils, PlaneGeometry, Vector3 } from 'three';
import { calculateUnscaledElevation } from '@/game/planet/generation/noise/NoiseFilter';
import type { CityBiomeContext } from '@/game/city/runtime/CityBiomeContext';

export interface CitySurfaceSlice {
  geometry: BufferGeometry;
  sampleHeight: (x: number, z: number) => number;
  sampleNormal: (x: number, z: number) => Vector3;
  size: number;
}

interface GenerateSurfaceOptions {
  patchSize?: number;
  segments?: number;
  verticalScale?: number;
}

export function generateCitySurfaceSlice(context: CityBiomeContext, options: GenerateSurfaceOptions = {}): CitySurfaceSlice {
  const patchSize = options.patchSize ?? 64;
  const segments = options.segments ?? 160;
  const verticalScale = options.verticalScale ?? 30;

  const geometry = new PlaneGeometry(patchSize, patchSize, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  const up = new Vector3(...context.settlement.radialUp).normalize();
  const seedTangent = Math.abs(up.y) > 0.98 ? new Vector3(1, 0, 0) : new Vector3(0, 1, 0);
  const tangentX = new Vector3().crossVectors(seedTangent, up).normalize();
  const tangentZ = new Vector3().crossVectors(up, tangentX).normalize();

  const filters = context.planetGenerationConfig.filters;
  const seed = context.planetGenerationConfig.seed;

  const centerElevation = calculateUnscaledElevation(up, filters, seed);
  const position = geometry.getAttribute('position');

  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const localDirection = up
      .clone()
      .addScaledVector(tangentX, x / patchSize)
      .addScaledVector(tangentZ, z / patchSize)
      .normalize();

    const elevation = calculateUnscaledElevation(localDirection, filters, seed);
    const height = (elevation - centerElevation) * verticalScale;
    position.setY(i, height);
  }

  geometry.computeVertexNormals();
  const uv = geometry.getAttribute('uv');
  const uv2 = new Float32BufferAttribute(uv.array.slice(0), 2);
  geometry.setAttribute('uv2', uv2);

  const sampleHeight = (x: number, z: number) => {
    const direction = up
      .clone()
      .addScaledVector(tangentX, x / patchSize)
      .addScaledVector(tangentZ, z / patchSize)
      .normalize();
    const elevation = calculateUnscaledElevation(direction, filters, seed);
    return (elevation - centerElevation) * verticalScale;
  };

  const sampleNormal = (x: number, z: number) => {
    const d = 0.2;
    const hL = sampleHeight(x - d, z);
    const hR = sampleHeight(x + d, z);
    const hD = sampleHeight(x, z - d);
    const hU = sampleHeight(x, z + d);
    return new Vector3(hL - hR, d * 2, hD - hU).normalize();
  };

  applySettlementTerrace(geometry, context, sampleHeight);
  geometry.computeVertexNormals();

  return {
    geometry,
    sampleHeight,
    sampleNormal,
    size: patchSize,
  };
}

function applySettlementTerrace(geometry: BufferGeometry, context: CityBiomeContext, sampleHeight: (x: number, z: number) => number) {
  const position = geometry.getAttribute('position');
  const coreRadius = MathUtils.lerp(4.8, 7.2, context.settlement.habitability);
  const terraceHeight = sampleHeight(0, 0) + MathUtils.lerp(0.15, 0.4, context.planetProfile.reliefStrength);

  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const dist = Math.hypot(x, z);
    if (dist > coreRadius * 1.65) continue;

    const blend = 1 - MathUtils.smoothstep(dist, coreRadius * 0.68, coreRadius * 1.65);
    const y = position.getY(i);
    const flattened = MathUtils.lerp(y, terraceHeight, blend * 0.55);
    position.setY(i, flattened);
  }
}
