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
   * Optional per-planet visual radius estimates used for spacing checks.
   * Values are interpreted in galaxy-world units.
   */
  planetRadii?: number[];
}

type GalaxyLayoutBaseConfig = Omit<GalaxyLayoutConfig, 'planetRadii'>;

export const DEFAULT_GALAXY_LAYOUT_CONFIG: Required<GalaxyLayoutBaseConfig> = {
  planetCount: 140,
  fieldRadius: 74,
  minSpacing: 6.2,
};

const RADIAL_BAND_CENTERS = [0.2, 0.4, 0.62, 0.82] as const;
const ANGULAR_BUCKET_COUNT = 16;

function angularBucket(x: number, y: number): number {
  const angle = Math.atan2(y, x);
  const normalized = (angle + Math.PI) / (Math.PI * 2);
  return Math.min(ANGULAR_BUCKET_COUNT - 1, Math.floor(normalized * ANGULAR_BUCKET_COUNT));
}

function isFarEnough(
  x: number,
  y: number,
  radius: number,
  points: GalaxyPlanetLayout[],
  placedRadii: number[],
  minSpacing: number,
): boolean {
  for (let i = 0; i < points.length; i += 1) {
    const point = points[i];
    const pointRadius = placedRadii[i] ?? 0;
    const dx = point.x - x;
    const dy = point.y - y;
    const distance = Math.hypot(dx, dy);
    const requiredDistance = minSpacing + radius + pointRadius;

    if (distance < requiredDistance) {
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

  const merged = { ...DEFAULT_GALAXY_LAYOUT_CONFIG, ...config };
  const rng = createSeededRng(deriveSeed(worldSeed, 'galaxy-layout'));

  const points: GalaxyPlanetLayout[] = [];
  const placedRadii: number[] = [];
  const angularOccupancy = new Array<number>(ANGULAR_BUCKET_COUNT).fill(0);
  const candidateChecks = Math.max(18, Math.round(merged.planetCount / 4));
  const maxAttempts = merged.planetCount * 30;

  let attempts = 0;
  while (points.length < merged.planetCount && attempts < maxAttempts) {
    attempts += 1;

    let bestCandidate: { x: number; y: number; score: number } | null = null;
    const preferredBand = RADIAL_BAND_CENTERS[points.length % RADIAL_BAND_CENTERS.length] ?? 0.5;

    for (let i = 0; i < candidateChecks; i += 1) {
      const angle = rng() * Math.PI * 2;
      const radialBias = Math.sqrt(rng());
      const radius = (0.08 + radialBias * 0.9) * merged.fieldRadius;

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
      const bandDistance = Math.abs(edgeFactor - preferredBand);
      const bucket = angularBucket(x, y);
      const minOccupancy = Math.min(...angularOccupancy);
      const bucketVacancy = Math.max(0, 1.6 - (angularOccupancy[bucket] - minOccupancy));

      const score =
        nearestDistance * (0.86 + edgeFactor * 0.34) +
        bucketVacancy * merged.minSpacing * 0.34 -
        bandDistance * merged.fieldRadius * 0.22;

      if (!bestCandidate || score > bestCandidate.score) {
        bestCandidate = { x, y, score };
      }
    }

    if (!bestCandidate) {
      continue;
    }

    const candidateRadius = merged.planetRadii?.[points.length] ?? 0;
    const dynamicMinSpacing = merged.minSpacing * (1.03 + rng() * 0.08);
    if (!isFarEnough(bestCandidate.x, bestCandidate.y, candidateRadius, points, placedRadii, dynamicMinSpacing)) {
      continue;
    }

    placedRadii.push(candidateRadius);
    angularOccupancy[angularBucket(bestCandidate.x, bestCandidate.y)] += 1;
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
