import * as THREE from 'three';

import { mapProfileToProceduralUniforms } from './map-profile-to-procedural-uniforms';
import { ATMOSPHERE_FRAGMENT_SHADER, ATMOSPHERE_VERTEX_SHADER } from './shaders/atmosphere-shaders';
import { createCubeSphereTerrain } from './terrain/cube-sphere';
import type { PlanetRenderInput, PlanetRenderInstance } from './types';

interface CachedGeometryEntry {
  geometry: THREE.BufferGeometry;
  refs: number;
}

const GEOMETRY_CACHE = new Map<string, CachedGeometryEntry>();

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

export function createPlanetRenderInstance({ profile, x, y, z, options }: PlanetRenderInput): PlanetRenderInstance {
  const baseParams = mapProfileToProceduralUniforms(profile);
  const params = options?.lod === 'galaxy'
    ? {
      ...baseParams,
      meshResolution: Math.max(14, Math.min(20, baseParams.meshResolution - 2)),
    }
    : baseParams;

  const group = new THREE.Group();
  group.position.set(x, y, z);

  const { geometry, release } = getOrCreateGeometry(params);

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: params.roughness,
    metalness: params.metalness,
  });

  const planetMesh = new THREE.Mesh(geometry, material);
  group.add(planetMesh);

  let atmosphereGeometry: THREE.BufferGeometry | null = null;
  let atmosphereMaterial: THREE.ShaderMaterial | null = null;

  if (params.atmosphereEnabled && params.atmosphereIntensity > 0.01) {
    const atmoSegments = options?.lod === 'galaxy' ? 18 : 28;
    atmosphereGeometry = new THREE.SphereGeometry(
      params.radius * (1 + params.atmosphereThickness * 1.8),
      atmoSegments,
      atmoSegments,
    );

    atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: ATMOSPHERE_VERTEX_SHADER,
      fragmentShader: ATMOSPHERE_FRAGMENT_SHADER,
      uniforms: {
        uAtmosphereColor: { value: new THREE.Color(...params.atmosphereColor) },
        uIntensity: { value: Math.min(1, params.atmosphereIntensity * 0.7 + 0.14) },
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
      material.dispose();
      atmosphereGeometry?.dispose();
      atmosphereMaterial?.dispose();
    },
  };
}
