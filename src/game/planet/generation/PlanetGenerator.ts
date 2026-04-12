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
      config.seaLevel,
      config.surfaceLevel01,
      config.surfaceMode,
      config.archetype,
      config.material.roughness,
      config.material.metalness,
      config.material.vegetationDensity,
      config.material.wetness,
      config.material.canopyTint,
      config.material.slopeDarkening,
      config.material.basinDarkening,
      config.material.uplandLift,
      config.material.peakLift,
      config.material.shadowTint,
      config.material.shadowTintStrength,
      config.material.coastTintStrength,
      config.material.shallowSurfaceBrightness,
      config.material.microReliefStrength,
      config.material.microReliefScale,
      config.material.microNormalStrength,
      config.material.microAlbedoBreakup,
      config.material.hotspotCoverage,
      config.material.hotspotIntensity,
      config.material.fissureScale,
      config.material.fissureSharpness,
      config.material.lavaAccentStrength,
      config.material.emissiveStrength,
      config.material.basaltContrast,
      debugMode,
    );

    const merged = BufferGeometryUtils.mergeGeometries(faceGeometries, false);
    if (!merged) {
      throw new Error('Failed to merge generated planet face geometries');
    }

    const deduped = BufferGeometryUtils.mergeVertices(merged, 1e-6);
    this.applySubmergedReliefCompression(deduped, config, minMax.min, minMax.max);
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

    return { root, surfaceMesh: mesh, surfaceGeometry: deduped };
  }

  async generateAsync(config: PlanetGenerationConfig, options?: { preview?: boolean }) {
    const root = new THREE.Group();
    const minMax = new MinMax();
    const faceGeometries: THREE.BufferGeometry[] = [];
    const debugMode = this.readDebugMode();
    const preview = Boolean(options?.preview);

    for (let i = 0; i < FACE_DIRECTIONS.length; i += 1) {
      const dir = FACE_DIRECTIONS[i].clone();
      const generated = await this.cpu.generateFaceAsync(dir, config.resolution, config.filters, config.seed);

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(generated.positions, 3));
      geometry.setAttribute('aElevation', new THREE.BufferAttribute(generated.elevations, 1));
      geometry.setIndex(new THREE.BufferAttribute(generated.indices, 1));
      for (let e = 0; e < generated.elevations.length; e += 1) {
        minMax.add(generated.elevations[e]);
      }
      if (debugMode > 0) {
        this.logFaceStats(config, i, 'cpu', generated, geometry);
      }
      faceGeometries.push(geometry);
    }

    const material = createPlanetMaterial(
      config.elevationGradient,
      config.depthGradient,
      minMax.min,
      minMax.max,
      config.blendDepth,
      config.seaLevel,
      config.surfaceLevel01,
      config.surfaceMode,
      config.archetype,
      config.material.roughness,
      config.material.metalness,
      config.material.vegetationDensity,
      config.material.wetness,
      config.material.canopyTint,
      config.material.slopeDarkening,
      config.material.basinDarkening,
      config.material.uplandLift,
      config.material.peakLift,
      config.material.shadowTint,
      config.material.shadowTintStrength,
      config.material.coastTintStrength,
      config.material.shallowSurfaceBrightness,
      config.material.microReliefStrength,
      config.material.microReliefScale,
      config.material.microNormalStrength,
      config.material.microAlbedoBreakup,
      config.material.hotspotCoverage,
      config.material.hotspotIntensity,
      config.material.fissureScale,
      config.material.fissureSharpness,
      config.material.lavaAccentStrength,
      config.material.emissiveStrength,
      config.material.basaltContrast,
      debugMode,
    );

    const merged = BufferGeometryUtils.mergeGeometries(faceGeometries, false);
    if (!merged) {
      throw new Error('Failed to merge generated planet face geometries');
    }

    const geometry = preview ? merged : BufferGeometryUtils.mergeVertices(merged, 1e-6);
    this.applySubmergedReliefCompression(geometry, config, minMax.min, minMax.max);
    geometry.computeVertexNormals();
    if (debugMode > 0) {
      this.logMergedGeometryStats(config, geometry);
    }

    faceGeometries.forEach((faceGeometry) => faceGeometry.dispose());
    if (!preview) {
      merged.dispose();
    }

    if (config.radius !== 1) {
      geometry.scale(config.radius, config.radius, config.radius);
    }

    const mesh = new THREE.Mesh(geometry, material);
    root.add(mesh);
    return { root, surfaceMesh: mesh, surfaceGeometry: geometry };
  }

  private applySubmergedReliefCompression(geometry: THREE.BufferGeometry, config: PlanetGenerationConfig, minElevation: number, maxElevation: number) {
    const positions = geometry.getAttribute('position');
    const elevations = geometry.getAttribute('aElevation');
    if (!positions || !elevations) return;

    const baseStrength = THREE.MathUtils.clamp(config.material.submergedFlattening, 0, 1);
    if (baseStrength <= 0) return;

    const modeScale = config.surfaceMode === 'water' ? 1 : 0.72;
    const flattening = baseStrength * modeScale;
    const lowSurfaceElevation = THREE.MathUtils.lerp(minElevation, maxElevation, config.surfaceLevel01);
    const flattenRadius = lowSurfaceElevation;
    const depthRange = Math.max(0.04, (maxElevation - minElevation) * 0.42);

    for (let i = 0; i < positions.count; i += 1) {
      const elevation = elevations.getX(i);
      if (elevation >= lowSurfaceElevation) continue;

      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      const len = Math.hypot(x, y, z);
      if (len <= 1e-6) continue;

      const below = lowSurfaceElevation - elevation;
      const depthT = THREE.MathUtils.clamp(below / depthRange, 0, 1);
      const compression = flattening * depthT;
      const targetRadius = THREE.MathUtils.lerp(len, flattenRadius, compression);
      const scale = targetRadius / len;

      positions.setXYZ(i, x * scale, y * scale, z * scale);
    }

    positions.needsUpdate = true;
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
