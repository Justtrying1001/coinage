import * as THREE from 'three';

import { createPlanetViewProfile } from '@/domain/world/generate-planet-visual-profile';
import type { PlanetRenderInput, PlanetRenderInstance } from './types';
import { buildDisplacedSphereGeometry, OCEAN_FAMILIES } from './build-displaced-sphere';
import {
  SURFACE_FRAGMENT_SHADER_PLANET,
  SURFACE_VERTEX_SHADER_PLANET,
} from './surface/surface-shader-assembly';
import { getPlanetMaterialTextureStack } from './surface/material-textures';

function toColor(value: [number, number, number]): THREE.Color {
  return new THREE.Color(value[0], value[1], value[2]);
}

const FAMILY_INDEX: Record<PlanetRenderInput['planet']['render']['family'], number> = {
  'terrestrial-lush': 0,
  oceanic: 1,
  'desert-arid': 2,
  'ice-frozen': 3,
  'volcanic-infernal': 4,
  'barren-rocky': 5,
  'toxic-alien': 6,
  'gas-giant': 7,
  'ringed-giant': 8,
};

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

  const tex = getPlanetMaterialTextureStack();

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
      uFamilyType: { value: FAMILY_INDEX[render.family] ?? 0 },

      uRockAlbedo: { value: tex.rock.albedo },
      uRockNormal: { value: tex.rock.normal },
      uRockRoughness: { value: tex.rock.roughness },
      uRockAo: { value: tex.rock.ao },

      uSedimentAlbedo: { value: tex.sediment.albedo },
      uSedimentNormal: { value: tex.sediment.normal },
      uSedimentRoughness: { value: tex.sediment.roughness },
      uSedimentAo: { value: tex.sediment.ao },

      uSnowAlbedo: { value: tex.snow.albedo },
      uSnowNormal: { value: tex.snow.normal },
      uSnowRoughness: { value: tex.snow.roughness },
      uSnowAo: { value: tex.snow.ao },

      uLavaAlbedo: { value: tex.lava.albedo },
      uLavaNormal: { value: tex.lava.normal },
      uLavaRoughness: { value: tex.lava.roughness },
      uLavaAo: { value: tex.lava.ao },

      uWetnessAlbedo: { value: tex.wetness.albedo },
      uWetnessNormal: { value: tex.wetness.normal },
      uWetnessRoughness: { value: tex.wetness.roughness },
      uWetnessAo: { value: tex.wetness.ao },
    },
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'surface';
  mesh.userData.rotationSpeed = render.surfaceModel === 'gaseous' ? 0.012 : 0.018;
  return mesh;
}

function createOceanLayer(
  planetRadius: number,
  render: PlanetRenderInput['planet']['render'],
): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(planetRadius * 1.0025, 176, 176);
  const tex = getPlanetMaterialTextureStack();

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uOceanColor: { value: toColor(render.surface.oceanColor) },
      uDeepColor: { value: toColor(render.surface.colorDeep) },
      uTime: { value: 0 },
      uWaterNormal: { value: tex.waterNormal },
      uLightDirection: { value: new THREE.Vector3(0.38, 0.76, 0.52).normalize() },
      uFamilyType: { value: FAMILY_INDEX[render.family] ?? 0 },
    },
    vertexShader: `
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
    `,
    fragmentShader: `
      varying vec3 vWorldPos;
      varying vec3 vNormalW;
      varying vec3 vUnitPos;

      uniform vec3 uOceanColor;
      uniform vec3 uDeepColor;
      uniform float uTime;
      uniform sampler2D uWaterNormal;
      uniform vec3 uLightDirection;
      uniform float uFamilyType;

      vec3 unpackNormal(vec3 n) { return normalize(n * 2.0 - 1.0); }

      void main() {
        vec3 normal = normalize(vNormalW);
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        vec3 lightDir = normalize(uLightDirection);

        vec2 uvA = vUnitPos.xz * 2.8 + vec2(uTime * 0.018, -uTime * 0.013);
        vec2 uvB = vUnitPos.yz * 2.1 + vec2(-uTime * 0.015, uTime * 0.02);
        vec3 nA = unpackNormal(texture2D(uWaterNormal, uvA).xyz);
        vec3 nB = unpackNormal(texture2D(uWaterNormal, uvB).xyz);
        vec3 waterN = normalize(normal + nA * 0.22 + nB * 0.18);

        float depth = smoothstep(0.0, 1.0, abs(vUnitPos.y) * 0.45 + length(vUnitPos.xz) * 0.55);
        vec3 shallow = uOceanColor * vec3(1.12, 1.10, 1.05);
        vec3 deep = mix(uOceanColor * vec3(0.54, 0.72, 0.95), uDeepColor * vec3(0.42, 0.6, 0.86), 0.4);
        vec3 color = mix(shallow, deep, depth);

        float ndl = max(dot(waterN, lightDir), 0.0);
        float fresnel = pow(1.0 - max(dot(waterN, viewDir), 0.0), 3.4);
        float spec = pow(max(dot(waterN, normalize(lightDir + viewDir)), 0.0), 82.0) * (0.28 + fresnel * 0.7);

        float coastal = smoothstep(0.45, 0.9, depth) * (1.0 - smoothstep(0.9, 1.0, depth));
        float foam = coastal * (0.06 + sin((vUnitPos.x + vUnitPos.z + uTime * 0.35) * 44.0) * 0.03);

        color *= (0.4 + ndl * 0.85);
        color += vec3(0.9, 0.96, 1.0) * (foam + spec * 0.85);

        float alpha = clamp(0.48 + fresnel * 0.24, 0.42, 0.86);
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'ocean';
  mesh.userData.rotationSpeed = 0.006;
  return mesh;
}

function createCloudLayer(
  name: 'clouds-low' | 'clouds-high',
  planetRadius: number,
  render: PlanetRenderInput['planet']['render'],
  segments: number,
  scaleFactor: number,
  speedFactor: number,
): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(planetRadius * scaleFactor, segments, segments);

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uCloudColor: { value: toColor(render.clouds.color) },
      uCoverage: { value: Math.min(0.92, Math.max(0.18, render.clouds.coverage)) },
      uOpacity: { value: name === 'clouds-low' ? 0.58 : 0.34 },
      uSeed: { value: render.clouds.noiseSeed + (name === 'clouds-low' ? 0 : 921) },
      uTime: { value: 0 },
      uSpeed: { value: speedFactor },
      uBanding: { value: render.surface.bandingStrength },
      uLightDirection: { value: new THREE.Vector3(0.38, 0.76, 0.52).normalize() },
    },
    vertexShader: `
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
    `,
    fragmentShader: `
      varying vec3 vWorldPos;
      varying vec3 vNormalW;
      varying vec3 vUnitPos;

      uniform vec3 uCloudColor;
      uniform float uCoverage;
      uniform float uOpacity;
      uniform float uSeed;
      uniform float uTime;
      uniform float uSpeed;
      uniform float uBanding;
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
        float bands = sin((vUnitPos.y + uSeed * 0.0001) * (12.0 + uBanding * 24.0)) * 0.5 + 0.5;
        vec3 flow = vec3(uTime * uSpeed, 0.0, -uTime * uSpeed * 0.7);
        vec3 p = vUnitPos * (5.4 + uBanding * 4.0) + flow + uSeed * 0.0001;
        float macro = noise(p);
        float detail = noise(p * 2.0 + vec3(1.3, -0.7, 2.1));
        float n = macro * 0.72 + detail * 0.28;
        n = mix(n, n * 0.75 + bands * 0.25, uBanding * 0.7);

        float alpha = smoothstep(1.0 - uCoverage, 1.0, n) * uOpacity;
        vec3 normal = normalize(vNormalW);
        float light = max(dot(normal, normalize(uLightDirection)), 0.0);
        float rim = pow(1.0 - max(dot(normal, normalize(cameraPosition - vWorldPos)), 0.0), 2.8) * 0.28;
        vec3 col = uCloudColor * (0.40 + light * 0.92 + rim);
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.userData.rotationSpeed = Math.max(0.004, render.clouds.speed * speedFactor * 0.9);
  return mesh;
}

