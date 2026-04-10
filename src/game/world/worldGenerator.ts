import type { CitySlot, Faction, IslandShapePoint, Point2D, ShapeFamily, SizeCategory, WorldData } from '@/game/core/types';
import { SeededRng } from '@/game/world/rng';

interface WorldGeneratorConfig {
  seed: number;
  width: number;
  height: number;
  factionCount?: number;
}

const SIZE_TABLE: Record<SizeCategory, { baseRadius: number; slotRange: [number, number]; chance: number }> = {
  small: { baseRadius: 50, slotRange: [9, 13], chance: 0.56 },
  medium: { baseRadius: 74, slotRange: [12, 18], chance: 0.33 },
  large: { baseRadius: 108, slotRange: [16, 23], chance: 0.11 },
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

interface SilhouetteProfile {
  family: ShapeFamily;
  points: IslandShapePoint[];
  primaryAxis: number;
  secondaryAxis: number;
  centerBias: number;
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
  const cellSize = 360;

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
  while (factions.length < factionCount && safety < factionCount * 120) {
    safety += 1;
    const cluster = weightedPick(clusters, rng);
    const point: Point2D = {
      x: clamp(rng.range(cluster.x - cluster.spreadX, cluster.x + cluster.spreadX), 520, width - 520),
      y: clamp(rng.range(cluster.y - cluster.spreadY, cluster.y + cluster.spreadY), 460, height - 460),
    };

    if (isInsideVoid(point, voidPockets)) {
      continue;
    }

    const radialFactor = radialFromCenter(point, width, height);
    const densityBias = densityFromNearestCluster(point, clusters);
    const minDistance = 245 + radialFactor * 90 + densityBias * 55 + rng.range(16, 62);
    if (hasSpacingConflict(point, minDistance)) {
      continue;
    }

    const sizeCategory = pickSizeCategory(rng);
    const sizeInfo = SIZE_TABLE[sizeCategory];
    const radius = sizeInfo.baseRadius + rng.range(-6, 12);
    const profile = generateSilhouetteProfile(rng);
    const slots = generateSlots(rng, profile, radius, sizeInfo.slotRange, `f-${factions.length + 1}`);

    factions.push({
      id: `f-${factions.length + 1}`,
      name: `Faction ${String(factions.length + 1).padStart(3, '0')}`,
      position: point,
      sizeCategory,
      radius,
      shapeSeed: rng.int(0, 1_000_000),
      shapeFamily: profile.family,
      silhouette: profile.points,
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

  for (let i = 0; i < 14; i += 1) {
    const ring = i % 3;
    const radiusFactor = [0.2, 0.35, 0.48][ring];
    const angle = (Math.PI * 2 * i) / 14 + rng.range(-0.16, 0.16);
    clusters.push({
      x: cx + Math.cos(angle) * width * radiusFactor,
      y: cy + Math.sin(angle) * height * radiusFactor,
      spreadX: rng.range(620, 1320),
      spreadY: rng.range(540, 1180),
      weight: rng.range(0.85, 2.1),
    });
  }

  return clusters;
}

function buildVoidPockets(rng: SeededRng, width: number, height: number): VoidPocket[] {
  const pockets: VoidPocket[] = [];
  const cx = width * 0.5;
  const cy = height * 0.5;

  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI * 2 * i) / 6 + rng.range(-0.22, 0.22);
    pockets.push({
      x: cx + Math.cos(angle) * width * rng.range(0.2, 0.44),
      y: cy + Math.sin(angle) * height * rng.range(0.18, 0.41),
      radius: rng.range(700, 1150),
    });
  }

  pockets.push({ x: cx, y: cy, radius: 920 });
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

function generateSilhouetteProfile(rng: SeededRng): SilhouetteProfile {
  const families: ShapeFamily[] = ['compact', 'stretched', 'twin-lobed', 'broken-coast', 'crescent', 'plateau'];
  const family = families[rng.int(0, families.length - 1)];
  const pointsCount = rng.int(24, 34);
  const primaryAxis = rng.range(0, Math.PI * 2);

  const points = Array.from({ length: pointsCount }, (_, i) => {
    const angle = (Math.PI * 2 * i) / pointsCount;
    const directional = Math.cos(angle - primaryAxis);
    const orthogonal = Math.sin(angle - primaryAxis);

    let radiusFactor = 1;
    switch (family) {
      case 'compact': {
        radiusFactor = 1 + Math.cos((angle - primaryAxis) * 2) * 0.05 + Math.sin((angle - primaryAxis) * 4) * 0.04;
        break;
      }
      case 'stretched': {
        radiusFactor = 1 + directional * directional * 0.2 - orthogonal * orthogonal * 0.09 + Math.sin(angle * 3) * 0.05;
        break;
      }
      case 'twin-lobed': {
        radiusFactor = 0.9 + Math.max(0, Math.cos(angle - primaryAxis)) * 0.28 + Math.max(0, Math.cos(angle - primaryAxis - Math.PI)) * 0.28;
        radiusFactor += Math.sin(angle * 4) * 0.03;
        break;
      }
      case 'broken-coast': {
        const roughSide = Math.max(0, Math.cos(angle - primaryAxis + Math.PI * 0.45));
        radiusFactor = 1 + Math.sin((angle - primaryAxis) * 3) * 0.1 - roughSide * 0.12 + Math.cos(angle * 7) * 0.04;
        break;
      }
      case 'crescent': {
        const cavity = Math.max(0, Math.cos(angle - primaryAxis - Math.PI * 0.15));
        radiusFactor = 1.05 + Math.cos(angle - primaryAxis) * 0.2 - cavity * 0.24 + Math.sin(angle * 5) * 0.03;
        break;
      }
      case 'plateau': {
        const bands = Math.abs(Math.sin((angle - primaryAxis) * 2));
        radiusFactor = 0.94 + (1 - bands) * 0.22 + Math.cos(angle * 6) * 0.025;
        break;
      }
    }

    radiusFactor += rng.range(-0.03, 0.03);
    return { angle, radiusFactor: clamp(radiusFactor, 0.7, 1.34) };
  });

  const centerBiasByFamily: Record<ShapeFamily, number> = {
    compact: 0.42,
    stretched: 0.34,
    'twin-lobed': 0.31,
    'broken-coast': 0.36,
    crescent: 0.28,
    plateau: 0.39,
  };

  return {
    family,
    points,
    primaryAxis,
    secondaryAxis: primaryAxis + Math.PI * 0.5,
    centerBias: centerBiasByFamily[family],
  };
}

function generateSlots(
  rng: SeededRng,
  profile: SilhouetteProfile,
  baseRadius: number,
  [minSlots, maxSlots]: [number, number],
  factionId: string,
): CitySlot[] {
  const slotCount = rng.int(minSlots, maxSlots);
  const slots: CitySlot[] = [];
  const hubCount = profile.family === 'compact' ? 2 : profile.family === 'twin-lobed' ? 4 : 3;

  const hubs: Array<{ angle: number; distanceFactor: number }> = [];
  hubs.push({ angle: profile.primaryAxis, distanceFactor: profile.centerBias });

  if (hubCount >= 2) {
    hubs.push({ angle: profile.primaryAxis + Math.PI, distanceFactor: profile.centerBias * 0.9 });
  }
  if (hubCount >= 3) {
    hubs.push({ angle: profile.secondaryAxis, distanceFactor: 0.48 });
  }
  if (hubCount >= 4) {
    hubs.push({ angle: profile.secondaryAxis + Math.PI, distanceFactor: 0.48 });
  }

  const maxAttempts = slotCount * 90;
  let attempts = 0;
  while (slots.length < slotCount && attempts < maxAttempts) {
    attempts += 1;
    const hub = hubs[attempts % hubs.length];
    const angle = hub.angle + rng.range(-0.55, 0.55);
    const coastCap = radiusForAngle(profile.points, angle);
    const anchorDistance = baseRadius * coastCap * hub.distanceFactor;
    const localSpread = baseRadius * (0.12 + rng.next() * 0.2);

    const x = Math.cos(angle) * anchorDistance + Math.cos(angle + Math.PI * 0.5) * rng.range(-localSpread, localSpread);
    const y = Math.sin(angle) * anchorDistance + Math.sin(angle + Math.PI * 0.5) * rng.range(-localSpread, localSpread);

    if (!isInsideSilhouette(profile.points, baseRadius, x, y, 0.86)) {
      continue;
    }

    let collides = false;
    for (const slot of slots) {
      const dx = slot.x - x;
      const dy = slot.y - y;
      if (dx * dx + dy * dy < 23 * 23) {
        collides = true;
        break;
      }
    }

    if (collides) {
      continue;
    }

    slots.push({
      id: `${factionId}-slot-${slots.length + 1}`,
      x,
      y,
      occupied: false,
    });
  }

  return slots;
}

function isInsideSilhouette(silhouette: IslandShapePoint[], baseRadius: number, x: number, y: number, margin: number) {
  const angle = Math.atan2(y, x);
  const radius = Math.hypot(x, y);
  const maxRadius = radiusForAngle(silhouette, angle) * baseRadius * margin;
  return radius <= maxRadius;
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

  return clamp(1 - nearest / 2100, 0, 1);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
