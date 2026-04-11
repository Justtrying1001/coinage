import * as THREE from 'three';
import type { NoiseFilterConfig } from '@/game/planet/types';
import { bufferVertexShader } from '@/game/planet/shaders/compute/bufferVertex';
import { vertexComputeFragmentShader } from '@/game/planet/shaders/compute/vertexComputeFragment';

interface GpuFaceResult {
  positions: Float32Array;
  elevations: Float32Array;
  indices: Uint32Array;
}

const MAX_FILTER_COUNT = 3;

export class GpuTerrainGenerator {
  constructor(private readonly renderer: THREE.WebGLRenderer) {}

  generateFace(localUp: THREE.Vector3, resolution: number, filters: NoiseFilterConfig[], seed: number): GpuFaceResult {
    const renderTarget = new THREE.WebGLRenderTarget(resolution, resolution, {
      type: THREE.FloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      depthBuffer: false,
      stencilBuffer: false,
    });

    const uniformFilters = normalizeFilters(filters);
    const scene = new THREE.Scene();
    const camera = new THREE.Camera();
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uResolution: { value: resolution },
        uLocalUp: { value: localUp },
        uSeed: { value: seed % 100000 },
        uFilterLength: { value: Math.min(uniformFilters.length, MAX_FILTER_COUNT) },
        uFilterParamsA: { value: uniformFilters.map((f) => new THREE.Vector4(f.strength, f.roughness, f.baseRoughness, f.persistence)) },
        uFilterParamsB: { value: uniformFilters.map((f) => new THREE.Vector4(f.minValue, f.layerCount, f.useFirstLayerAsMask ? 1 : 0, f.kind === 'ridgid' ? 1 : 0)) },
        uFilterCenter: { value: uniformFilters.map((f) => new THREE.Vector3(...f.center)) },
      },
      vertexShader: bufferVertexShader,
      fragmentShader: vertexComputeFragmentShader,
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(quad);

    this.renderer.setRenderTarget(renderTarget);
    this.renderer.render(scene, camera);
    this.renderer.setRenderTarget(null);

    const raw = new Float32Array(resolution * resolution * 4);
    this.renderer.readRenderTargetPixels(renderTarget, 0, 0, resolution, resolution, raw);

    const positions = new Float32Array(resolution * resolution * 3);
    const elevations = new Float32Array(resolution * resolution);
    for (let i = 0; i < resolution * resolution; i += 1) {
      positions[i * 3] = raw[i * 4];
      positions[i * 3 + 1] = raw[i * 4 + 1];
      positions[i * 3 + 2] = raw[i * 4 + 2];
      elevations[i] = raw[i * 4 + 3];
    }

    const indices = createIndices(resolution);

    renderTarget.dispose();
    material.dispose();
    quad.geometry.dispose();

    return { positions, elevations, indices };
  }
}

function createIndices(resolution: number) {
  const indices = new Uint32Array((resolution - 1) * (resolution - 1) * 6);
  let t = 0;
  for (let y = 0; y < resolution - 1; y += 1) {
    for (let x = 0; x < resolution - 1; x += 1) {
      const i = x + y * resolution;
      indices[t++] = i;
      indices[t++] = i + 1;
      indices[t++] = i + 1 + resolution;
      indices[t++] = i;
      indices[t++] = i + 1 + resolution;
      indices[t++] = i + resolution;
    }
  }
  return indices;
}

function normalizeFilters(filters: NoiseFilterConfig[]) {
  const base = [...filters.slice(0, MAX_FILTER_COUNT)];
  while (base.length < MAX_FILTER_COUNT) {
    base.push({
      kind: 'simple', enabled: false, strength: 0, roughness: 2, baseRoughness: 1, persistence: 0.5, minValue: 1.2, layerCount: 1, useFirstLayerAsMask: false, center: [0, 0, 0],
    });
  }
  return base;
}
