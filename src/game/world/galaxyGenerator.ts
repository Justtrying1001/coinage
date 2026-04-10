import type { GalaxyData, GalaxyNode, PlanetSeed, PlanetVisualProfile, SelectedPlanetRef } from '@/game/render/types';
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

export function generateGalaxyData({
  seed,
  width,
  height,
  nodeCount = 520,
}: GalaxyGeneratorConfig): GalaxyData {
  const rng = new SeededRng(seed);
  const arms = buildArms(rng);
  const nodes: GalaxyNode[] = [];
  const totalNodes = Math.max(1, Math.floor(nodeCount));

  for (let i = 0; i < totalNodes; i += 1) {
    const arm = weightedPick(arms, rng);
    const radial = Math.pow(rng.next(), 0.62);
    const swirl = radial * 4.6;
    const armNoise = rng.range(-0.34, 0.34);
    const angle = arm.angleOffset + swirl + armNoise;

    const spread = (1 - radial) * 0.08 + 0.02;
    const xNorm = 0.5 + Math.cos(angle) * radial * (0.42 + rng.range(-spread, spread));
    const yNorm = 0.5 + Math.sin(angle) * radial * (0.34 + rng.range(-spread, spread));

    const nodeSeed = hashPlanetSeed(seed, i);
    const coreBias = 1 - radial;

    nodes.push({
      id: `p-${i + 1}`,
      name: `Planet ${String(i + 1).padStart(3, '0')}`,
      x: clamp(xNorm * width, 48, width - 48),
      y: clamp(yNorm * height, 48, height - 48),
      radius: 2.1 + rng.range(0, 2.4) + coreBias * 1.8,
      seed: nodeSeed,
      populationBand: pickPopulationBand(rng, coreBias),
    });
  }

  return { seed, width, height, nodes };
}

export function planetProfileFromSeed(seed: PlanetSeed): PlanetVisualProfile {
  const rng = new SeededRng(seed);
  const baseHue = Math.floor(rng.range(160, 340));
  const reliefStrength = rng.range(0.05, 0.19);
  const ruggedness = rng.range(0, 1);

  return {
    baseHue,
    accentHue: (baseHue + Math.floor(rng.range(24, 90))) % 360,
    hueDrift: rng.range(-22, 24),
    oceanLevel: rng.range(0.18, 0.62),
    roughness: rng.range(0.36, 0.92),
    metalness: rng.range(0.01, 0.12),
    reliefStrength,
    reliefSharpness: rng.range(0.85, 1.75),
    continentScale: rng.range(1.2, 3.4),
    ridgeScale: rng.range(5.5, 12.5) + ruggedness * 4,
    craterScale: rng.range(3.0, 8.0),
    oceanSaturation: rng.range(42, 62),
    landSaturation: rng.range(38, 68),
    oceanLightness: rng.range(31, 46),
    landLightness: rng.range(30, 55),
    lightIntensity: rng.range(1.05, 1.75),
    atmosphereLightness: rng.range(70, 82),
  };
}

export function selectPrimaryPlanet(galaxy: GalaxyData): SelectedPlanetRef {
  const byId = [...galaxy.nodes].sort((a, b) => a.id.localeCompare(b.id))[0];
  return { id: byId.id, seed: byId.seed };
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
