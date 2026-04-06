import * as THREE from 'three';

import { mapProfileToProceduralUniforms } from './map-profile-to-procedural-uniforms';
import { ATMOSPHERE_FRAGMENT_SHADER, ATMOSPHERE_VERTEX_SHADER } from './shaders/atmosphere-shaders';
import { createCubeSphereGeometryFromBuffers, createCubeSphereTerrain } from './terrain/cube-sphere';
import type {
  PlanetRenderInput,
  PlanetRenderInstance,
  PlanetRendererOptions,
  ProceduralPlanetUniforms,
  PrecomputedTerrainBuffers,
} from './types';

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
    `ml:${quantize(params.minLandRatio, 0.01).toFixed(2)}`,
    `sf:${quantize(params.simpleFrequency, 0.04).toFixed(2)}`,
    `ss:${quantize(params.simpleStrength, 0.02).toFixed(2)}`,
    `rf:${quantize(params.ridgedFrequency, 0.06).toFixed(2)}`,
    `rs:${quantize(params.ridgedStrength, 0.02).toFixed(2)}`,
    `ec:${quantize(params.elevationCap, 0.01).toFixed(2)}`,
    `sm:${quantize(params.terrainSmoothing, 0.01).toFixed(2)}`,
    `ra:${quantize(params.ridgeAttenuation, 0.01).toFixed(2)}`,
    `da:${quantize(params.detailAttenuation, 0.01).toFixed(2)}`,
    `ct:${quantize(params.continentThreshold, 0.01).toFixed(2)}`,
    `cs:${quantize(params.continentSharpness, 0.01).toFixed(2)}`,
    `cd:${quantize(params.continentDrift, 0.01).toFixed(2)}`,
    `td:${quantize(params.trenchDepth, 0.01).toFixed(2)}`,
    `bh:${quantize(params.biomeHarshness, 0.01).toFixed(2)}`,
    `css:${quantize(params.coastShelfScale, 0.01).toFixed(2)}`,
    `its:${quantize(params.inlandTransitionSharpness, 0.01).toFixed(2)}`,
    `bb:${quantize(params.basinBias, 0.01).toFixed(2)}`,
    `rb:${quantize(params.ridgeBias, 0.01).toFixed(2)}`,
    `cb:${quantize(params.constructibilityBias, 0.01).toFixed(2)}`,
    `c:${colorSignature}`,
  ].join('|');
}

function buildSurfaceMaterialKey(
  params: ReturnType<typeof mapProfileToProceduralUniforms>,
  lod: PlanetRendererOptions['lod'],
): string {
  return [
    `lod:${lod ?? 'planet'}`,
    `rough:${quantize(params.roughness, 0.04).toFixed(2)}`,
    `metal:${quantize(params.metalness, 0.04).toFixed(2)}`,
    `contrast:${quantize(params.colorContrast, 0.02).toFixed(2)}`,
    `thermal:${quantize(params.thermalActivity, 0.03).toFixed(2)}`,
  ].join('|');
}

