// Responsibility: build non-lighting base surface state (terrain layers + structural masks).
// Climate coloration should remain in surface-biome.
export const SURFACE_CORE_GLSL = `
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vUnitPos;
  varying float vHeight;
  varying float vLandMask;
  varying float vOceanDepth;
  varying float vHumidityMask;
  varying float vTemperatureMask;
  varying float vThermalMask;
  varying float vBandMask;
  varying float vMacroRelief;
  varying float vMidRelief;
  varying float vMicroRelief;
  varying float vSilhouetteMask;

  uniform vec3 uColorDeep;
  uniform vec3 uColorMid;
  uniform vec3 uColorHigh;
  uniform vec3 uOceanColor;
  uniform vec3 uAccentColor;
  uniform float uEmissive;
  uniform float uSurfaceModel;
  uniform float uRoughness;
  uniform float uSpecularStrength;
  uniform float uBandingStrength;
  uniform float uBandSeed;
  uniform float uFamilyType;
  uniform float uLightingBoost;
  uniform float uShadingContrast;

  const float CONTINENT_BASE_WEIGHT = 0.80;
  const float CONTINENT_MACRO_WEIGHT = 0.20;

  const float HEIGHT_BASE_WEIGHT = 0.56;
  const float HEIGHT_MACRO_WEIGHT = 0.30;
  const float HEIGHT_MID_WEIGHT = 0.14;

  const float LOWLAND_MIN = 0.02;
  const float LOWLAND_MAX = 0.42;
  const float HIGHLAND_MIN = 0.44;
  const float HIGHLAND_MAX = 0.9;

  const float RELIEF_HEIGHT_WEIGHT = 0.12;
  const float RELIEF_MID_WEIGHT = 0.11;
  const float RELIEF_MACRO_WEIGHT = 0.1;
  const float RELIEF_SILHOUETTE_WEIGHT = 0.1;
  const float RELIEF_OCEAN_WEIGHT = 0.04;

  float sat(float x) { return clamp(x, 0.0, 1.0); }
  float familyMask(float idx) { return 1.0 - step(0.5, abs(uFamilyType - idx)); }

  struct SurfaceState {
    vec3 normal;
    vec3 albedo;
    vec3 landBase;
    float continent;
    float humidity;
    float temperature;
    float heightNorm;
    float coastMask;
    float reliefShade;
    float lowlandMask;
    float highlandMask;
    float rockyMask;
  };

  SurfaceState buildSurfaceState() {
    SurfaceState state;
    state.normal = normalize(vWorldNormal);
    state.continent = sat(vLandMask * CONTINENT_BASE_WEIGHT + vMacroRelief * CONTINENT_MACRO_WEIGHT);
    state.humidity = sat(vHumidityMask * 0.84 + 0.16);
    state.temperature = sat(vTemperatureMask * 0.82 + 0.18);

    float macroHeight = sat(vMacroRelief * 0.5 + 0.5);
    float midHeight = sat(vMidRelief * 0.5 + 0.5);
    float microShape = sat(vMicroRelief * 0.5 + 0.5);
    float basinMask = sat(vOceanDepth * 0.72 + (1.0 - macroHeight) * 0.42);

    state.heightNorm = sat(
      vHeight * HEIGHT_BASE_WEIGHT +
      macroHeight * HEIGHT_MACRO_WEIGHT +
      midHeight * HEIGHT_MID_WEIGHT
    );

    float coastalBand = sat(1.0 - abs(vLandMask - 0.5) * 2.0);
    state.coastMask = smoothstep(0.2, 0.82, coastalBand + basinMask * 0.18 - macroHeight * 0.1);

    vec3 oceanShelf = uOceanColor * vec3(1.3, 1.24, 1.16);
    vec3 oceanMid = uOceanColor * vec3(0.96, 1.0, 1.05);
    vec3 oceanDeep = uOceanColor * vec3(0.62, 0.72, 0.86);
    float oceanDepthField = sat(vOceanDepth * 0.82 + basinMask * 0.3 - macroHeight * 0.1);
    float currentLines = sin(vUnitPos.x * 13.0 + vUnitPos.z * 11.0 + vMacroRelief * 7.0) * 0.5 + 0.5;
    float gyreNoise = sin(vUnitPos.y * 21.0 - vUnitPos.x * 9.0 + vMicroRelief * 6.0) * 0.5 + 0.5;
    float oceanDetail = sat(currentLines * 0.55 + gyreNoise * 0.45);
    vec3 oceanColor = mix(oceanShelf, oceanMid, smoothstep(0.15, 0.62, oceanDepthField));
    oceanColor = mix(oceanColor, oceanDeep, smoothstep(0.5, 0.95, oceanDepthField));
    oceanColor *= mix(vec3(0.97, 0.99, 1.03), vec3(1.03, 1.02, 0.98), oceanDetail * 0.14);

    state.lowlandMask = smoothstep(LOWLAND_MIN, LOWLAND_MAX, state.heightNorm);
    state.highlandMask = smoothstep(HIGHLAND_MIN, HIGHLAND_MAX, state.heightNorm + midHeight * 0.25 + macroHeight * 0.2);
    state.rockyMask = smoothstep(0.48, 0.9, state.highlandMask + midHeight * 0.3 + (1.0 - state.humidity) * 0.1);

    float aridMask = smoothstep(0.55, 0.9, 1.0 - state.humidity) * smoothstep(0.42, 0.88, state.temperature);
    float fertileMask = smoothstep(0.58, 0.94, state.humidity) * smoothstep(0.16, 0.78, state.temperature);

    vec3 lowlands = mix(uColorDeep * 1.08, uColorMid * 1.12, state.lowlandMask);
    lowlands = mix(lowlands, lowlands * vec3(1.04, 1.02, 0.94), aridMask * 0.26);
    lowlands = mix(lowlands, lowlands * vec3(0.96, 1.05, 0.95), fertileMask * 0.22);

    vec3 uplands = mix(uColorMid * 1.02, uColorHigh * 1.16, state.highlandMask);
    vec3 rocky = mix(uColorHigh * 1.1, vec3(dot(uColorHigh, vec3(0.333))) + vec3(0.08), state.rockyMask * 0.5);

    float detailStrata = sin((vUnitPos.x + vUnitPos.z) * 11.0 + vMidRelief * 2.2) * 0.5 + 0.5;
    float detailPits = sin(vUnitPos.y * 15.0 - vUnitPos.x * 8.0 + vMicroRelief * 3.0) * 0.5 + 0.5;
    float detailMask = sat(detailStrata * 0.72 + detailPits * 0.28);

    vec3 terrain = mix(lowlands, uplands, state.highlandMask * 0.84 + macroHeight * 0.16);
    terrain = mix(terrain, rocky, state.rockyMask);
    terrain = mix(terrain, terrain * vec3(0.98, 0.99, 1.01), detailMask * 0.06);

    float lushMask = familyMask(0.0);
    float oceanicMask = familyMask(1.0);
    float desertMask = familyMask(2.0);
    float iceMask = familyMask(3.0);
    float volcanicMask = familyMask(4.0);
    float barrenMask = familyMask(5.0);
    float toxicMask = familyMask(6.0);

    terrain = mix(terrain, terrain * vec3(0.88, 0.80, 0.70), desertMask * (1.0 - state.humidity) * 0.36);
    terrain = mix(terrain, terrain * vec3(0.84, 0.92, 1.05), iceMask * (0.38 + state.highlandMask * 0.34));
    terrain = mix(terrain, terrain * vec3(0.70, 0.64, 0.60), barrenMask * 0.34);
    terrain = mix(terrain, terrain * vec3(0.74, 0.72, 0.68), volcanicMask * 0.28);
    terrain = mix(terrain, terrain * vec3(0.92, 1.04, 0.90), lushMask * state.humidity * 0.26);
    terrain = mix(terrain, terrain * vec3(0.94, 1.10, 0.86), toxicMask * 0.22);

    vec3 coast = mix(oceanColor * vec3(1.1, 1.06, 1.02), terrain, smoothstep(0.0, 0.26, state.coastMask));

    state.landBase = mix(terrain, coast, state.coastMask * 0.74);

    oceanColor = mix(oceanColor, oceanColor * vec3(0.74, 0.84, 1.08), oceanicMask * 0.42);
    oceanColor = mix(oceanColor, oceanColor * vec3(0.88, 1.02, 0.90), toxicMask * 0.24);

    vec3 solidAlbedo = mix(oceanColor, state.landBase, vLandMask);
    solidAlbedo = mix(solidAlbedo, coast, state.coastMask * 0.75);

    float seededBand = sin(vUnitPos.y * (12.0 + uBandingStrength * 18.0) + uBandSeed * 0.0000012) * 0.5 + 0.5;
    float bandField = sat(vBandMask * 0.7 + seededBand * 0.3 + vMacroRelief * 0.08);
    vec3 gasBands = mix(uColorDeep * 1.05, uColorMid * 1.1, bandField);
    gasBands = mix(gasBands, uColorHigh * 1.12, sat(vThermalMask * 0.42 + vTemperatureMask * 0.28 + bandField * 0.18));
    vec3 gasStorms = mix(gasBands, uAccentColor * 1.06, sat(vThermalMask * 0.58 + vMidRelief * 0.08));
    vec3 gaseousAlbedo = mix(gasBands, gasStorms, sat(vBandMask * 0.52 + vThermalMask * 0.38));
    float lavaMask = volcanicMask * smoothstep(0.52, 0.9, vThermalMask);
    solidAlbedo = mix(solidAlbedo, mix(solidAlbedo, uAccentColor * vec3(1.15, 0.64, 0.42), 0.72), lavaMask);

    state.albedo = mix(solidAlbedo, gaseousAlbedo, sat(uSurfaceModel));
    state.reliefShade =
      state.heightNorm * RELIEF_HEIGHT_WEIGHT +
      midHeight * RELIEF_MID_WEIGHT +
      macroHeight * RELIEF_MACRO_WEIGHT +
      vSilhouetteMask * RELIEF_SILHOUETTE_WEIGHT -
      basinMask * RELIEF_OCEAN_WEIGHT;

    return state;
  }
`;
