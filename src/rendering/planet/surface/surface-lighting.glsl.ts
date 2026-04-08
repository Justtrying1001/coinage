// Responsibility: apply final stylized lighting (directional diffuse + slope contrast + subtle rim/spec).
export const SURFACE_LIGHTING_GLSL = `
  const vec3 LIGHT_DIRECTION = vec3(0.42, 0.82, 0.34);

  const float DIFFUSE_WRAP_BASE = 0.08;
  const float DIFFUSE_WRAP_SCALE = 0.84;

  const float SLOPE_BASE_STRENGTH = 0.18;
  const float SLOPE_SILHOUETTE_STRENGTH = 0.16;

  const float RIM_BASE_STRENGTH = 0.035;
  const float RIM_SILHOUETTE_STRENGTH = 0.045;

  const float SPEC_BASE_STRENGTH = 0.045;
  const float SPEC_HEIGHT_STRENGTH = 0.03;
  const float SPEC_SLOPE_STRENGTH = 0.045;

  const float RELIEF_BASE_STRENGTH = 0.16;
  const float RELIEF_SILHOUETTE_STRENGTH = 0.12;

  vec3 applySurfaceLighting(
    vec3 albedo,
    vec3 normal,
    vec3 unitPos,
    float heightNorm,
    float reliefShade,
    float silhouetteMask,
    float thermalMask,
    float bandMask,
    vec3 accentColor,
    float emissive,
    float roughness,
    float specularStrength,
    float bandingStrength,
    float shadingContrast,
    float lightingBoost
  ) {
    vec3 lightDir = normalize(LIGHT_DIRECTION);
    vec3 viewDir = normalize(cameraPosition - vWorldPos);

    float ndlRaw = dot(normal, lightDir);
    float ndl = max(ndlRaw, 0.0);
    float wrappedDiffuse = smoothstep(0.0, 1.0, ndl * DIFFUSE_WRAP_SCALE + DIFFUSE_WRAP_BASE);

    float slope = 1.0 - clamp(dot(normal, normalize(unitPos)), 0.0, 1.0);
    float humidity = sat(vHumidityMask * 0.84 + 0.16);
    float temperature = sat(vTemperatureMask * 0.82 + 0.18);
    float macroHeight = sat(vMacroRelief * 0.5 + 0.5);
    float midHeight = sat(vMidRelief * 0.5 + 0.5);
    float thermal = sat(vThermalMask);
    float coastMask = smoothstep(0.24, 0.80, sat(1.0 - abs(vLandMask - 0.5) * 2.0) + vOceanDepth * 0.14 - macroHeight * 0.12);
    float basinMask = sat(vOceanDepth * 0.72 + (1.0 - macroHeight) * 0.42);
    float rockyMask = smoothstep(0.48, 0.9, smoothstep(0.44, 0.9, macroHeight + midHeight * 0.36) + midHeight * 0.3 + (1.0 - humidity) * 0.1);
    float shallowWater = (1.0 - vLandMask) * (1.0 - smoothstep(0.46, 0.98, sat(vOceanDepth * 0.82 + basinMask * 0.3 - macroHeight * 0.1)));
    float deepWater = (1.0 - vLandMask) * smoothstep(0.32, 0.96, sat(vOceanDepth * 0.82 + basinMask * 0.3 - macroHeight * 0.1));
    float lushMask = familyMask(0.0);
    float oceanicMask = familyMask(1.0);
    float desertMask = familyMask(2.0);
    float volcanicMask = familyMask(4.0);
    float barrenMask = familyMask(5.0);
    float iceMask = familyMask(3.0);
    float toxicMask = familyMask(6.0);
    float lavaWeight = vLandMask * volcanicMask * smoothstep(0.44, 0.92, thermal) * smoothstep(0.18, 0.86, slope + midHeight * 0.24);
    float basaltWeight = vLandMask * volcanicMask * smoothstep(0.24, 0.86, thermal + rockyMask * 0.28);
    float frostWeight = vLandMask * smoothstep(0.24, 0.9, iceMask * (1.0 - temperature) + iceMask * macroHeight * 0.4);
    float sedimentWeight = vLandMask * smoothstep(0.14, 0.84, (1.0 - rockyMask) + coastMask * 0.42);
    float rockWeight = vLandMask * smoothstep(0.22, 0.9, rockyMask + slope * 0.36 + barrenMask * 0.18);
    float localRoughness = clamp(
      roughness * 0.52 +
      sedimentWeight * 0.22 +
      rockWeight * 0.30 +
      basaltWeight * 0.26 +
      frostWeight * 0.14 +
      lavaWeight * 0.10 +
      shallowWater * 0.08 +
      deepWater * 0.06,
      0.10,
      0.94
    );
    localRoughness = clamp(localRoughness + desertMask * 0.06 + barrenMask * 0.05 - (oceanicMask * 0.05 + shallowWater * 0.04), 0.10, 0.95);
    float localSpecular = clamp(
      specularStrength * (
        0.38 +
        shallowWater * 0.92 +
        deepWater * 0.72 +
        frostWeight * 0.28 +
        lavaWeight * 0.16 +
        sedimentWeight * 0.08
      ),
      0.02,
      0.98
    );
    localSpecular = clamp(localSpecular + oceanicMask * 0.08 + iceMask * 0.04 + toxicMask * 0.03 - (desertMask * 0.03 + barrenMask * 0.04), 0.02, 1.0);
    float slopeContrast = slope * (SLOPE_BASE_STRENGTH + silhouetteMask * SLOPE_SILHOUETTE_STRENGTH);
    float erosionContrast = smoothstep(0.24, 0.86, vErosionMask) * (0.06 + slope * 0.12);
    float craterOcclusion = smoothstep(0.3, 0.9, vCraterMask) * 0.08;

    float hemisphere = (normal.y * 0.5 + 0.5) * shadingContrast;
    float terrainOcclusion = (1.0 - heightNorm) * 0.10 + (1.0 - wrappedDiffuse) * 0.08;
    float shadowLift = 0.53 + wrappedDiffuse * 0.52 - terrainOcclusion - craterOcclusion;
    float terminator = smoothstep(-0.18, 0.28, ndlRaw);

    float rim = pow(1.0 - clamp(dot(normal, viewDir), 0.0, 1.0), 2.8) * (RIM_BASE_STRENGTH + silhouetteMask * RIM_SILHOUETTE_STRENGTH);
    float halfSpec = max(dot(normal, normalize(lightDir + viewDir)), 0.0);
    float gloss = clamp(1.0 - localRoughness, 0.05, 0.98);
    float specPower = mix(8.0, 64.0, gloss);
    float specBase = SPEC_BASE_STRENGTH + heightNorm * SPEC_HEIGHT_STRENGTH + slope * SPEC_SLOPE_STRENGTH;
    float bandSpecLift = mix(0.0, 0.08, bandMask * bandingStrength);
    float waterFresnelLift = pow(1.0 - clamp(dot(normal, viewDir), 0.0, 1.0), 3.6) * (shallowWater * 0.16 + deepWater * 0.10);
    float specular = pow(halfSpec, specPower) * (specBase + bandSpecLift + waterFresnelLift) * clamp(localSpecular * 1.48, 0.0, 1.6);

    float localContrastLift = lushMask * 0.03 + oceanicMask * 0.04 + volcanicMask * 0.08 + barrenMask * 0.05 + iceMask * 0.04;
    float reliefLighting = reliefShade * (RELIEF_BASE_STRENGTH + silhouetteMask * RELIEF_SILHOUETTE_STRENGTH + localContrastLift);
    float tonal = clamp((shadowLift + hemisphere + slopeContrast + erosionContrast + reliefLighting + rim + specular) * mix(0.80, 1.21, terminator), 0.38, 1.62);

    float luma = dot(albedo, vec3(0.2126, 0.7152, 0.0722));
    vec3 saturated = mix(vec3(luma), albedo, 1.12);
    vec3 color = saturated * tonal;
    color = mix(color, pow(max(color, vec3(0.0)), vec3(0.95)), 0.22);
    color += accentColor * (emissive * (thermalMask * 0.62 + bandMask * 0.18));

    return clamp(color * lightingBoost, vec3(0.20), vec3(1.0));
  }
`;
