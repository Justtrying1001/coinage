import { SeededRng } from '@/game/world/rng';

export interface StarPoint {
  x: number;
  y: number;
  z: number;
  intensity: number;
  size: number;
}

export function generateSeededStarfield(
  seed: number,
  count: number,
  radiusRange: { min: number; max: number },
): StarPoint[] {
  const rng = new SeededRng(seed);
  const stars: StarPoint[] = [];

  for (let i = 0; i < count; i += 1) {
    const theta = rng.range(0, Math.PI * 2);
    const phi = Math.acos(rng.range(-1, 1));
    const radius = rng.range(radiusRange.min, radiusRange.max);

    stars.push({
      x: Math.sin(phi) * Math.cos(theta) * radius,
      y: Math.cos(phi) * radius,
      z: Math.sin(phi) * Math.sin(theta) * radius,
      intensity: rng.range(0.4, 1),
      size: rng.range(0.65, 1.35),
    });
  }

  return stars;
}
