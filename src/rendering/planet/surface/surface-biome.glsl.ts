// Responsibility: apply climate-driven color modulation (humidity/temperature).
// Core should provide terrain classes, biome should tint them.
export const SURFACE_BIOME_GLSL = `
  const float BIOME_HOT_MIN = 0.62;
  const float BIOME_HOT_MAX = 0.90;
  const float BIOME_COLD_MIN = 0.08;
  const float BIOME_COLD_MAX = 0.34;
  const float BIOME_DRY_MIN = 0.52;
  const float BIOME_DRY_MAX = 0.90;
  const float BIOME_HUMID_MIN = 0.52;
  const float BIOME_HUMID_MAX = 0.92;

  const float HUMID_LOWLAND_STRENGTH = 0.70;
  const float HOT_DRY_STRENGTH = 0.40;
  const float COLD_BASE_STRENGTH = 0.45;
  const float ROCKY_COLD_STRENGTH = 0.50;

  vec3 applyBiomeTint(
    vec3 landBase,
    float humidity,
    float temperature,
    float rockyMask,
    float lowlandMask,
    float highlandMask
  ) {
    float biomeHot = smoothstep(BIOME_HOT_MIN, BIOME_HOT_MAX, temperature);
    float biomeCold = smoothstep(BIOME_COLD_MIN, BIOME_COLD_MAX, 1.0 - temperature);
    float biomeDry = smoothstep(BIOME_DRY_MIN, BIOME_DRY_MAX, 1.0 - humidity);
    float biomeHumid = smoothstep(BIOME_HUMID_MIN, BIOME_HUMID_MAX, humidity);

    vec3 humidTint = vec3(0.95, 1.04, 0.94);
    vec3 dryWarmTint = vec3(1.06, 0.98, 0.9);
    vec3 coldTint = vec3(0.92, 0.98, 1.07);
    vec3 rockyColdTint = vec3(0.92, 0.95, 1.02);

    vec3 biomeTint = vec3(1.0);
    biomeTint = mix(biomeTint, humidTint, biomeHumid * lowlandMask * HUMID_LOWLAND_STRENGTH);
    biomeTint = mix(biomeTint, dryWarmTint, biomeHot * biomeDry * (HOT_DRY_STRENGTH + highlandMask * 0.2));
    biomeTint = mix(biomeTint, coldTint, biomeCold * (COLD_BASE_STRENGTH + highlandMask * 0.35));
    biomeTint = mix(biomeTint, rockyColdTint, rockyMask * biomeCold * ROCKY_COLD_STRENGTH);

    return landBase * biomeTint;
  }
`;
