import * as THREE from 'three';

import type { PlanetFamily } from '@/domain/world/planet-visual.types';
import { createNoiseContract, sampleNoiseContractElevation } from './core/xenoverse-noise';

export interface DisplacedSphereInput {
  radius: number;
  segments: number;
  seed: number;
  oceanLevel: number;
  reliefAmplitude: number;
  family: PlanetFamily;
}

export interface DisplacedSphereBuildResult {
  geometry: THREE.BufferGeometry;
  minMax: { min: number; max: number };
}

const FACE_DIRS: Array<THREE.Vector3> = [
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(-1, 0, 0),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, -1, 0),
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(0, 0, -1),
];

function buildFaceBasis(localUp: THREE.Vector3): { axisA: THREE.Vector3; axisB: THREE.Vector3 } {
  const axisA = new THREE.Vector3(localUp.y, localUp.z, localUp.x);
  const axisB = new THREE.Vector3().crossVectors(localUp, axisA);
  return { axisA, axisB };
}

export function buildDisplacedSphereGeometry(input: DisplacedSphereInput): DisplacedSphereBuildResult {
  const resolution = Math.max(20, Math.floor(input.segments / 2));

  const positions: number[] = [];
  const indices: number[] = [];
  const unscaledElevation: number[] = [];

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  const noiseContract = createNoiseContract({
    family: input.family,
    seed: input.seed,
    reliefAmplitude: input.reliefAmplitude,
  });

  let vertexOffset = 0;

  for (const localUp of FACE_DIRS) {
    const { axisA, axisB } = buildFaceBasis(localUp);

    for (let y = 0; y < resolution; y += 1) {
      for (let x = 0; x < resolution; x += 1) {
        const px = x / (resolution - 1);
        const py = y / (resolution - 1);

        const pointOnCube = new THREE.Vector3()
          .copy(localUp)
          .addScaledVector(axisA, (px - 0.5) * 2)
          .addScaledVector(axisB, (py - 0.5) * 2);

        const pointOnUnitSphere = pointOnCube.normalize();
        const elevation = sampleNoiseContractElevation(noiseContract, pointOnUnitSphere);
        const safeUnscaled = Number.isFinite(elevation.unscaledElevation) ? elevation.unscaledElevation : 0;
        const safeScaled = Number.isFinite(elevation.scaledElevation) ? elevation.scaledElevation : 0;

        const displacedRadius = input.radius * (1 + safeScaled);

        positions.push(
          pointOnUnitSphere.x * displacedRadius,
          pointOnUnitSphere.y * displacedRadius,
          pointOnUnitSphere.z * displacedRadius,
        );

        unscaledElevation.push(safeUnscaled);
        min = Math.min(min, safeUnscaled);
        max = Math.max(max, safeUnscaled);
      }
    }

    for (let y = 0; y < resolution - 1; y += 1) {
      for (let x = 0; x < resolution - 1; x += 1) {
        const i = vertexOffset + x + y * resolution;
        indices.push(i, i + 1, i + resolution + 1);
        indices.push(i, i + resolution + 1, i + resolution);
      }
    }

    vertexOffset += resolution * resolution;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('aUnscaledElevation', new THREE.Float32BufferAttribute(unscaledElevation, 1));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return {
    geometry,
    minMax: {
      min: Number.isFinite(min) ? min : 0,
      max: Number.isFinite(max) ? max : 0,
    },
  };
}
