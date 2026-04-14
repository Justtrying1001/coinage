import type {
  GalaxyData,
  GalaxyNode,
  PlanetArchetype,
  PlanetSeed,
  PlanetVisualProfile,
  SelectedPlanetRef,
} from '@/game/render/types';
import { SeededRng } from '@/game/world/rng';

interface GalaxyGeneratorConfig {
  seed: number;
  width: number;
  height: number;
  nodeCount?: number;
}

interface SpiralArm {
  angleOffset: number;
  weight: number;
}

interface PlacementPoint {
  x: number;
  y: number;
  radial: number;
}

export function generateGalaxyData({
  seed,
  width,
  height,
  nodeCount = 520,
}: GalaxyGeneratorConfig): GalaxyData {
  const rng = new SeededRng(seed);
  const arms = buildArms(rng);
  const totalNodes = Math.max(1, Math.floor(nodeCount));
  const placements = generateBalancedPlacements({ width, height, count: totalNodes, rng, arms });
  const nodes: GalaxyNode[] = [];

  for (let i = 0; i < totalNodes; i += 1) {
    const placement = placements[i];
    const nodeSeed = hashPlanetSeed(seed, i);
    const coreBias = 1 - placement.radial;
    nodes.push({
      id: `p-${i + 1}`,
      name: `Planet ${String(i + 1).padStart(3, '0')}`,
      x: placement.x,
      y: placement.y,
      radius: 2.8 + rng.range(0, 2.5) + coreBias * 1.45,
      seed: nodeSeed,
      populationBand: pickPopulationBand(rng, coreBias),
    });
  }

  return { seed, width, height, nodes };
}

export function planetProfileFromSeed(seed: PlanetSeed): PlanetVisualProfile {
  const rng = new SeededRng(seed);
  const archetype = pickArchetype(rng);
  const config = ARCHETYPE_CONFIGS[archetype];
  const ruggedness = rng.range(config.ruggedness[0], config.ruggedness[1]);
  const reliefStrength = rng.range(config.reliefStrength[0], config.reliefStrength[1]);
  const ridgeScale = rng.range(config.ridgeScale[0], config.ridgeScale[1]) + ruggedness * config.ridgeScaleBonus;

  return {
    archetype,
    oceanLevel: rng.range(config.oceanLevel[0], config.oceanLevel[1]),
    roughness: rng.range(config.roughness[0], config.roughness[1]),
    metalness: rng.range(config.metalness[0], config.metalness[1]),
    reliefStrength,
    reliefSharpness: rng.range(config.reliefSharpness[0], config.reliefSharpness[1]),
    continentScale: rng.range(config.continentScale[0], config.continentScale[1]),
    ridgeScale,
    craterScale: rng.range(config.craterScale[0], config.craterScale[1]),
    lightIntensity: rng.range(config.lightIntensity[0], config.lightIntensity[1]),
    atmosphereLightness: rng.range(config.atmosphereLightness[0], config.atmosphereLightness[1]),
    macroBias: rng.range(config.macroBias[0], config.macroBias[1]),
    ridgeWeight: rng.range(config.ridgeWeight[0], config.ridgeWeight[1]),
    craterWeight: rng.range(config.craterWeight[0], config.craterWeight[1]),
    polarWeight: rng.range(config.polarWeight[0], config.polarWeight[1]),
    humidityStrength: rng.range(config.humidityStrength[0], config.humidityStrength[1]),
    emissiveIntensity: rng.range(config.emissiveIntensity[0], config.emissiveIntensity[1]),
  };
}

export function selectPrimaryPlanet(galaxy: GalaxyData): SelectedPlanetRef {
  const byId = [...galaxy.nodes].sort((a, b) => a.id.localeCompare(b.id))[0];
  return { id: byId.id, seed: byId.seed };
}

