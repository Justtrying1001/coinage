import type { CitySlot, Faction, IslandShapePoint, Point2D, SizeCategory, WorldData } from '@/game/core/types';
import { SeededRng } from '@/game/world/rng';

interface WorldGeneratorConfig {
  seed: number;
  width: number;
  height: number;
  factionCount?: number;
}

const SIZE_TABLE: Record<SizeCategory, { baseRadius: number; slotRange: [number, number]; chance: number }> = {
  small: { baseRadius: 56, slotRange: [10, 14], chance: 0.56 },
  medium: { baseRadius: 84, slotRange: [13, 20], chance: 0.33 },
  large: { baseRadius: 118, slotRange: [18, 25], chance: 0.11 },
};

interface Cluster {
  x: number;
  y: number;
  spreadX: number;
  spreadY: number;
  weight: number;
}

interface VoidPocket {
  x: number;
  y: number;
  radius: number;
}

export function generateWorld({
  seed,
  width,
  height,
  factionCount = 560,
}: WorldGeneratorConfig): WorldData {
  const rng = new SeededRng(seed);
  const clusters = buildClusters(rng, width, height);
  const voidPockets = buildVoidPockets(rng, width, height);

  const factions: Faction[] = [];
  const grid = new Map<string, Point2D[]>();
  const cellSize = 380;

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
  while (factions.length < factionCount && safety < factionCount * 90) {
    safety += 1;
    const cluster = weightedPick(clusters, rng);
    const point: Point2D = {
      x: clamp(rng.range(cluster.x - cluster.spreadX, cluster.x + cluster.spreadX), 520, width - 520),
      y: clamp(rng.range(cluster.y - cluster.spreadY, cluster.y + cluster.spreadY), 430, height - 430),
    };

    if (isInsideVoid(point, voidPockets)) {
      continue;
    }

    const radialFactor = radialFromCenter(point, width, height);
    const localDensityBias = densityFromNearestCluster(point, clusters);
    const minDistance = 250 + radialFactor * 130 + localDensityBias * 48 + rng.range(10, 70);
    if (hasSpacingConflict(point, minDistance)) {
      continue;
    }

    const sizeCategory = pickSizeCategory(rng);
    const sizeInfo = SIZE_TABLE[sizeCategory];
    const radius = sizeInfo.baseRadius + rng.range(-8, 12);
    const silhouette = generateSilhouette(rng);
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

function buildClusters(rng: SeededRng, width: number, height: number): Cluster[] {
  const cx = width * 0.5;
  const cy = height * 0.5;
  const clusters: Cluster[] = [];

  for (let i = 0; i < 16; i += 1) {
    const ring = i % 4;
    const radiusFactor = [0.16, 0.29, 0.41, 0.5][ring];
    const angle = (Math.PI * 2 * i) / 16 + rng.range(-0.18, 0.18);
    clusters.push({
      x: cx + Math.cos(angle) * width * radiusFactor,
      y: cy + Math.sin(angle) * height * radiusFactor,
      spreadX: rng.range(550, 1450),
      spreadY: rng.range(460, 1320),
      weight: rng.range(0.9, 2.4),
    });
  }

  return clusters;
}

function buildVoidPockets(rng: SeededRng, width: number, height: number): VoidPocket[] {
  const pockets: VoidPocket[] = [];
  const cx = width * 0.5;
  const cy = height * 0.5;

  for (let i = 0; i < 7; i += 1) {
    const angle = (Math.PI * 2 * i) / 7 + rng.range(-0.24, 0.24);
    pockets.push({
      x: cx + Math.cos(angle) * width * rng.range(0.18, 0.42),
      y: cy + Math.sin(angle) * height * rng.range(0.15, 0.4),
      radius: rng.range(720, 1320),
    });
  }

  pockets.push({ x: cx, y: cy, radius: 1100 });
  return pockets;
}

function isInsideVoid(point: Point2D, voidPockets: VoidPocket[]) {
  for (const pocket of voidPockets) {
    const dx = point.x - pocket.x;
    const dy = point.y - pocket.y;
    if (dx * dx + dy * dy < pocket.radius * pocket.radius) {
      return true;
    }
  }

  return false;
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

function pickSizeCategory(rng: SeededRng): SizeCategory {
  const roll = rng.next();
  const smallLimit = SIZE_TABLE.small.chance;
  const mediumLimit = smallLimit + SIZE_TABLE.medium.chance;

  if (roll < smallLimit) return 'small';
  if (roll < mediumLimit) return 'medium';
  return 'large';
}

function generateSilhouette(rng: SeededRng): IslandShapePoint[] {
  const points = rng.int(20, 30);
  const majorFreq = rng.range(1.4, 2.8);
  const microFreq = rng.range(3.2, 5.8);

  return Array.from({ length: points }, (_, i) => {
    const angle = (Math.PI * 2 * i) / points;
    const major = Math.sin(angle * majorFreq + rng.range(-0.3, 0.3)) * 0.13;
    const micro = Math.cos(angle * microFreq + rng.range(-0.3, 0.3)) * 0.07;
    const jitter = rng.range(-0.09, 0.1);
    const radiusFactor = clamp(1 + major + micro + jitter, 0.74, 1.28);

    return {
      angle,
      radiusFactor,
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
  const maxAttempts = slotCount * 50;
  let attempts = 0;

  while (slots.length < slotCount && attempts < maxAttempts) {
    attempts += 1;
    const angle = rng.range(0, Math.PI * 2);
    const radiusCap = radiusForAngle(silhouette, angle) * baseRadius;
    const slotDistance = Math.sqrt(rng.next()) * radiusCap * 0.72;
    const x = Math.cos(angle) * slotDistance;
    const y = Math.sin(angle) * slotDistance;

    let collides = false;
    for (const slot of slots) {
      const dx = slot.x - x;
      const dy = slot.y - y;
      if (dx * dx + dy * dy < 18 * 18) {
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

function radialFromCenter(point: Point2D, width: number, height: number) {
  const distance = Math.hypot(point.x - width * 0.5, point.y - height * 0.5);
  return distance / Math.hypot(width * 0.5, height * 0.5);
}

function densityFromNearestCluster(point: Point2D, clusters: Cluster[]) {
  let nearest = Number.MAX_SAFE_INTEGER;

  for (const cluster of clusters) {
    const distance = Math.hypot(point.x - cluster.x, point.y - cluster.y);
    if (distance < nearest) {
      nearest = distance;
    }
  }

  return clamp(1 - nearest / 1800, 0, 1);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
