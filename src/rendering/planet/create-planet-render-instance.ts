import * as THREE from 'three';

import { createPlanetViewProfile } from '@/domain/world/generate-planet-visual-profile';
import type { PlanetRenderInput, PlanetRenderInstance } from './types';

function toColor(value: [number, number, number]): THREE.Color {
  return new THREE.Color(value[0], value[1], value[2]);
}

const SHARED_VERTEX_SHADER = `
  varying vec3 vNormalW;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const SURFACE_FRAGMENT_SHADER = `
  varying vec3 vNormalW;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uOceanColor;
  uniform float uReliefAmplitude;
  uniform float uRoughness;
  uniform float uSpecular;
  uniform float uBanding;
  uniform float uSeed;
  uniform vec3 uLightDirection;
  uniform float uLightingBoost;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.17, 0.13));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);

    float n000 = hash(i + vec3(0.0, 0.0, 0.0));
    float n100 = hash(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash(i + vec3(1.0, 1.0, 1.0));

    float nx00 = mix(n000, n100, f.x);
    float nx10 = mix(n010, n110, f.x);
    float nx01 = mix(n001, n101, f.x);
    float nx11 = mix(n011, n111, f.x);

    float nxy0 = mix(nx00, nx10, f.y);
    float nxy1 = mix(nx01, nx11, f.y);

    return mix(nxy0, nxy1, f.z);
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.52;
    float frequency = 1.0;

    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p * frequency);
      frequency *= 2.02;
      amplitude *= 0.52;
    }

    return value;
  }

  float heightAt(vec3 p, vec3 seedVec) {
    float macro = fbm((p + seedVec) * 2.2);
    float detail = fbm((p + seedVec * 1.7) * 7.2);
    float micro = noise((p + seedVec * 2.8) * 18.0);
    float ridges = abs(noise((p + seedVec * 1.3) * 5.2) - 0.5) * 2.0;
    return macro * 0.65 + detail * 0.35 + micro * 0.15 + ridges * uReliefAmplitude * 0.22;
  }

  void main() {
    vec3 lightDir = normalize(uLightDirection);
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    vec3 sphereNormal = normalize(vNormalW);
    vec3 p = normalize(vWorldPos);
    vec3 seedVec = vec3(uSeed * 0.00000013, uSeed * 0.00000021, uSeed * 0.00000031);

    vec3 tangent = normalize(abs(sphereNormal.y) < 0.99 ? cross(sphereNormal, vec3(0.0, 1.0, 0.0)) : cross(sphereNormal, vec3(1.0, 0.0, 0.0)));
    vec3 bitangent = normalize(cross(sphereNormal, tangent));

    float baseHeight = heightAt(p, seedVec);
    float e = 0.018;
    float hT = heightAt(normalize(p + tangent * e), seedVec);
    float hB = heightAt(normalize(p + bitangent * e), seedVec);
    vec3 perturbedNormal = normalize(sphereNormal + tangent * (hT - baseHeight) * 1.8 + bitangent * (hB - baseHeight) * 1.8);

    float oceanMask = smoothstep(0.4, 0.56, baseHeight);
    float shoreMask = smoothstep(0.49, 0.54, baseHeight) - smoothstep(0.54, 0.60, baseHeight);

    float latitude = abs(p.y);
    float biomeNoise = noise(vec3(vUv * vec2(8.0, 4.6), uSeed * 0.00000007));
    float highlandMask = smoothstep(0.62, 0.84, baseHeight);

    vec3 lowLand = mix(uColorA, uColorB, biomeNoise * 0.5 + uBanding * 0.2);
    vec3 highLand = mix(lowLand, uColorB * 1.08, highlandMask);
    vec3 latTint = mix(vec3(1.04, 1.03, 1.0), vec3(0.92, 0.98, 1.08), latitude);
    vec3 landColor = highLand * latTint;

    vec3 shorelineColor = mix(uOceanColor, landColor, 0.57) * 1.1;
    vec3 albedo = mix(uOceanColor, landColor, oceanMask);
    albedo = mix(albedo, shorelineColor, shoreMask);

    float ndl = max(dot(perturbedNormal, lightDir), 0.0);
    float wrappedDiffuse = ndl * 0.72 + 0.28;

    vec3 halfVec = normalize(lightDir + viewDir);
    float fresnel = pow(1.0 - max(dot(perturbedNormal, viewDir), 0.0), 3.0);

    float waterSpec = pow(max(dot(perturbedNormal, halfVec), 0.0), 84.0) * (0.24 + uSpecular * 0.8);
    float landSpec = pow(max(dot(perturbedNormal, halfVec), 0.0), 26.0) * (0.05 + (1.0 - uRoughness) * 0.18);
    float spec = mix(waterSpec, landSpec, oceanMask);

    float ao = 0.82 + (baseHeight - 0.5) * 0.22;
    vec3 diffuse = albedo * wrappedDiffuse * ao;

    vec3 reliefAccent = albedo * (baseHeight - 0.5) * (0.16 + uReliefAmplitude * 0.4);
    vec3 color = diffuse + reliefAccent + vec3(spec) + albedo * fresnel * 0.06;

    color *= uLightingBoost;
    color = clamp(color, 0.0, 1.0);

    gl_FragColor = vec4(color, 1.0);
  }