function applyPlanetSurfaceShaderEnhancement(
  material: THREE.MeshStandardMaterial,
  params: ReturnType<typeof mapProfileToProceduralUniforms>,
): void {
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         attribute vec4 terrain;
         attribute vec4 terrainAux;
         attribute vec4 terrainGeo;
         attribute vec4 terrainRegion;
         varying vec4 vTerrainData;`,
      )
      .replace(
        'varying vec4 vTerrainData;',
        `varying vec4 vTerrainData;
         varying vec4 vTerrainAuxData;
         varying vec4 vTerrainGeoData;
         varying vec4 vTerrainRegionData;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vTerrainData = terrain;
         vTerrainAuxData = terrainAux;
         vTerrainGeoData = terrainGeo;
         vTerrainRegionData = terrainRegion;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         varying vec4 vTerrainData;
         varying vec4 vTerrainAuxData;
         varying vec4 vTerrainGeoData;
         varying vec4 vTerrainRegionData;
         uniform float uPlanetDetailIntensity;
         uniform float uPlanetContrast;
         uniform float uThermalActivity;`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
         float altitude = clamp(vTerrainData.x, 0.0, 1.0);
         float coastZone = clamp(vTerrainData.y, 0.0, 1.0);
         float fertileZone = clamp(vTerrainData.z, 0.0, 1.0);
         float ruggedZone = clamp(vTerrainData.a, 0.0, 1.0);
         float inlandness = clamp(vTerrainAuxData.y, 0.0, 1.0);
         float shelfZone = clamp(vTerrainAuxData.a, 0.0, 1.0);
         float ridgeZone = clamp(vTerrainGeoData.x, 0.0, 1.0);
         float basinZone = clamp(vTerrainGeoData.y, 0.0, 1.0);
         float constructibility = clamp(vTerrainGeoData.a, 0.0, 1.0);
         float wetnessZone = clamp(vTerrainRegionData.z, 0.0, 1.0);
         float erosionZone = clamp(vTerrainRegionData.w, 0.0, 1.0);
         float flatlandZone = clamp(fertileZone * (1.0 - ruggedZone), 0.0, 1.0);
         float detailMask = clamp(ruggedZone * 0.94 + ridgeZone * 0.42 + erosionZone * 0.26 + coastZone * 0.32 + shelfZone * 0.14 + (1.0 - flatlandZone) * 0.18 + inlandness * 0.08 - constructibility * 0.12 - wetnessZone * 0.1, 0.0, 1.0);
         float nPulseA = sin((vViewPosition.x + vViewPosition.y * 0.62) * 16.0 + altitude * 19.0);
         float nPulseB = cos((vViewPosition.z - vViewPosition.x * 0.33) * 13.0 + fertileZone * 17.0);
         float nPulseC = sin((vViewPosition.y + vViewPosition.z * 0.52) * 22.0 + coastZone * 14.0);
         vec3 detailPerturb = vec3(nPulseA, nPulseB, nPulseA * nPulseB + nPulseC * 0.55) * 0.031 * uPlanetDetailIntensity * detailMask;
         normal = normalize(normal + detailPerturb);`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
         float coastRough = 1.0 - clamp(vTerrainData.y * 0.78, 0.0, 0.54);
         float slopeRough = clamp(vTerrainData.a, 0.0, 1.0);
         float ridgeRough = clamp(vTerrainGeoData.x, 0.0, 1.0);
         float shelfSmooth = clamp(vTerrainAuxData.a * 0.22, 0.0, 0.2);
         float wetnessSmooth = clamp(vTerrainRegionData.z * 0.26, 0.0, 0.24);
         float erosionRough = clamp(vTerrainRegionData.w * 0.26, 0.0, 0.24);
         float fertileSmooth = clamp(vTerrainData.z * (1.0 - slopeRough) * 0.34, 0.0, 0.3);
         float plateauSmooth = clamp(vTerrainData.z * (1.0 - slopeRough * 1.3), 0.0, 1.0);
         float microRough = (sin(vTerrainData.z * 35.0 + vTerrainData.x * 31.0) * 0.5 + 0.5) * 0.07;
         roughnessFactor = clamp(roughnessFactor * coastRough + slopeRough * 0.14 + ridgeRough * 0.18 + erosionRough + microRough - fertileSmooth - plateauSmooth * 0.08 - shelfSmooth - wetnessSmooth, 0.24, 1.0);`,
      )
      .replace(
        '#include <dithering_fragment>',
        `float coastGlow = smoothstep(0.24, 0.96, vTerrainData.y) * 0.065;
         float inlandShade = smoothstep(0.2, 0.95, vTerrainAuxData.y) * 0.045;
         float basinTint = smoothstep(0.25, 0.95, basinZone) * 0.04;
         float shelfTint = smoothstep(0.15, 0.95, vTerrainAuxData.a) * 0.05;
         float wetnessTint = smoothstep(0.2, 0.92, vTerrainRegionData.z) * 0.045;
         float erosionTint = smoothstep(0.24, 0.94, vTerrainRegionData.w) * 0.05;
         float plateauTint = smoothstep(0.22, 0.94, vTerrainRegionData.y) * 0.03;
         float highlandShade = smoothstep(0.45, 0.96, vTerrainData.a) * 0.1;
         float fertileTint = smoothstep(0.28, 0.94, vTerrainData.z) * 0.048;
         float flatlandTint = smoothstep(0.45, 0.95, vTerrainData.z * (1.0 - vTerrainData.a)) * 0.048;
         float constructibilityTint = smoothstep(0.32, 0.96, vTerrainGeoData.a) * 0.038;
         float thermalTint = smoothstep(0.52, 0.92, vTerrainData.z) * uThermalActivity * 0.06;
         float breakup = sin((vViewPosition.x + vViewPosition.z) * 3.4 + vTerrainData.x * 29.0) * 0.5 + 0.5;
         gl_FragColor.rgb += vec3(coastGlow * 0.45, coastGlow * 0.5, coastGlow * 0.55);
         gl_FragColor.rgb += vec3(shelfTint * 0.12, shelfTint * 0.16, shelfTint * 0.2);
         gl_FragColor.rgb += vec3(0.01, 0.015, 0.005) * fertileTint;
         gl_FragColor.rgb += vec3(0.009, 0.011, 0.007) * basinTint;
         gl_FragColor.rgb += vec3(0.015, 0.018, 0.012) * flatlandTint;
         gl_FragColor.rgb += vec3(0.006, 0.015, 0.012) * wetnessTint;
         gl_FragColor.rgb += vec3(0.011, 0.009, 0.006) * erosionTint;
         gl_FragColor.rgb += vec3(0.01, 0.012, 0.009) * plateauTint;
         gl_FragColor.rgb += vec3(0.012, 0.015, 0.01) * constructibilityTint;
         gl_FragColor.rgb *= 1.0 - inlandShade * 0.08;
         gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * (1.0 - highlandShade) + vec3(0.048, 0.041, 0.036) * highlandShade, 0.76);
         gl_FragColor.rgb += vec3(thermalTint, thermalTint * 0.35, -thermalTint * 0.15);
         gl_FragColor.rgb *= 0.98 + breakup * 0.05;
         vec3 lum = vec3(dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114)));
         gl_FragColor.rgb = mix(lum, gl_FragColor.rgb, clamp(1.0 + (uPlanetContrast - 1.0) * 0.82, 0.85, 1.32));
         #include <dithering_fragment>`,
      );

    shader.uniforms.uPlanetDetailIntensity = { value: 1 };
    shader.uniforms.uPlanetContrast = { value: Math.min(1.5, params.colorContrast + 0.08) };
    shader.uniforms.uThermalActivity = { value: params.thermalActivity };
  };
  material.needsUpdate = true;
}

