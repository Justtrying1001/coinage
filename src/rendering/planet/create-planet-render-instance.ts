import * as THREE from 'three';

import { createPlanetViewProfile } from '@/domain/world/generate-planet-visual-profile';
import type { PlanetRenderInput, PlanetRenderInstance } from './types';
import { buildDisplacedSphereGeometry } from './build-displaced-sphere';

function toColor(value: [number, number, number]): THREE.Color {
  return new THREE.Color(value[0], value[1], value[2]);
}

const SURFACE_VERTEX_SHADER = `
  attribute float aHeight;
  attribute float aLandMask;
  attribute float aMountainMask;
  attribute float aCoastMask;
  attribute float aOceanDepth;
  attribute float aContinentMask;

  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vUnitPos;
  varying float vHeight;
  varying float vLandMask;
  varying float vMountainMask;
  varying float vCoastMask;
  varying float vOceanDepth;
  varying float vContinentMask;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vUnitPos = normalize(position);
    vHeight = aHeight;
    vLandMask = aLandMask;
    vMountainMask = aMountainMask;
    vCoastMask = aCoastMask;
    vOceanDepth = aOceanDepth;
    vContinentMask = aContinentMask;

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const SHARED_SPHERE_VERTEX_SHADER = `
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vUnitPos;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vUnitPos = normalize(position);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const SURFACE_FRAGMENT_SHADER = `
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vUnitPos;
  varying float vHeight;
  varying float vLandMask;
  varying float vMountainMask;
  varying float vCoastMask;
  varying float vOceanDepth;
  varying float vContinentMask;

  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uOceanColor;
  uniform float uRoughness;
  uniform float uSpecular;
  uniform vec3 uLightDirection;
  uniform float uLightingBoost;
  uniform float uSeed;
  uniform vec3 uIblSkyColor;
  uniform vec3 uIblGroundColor;
  uniform vec3 uIblHorizonColor;
  uniform float uIblIntensity;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.11, 0.17, 0.13));
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

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 lightDir = normalize(uLightDirection);
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    vec3 reflectDir = reflect(-viewDir, normal);

    float lat = abs(vUnitPos.y);
    float biome = noise(vUnitPos * 4.3 + vec3(uSeed * 0.000001));
    float humidity = noise(vUnitPos * 2.1 + vec3(uSeed * 0.000002));

    vec3 lowLand = mix(uColorA * 0.76, uColorA * 1.16, humidity);
    vec3 continentColor = mix(lowLand, uColorB, biome * (0.55 + vContinentMask * 0.45));
    vec3 mountainColor = mix(continentColor, uColorB * 1.35, vMountainMask);
    vec3 polarTint = mix(vec3(1.0), vec3(0.84, 0.92, 1.08), smoothstep(0.62, 0.94, lat));
    vec3 landColor = mountainColor * polarTint;

    vec3 deepOcean = uOceanColor * 0.46;
    vec3 shallowOcean = uOceanColor * 1.22;
    vec3 waterColor = mix(shallowOcean, deepOcean, vOceanDepth);
    vec3 coastColor = mix(waterColor, landColor, 0.42) * 1.15;

    vec3 albedo = mix(waterColor, landColor, vLandMask);
    albedo = mix(albedo, coastColor, vCoastMask);

    float ndl = max(dot(normal, lightDir), 0.0);
    float wrappedDiffuse = ndl * 0.76 + 0.24;

    vec3 halfVec = normalize(lightDir + viewDir);
    float oceanRoughness = mix(0.05, 0.22, vOceanDepth);
    float landRoughness = clamp(uRoughness + vMountainMask * 0.25, 0.28, 0.98);
    float roughness = mix(oceanRoughness, landRoughness, vLandMask);

    float oceanSpec = pow(max(dot(normal, halfVec), 0.0), mix(260.0, 110.0, vOceanDepth)) * (0.35 + uSpecular * 1.1);
    float landSpec = pow(max(dot(normal, halfVec), 0.0), mix(36.0, 14.0, roughness)) * (0.08 + (1.0 - roughness) * 0.24);
    float spec = mix(oceanSpec, landSpec, vLandMask);

    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 4.0);

    float up = clamp(normal.y * 0.5 + 0.5, 0.0, 1.0);
    float horizon = 1.0 - abs(normal.y);
    vec3 iblDiffuse = mix(uIblGroundColor, uIblSkyColor, up);
    iblDiffuse = mix(iblDiffuse, uIblHorizonColor, horizon * 0.6);

    float reflUp = clamp(reflectDir.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 iblSpec = mix(uIblGroundColor * 0.65, uIblSkyColor * 1.2, reflUp);

    float ao = clamp(0.86 + (vHeight - 0.5) * 0.24, 0.62, 1.12);
    vec3 diffuse = albedo * wrappedDiffuse * ao;

    vec3 color = diffuse;
    color += iblDiffuse * albedo * (0.2 + (1.0 - roughness) * 0.2) * uIblIntensity;
    color += iblSpec * (spec + fresnel * (0.1 + (1.0 - roughness) * 0.3)) * uIblIntensity;

    color *= uLightingBoost;
    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
  }
`;

