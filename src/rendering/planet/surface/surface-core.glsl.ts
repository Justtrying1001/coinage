// Responsibility: build non-lighting base surface state (terrain layers + structural masks).
// Climate coloration should remain in surface-biome.
export const SURFACE_CORE_GLSL = `
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
  uniform float uLightingBoost;
  uniform float uShadingContrast;

  const float CONTINENT_BASE_WEIGHT = 0.76;
  const float CONTINENT_LAND_WEIGHT = 0.20;
  const float CONTINENT_MACRO_WEIGHT = 0.20;
  const float CONTINENT_EROSION_WEIGHT = 0.10;

  const float HEIGHT_BASE_WEIGHT = 0.58;
  const float HEIGHT_MACRO_WEIGHT = 0.28;
  const float HEIGHT_MID_WEIGHT = 0.14;

  const float LOWLAND_MIN = 0.02;
  const float LOWLAND_MAX = 0.44;
  const float HIGHLAND_MIN = 0.46;
  const float HIGHLAND_MAX = 0.88;

  const float RELIEF_HEIGHT_WEIGHT = 0.11;
  const float RELIEF_MID_WEIGHT = 0.10;
  const float RELIEF_MACRO_WEIGHT = 0.08;
  const float RELIEF_SILHOUETTE_WEIGHT = 0.08;
  const float RELIEF_OCEAN_WEIGHT = 0.03;

  float sat(float x) { return clamp(x, 0.0, 1.0); }

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
    state.continent = sat(
      vContinentMask * CONTINENT_BASE_WEIGHT +
      vLandMask * CONTINENT_LAND_WEIGHT +
      vMacroRelief * CONTINENT_MACRO_WEIGHT -
      vErosionMask * CONTINENT_EROSION_WEIGHT
    );
    state.humidity = sat(vHumidityMask * 0.86 + 0.14);
    state.temperature = sat(vTemperatureMask * 0.84 + 0.16);

    float macroHeight = sat(vMacroRelief * 0.5 + 0.5);
    float midHeight = sat(vMidRelief * 0.5 + 0.5);
    float microShape = sat(vMicroRelief * 0.5 + 0.5);
    state.heightNorm = sat(
      vHeight * HEIGHT_BASE_WEIGHT +
      macroHeight * HEIGHT_MACRO_WEIGHT +
      midHeight * HEIGHT_MID_WEIGHT
    );

    vec3 oceanShallow = uOceanColor * vec3(1.36, 1.3, 1.24);
    vec3 oceanDeep = uOceanColor * vec3(0.72, 0.80, 0.90);
    float oceanT = sat(vOceanDepth * 0.88 + (1.0 - state.continent) * 0.22 - vMacroRelief * 0.08);
    vec3 oceanColor = mix(oceanShallow, oceanDeep, oceanT);

    state.coastMask = smoothstep(0.16, 0.72, vCoastMask);
    state.lowlandMask = smoothstep(LOWLAND_MIN, LOWLAND_MAX, state.heightNorm);
    state.highlandMask = smoothstep(HIGHLAND_MIN, HIGHLAND_MAX, state.heightNorm + midHeight * 0.24 + macroHeight * 0.18);
    state.rockyMask = smoothstep(0.5, 0.9, state.highlandMask + vMountainMask * 0.52 + midHeight * 0.22);

    vec3 lowlands = mix(uColorDeep * 1.06, uColorMid * 1.08, state.lowlandMask);
    vec3 uplands = mix(uColorMid * 1.02, uColorHigh * 1.14, state.highlandMask);
    vec3 rocky = mix(uColorHigh * 1.08, vec3(dot(uColorHigh, vec3(0.333))) + vec3(0.09), state.rockyMask * 0.42);

    vec3 terrain = mix(lowlands, uplands, state.highlandMask * 0.82 + macroHeight * 0.18);
    terrain = mix(terrain, rocky, state.rockyMask);
    terrain = mix(terrain, terrain * vec3(0.98, 1.0, 0.99), microShape * 0.12);

    vec3 coast = mix(oceanColor * 1.08, terrain, smoothstep(0.0, 0.2, state.coastMask));

    state.landBase = mix(terrain, coast, state.coastMask * 0.62);

    vec3 solidAlbedo = mix(oceanColor, state.landBase, vLandMask);
    solidAlbedo = mix(solidAlbedo, coast, state.coastMask);

    vec3 gasBands = mix(uColorDeep * 1.05, uColorMid * 1.1, sat(vBandMask * 0.92 + vMacroRelief * 0.1));
    gasBands = mix(gasBands, uColorHigh * 1.12, sat(vThermalMask * 0.42 + vTemperatureMask * 0.28));
    vec3 gasStorms = mix(gasBands, uAccentColor * 1.06, sat(vThermalMask * 0.62 + vMidRelief * 0.12));
    vec3 gaseousAlbedo = mix(gasBands, gasStorms, sat(vBandMask * 0.52 + vThermalMask * 0.38));

    state.albedo = mix(solidAlbedo, gaseousAlbedo, sat(uSurfaceModel));
    state.reliefShade =
      state.heightNorm * RELIEF_HEIGHT_WEIGHT +
      midHeight * RELIEF_MID_WEIGHT +
      macroHeight * RELIEF_MACRO_WEIGHT +
      vSilhouetteMask * RELIEF_SILHOUETTE_WEIGHT -
      vOceanDepth * RELIEF_OCEAN_WEIGHT;

    return state;
  }
`;
