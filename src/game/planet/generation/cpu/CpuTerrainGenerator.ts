import * as THREE from 'three';
import type { NoiseFilterConfig } from '@/game/planet/types';
import { spherize } from '@/game/planet/utils/spherize';
import { calculateUnscaledElevation } from '@/game/planet/generation/noise/NoiseFilter';

interface CpuFaceResult {
  positions: Float32Array;
  elevations: Float32Array;
  indices: Uint32Array;
}

export class CpuTerrainGenerator {
  generateFace(localUp: THREE.Vector3, resolution: number, filters: NoiseFilterConfig[], seed: number): CpuFaceResult {
    const positions = new Float32Array(resolution * resolution * 3);
    const elevations = new Float32Array(resolution * resolution);
    const axisA = new THREE.Vector3(localUp.y, localUp.z, localUp.x);
    const axisB = new THREE.Vector3().crossVectors(localUp, axisA);

    let v = 0;
    for (let y = 0; y < resolution; y += 1) {
      for (let x = 0; x < resolution; x += 1) {
        const i = x + y * resolution;
        const percentX = x / (resolution - 1);
        const percentY = y / (resolution - 1);
        const pointOnCube = new THREE.Vector3()
          .add(localUp)
          .addScaledVector(axisA, (percentX - 0.5) * 2)
          .addScaledVector(axisB, (percentY - 0.5) * 2);

        const pointOnUnitSphere = spherize(pointOnCube).normalize();
        const unscaled = calculateUnscaledElevation(pointOnUnitSphere, filters, seed);
        const scaled = Math.max(0, unscaled);
        const pointOnPlanet = pointOnUnitSphere.multiplyScalar(1 + scaled);

        positions[v++] = pointOnPlanet.x;
        positions[v++] = pointOnPlanet.y;
        positions[v++] = pointOnPlanet.z;
        elevations[i] = 1 + unscaled;
      }
    }

    const indices = new Uint32Array((resolution - 1) * (resolution - 1) * 6);
    let t = 0;
    for (let y = 0; y < resolution - 1; y += 1) {
      for (let x = 0; x < resolution - 1; x += 1) {
        const i = x + y * resolution;
        indices[t++] = i + resolution + 1;
        indices[t++] = i + 1;
        indices[t++] = i;
        indices[t++] = i + resolution;
        indices[t++] = i + resolution + 1;
        indices[t++] = i;
      }
    }

    return { positions, elevations, indices };
  }
}
