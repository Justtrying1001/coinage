import * as THREE from 'three';

import type { PlanetFamily } from '@/domain/world/planet-visual.types';
import { getFamilyXenoLayers, sampleXenoElevation } from '@/rendering/planet/core/planet-core-xeno';
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
}

function buildFaceBasis(localUp: THREE.Vector3): { axisA: THREE.Vector3; axisB: THREE.Vector3 } {
  const axisA = new THREE.Vector3(localUp.y, localUp.z, localUp.x);
  const axisB = new THREE.Vector3().crossVectors(localUp, axisA);
  return { axisA, axisB };
}

export function buildTerrainFaceGeometry(input: TerrainFaceInput): THREE.BufferGeometry {
  const { localUp, resolution, radius, seed, oceanLevel, reliefAmplitude, family, minMax } = input;
  const { axisA, axisB } = buildFaceBasis(localUp);
  const layers = getFamilyXenoLayers(family);

  const vertexCount = resolution * resolution;
  const positions = new Float32Array(vertexCount * 3);
  const uv = new Float32Array(vertexCount * 2);
  const elevations = new Float32Array(vertexCount);
  const indices: number[] = [];

  let pointer = 0;
  for (let y = 0; y < resolution; y += 1) {
    for (let x = 0; x < resolution; x += 1) {
      const i = x + y * resolution;
      const percentX = x / (resolution - 1);
      const percentY = y / (resolution - 1);
      const pointOnCube = new THREE.Vector3()
        .copy(localUp)
        .addScaledVector(axisA, (percentX - 0.5) * 2)
        .addScaledVector(axisB, (percentY - 0.5) * 2);
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

      uv[i * 2] = safeUnscaled;
      uv[i * 2 + 1] = 0;
      elevations[i] = safeUnscaled;
      minMax.add(safeUnscaled);

      if (x !== resolution - 1 && y !== resolution - 1) {
        indices.push(i, i + resolution + 1, i + resolution);
        indices.push(i, i + 1, i + resolution + 1);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geometry.setAttribute('aUnscaledElevation', new THREE.BufferAttribute(elevations, 1));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

