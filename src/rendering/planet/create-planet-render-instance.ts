import * as THREE from 'three';

import { createPlanetViewProfile } from '@/domain/world/generate-planet-visual-profile';
import type { PlanetFamily } from '@/domain/world/planet-visual.types';
import { PLANET_LIGHT_DIRECTION } from './render-photometry';
import { PLANET_PIPELINE_VERSION, tracePlanetPipeline } from './runtime-audit';
import type { PlanetRenderInput, PlanetRenderInstance } from './types';
import { buildDisplacedSphereGeometry } from './build-displaced-sphere';

function toColor(value: [number, number, number]): THREE.Color {
  return new THREE.Color(value[0], value[1], value[2]);
}

function materialModelCode(model: PlanetRenderInput['planet']['render']['surface']['materialModel']): number {
  const mapping = { lush: 0, oceanic: 1, arid: 2, ice: 3, volcanic: 4, rocky: 5, toxic: 6, gaseous: 7 } as const;
  return mapping[model];
}

function cloudTypeCode(type: PlanetRenderInput['planet']['render']['clouds']['type']): number {
  const mapping = { none: 0, terrestrial: 1, ice: 2, dust: 3, toxic: 4, gaseous: 5 } as const;
  return mapping[type];
}

function familyCode(family: PlanetFamily): number {
  const mapping: Record<PlanetFamily, number> = {
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
  attribute float aBiomeMask;
  attribute float aIceMask;
  attribute float aCrackMask;
  attribute float aBandMask;
  attribute float aWaterMask;
  attribute float aSoilMask;
  attribute float aSandMask;
  attribute float aRockMask;
  attribute float aLavaMask;
  attribute float aGasMask;

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
  varying float vBiomeMask;
  varying float vIceMask;
  varying float vCrackMask;
  varying float vBandMask;
  varying float vWaterMask;
  varying float vSoilMask;
  varying float vSandMask;
  varying float vRockMask;
  varying float vLavaMask;
  varying float vGasMask;

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
    vBiomeMask = aBiomeMask;
    vIceMask = aIceMask;
    vCrackMask = aCrackMask;
    vBandMask = aBandMask;
    vWaterMask = aWaterMask;
    vSoilMask = aSoilMask;
    vSandMask = aSandMask;
    vRockMask = aRockMask;
    vLavaMask = aLavaMask;
    vGasMask = aGasMask;

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
  varying float vBiomeMask;
  varying float vIceMask;
  varying float vCrackMask;
  varying float vBandMask;
  varying float vWaterMask;
  varying float vSoilMask;
  varying float vSandMask;
  varying float vRockMask;
  varying float vLavaMask;
  varying float vGasMask;

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
  uniform float uBiomeContrast;
  uniform float uOceanSpecBoost;
  uniform float uMaterialModel;
  uniform vec3 uLightDirection;
  uniform float uLightingBoost;
  uniform vec3 uIblSkyColor;
  uniform vec3 uIblGroundColor;
  uniform vec3 uIblHorizonColor;
  uniform float uIblIntensity;

  float sat(float x) { return clamp(x, 0.0, 1.0); }
  float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float n3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n000 = hash(i + vec3(0.0,0.0,0.0));
    float n100 = hash(i + vec3(1.0,0.0,0.0));
    float n010 = hash(i + vec3(0.0,1.0,0.0));
    float n110 = hash(i + vec3(1.0,1.0,0.0));
    float n001 = hash(i + vec3(0.0,0.0,1.0));
    float n101 = hash(i + vec3(1.0,0.0,1.0));
    float n011 = hash(i + vec3(0.0,1.0,1.0));
    float n111 = hash(i + vec3(1.0,1.0,1.0));
    return mix(mix(mix(n000,n100,f.x), mix(n010,n110,f.x), f.y), mix(mix(n001,n101,f.x), mix(n011,n111,f.x), f.y), f.z);
  }

  vec3 ramp(float t, vec3 a, vec3 b, vec3 c) {
    float low = smoothstep(0.0, 0.52, t);
    float high = smoothstep(0.5, 1.0, t);
    return mix(mix(a, b, low), c, high);
  }

  void main() {
    vec3 n = normalize(vWorldNormal);
    vec3 l = normalize(uLightDirection);
    vec3 v = normalize(cameraPosition - vWorldPos);

    float ndl = max(dot(n, l), 0.0);
    float diffuse = ndl * 0.78 + 0.22;

    float biomeWarm = sat(vTemperatureMask * 0.7 + (1.0 - vHumidityMask) * 0.3);
    float biomeCold = sat((1.0 - vTemperatureMask) * 0.85 + vCraterMask * 0.2);
    float biomeWet = sat(vHumidityMask * 0.9 + (1.0 - vErosionMask) * 0.25);
    float biome = sat(pow(vBiomeMask, mix(1.35, 0.82, uBiomeContrast - 0.7)));

    vec3 landBase = ramp(vHeight, uColorDeep, uColorMid, uColorHigh);
    landBase = mix(landBase, uColorMid * 1.07, biomeWet * 0.26 + biome * 0.14);
    landBase = mix(landBase, uColorHigh * vec3(1.06, 1.01, 0.95), biomeWarm * 0.34);
    landBase = mix(landBase, uColorHigh * vec3(0.82, 0.9, 1.08), biomeCold * 0.42);
    landBase = mix(landBase, uAccentColor, vThermalMask * 0.76);
    landBase *= mix(1.0, 0.8, vCraterMask * 0.72);

    vec3 waterShallow = mix(uOceanColor * 1.08 + vec3(0.03, 0.06, 0.08), uOceanColor * 1.34, sat(1.0 - vOceanDepth));
    vec3 waterDeep = mix(uOceanColor * 0.66, uOceanColor * 0.32, vOceanDepth);
    vec3 water = mix(waterShallow, waterDeep, vOceanDepth);

    vec3 soil = mix(uColorDeep, uColorMid, sat(vBiomeMask * 0.8 + vHumidityMask * 0.2));
    vec3 sand = mix(uColorMid, uColorHigh, 0.65) * vec3(1.06, 0.96, 0.82);
    vec3 rock = mix(uColorDeep, uColorHigh, 0.38) * vec3(0.86, 0.86, 0.88);
    vec3 lava = mix(uAccentColor * 0.9, vec3(1.0, 0.45, 0.14), sat(vThermalMask * 0.9 + vCrackMask * 0.4));

    vec3 iceHard = vec3(0.72, 0.84, 0.96);
    vec3 iceSnow = vec3(0.94, 0.97, 1.0);
    vec3 iceBlue = vec3(0.62, 0.77, 0.93);
    vec3 ice = mix(iceHard, iceSnow, sat(vIceMask * 0.72));
    ice = mix(ice, iceBlue, sat(vCrackMask * 0.62));

    float shear = n3(vUnitPos * vec3(9.0, 3.0, 9.0) + vec3(vBandMask * 2.2));
    float cells = n3(vUnitPos * 16.0 + vec3(vThermalMask * 3.0));
    vec3 gasBand = mix(uColorDeep, uColorMid, sat(vBandMask * 0.78 + shear * 0.22));
    gasBand = mix(gasBand, uColorHigh, sat(vBandMask * 0.5 + vThermalMask * 0.34 + cells * 0.18));
    vec3 gasStorm = mix(gasBand, uAccentColor, sat(vThermalMask * 0.72 + cells * 0.32));
    vec3 gas = mix(gasBand, gasStorm, sat(vBandMask * 0.44 + vThermalMask * 0.4 + shear * 0.2));

    vec3 solidAlbedo =
      water * vWaterMask +
      soil * vSoilMask +
      sand * vSandMask +
      rock * vRockMask +
      ice * vIceMask +
      lava * vLavaMask;

    vec3 albedo = mix(solidAlbedo, gas, sat(vGasMask + uSurfaceModel * 0.9));

    if (uFamilyCode < 0.5) {
      albedo = mix(albedo, vec3(albedo.r * 0.82, albedo.g * 1.08, albedo.b * 0.86), sat(vHumidityMask * 0.28));
    } else if (uFamilyCode < 1.5) {
      albedo = mix(albedo, uOceanColor * 1.2, 0.4 + (1.0 - vLandMask) * 0.36);
    } else if (uFamilyCode < 2.5) {
      albedo *= vec3(1.1, 0.97, 0.84);
      albedo = mix(albedo, vec3(dot(albedo, vec3(0.299, 0.587, 0.114))), 0.11);
    } else if (uFamilyCode < 3.5) {
      albedo = mix(albedo, vec3(0.84, 0.93, 1.0), 0.3 + biomeCold * 0.25);
    } else if (uFamilyCode < 4.5) {
      albedo = mix(albedo, vec3(0.1, 0.09, 0.08), 0.22);
    } else if (uFamilyCode < 5.5) {
      albedo = mix(albedo, vec3(0.58, 0.57, 0.56), vCraterMask * 0.46);
    } else if (uFamilyCode < 6.5) {
      albedo = mix(albedo, uAccentColor, 0.14 + vThermalMask * 0.24);
    } else {
      albedo = mix(albedo, uColorHigh * 1.08, vBandMask * 0.35);
    }

    if (uMaterialModel < 4.5) {
      albedo = mix(albedo, albedo * vec3(1.02, 1.01, 1.0), vBiomeMask * 0.12);
    }

    float roughness = mix(
      clamp(uRoughness + vMountainMask * 0.14 + vRockMask * 0.16 + vCraterMask * 0.12 - vWaterMask * 0.22 - vIceMask * 0.1 + vCrackMask * 0.06, 0.04, 0.98),
      clamp(uRoughness * 0.86 + (1.0 - vBandMask) * 0.1, 0.08, 0.86),
      sat(uSurfaceModel)
    );

    float metalnessHack = mix(0.02, 0.11, sat(uSurfaceModel));
    float specPow = mix(38.0, 122.0, 1.0 - roughness);
    vec3 halfVec = normalize(l + v);
    float spec = pow(max(dot(n, halfVec), 0.0), specPow) * (0.08 + uSpecular * 0.92);

    float fresnel = pow(1.0 - max(dot(n, v), 0.0), 4.4);

    float up = clamp(n.y * 0.5 + 0.5, 0.0, 1.0);
    float horizon = 1.0 - abs(n.y);
    vec3 ibl = mix(uIblGroundColor, uIblSkyColor, up);
    ibl = mix(ibl, uIblHorizonColor, horizon * 0.72);

    vec3 color = albedo * diffuse;
    color += ibl * albedo * (0.16 + (1.0 - roughness) * 0.24) * uIblIntensity;
    color += ibl * (spec + fresnel * 0.24 + metalnessHack * 0.06) * uIblIntensity;

    float oceanSpec = (1.0 - roughness) * (1.0 - sat(uSurfaceModel)) * vWaterMask * (0.36 + uOceanSpecBoost);
    color += vec3(oceanSpec * (spec * 1.3 + fresnel * 0.4));

    color += uAccentColor * (uEmissive * (vLavaMask * 1.1 + vThermalMask * 0.5 + vBandMask * 0.18));
    color *= uLightingBoost;
    color = max(color, vec3(0.025));

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
  }
`;

const CLOUD_FRAGMENT_SHADER = `
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vUnitPos;

  uniform vec3 uCloudColor;
  uniform float uCoverage;
  uniform float uOpacity;
  uniform float uBanding;
  uniform float uSurfaceModel;
  uniform float uCloudType;
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
    float amp = 0.58;
    float freq = 1.0;
    for (int i = 0; i < 5; i++) {
      value += noise(p * freq) * amp;
      freq *= 2.05;
      amp *= 0.52;
    }
    return value;
  }

  void main() {
    vec3 n = normalize(vWorldNormal);
    vec3 l = normalize(uLightDirection);
    vec3 v = normalize(cameraPosition - vWorldPos);
    vec3 seedVec = vec3(uSeed * 0.00000017, uSeed * 0.00000023, uSeed * 0.00000029);

    float macro = fbm((vUnitPos + seedVec) * mix(7.5, 4.3, uSurfaceModel));
    float detail = fbm((vUnitPos + seedVec * 2.2) * mix(16.4, 9.7, uSurfaceModel));
    float jet = sin((vUnitPos.y + uSeed * 0.00000012) * (17.0 + uBanding * 20.0)) * 0.5 + 0.5;

    float field = mix(macro * 0.62 + detail * 0.38, jet * 0.58 + detail * 0.42, uSurfaceModel);
    if (uCloudType < 0.5) { field *= 0.82; }
    else if (uCloudType < 1.5) { field = field * 0.9 + detail * 0.08; }
    else if (uCloudType < 2.5) { field = field * 0.7 + macro * 0.24; }
    else if (uCloudType < 3.5) { field = field * 0.84 + (1.0 - detail) * 0.09; }
    else if (uCloudType < 4.5) { field = field * 0.8 + jet * 0.16; }

    float threshold = 1.0 - uCoverage;
    float softness = uCloudType < 2.5 ? 0.08 : 0.05;
    float mask = smoothstep(threshold - softness, threshold + 0.05, field);

    float ndl = max(dot(n, l), 0.0);
    float wrapped = ndl * 0.6 + 0.4;
    float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0);
    float alpha = clamp(mask * uOpacity * (0.62 + detail * 0.32), 0.0, 0.92);

    vec3 color = uCloudColor * (wrapped * 0.86 + 0.14) * uLightingBoost;
    color += uCloudColor * rim * 0.22;

    gl_FragColor = vec4(color, alpha);
  }
