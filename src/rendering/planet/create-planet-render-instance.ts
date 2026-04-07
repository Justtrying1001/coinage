import * as THREE from 'three';

import { createPlanetViewProfile } from '@/domain/world/generate-planet-visual-profile';
import type { PlanetRenderInput, PlanetRenderInstance } from './types';
import { buildDisplacedSphereGeometry } from './build-displaced-sphere';

function toColor(value: [number, number, number]): THREE.Color {
  return new THREE.Color(value[0], value[1], value[2]);
}

function familyCode(
  family: PlanetRenderInput['planet']['render']['family'],
): number {
  const mapping: Record<PlanetRenderInput['planet']['render']['family'], number> = {
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
  return mapping[family];
}

const SURFACE_VERTEX_SHADER = `
  attribute float aHeight;
  attribute float aLandMask;
  attribute float aMountainMask;
  attribute float aCoastMask;
  attribute float aOceanDepth;
  attribute float aContinentMask;
  attribute float aHumidityMask;
  attribute float aTemperatureMask;
  attribute float aErosionMask;
  attribute float aCraterMask;
  attribute float aThermalMask;
  attribute float aBandMask;

  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vUnitPos;
  varying float vHeight;
  varying float vLandMask;
  varying float vMountainMask;
  varying float vCoastMask;
  varying float vOceanDepth;
  varying float vContinentMask;
  varying float vHumidityMask;
  varying float vTemperatureMask;
  varying float vErosionMask;
  varying float vCraterMask;
  varying float vThermalMask;
  varying float vBandMask;

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
    vHumidityMask = aHumidityMask;
    vTemperatureMask = aTemperatureMask;
    vErosionMask = aErosionMask;
    vCraterMask = aCraterMask;
    vThermalMask = aThermalMask;
    vBandMask = aBandMask;

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
  varying float vHumidityMask;
  varying float vTemperatureMask;
  varying float vErosionMask;
  varying float vCraterMask;
  varying float vThermalMask;
  varying float vBandMask;

  uniform vec3 uColorDeep;
  uniform vec3 uColorMid;
  uniform vec3 uColorHigh;
  uniform vec3 uOceanColor;
  uniform vec3 uAccentColor;
  uniform float uRoughness;
  uniform float uSpecular;
  uniform float uEmissive;
  uniform float uSurfaceModel;
  uniform float uFamilyCode;
  uniform vec3 uLightDirection;
  uniform float uLightingBoost;
  uniform vec3 uIblSkyColor;
  uniform vec3 uIblGroundColor;
  uniform vec3 uIblHorizonColor;
  uniform float uIblIntensity;

  float sat(float x) { return clamp(x, 0.0, 1.0); }

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 lightDir = normalize(uLightDirection);
    vec3 viewDir = normalize(cameraPosition - vWorldPos);

    float ndl = max(dot(normal, lightDir), 0.0);
    float wrappedDiffuse = ndl * 0.74 + 0.26;

    vec3 baseLand = mix(uColorDeep, uColorMid, sat(vHeight * 1.2));
    baseLand = mix(baseLand, uColorHigh, sat(vMountainMask * 0.75 + vTemperatureMask * 0.2));
    baseLand = mix(baseLand, uAccentColor, vThermalMask * 0.72);
    baseLand *= mix(0.88, 1.1, vHumidityMask);
    baseLand *= mix(1.0, 0.78, vCraterMask * 0.85);

    vec3 waterColor = mix(uOceanColor * 1.2, uOceanColor * 0.44, vOceanDepth);
    vec3 sandColor = uAccentColor * 1.1;
    vec3 coastColor = mix(waterColor, sandColor, smoothstep(0.0, 0.5, vCoastMask));
    coastColor = mix(coastColor, baseLand, smoothstep(0.5, 1.0, vCoastMask));

    vec3 solidAlbedo = mix(waterColor, baseLand, vLandMask);
    solidAlbedo = mix(solidAlbedo, coastColor, vCoastMask);

    vec3 gasBands = mix(uColorDeep, uColorMid, sat(vBandMask));
    gasBands = mix(gasBands, uColorHigh, sat(vThermalMask * 0.6 + vTemperatureMask * 0.25));
    vec3 gasStorms = mix(gasBands, uAccentColor, sat(vThermalMask * 0.86));
    vec3 gaseousAlbedo = mix(gasBands, gasStorms, sat(vBandMask * 0.8 + vThermalMask * 0.5));

    vec3 albedo = mix(solidAlbedo, gaseousAlbedo, sat(uSurfaceModel));

    if (uFamilyCode < 1.5) {
      // terrestrial-lush & oceanic: keep curated palette untouched.
    } else if (uFamilyCode < 2.5) {
      albedo *= vec3(1.04, 0.98, 0.92);
    } else if (uFamilyCode < 3.5) {
      albedo = mix(albedo, vec3(0.88, 0.93, 0.98), vMountainMask * 0.3);
    } else if (uFamilyCode < 4.5) {
      albedo *= mix(vec3(1.0), vec3(0.85, 0.82, 0.8), 0.15);
    } else if (uFamilyCode < 5.5) {
      // barren-rocky: keep curated palette untouched.
    } else if (uFamilyCode < 6.5) {
      albedo = mix(albedo, uAccentColor, vThermalMask * 0.12);
    } else {
      // gas-giant & ringed-giant: keep palette/bands dominant.
    }

    vec3 halfVec = normalize(lightDir + viewDir);
    float roughness = mix(
      clamp(uRoughness + vMountainMask * 0.2 + vCraterMask * 0.15, 0.12, 0.98),
      clamp(uRoughness * 0.82 + (1.0 - vBandMask) * 0.1, 0.08, 0.9),
      sat(uSurfaceModel)
    );

    float specPow = mix(44.0, 104.0, 1.0 - roughness);
    float spec = pow(max(dot(normal, halfVec), 0.0), specPow) * (0.1 + uSpecular * 0.9);
    spec *= mix(1.0, 0.15, sat(uSurfaceModel));
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 4.0);

    float up = clamp(normal.y * 0.5 + 0.5, 0.0, 1.0);
    float horizon = 1.0 - abs(normal.y);
    vec3 iblDiffuse = mix(uIblGroundColor, uIblSkyColor, up);
    iblDiffuse = mix(iblDiffuse, uIblHorizonColor, horizon * 0.65);

    vec3 color = albedo * wrappedDiffuse;
    color += iblDiffuse * albedo * (0.2 + (1.0 - roughness) * 0.18) * uIblIntensity;
    color += iblDiffuse * (spec + fresnel * 0.28) * uIblIntensity;
    color += uAccentColor * (uEmissive * (vThermalMask * 0.9 + vBandMask * 0.2));

    float cavityAO = 1.0;
    cavityAO -= vOceanDepth * 0.3;
    cavityAO -= vErosionMask * 0.15;
    cavityAO += vMountainMask * 0.1;
    cavityAO -= (1.0 - vLandMask) * 0.2;
    cavityAO = clamp(cavityAO, 0.5, 1.15);

    color *= cavityAO;
    float rimLight = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
    color += vec3(0.08, 0.12, 0.18) * rimLight * 0.6;

    color *= uLightingBoost;
    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
  }
`;

const OCEAN_FRAGMENT_SHADER = `
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vUnitPos;

  uniform vec3 uOceanColor;
  uniform vec3 uOceanDeepColor;
  uniform float uSpecular;
  uniform vec3 uLightDirection;
  uniform float uLightingBoost;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 lightDir = normalize(uLightDirection);
    vec3 viewDir = normalize(cameraPosition - vWorldPos);

    float ndl = max(dot(normal, lightDir), 0.0);
    float wrapped = ndl * 0.7 + 0.3;

    float depthFactor = abs(vUnitPos.y) * 0.3;
    vec3 oceanColor = mix(uOceanColor, uOceanDeepColor, depthFactor);

    vec3 halfVec = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfVec), 0.0), 64.0) * uSpecular;
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 4.0);

    vec3 color = oceanColor * wrapped;
    color += vec3(1.0) * spec * 0.6;
    color += oceanColor * fresnel * 0.15;
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
  uniform float uBanding;
  uniform float uSurfaceModel;
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

    float macro = fbm((vUnitPos + seedVec) * mix(7.0, 4.4, uSurfaceModel));
    float detail = fbm((vUnitPos + seedVec * 2.3) * mix(16.0, 9.8, uSurfaceModel));
    float jets = sin((vUnitPos.y + uSeed * 0.00000011) * (16.0 + uBanding * 20.0)) * 0.5 + 0.5;
    float field = mix(macro * 0.72 + detail * 0.28, jets * 0.55 + detail * 0.45, uSurfaceModel);

    float threshold = 1.02 - uCoverage;
    float mask = smoothstep(threshold - 0.08, threshold + 0.06, field);

    float ndl = max(dot(normal, lightDir), 0.0);
    float wrapped = ndl * 0.56 + 0.44;
    float alpha = clamp(mask * uOpacity * (0.66 + detail * 0.32), 0.0, 0.95);

    gl_FragColor = vec4(uCloudColor * wrapped * uLightingBoost, alpha);
  }
`;

const ATMOSPHERE_FRAGMENT_SHADER = `
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;

  uniform vec3 uColor;
  uniform float uDensity;
  uniform float uRim;
  uniform vec3 uLightDirection;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 lightDir = normalize(uLightDirection);
    vec3 viewDir = normalize(cameraPosition - vWorldPos);

    float rim = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.2);
    float day = max(dot(normal, lightDir), 0.0);

    vec3 dayColor = uColor * 1.15;
    vec3 duskColor = mix(uColor * 0.7, vec3(1.0, 0.54, 0.3), 0.28);
    vec3 color = mix(dayColor, duskColor, pow(1.0 - day, 2.0));

    float alpha = clamp(rim * (0.32 + uRim * 0.72) + day * uDensity * 0.14, 0.0, 0.9);
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

  void main() {
    float radial = vUv.x;
    float band1 = sin(radial * 12.0 + uSeed * 0.0001) * 0.5 + 0.5;
    float band2 = sin(radial * 28.0 + uSeed * 0.00017) * 0.5 + 0.5;
    float grain = band1 * 0.65 + band2 * 0.35;
    float edgeFade = smoothstep(0.0, 0.08, radial) * smoothstep(1.0, 0.92, radial);
    float gap = 1.0 - smoothstep(0.44, 0.46, radial) * (1.0 - smoothstep(0.48, 0.50, radial)) * 0.7;

    vec3 lightDir = normalize(uLightDirection);
    vec3 normal = normalize(vNormalW);
    float ndl = max(dot(normal, lightDir), 0.0);

    float alpha = edgeFade * gap * grain * uOpacity;
    vec3 color = uColor * (0.6 + grain * 0.4) * (ndl * 0.4 + 0.6);

    gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.85));
  }
`;

function createSurfaceLayer(
  planetRadius: number,
  render: PlanetRenderInput['planet']['render'],
  segments: number,
  lightingBoost: number,
  highQuality: boolean,
): THREE.Mesh {
  const geometry = buildDisplacedSphereGeometry({
    radius: planetRadius,
    segments: highQuality ? segments : Math.max(32, Math.floor(segments * 0.7)),
    seed: render.surface.noiseSeed,
    moistureSeed: render.surface.moistureSeed,
    thermalSeed: render.surface.thermalSeed,
    oceanLevel: render.surface.oceanLevel,
    reliefAmplitude: highQuality ? render.surface.reliefAmplitude : render.surface.reliefAmplitude * 0.75,
    bandingStrength: render.surface.bandingStrength,
    family: render.family,
    surfaceModel: render.surfaceModel,
  });

  const material = new THREE.ShaderMaterial({
    vertexShader: SURFACE_VERTEX_SHADER,
    fragmentShader: SURFACE_FRAGMENT_SHADER,
    uniforms: {
      uColorDeep: { value: toColor(render.surface.colorDeep) },
      uColorMid: { value: toColor(render.surface.colorMid) },
      uColorHigh: { value: toColor(render.surface.colorHigh) },
      uOceanColor: { value: toColor(render.surface.oceanColor) },
      uAccentColor: { value: toColor(render.surface.accentColor) },
      uRoughness: { value: render.surface.roughness },
      uSpecular: { value: render.surface.specularStrength },
      uEmissive: { value: render.surface.emissiveIntensity },
      uSurfaceModel: { value: render.surfaceModel === 'gaseous' ? 1 : 0 },
      uFamilyCode: { value: familyCode(render.family) },
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
  mesh.userData.rotationSpeed = render.surfaceModel === 'gaseous' ? render.clouds.speed * 0.3 : 0;
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
      uBanding: { value: render.clouds.stormBanding },
      uSurfaceModel: { value: render.surfaceModel === 'gaseous' ? 1 : 0 },
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

function createOceanLayer(
  planetRadius: number,
  render: PlanetRenderInput['planet']['render'],
  segments: number,
  lightingBoost: number,
): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(planetRadius, segments, segments);

  const material = new THREE.ShaderMaterial({
    vertexShader: SHARED_SPHERE_VERTEX_SHADER,
    fragmentShader: OCEAN_FRAGMENT_SHADER,
    uniforms: {
      uOceanColor: { value: toColor(render.surface.oceanColor) },
      uOceanDeepColor: { value: toColor(render.surface.colorDeep) },
      uSpecular: { value: Math.max(render.surface.specularStrength, 0.4) },
      uLightDirection: { value: new THREE.Vector3(0.52, 0.31, 0.79).normalize() },
      uLightingBoost: { value: lightingBoost },
    },
    transparent: false,
    depthWrite: true,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'ocean';
  mesh.userData.rotationSpeed = 0;
  return mesh;
}

function createAtmosphereLayer(planetRadius: number, render: PlanetRenderInput['planet']['render'], segments: number): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(planetRadius * (1.03 + render.atmosphere.thickness), segments, segments);
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

function createRingLayer(render: PlanetRenderInput['planet']['render'], segments: number): THREE.Mesh {
  const geometry = new THREE.RingGeometry(render.rings.innerRadius, render.rings.outerRadius, segments, 1);
  const pos = geometry.attributes.position;
  const uvs = geometry.attributes.uv;
  const innerR = render.rings.innerRadius;
  const outerR = render.rings.outerRadius;
  const rangeR = Math.max(0.001, outerR - innerR);
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const r = Math.sqrt(x * x + y * y);
    const radialT = (r - innerR) / rangeR;
    const angle = Math.atan2(y, x);
    uvs.setXY(i, radialT, angle / (2 * Math.PI) + 0.5);
  }
  uvs.needsUpdate = true;
  const material = new THREE.ShaderMaterial({
    vertexShader: RING_VERTEX_SHADER,
    fragmentShader: RING_FRAGMENT_SHADER,
    uniforms: {
      uColor: { value: toColor(render.rings.color) },
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
  if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined' && (window as { __COINAGE_PIPELINE_TRACE?: boolean }).__COINAGE_PIPELINE_TRACE) {
    console.info('[PlanetPipelineTrace]', {
      stage: 'createPlanetRenderInstance',
      planetId: planet.identity.planetId,
      family: planet.render.family,
      surfaceModel: planet.render.surfaceModel,
      viewMode: options.viewMode,
      meshSegments: view.meshSegments,
      noiseSeed: planet.render.surface.noiseSeed,
    });
  }

  const group = new THREE.Group();
  group.position.set(x, y, z);

  const disposeTargets: Array<THREE.BufferGeometry | THREE.Material | THREE.Material[]> = [];

  if (shouldRenderLayer('surface', options.debug)) {
    if (
      planet.render.surface.oceanLevel > 0.05 &&
      planet.render.surfaceModel !== 'gaseous'
    ) {
      const ocean = createOceanLayer(
        planet.render.renderRadius,
        planet.render,
        view.meshSegments,
        view.lightingBoost,
      );
      group.add(ocean);
      disposeTargets.push(ocean.geometry, ocean.material);
    }

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
    const rings = createRingLayer(planet.render, view.ringSegments);
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
