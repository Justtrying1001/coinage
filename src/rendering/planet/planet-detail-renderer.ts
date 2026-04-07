import * as THREE from 'three';

import { createPlanetViewProfile } from '@/domain/world/generate-planet-visual-profile';
import type { PlanetRenderInput, PlanetRenderInstance } from './types';
import { buildDisplacedSphereGeometry, OCEAN_FAMILIES } from './build-displaced-sphere';

function toColor(value: [number, number, number]): THREE.Color {
  return new THREE.Color(value[0], value[1], value[2]);
}

function familyCode(family: PlanetRenderInput['planet']['render']['family']): number {
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

function resolveAdaptiveSegments(baseSegments: number, input: PlanetRenderInput): number {
  const camera = input.options.cameraPosition;
  if (!camera) return baseSegments;
  const distance = Math.hypot(input.x - camera.x, input.y - camera.y, input.z - camera.z);
  const lodFactor = THREE.MathUtils.clamp(1.8 - distance / 60, 0.65, 1.8);
  return Math.max(28, Math.floor(baseSegments * lodFactor));
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
  uniform float uMetalness;
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

    vec3 dpdx = dFdx(vWorldPos);
    vec3 dpdy = dFdy(vWorldPos);
    float reliefField = vHeight * 0.7 + vMountainMask * 0.5 - vOceanDepth * 0.2;
    vec2 reliefGrad = vec2(dFdx(reliefField), dFdy(reliefField));
    normal = normalize(normal - (dpdx * reliefGrad.x + dpdy * reliefGrad.y) * 0.9);

    float ndl = max(dot(normal, lightDir), 0.0);
    float wrappedDiffuse = ndl * 0.74 + 0.26;

    vec3 baseLand = mix(uColorDeep, uColorMid, sat(vHeight * 1.5));
    baseLand = mix(baseLand, uColorHigh, sat(vMountainMask));
    baseLand = mix(baseLand, uAccentColor, vThermalMask * 0.35);

    float fertility = sat(vHumidityMask * (1.0 - abs(vTemperatureMask - 0.55) * 1.3));
    vec3 fertileTint = mix(baseLand * 0.88, vec3(0.18, 0.42, 0.18), fertility * 0.6);
    baseLand = mix(baseLand, fertileTint, sat(vLandMask * vContinentMask));

    float snowMask = sat((1.0 - vTemperatureMask) * 0.8 + vMountainMask * 0.6);
    baseLand = mix(baseLand, mix(vec3(0.78, 0.84, 0.92), uColorHigh, 0.4), snowMask * 0.38);

    vec3 waterColor = mix(uOceanColor * 1.1, uOceanColor * 0.38, vOceanDepth);
    waterColor = mix(waterColor, uOceanColor * 1.35, sat(pow(1.0 - vOceanDepth, 2.0) * 0.45));
    vec3 coastColor = mix(uAccentColor, baseLand, smoothstep(0.3, 0.8, vCoastMask));

    vec3 solidAlbedo = mix(waterColor, baseLand, vLandMask);
    solidAlbedo = mix(solidAlbedo, coastColor, vCoastMask);

    vec3 gasBands = mix(uColorDeep, uColorMid, sat(vBandMask));
    gasBands = mix(gasBands, uColorHigh, sat(vThermalMask * 0.6 + vTemperatureMask * 0.25));
    vec3 gasStorms = mix(gasBands, uAccentColor, sat(vThermalMask * 0.86));
    vec3 gaseousAlbedo = mix(gasBands, gasStorms, sat(vBandMask * 0.8 + vThermalMask * 0.5));

    vec3 albedo = mix(solidAlbedo, gaseousAlbedo, sat(uSurfaceModel));
    if (uFamilyCode > 1.5 && uFamilyCode < 2.5) {
      albedo *= vec3(1.03, 0.98, 0.93);
    } else if (uFamilyCode > 2.5 && uFamilyCode < 3.5) {
      albedo = mix(albedo, vec3(0.9, 0.94, 0.98), vMountainMask * 0.2);
    } else if (uFamilyCode > 3.5 && uFamilyCode < 4.5) {
      albedo = mix(albedo, vec3(0.44, 0.2, 0.1), vThermalMask * 0.4);
    }

    vec3 halfVec = normalize(lightDir + viewDir);
    float roughness = mix(clamp(uRoughness + vMountainMask * 0.2 + vCraterMask * 0.15, 0.12, 0.98), clamp(uRoughness * 0.82 + (1.0 - vBandMask) * 0.1, 0.08, 0.9), sat(uSurfaceModel));
    float specPow = mix(44.0, 104.0, 1.0 - roughness);
    float spec = pow(max(dot(normal, halfVec), 0.0), specPow) * (0.05 + uSpecular * 0.62);
    spec *= mix(0.75, 1.02, uMetalness);
    spec *= mix(1.0, 0.12, sat(uSurfaceModel));
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 4.0);

    float up = clamp(normal.y * 0.5 + 0.5, 0.0, 1.0);
    float horizon = 1.0 - abs(normal.y);
    vec3 iblDiffuse = mix(uIblGroundColor, uIblSkyColor, up);
    iblDiffuse = mix(iblDiffuse, uIblHorizonColor, horizon * 0.65);

    vec3 color = albedo * wrappedDiffuse;
    color += iblDiffuse * albedo * (0.2 + (1.0 - roughness) * 0.18) * uIblIntensity;
    color += iblDiffuse * (spec + fresnel * 0.14) * uIblIntensity;
    color += uAccentColor * (uEmissive * (vThermalMask * 0.62 + vBandMask * 0.12));

    float ao = 1.0 - vOceanDepth * 0.2 - vErosionMask * 0.08 + vMountainMask * 0.06;
    ao = clamp(ao, 0.6, 1.1);
    color *= ao;
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
  uniform float uDepthFade;
  uniform vec3 uLightDirection;
  uniform float uLightingBoost;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 lightDir = normalize(uLightDirection);
    vec3 viewDir = normalize(cameraPosition - vWorldPos);

    float ndl = max(dot(normal, lightDir), 0.0);
    float wrapped = ndl * 0.7 + 0.3;

    float depthVar = abs(vUnitPos.y) * 0.25;
    float wave = sin(vUnitPos.x * 28.0 + vUnitPos.y * 16.0) * 0.5 + 0.5;
    vec3 color = mix(uOceanColor, uOceanDeepColor, depthVar * uDepthFade);
    color = mix(color, uOceanColor * 1.22, wave * 0.08);

    vec3 halfVec = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfVec), 0.0), 80.0) * uSpecular * 0.5;
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 4.0) * 0.1;

    color = color * wrapped + vec3(1.0) * spec + uOceanColor * fresnel;
    color *= uLightingBoost;
    float alpha = mix(0.52, 0.78, depthVar);
    gl_FragColor = vec4(clamp(color, 0.0, 1.0), alpha);
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
  uniform float uTurbulence;
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
    f = (1.0 - cos(f * 3.14159265)) * 0.5;
    float n000 = hash(i);
    float n100 = hash(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash(i + vec3(1.0));
    return mix(mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y), mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y), f.z);
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amp = 0.5;
    float freq = 1.0;
    for (int i = 0; i < 4; i++) {
      value += noise(p * freq) * amp;
      freq *= 2.0;
      amp *= 0.5;
    }
    return value;
  }

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 lightDir = normalize(uLightDirection);
    vec3 seedVec = vec3(uSeed * 0.00000017, uSeed * 0.00000023, uSeed * 0.00000029);

    float macro = fbm((vUnitPos + seedVec) * mix(4.0, 3.0, uSurfaceModel) * (1.0 + uTurbulence));
    float detail = fbm((vUnitPos + seedVec * 2.3) * mix(8.0, 5.0, uSurfaceModel) * (1.1 + uTurbulence));
    float jets = sin((vUnitPos.y + uSeed * 0.00000011) * (12.0 + uBanding * 16.0)) * 0.5 + 0.5;
    float field = mix(macro * 0.7 + detail * 0.3, jets * 0.45 + detail * 0.55, uSurfaceModel);

    float threshold = 1.0 - uCoverage;
    float mask = smoothstep(threshold - 0.15, threshold + 0.1, field);

    float ndl = max(dot(normal, lightDir), 0.0);
    float wrapped = ndl * 0.5 + 0.5;
    float alpha = clamp(mask * uOpacity * 0.55, 0.0, 0.56);
    gl_FragColor = vec4(uCloudColor * wrapped * uLightingBoost, alpha);
  }
