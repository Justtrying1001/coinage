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

  float safeDiv(float num, float den) {
    return num / max(0.0001, den);
  }

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

    vec3 oceanShelf = uOceanColor * vec3(1.26, 1.20, 1.14);
    vec3 oceanMid = uOceanColor * vec3(0.94, 0.99, 1.04);
    vec3 oceanDeep = uOceanColor * vec3(0.56, 0.68, 0.84);
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

    float ridgeStrata = sin((vUnitPos.x * 1.3 + vUnitPos.z) * 10.0 + vMacroRelief * 4.0) * 0.5 + 0.5;
    float canyonNoise = sin(vUnitPos.y * 12.0 - vUnitPos.x * 7.0 + vMidRelief * 3.4) * 0.5 + 0.5;
    float detailMask = sat(ridgeStrata * 0.68 + canyonNoise * 0.32);
    float ridgeMask = smoothstep(0.56, 0.92, ridgeStrata * (0.58 + midHeight * 0.42));
    float canyonMask = smoothstep(0.52, 0.90, canyonNoise * (0.56 + (1.0 - macroHeight) * 0.34));
    float tectonicMask = smoothstep(
      0.42,
      0.88,
      abs(sin((vUnitPos.x * 2.7 - vUnitPos.z * 2.1) * 5.8 + vMacroRelief * 5.2)) * (0.62 + midHeight * 0.34)
    );
    float slopeMask = sat(1.0 - dot(state.normal, normalize(vUnitPos)));
    float plateauMask = smoothstep(0.56, 0.88, macroHeight) * (1.0 - slopeMask * 0.62);
    float basinShadow = smoothstep(0.42, 0.92, basinMask);

    float lushMask = familyMask(0.0);
    float oceanicMask = familyMask(1.0);
    float desertMask = familyMask(2.0);
    float iceMask = familyMask(3.0);
    float volcanicMask = familyMask(4.0);
    float barrenMask = familyMask(5.0);
    float toxicMask = familyMask(6.0);

    vec3 sedimentBase = mix(lowlands, uplands, state.highlandMask * 0.38 + state.lowlandMask * 0.32);
    vec3 darkRockBase = mix(uColorDeep * vec3(0.86, 0.86, 0.88), uColorMid * vec3(0.86, 0.84, 0.82), 0.52);
    vec3 brightRockBase = mix(uColorMid * vec3(1.04, 1.02, 0.98), uColorHigh * vec3(1.12, 1.08, 1.02), 0.66);
    vec3 frostBase = mix(uColorHigh * vec3(1.08, 1.12, 1.18), vec3(0.88, 0.93, 0.99), 0.44);
    vec3 basaltHotBase = mix(darkRockBase * vec3(0.82, 0.78, 0.74), uColorDeep * vec3(0.72, 0.66, 0.62), 0.36);
    vec3 lavaBase = mix(uAccentColor * vec3(1.18, 0.72, 0.44), uAccentColor * vec3(1.36, 0.44, 0.22), 0.56);

    float land = sat(vLandMask);
    float water = 1.0 - land;
    float deepWaterWeight = water * smoothstep(0.32, 0.96, oceanDepthField);
    float shallowWaterWeight = water * (1.0 - smoothstep(0.46, 0.98, oceanDepthField));
    float waterBlendNorm = max(0.001, deepWaterWeight + shallowWaterWeight);
    deepWaterWeight = safeDiv(deepWaterWeight, waterBlendNorm);
    shallowWaterWeight = safeDiv(shallowWaterWeight, waterBlendNorm);

    float sedimentWeight = land * smoothstep(0.12, 0.86, state.lowlandMask + state.coastMask * 0.72)
      * (1.0 - smoothstep(0.58, 0.95, state.rockyMask));
    float darkRockWeight = land * smoothstep(0.28, 0.92, state.rockyMask + slopeMask * 0.42 + macroHeight * 0.22 + tectonicMask * 0.16)
      * (1.0 - smoothstep(0.48, 0.92, crater * 0.6));
    float brightRockWeight = land * smoothstep(0.42, 0.94, state.highlandMask + macroHeight * 0.26 + erosion * 0.2 + ridgeMask * 0.14)
      * (1.0 - smoothstep(0.42, 0.9, basinMask));
    float frostWeight = land * smoothstep(0.24, 0.9, iceMask * (1.0 - state.temperature) + iceMask * state.highlandMask * 0.54 + canyonMask * 0.08);
    float basaltHotWeight = land * volcanicMask * smoothstep(0.26, 0.88, thermal + slopeMask * 0.32 + state.rockyMask * 0.24 + tectonicMask * 0.18);
    float lavaWeight = land * volcanicMask * smoothstep(0.44, 0.92, thermal)
      * smoothstep(0.2, 0.86, detailMask + slopeMask * 0.46 + tectonicMask * 0.22);
    float toxicFilmWeight = land * toxicMask * smoothstep(0.26, 0.86, state.humidity + basinMask * 0.22);

    sedimentWeight *= mix(1.0, 1.22, lushMask * state.humidity + desertMask * (1.0 - state.humidity));
    darkRockWeight *= mix(1.0, 1.26, barrenMask + volcanicMask * 0.58);
    brightRockWeight *= mix(1.0, 1.16, barrenMask * 0.42 + iceMask * 0.36);
    frostWeight *= mix(0.88, 1.28, iceMask + barrenMask * 0.18);
    basaltHotWeight *= mix(0.76, 1.38, volcanicMask);
    lavaWeight *= mix(0.72, 1.44, volcanicMask);
    toxicFilmWeight *= mix(0.64, 1.34, toxicMask);

    float landWeightSumRaw =
      sedimentWeight + darkRockWeight + brightRockWeight + frostWeight + basaltHotWeight + lavaWeight + toxicFilmWeight;
    float landWeightSum = max(0.001, landWeightSumRaw);
    sedimentWeight = safeDiv(sedimentWeight, landWeightSum);
    darkRockWeight = safeDiv(darkRockWeight, landWeightSum);
    brightRockWeight = safeDiv(brightRockWeight, landWeightSum);
    frostWeight = safeDiv(frostWeight, landWeightSum);
    basaltHotWeight = safeDiv(basaltHotWeight, landWeightSum);
    lavaWeight = safeDiv(lavaWeight, landWeightSum);
    toxicFilmWeight = safeDiv(toxicFilmWeight, landWeightSum);

    vec3 sedimentMat = sedimentBase * mix(vec3(0.88, 0.82, 0.74), vec3(1.02, 1.00, 0.96), state.humidity * 0.62);
    sedimentMat = mix(sedimentMat, sedimentMat * vec3(1.04, 1.03, 1.01), plateauMask * 0.24);
    vec3 darkRockMat = darkRockBase * mix(vec3(0.88, 0.86, 0.84), vec3(1.02, 1.0, 0.98), erosion * 0.22 + tectonicMask * 0.16);
    vec3 brightRockMat = brightRockBase * mix(vec3(0.98, 1.0, 1.02), vec3(1.08, 1.08, 1.06), erosion * 0.34 + detailMask * 0.2 + ridgeMask * 0.24);
    vec3 frostMat = frostBase * mix(vec3(0.96, 0.99, 1.03), vec3(1.08, 1.12, 1.18), sat(1.0 - state.temperature));
    vec3 basaltHotMat = basaltHotBase * mix(vec3(0.82, 0.78, 0.74), vec3(1.04, 0.94, 0.88), thermal * 0.34);
    vec3 lavaMat = lavaBase * mix(vec3(0.84, 0.74, 0.66), vec3(1.24, 0.96, 0.68), thermal * 0.42);
    vec3 toxicFilmMat = mix(uColorMid * vec3(0.86, 1.08, 0.82), uAccentColor * vec3(0.88, 1.14, 0.84), 0.56);
    toxicFilmMat = mix(toxicFilmMat, toxicFilmMat * vec3(0.92, 1.12, 0.90), canyonMask * 0.22 + basinShadow * 0.18);

    vec3 terrain =
      sedimentMat * sedimentWeight +
      darkRockMat * darkRockWeight +
      brightRockMat * brightRockWeight +
      frostMat * frostWeight +
      basaltHotMat * basaltHotWeight +
      lavaMat * lavaWeight +
      toxicFilmMat * toxicFilmWeight;

    vec3 legacyTerrain = mix(lowlands, uplands, state.highlandMask * 0.84 + macroHeight * 0.16);
    legacyTerrain = mix(legacyTerrain, rocky, state.rockyMask);
    legacyTerrain = mix(legacyTerrain, legacyTerrain * vec3(0.97, 0.98, 1.01), detailMask * 0.12);
    legacyTerrain = mix(legacyTerrain, legacyTerrain * vec3(1.04, 1.03, 0.99), plateauMask * 0.14);
    legacyTerrain = mix(legacyTerrain, legacyTerrain * vec3(0.84, 0.86, 0.90), basinShadow * 0.22);
    legacyTerrain = mix(legacyTerrain, legacyTerrain * vec3(0.86, 0.77, 0.65), desertMask * (1.0 - state.humidity) * 0.44);
    legacyTerrain = mix(legacyTerrain, legacyTerrain * vec3(0.82, 0.92, 1.06), iceMask * (0.42 + state.highlandMask * 0.34));
    legacyTerrain = mix(legacyTerrain, legacyTerrain * vec3(0.66, 0.61, 0.58), barrenMask * 0.42);
    legacyTerrain = mix(legacyTerrain, legacyTerrain * vec3(0.64, 0.60, 0.56), volcanicMask * 0.52);
    legacyTerrain = mix(legacyTerrain, legacyTerrain * vec3(0.90, 1.06, 0.88), lushMask * state.humidity * 0.28);
    legacyTerrain = mix(legacyTerrain, legacyTerrain * vec3(0.88, 1.14, 0.84), toxicMask * 0.28);

    float invalidMaterialState = 1.0 - step(0.02, landWeightSumRaw + waterBlendNorm * 0.2);
    terrain = mix(terrain, legacyTerrain, invalidMaterialState);

    float erosionHighlight = smoothstep(0.3, 0.86, erosion) * (0.22 + slopeMask * 0.24);
    float craterRim = crater * smoothstep(0.22, 0.82, detailMask + slopeMask * 0.4);
    terrain = mix(terrain, terrain * vec3(1.05, 1.03, 0.99), erosionHighlight + ridgeMask * 0.14);
    terrain = mix(terrain, terrain * vec3(0.76, 0.74, 0.73), craterRim * (barrenMask + volcanicMask + 0.2));
    terrain = mix(terrain, terrain * vec3(0.98, 1.02, 1.04), frostWeight * 0.22 + canyonMask * 0.1);

    vec3 shallowWaterMat = mix(oceanShelf, oceanMid, 0.42) * vec3(1.10, 1.06, 1.02);
    vec3 deepWaterMat = mix(oceanMid, oceanDeep, 0.72) * vec3(0.90, 0.96, 1.06);
    shallowWaterMat *= mix(vec3(0.97, 1.0, 1.04), vec3(1.03, 1.02, 0.98), oceanDetail * 0.18);
    deepWaterMat *= mix(vec3(0.94, 0.98, 1.06), vec3(1.02, 1.01, 0.98), oceanDetail * 0.12);
    shallowWaterMat = mix(shallowWaterMat, shallowWaterMat * vec3(0.76, 0.88, 1.12), oceanicMask * 0.5);
    deepWaterMat = mix(deepWaterMat, deepWaterMat * vec3(0.70, 0.86, 1.16), oceanicMask * 0.58);
    shallowWaterMat = mix(shallowWaterMat, shallowWaterMat * vec3(0.90, 1.05, 0.88), toxicMask * 0.24);
    deepWaterMat = mix(deepWaterMat, deepWaterMat * vec3(0.84, 1.02, 0.90), toxicMask * 0.3);

    oceanColor = shallowWaterMat * shallowWaterWeight + deepWaterMat * deepWaterWeight;
    vec3 coastSediment = mix(sedimentMat, shallowWaterMat * vec3(1.02, 1.01, 0.98), 0.46);
    vec3 coast = mix(oceanColor * vec3(1.05, 1.03, 1.0), coastSediment, smoothstep(0.0, 0.28, state.coastMask));
    coast = mix(coast, terrain, smoothstep(0.14, 0.62, state.coastMask));

    state.landBase = mix(terrain, coast, state.coastMask * 0.72);

    vec3 solidAlbedo = mix(oceanColor, state.landBase, vLandMask);
    solidAlbedo = mix(solidAlbedo, coast, state.coastMask * 0.82);
    solidAlbedo = max(solidAlbedo, vec3(0.025));

    float seededBand = sin(vUnitPos.y * (12.0 + uBandingStrength * 18.0) + uBandSeed * 0.0000012) * 0.5 + 0.5;
    float bandField = sat(vBandMask * 0.7 + seededBand * 0.3 + vMacroRelief * 0.08);
    vec3 gasBands = mix(uColorDeep * 1.05, uColorMid * 1.1, bandField);
    gasBands = mix(gasBands, uColorHigh * 1.12, sat(vThermalMask * 0.42 + vTemperatureMask * 0.28 + bandField * 0.18));
    vec3 gasStorms = mix(gasBands, uAccentColor * 1.06, sat(vThermalMask * 0.58 + vMidRelief * 0.08));
    vec3 gaseousAlbedo = mix(gasBands, gasStorms, sat(vBandMask * 0.52 + vThermalMask * 0.38));
    float lavaMask = volcanicMask * smoothstep(0.48, 0.9, thermal) * smoothstep(0.2, 0.8, slopeMask + detailMask * 0.4);
    solidAlbedo = mix(solidAlbedo, mix(solidAlbedo, uAccentColor * vec3(1.12, 0.62, 0.40), 0.68), lavaMask * 0.74);

    state.albedo = mix(solidAlbedo, gaseousAlbedo, sat(uSurfaceModel));
    state.reliefShade =
      state.heightNorm * RELIEF_HEIGHT_WEIGHT +
      midHeight * RELIEF_MID_WEIGHT +
      macroHeight * RELIEF_MACRO_WEIGHT +
      ridgeMask * 0.08 +
      tectonicMask * 0.06 -
      canyonMask * 0.04 +
      vSilhouetteMask * RELIEF_SILHOUETTE_WEIGHT -
      basinMask * RELIEF_OCEAN_WEIGHT;

    return state;
  }
`;
