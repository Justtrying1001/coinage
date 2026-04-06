import type { PlanetScaleProfile } from '@/domain/world/planet-visual.types';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function computeGalaxyVisualRadius(scale: PlanetScaleProfile): number {
  const radius = scale.renderRadiusBase * scale.galaxyViewScaleMultiplier;
  return clamp(radius, scale.minRadiusGuardrail, scale.maxRadiusGuardrail);
}
