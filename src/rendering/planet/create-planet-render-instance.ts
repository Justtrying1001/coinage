import * as THREE from 'three';

import { createPlanetViewProfile } from '@/domain/world/generate-planet-visual-profile';
import type { PlanetRenderInput, PlanetRenderInstance } from './types';

function toColor(value: [number, number, number]): THREE.Color {
  return new THREE.Color(value[0], value[1], value[2]);
}

const SURFACE_VERTEX_SHADER = `
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
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p * frequency);
      frequency *= 2.05;
      amplitude *= 0.5;
    }

    return value;
  }

  void main() {
    vec3 normal = normalize(vNormalW);
    vec3 lightDir = normalize(uLightDirection);

    vec3 p = normalize(vWorldPos);
    vec3 seedVec = vec3(uSeed * 0.00000013, uSeed * 0.00000021, uSeed * 0.00000031);

    float macro = fbm((p + seedVec) * 2.3);
    float detail = fbm((p + seedVec * 2.0) * 8.5);
    float micro = noise((p + seedVec * 3.0) * 22.0);

    float heightField = macro * 0.75 + detail * 0.35 + micro * 0.12;
    float oceanMask = smoothstep(0.38, 0.52, heightField);
    float shore = smoothstep(0.47, 0.53, heightField) - smoothstep(0.53, 0.59, heightField);

    float latitude = abs(p.y);
    float biomeStripe = smoothstep(0.22, 0.72, noise(vec3(vUv * vec2(10.0, 6.0), uSeed * 0.00000007))) * uBanding;
    vec3 landBase = mix(uColorA, uColorB, clamp(detail + biomeStripe * 0.4, 0.0, 1.0));
    vec3 biomeTint = mix(vec3(1.06, 1.03, 0.98), vec3(0.9, 0.95, 1.05), latitude);
    vec3 landColor = landBase * biomeTint;

    vec3 shorelineColor = mix(uOceanColor, landColor, 0.55) * 1.12;
    vec3 albedo = mix(uOceanColor, landColor, oceanMask);
    albedo = mix(albedo, shorelineColor, shore * 0.9);

    float ndl = max(dot(normal, lightDir), 0.0);
    float wrapped = ndl * 0.86 + 0.14;
    float terminator = smoothstep(-0.25, 0.2, dot(normal, lightDir));

    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    vec3 halfVec = normalize(lightDir + viewDir);
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.8);
    float spec = pow(max(dot(normal, halfVec), 0.0), mix(18.0, 48.0, 1.0 - uRoughness)) * (0.08 + uSpecular * 0.45);
    spec *= mix(0.5, 1.0, 1.0 - oceanMask);

    vec3 lit = albedo * wrapped * mix(0.5, 1.0, terminator);
    lit += albedo * (0.08 + uReliefAmplitude * 0.18) * (detail - 0.5);
    lit += vec3(spec) + albedo * fresnel * 0.07;

    lit *= uLightingBoost;

    gl_FragColor = vec4(clamp(lit, 0.0, 1.0), 1.0);
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
    for (int i = 0; i < 4; i++) {
      value += noise(p * freq) * amp;
      freq *= 2.1;
      amp *= 0.5;
    }
    return value;
  }

  void main() {
    vec3 normal = normalize(vNormalW);
    vec3 lightDir = normalize(uLightDirection);
    vec3 p = normalize(vWorldPos);
    vec3 seedVec = vec3(uSeed * 0.00000017, uSeed * 0.00000023, uSeed * 0.00000029);

    float cloudField = fbm((p + seedVec) * 6.3);
    float breakup = fbm((p + seedVec * 1.9) * 14.0);
    float mask = smoothstep(1.0 - uCoverage, 1.02 - uCoverage, cloudField + breakup * 0.4);

    float ndl = max(dot(normal, lightDir), 0.0);
    float phase = pow(max(dot(normal, normalize(lightDir + vec3(0.0, 0.0, 1.0))), 0.0), 4.0);
    float lighting = (0.55 + ndl * 0.45 + phase * 0.18) * uLightingBoost;

    float alpha = clamp(mask * uOpacity, 0.0, 0.95);
    vec3 color = uCloudColor * lighting;
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

    float rim = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.2) * uRim;
    float sunFacing = max(dot(normal, lightDir), 0.0);
    float horizonTint = smoothstep(0.0, 0.85, rim);

    vec3 lowerColor = uColor * 0.72;
    vec3 upperColor = uColor * 1.2;
    vec3 atmoColor = mix(lowerColor, upperColor, horizonTint);

    float alpha = clamp((rim * (0.28 + uDensity)) + sunFacing * 0.08, 0.0, 0.92);
    gl_FragColor = vec4(atmoColor, alpha);
  }
`;

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

function createSurfaceLayer(
  planetRadius: number,
  render: PlanetRenderInput['planet']['render'],
  segments: number,
  lightingBoost: number,
): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(planetRadius, segments, segments);
  const material = new THREE.ShaderMaterial({
    vertexShader: SURFACE_VERTEX_SHADER,
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
      uLightDirection: { value: new THREE.Vector3(0.48, 0.35, 0.8).normalize() },
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
  const geometry = new THREE.SphereGeometry(planetRadius * 1.017, segments, segments);
  const material = new THREE.ShaderMaterial({
    vertexShader: SHARED_VERTEX_SHADER,
    fragmentShader: CLOUD_FRAGMENT_SHADER,
    uniforms: {
      uCloudColor: { value: toColor(render.clouds.color) },
      uCoverage: { value: render.clouds.coverage },
      uOpacity: { value: render.clouds.opacity },
      uSeed: { value: render.clouds.noiseSeed },
      uLightDirection: { value: new THREE.Vector3(0.48, 0.35, 0.8).normalize() },
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
  const geometry = new THREE.SphereGeometry(planetRadius * (1.02 + render.atmosphere.thickness), segments, segments);
  const material = new THREE.ShaderMaterial({
    vertexShader: SHARED_VERTEX_SHADER,
    fragmentShader: ATMOSPHERE_FRAGMENT_SHADER,
    uniforms: {
      uColor: { value: toColor(render.atmosphere.color) },
      uDensity: { value: render.atmosphere.density },
      uRim: { value: render.atmosphere.rimStrength },
      uLightDirection: { value: new THREE.Vector3(0.48, 0.35, 0.8).normalize() },
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
  const geometry = new THREE.RingGeometry(render.rings.innerRadius, render.rings.outerRadius, 128);
  const material = new THREE.ShaderMaterial({
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      varying vec2 vUv;
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uSeed;
      void main(){
        float radial = abs(vUv.y - 0.5) * 2.0;
        float bands = sin((vUv.x + uSeed * 0.00000011) * 120.0) * 0.5 + 0.5;
        float dust = sin((vUv.x + uSeed * 0.00000021) * 340.0) * 0.5 + 0.5;
        float alpha = (1.0 - smoothstep(0.7, 1.0, radial)) * uOpacity * (0.65 + bands * 0.25 + dust * 0.1);
        vec3 col = uColor * (0.82 + bands * 0.24);
        gl_FragColor = vec4(col, alpha);
      }
    `,
    uniforms: {
      uColor: { value: toColor(render.surface.colorB) },
      uOpacity: { value: render.rings.opacity },
      uSeed: { value: render.rings.noiseSeed },
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
