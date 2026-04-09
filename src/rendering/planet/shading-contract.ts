export interface SeaLevelResolution {
  seaLevel: number;
  normalizedSeaLevel: number;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * Canonical contract:
 * - `oceanLevel` from generation is an ocean-floor control where lower values imply more ocean coverage.
 * - shaders consume `uSeaLevel` in the same unscaled-elevation domain as `uMinMax`.
 */
export function resolveSeaLevelFromRange(minElevation: number, maxElevation: number, oceanLevel: number): SeaLevelResolution {
  const safeMin = Number.isFinite(minElevation) ? minElevation : 0;
  const safeMaxCandidate = Number.isFinite(maxElevation) ? maxElevation : safeMin + 1;
  const safeMax = safeMaxCandidate > safeMin ? safeMaxCandidate : safeMin + 0.2;

  const oceanControl = clamp01(Number.isFinite(oceanLevel) ? oceanLevel : 0.5);
  const normalizedSeaLevel = clamp01(1 - oceanControl);
  const seaLevel = safeMin + (safeMax - safeMin) * normalizedSeaLevel;

  return { seaLevel, normalizedSeaLevel };
}

export function isValidElevationRange(minElevation: number, maxElevation: number): boolean {
  return Number.isFinite(minElevation) && Number.isFinite(maxElevation) && maxElevation > minElevation;
}
