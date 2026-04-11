import * as THREE from 'three';
import type { PlanetGenerationConfig } from '@/game/planet/types';
import { FACE_DIRECTIONS } from '@/game/planet/utils/vector';
import { GpuTerrainGenerator } from '@/game/planet/generation/gpu/GpuTerrainGenerator';
import { CpuTerrainGenerator } from '@/game/planet/generation/cpu/CpuTerrainGenerator';
import { MinMax } from '@/game/planet/utils/minMax';
import { createPlanetMaterial } from '@/game/planet/materials/PlanetMaterial';
import { createAtmosphereMaterial } from '@/game/planet/materials/AtmosphereMaterial';

export class PlanetGenerator {
  private readonly gpu: GpuTerrainGenerator;
  private readonly cpu: CpuTerrainGenerator;

  constructor(private readonly renderer: THREE.WebGLRenderer) {
    this.gpu = new GpuTerrainGenerator(renderer);
    this.cpu = new CpuTerrainGenerator();
  }

  generate(config: PlanetGenerationConfig) {
    const root = new THREE.Group();
    const minMax = new MinMax();
    const faceData: Array<{ geometry: THREE.BufferGeometry }> = [];

    for (let i = 0; i < FACE_DIRECTIONS.length; i += 1) {
      const dir = FACE_DIRECTIONS[i].clone();
      const seed = config.seed ^ ((i + 1) * 0x9e3779b9);

      let generated;
      try {
        generated = this.gpu.generateFace(dir, config.resolution, config.filters, seed);
      } catch {
        generated = this.cpu.generateFace(dir, config.resolution, config.filters, seed);
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(generated.positions, 3));
      geometry.setAttribute('aElevation', new THREE.BufferAttribute(generated.elevations, 1));
      geometry.setIndex(new THREE.BufferAttribute(generated.indices, 1));
      geometry.computeVertexNormals();

      for (let e = 0; e < generated.elevations.length; e += 1) {
        minMax.add(generated.elevations[e]);
      }

      faceData.push({ geometry });
    }

    const material = createPlanetMaterial(
      config.elevationGradient,
      config.depthGradient,
      minMax.min,
      minMax.max,
      config.blendDepth,
      config.material.roughness,
      config.material.metalness,
    );

    for (const face of faceData) {
      const mesh = new THREE.Mesh(face.geometry, material);
      root.add(mesh);
    }

    if (config.atmosphere.enabled) {
      const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(config.radius * config.atmosphere.shellScale, 64, 64),
        createAtmosphereMaterial(config.atmosphere.color, config.atmosphere.intensity),
      );
      root.add(atmosphere);
    }

    return { root };
  }
}