function generateBalancedPlacements({
  width,
  height,
  count,
  rng,
  arms,
}: {
  width: number;
  height: number;
  count: number;
  rng: SeededRng;
  arms: SpiralArm[];
}): PlacementPoint[] {
  const minMargin = 56;
  const minDistanceBase = Math.sqrt((width * height) / Math.max(1, count)) * 0.56;
  const points: PlacementPoint[] = [];

  for (let i = 0; i < count; i += 1) {
    let best: PlacementPoint | null = null;
    let bestScore = Number.NEGATIVE_INFINITY;

    for (let attempt = 0; attempt < 14; attempt += 1) {
      const candidate = sampleSpiralCandidate(width, height, rng, arms, minMargin);
      const nearest = nearestDistance(candidate, points);
      const edgeProximity = Math.min(candidate.x - minMargin, width - minMargin - candidate.x, candidate.y - minMargin, height - minMargin - candidate.y);
      const score = nearest * 1.1 + edgeProximity * 0.32 - candidate.radial * 20;
      if (score > bestScore) {
        best = candidate;
        bestScore = score;
      }
    }

    points.push(best ?? sampleSpiralCandidate(width, height, rng, arms, minMargin));
  }

  relaxPlacements(points, width, height, minMargin, minDistanceBase, rng);
  return points;
}

function sampleSpiralCandidate(width: number, height: number, rng: SeededRng, arms: SpiralArm[], margin: number): PlacementPoint {
  const arm = weightedPick(arms, rng);
  const radial = Math.pow(rng.next(), 0.72);
  const swirl = radial * 5.4;
  const armNoise = rng.range(-0.28, 0.28);
  const angle = arm.angleOffset + swirl + armNoise;
  const ellipseX = 0.44 + rng.range(-0.03, 0.04);
  const ellipseY = 0.34 + rng.range(-0.02, 0.03);

  const xNorm = 0.5 + Math.cos(angle) * radial * ellipseX;
  const yNorm = 0.5 + Math.sin(angle) * radial * ellipseY;

  return {
    x: clamp(xNorm * width, margin, width - margin),
    y: clamp(yNorm * height, margin, height - margin),
    radial,
  };
}

function nearestDistance(candidate: PlacementPoint, points: PlacementPoint[]) {
  if (points.length === 0) return Number.POSITIVE_INFINITY;
  let best = Number.POSITIVE_INFINITY;
  for (const point of points) {
    const distance = Math.hypot(candidate.x - point.x, candidate.y - point.y);
    if (distance < best) best = distance;
  }
  return best;
}

function relaxPlacements(
  points: PlacementPoint[],
  width: number,
  height: number,
  margin: number,
  targetDistance: number,
  rng: SeededRng,
) {
  const centerX = width * 0.5;
  const centerY = height * 0.5;

  for (let iteration = 0; iteration < 16; iteration += 1) {
    for (let i = 0; i < points.length; i += 1) {
      const point = points[i];
      let pushX = 0;
      let pushY = 0;

      for (let j = 0; j < points.length; j += 1) {
        if (i === j) continue;
        const other = points[j];
        const dx = point.x - other.x;
        const dy = point.y - other.y;
        const distance = Math.hypot(dx, dy);
        const minDistance = targetDistance * (0.92 + Math.abs(point.radial - other.radial) * 0.16);

        if (distance < minDistance && distance > 0.0001) {
          const strength = ((minDistance - distance) / minDistance) * 1.12;
          pushX += (dx / distance) * strength;
          pushY += (dy / distance) * strength;
        }
      }

      const pullToCenter = 0.03 + point.radial * 0.02;
      pushX += (centerX - point.x) * 0.0009 * pullToCenter;
      pushY += (centerY - point.y) * 0.0009 * pullToCenter;

      point.x = clamp(point.x + pushX + rng.range(-0.12, 0.12), margin, width - margin);
      point.y = clamp(point.y + pushY + rng.range(-0.12, 0.12), margin, height - margin);
      point.radial = Math.min(1, Math.hypot((point.x - centerX) / width, (point.y - centerY) / height) * 2.45);
    }
  }
}

function pickPopulationBand(rng: SeededRng, coreBias: number): GalaxyNode['populationBand'] {
  const roll = rng.next() + coreBias * 0.25;
  if (roll > 0.95) return 'dense';
  if (roll > 0.45) return 'settled';
  return 'sparse';
}

