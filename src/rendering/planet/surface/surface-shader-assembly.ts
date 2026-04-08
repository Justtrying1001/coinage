import { SURFACE_BIOME_GLSL } from './surface-biome.glsl';
import { SURFACE_CORE_GLSL } from './surface-core.glsl';
import { SURFACE_LIGHTING_GLSL } from './surface-lighting.glsl';

// Responsibility: wire shader modules together and expose final shader strings.
export const SURFACE_VERTEX_SHADER_PLANET = `
  attribute float aHeight;
  attribute float aLandMask;
  attribute float aOceanDepth;
  attribute float aHumidityMask;
  attribute float aTemperatureMask;
  attribute float aThermalMask;
  attribute float aErosionMask;
  attribute float aCraterMask;
  attribute float aBandMask;
  attribute float aMacroRelief;
  attribute float aMidRelief;
  attribute float aMicroRelief;
  attribute float aSilhouetteMask;
  attribute float aFractureMask;

  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vUnitPos;
  varying float vHeight;
  varying float vLandMask;
  varying float vOceanDepth;
  varying float vHumidityMask;
  varying float vTemperatureMask;
  varying float vThermalMask;
  varying float vErosionMask;
  varying float vCraterMask;
  varying float vBandMask;
  varying float vMacroRelief;
  varying float vMidRelief;
  varying float vMicroRelief;
  varying float vSilhouetteMask;
  varying float vFractureMask;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vUnitPos = normalize(position);

    vHeight = aHeight;
    vLandMask = aLandMask;
    vOceanDepth = aOceanDepth;
    vHumidityMask = aHumidityMask;
    vTemperatureMask = aTemperatureMask;
    vThermalMask = aThermalMask;
    vErosionMask = aErosionMask;
    vCraterMask = aCraterMask;
    vBandMask = aBandMask;
    vMacroRelief = aMacroRelief;
    vMidRelief = aMidRelief;
    vMicroRelief = aMicroRelief;
    vSilhouetteMask = aSilhouetteMask;
    vFractureMask = aFractureMask;

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const SURFACE_VERTEX_SHADER_GALAXY = `
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

export const SURFACE_FRAGMENT_SHADER_GALAXY = `
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vUnitPos;

  uniform vec3 uColorDeep;
  uniform vec3 uColorMid;
  uniform vec3 uColorHigh;
  uniform vec3 uOceanColor;
  uniform vec3 uAccentColor;
  uniform float uSurfaceModel;
  uniform float uSeed;
  uniform float uRoughness;
  uniform float uSpecularStrength;
  uniform float uBandingStrength;
  uniform float uLightingBoost;
  uniform float uShadingContrast;

  float sat(float x) { return clamp(x, 0.0, 1.0); }
  float n3(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7)) + uSeed * 0.0000013) * 43758.5453);
  }

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 p = normalize(vUnitPos);
    float continents = smoothstep(0.4, 0.62, n3(p * 2.0) * 0.65 + n3(p * 4.1) * 0.35);
    float mountains = smoothstep(0.56, 0.84, n3(p * 7.5) * continents + continents * 0.28);
    float coasts = smoothstep(0.38, 0.62, continents) - smoothstep(0.62, 0.78, continents);
    float oceanDepth = 1.0 - continents;
    float bands = smoothstep(0.3, 0.76, sin((p.y + uSeed * 0.00000011) * 17.0) * 0.5 + 0.5);

    vec3 land = mix(uColorDeep, uColorMid, continents);
    land = mix(land, uColorHigh, mountains * 0.72);
    land = mix(land, uAccentColor, coasts * 0.34);

    vec3 ocean = mix(uOceanColor * 1.4, uOceanColor * 0.92, sat(oceanDepth));
    vec3 coast = mix(ocean * 1.12, land, smoothstep(0.2, 0.8, coasts));

    vec3 albedo = mix(ocean, land, continents);
    albedo = mix(albedo, coast, coasts);

    vec3 gas = mix(uColorDeep, uColorMid, bands);
    gas = mix(gas, uColorHigh, bands * 0.54);
    albedo = mix(albedo, gas, sat(uSurfaceModel));

    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float softShading = (normal.y * 0.5 + 0.5) * uShadingContrast;
    float rim = pow(1.0 - sat(dot(normal, viewDir)), 2.2) * 0.12;
    float gloss = clamp(1.0 - uRoughness, 0.05, 0.98);
    float specPower = mix(6.0, 32.0, gloss);
    float specular = pow(max(dot(normal, normalize(vec3(0.35, 0.75, 0.25))), 0.0), specPower) * (0.03 + uSpecularStrength * 0.11 + uBandingStrength * 0.04);
    float tonal = 1.08 + softShading + rim + specular;
    float luma = dot(albedo, vec3(0.2126, 0.7152, 0.0722));
    vec3 saturated = mix(vec3(luma), albedo, 1.18);
    vec3 color = saturated * tonal + saturated * 0.06;
    color = clamp(color * uLightingBoost, vec3(0.32), vec3(1.0));

    gl_FragColor = vec4(color, 1.0);
  }
`;

export function getSurfacePlanetFragmentShader(): string {
  return `
${SURFACE_CORE_GLSL}
${SURFACE_BIOME_GLSL}
${SURFACE_LIGHTING_GLSL}

  void main() {
    SurfaceState state = buildSurfaceState();
    state.landBase = applyBiomeTint(
      state.landBase,
      state.humidity,
      state.temperature,
      state.rockyMask,
      state.lowlandMask,
      state.highlandMask
    );

    vec3 litColor = applySurfaceLighting(
      state.albedo,
      state.normal,
      vUnitPos,
      state.heightNorm,
      state.reliefShade,
      vSilhouetteMask,
      vThermalMask,
      vBandMask,
      uAccentColor,
      uEmissive,
      uRoughness,
      uSpecularStrength,
      uBandingStrength,
      uShadingContrast,
      uLightingBoost
    );

    vec3 landLitColor = applySurfaceLighting(
      state.landBase,
      state.normal,
      vUnitPos,
      state.heightNorm,
      state.reliefShade,
      vSilhouetteMask,
      vThermalMask,
      vBandMask,
      uAccentColor,
      uEmissive,
      uRoughness,
      uSpecularStrength,
      uBandingStrength,
      uShadingContrast,
      uLightingBoost
    );

    vec3 color = mix(litColor, landLitColor, sat(vLandMask) * (1.0 - sat(uSurfaceModel)));

    gl_FragColor = vec4(color, 1.0);
  }
`;
}
