import * as THREE from 'three';

import { mapProfileToProceduralUniforms } from './map-profile-to-procedural-uniforms';
import { ATMOSPHERE_FRAGMENT_SHADER, ATMOSPHERE_VERTEX_SHADER } from './shaders/atmosphere-shaders';
import { createCubeSphereTerrain } from './terrain/cube-sphere';
import type { PlanetRenderInput, PlanetRenderInstance, PlanetRendererOptions, ProceduralPlanetUniforms } from './types';

interface CachedGeometryEntry {
  geometry: THREE.BufferGeometry;
  refs: number;
}

const GEOMETRY_CACHE = new Map<string, CachedGeometryEntry>();
const ATMOSPHERE_GEOMETRY_CACHE = new Map<string, CachedGeometryEntry>();

interface CachedMaterialEntry {
  material: THREE.MeshStandardMaterial;
  refs: number;
}

const SURFACE_MATERIAL_CACHE = new Map<string, CachedMaterialEntry>();

function quantize(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function buildGeometryKey(params: ReturnType<typeof mapProfileToProceduralUniforms>): string {
  return [
    params.terrainProfile,
    `r:${quantize(params.radius, 0.5).toFixed(1)}`,
    `res:${Math.round(quantize(params.meshResolution, 4))}`,
    `rug:${quantize(params.simpleStrength + params.ridgedStrength, 0.16).toFixed(2)}`,
  ].join('|');
}

function buildSurfaceMaterialKey(params: ReturnType<typeof mapProfileToProceduralUniforms>): string {
  return [
    `rough:${quantize(params.roughness, 0.04).toFixed(2)}`,
    `metal:${quantize(params.metalness, 0.04).toFixed(2)}`,
  ].join('|');
}

export function applyPlanetRenderLod(
  params: ProceduralPlanetUniforms,
  lod: PlanetRendererOptions['lod'],
): ProceduralPlanetUniforms {
  if (lod !== 'galaxy') {
    return params;
  }

  return {
    ...params,
    meshResolution: Math.max(24, Math.round(params.meshResolution * 0.7)),
    detailAttenuation: params.detailAttenuation * 0.8,
  };
}

function getOrCreateGeometry(params: ReturnType<typeof mapProfileToProceduralUniforms>): {
  geometry: THREE.BufferGeometry;
  release: () => void;
} {
  const key = buildGeometryKey(params);
  const cached = GEOMETRY_CACHE.get(key);

  if (cached) {
    cached.refs += 1;
    return {
      geometry: cached.geometry,
      release: () => {
        const current = GEOMETRY_CACHE.get(key);
        if (!current) return;
        current.refs -= 1;
        if (current.refs <= 0) {
          current.geometry.dispose();
          GEOMETRY_CACHE.delete(key);
        }
      },
    };
  }

  const geometry = createCubeSphereTerrain(params);
  GEOMETRY_CACHE.set(key, { geometry, refs: 1 });

  return {
    geometry,
    release: () => {
      const current = GEOMETRY_CACHE.get(key);
      if (!current) return;
      current.refs -= 1;
      if (current.refs <= 0) {
        current.geometry.dispose();
        GEOMETRY_CACHE.delete(key);
      }
    },
  };
}

function getOrCreateSurfaceMaterial(params: ReturnType<typeof mapProfileToProceduralUniforms>): {
  material: THREE.MeshStandardMaterial;
  release: () => void;
} {
  const key = buildSurfaceMaterialKey(params);
  const cached = SURFACE_MATERIAL_CACHE.get(key);

  if (cached) {
    cached.refs += 1;
    return {
      material: cached.material,
      release: () => {
        const current = SURFACE_MATERIAL_CACHE.get(key);
        if (!current) return;
        current.refs -= 1;
        if (current.refs <= 0) {
          current.material.dispose();
          SURFACE_MATERIAL_CACHE.delete(key);
        }
      },
    };
  }

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: params.roughness,
    metalness: params.metalness,
  });
  SURFACE_MATERIAL_CACHE.set(key, { material, refs: 1 });
  return {
    material,
    release: () => {
      const current = SURFACE_MATERIAL_CACHE.get(key);
      if (!current) return;
      current.refs -= 1;
      if (current.refs <= 0) {
        current.material.dispose();
        SURFACE_MATERIAL_CACHE.delete(key);
      }
    },
  };
}

