const ENGINE_RADIUS_MIN = 2.16;
const ENGINE_RADIUS_MAX = 5.6;

export const GALAXY_VISUAL_RADIUS_MIN = 2.9;
export const GALAXY_VISUAL_RADIUS_MAX = 5.6;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function computeGalaxyVisualRadius(input: { manifestRadius: number; renderRadius?: number }): number {
  const manifestRadius = clamp(input.manifestRadius, ENGINE_RADIUS_MIN, ENGINE_RADIUS_MAX);
  const renderRadius = clamp(input.renderRadius ?? manifestRadius, ENGINE_RADIUS_MIN, ENGINE_RADIUS_MAX);
  const canonicalRadius = (manifestRadius + renderRadius) * 0.5;

  const normalized = clamp(
    (canonicalRadius - ENGINE_RADIUS_MIN) / (ENGINE_RADIUS_MAX - ENGINE_RADIUS_MIN),
    0,
    1,
  );
  const eased = normalized ** 0.88;

  return clamp(
    GALAXY_VISUAL_RADIUS_MIN + eased * (GALAXY_VISUAL_RADIUS_MAX - GALAXY_VISUAL_RADIUS_MIN),
    GALAXY_VISUAL_RADIUS_MIN,
    GALAXY_VISUAL_RADIUS_MAX,
  );
}