`;

const ATMOSPHERE_FRAGMENT_SHADER = `
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;

  uniform vec3 uColor;
  uniform float uDensity;
  uniform float uRim;
  uniform float uNightGlow;
  uniform vec3 uLightDirection;

  void main() {
    vec3 n = normalize(vWorldNormal);
    vec3 l = normalize(uLightDirection);
    vec3 v = normalize(cameraPosition - vWorldPos);

    float ndl = max(dot(n, l), 0.0);
    float limb = pow(1.0 - max(dot(n, v), 0.0), 2.5);
    float forward = pow(max(dot(v, l), 0.0), 6.0);

    vec3 cleanTint = mix(uColor, vec3(0.55, 0.68, 0.92), 0.22);
    vec3 dayColor = cleanTint * (0.86 + ndl * 0.52);
    vec3 duskColor = mix(cleanTint * 0.72, vec3(0.98, 0.56, 0.34), 0.28);
    vec3 scatter = mix(dayColor, duskColor, pow(1.0 - ndl, 1.8));

    float night = pow(1.0 - ndl, 2.2) * uNightGlow;
    scatter += uColor * (0.22 + night * 0.6) * night;
    float alpha = clamp(limb * (0.11 + uRim * 0.28) + (1.0 - ndl) * uDensity * 0.05 + forward * 0.05, 0.0, 0.44);
    gl_FragColor = vec4(scatter, alpha);
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

  float hash1(float n) { return fract(sin(n) * 43758.5453); }
  float bands(float x, float seed) {
    float coarse = sin((x + seed * 0.00000011) * 76.0) * 0.5 + 0.5;
    float medium = sin((x + seed * 0.00000017) * 201.0) * 0.5 + 0.5;
    float grain = hash1(floor((x + seed * 0.00000019) * 380.0));
    return coarse * 0.42 + medium * 0.36 + grain * 0.22;
  }

  void main() {
    float radial = abs(vUv.y - 0.5) * 2.0;
    float edgeFade = 1.0 - smoothstep(0.62, 0.98, radial);
    float innerGap = smoothstep(0.04, 0.14, radial);
    float radialField = bands(vUv.x, uSeed);

    vec3 l = normalize(uLightDirection);
    vec3 v = normalize(cameraPosition - vWorldPos);
    vec3 n = normalize(vNormalW);

    float lit = max(dot(n, l), 0.0) * 0.44 + 0.5;
    float scatter = pow(1.0 - abs(dot(n, v)), 1.9) * 0.46;

    float ringStrata = smoothstep(0.12, 0.86, radialField * (0.78 + uRingDensity * 0.32));
    float alpha = edgeFade * innerGap * ringStrata * uOpacity * (0.72 + uRingDensity * 0.46);

    vec3 color = uColor * (0.68 + radialField * 0.46) * (lit + scatter);
    gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.9));
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
    segments: highQuality ? segments : Math.max(24, Math.floor(segments * 0.58)),
    seed: render.surface.noiseSeed,
    moistureSeed: render.surface.moistureSeed,
    thermalSeed: render.surface.thermalSeed,
    oceanLevel: render.surface.oceanLevel,
    reliefAmplitude: highQuality ? render.surface.reliefAmplitude : render.surface.reliefAmplitude * 0.62,
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
      uBiomeContrast: { value: render.surface.biomeContrast },
      uOceanSpecBoost: { value: render.surface.oceanSpecularBoost },
      uMaterialModel: { value: materialModelCode(render.surface.materialModel) },
      uLightDirection: { value: PLANET_LIGHT_DIRECTION.clone() },
      uLightingBoost: { value: lightingBoost },
      uIblSkyColor: { value: new THREE.Color('#85adff') },
      uIblGroundColor: { value: new THREE.Color('#1b2130') },
      uIblHorizonColor: { value: new THREE.Color('#94a8ca') },
      uIblIntensity: { value: 0.88 },
    },
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'surface';
  mesh.userData.rotationSpeed = render.surfaceModel === 'gaseous' ? render.clouds.speed * 0.35 : 0;
  return mesh;
}