const CLOUD_FRAGMENT_SHADER = `
  varying vec3 vWorldNormal;
  varying vec3 vUnitPos;

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

    float n000 = hash(i + vec3(0.0));
    float n100 = hash(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash(i + vec3(1.0));

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
    float amp = 0.56;
    float freq = 1.0;
    for (int i = 0; i < 5; i++) {
      value += noise(p * freq) * amp;
      freq *= 2.06;
      amp *= 0.52;
    }
    return value;
  }

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 lightDir = normalize(uLightDirection);
    vec3 seedVec = vec3(uSeed * 0.00000017, uSeed * 0.00000023, uSeed * 0.00000029);

    float macro = fbm((vUnitPos + seedVec) * 5.7);
    float detail = fbm((vUnitPos + seedVec * 2.3) * 12.4);
    float wisps = noise((vUnitPos + seedVec * 3.1) * 24.0);
    float cloudField = macro * 0.72 + detail * 0.28 + wisps * 0.14;

    float threshold = 1.02 - uCoverage;
    float mask = smoothstep(threshold - 0.08, threshold + 0.06, cloudField);

    float ndl = max(dot(normal, lightDir), 0.0);
    float wrapped = ndl * 0.56 + 0.44;
    float alpha = clamp(mask * uOpacity * (0.68 + detail * 0.35), 0.0, 0.95) * smoothstep(-0.25, 0.45, dot(normal, lightDir));

    gl_FragColor = vec4(uCloudColor * wrapped * uLightingBoost, alpha);
  }
`;

const ATMOSPHERE_FRAGMENT_SHADER = `
  varying vec3 vWorldNormal;

  uniform vec3 uColor;
  uniform float uDensity;
  uniform float uRim;
  uniform vec3 uLightDirection;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 lightDir = normalize(uLightDirection);
    vec3 viewDir = normalize(cameraPosition);

    float rim = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.5);
    float day = max(dot(normal, lightDir), 0.0);

    vec3 dayColor = uColor * 1.2;
    vec3 duskColor = mix(uColor * 0.75, vec3(1.0, 0.56, 0.35), 0.35);
    vec3 color = mix(dayColor, duskColor, pow(1.0 - day, 2.2));

    float alpha = clamp(rim * (0.35 + uRim * 0.65) + day * uDensity * 0.16, 0.0, 0.9);
    gl_FragColor = vec4(color, alpha);
  }
`;

const RING_VERTEX_SHADER = `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying vec3 vNormalW;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const RING_FRAGMENT_SHADER = `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying vec3 vNormalW;

  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uSeed;
  uniform vec3 uLightDirection;

  float band(vec2 uv, float seed) {
    float coarse = sin((uv.x + seed * 0.00000011) * 118.0) * 0.5 + 0.5;
    float medium = sin((uv.x + seed * 0.00000019) * 332.0) * 0.5 + 0.5;
    float fine = sin((uv.x + seed * 0.00000027) * 910.0) * 0.5 + 0.5;
    return coarse * 0.5 + medium * 0.33 + fine * 0.17;
  }

  void main() {
    float radial = abs(vUv.y - 0.5) * 2.0;
    float edgeFade = 1.0 - smoothstep(0.76, 1.0, radial);
    float centerGap = smoothstep(0.03, 0.12, radial);
    float b = band(vUv, uSeed);

    vec3 lightDir = normalize(uLightDirection);
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    vec3 normal = normalize(vNormalW);

    float ndl = max(dot(normal, lightDir), 0.0);
    float forwardScatter = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.2) * 0.28;

    float alpha = edgeFade * centerGap * smoothstep(0.18, 0.82, b) * uOpacity * (0.44 + b * 0.56);
    vec3 color = uColor * (0.72 + b * 0.4) * (ndl * 0.34 + 0.54 + forwardScatter);

    gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.95));
  }
