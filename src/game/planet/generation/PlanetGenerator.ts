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
    const debugMode = this.readDebugMode();

    for (let i = 0; i < FACE_DIRECTIONS.length; i += 1) {
      const dir = FACE_DIRECTIONS[i].clone();
      let generated;
      let generationPath: 'gpu' | 'cpu' = 'gpu';
      try {
        generated = this.gpu.generateFace(dir, config.resolution, config.filters, config.seed);
      } catch {
        generated = this.cpu.generateFace(dir, config.resolution, config.filters, config.seed);
        generationPath = 'cpu';
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(generated.positions, 3));
      geometry.setAttribute('aElevation', new THREE.BufferAttribute(generated.elevations, 1));
      geometry.setIndex(new THREE.BufferAttribute(generated.indices, 1));
      for (let e = 0; e < generated.elevations.length; e += 1) {
        minMax.add(generated.elevations[e]);
      }
      if (debugMode > 0) {
        this.logFaceStats(config, i, generationPath, generated, geometry);
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
      config.material.vegetationDensity,
      config.material.wetness,
      debugMode,
    );

    const merged = BufferGeometryUtils.mergeGeometries(faceGeometries, false);
    if (!merged) {
      throw new Error('Failed to merge generated planet face geometries');
    }

    const deduped = BufferGeometryUtils.mergeVertices(merged, 1e-6);
    deduped.computeVertexNormals();
    if (debugMode > 0) {
      this.logMergedGeometryStats(config, deduped);
    }

    faceGeometries.forEach((geometry) => geometry.dispose());
    merged.dispose();

    if (config.radius !== 1) {
      deduped.scale(config.radius, config.radius, config.radius);
    }

    const mesh = new THREE.Mesh(deduped, material);
    root.add(mesh);

    return { root };
  }

  private readDebugMode() {
    if (typeof window === 'undefined') return 0;
    const debug = window as Window & { __COINAGE_PLANET_DEBUG_MODE__?: number };
    const value = debug.__COINAGE_PLANET_DEBUG_MODE__;
    return typeof value === 'number' ? value : 0;
  }

  private logFaceStats(
    config: PlanetGenerationConfig,
    faceIndex: number,
    generationPath: 'gpu' | 'cpu',
    generated: { positions: Float32Array; elevations: Float32Array; indices: Uint32Array },
    geometry: THREE.BufferGeometry,
  ) {
    const hasNonFiniteElevation = generated.elevations.some((value) => !Number.isFinite(value));
    const hasNonFinitePosition = generated.positions.some((value) => !Number.isFinite(value));
    console.info('[planet-audit] face', {
      seed: config.seed,
      archetype: config.archetype,
      resolution: config.resolution,
      faceIndex,
      generationPath,
      vertexCount: generated.positions.length / 3,
      indexCount: generated.indices.length,
      hasNonFiniteElevation,
      hasNonFinitePosition,
      attributes: Object.keys(geometry.attributes),
    });
  }

  private logMergedGeometryStats(config: PlanetGenerationConfig, geometry: THREE.BufferGeometry) {
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    const normals = geometry.getAttribute('normal');
    const normalArray = normals?.array ?? [];
    let normalNonFinite = 0;
    for (let i = 0; i < normalArray.length; i += 1) {
      if (!Number.isFinite(normalArray[i])) normalNonFinite += 1;
    }

    console.info('[planet-audit] merged', {
      seed: config.seed,
      archetype: config.archetype,
      indexed: Boolean(geometry.index),
      vertexCount: geometry.getAttribute('position').count,
      indexCount: geometry.index?.count ?? 0,
      bbox: geometry.boundingBox ? {
        min: geometry.boundingBox.min.toArray(),
        max: geometry.boundingBox.max.toArray(),
      } : null,
      radius: geometry.boundingSphere?.radius ?? 0,
      normalNonFinite,
      filterSummary: config.filters.map((filter, index) => ({
        index,
        kind: filter.kind,
        layerCount: filter.layerCount,
        minValue: filter.minValue,
        useFirstLayerAsMask: filter.useFirstLayerAsMask,
      })),
    });
  }
}
