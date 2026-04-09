import * as THREE from 'three';

import type { PlanetFamily } from '@/domain/world/planet-visual.types';
import type { NoiseLayerConfig } from '@/rendering/planet/core/planet-core-xeno';
import { getFamilyXenoLayers, sampleXenoElevation } from '@/rendering/planet/core/planet-core-xeno';
import { runVertexComputeFace } from './compute/vertex-compute';
import { MinMax } from './min-max';

export interface TerrainFaceInput {
  localUp: THREE.Vector3;
  resolution: number;
  radius: number;
  seed: number;
  oceanLevel: number;
  reliefAmplitude: number;
  family: PlanetFamily;
  minMax: MinMax;
  renderer?: THREE.WebGLRenderer;
  preferCompute?: boolean;
}

function buildFaceBasis(localUp: THREE.Vector3): { axisA: THREE.Vector3; axisB: THREE.Vector3 } {
  const axisA = new THREE.Vector3(localUp.y, localUp.z, localUp.x);
  const axisB = new THREE.Vector3().crossVectors(localUp, axisA);
  return { axisA, axisB };
}

function fillIndices(resolution: number): number[] {
  const indices: number[] = [];
  for (let y = 0; y < resolution - 1; y += 1) {
    for (let x = 0; x < resolution - 1; x += 1) {
      const i = x + y * resolution;
      indices.push(i, i + resolution + 1, i + resolution);
      indices.push(i, i + 1, i + resolution + 1);
    }
  }
  return indices;
}

function runCpuFace(
  localUp: THREE.Vector3,
  axisA: THREE.Vector3,
  axisB: THREE.Vector3,
  resolution: number,
  radius: number,
  seed: number,
  oceanLevel: number,
  reliefAmplitude: number,
  layers: NoiseLayerConfig[],
): { positions: Float32Array; elevations: Float32Array } {
  const vertexCount = resolution * resolution;
  const positions = new Float32Array(vertexCount * 3);
  const elevations = new Float32Array(vertexCount);

  let pointer = 0;
  for (let y = 0; y < resolution; y += 1) {
    for (let x = 0; x < resolution; x += 1) {
      const i = x + y * resolution;
      const px = x / (resolution - 1);
      const py = y / (resolution - 1);

      const pointOnCube = new THREE.Vector3()
        .copy(localUp)
        .addScaledVector(axisA, (px - 0.5) * 2)
        .addScaledVector(axisB, (py - 0.5) * 2);
      const pointOnUnitSphere = pointOnCube.normalize();

      const sample = sampleXenoElevation(
        {
          seed,
          radius,
          reliefAmplitude,
          oceanLevel,
          layers,
        },
        pointOnUnitSphere,
      );
      const safeUnscaled = Number.isFinite(sample.unscaledElevation) ? sample.unscaledElevation : 0;
      const safeScaled = Number.isFinite(sample.scaledElevation) ? sample.scaledElevation : 0;
      const finalRadius = radius * (1 + safeScaled);

      positions[pointer] = pointOnUnitSphere.x * finalRadius;
      positions[pointer + 1] = pointOnUnitSphere.y * finalRadius;
      positions[pointer + 2] = pointOnUnitSphere.z * finalRadius;
      pointer += 3;
      elevations[i] = safeUnscaled;
    }
  }

  return { positions, elevations };
}

export function buildTerrainFaceGeometry(input: TerrainFaceInput): THREE.BufferGeometry {
  const { localUp, resolution, radius, seed, oceanLevel, reliefAmplitude, family, minMax, renderer, preferCompute } = input;
  const { axisA, axisB } = buildFaceBasis(localUp);
  const layers = getFamilyXenoLayers(family);
  const vertexCount = resolution * resolution;

  let positions: Float32Array;
  let elevations: Float32Array;
  let usedCompute = false;

  if (preferCompute && renderer) {
    try {
      const computed = runVertexComputeFace({
        renderer,
        localUp,
        axisA,
        axisB,
        resolution,
        radius,
        reliefAmplitude,
        seed,
        layers,
      });
      positions = computed.positions;
      elevations = computed.elevations;
      usedCompute = computed.usedCompute;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[XenoverseCompute] GPU path unavailable for face, CPU fallback used', error);
      }
      ({ positions, elevations } = runCpuFace(localUp, axisA, axisB, resolution, radius, seed, oceanLevel, reliefAmplitude, layers));
    }
  } else {
    ({ positions, elevations } = runCpuFace(localUp, axisA, axisB, resolution, radius, seed, oceanLevel, reliefAmplitude, layers));
  }

  const uv = new Float32Array(vertexCount * 2);
  for (let i = 0; i < vertexCount; i += 1) {
    uv[i * 2] = elevations[i]!;
    uv[i * 2 + 1] = usedCompute ? 1 : 0;
    minMax.add(elevations[i]!);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geometry.setAttribute('aUnscaledElevation', new THREE.BufferAttribute(elevations, 1));
  geometry.setIndex(fillIndices(resolution));
  geometry.computeVertexNormals();
  return geometry;
}