`;

const CLOUD_FRAGMENT_SHADER = `
  varying vec3 vNormalW;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  uniform vec3 uCloudColor;
  uniform float uCoverage;
  uniform float uOpacity;
  uniform float uSeed;
  uniform vec3 uLightDirection;
  uniform float uLightingBoost;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.11, 0.23, 0.37));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);

    float n000 = hash(i + vec3(0.0, 0.0, 0.0));
    float n100 = hash(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash(i + vec3(1.0, 1.0, 1.0));

    float nx00 = mix(n000, n100, f.x);
    float nx10 = mix(n010, n110, f.x);
    float nx01 = mix(n001, n101, f.x);
    float nx11 = mix(n011, n111, f.x);
    float nxy0 = mix(nx00, nx10, f.y);
    float nxy1 = mix(nx01, nx11, f.y);

    return mix(nxy0, nxy1, f.z);
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amp = 0.55;
    float freq = 1.0;
    for (int i = 0; i < 5; i++) {
      value += noise(p * freq) * amp;
      freq *= 2.06;
      amp *= 0.52;
    }
    return value;
  }

  void main() {
    vec3 normal = normalize(vNormalW);
    vec3 lightDir = normalize(uLightDirection);
    vec3 p = normalize(vWorldPos);
    vec3 seedVec = vec3(uSeed * 0.00000017, uSeed * 0.00000023, uSeed * 0.00000029);

    float macro = fbm((p + seedVec) * 5.8);
    float breakup = fbm((p + seedVec * 1.8) * 12.4);
    float wisps = noise((p + seedVec * 3.1) * 24.0);
    float cloudField = macro * 0.7 + breakup * 0.35 + wisps * 0.2;

    float threshold = 1.04 - uCoverage;
    float mask = smoothstep(threshold - 0.08, threshold + 0.06, cloudField);

    float ndl = max(dot(normal, lightDir), 0.0);
    float wrapped = ndl * 0.58 + 0.42;
    float forwardScatter = pow(max(dot(normal, normalize(lightDir + vec3(0.0, 0.0, 1.0))), 0.0), 6.0) * 0.2;

    float alpha = clamp(mask * uOpacity * (0.72 + breakup * 0.35), 0.0, 0.94);
    vec3 color = uCloudColor * (wrapped + forwardScatter) * uLightingBoost;

    gl_FragColor = vec4(color, alpha);
  }
