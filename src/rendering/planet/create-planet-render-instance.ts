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

interface CachedAtmosphereMaterialEntry {
  material: THREE.ShaderMaterial;
  refs: number;
}

const ATMOSPHERE_MATERIAL_CACHE = new Map<string, CachedAtmosphereMaterialEntry>();

function quantize(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function buildGeometryKey(params: ReturnType<typeof mapProfileToProceduralUniforms>): string {
  const colorSignature = [
    ...params.baseColor,
    ...params.shallowWaterColor,
    ...params.landColor,
    ...params.mountainColor,
    ...params.iceColor,
  ]
    .map((channel) => quantize(channel, 0.002).toFixed(3))
    .join(',');

  return [
    `shape:${params.shapeSeed >>> 0}`,
    `relief:${params.reliefSeed >>> 0}`,
    `cat:${params.surfaceCategory}`,
    params.terrainProfile,
    `r:${quantize(params.radius, 0.02).toFixed(2)}`,
    `res:${Math.round(params.meshResolution)}`,
    `o:${quantize(params.oceanLevel, 0.01).toFixed(2)}`,
    `m:${quantize(params.mountainLevel, 0.01).toFixed(2)}`,
    `sf:${quantize(params.simpleFrequency, 0.04).toFixed(2)}`,
    `ss:${quantize(params.simpleStrength, 0.02).toFixed(2)}`,
    `rf:${quantize(params.ridgedFrequency, 0.06).toFixed(2)}`,
    `rs:${quantize(params.ridgedStrength, 0.02).toFixed(2)}`,
    `ec:${quantize(params.elevationCap, 0.01).toFixed(2)}`,
    `sm:${quantize(params.terrainSmoothing, 0.01).toFixed(2)}`,
    `ra:${quantize(params.ridgeAttenuation, 0.01).toFixed(2)}`,
    `da:${quantize(params.detailAttenuation, 0.01).toFixed(2)}`,
    `c:${colorSignature}`,
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

  const radius = params.radius;
  const targetResolution = radius < 1.7 ? 11 : radius < 2.8 ? 14 : 18;
  const reducedResolution = Math.max(10, Math.min(params.meshResolution, targetResolution));

  return {
    ...params,
    meshResolution: reducedResolution,
    ridgedStrength: params.ridgedStrength * 0.82,
    elevationCap: params.elevationCap * 0.9,
    detailAttenuation: params.detailAttenuation * 0.74,
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
    side: THREE.DoubleSide,
    emissive: new THREE.Color(0x14161b),
    emissiveIntensity: 0.1,
    envMapIntensity: 1.05,
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

  const geometry = new THREE.SphereGeometry(radius * (1 + thickness * 1.12), segments, segments);
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

function buildAtmosphereMaterialKey(params: ReturnType<typeof mapProfileToProceduralUniforms>): string {
  return [
    `c:${params.atmosphereColor.map((channel) => quantize(channel, 0.01).toFixed(2)).join(',')}`,
    `i:${quantize(params.atmosphereIntensity, 0.02).toFixed(2)}`,
    `t:${quantize(params.atmosphereThickness, 0.01).toFixed(2)}`,
  ].join('|');
}

function getOrCreateAtmosphereMaterial(params: ReturnType<typeof mapProfileToProceduralUniforms>): {
  material: THREE.ShaderMaterial;
  release: () => void;
} {
  const key = buildAtmosphereMaterialKey(params);
  const cached = ATMOSPHERE_MATERIAL_CACHE.get(key);
  if (cached) {
    cached.refs += 1;
    return {
      material: cached.material,
      release: () => {
        const current = ATMOSPHERE_MATERIAL_CACHE.get(key);
        if (!current) return;
        current.refs -= 1;
        if (current.refs <= 0) {
          current.material.dispose();
          ATMOSPHERE_MATERIAL_CACHE.delete(key);
        }
      },
    };
  }

  const material = new THREE.ShaderMaterial({
    vertexShader: ATMOSPHERE_VERTEX_SHADER,
    fragmentShader: ATMOSPHERE_FRAGMENT_SHADER,
    uniforms: {
      uAtmosphereColor: { value: new THREE.Color(...params.atmosphereColor) },
      uIntensity: { value: Math.min(0.5, params.atmosphereIntensity * 0.2 + 0.035) },
      uDensity: { value: Math.min(0.85, 0.44 + params.atmosphereThickness * 2.5) },
      uLightDirection: { value: new THREE.Vector3(0.38, 0.54, 0.75).normalize() },
    },
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
  });

  ATMOSPHERE_MATERIAL_CACHE.set(key, { material, refs: 1 });
  return {
    material,
    release: () => {
      const current = ATMOSPHERE_MATERIAL_CACHE.get(key);
      if (!current) return;
      current.refs -= 1;
      if (current.refs <= 0) {
        current.material.dispose();
        ATMOSPHERE_MATERIAL_CACHE.delete(key);
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

  if (material.userData.coinageRoughnessPatch !== true) {
    material.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float coinageWaterMaskColor = smoothstep(0.08, 0.26, vColor.b - max(vColor.r, vColor.g));
        float coinageMountainMaskColor = smoothstep(0.46, 0.86, vColor.r * 0.55 + vColor.g * 0.35);
        float coinageLandMaskColor = clamp(1.0 - coinageWaterMaskColor, 0.0, 1.0);
        vec3 biomeTint = vec3(1.0);
        biomeTint = mix(biomeTint, vec3(0.98, 1.0, 1.02), coinageWaterMaskColor * 0.45);
        biomeTint = mix(biomeTint, vec3(1.03, 1.01, 0.99), coinageMountainMaskColor * coinageLandMaskColor * 0.2);
        diffuseColor.rgb *= biomeTint;
        diffuseColor.rgb = min(diffuseColor.rgb * 1.04, vec3(1.0));`,
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        float coinageWaterMaskRoughness = smoothstep(0.08, 0.24, vColor.b - max(vColor.r, vColor.g));
        float coinageHighlandMaskRoughness = smoothstep(0.5, 0.84, vColor.r * 0.35 + vColor.g * 0.5 + vColor.b * 0.15);
        float coinageRidgeMicroRoughness = smoothstep(0.18, 0.72, abs(vColor.r - vColor.g) + abs(vColor.g - vColor.b));
        roughnessFactor = mix(roughnessFactor, 0.05, coinageWaterMaskRoughness * 0.94);
        roughnessFactor = mix(
          roughnessFactor,
          clamp(roughnessFactor * 1.24 + 0.1, 0.0, 1.0),
          coinageHighlandMaskRoughness * (1.0 - coinageWaterMaskRoughness)
        );
        roughnessFactor = mix(
          roughnessFactor,
          clamp(roughnessFactor + 0.08, 0.0, 1.0),
          coinageRidgeMicroRoughness * 0.38 * (1.0 - coinageWaterMaskRoughness)
        );`,
      );
    };
    material.userData.coinageRoughnessPatch = true;
    material.needsUpdate = true;
  }

  const planetMesh = new THREE.Mesh(geometry, material);
  group.add(planetMesh);

  let atmosphereGeometry: THREE.BufferGeometry | null = null;
  let releaseAtmosphereGeometry: (() => void) | null = null;
  let atmosphereMaterial: THREE.ShaderMaterial | null = null;
  let releaseAtmosphereMaterial: (() => void) | null = null;

  if (params.atmosphereEnabled && params.atmosphereIntensity > 0.01) {
    const atmoSegments = options?.lod === 'galaxy' ? 14 : 24;
    const cachedAtmosphere = getOrCreateAtmosphereGeometry(params.radius, params.atmosphereThickness, atmoSegments);
    atmosphereGeometry = cachedAtmosphere.geometry;
    releaseAtmosphereGeometry = cachedAtmosphere.release;
    const cachedAtmosphereMaterial = getOrCreateAtmosphereMaterial(params);
    atmosphereMaterial = cachedAtmosphereMaterial.material;
    releaseAtmosphereMaterial = cachedAtmosphereMaterial.release;

    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    group.add(atmosphereMesh);
  }

  return {
    object: group,
    dispose: () => {
      release();
      releaseMaterial();
      releaseAtmosphereGeometry?.();
      releaseAtmosphereMaterial?.();
    },
  };
}