function buildArms(rng: SeededRng): SpiralArm[] {
  const armCount = 4;
  return Array.from({ length: armCount }, (_, i) => ({
    angleOffset: (Math.PI * 2 * i) / armCount + rng.range(-0.2, 0.2),
    weight: rng.range(0.85, 1.25),
  }));
}

function weightedPick<T extends { weight: number }>(values: T[], rng: SeededRng): T {
  const totalWeight = values.reduce((sum, item) => sum + item.weight, 0);
  let marker = rng.range(0, totalWeight);

  for (const value of values) {
    marker -= value.weight;
    if (marker <= 0) return value;
  }

  return values[values.length - 1];
}

function hashPlanetSeed(seed: number, index: number): number {
  const mixed = (seed ^ ((index + 1) * 0x9e3779b9)) >>> 0;
  return (mixed * 1664525 + 1013904223) >>> 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pickArchetype(rng: SeededRng): PlanetArchetype {
  const roll = rng.next();
  if (roll < 0.13) return 'oceanic';
  if (roll < 0.25) return 'arid';
  if (roll < 0.37) return 'frozen';
  if (roll < 0.49) return 'volcanic';
  if (roll < 0.61) return 'mineral';
  if (roll < 0.75) return 'terrestrial';
  if (roll < 0.88) return 'jungle';
  return 'barren';
}

type Range = [number, number];
interface ArchetypeConfig {
  oceanLevel: Range;
  roughness: Range;
  metalness: Range;
  reliefStrength: Range;
  reliefSharpness: Range;
  continentScale: Range;
  ridgeScale: Range;
  ridgeScaleBonus: number;
  craterScale: Range;
  lightIntensity: Range;
  atmosphereLightness: Range;
  ruggedness: Range;
  macroBias: Range;
  ridgeWeight: Range;
  craterWeight: Range;
  polarWeight: Range;
  humidityStrength: Range;
  emissiveIntensity: Range;
}

const ARCHETYPE_CONFIGS: Record<PlanetArchetype, ArchetypeConfig> = {
  arid: {
    oceanLevel: [0, 0.08], roughness: [0.7, 0.95], metalness: [0.03, 0.1],
    reliefStrength: [0.11, 0.21], reliefSharpness: [1.2, 2.2], continentScale: [1.4, 2.7], ridgeScale: [7, 13], ridgeScaleBonus: 3.2, craterScale: [4.5, 8.4],
    lightIntensity: [1.05, 1.35], atmosphereLightness: [64, 74],
    ruggedness: [0.35, 1], macroBias: [0.2, 0.44], ridgeWeight: [0.34, 0.56], craterWeight: [0.15, 0.32], polarWeight: [0.05, 0.2], humidityStrength: [0.04, 0.18], emissiveIntensity: [0.01, 0.04],
  },
  frozen: {
    oceanLevel: [0.02, 0.12], roughness: [0.5, 0.78], metalness: [0.02, 0.09],
    reliefStrength: [0.05, 0.13], reliefSharpness: [0.95, 1.5], continentScale: [1.8, 3.6], ridgeScale: [6.4, 10.2], ridgeScaleBonus: 2.1, craterScale: [3.8, 6.4],
    lightIntensity: [1.12, 1.55], atmosphereLightness: [76, 88],
    ruggedness: [0.1, 0.6], macroBias: [0.04, 0.2], ridgeWeight: [0.12, 0.26], craterWeight: [0.08, 0.16], polarWeight: [0.2, 0.44], humidityStrength: [0.05, 0.2], emissiveIntensity: [0.01, 0.03],
  },
  volcanic: {
    oceanLevel: [0, 0.03], roughness: [0.58, 0.84], metalness: [0.04, 0.16],
    reliefStrength: [0.13, 0.24], reliefSharpness: [1.25, 2.1], continentScale: [1.1, 2.3], ridgeScale: [8.8, 15.6], ridgeScaleBonus: 4.5, craterScale: [5.8, 9.6],
    lightIntensity: [1.15, 1.55], atmosphereLightness: [56, 68],
    ruggedness: [0.4, 1], macroBias: [0.22, 0.42], ridgeWeight: [0.34, 0.58], craterWeight: [0.2, 0.34], polarWeight: [0.01, 0.12], humidityStrength: [0.02, 0.1], emissiveIntensity: [0.06, 0.12],
  },
  mineral: {
    oceanLevel: [0.05, 0.22], roughness: [0.34, 0.68], metalness: [0.12, 0.28],
    reliefStrength: [0.08, 0.17], reliefSharpness: [1.05, 1.74], continentScale: [1.3, 2.6], ridgeScale: [7.2, 12.7], ridgeScaleBonus: 2.6, craterScale: [4.1, 7.3],
    lightIntensity: [1.18, 1.6], atmosphereLightness: [64, 75],
    ruggedness: [0.2, 0.75], macroBias: [0.15, 0.31], ridgeWeight: [0.2, 0.39], craterWeight: [0.14, 0.26], polarWeight: [0.05, 0.16], humidityStrength: [0.08, 0.28], emissiveIntensity: [0.02, 0.05],
  },
  terrestrial: {
    oceanLevel: [0.28, 0.5], roughness: [0.62, 0.9], metalness: [0.01, 0.06],
    reliefStrength: [0.08, 0.16], reliefSharpness: [1.05, 1.78], continentScale: [1.5, 3.3], ridgeScale: [7.1, 12.4], ridgeScaleBonus: 2.8, craterScale: [3.8, 7.2],
    lightIntensity: [1.12, 1.5], atmosphereLightness: [70, 84],
    ruggedness: [0.2, 0.76], macroBias: [0.02, 0.24], ridgeWeight: [0.18, 0.4], craterWeight: [0.1, 0.24], polarWeight: [0.08, 0.24], humidityStrength: [0.24, 0.52], emissiveIntensity: [0, 0.03],
  },
  oceanic: {
    oceanLevel: [0.72, 0.92], roughness: [0.35, 0.58], metalness: [0.01, 0.05],
    reliefStrength: [0.04, 0.12], reliefSharpness: [0.82, 1.24], continentScale: [1.6, 3.8], ridgeScale: [5.5, 9.2], ridgeScaleBonus: 1.8, craterScale: [3.1, 5.8],
    lightIntensity: [1.2, 1.6], atmosphereLightness: [72, 84],
    ruggedness: [0.05, 0.45], macroBias: [-0.15, 0.08], ridgeWeight: [0.1, 0.22], craterWeight: [0.08, 0.14], polarWeight: [0.08, 0.24], humidityStrength: [0.42, 0.72], emissiveIntensity: [0.01, 0.03],
  },
  barren: {
    oceanLevel: [0, 0.1], roughness: [0.56, 0.88], metalness: [0.02, 0.12],
    reliefStrength: [0.08, 0.19], reliefSharpness: [1.08, 1.92], continentScale: [1.3, 2.9], ridgeScale: [6.8, 11.8], ridgeScaleBonus: 3.5, craterScale: [5.1, 9.2],
    lightIntensity: [1.05, 1.42], atmosphereLightness: [58, 70],
    ruggedness: [0.3, 0.9], macroBias: [0.12, 0.29], ridgeWeight: [0.24, 0.43], craterWeight: [0.18, 0.32], polarWeight: [0.03, 0.14], humidityStrength: [0.02, 0.16], emissiveIntensity: [0.01, 0.04],
  },
  jungle: {
    oceanLevel: [0.18, 0.38], roughness: [0.54, 0.8], metalness: [0.01, 0.05],
    reliefStrength: [0.07, 0.15], reliefSharpness: [1.0, 1.7], continentScale: [1.5, 3.1], ridgeScale: [6.6, 11.6], ridgeScaleBonus: 2.4, craterScale: [3.2, 6.2],
    lightIntensity: [1.08, 1.36], atmosphereLightness: [70, 82],
    ruggedness: [0.16, 0.64], macroBias: [-0.08, 0.14], ridgeWeight: [0.16, 0.34], craterWeight: [0.08, 0.18], polarWeight: [0.04, 0.14], humidityStrength: [0.62, 0.92], emissiveIntensity: [0.0, 0.02],
  },
};
