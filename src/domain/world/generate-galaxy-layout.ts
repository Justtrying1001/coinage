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
  planetCount: 180,
  fieldRadius: 120,
  minSpacing: 7.2,
};

const ANGULAR_BUCKET_COUNT = 24;
const RADIAL_BUCKET_COUNT = 8;
const EDGE_PADDING_FACTOR = 0.985;

function angularBucket(x: number, y: number): number {
  const angle = Math.atan2(y, x);
  const normalized = (angle + Math.PI) / (Math.PI * 2);
  return Math.min(ANGULAR_BUCKET_COUNT - 1, Math.floor(normalized * ANGULAR_BUCKET_COUNT));
}

function radialBucket(distanceFromCenter: number, fieldRadius: number): number {
  const normalized = Math.min(0.9999, Math.max(0, distanceFromCenter / fieldRadius));
  return Math.floor(normalized * RADIAL_BUCKET_COUNT);
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
  const radialOccupancy = new Array<number>(RADIAL_BUCKET_COUNT).fill(0);
  const innerThreshold = merged.fieldRadius * 0.33;
  let innerCount = 0;
  const candidateChecks = Math.max(24, Math.round(Math.sqrt(merged.planetCount) * 2.4));
  const maxAttempts = merged.planetCount * 220;

  let attempts = 0;
  while (points.length < merged.planetCount && attempts < maxAttempts) {
    attempts += 1;

    let bestCandidate: { x: number; y: number; score: number; distanceFromCenter: number } | null = null;

    for (let i = 0; i < candidateChecks; i += 1) {
      const angle = rng() * Math.PI * 2;
      const radialRoll = rng();
      const radialDistance =
        (Math.sqrt(radialRoll) * 0.3 + radialRoll * 0.7) * merged.fieldRadius * EDGE_PADDING_FACTOR;
      const x = Math.cos(angle) * radialDistance;
      const y = Math.sin(angle) * radialDistance;

      const distanceFromCenter = Math.hypot(x, y);

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

      const edgeFactor = distanceFromCenter / merged.fieldRadius;
      const angular = angularBucket(x, y);
      const radial = radialBucket(distanceFromCenter, merged.fieldRadius);
      const minOccupancy = Math.min(...angularOccupancy);
      const angularVacancy = Math.max(0, 2.4 - (angularOccupancy[angular] - minOccupancy));
      const minRadialOccupancy = Math.min(...radialOccupancy);
      const radialVacancy = Math.max(0, 2.1 - (radialOccupancy[radial] - minRadialOccupancy));
      const edgePresenceBoost = edgeFactor > 0.7 ? merged.minSpacing * 0.28 : 0;
      const expectedInnerCount = Math.ceil((points.length + 1) * 0.15);
      const innerDeficit = Math.max(0, expectedInnerCount - innerCount);
      const centerPresenceBoost =
        distanceFromCenter <= innerThreshold ? innerDeficit * merged.minSpacing * 0.9 : 0;

      const score =
        nearestDistance * (0.9 + edgeFactor * 0.36) +
        angularVacancy * merged.minSpacing * 0.36 +
        radialVacancy * merged.minSpacing * 0.28 +
        edgePresenceBoost +
        centerPresenceBoost;

      if (!bestCandidate || score > bestCandidate.score) {
        bestCandidate = { x, y, score, distanceFromCenter };
      }
    }

    if (!bestCandidate) {
      continue;
    }

    const fillRatio = points.length / Math.max(1, merged.planetCount);
    const candidateRadius = merged.planetRadii?.[points.length] ?? 0;
    const spacingFactor = 1.36 - fillRatio * 0.3 + rng() * 0.08;
    const dynamicMinSpacing = Math.max(merged.minSpacing, merged.minSpacing * spacingFactor);
    if (!isFarEnough(bestCandidate.x, bestCandidate.y, candidateRadius, points, placedRadii, dynamicMinSpacing)) {
      continue;
    }

    placedRadii.push(candidateRadius);
    angularOccupancy[angularBucket(bestCandidate.x, bestCandidate.y)] += 1;
    radialOccupancy[radialBucket(bestCandidate.distanceFromCenter, merged.fieldRadius)] += 1;
    if (bestCandidate.distanceFromCenter <= innerThreshold) {
      innerCount += 1;
    }
    points.push({
      id: `planet-${points.length}`,
      planetSeed: `planet-${points.length}`,
      x: bestCandidate.x,
      y: bestCandidate.y,
      z: 0,
    });
  }

  let fallbackAttempts = 0;
  const fallbackLimit = merged.planetCount * 120;
  while (points.length < merged.planetCount && fallbackAttempts < fallbackLimit) {
    fallbackAttempts += 1;
    const angle = rng() * Math.PI * 2;
    const radialRoll = rng();
    const radialDistance =
      (Math.sqrt(radialRoll) * 0.3 + radialRoll * 0.7) * merged.fieldRadius * EDGE_PADDING_FACTOR;
    const x = Math.cos(angle) * radialDistance;
    const y = Math.sin(angle) * radialDistance;
    const candidateRadius = merged.planetRadii?.[points.length] ?? 0;
    const relaxedSpacing = merged.planetRadii ? merged.minSpacing * 0.76 : merged.minSpacing;

    if (!isFarEnough(x, y, candidateRadius, points, placedRadii, relaxedSpacing)) {
      continue;
    }

    const distanceFromCenter = Math.hypot(x, y);
    placedRadii.push(candidateRadius);
    angularOccupancy[angularBucket(x, y)] += 1;
    radialOccupancy[radialBucket(distanceFromCenter, merged.fieldRadius)] += 1;
    if (distanceFromCenter <= innerThreshold) {
      innerCount += 1;
    }
    points.push({
      id: `planet-${points.length}`,
      planetSeed: `planet-${points.length}`,
      x,
      y,
      z: 0,
    });
  }

  return points;
}
