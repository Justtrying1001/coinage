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
  varying float vErosionMask;
  varying float vCraterMask;
  varying float vBandMask;
  varying float vMacroRelief;
  varying float vMidRelief;
  varying float vMicroRelief;
  varying float vSilhouetteMask;
  varying float vFractureMask;

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
    float erosion = sat(vErosionMask);
    float crater = sat(vCraterMask);
    float thermal = sat(vThermalMask);
    float basinMask = sat(vOceanDepth * 0.72 + (1.0 - macroHeight) * 0.42);

    state.heightNorm = sat(
      vHeight * HEIGHT_BASE_WEIGHT +
      macroHeight * HEIGHT_MACRO_WEIGHT +
      midHeight * HEIGHT_MID_WEIGHT
    );

    float coastalBand = sat(1.0 - abs(vLandMask - 0.5) * 2.0);
    state.coastMask = smoothstep(0.24, 0.80, coastalBand + basinMask * 0.16 - macroHeight * 0.14);

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

    float ridgeStrata = sin((vUnitPos.x * 1.3 + vUnitPos.z) * 10.0 + vMacroRelief * 4.0) * 0.5 + 0.5;
    float canyonNoise = sin(vUnitPos.y * 12.0 - vUnitPos.x * 7.0 + vMidRelief * 3.4) * 0.5 + 0.5;
    float detailMask = sat(ridgeStrata * 0.68 + canyonNoise * 0.32);
    float slopeMask = sat(1.0 - dot(state.normal, normalize(vUnitPos)));
    float plateauMask = smoothstep(0.56, 0.88, macroHeight) * (1.0 - slopeMask * 0.62);
    float basinShadow = smoothstep(0.42, 0.92, basinMask);
    float fractureMask = sat(vFractureMask);

    float lushMask = familyMask(0.0);
    float oceanicMask = familyMask(1.0);
    float desertMask = familyMask(2.0);
    float iceMask = familyMask(3.0);
    float volcanicMask = familyMask(4.0);
    float barrenMask = familyMask(5.0);
    float toxicMask = familyMask(6.0);

    float erosionHighlight = smoothstep(0.3, 0.86, erosion) * (0.28 + slopeMask * 0.32);
    float craterRim = crater * smoothstep(0.22, 0.82, detailMask + slopeMask * 0.4);

    vec3 matSediment = mix(uColorDeep * 1.02, uColorMid * 1.12, state.lowlandMask) * vec3(1.03, 1.00, 0.95);
    vec3 matRockDark = mix(uColorMid * 0.82, uColorHigh * 0.78, state.rockyMask) * vec3(0.88, 0.87, 0.90);
    vec3 matRockBright = mix(uColorMid * 1.08, uColorHigh * 1.2, state.highlandMask) * vec3(1.03, 1.02, 0.99);
    vec3 matFrost = mix(uColorMid * 1.02, uColorHigh * 1.18, smoothstep(0.45, 0.92, state.highlandMask + (1.0 - state.temperature) * 0.5));
    vec3 matBasalt = mix(uColorDeep * 0.72, uColorMid * 0.78, smoothstep(0.2, 0.9, state.rockyMask + thermal * 0.34));
    vec3 matLava = mix(uAccentColor * vec3(1.18, 0.64, 0.34), uAccentColor * vec3(1.0, 0.48, 0.26), thermal);

    float wSediment = sat((0.68 + fertileMask * 0.34) * (1.0 - state.highlandMask * 0.84));
    float wRockDark = sat((slopeMask * 0.64 + state.rockyMask * 0.46 + fractureMask * 0.58) * (0.38 + barrenMask * 0.72 + volcanicMask * 0.42));
    float wRockBright = sat(state.highlandMask * 0.62 + plateauMask * 0.42 + erosionHighlight * 0.5);
    float wFrost = sat((1.0 - state.temperature) * (0.42 + iceMask * 0.62) * (0.36 + state.highlandMask * 0.44));
    float wBasalt = sat((volcanicMask * 0.88 + barrenMask * 0.32) * (state.rockyMask * 0.48 + fractureMask * 0.44 + thermal * 0.34));
    float wLava = sat(volcanicMask * smoothstep(0.2, 0.92, thermal * 0.84 + fractureMask * 0.32));

    float wSum = wSediment + wRockDark + wRockBright + wFrost + wBasalt + wLava + 1e-5;
    vec3 terrain =
      (matSediment * wSediment +
      matRockDark * wRockDark +
      matRockBright * wRockBright +
      matFrost * wFrost +
      matBasalt * wBasalt +
      matLava * wLava) / wSum;

    terrain = mix(terrain, terrain * vec3(0.97, 0.98, 1.01), detailMask * 0.12);
    terrain = mix(terrain, terrain * vec3(1.04, 1.03, 0.99), plateauMask * 0.14);
    terrain = mix(terrain, terrain * vec3(0.84, 0.86, 0.90), basinShadow * 0.22);
    terrain = mix(terrain, terrain * vec3(0.86, 0.77, 0.65), desertMask * (1.0 - state.humidity) * 0.44);
    terrain = mix(terrain, terrain * vec3(0.90, 1.06, 0.88), lushMask * state.humidity * 0.28);
    terrain = mix(terrain, terrain * vec3(0.88, 1.14, 0.84), toxicMask * 0.28);
    terrain = mix(terrain, terrain * vec3(0.74, 0.72, 0.71), craterRim * (barrenMask + volcanicMask + 0.25));

    vec3 coast = mix(oceanColor * vec3(1.1, 1.06, 1.02), terrain, smoothstep(0.0, 0.26, state.coastMask));

    state.landBase = mix(terrain, coast, state.coastMask * 0.74);

    oceanColor = mix(oceanColor, oceanColor * vec3(0.68, 0.82, 1.12), oceanicMask * 0.52);
    oceanColor = mix(oceanColor, oceanColor * vec3(0.88, 1.02, 0.90), toxicMask * 0.24);

    vec3 solidAlbedo = mix(oceanColor, state.landBase, vLandMask);
    solidAlbedo = mix(solidAlbedo, coast, state.coastMask * 0.75);

    float seededBand = sin(vUnitPos.y * (12.0 + uBandingStrength * 18.0) + uBandSeed * 0.0000012) * 0.5 + 0.5;
    float bandField = sat(vBandMask * 0.7 + seededBand * 0.3 + vMacroRelief * 0.08);
    vec3 gasBands = mix(uColorDeep * 1.05, uColorMid * 1.1, bandField);
    gasBands = mix(gasBands, uColorHigh * 1.12, sat(vThermalMask * 0.42 + vTemperatureMask * 0.28 + bandField * 0.18));
    vec3 gasStorms = mix(gasBands, uAccentColor * 1.06, sat(vThermalMask * 0.58 + vMidRelief * 0.08));
    vec3 gaseousAlbedo = mix(gasBands, gasStorms, sat(vBandMask * 0.52 + vThermalMask * 0.38));
    float lavaMask = volcanicMask * smoothstep(0.48, 0.9, thermal) * smoothstep(0.2, 0.8, slopeMask + detailMask * 0.4);
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
