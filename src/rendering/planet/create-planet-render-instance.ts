import * as THREE from 'three';

import { createPlanetViewProfile } from '@/domain/world/generate-planet-visual-profile';
import type { PlanetRenderInput, PlanetRenderInstance } from './types';
import { buildDisplacedSphereGeometry, OCEAN_FAMILIES } from './build-displaced-sphere';
import {
  SURFACE_FRAGMENT_SHADER_PLANET,
  SURFACE_VERTEX_SHADER_PLANET,
} from './surface/surface-shader-assembly';

function toColor(value: [number, number, number]): THREE.Color {
  return new THREE.Color(value[0], value[1], value[2]);
}

function createSurfaceLayer(
  planetRadius: number,
  render: PlanetRenderInput['planet']['render'],
  segments: number,
  lightingBoost: number,
): THREE.Mesh {
  const geometry = buildDisplacedSphereGeometry({
    radius: planetRadius,
    segments,
    seed: render.surface.noiseSeed,
    moistureSeed: render.surface.moistureSeed,
    thermalSeed: render.surface.thermalSeed,
    oceanLevel: render.surface.oceanLevel,
    reliefAmplitude: render.surface.reliefAmplitude,
    bandingStrength: render.surface.bandingStrength,
    family: render.family,
    surfaceModel: render.surfaceModel,
  });

  const material = new THREE.ShaderMaterial({
    vertexShader: SURFACE_VERTEX_SHADER_PLANET,
    fragmentShader: SURFACE_FRAGMENT_SHADER_PLANET,
    uniforms: {
      uColorDeep: { value: toColor(render.surface.colorDeep) },
      uColorMid: { value: toColor(render.surface.colorMid) },
      uColorHigh: { value: toColor(render.surface.colorHigh) },
      uOceanColor: { value: toColor(render.surface.oceanColor) },
      uAccentColor: { value: toColor(render.surface.accentColor) },
      uEmissive: { value: render.surface.emissiveIntensity },
      uRoughness: { value: render.surface.roughness },
      uSpecularStrength: { value: render.surface.specularStrength },
      uLightingBoost: { value: lightingBoost },
      uLightDirection: { value: new THREE.Vector3(0.38, 0.76, 0.52).normalize() },
    },
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'surface';
  mesh.userData.rotationSpeed = render.surfaceModel === 'gaseous' ? 0.013 : 0.02;
  return mesh;
}

function createOceanLayer(
  planetRadius: number,
  render: PlanetRenderInput['planet']['render'],
): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(planetRadius * 0.9978, 128, 128);

  const material = new THREE.MeshPhysicalMaterial({
    color: toColor(render.surface.oceanColor),
    transmission: 0.15,
    roughness: 0.1,
    metalness: 0.02,
    transparent: true,
    opacity: 0.48,
    clearcoat: 0.3,
    clearcoatRoughness: 0.1,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'ocean';
  mesh.userData.rotationSpeed = 0.007;
  return mesh;
}

function createCloudLayer(
  planetRadius: number,
  render: PlanetRenderInput['planet']['render'],
  segments: number,
): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(planetRadius * (1 + Math.max(0.012, render.atmosphere.thickness * 0.45)), segments, segments);

  const vertexShader = `
    varying vec3 vWorldPos;
    varying vec3 vNormalW;
    varying vec3 vUnitPos;
    void main() {
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWorldPos = wp.xyz;
      vNormalW = normalize(mat3(modelMatrix) * normal);
      vUnitPos = normalize(position);
      gl_Position = projectionMatrix * viewMatrix * wp;
    }
  `;

  const fragmentShader = `
    varying vec3 vWorldPos;
    varying vec3 vNormalW;
    varying vec3 vUnitPos;
    uniform vec3 uCloudColor;
    uniform float uCoverage;
    uniform float uOpacity;
    uniform float uSeed;
    uniform float uTime;
    uniform vec3 uLightDirection;

    float hash(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7))) * 43758.5453); }
    float noise(vec3 p){
      vec3 i = floor(p);
      vec3 f = fract(p);
      f = f*f*(3.0-2.0*f);
      float n000 = hash(i + vec3(0,0,0));
      float n100 = hash(i + vec3(1,0,0));
      float n010 = hash(i + vec3(0,1,0));
      float n110 = hash(i + vec3(1,1,0));
      float n001 = hash(i + vec3(0,0,1));
      float n101 = hash(i + vec3(1,0,1));
      float n011 = hash(i + vec3(0,1,1));
      float n111 = hash(i + vec3(1,1,1));
      float nx00 = mix(n000, n100, f.x);
      float nx10 = mix(n010, n110, f.x);
      float nx01 = mix(n001, n101, f.x);
      float nx11 = mix(n011, n111, f.x);
      float nxy0 = mix(nx00, nx10, f.y);
      float nxy1 = mix(nx01, nx11, f.y);
      return mix(nxy0, nxy1, f.z);
    }

    void main() {
      vec3 p = vUnitPos * 5.4 + vec3(uTime * 0.02, 0.0, -uTime * 0.015) + uSeed * 0.0001;
      float n = noise(p) * 0.7 + noise(p * 2.0) * 0.3;
      float alpha = smoothstep(1.0 - uCoverage, 1.0, n) * uOpacity;
      vec3 normal = normalize(vNormalW);
      float light = max(dot(normal, normalize(uLightDirection)), 0.0);
      float rim = pow(1.0 - max(dot(normal, normalize(cameraPosition - vWorldPos)), 0.0), 2.8) * 0.25;
      vec3 col = uCloudColor * (0.46 + light * 0.84 + rim);
      gl_FragColor = vec4(col, alpha);
    }
  `;

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uCloudColor: { value: toColor(render.clouds.color) },
      uCoverage: { value: Math.min(0.86, Math.max(0.2, render.clouds.coverage)) },
      uOpacity: { value: Math.min(0.9, Math.max(0.15, render.clouds.opacity)) },
      uSeed: { value: render.clouds.noiseSeed },
      uTime: { value: 0 },
      uLightDirection: { value: new THREE.Vector3(0.38, 0.76, 0.52).normalize() },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'clouds';
  mesh.userData.rotationSpeed = Math.max(0.006, render.clouds.speed * 0.06);
  return mesh;
}

function createAtmosphereLayer(
  planetRadius: number,
  render: PlanetRenderInput['planet']['render'],
  segments: number,
): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(planetRadius * (1 + Math.max(0.04, render.atmosphere.thickness + 0.02)), segments, segments);

  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uAtmosphereColor: { value: toColor(render.atmosphere.color) },
      uDensity: { value: Math.max(0.18, render.atmosphere.density) },
      uRimStrength: { value: render.atmosphere.rimStrength },
    },
    vertexShader: `
      varying vec3 vNormalW;
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      varying vec3 vNormalW;
      varying vec3 vWorldPos;
      uniform vec3 uAtmosphereColor;
      uniform float uDensity;
      uniform float uRimStrength;
      void main() {
        vec3 normal = normalize(vNormalW);
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.8);
        float alpha = clamp(fresnel * uRimStrength * uDensity, 0.0, 0.75);
        gl_FragColor = vec4(uAtmosphereColor, alpha);
      }
    `,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'atmosphere';
  mesh.userData.rotationSpeed = 0;
  return mesh;
}

