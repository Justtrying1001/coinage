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

const EDGE_PADDING_FACTOR = 0.997;

interface LaneBand {
  angle: number;
  offset: number;
  width: number;
  strength: number;
}

interface DensityVoid {
  x: number;
  y: number;
  radius: number;
  softness: number;
}

interface GalaxyStructure {
  lanes: LaneBand[];
  voids: DensityVoid[];
  noiseWeights: {
    ax: number;
    ay: number;
    bx: number;
    by: number;
  };
}

function createGalaxyStructure(rng: () => number, fieldRadius: number): GalaxyStructure {
  const laneCount = 4 + Math.floor(rng() * 3);
  const lanes: LaneBand[] = Array.from({ length: laneCount }, () => ({
    angle: rng() * Math.PI,
    offset: (rng() - 0.5) * fieldRadius * 1.4,
    width: fieldRadius * (0.08 + rng() * 0.07),
    strength: 0.56 + rng() * 0.5,
  }));

  const voidCount = 3 + Math.floor(rng() * 2);
  const voids: DensityVoid[] = Array.from({ length: voidCount }, () => {
    return {
      x: (rng() - 0.5) * fieldRadius * 1.7,
      y: (rng() - 0.5) * fieldRadius * 1.7,
      radius: fieldRadius * (0.12 + rng() * 0.13),
      softness: 0.74 + rng() * 0.2,
    };
  });

  return {
    lanes,
    voids,
    noiseWeights: {
      ax: 0.0068 + rng() * 0.0042,
      ay: 0.0064 + rng() * 0.004,
      bx: 0.013 + rng() * 0.007,
      by: 0.012 + rng() * 0.007,
    },
  };
}

function laneDistance(x: number, y: number, lane: LaneBand): number {
  const normalX = -Math.sin(lane.angle);
  const normalY = Math.cos(lane.angle);
  return Math.abs(x * normalX + y * normalY - lane.offset);
}

function sampleUniverseDensity(
  x: number,
  y: number,
  fieldRadius: number,
  structure: GalaxyStructure,
): number {
  const normalizedX = x / Math.max(1, fieldRadius);
  const normalizedY = y / Math.max(1, fieldRadius);
  const maxAxisNorm = Math.max(Math.abs(normalizedX), Math.abs(normalizedY));
  const edgeOccupancyBoost = Math.max(0, (maxAxisNorm - 0.72) / 0.28);
  const centerPenalty = Math.max(0, 1 - maxAxisNorm / 0.32);

  const { ax, ay, bx, by } = structure.noiseWeights;
  const coarseNoise = Math.sin(x * ax + y * ay) * 0.5 + 0.5;
  const fineNoise = Math.sin(x * bx - y * by) * 0.5 + 0.5;

  let laneSignal = 0;
  for (const lane of structure.lanes) {
    const distanceToLane = laneDistance(x, y, lane);
    const laneDensity = Math.exp(-Math.pow(distanceToLane / lane.width, 2)) * lane.strength;
    laneSignal = Math.max(laneSignal, laneDensity);
  }

  let voidAttenuation = 1;
  for (const voidRegion of structure.voids) {
    const distance = Math.hypot(x - voidRegion.x, y - voidRegion.y);
    if (distance < voidRegion.radius) {
      const normalized = distance / voidRegion.radius;
      const suppression = Math.pow(1 - normalized, voidRegion.softness);
      voidAttenuation *= 1 - suppression * 0.78;
    }
  }

  const baseDensity =
    0.22 +
    coarseNoise * 0.16 +
    fineNoise * 0.1 +
    laneSignal * 0.5 +
    edgeOccupancyBoost * 0.13 -
    centerPenalty * 0.08;
  return Math.max(0, Math.min(1, baseDensity * voidAttenuation));
}