function createAtmosphereLayer(
  planetRadius: number,
  render: PlanetRenderInput['planet']['render'],
  segments: number,
): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(planetRadius * (1 + Math.max(0.05, render.atmosphere.thickness + 0.028)), segments, segments);
  const family = FAMILY_INDEX[render.family] ?? 0;

  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uAtmosphereColor: { value: toColor(render.atmosphere.color) },
      uDensity: { value: Math.max(0.2, render.atmosphere.density) },
      uRimStrength: { value: render.atmosphere.rimStrength },
      uFamilyType: { value: family },
      uLightDirection: { value: new THREE.Vector3(0.38, 0.76, 0.52).normalize() },
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
      uniform float uFamilyType;
      uniform vec3 uLightDirection;

      float familyMask(float id) { return 1.0 - step(0.5, abs(uFamilyType - id)); }

      void main() {
        vec3 normal = normalize(vNormalW);
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.9);
        float sun = max(dot(normal, normalize(uLightDirection)), 0.0);

        float toxic = familyMask(6.0);
        float volcanic = familyMask(4.0);
        float frozen = familyMask(3.0);

        vec3 tint = uAtmosphereColor;
        tint = mix(tint, tint * vec3(0.92, 1.08, 0.88), toxic * 0.22);
        tint = mix(tint, tint * vec3(1.12, 0.86, 0.72), volcanic * 0.20);
        tint = mix(tint, tint * vec3(0.86, 0.95, 1.12), frozen * 0.24);

        float alpha = clamp(fresnel * uRimStrength * (0.62 + sun * 0.45) * uDensity, 0.0, 0.88);
        gl_FragColor = vec4(tint, alpha);
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

export function updatePlanetLighting(object: THREE.Object3D, lightDirection: THREE.Vector3): void {
  const dir = lightDirection.clone().normalize();
  object.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    const material = node.material;
    if (material instanceof THREE.ShaderMaterial && material.uniforms.uLightDirection) {
      material.uniforms.uLightDirection.value.copy(dir);
    }
  });
}

export function updatePlanetLayerAnimation(object: THREE.Object3D, deltaSeconds: number, freezeRotation = false): void {
  if (freezeRotation) return;

  object.traverse((node) => {
    const speed = typeof node.userData.rotationSpeed === 'number' ? node.userData.rotationSpeed : 0;
    if (speed !== 0 && node instanceof THREE.Mesh) {
      node.rotation.y += speed * deltaSeconds;
    }
    if (node instanceof THREE.Mesh && node.material instanceof THREE.ShaderMaterial) {
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
    const lowClouds = createCloudLayer('clouds-low', planet.render.renderRadius, planet.render, Math.max(64, Math.floor(view.cloudSegments)), 1.03, 0.025);
    const highClouds = createCloudLayer('clouds-high', planet.render.renderRadius, planet.render, Math.max(56, Math.floor(view.cloudSegments * 0.8)), 1.06, 0.038);
    group.add(lowClouds);
    group.add(highClouds);
    disposeTargets.push(lowClouds.geometry, lowClouds.material, highClouds.geometry, highClouds.material);
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