`;

const ATMOSPHERE_FRAGMENT_SHADER = `
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;

  uniform vec3 uColor;
  uniform float uDensity;
  uniform float uRim;
  uniform float uMie;
  uniform float uRayleigh;
  uniform vec3 uLightDirection;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 lightDir = normalize(uLightDirection);
    vec3 viewDir = normalize(cameraPosition - vWorldPos);

    float mu = max(dot(lightDir, viewDir), 0.0);
    float rayleighPhase = 0.75 * (1.0 + mu * mu);
    float g = 0.76;
    float miePhase = (1.0 - g * g) / (4.0 * 3.14159265 * pow(1.0 + g * g - 2.0 * g * mu, 1.5));
    float rim = pow(1.0 - max(dot(normal, viewDir), 0.0), mix(2.1, 3.4, uRim));
    float day = max(dot(normal, lightDir), 0.0);

    vec3 rayleighColor = uColor * (0.55 + 0.32 * day) * rayleighPhase * uRayleigh;
    vec3 mieColor = mix(uColor, vec3(1.0, 0.72, 0.54), 0.25) * miePhase * uMie;
    vec3 color = rayleighColor + mieColor;

    float alpha = clamp((rim * 0.42 + day * 0.08) * uDensity, 0.0, 0.34);
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
    float band1 = sin(radial * 14.0 + uSeed * 0.0001) * 0.5 + 0.5;
    float band2 = sin(radial * 32.0 + uSeed * 0.00017) * 0.5 + 0.5;
    float grain = band1 * 0.6 + band2 * 0.4;
    float edgeFade = smoothstep(0.0, 0.08, radial) * smoothstep(1.0, 0.92, radial);
    float gap = 1.0 - smoothstep(0.44, 0.46, radial) * (1.0 - smoothstep(0.48, 0.50, radial)) * 0.6;
    vec3 lightDir = normalize(uLightDirection);
    vec3 normal = normalize(vNormalW);
    float ndl = max(dot(normal, lightDir), 0.0);
    float alpha = edgeFade * gap * grain * uOpacity * 0.58;
    vec3 color = uColor * (0.48 + grain * 0.22) * (ndl * 0.26 + 0.48);
    gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.46));
  }
