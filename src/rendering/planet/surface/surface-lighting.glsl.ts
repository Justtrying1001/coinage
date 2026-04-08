// Responsibility: apply final stylized lighting (directional diffuse + slope contrast + subtle rim/spec).
export const SURFACE_LIGHTING_GLSL = `
  const vec3 LIGHT_DIRECTION = vec3(0.42, 0.82, 0.34);

  const float DIFFUSE_WRAP_BASE = 0.12;
  const float DIFFUSE_WRAP_SCALE = 0.88;

  const float SLOPE_BASE_STRENGTH = 0.16;
  const float SLOPE_SILHOUETTE_STRENGTH = 0.14;

  const float RIM_BASE_STRENGTH = 0.035;
  const float RIM_SILHOUETTE_STRENGTH = 0.045;

  const float SPEC_BASE_STRENGTH = 0.045;
  const float SPEC_HEIGHT_STRENGTH = 0.03;
  const float SPEC_SLOPE_STRENGTH = 0.045;

  const float RELIEF_BASE_STRENGTH = 0.14;
  const float RELIEF_SILHOUETTE_STRENGTH = 0.10;

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

    float ndl = max(dot(normal, lightDir), 0.0);
    float wrappedDiffuse = smoothstep(0.0, 1.0, ndl * DIFFUSE_WRAP_SCALE + DIFFUSE_WRAP_BASE);

    float slope = 1.0 - clamp(dot(normal, normalize(unitPos)), 0.0, 1.0);
    float slopeContrast = slope * (SLOPE_BASE_STRENGTH + silhouetteMask * SLOPE_SILHOUETTE_STRENGTH);

    float hemisphere = (normal.y * 0.5 + 0.5) * shadingContrast;
    float terrainOcclusion = (1.0 - heightNorm) * 0.08 + (1.0 - wrappedDiffuse) * 0.05;
    float shadowLift = 0.72 + wrappedDiffuse * 0.42 - terrainOcclusion;

    float rim = pow(1.0 - clamp(dot(normal, viewDir), 0.0, 1.0), 2.8) * (RIM_BASE_STRENGTH + silhouetteMask * RIM_SILHOUETTE_STRENGTH);
    float halfSpec = max(dot(normal, normalize(lightDir + viewDir)), 0.0);
    float gloss = clamp(1.0 - roughness, 0.05, 0.98);
    float specPower = mix(8.0, 64.0, gloss);
    float specBase = SPEC_BASE_STRENGTH + heightNorm * SPEC_HEIGHT_STRENGTH + slope * SPEC_SLOPE_STRENGTH;
    float bandSpecLift = mix(0.0, 0.08, bandMask * bandingStrength);
    float specular = pow(halfSpec, specPower) * (specBase + bandSpecLift) * clamp(specularStrength * 1.55, 0.0, 1.8);

    float reliefLighting = reliefShade * (RELIEF_BASE_STRENGTH + silhouetteMask * RELIEF_SILHOUETTE_STRENGTH);
    float tonal = clamp(shadowLift + hemisphere + slopeContrast + reliefLighting + rim + specular, 0.66, 1.5);

    float luma = dot(albedo, vec3(0.2126, 0.7152, 0.0722));
    vec3 saturated = mix(vec3(luma), albedo, 1.13);
    vec3 color = saturated * tonal;
    color += accentColor * (emissive * (thermalMask * 0.62 + bandMask * 0.18));

    return clamp(color * lightingBoost, vec3(0.24), vec3(1.0));
  }
`;