function getOrCreateAtmosphereGeometry(radius: number, thickness: number, segments: number): {
  geometry: THREE.BufferGeometry;
  release: () => void;
} {
  const key = [
    `r:${quantize(radius, 0.08).toFixed(2)}`,
    `t:${quantize(thickness, 0.008).toFixed(3)}`,
    `s:${segments}`,
  ].join('|');
  const cached = ATMOSPHERE_GEOMETRY_CACHE.get(key);
  if (cached) {
    cached.refs += 1;
    return {
      geometry: cached.geometry,
      release: () => {
        const current = ATMOSPHERE_GEOMETRY_CACHE.get(key);
        if (!current) return;
        current.refs -= 1;
        if (current.refs <= 0) {
          current.geometry.dispose();
          ATMOSPHERE_GEOMETRY_CACHE.delete(key);
        }
      },
    };
  }

  const geometry = new THREE.SphereGeometry(radius * (1 + thickness * 1.35), segments, segments);
  ATMOSPHERE_GEOMETRY_CACHE.set(key, { geometry, refs: 1 });
  return {
    geometry,
    release: () => {
      const current = ATMOSPHERE_GEOMETRY_CACHE.get(key);
      if (!current) return;
      current.refs -= 1;
      if (current.refs <= 0) {
        current.geometry.dispose();
        ATMOSPHERE_GEOMETRY_CACHE.delete(key);
      }
    },
  };
}

export function createPlanetRenderInstance({ profile, x, y, z, options }: PlanetRenderInput): PlanetRenderInstance {
  const baseParams = mapProfileToProceduralUniforms(profile);
  const params = applyPlanetRenderLod(baseParams, options?.lod);

  const group = new THREE.Group();
  group.position.set(x, y, z);

  const { geometry, release } = getOrCreateGeometry(params);

  const { material, release: releaseMaterial } = getOrCreateSurfaceMaterial(params);

  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `#include <roughnessmap_fragment>
      float waterMask = smoothstep(0.08, 0.24, vColor.b - max(vColor.r, vColor.g));
      float highlandMask = smoothstep(0.5, 0.85, vColor.r * 0.35 + vColor.g * 0.5 + vColor.b * 0.15);
      roughnessFactor = mix(roughnessFactor, 0.08, waterMask * 0.92);
      roughnessFactor = mix(roughnessFactor, clamp(roughnessFactor * 1.26 + 0.08, 0.0, 1.0), highlandMask * (1.0 - waterMask));`,
    );
  };

  const planetMesh = new THREE.Mesh(geometry, material);
  group.add(planetMesh);

  let atmosphereGeometry: THREE.BufferGeometry | null = null;
  let releaseAtmosphereGeometry: (() => void) | null = null;
  let atmosphereMaterial: THREE.ShaderMaterial | null = null;

  if (params.atmosphereEnabled && params.atmosphereIntensity > 0.01) {
    const atmoSegments = options?.lod === 'galaxy' ? 14 : 24;
    const cachedAtmosphere = getOrCreateAtmosphereGeometry(params.radius, params.atmosphereThickness, atmoSegments);
    atmosphereGeometry = cachedAtmosphere.geometry;
    releaseAtmosphereGeometry = cachedAtmosphere.release;

    atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: ATMOSPHERE_VERTEX_SHADER,
      fragmentShader: ATMOSPHERE_FRAGMENT_SHADER,
      uniforms: {
        uAtmosphereColor: { value: new THREE.Color(...params.atmosphereColor) },
        uIntensity: { value: Math.min(1, params.atmosphereIntensity * 0.42 + 0.06) },
      },
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
    });

    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    group.add(atmosphereMesh);
  }

  return {
    object: group,
    dispose: () => {
      release();
      releaseMaterial();
      releaseAtmosphereGeometry?.();
      atmosphereMaterial?.dispose();
    },
  };
}