`;

const ATMOSPHERE_FRAGMENT_SHADER = `
  varying vec3 vNormalW;
  varying vec3 vWorldPos;

  uniform vec3 uColor;
  uniform float uDensity;
  uniform float uRim;
  uniform vec3 uLightDirection;

  void main() {
    vec3 normal = normalize(vNormalW);
    vec3 lightDir = normalize(uLightDirection);
    vec3 viewDir = normalize(cameraPosition - vWorldPos);

    float rim = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.1);
    float sunLift = max(dot(normal, lightDir), 0.0) * 0.16;

    vec3 lowTone = uColor * 0.78;
    vec3 highTone = uColor * 1.24;
    vec3 color = mix(lowTone, highTone, rim * 0.9 + 0.1);

    float alpha = clamp((0.08 + uDensity * 0.24) + rim * uRim * 0.56 + sunLift, 0.0, 0.9);
    gl_FragColor = vec4(color, alpha);
  }
`;

const RING_VERTEX_SHADER = `
  varying vec2 vUv;
  varying vec3 vNormalW;

  void main() {
    vUv = uv;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const RING_FRAGMENT_SHADER = `
  varying vec2 vUv;
  varying vec3 vNormalW;

  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uSeed;
  uniform vec3 uLightDirection;

  float band(vec2 uv, float seed) {
    float coarse = sin((uv.x + seed * 0.00000011) * 130.0) * 0.5 + 0.5;
    float medium = sin((uv.x + seed * 0.00000019) * 340.0) * 0.5 + 0.5;
    float fine = sin((uv.x + seed * 0.00000027) * 720.0) * 0.5 + 0.5;
    return coarse * 0.5 + medium * 0.32 + fine * 0.18;
  }

  void main() {
    float radial = abs(vUv.y - 0.5) * 2.0;
    float edgeFade = 1.0 - smoothstep(0.72, 1.0, radial);
    float b = band(vUv, uSeed);

    vec3 lightDir = normalize(uLightDirection);
    float ndl = max(dot(normalize(vNormalW), lightDir), 0.0);
    float lightResponse = ndl * 0.4 + 0.6;

    float alpha = edgeFade * uOpacity * (0.56 + b * 0.44);
    vec3 color = uColor * (0.78 + b * 0.36) * lightResponse;

    gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.95));
  }
`;

function createSurfaceLayer(
  planetRadius: number,
  render: PlanetRenderInput['planet']['render'],
  segments: number,
  lightingBoost: number,
): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(planetRadius, segments, segments);
  const material = new THREE.ShaderMaterial({
    vertexShader: SHARED_VERTEX_SHADER,
    fragmentShader: SURFACE_FRAGMENT_SHADER,
    uniforms: {
      uColorA: { value: toColor(render.surface.colorA) },
      uColorB: { value: toColor(render.surface.colorB) },
      uOceanColor: { value: toColor(render.surface.oceanColor) },
      uReliefAmplitude: { value: render.surface.reliefAmplitude },
      uRoughness: { value: render.surface.roughness },
      uSpecular: { value: render.surface.specularStrength },
      uBanding: { value: render.surface.bandingStrength },
      uSeed: { value: render.surface.noiseSeed },
      uLightDirection: { value: new THREE.Vector3(0.56, 0.35, 0.74).normalize() },
      uLightingBoost: { value: lightingBoost },
    },
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'surface';
  mesh.userData.rotationSpeed = 0;
  return mesh;
}

function createCloudLayer(
  planetRadius: number,
  render: PlanetRenderInput['planet']['render'],
  segments: number,
  lightingBoost: number,
): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(planetRadius * 1.018, segments, segments);
  const material = new THREE.ShaderMaterial({
    vertexShader: SHARED_VERTEX_SHADER,
    fragmentShader: CLOUD_FRAGMENT_SHADER,
    uniforms: {
      uCloudColor: { value: toColor(render.clouds.color) },
      uCoverage: { value: render.clouds.coverage },
      uOpacity: { value: render.clouds.opacity },
      uSeed: { value: render.clouds.noiseSeed },
      uLightDirection: { value: new THREE.Vector3(0.56, 0.35, 0.74).normalize() },
      uLightingBoost: { value: lightingBoost },
    },
    transparent: true,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'clouds';
  mesh.userData.rotationSpeed = render.clouds.speed;
  return mesh;
}

function createAtmosphereLayer(planetRadius: number, render: PlanetRenderInput['planet']['render'], segments: number): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(planetRadius * (1.024 + render.atmosphere.thickness), segments, segments);
  const material = new THREE.ShaderMaterial({
    vertexShader: SHARED_VERTEX_SHADER,
    fragmentShader: ATMOSPHERE_FRAGMENT_SHADER,
    uniforms: {
      uColor: { value: toColor(render.atmosphere.color) },
      uDensity: { value: render.atmosphere.density },
      uRim: { value: render.atmosphere.rimStrength },
      uLightDirection: { value: new THREE.Vector3(0.56, 0.35, 0.74).normalize() },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'atmosphere';
  mesh.userData.rotationSpeed = 0;
  return mesh;
}

function createRingLayer(render: PlanetRenderInput['planet']['render']): THREE.Mesh {
  const geometry = new THREE.RingGeometry(render.rings.innerRadius, render.rings.outerRadius, 180);
  const material = new THREE.ShaderMaterial({
    vertexShader: RING_VERTEX_SHADER,
    fragmentShader: RING_FRAGMENT_SHADER,
    uniforms: {
      uColor: { value: toColor(render.surface.colorB) },
      uOpacity: { value: render.rings.opacity },
      uSeed: { value: render.rings.noiseSeed },
      uLightDirection: { value: new THREE.Vector3(0.56, 0.35, 0.74).normalize() },
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const ring = new THREE.Mesh(geometry, material);
  ring.name = 'rings';
  ring.rotation.x = Math.PI / 2 + render.rings.tilt;
  ring.userData.rotationSpeed = 0.01;
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
  if (freezeRotation) {
    return;
  }

  object.traverse((node) => {
    const speed = typeof node.userData.rotationSpeed === 'number' ? node.userData.rotationSpeed : 0;
    if (speed !== 0 && node instanceof THREE.Mesh) {
      node.rotation.y += speed * deltaSeconds;
    }
  });
}

export function createPlanetRenderInstance(input: PlanetRenderInput): PlanetRenderInstance {
  const { planet, x, y, z, options } = input;
  const view = createPlanetViewProfile(options.viewMode);

  const group = new THREE.Group();
  group.position.set(x, y, z);

  const disposeTargets: Array<THREE.BufferGeometry | THREE.Material | THREE.Material[]> = [];

  if (shouldRenderLayer('surface', options.debug)) {
    const surface = createSurfaceLayer(planet.render.renderRadius, planet.render, view.meshSegments, view.lightingBoost);
    group.add(surface);
    disposeTargets.push(surface.geometry, surface.material);
  }

  if (planet.render.clouds.enabled && shouldRenderLayer('clouds', options.debug)) {
    const clouds = createCloudLayer(planet.render.renderRadius, planet.render, view.cloudSegments, view.lightingBoost);
    group.add(clouds);
    disposeTargets.push(clouds.geometry, clouds.material);
  }

  if (planet.render.atmosphere.enabled && shouldRenderLayer('atmosphere', options.debug)) {
    const atmosphere = createAtmosphereLayer(planet.render.renderRadius, planet.render, view.atmosphereSegments);
    group.add(atmosphere);
    disposeTargets.push(atmosphere.geometry, atmosphere.material);
  }

  if (view.enableRings && planet.render.rings.enabled && shouldRenderLayer('rings', options.debug)) {
    const rings = createRingLayer(planet.render);
    group.add(rings);
    disposeTargets.push(rings.geometry, rings.material);
  }

  group.rotation.z = planet.visualDNA.rotation.axialTilt;

  const debugSnapshot = {
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
  };

  return {
    object: group,
    debugSnapshot,
    dispose: () => {
      for (const target of disposeTargets) {
        if (Array.isArray(target)) {
          for (const mat of target) mat.dispose();
        } else {
          target.dispose();
        }
      }
    },
  };
}
