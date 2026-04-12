import { BufferAttribute, BufferGeometry, MathUtils, Vector3 } from 'three';
import { calculateUnscaledElevation } from '@/game/planet/generation/noise/NoiseFilter';
import type { CityBiomeContext } from '@/game/city/terrain/CityBiomeContext';

interface CitySurfaceSliceOptions {
  size?: number;
  resolution?: number;
}

export interface CitySurfaceSlice {
  geometry: BufferGeometry;
  sampleHeight: (x: number, z: number) => number;
  minElevation: number;
  maxElevation: number;
}

export function generateCitySurfaceSlice(context: CityBiomeContext, options: CitySurfaceSliceOptions = {}): CitySurfaceSlice {
  const size = options.size ?? 46;
  const resolution = options.resolution ?? 112;

  const centerDir = new Vector3(...context.settlementSurfaceNormal).normalize();
  const centerPosition = new Vector3(...context.settlementSurfacePosition);
  const centerRadius = Math.max(0.001, centerPosition.length());

  const tangentX = new Vector3(0, 1, 0);
  if (Math.abs(centerDir.dot(tangentX)) > 0.95) tangentX.set(1, 0, 0);
  tangentX.cross(centerDir).normalize();
  const tangentZ = new Vector3().crossVectors(centerDir, tangentX).normalize();

  const config = context.planetGenerationConfig;
  // This mirrors PlanetGenerator's noise source-of-truth:
  // we sample the exact same filter stack (`config.filters`) around the selected settlement normal.
  const reliefAmplify = 24 + context.planetProfile.reliefStrength * 160;
  const sphereArcPerUnit = MathUtils.lerp(0.0045, 0.011, context.planetProfile.continentScale / 4);

  const vertexCount = resolution * resolution;
  const positions = new Float32Array(vertexCount * 3);
  const elevations = new Float32Array(vertexCount);
  const heights = new Float32Array(vertexCount);

  let minElevation = Number.POSITIVE_INFINITY;
  let maxElevation = Number.NEGATIVE_INFINITY;

  for (let gy = 0; gy < resolution; gy += 1) {
    for (let gx = 0; gx < resolution; gx += 1) {
      const index = gx + gy * resolution;
      const u = gx / (resolution - 1);
      const v = gy / (resolution - 1);
      const x = (u - 0.5) * size;
      const z = (v - 0.5) * size;

      const sampleDirection = centerDir.clone()
        .addScaledVector(tangentX, x * sphereArcPerUnit)
        .addScaledVector(tangentZ, z * sphereArcPerUnit)
        .normalize();

      const unscaledElevation = calculateUnscaledElevation(sampleDirection, config.filters, config.seed);
      const absoluteElevation = 1 + unscaledElevation;
      const samplePoint = sampleDirection.multiplyScalar(absoluteElevation);

      const localHeightRaw = samplePoint.dot(centerDir) - centerRadius;
      const localHeight = localHeightRaw * reliefAmplify;

      positions[index * 3] = x;
      positions[index * 3 + 1] = localHeight;
      positions[index * 3 + 2] = z;
      elevations[index] = absoluteElevation;
      heights[index] = localHeight;

      minElevation = Math.min(minElevation, absoluteElevation);
      maxElevation = Math.max(maxElevation, absoluteElevation);
    }
  }

  const indices = new Uint32Array((resolution - 1) * (resolution - 1) * 6);
  let t = 0;
  for (let y = 0; y < resolution - 1; y += 1) {
    for (let x = 0; x < resolution - 1; x += 1) {
      const i = x + y * resolution;
      indices[t++] = i;
      indices[t++] = i + 1;
      indices[t++] = i + 1 + resolution;
      indices[t++] = i;
      indices[t++] = i + 1 + resolution;
      indices[t++] = i + resolution;
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('aElevation', new BufferAttribute(elevations, 1));
  geometry.setIndex(new BufferAttribute(indices, 1));
  geometry.computeVertexNormals();

  const sampleHeight = (x: number, z: number) => {
    const px = MathUtils.clamp((x / size) + 0.5, 0, 1) * (resolution - 1);
    const pz = MathUtils.clamp((z / size) + 0.5, 0, 1) * (resolution - 1);

    const x0 = Math.floor(px);
    const z0 = Math.floor(pz);
    const x1 = Math.min(resolution - 1, x0 + 1);
    const z1 = Math.min(resolution - 1, z0 + 1);

    const tx = px - x0;
    const tz = pz - z0;

    const h00 = heights[x0 + z0 * resolution];
    const h10 = heights[x1 + z0 * resolution];
    const h01 = heights[x0 + z1 * resolution];
    const h11 = heights[x1 + z1 * resolution];

    const hx0 = MathUtils.lerp(h00, h10, tx);
    const hx1 = MathUtils.lerp(h01, h11, tx);
    return MathUtils.lerp(hx0, hx1, tz);
  };

  return {
    geometry,
    sampleHeight,
    minElevation,
    maxElevation,
  };
}
