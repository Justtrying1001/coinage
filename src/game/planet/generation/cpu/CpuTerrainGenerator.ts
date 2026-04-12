import * as THREE from 'three';
import type { NoiseFilterConfig } from '@/game/planet/types';
import { generateCpuFace } from '@/game/planet/generation/cpu/faceGenerationCore';

interface CpuFaceResult {
  positions: Float32Array;
  elevations: Float32Array;
  indices: Uint32Array;
}

export class CpuTerrainGenerator {
  generateFace(localUp: THREE.Vector3, resolution: number, filters: NoiseFilterConfig[], seed: number): CpuFaceResult {
    return generateCpuFace([localUp.x, localUp.y, localUp.z], resolution, filters, seed);
  }
}