function createCloudLayer(
  planetRadius: number,
  render: PlanetRenderInput['planet']['render'],
  segments: number,
  lightingBoost: number,
): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(planetRadius * 1.026, segments, segments);
  const material = new THREE.ShaderMaterial({
    vertexShader: SHARED_SPHERE_VERTEX_SHADER,
    fragmentShader: CLOUD_FRAGMENT_SHADER,
    uniforms: {
      uCloudColor: { value: toColor(render.clouds.color) },
      uCoverage: { value: render.clouds.coverage },
      uOpacity: { value: render.clouds.opacity },
      uBanding: { value: render.clouds.stormBanding },
      uSurfaceModel: { value: render.surfaceModel === 'gaseous' ? 1 : 0 },
      uCloudType: { value: cloudTypeCode(render.clouds.type) },
      uSeed: { value: render.clouds.noiseSeed },
      uLightDirection: { value: PLANET_LIGHT_DIRECTION.clone() },
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
    vertexShader: SHARED_SPHERE_VERTEX_SHADER,
    fragmentShader: ATMOSPHERE_FRAGMENT_SHADER,
    uniforms: {
      uColor: { value: toColor(render.atmosphere.color) },
      uDensity: { value: render.atmosphere.density },
      uRim: { value: render.atmosphere.rimStrength },
      uNightGlow: { value: render.atmosphere.nightGlow },
      uLightDirection: { value: PLANET_LIGHT_DIRECTION.clone() },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    side: THREE.BackSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'atmosphere';
  mesh.userData.rotationSpeed = 0;
  return mesh;
}

function createRingLayer(render: PlanetRenderInput['planet']['render'], segments: number): THREE.Mesh {
  const geometry = new THREE.RingGeometry(render.rings.innerRadius, render.rings.outerRadius, segments, 2);
  const material = new THREE.ShaderMaterial({
    vertexShader: RING_VERTEX_SHADER,
    fragmentShader: RING_FRAGMENT_SHADER,
    uniforms: {
      uColor: { value: toColor(render.rings.color) },
      uOpacity: { value: render.rings.opacity },
      uSeed: { value: render.rings.noiseSeed },
      uRingDensity: { value: render.rings.density },
      uLightDirection: { value: PLANET_LIGHT_DIRECTION.clone() },
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const ring = new THREE.Mesh(geometry, material);
  ring.name = 'rings';
  ring.rotation.x = Math.PI / 2 + render.rings.tilt;
  ring.userData.rotationSpeed = 0.004;
  return ring;
}


function assertGeometryAttributes(mesh: THREE.Mesh): void {
  if (!(mesh.geometry instanceof THREE.BufferGeometry)) return;
  const required = ['aHeight', 'aLandMask', 'aMountainMask', 'aCoastMask', 'aHumidityMask', 'aTemperatureMask', 'aBiomeMask', 'aIceMask', 'aCrackMask', 'aWaterMask', 'aSoilMask', 'aSandMask', 'aRockMask', 'aLavaMask', 'aGasMask'];
  for (const key of required) {
    if (!mesh.geometry.getAttribute(key)) {
      tracePlanetPipeline({ stage: 'assert:missing-attribute', mesh: mesh.name, attribute: key });
    }
  }
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
  tracePlanetPipeline({
    stage: 'createPlanetRenderInstance',
    planetId: planet.identity.planetId,
    family: planet.render.family,
    surfaceModel: planet.render.surfaceModel,
    viewMode: options.viewMode,
    meshSegments: view.meshSegments,
    noiseSeed: planet.render.surface.noiseSeed,
  });

  const group = new THREE.Group();
  group.position.set(x, y, z);

  const disposeTargets: Array<THREE.BufferGeometry | THREE.Material | THREE.Material[]> = [];

  if (shouldRenderLayer('surface', options.debug)) {
    const surface = createSurfaceLayer(planet.render.renderRadius, planet.render, view.meshSegments, view.lightingBoost, highQuality);
    surface.userData.pipelineVersion = PLANET_PIPELINE_VERSION;
    group.add(surface);
    assertGeometryAttributes(surface);
    disposeTargets.push(surface.geometry, surface.material);
  }

  if (planet.render.clouds.enabled && shouldRenderLayer('clouds', options.debug)) {
    const clouds = createCloudLayer(planet.render.renderRadius, planet.render, view.cloudSegments, view.lightingBoost);
    clouds.userData.pipelineVersion = PLANET_PIPELINE_VERSION;
    group.add(clouds);
    disposeTargets.push(clouds.geometry, clouds.material);
  }

  if (planet.render.atmosphere.enabled && shouldRenderLayer('atmosphere', options.debug)) {
    const atmosphere = createAtmosphereLayer(planet.render.renderRadius, planet.render, view.atmosphereSegments);
    atmosphere.userData.pipelineVersion = PLANET_PIPELINE_VERSION;
    group.add(atmosphere);
    disposeTargets.push(atmosphere.geometry, atmosphere.material);
  }

  if (view.enableRings && planet.render.rings.enabled && shouldRenderLayer('rings', options.debug)) {
    const rings = createRingLayer(planet.render, view.ringSegments);
    rings.userData.pipelineVersion = PLANET_PIPELINE_VERSION;
    group.add(rings);
    disposeTargets.push(rings.geometry, rings.material);
  }

  group.rotation.z = planet.visualDNA.rotation.axialTilt;
  group.userData.pipelineVersion = PLANET_PIPELINE_VERSION;

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
    pipelineVersion: PLANET_PIPELINE_VERSION,
  };

  tracePlanetPipeline({
    stage: 'createPlanetRenderInstance:layers',
    planetId: planet.identity.planetId,
    viewMode: options.viewMode,
    layers: group.children.map((child) => child.name),
  });

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
