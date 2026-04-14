import type { BuildSurfaceSnapshot } from '@/game/render/modes/terrain/CityTerrainTypes';

export function summarizeBuildSurface(snapshot: BuildSurfaceSnapshot) {
  let stable = 0;
  for (let i = 0; i < snapshot.stableMask.length; i += 1) {
    if (snapshot.stableMask[i] > 0.55) stable += 1;
  }
  return {
    stableVertices: stable,
    totalVertices: snapshot.stableMask.length,
    stableRatio: snapshot.stableMask.length > 0 ? stable / snapshot.stableMask.length : 0,
  };
}

export function validateBuildSurface(snapshot: BuildSurfaceSnapshot) {
  let slopeViolations = 0;
  let maxObservedSlope = 0;
  let checked = 0;

  for (let i = 0; i < snapshot.stableMask.length; i += 1) {
    if (snapshot.stableMask[i] < 0.6) continue;
    checked += 1;
    const slope = snapshot.slopes[i];
    maxObservedSlope = Math.max(maxObservedSlope, slope);
    if (slope > snapshot.maxSlope) slopeViolations += 1;
  }

  const violationRatio = checked > 0 ? slopeViolations / checked : 0;
  return {
    isValid: checked > 0 && violationRatio < 0.04,
    checkedVertices: checked,
    slopeViolations,
    violationRatio,
    maxObservedSlope,
    config: {
      center: snapshot.center,
      extent: { width: snapshot.width, depth: snapshot.depth },
      plateauHeight: snapshot.plateauHeight,
      transitionFalloff: snapshot.transitionFalloff,
      maxSlope: snapshot.maxSlope,
    },
  };
}
