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
  planetCount: 120,
  fieldRadius: 70,
  minSpacing: 6.8,
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
  const maxAttempts = merged.planetCount * 120;

  let attempts = 0;
  while (points.length < merged.planetCount && attempts < maxAttempts) {
    attempts += 1;

    const radiusBias = Math.pow(rng(), 0.75);
    const angle = rng() * Math.PI * 2;
    const radius = radiusBias * merged.fieldRadius;

    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    if (!isFarEnough(x, y, points, merged.minSpacing)) {
      continue;
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