export function applyPlanetRenderLod(
  params: ProceduralPlanetUniforms,
  lod: PlanetRendererOptions['lod'],
): ProceduralPlanetUniforms {
  if (lod === 'planet') {
    return {
      ...params,
      meshResolution: Math.min(52, params.meshResolution + 14),
      ridgedStrength: Math.min(0.86, params.ridgedStrength * 1.22),
      detailAttenuation: Math.min(0.88, params.detailAttenuation * 1.42),
    };
  }

  if (lod !== 'galaxy') return params;

  const radius = params.radius;
  const targetResolution = radius < 2.6 ? 12 : radius < 3.7 ? 15 : 18;
  const reducedResolution = Math.max(10, Math.min(params.meshResolution, targetResolution));

  return {
    ...params,
    meshResolution: reducedResolution,
    ridgedStrength: params.ridgedStrength * 0.88,
    detailAttenuation: params.detailAttenuation * 0.8,
  };
}

function getOrCreateGeometry(
  params: ReturnType<typeof mapProfileToProceduralUniforms>,
  precomputedTerrainBuffers?: PrecomputedTerrainBuffers,
): {
  geometry: THREE.BufferGeometry;
  release: () => void;
} {
  if (precomputedTerrainBuffers) {
    const geometry = createCubeSphereGeometryFromBuffers(params, precomputedTerrainBuffers);
    return {
      geometry,
      release: () => {
        geometry.dispose();
      },
    };
  }

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

function getOrCreateSurfaceMaterial(
  params: ReturnType<typeof mapProfileToProceduralUniforms>,
  lod: PlanetRendererOptions['lod'],
): {
  material: THREE.MeshStandardMaterial;
  release: () => void;
} {
  const key = buildSurfaceMaterialKey(params, lod);
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

  const isPlanetLod = lod !== 'galaxy';
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: isPlanetLod ? 0.88 : 1,
    metalness: isPlanetLod ? 0.03 : 0,
    side: THREE.DoubleSide,
    emissive: new THREE.Color(isPlanetLod ? 0x10131a : 0x0f1116),
    emissiveIntensity: isPlanetLod ? 0.06 : 0.08,
    envMapIntensity: 0,
  });
  if (isPlanetLod) {
    applyPlanetSurfaceShaderEnhancement(material, params);
  }
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

export function createPlanetRenderInstance({
  profile,
  x,
  y,
  z,
  options,
  precomputedTerrainBuffers,
}: PlanetRenderInput): PlanetRenderInstance {
  const baseParams = mapProfileToProceduralUniforms(profile);
  const params = applyPlanetRenderLod(baseParams, options?.lod);

  const group = new THREE.Group();
  group.position.set(x, y, z);

  const { geometry, release } = getOrCreateGeometry(params, precomputedTerrainBuffers);

  const { material, release: releaseMaterial } = getOrCreateSurfaceMaterial(params, options?.lod);

  const planetMesh = new THREE.Mesh(geometry, material);
  group.add(planetMesh);

  let atmosphereGeometry: THREE.BufferGeometry | null = null;
  let releaseAtmosphereGeometry: (() => void) | null = null;
  let atmosphereMaterial: THREE.ShaderMaterial | null = null;
  let releaseAtmosphereMaterial: (() => void) | null = null;

  if (options?.enableAtmosphere === true && params.atmosphereEnabled && params.atmosphereIntensity > 0.01) {
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