function sampleStructuredCandidate(
  rng: () => number,
  fieldRadius: number,
  structure: GalaxyStructure,
): { x: number; y: number; distanceFromCenter: number; density: number } {
  const usableRadius = fieldRadius * EDGE_PADDING_FACTOR;

  for (let attempt = 0; attempt < 18; attempt += 1) {
    const modeRoll = rng();

    let x = 0;
    let y = 0;

    if (modeRoll < 0.52) {
      const lane = structure.lanes[Math.floor(rng() * structure.lanes.length)]!;
      const along = (rng() - 0.5) * usableRadius * 2;
      const jitter = (rng() - 0.5) * lane.width * 1.5;
      const dirX = Math.cos(lane.angle);
      const dirY = Math.sin(lane.angle);
      const normalX = -dirY;
      const normalY = dirX;
      x = dirX * along + normalX * (lane.offset + jitter);
      y = dirY * along + normalY * (lane.offset + jitter);
    } else if (modeRoll < 0.86) {
      x = (rng() - 0.5) * usableRadius * 2;
      y = (rng() - 0.5) * usableRadius * 2;
    } else {
      const side = Math.floor(rng() * 4);
      const edgeOffset = usableRadius * (0.78 + rng() * 0.22);
      const tangent = (rng() - 0.5) * usableRadius * 2;
      if (side === 0) {
        x = edgeOffset;
        y = tangent;
      } else if (side === 1) {
        x = -edgeOffset;
        y = tangent;
      } else if (side === 2) {
        x = tangent;
        y = edgeOffset;
      } else {
        x = tangent;
        y = -edgeOffset;
      }
    }

    if (Math.abs(x) > usableRadius || Math.abs(y) > usableRadius) {
      continue;
    }
    const distanceFromCenter = Math.hypot(x, y);

    const density = sampleUniverseDensity(x, y, fieldRadius, structure);
    if (density <= 0.03) {
      continue;
    }

    const edgeRatio = Math.max(Math.abs(x), Math.abs(y)) / fieldRadius;
    const edgeAcceptanceBoost = edgeRatio > 0.78 ? 0.16 : 0;
    const accepted = rng() < 0.3 + density * 0.8 + edgeAcceptanceBoost;
    if (!accepted && attempt < 17) {
      continue;
    }

    return { x, y, distanceFromCenter, density };
  }

  const x = (rng() - 0.5) * usableRadius * 2;
  const y = (rng() - 0.5) * usableRadius * 2;
  return {
    x,
    y,
    distanceFromCenter: Math.hypot(x, y),
    density: sampleUniverseDensity(x, y, fieldRadius, structure),
  };
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
  const structure = createGalaxyStructure(rng, merged.fieldRadius);

  const points: GalaxyPlanetLayout[] = [];
  const placedRadii: number[] = [];
  const candidateChecks = Math.max(24, Math.round(Math.sqrt(merged.planetCount) * 2.1));
  const maxAttempts = merged.planetCount * 260;

  let attempts = 0;
  while (points.length < merged.planetCount && attempts < maxAttempts) {
    attempts += 1;

    let bestCandidate: {
      x: number;
      y: number;
      score: number;
      density: number;
    } | null = null;

    for (let i = 0; i < candidateChecks; i += 1) {
      const candidate = sampleStructuredCandidate(rng, merged.fieldRadius, structure);
      const radiusFromCenter = candidate.distanceFromCenter;

      let nearestDistance = Number.POSITIVE_INFINITY;
      for (const point of points) {
        const dx = point.x - candidate.x;
        const dy = point.y - candidate.y;
        const distance = Math.hypot(dx, dy);
        if (distance < nearestDistance) {
          nearestDistance = distance;
        }
      }

      if (!Number.isFinite(nearestDistance)) {
        nearestDistance = merged.fieldRadius;
      }

      const edgeFactor = Math.max(Math.abs(candidate.x), Math.abs(candidate.y)) / merged.fieldRadius;
      const emptinessBoost = Math.pow(1 - candidate.density, 1.25) * merged.minSpacing * 0.46;
      const armPresenceBoost = candidate.density * merged.minSpacing * 0.42;
      const edgeComposure = edgeFactor > 0.8 ? merged.minSpacing * 0.42 : 0;

      const score = nearestDistance + emptinessBoost + armPresenceBoost + edgeComposure;

      if (!bestCandidate || score > bestCandidate.score) {
        bestCandidate = {
          x: candidate.x,
          y: candidate.y,
          score,
          density: candidate.density,
        };
      }
    }

    if (!bestCandidate) {
      continue;
    }

    const fillRatio = points.length / Math.max(1, merged.planetCount);
    const candidateRadius = merged.planetRadii?.[points.length] ?? 0;
    const densitySpacingMultiplier = 1.42 - bestCandidate.density * 0.5;
    const edgeRatio =
      Math.max(Math.abs(bestCandidate.x), Math.abs(bestCandidate.y)) / Math.max(1, merged.fieldRadius);
    const edgePackingBoost = edgeRatio > 0.8 ? 0.13 : 0;
    const packingRelaxation = 1.06 - fillRatio * 0.2 - edgePackingBoost + rng() * 0.04;
    const dynamicMinSpacing = Math.max(
      merged.minSpacing,
      merged.minSpacing * densitySpacingMultiplier * packingRelaxation,
    );

    if (!isFarEnough(bestCandidate.x, bestCandidate.y, candidateRadius, points, placedRadii, dynamicMinSpacing)) {
      continue;
    }

    placedRadii.push(candidateRadius);
    points.push({
      id: `planet-${points.length}`,
      planetSeed: `planet-${points.length}`,
      x: bestCandidate.x,
      y: bestCandidate.y,
      z: 0,
    });
  }

  let fallbackAttempts = 0;
  const fallbackLimit = merged.planetCount * 180;
  while (points.length < merged.planetCount && fallbackAttempts < fallbackLimit) {
    fallbackAttempts += 1;
    const candidate = sampleStructuredCandidate(rng, merged.fieldRadius, structure);
    const candidateRadius = merged.planetRadii?.[points.length] ?? 0;
    const edgeRatio = Math.max(Math.abs(candidate.x), Math.abs(candidate.y)) / Math.max(1, merged.fieldRadius);
    const relaxedSpacing = Math.max(
      merged.minSpacing,
      merged.minSpacing * (1.14 - candidate.density * 0.34 - (edgeRatio > 0.82 ? 0.06 : 0)),
    );

    if (!isFarEnough(candidate.x, candidate.y, candidateRadius, points, placedRadii, relaxedSpacing)) {
      continue;
    }

    placedRadii.push(candidateRadius);
    points.push({
      id: `planet-${points.length}`,
      planetSeed: `planet-${points.length}`,
      x: candidate.x,
      y: candidate.y,
      z: 0,
    });
  }

  return points;
}
