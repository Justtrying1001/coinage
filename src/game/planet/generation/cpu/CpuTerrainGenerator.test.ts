import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { CpuTerrainGenerator } from '@/game/planet/generation/cpu/CpuTerrainGenerator';
import { FACE_DIRECTIONS } from '@/game/planet/utils/vector';

describe('CpuTerrainGenerator', () => {
  it('produces outward-facing triangle winding for every cube face', () => {
    const generator = new CpuTerrainGenerator();

    for (const localUp of FACE_DIRECTIONS) {
      const result = generator.generateFace(localUp.clone(), 8, [], 1234);
      const positions = result.positions;
      const indices = result.indices;

      const ia = indices[0] * 3;
      const ib = indices[1] * 3;
      const ic = indices[2] * 3;

      const a = new THREE.Vector3(positions[ia], positions[ia + 1], positions[ia + 2]);
      const b = new THREE.Vector3(positions[ib], positions[ib + 1], positions[ib + 2]);
      const c = new THREE.Vector3(positions[ic], positions[ic + 1], positions[ic + 2]);

      const normal = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
      const center = new THREE.Vector3().add(a).add(b).add(c).multiplyScalar(1 / 3).normalize();
      expect(normal.dot(center)).toBeGreaterThan(0);
    }
  });
});
