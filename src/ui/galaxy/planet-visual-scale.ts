import type { PlanetScaleProfile } from '@/domain/world/planet-visual.types';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function computeGalaxyVisualRadius(scale: PlanetScaleProfile): number {
  const radiusFromBase = scale.renderRadiusBase * scale.galaxyViewScaleMultiplier;
  const silhouetteProtected = Math.max(radiusFromBase, scale.silhouetteProtectedRadius);
  return clamp(silhouetteProtected, scale.minRadiusGuardrail, scale.maxRadiusGuardrail);
}
