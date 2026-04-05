import { createSeededRng, deriveSeed } from '@/domain/world/seeded-rng';

export interface GalaxyPlanetLayout {
  id: string;
  planetSeed: string;
  x: number;
  y: number;
  z: number;
}

export interface GalaxyLayoutConfig {
  planetCount?: number;
  fieldRadius?: number;
  minSpacing?: number;
  /**
   * @deprecated Galaxy layout composition is now strictly 2D.
   * This field is kept only for backward compatibility and is ignored.
   */
  depthRange?: number;
}

const DEFAULT_CONFIG: Required<GalaxyLayoutConfig> = {
  planetCount: 140,
  fieldRadius: 74,
  minSpacing: 6.2,
  depthRange: 0,
};

function isFarEnough(
  x: number,
  y: number,
  points: GalaxyPlanetLayout[],
  minSpacing: number,
): boolean {
  for (const point of points) {
    const dx = point.x - x;
    const dy = point.y - y;
    const distanceSq = dx * dx + dy * dy;

    if (distanceSq < minSpacing * minSpacing) {
      return false;
    }
  }

  return true;
}

export function generateGalaxyLayout(
  worldSeed: string,
  config: GalaxyLayoutConfig = {},
): GalaxyPlanetLayout[] {
  if (!worldSeed.trim()) {
    throw new Error('worldSeed is required for galaxy layout generation');
  }

  const merged = { ...DEFAULT_CONFIG, ...config };
  const rng = createSeededRng(deriveSeed(worldSeed, 'galaxy-layout'));

  const points: GalaxyPlanetLayout[] = [];
  const candidateChecks = Math.max(18, Math.round(merged.planetCount / 4));
  const maxAttempts = merged.planetCount * 10;

  let attempts = 0;
  while (points.length < merged.planetCount && attempts < maxAttempts) {
    attempts += 1;

    let bestCandidate: { x: number; y: number; nearestDistance: number } | null = null;

    for (let i = 0; i < candidateChecks; i += 1) {
      const angle = rng() * Math.PI * 2;
      const radialBias = Math.pow(rng(), 1.12);
      const radius = (0.14 + radialBias * 0.86) * merged.fieldRadius;

      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      let nearestDistance = Number.POSITIVE_INFINITY;
      for (const point of points) {
        const dx = point.x - x;
        const dy = point.y - y;
        const distance = Math.hypot(dx, dy);
        if (distance < nearestDistance) {
          nearestDistance = distance;
        }
      }

      if (!Number.isFinite(nearestDistance)) {
        nearestDistance = merged.fieldRadius;
      }

      const edgeFactor = radius / merged.fieldRadius;
      const score = nearestDistance * (0.9 + edgeFactor * 0.24);

      if (!bestCandidate || score > bestCandidate.nearestDistance) {
        bestCandidate = { x, y, nearestDistance: score };
      }
    }

    if (!bestCandidate) {
      continue;
    }

    const dynamicMinSpacing = merged.minSpacing * (0.92 + rng() * 0.18);
    if (!isFarEnough(bestCandidate.x, bestCandidate.y, points, dynamicMinSpacing)) {
      continue;
    }

    points.push({
      id: `planet-${points.length}`,
      planetSeed: `planet-${points.length}`,
      x: bestCandidate.x,
      y: bestCandidate.y,
      z: 0,
    });
  }

  return points;
}
