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
  uniform float uFamilyType;

  uniform sampler2D uRockAlbedo;
  uniform sampler2D uRockNormal;
  uniform sampler2D uRockRoughness;
  uniform sampler2D uRockAo;

  uniform sampler2D uSedimentAlbedo;
  uniform sampler2D uSedimentNormal;
  uniform sampler2D uSedimentRoughness;
  uniform sampler2D uSedimentAo;

  uniform sampler2D uSnowAlbedo;
  uniform sampler2D uSnowNormal;
  uniform sampler2D uSnowRoughness;
  uniform sampler2D uSnowAo;

  uniform sampler2D uLavaAlbedo;
  uniform sampler2D uLavaNormal;
  uniform sampler2D uLavaRoughness;
  uniform sampler2D uLavaAo;

  uniform sampler2D uWetnessAlbedo;
  uniform sampler2D uWetnessNormal;
  uniform sampler2D uWetnessRoughness;
  uniform sampler2D uWetnessAo;

  float sat(float x) { return clamp(x, 0.0, 1.0); }

  vec3 triplanarWeights(vec3 normal, float contrast) {
    vec3 blend = abs(normal);
    blend = pow(blend, vec3(contrast));
    return blend / max(0.0001, blend.x + blend.y + blend.z);
  }

  vec4 triplanarTexture(sampler2D tex, vec3 worldPos, vec3 weights, float scale) {
    vec2 uvX = worldPos.yz * scale;
    vec2 uvY = worldPos.xz * scale;
    vec2 uvZ = worldPos.xy * scale;
    vec4 cx = texture2D(tex, uvX);
    vec4 cy = texture2D(tex, uvY);
    vec4 cz = texture2D(tex, uvZ);
    return cx * weights.x + cy * weights.y + cz * weights.z;
  }

  vec3 unpackNormal(vec3 n) {
    return normalize(n * 2.0 - 1.0);
  }

  float familyMask(float id) {
    return 1.0 - step(0.5, abs(uFamilyType - id));
  }

  void main() {
    vec3 baseNormal = normalize(vWorldNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    vec3 lightDir = normalize(uLightDirection);

    vec3 weights = triplanarWeights(baseNormal, 3.0);

    vec4 rockAlb = triplanarTexture(uRockAlbedo, vWorldPos, weights, 0.55);
    vec4 sedAlb = triplanarTexture(uSedimentAlbedo, vWorldPos, weights, 0.65);
    vec4 snowAlb = triplanarTexture(uSnowAlbedo, vWorldPos, weights, 0.88);
    vec4 lavaAlb = triplanarTexture(uLavaAlbedo, vWorldPos, weights, 0.92);
    vec4 wetAlb = triplanarTexture(uWetnessAlbedo, vWorldPos, weights, 0.72);

    vec3 rockN = unpackNormal(triplanarTexture(uRockNormal, vWorldPos, weights, 1.1).xyz);
    vec3 sedN = unpackNormal(triplanarTexture(uSedimentNormal, vWorldPos, weights, 1.0).xyz);
    vec3 snowN = unpackNormal(triplanarTexture(uSnowNormal, vWorldPos, weights, 1.35).xyz);
    vec3 lavaN = unpackNormal(triplanarTexture(uLavaNormal, vWorldPos, weights, 1.3).xyz);
    vec3 wetN = unpackNormal(triplanarTexture(uWetnessNormal, vWorldPos, weights, 1.2).xyz);

    float rockR = triplanarTexture(uRockRoughness, vWorldPos, weights, 0.75).r;
    float sedR = triplanarTexture(uSedimentRoughness, vWorldPos, weights, 0.75).r;
    float snowR = triplanarTexture(uSnowRoughness, vWorldPos, weights, 0.85).r;
    float lavaR = triplanarTexture(uLavaRoughness, vWorldPos, weights, 0.82).r;
    float wetR = triplanarTexture(uWetnessRoughness, vWorldPos, weights, 0.8).r;

    float rockAo = triplanarTexture(uRockAo, vWorldPos, weights, 0.65).r;
    float sedAo = triplanarTexture(uSedimentAo, vWorldPos, weights, 0.65).r;
    float snowAo = triplanarTexture(uSnowAo, vWorldPos, weights, 0.8).r;
    float lavaAo = triplanarTexture(uLavaAo, vWorldPos, weights, 0.85).r;
    float wetAo = triplanarTexture(uWetnessAo, vWorldPos, weights, 0.7).r;

    float rock = sat(vRockMask);
    float sediment = sat(vSedimentMask);
    float snow = sat(vSnowMask);
    float lava = sat(vLavaMask);
    float water = sat(vWaterMask);

    float wetness = sat((1.0 - water) * (0.4 * vHumidityMask + 0.6 * (1.0 - vSlopeMask)));

    float lush = familyMask(0.0);
    float oceanic = familyMask(1.0);
    float desert = familyMask(2.0);
    float ice = familyMask(3.0);
    float volcanic = familyMask(4.0);
    float barren = familyMask(5.0);
    float toxic = familyMask(6.0);

    sediment *= mix(1.0, 1.15, lush + oceanic * 0.7);
    rock *= mix(1.0, 1.2, barren + volcanic * 0.6 + desert * 0.35);
    snow *= mix(1.0, 1.25, ice + (1.0 - vTemperatureMask) * 0.25);
    lava *= mix(1.0, 1.35, volcanic);

    float total = max(0.0001, rock + sediment + snow + lava + wetness * 0.6);
    rock /= total;
    sediment /= total;
    snow /= total;
    lava /= total;
    float wetW = (wetness * 0.6) / total;

    vec3 terrainAlbedo =
      (rockAlb.rgb * vec3(0.80, 0.80, 0.82) + uColorMid * 0.15) * rock +
      (sedAlb.rgb * vec3(0.95, 0.90, 0.82) + uColorDeep * 0.15) * sediment +
      (snowAlb.rgb * vec3(0.95, 0.98, 1.0) + uColorHigh * 0.12) * snow +
      (lavaAlb.rgb * vec3(1.15, 0.90, 0.72) + uAccentColor * 0.25) * lava +
      (wetAlb.rgb * vec3(0.7, 0.85, 1.0)) * wetW;

    vec3 normalDetail = normalize(
      baseNormal +
      rockN * rock * 0.42 +
      sedN * sediment * 0.36 +
      snowN * snow * 0.2 +
      lavaN * lava * 0.32 +
      wetN * wetW * 0.46
    );

    float localRoughness = clamp(
      uRoughness * 0.5 +
      rockR * rock * 0.55 +
      sedR * sediment * 0.52 +
      snowR * snow * 0.44 +
      lavaR * lava * 0.34 +
      wetR * wetW * 0.25 +
      desert * 0.05 +
      barren * 0.04,
      0.06,
      0.96
    );

    float localAo = clamp(
      rockAo * rock + sedAo * sediment + snowAo * snow + lavaAo * lava + wetAo * wetW,
      0.5,
      1.0
    );

    float depth = sat(1.0 - vElevation * 0.65);
    vec3 shallowWater = uOceanColor * vec3(1.15, 1.10, 1.02);
    vec3 deepWater = uOceanColor * vec3(0.56, 0.72, 0.95);
    vec3 oceanCol = mix(shallowWater, deepWater, smoothstep(0.1, 0.95, depth));
    oceanCol = mix(oceanCol, oceanCol * vec3(0.94, 1.02, 0.92), toxic * 0.35);

    vec3 albedo = mix(terrainAlbedo, oceanCol, water);

    float ndl = max(dot(normalDetail, lightDir), 0.0);
    float diffuse = smoothstep(0.0, 1.0, ndl * 0.86 + 0.06);
    float fresnel = pow(1.0 - sat(dot(normalDetail, viewDir)), 3.2);
    float halfSpec = max(dot(normalDetail, normalize(lightDir + viewDir)), 0.0);
    float specPower = mix(12.0, 95.0, 1.0 - localRoughness);

    float waterBoost = water * 1.1 + wetW * 0.25;
    float spec = pow(halfSpec, specPower) * (uSpecularStrength * (0.18 + waterBoost + snow * 0.15));

    float slopeShadow = (1.0 - dot(normalDetail, normalize(vUnitPos))) * 0.18;
    float tonal = clamp(0.32 + diffuse * 0.95 - slopeShadow + spec + fresnel * (0.05 + water * 0.1), 0.15, 1.8);

    vec3 color = albedo * tonal * localAo;
    color += uAccentColor * (uEmissive * (vThermalMask * 0.4 + lava * 0.55));

    gl_FragColor = vec4(clamp(color * uLightingBoost, vec3(0.01), vec3(1.0)), 1.0);
  }
`;

export const SURFACE_VERTEX_SHADER_GALAXY = SURFACE_VERTEX_SHADER_PLANET;
export const SURFACE_FRAGMENT_SHADER_GALAXY = SURFACE_FRAGMENT_SHADER_PLANET;

export function getSurfacePlanetFragmentShader(): string {
  return SURFACE_FRAGMENT_SHADER_PLANET;
}
