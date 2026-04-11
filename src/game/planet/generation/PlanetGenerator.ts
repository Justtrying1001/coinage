import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { PlanetGenerationConfig } from '@/game/planet/types';
import { FACE_DIRECTIONS } from '@/game/planet/utils/vector';
import { GpuTerrainGenerator } from '@/game/planet/generation/gpu/GpuTerrainGenerator';
import { CpuTerrainGenerator } from '@/game/planet/generation/cpu/CpuTerrainGenerator';
import { MinMax } from '@/game/planet/utils/minMax';
import { createPlanetMaterial } from '@/game/planet/materials/PlanetMaterial';

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
    const faceGeometries: THREE.BufferGeometry[] = [];

    for (let i = 0; i < FACE_DIRECTIONS.length; i += 1) {
      const dir = FACE_DIRECTIONS[i].clone();
      let generated;
      try {
        generated = this.gpu.generateFace(dir, config.resolution, config.filters, config.seed);
      } catch {
        generated = this.cpu.generateFace(dir, config.resolution, config.filters, config.seed);
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(generated.positions, 3));
      geometry.setAttribute('aElevation', new THREE.BufferAttribute(generated.elevations, 1));
      geometry.setIndex(new THREE.BufferAttribute(generated.indices, 1));
      for (let e = 0; e < generated.elevations.length; e += 1) {
        minMax.add(generated.elevations[e]);
      }

      faceGeometries.push(geometry);
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

    const merged = BufferGeometryUtils.mergeGeometries(faceGeometries, false);
    if (!merged) {
      throw new Error('Failed to merge generated planet face geometries');
    }

    const deduped = BufferGeometryUtils.mergeVertices(merged, 1e-6);
    deduped.computeVertexNormals();

    faceGeometries.forEach((geometry) => geometry.dispose());
    merged.dispose();

    if (config.radius !== 1) {
      deduped.scale(config.radius, config.radius, config.radius);
    }

    const mesh = new THREE.Mesh(deduped, material);
    root.add(mesh);

    return { root };
  }
}