function createRingLayer(render: PlanetRenderInput['planet']['render'], segments: number): THREE.Mesh {
  const geometry = new THREE.RingGeometry(render.rings.innerRadius, render.rings.outerRadius, segments, 1);
  const material = new THREE.MeshBasicMaterial({
    color: toColor(render.rings.color),
    transparent: true,
    opacity: Math.min(0.88, render.rings.opacity * 1.25),
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const ring = new THREE.Mesh(geometry, material);
  ring.name = 'rings';
  ring.rotation.x = Math.PI / 2 + render.rings.tilt;
  ring.userData.rotationSpeed = 0.008;
  return ring;
}

function shouldRenderLayer(
  layer: 'surface' | 'clouds' | 'atmosphere' | 'rings',
  debug: NonNullable<PlanetRenderInput['options']['debug']> | undefined,
): boolean {
  if (!debug) return true;
  const toggles = {
    surface: debug.surfaceOnly,
    clouds: debug.cloudsOnly,
    atmosphere: debug.atmosphereOnly,
    rings: debug.ringsOnly,
  };

  const enabledExclusive = Object.values(toggles).some(Boolean);
  if (!enabledExclusive) return true;
  return Boolean(toggles[layer]);
}

export function updatePlanetLayerAnimation(object: THREE.Object3D, deltaSeconds: number, freezeRotation = false): void {
  if (freezeRotation) return;

  object.traverse((node) => {
    const speed = typeof node.userData.rotationSpeed === 'number' ? node.userData.rotationSpeed : 0;
    if (speed !== 0 && node instanceof THREE.Mesh) {
      node.rotation.y += speed * deltaSeconds;
    }
    if (node instanceof THREE.Mesh && node.material instanceof THREE.ShaderMaterial && node.name === 'clouds') {
      const timeUniform = node.material.uniforms.uTime;
      if (timeUniform) timeUniform.value += deltaSeconds;
    }
  });
}

export function createPlanetRenderInstance(input: PlanetRenderInput): PlanetRenderInstance {
  const { planet, x, y, z, options } = input;
  const view = createPlanetViewProfile(options.viewMode);

  const group = new THREE.Group();
  group.position.set(x, y, z);

  const surface = createSurfaceLayer(
    planet.render.renderRadius,
    planet.render,
    view.meshSegments,
    view.lightingBoost,
  );
  group.add(surface);

  const disposeTargets: Array<THREE.BufferGeometry | THREE.Material | THREE.Material[]> = [surface.geometry, surface.material];

  if (view.enableOceanLayer && OCEAN_FAMILIES.includes(planet.render.family)) {
    const ocean = createOceanLayer(planet.render.renderRadius, planet.render);
    group.add(ocean);
    disposeTargets.push(ocean.geometry, ocean.material);
  }

  if (view.enableClouds && planet.render.clouds.enabled && shouldRenderLayer('clouds', options.debug)) {
    const clouds = createCloudLayer(planet.render.renderRadius, planet.render, Math.max(72, Math.floor(view.cloudSegments)));
    group.add(clouds);
    disposeTargets.push(clouds.geometry, clouds.material);
  }

  if (view.enableAtmosphere && planet.render.atmosphere.enabled && shouldRenderLayer('atmosphere', options.debug)) {
    const atmosphere = createAtmosphereLayer(planet.render.renderRadius, planet.render, Math.max(72, Math.floor(view.atmosphereSegments)));
    group.add(atmosphere);
    disposeTargets.push(atmosphere.geometry, atmosphere.material);
  }

  if (view.enableRings && planet.render.rings.enabled && shouldRenderLayer('rings', options.debug)) {
    const rings = createRingLayer(planet.render, view.ringSegments);
    group.add(rings);
    disposeTargets.push(rings.geometry, rings.material);
  }

  group.rotation.z = planet.visualDNA.rotation.axialTilt;

  return {
    object: group,
    debugSnapshot: {
      planetId: planet.identity.planetId,
      seed: planet.identity.planetSeed,
      family: planet.identity.family,
      radiusClass: planet.identity.radiusClass,
      physicalRadius: planet.generated.physicalRadius,
      renderRadiusBase: planet.render.scale.renderRadiusBase,
      finalMeshScale:
        options.viewMode === 'galaxy' ? planet.render.scale.galaxyViewScaleMultiplier : planet.render.scale.planetViewScaleMultiplier,
      atmosphereThickness: planet.render.atmosphere.thickness,
      cloudCoverage: planet.render.clouds.coverage,
      hasRings: planet.render.rings.enabled,
      paletteId: planet.visualDNA.paletteId,
      activeNoiseFamilies: planet.render.debug.activeNoiseFamilies,
      currentViewMode: view.viewMode,
      currentLOD: view.lod,
    },
    dispose: () => {
      for (const target of disposeTargets) {
        if (Array.isArray(target)) target.forEach((m) => m.dispose());
        else target.dispose();
      }
    },
  };
}
