export const SURFACE_VERTEX_SHADER_PLANET = `
  attribute float aElevation;
  attribute float aWaterMask;
  attribute float aSlopeMask;
  attribute float aHumidityMask;
  attribute float aTemperatureMask;
  attribute float aThermalMask;
  attribute float aRockMask;
  attribute float aSedimentMask;
  attribute float aSnowMask;
  attribute float aLavaMask;

  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vUnitPos;
  varying float vElevation;
  varying float vWaterMask;
  varying float vSlopeMask;
  varying float vHumidityMask;
  varying float vTemperatureMask;
  varying float vThermalMask;
  varying float vRockMask;
  varying float vSedimentMask;
  varying float vSnowMask;
  varying float vLavaMask;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vUnitPos = normalize(position);

    vElevation = aElevation;
    vWaterMask = aWaterMask;
    vSlopeMask = aSlopeMask;
    vHumidityMask = aHumidityMask;
    vTemperatureMask = aTemperatureMask;
    vThermalMask = aThermalMask;
    vRockMask = aRockMask;
    vSedimentMask = aSedimentMask;
    vSnowMask = aSnowMask;
    vLavaMask = aLavaMask;

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const SURFACE_FRAGMENT_SHADER_PLANET = `
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vUnitPos;
  varying float vElevation;
  varying float vWaterMask;
  varying float vSlopeMask;
  varying float vHumidityMask;
  varying float vTemperatureMask;
  varying float vThermalMask;
  varying float vRockMask;
  varying float vSedimentMask;
  varying float vSnowMask;
  varying float vLavaMask;

  uniform vec3 uColorDeep;
  uniform vec3 uColorMid;
  uniform vec3 uColorHigh;
  uniform vec3 uOceanColor;
  uniform vec3 uAccentColor;
  uniform float uEmissive;
  uniform float uRoughness;
  uniform float uSpecularStrength;
  uniform float uLightingBoost;
  uniform vec3 uLightDirection;

  float sat(float x) { return clamp(x, 0.0, 1.0); }

  vec3 triplanarShade(vec3 normal, vec3 worldPos, vec3 baseA, vec3 baseB, float scale, float contrast) {
    vec3 blend = abs(normal);
    blend = pow(blend, vec3(contrast));
    blend /= max(0.0001, blend.x + blend.y + blend.z);

    vec2 uvX = worldPos.yz * scale;
    vec2 uvY = worldPos.xz * scale;
    vec2 uvZ = worldPos.xy * scale;

    float nX = sin(uvX.x * 6.0) * cos(uvX.y * 6.0) * 0.5 + 0.5;
    float nY = sin(uvY.x * 6.0 + 1.2) * cos(uvY.y * 6.0 + 0.7) * 0.5 + 0.5;
    float nZ = sin(uvZ.x * 6.0 - 0.8) * cos(uvZ.y * 6.0 + 1.1) * 0.5 + 0.5;

    vec3 cx = mix(baseA * 0.82, baseB * 1.12, nX);
    vec3 cy = mix(baseA * 0.82, baseB * 1.12, nY);
    vec3 cz = mix(baseA * 0.82, baseB * 1.12, nZ);

    return cx * blend.x + cy * blend.y + cz * blend.z;
  }

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    vec3 lightDir = normalize(uLightDirection);

    float ndl = max(dot(normal, lightDir), 0.0);
    float wrap = smoothstep(0.0, 1.0, ndl * 0.84 + 0.08);

    float rock = sat(vRockMask);
    float sediment = sat(vSedimentMask);
    float snow = sat(vSnowMask);
    float lava = sat(vLavaMask);
    float water = sat(vWaterMask);

    vec3 sedimentCol = triplanarShade(normal, vWorldPos, uColorDeep, uColorMid, 0.7, 3.0);
    vec3 rockCol = triplanarShade(normal, vWorldPos, uColorMid * 0.8, uColorHigh * 1.05, 1.35, 2.2);
    vec3 snowCol = triplanarShade(normal, vWorldPos, uColorHigh * 1.08, vec3(0.95, 0.98, 1.0), 1.8, 1.4);
    vec3 lavaCol = triplanarShade(normal, vWorldPos, uAccentColor * vec3(1.20, 0.58, 0.22), uAccentColor * vec3(1.40, 0.38, 0.12), 2.3, 1.2);

    float solidSum = max(0.0001, rock + sediment + snow + lava * 1.2);
    vec3 landCol = (
      rockCol * rock +
      sedimentCol * sediment +
      snowCol * snow +
      lavaCol * lava * 1.2
    ) / solidSum;

    float oceanDepth = sat(1.0 - vElevation * 0.7);
    vec3 shallowWater = uOceanColor * vec3(1.18, 1.12, 1.04);
    vec3 deepWater = uOceanColor * vec3(0.62, 0.76, 0.96);
    vec3 waterCol = mix(shallowWater, deepWater, smoothstep(0.1, 0.9, oceanDepth));

    vec3 albedo = mix(landCol, waterCol, water);

    float fresnel = pow(1.0 - sat(dot(normal, viewDir)), 3.0);
    float halfSpec = max(dot(normal, normalize(lightDir + viewDir)), 0.0);
    float localRoughness = clamp(uRoughness + rock * 0.12 + sediment * 0.18 - water * 0.34 - snow * 0.12, 0.08, 0.96);
    float specPower = mix(10.0, 82.0, 1.0 - localRoughness);
    float spec = pow(halfSpec, specPower) * (uSpecularStrength * (0.16 + water * 1.1 + snow * 0.24));

    float slopeShadow = (1.0 - dot(normal, normalize(vUnitPos))) * 0.16;
    float thermalLift = vThermalMask * 0.22;
    float tonal = clamp(0.42 + wrap * 0.9 - slopeShadow + spec + fresnel * (0.04 + water * 0.10), 0.2, 1.75);

    vec3 color = albedo * tonal;
    color += uAccentColor * (uEmissive * (thermalLift + lava * 0.48));

    gl_FragColor = vec4(clamp(color * uLightingBoost, vec3(0.03), vec3(1.0)), 1.0);
  }
`;

export const SURFACE_VERTEX_SHADER_GALAXY = SURFACE_VERTEX_SHADER_PLANET;
export const SURFACE_FRAGMENT_SHADER_GALAXY = SURFACE_FRAGMENT_SHADER_PLANET;

export function getSurfacePlanetFragmentShader(): string {
  return SURFACE_FRAGMENT_SHADER_PLANET;
}
