import * as THREE from 'three';

import { mapProfileToProceduralUniforms } from './map-profile-to-procedural-uniforms';
import { ATMOSPHERE_FRAGMENT_SHADER, ATMOSPHERE_VERTEX_SHADER } from './shaders/atmosphere-shaders';
import { createCubeSphereTerrain } from './terrain/cube-sphere';
import type { PlanetRenderInput, PlanetRenderInstance, ProceduralPlanetUniforms } from './types';

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

export function applyPlanetRenderLod(
  baseParams: ProceduralPlanetUniforms,
  lod: 'galaxy' | 'planet' | undefined,
): ProceduralPlanetUniforms {
  if (lod === 'galaxy') {
    return {
      ...baseParams,
      meshResolution: Math.max(14, Math.min(22, baseParams.meshResolution - 4)),
      simpleStrength: baseParams.simpleStrength * 0.78,
      ridgedStrength: baseParams.ridgedStrength * 0.72,
      elevationCap: baseParams.elevationCap * 0.85,
      atmosphereIntensity: baseParams.atmosphereIntensity * 0.82,
    };
  }

  if (lod === 'planet') {
    return {
      ...baseParams,
      meshResolution: Math.min(64, baseParams.meshResolution + 18),
      simpleStrength: Math.min(0.9, baseParams.simpleStrength * 1.16),
      ridgedStrength: Math.min(0.92, baseParams.ridgedStrength * 1.34),
      elevationCap: Math.min(0.42, baseParams.elevationCap * 1.2 + 0.015),
      terrainSmoothing: Math.max(0.34, baseParams.terrainSmoothing * 0.85),
      ridgeAttenuation: Math.min(1, baseParams.ridgeAttenuation * 1.2),
      detailAttenuation: Math.min(1, baseParams.detailAttenuation * 1.2),
      atmosphereIntensity: Math.min(1, baseParams.atmosphereIntensity * 1.08),
    };
  }

  return baseParams;
}

export function createPlanetRenderInstance({ profile, x, y, z, options }: PlanetRenderInput): PlanetRenderInstance {
  const baseParams = mapProfileToProceduralUniforms(profile);
  const params = applyPlanetRenderLod(baseParams, options?.lod);

  const group = new THREE.Group();
  group.position.set(x, y, z);

  const { geometry, release } = getOrCreateGeometry(params);

  const material = new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    roughness: Math.max(0.12, params.roughness * (options?.lod === 'planet' ? 0.9 : 1)),
    metalness: params.metalness,
    clearcoat: options?.lod === 'planet' ? 0.16 : 0.04,
    clearcoatRoughness: options?.lod === 'planet' ? 0.25 : 0.6,
  });

  const planetMesh = new THREE.Mesh(geometry, material);
  group.add(planetMesh);

  let atmosphereGeometry: THREE.BufferGeometry | null = null;
  let atmosphereMaterial: THREE.ShaderMaterial | null = null;

  if (params.atmosphereEnabled && params.atmosphereIntensity > 0.01) {
    const atmoSegments = options?.lod === 'galaxy' ? 20 : options?.lod === 'planet' ? 56 : 34;
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
        uIntensity: { value: Math.min(1, params.atmosphereIntensity * 0.64 + 0.12) },
        uLightDirection: { value: new THREE.Vector3(0.72, 0.34, 0.6).normalize() },
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