`;

function createSurfaceLayer(planetRadius: number, render: PlanetRenderInput['planet']['render'], segments: number, lightingBoost: number): THREE.Mesh {
  const geometry = buildDisplacedSphereGeometry({
    radius: planetRadius,
    segments,
    seed: render.surface.noiseSeed,
    moistureSeed: render.surface.moistureSeed,
    thermalSeed: render.surface.thermalSeed,
    oceanLevel: render.surface.oceanLevel,
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
      uMetalness: { value: THREE.MathUtils.clamp(1 - render.surface.roughness * 0.85, 0.03, 0.8) },
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

function createCloudLayer(planetRadius: number, render: PlanetRenderInput['planet']['render'], segments: number, lightingBoost: number): THREE.Mesh {
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
      uTurbulence: { value: render.clouds.turbulence },
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

function createOceanLayer(planetRadius: number, render: PlanetRenderInput['planet']['render'], segments: number, lightingBoost: number): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(planetRadius, segments, segments);
  const material = new THREE.ShaderMaterial({
    vertexShader: SHARED_SPHERE_VERTEX_SHADER,
    fragmentShader: OCEAN_FRAGMENT_SHADER,
    uniforms: {
      uOceanColor: { value: toColor(render.surface.oceanColor) },
      uOceanDeepColor: { value: toColor(render.surface.colorDeep) },
      uSpecular: { value: Math.max(render.surface.specularStrength, 0.3) },
      uDepthFade: { value: THREE.MathUtils.clamp(render.surface.noiseScale * 0.3, 0.2, 1) },
      uLightDirection: { value: new THREE.Vector3(0.52, 0.31, 0.79).normalize() },
      uLightingBoost: { value: lightingBoost },
    },
    transparent: true,
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
      uMie: { value: render.atmosphere.mieStrength },
      uRayleigh: { value: render.atmosphere.rayleighStrength },
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
    const radialT = Math.max(0, Math.min(1, (r - innerR) / rangeR));
    const angle = Math.atan2(y, x);
    uvs.setXY(i, radialT, angle / (2 * Math.PI) + 0.5);
  }
  uvs.needsUpdate = true;
  const material = new THREE.ShaderMaterial({
    vertexShader: RING_VERTEX_SHADER,
    fragmentShader: RING_FRAGMENT_SHADER,
    uniforms: {
      uColor: { value: toColor(render.rings.color) },
      uOpacity: { value: render.rings.opacity * 0.74 },
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

function shouldRenderLayer(layer: 'surface' | 'clouds' | 'atmosphere' | 'rings', debug: NonNullable<PlanetRenderInput['options']['debug']> | undefined): boolean {
  if (!debug) return true;
  const toggles = { surface: debug.surfaceOnly, clouds: debug.cloudsOnly, atmosphere: debug.atmosphereOnly, rings: debug.ringsOnly };
  const enabledExclusive = Object.values(toggles).some(Boolean);
  if (!enabledExclusive) return true;
  return Boolean(toggles[layer]);
}

export function createPlanetDetailRenderInstance(input: PlanetRenderInput): PlanetRenderInstance {
  if (process.env.NODE_ENV !== 'production' && input.options.viewMode === 'galaxy') {
    throw new Error('createPlanetDetailRenderInstance cannot be used for galaxy view.');
  }
  const { planet, x, y, z, options } = input;
  const view = createPlanetViewProfile(options.viewMode);
  const meshSegments = resolveAdaptiveSegments(view.meshSegments, input);
  const cloudSegments = resolveAdaptiveSegments(view.cloudSegments, input);

  const group = new THREE.Group();
  group.position.set(x, y, z);
  const disposeTargets: Array<THREE.BufferGeometry | THREE.Material | THREE.Material[]> = [];

  if (shouldRenderLayer('surface', options.debug)) {
    if (OCEAN_FAMILIES.includes(planet.render.family)) {
      const ocean = createOceanLayer(planet.render.renderRadius, planet.render, meshSegments, view.lightingBoost);
      group.add(ocean);
      disposeTargets.push(ocean.geometry, ocean.material);
    }
    const surface = createSurfaceLayer(planet.render.renderRadius, planet.render, meshSegments, view.lightingBoost);
    group.add(surface);
    disposeTargets.push(surface.geometry, surface.material);
  }

  if (planet.render.clouds.enabled && shouldRenderLayer('clouds', options.debug)) {
    const clouds = createCloudLayer(planet.render.renderRadius, planet.render, cloudSegments, view.lightingBoost);
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

  return {
    object: group,
    debugSnapshot: {
      planetId: planet.identity.planetId,
      seed: planet.identity.planetSeed,
      family: planet.identity.family,
      radiusClass: planet.identity.radiusClass,
      physicalRadius: planet.generated.physicalRadius,
      renderRadiusBase: planet.render.scale.renderRadiusBase,
      finalMeshScale: options.viewMode === 'galaxy' ? planet.render.scale.galaxyViewScaleMultiplier : planet.render.scale.planetViewScaleMultiplier,
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
        if (Array.isArray(target)) {
          for (const mat of target) mat.dispose();
        } else {
          target.dispose();
        }
      }
    },
  };
}
