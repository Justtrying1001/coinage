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

const EDGE_PADDING_FACTOR = 0.985;

interface ArmBand {
  phase: number;
  twist: number;
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
  arms: ArmBand[];
  voids: DensityVoid[];
}

function createGalaxyStructure(rng: () => number, fieldRadius: number): GalaxyStructure {
  const armCount = 4 + Math.floor(rng() * 2);
  const arms: ArmBand[] = Array.from({ length: armCount }, (_, index) => ({
    phase: (index / armCount) * Math.PI * 2 + (rng() - 0.5) * 0.52,
    twist: 0.0044 + rng() * 0.0036,
    width: fieldRadius * (0.06 + rng() * 0.05),
    strength: 0.68 + rng() * 0.58,
  }));

  const voidCount = 3 + Math.floor(rng() * 2);
  const voids: DensityVoid[] = Array.from({ length: voidCount }, () => {
    const angle = rng() * Math.PI * 2;
    const distance = fieldRadius * (0.26 + rng() * 0.58);
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      radius: fieldRadius * (0.12 + rng() * 0.13),
      softness: 0.74 + rng() * 0.2,
    };
  });

  return { arms, voids };
}

function closestSpiralDistance(x: number, y: number, arm: ArmBand): number {
  const angle = Math.atan2(y, x);
  const radius = Math.hypot(x, y);
  const expectedAngle = arm.phase + radius * arm.twist;
  const wrapped = Math.atan2(Math.sin(angle - expectedAngle), Math.cos(angle - expectedAngle));
  return Math.abs(wrapped) * Math.max(radius, 16);
}

function sampleUniverseDensity(
  x: number,
  y: number,
  fieldRadius: number,
  structure: GalaxyStructure,
): number {
  const radius = Math.hypot(x, y);
  const normalizedRadius = radius / Math.max(1, fieldRadius);
  const halo = Math.exp(-Math.pow((normalizedRadius - 0.62) / 0.38, 2));
  const core = Math.exp(-Math.pow(normalizedRadius / 0.2, 2));

  let armSignal = 0;
  for (const arm of structure.arms) {
    const distanceToArm = closestSpiralDistance(x, y, arm);
    const armDensity = Math.exp(-Math.pow(distanceToArm / arm.width, 2)) * arm.strength;
    armSignal = Math.max(armSignal, armDensity);
  }

  let voidAttenuation = 1;
  for (const voidRegion of structure.voids) {
    const distance = Math.hypot(x - voidRegion.x, y - voidRegion.y);
    if (distance < voidRegion.radius) {
      const normalized = distance / voidRegion.radius;
      const suppression = Math.pow(1 - normalized, voidRegion.softness);
      voidAttenuation *= 1 - suppression * 0.95;
    }
  }

  const baseDensity = 0.06 + halo * 0.18 + core * 0.14 + armSignal * 0.78;
  return Math.max(0, Math.min(1, baseDensity * voidAttenuation));
}

function sampleStructuredCandidate(
  rng: () => number,
  fieldRadius: number,
  structure: GalaxyStructure,
): { x: number; y: number; distanceFromCenter: number; density: number } {
  for (let attempt = 0; attempt < 18; attempt += 1) {
    const modeRoll = rng();

    let x = 0;
    let y = 0;

    if (modeRoll < 0.67) {
      const arm = structure.arms[Math.floor(rng() * structure.arms.length)]!;
      const radius = fieldRadius * (0.1 + 0.88 * Math.pow(rng(), 1.2));
      const angle = arm.phase + radius * arm.twist + (rng() - 0.5) * 0.62;
      const radialJitter = (rng() - 0.5) * arm.width * 0.9;
      x = Math.cos(angle) * (radius + radialJitter);
      y = Math.sin(angle) * (radius + radialJitter);
    } else if (modeRoll < 0.86) {
      const angle = rng() * Math.PI * 2;
      const radius = fieldRadius * (0.08 + 0.78 * Math.pow(rng(), 1.45));
      x = Math.cos(angle) * radius;
      y = Math.sin(angle) * radius;
    } else {
      const angle = rng() * Math.PI * 2;
      const radius = fieldRadius * (0.08 + 0.9 * Math.sqrt(rng()));
      x = Math.cos(angle) * radius;
      y = Math.sin(angle) * radius;
    }

    const distanceFromCenter = Math.hypot(x, y);
    if (distanceFromCenter > fieldRadius * EDGE_PADDING_FACTOR) {
      continue;
    }

    const density = sampleUniverseDensity(x, y, fieldRadius, structure);
    if (density <= 0.03) {
      continue;
    }

    const accepted = rng() < 0.25 + density * 0.88;
    if (!accepted && attempt < 17) {
      continue;
    }

    return { x, y, distanceFromCenter, density };
  }

  const angle = rng() * Math.PI * 2;
  const radius = fieldRadius * EDGE_PADDING_FACTOR * Math.sqrt(rng());
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
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

      const edgeFactor = radiusFromCenter / merged.fieldRadius;
      const emptinessBoost = Math.pow(1 - candidate.density, 1.45) * merged.minSpacing * 0.55;
      const armPresenceBoost = candidate.density * merged.minSpacing * 0.5;
      const edgeComposure = edgeFactor > 0.84 ? merged.minSpacing * 0.24 : 0;

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
    const densitySpacingMultiplier = 1.6 - bestCandidate.density * 0.64;
    const packingRelaxation = 1.08 - fillRatio * 0.14 + rng() * 0.05;
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
    const relaxedSpacing = Math.max(merged.minSpacing, merged.minSpacing * (1.2 - candidate.density * 0.42));

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
