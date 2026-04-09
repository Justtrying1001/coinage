import type { CitySlot, Faction, IslandShapePoint, Point2D, SizeCategory, WorldData } from '@/game/core/types';
import { SeededRng } from '@/game/world/rng';

interface WorldGeneratorConfig {
  seed: number;
  width: number;
  height: number;
  factionCount?: number;
}

const SIZE_TABLE: Record<SizeCategory, { baseRadius: number; slotRange: [number, number] }> = {
  small: { baseRadius: 70, slotRange: [10, 15] },
  medium: { baseRadius: 105, slotRange: [13, 20] },
  large: { baseRadius: 145, slotRange: [18, 25] },
};

export function generateWorld({
  seed,
  width,
  height,
  factionCount = 560,
}: WorldGeneratorConfig): WorldData {
  const rng = new SeededRng(seed);
  const clusterCount = 14;
  const clusters = Array.from({ length: clusterCount }, (_, i) => {
    const ring = i % 3;
    const radiusFactor = ring === 0 ? 0.2 : ring === 1 ? 0.36 : 0.48;
    const angle = (Math.PI * 2 * i) / clusterCount + rng.range(-0.22, 0.22);
    return {
      x: width * 0.5 + Math.cos(angle) * width * radiusFactor,
      y: height * 0.5 + Math.sin(angle) * height * radiusFactor,
      spreadX: rng.range(620, 1800),
      spreadY: rng.range(520, 1600),
      weight: rng.range(0.9, 2.7),
    };
  });

  const factions: Faction[] = [];
  const grid = new Map<string, Point2D[]>();
  const cellSize = 320;

  const addPoint = (point: Point2D) => {
    const key = `${Math.floor(point.x / cellSize)}:${Math.floor(point.y / cellSize)}`;
    const bucket = grid.get(key) ?? [];
    bucket.push(point);
    grid.set(key, bucket);
  };

  const hasSpacingConflict = (point: Point2D, minDistance: number) => {
    const gx = Math.floor(point.x / cellSize);
    const gy = Math.floor(point.y / cellSize);

    for (let y = gy - 1; y <= gy + 1; y += 1) {
      for (let x = gx - 1; x <= gx + 1; x += 1) {
        const key = `${x}:${y}`;
        const bucket = grid.get(key);
        if (!bucket) continue;

        for (const other of bucket) {
          const dx = other.x - point.x;
          const dy = other.y - point.y;
          if (dx * dx + dy * dy < minDistance * minDistance) {
            return true;
          }
        }
      }
    }

    return false;
  };

  let safety = 0;
  while (factions.length < factionCount && safety < factionCount * 50) {
    safety += 1;
    const cluster = weightedPick(clusters, rng);
    const point: Point2D = {
      x: clamp(rng.range(cluster.x - cluster.spreadX, cluster.x + cluster.spreadX), 450, width - 450),
      y: clamp(rng.range(cluster.y - cluster.spreadY, cluster.y + cluster.spreadY), 380, height - 380),
    };

    const distanceToCenter = Math.hypot(point.x - width * 0.5, point.y - height * 0.5);
    const maxDistance = Math.hypot(width * 0.5, height * 0.5);
    const radialFactor = distanceToCenter / maxDistance;

    const minDistance = 220 + radialFactor * 120 + rng.range(0, 60);
    if (hasSpacingConflict(point, minDistance)) {
      continue;
    }

    const sizeCategory = pickSizeCategory(rng, radialFactor);
    const sizeInfo = SIZE_TABLE[sizeCategory];
    const radius = sizeInfo.baseRadius + rng.range(-18, 24);
    const silhouette = generateSilhouette(rng, radius);
    const slots = generateSlots(rng, silhouette, radius, sizeInfo.slotRange, `f-${factions.length + 1}`);

    factions.push({
      id: `f-${factions.length + 1}`,
      name: `Faction ${String(factions.length + 1).padStart(3, '0')}`,
      position: point,
      sizeCategory,
      radius,
      shapeSeed: rng.int(0, 1_000_000),
      silhouette,
      slots,
    });

    addPoint(point);
  }

  return {
    seed,
    width,
    height,
    factions,
  };
}

function weightedPick<T extends { weight: number }>(values: T[], rng: SeededRng): T {
  const totalWeight = values.reduce((sum, item) => sum + item.weight, 0);
  let marker = rng.range(0, totalWeight);

  for (const value of values) {
    marker -= value.weight;
    if (marker <= 0) {
      return value;
    }
  }

  return values[values.length - 1];
}

function pickSizeCategory(rng: SeededRng, radialFactor: number): SizeCategory {
  const roll = rng.next() + radialFactor * 0.18;
  if (roll < 0.42) return 'small';
  if (roll < 0.84) return 'medium';
  return 'large';
}

function generateSilhouette(rng: SeededRng, radius: number): IslandShapePoint[] {
  const points = rng.int(18, 26);
  return Array.from({ length: points }, (_, i) => {
    const angle = (Math.PI * 2 * i) / points;
    const primaryWave = Math.sin(angle * rng.range(1.7, 3.4)) * 0.1;
    const secondaryWave = Math.cos(angle * rng.range(3.5, 6.1)) * 0.06;
    const jitter = rng.range(-0.15, 0.15);
    const factor = clamp(1 + primaryWave + secondaryWave + jitter, 0.72, 1.35);

    return {
      angle,
      radiusFactor: factor * (radius / radius),
    };
  });
}

function generateSlots(
  rng: SeededRng,
  silhouette: IslandShapePoint[],
  baseRadius: number,
  [minSlots, maxSlots]: [number, number],
  factionId: string,
): CitySlot[] {
  const slotCount = rng.int(minSlots, maxSlots);
  const slots: CitySlot[] = [];
  const maxAttempts = slotCount * 30;
  let attempts = 0;

  while (slots.length < slotCount && attempts < maxAttempts) {
    attempts += 1;
    const angle = rng.range(0, Math.PI * 2);
    const radiusCap = radiusForAngle(silhouette, angle) * baseRadius;
    const slotDistance = Math.sqrt(rng.next()) * radiusCap * 0.78;
    const x = Math.cos(angle) * slotDistance;
    const y = Math.sin(angle) * slotDistance;

    let collides = false;
    for (const slot of slots) {
      const dx = slot.x - x;
      const dy = slot.y - y;
      if (dx * dx + dy * dy < 16 * 16) {
        collides = true;
        break;
      }
    }

    if (collides) continue;

    slots.push({
      id: `${factionId}-slot-${slots.length + 1}`,
      x,
      y,
      occupied: false,
    });
  }

  return slots;
}

function radiusForAngle(silhouette: IslandShapePoint[], angle: number): number {
  const normalized = angle < 0 ? angle + Math.PI * 2 : angle;
  for (let i = 0; i < silhouette.length; i += 1) {
    const current = silhouette[i];
    const next = silhouette[(i + 1) % silhouette.length];

    const start = current.angle;
    const end = next.angle > start ? next.angle : next.angle + Math.PI * 2;
    const probe = normalized < start ? normalized + Math.PI * 2 : normalized;

    if (probe >= start && probe <= end) {
      const t = (probe - start) / (end - start || 1);
      return current.radiusFactor + (next.radiusFactor - current.radiusFactor) * t;
    }
  }

  return silhouette[0]?.radiusFactor ?? 1;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