`;

function createSurfaceLayer(
  planetRadius: number,
  render: PlanetRenderInput['planet']['render'],
  segments: number,
  lightingBoost: number,
  highQuality: boolean,
): THREE.Mesh {
  const geometry = highQuality
    ? buildDisplacedSphereGeometry({
        radius: planetRadius,
        segments,
        seed: render.surface.noiseSeed,
        reliefAmplitude: render.surface.reliefAmplitude,
        bandingStrength: render.surface.bandingStrength,
      })
    : buildDisplacedSphereGeometry({
        radius: planetRadius,
        segments: Math.max(20, Math.floor(segments * 0.5)),
        seed: render.surface.noiseSeed,
        reliefAmplitude: render.surface.reliefAmplitude * 0.45,
        bandingStrength: render.surface.bandingStrength,
      });

  const material = new THREE.ShaderMaterial({
    vertexShader: SURFACE_VERTEX_SHADER,
    fragmentShader: SURFACE_FRAGMENT_SHADER,
    uniforms: {
      uColorA: { value: toColor(render.surface.colorA) },
      uColorB: { value: toColor(render.surface.colorB) },
      uOceanColor: { value: toColor(render.surface.oceanColor) },
      uRoughness: { value: render.surface.roughness },
      uSpecular: { value: render.surface.specularStrength },
      uSeed: { value: render.surface.noiseSeed },
      uLightDirection: { value: new THREE.Vector3(0.52, 0.31, 0.79).normalize() },
      uLightingBoost: { value: lightingBoost },
      uIblSkyColor: { value: new THREE.Color('#7ea6ff') },
      uIblGroundColor: { value: new THREE.Color('#1d212f') },
      uIblHorizonColor: { value: new THREE.Color('#89a2d4') },
      uIblIntensity: { value: 0.92 },
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
  const geometry = new THREE.SphereGeometry(planetRadius * 1.03, segments, segments);
  const material = new THREE.ShaderMaterial({
    vertexShader: SHARED_SPHERE_VERTEX_SHADER,
    fragmentShader: CLOUD_FRAGMENT_SHADER,
    uniforms: {
      uCloudColor: { value: toColor(render.clouds.color) },
      uCoverage: { value: render.clouds.coverage },
      uOpacity: { value: render.clouds.opacity },
      uSeed: { value: render.clouds.noiseSeed },
      uLightDirection: { value: new THREE.Vector3(0.52, 0.31, 0.79).normalize() },
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
  const geometry = new THREE.SphereGeometry(planetRadius * (1.032 + render.atmosphere.thickness * 1.12), segments, segments);
  const material = new THREE.ShaderMaterial({
    vertexShader: SHARED_SPHERE_VERTEX_SHADER,
    fragmentShader: ATMOSPHERE_FRAGMENT_SHADER,
    uniforms: {
      uColor: { value: toColor(render.atmosphere.color) },
      uDensity: { value: render.atmosphere.density },
      uRim: { value: render.atmosphere.rimStrength },
      uLightDirection: { value: new THREE.Vector3(0.52, 0.31, 0.79).normalize() },
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
  const geometry = new THREE.RingGeometry(render.rings.innerRadius, render.rings.outerRadius, 256);
  const material = new THREE.ShaderMaterial({
    vertexShader: RING_VERTEX_SHADER,
    fragmentShader: RING_FRAGMENT_SHADER,
    uniforms: {
      uColor: { value: toColor(render.surface.colorB) },
      uOpacity: { value: render.rings.opacity },
      uSeed: { value: render.rings.noiseSeed },
      uLightDirection: { value: new THREE.Vector3(0.52, 0.31, 0.79).normalize() },
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
  if (freezeRotation) return;

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
  const highQuality = options.viewMode === 'planet';

  const group = new THREE.Group();
  group.position.set(x, y, z);

  const disposeTargets: Array<THREE.BufferGeometry | THREE.Material | THREE.Material[]> = [];

  if (shouldRenderLayer('surface', options.debug)) {
    const surface = createSurfaceLayer(planet.render.renderRadius, planet.render, view.meshSegments, view.lightingBoost, highQuality);
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
