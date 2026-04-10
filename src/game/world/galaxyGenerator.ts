import type { GalaxyData, GalaxyNode, PlanetArchetype, PlanetSeed, PlanetVisualProfile, SelectedPlanetRef } from '@/game/render/types';
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
  const archetype = pickArchetype(rng);
  const config = ARCHETYPE_CONFIGS[archetype];
  const baseHue = Math.floor(rng.range(config.baseHue[0], config.baseHue[1]));
  const ruggedness = rng.range(config.ruggedness[0], config.ruggedness[1]);
  const reliefStrength = rng.range(config.reliefStrength[0], config.reliefStrength[1]);
  const ridgeScale = rng.range(config.ridgeScale[0], config.ridgeScale[1]) + ruggedness * config.ridgeScaleBonus;
  const roughness = rng.range(config.roughness[0], config.roughness[1]);

  return {
    archetype,
    baseHue,
    accentHue: (baseHue + Math.floor(rng.range(config.accentOffset[0], config.accentOffset[1]))) % 360,
    hueDrift: rng.range(config.hueDrift[0], config.hueDrift[1]),
    oceanLevel: rng.range(config.oceanLevel[0], config.oceanLevel[1]),
    roughness,
    metalness: rng.range(config.metalness[0], config.metalness[1]),
    reliefStrength,
    reliefSharpness: rng.range(config.reliefSharpness[0], config.reliefSharpness[1]),
    continentScale: rng.range(config.continentScale[0], config.continentScale[1]),
    ridgeScale,
    craterScale: rng.range(config.craterScale[0], config.craterScale[1]),
    oceanSaturation: rng.range(config.oceanSaturation[0], config.oceanSaturation[1]),
    landSaturation: rng.range(config.landSaturation[0], config.landSaturation[1]),
    oceanLightness: rng.range(config.oceanLightness[0], config.oceanLightness[1]),
    landLightness: rng.range(config.landLightness[0], config.landLightness[1]),
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
  if (roll < 0.14) return 'oceanic';
  if (roll < 0.28) return 'arid';
  if (roll < 0.42) return 'frozen';
  if (roll < 0.56) return 'volcanic';
  if (roll < 0.7) return 'mineral';
  if (roll < 0.85) return 'fractured';
  return 'barren';
}

type Range = [number, number];
interface ArchetypeConfig {
  baseHue: Range;
  accentOffset: Range;
  hueDrift: Range;
  oceanLevel: Range;
  roughness: Range;
  metalness: Range;
  reliefStrength: Range;
  reliefSharpness: Range;
  continentScale: Range;
  ridgeScale: Range;
  ridgeScaleBonus: number;
  craterScale: Range;
  oceanSaturation: Range;
  landSaturation: Range;
  oceanLightness: Range;
  landLightness: Range;
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
    baseHue: [22, 54], accentOffset: [12, 36], hueDrift: [-10, 7], oceanLevel: [0.02, 0.18], roughness: [0.7, 0.95], metalness: [0.03, 0.1],
    reliefStrength: [0.11, 0.21], reliefSharpness: [1.2, 2.2], continentScale: [1.4, 2.7], ridgeScale: [7, 13], ridgeScaleBonus: 3.2, craterScale: [4.5, 8.4],
    oceanSaturation: [28, 38], landSaturation: [42, 64], oceanLightness: [22, 34], landLightness: [39, 61], lightIntensity: [1.05, 1.35], atmosphereLightness: [64, 74],
    ruggedness: [0.35, 1], macroBias: [0.2, 0.44], ridgeWeight: [0.34, 0.56], craterWeight: [0.15, 0.32], polarWeight: [0.05, 0.2], humidityStrength: [0.12, 0.34], emissiveIntensity: [0.01, 0.04],
  },
  frozen: {
    baseHue: [174, 224], accentOffset: [16, 40], hueDrift: [-12, 8], oceanLevel: [0.22, 0.52], roughness: [0.5, 0.78], metalness: [0.02, 0.09],
    reliefStrength: [0.05, 0.13], reliefSharpness: [0.95, 1.5], continentScale: [1.8, 3.6], ridgeScale: [6.4, 10.2], ridgeScaleBonus: 2.1, craterScale: [3.8, 6.4],
    oceanSaturation: [22, 38], landSaturation: [18, 36], oceanLightness: [40, 54], landLightness: [57, 75], lightIntensity: [1.12, 1.55], atmosphereLightness: [76, 88],
    ruggedness: [0.1, 0.6], macroBias: [0.04, 0.2], ridgeWeight: [0.12, 0.26], craterWeight: [0.08, 0.16], polarWeight: [0.2, 0.44], humidityStrength: [0.05, 0.2], emissiveIntensity: [0.01, 0.03],
  },
  volcanic: {
    baseHue: [6, 24], accentOffset: [18, 52], hueDrift: [6, 22], oceanLevel: [0, 0.06], roughness: [0.58, 0.84], metalness: [0.04, 0.16],
    reliefStrength: [0.13, 0.24], reliefSharpness: [1.25, 2.1], continentScale: [1.1, 2.3], ridgeScale: [8.8, 15.6], ridgeScaleBonus: 4.5, craterScale: [5.8, 9.6],
    oceanSaturation: [20, 34], landSaturation: [48, 78], oceanLightness: [18, 28], landLightness: [26, 44], lightIntensity: [1.35, 1.95], atmosphereLightness: [56, 68],
    ruggedness: [0.4, 1], macroBias: [0.22, 0.42], ridgeWeight: [0.34, 0.58], craterWeight: [0.2, 0.34], polarWeight: [0.01, 0.12], humidityStrength: [0.06, 0.22], emissiveIntensity: [0.06, 0.12],
  },
  mineral: {
    baseHue: [30, 76], accentOffset: [32, 66], hueDrift: [-9, 11], oceanLevel: [0.05, 0.22], roughness: [0.34, 0.68], metalness: [0.12, 0.28],
    reliefStrength: [0.08, 0.17], reliefSharpness: [1.05, 1.74], continentScale: [1.3, 2.6], ridgeScale: [7.2, 12.7], ridgeScaleBonus: 2.6, craterScale: [4.1, 7.3],
    oceanSaturation: [18, 32], landSaturation: [30, 56], oceanLightness: [25, 35], landLightness: [35, 52], lightIntensity: [1.18, 1.6], atmosphereLightness: [64, 75],
    ruggedness: [0.2, 0.75], macroBias: [0.15, 0.31], ridgeWeight: [0.2, 0.39], craterWeight: [0.14, 0.26], polarWeight: [0.05, 0.16], humidityStrength: [0.08, 0.28], emissiveIntensity: [0.02, 0.05],
  },
  fractured: {
    baseHue: [248, 318], accentOffset: [15, 44], hueDrift: [-18, 18], oceanLevel: [0.02, 0.19], roughness: [0.62, 0.94], metalness: [0.02, 0.12],
    reliefStrength: [0.14, 0.23], reliefSharpness: [1.5, 2.35], continentScale: [2.4, 4.4], ridgeScale: [10.8, 18.5], ridgeScaleBonus: 5.2, craterScale: [6.2, 10.2],
    oceanSaturation: [24, 36], landSaturation: [34, 62], oceanLightness: [23, 34], landLightness: [32, 50], lightIntensity: [1.12, 1.62], atmosphereLightness: [66, 78],
    ruggedness: [0.5, 1], macroBias: [0.23, 0.42], ridgeWeight: [0.38, 0.64], craterWeight: [0.22, 0.36], polarWeight: [0.05, 0.16], humidityStrength: [0.08, 0.26], emissiveIntensity: [0.02, 0.05],
  },
  oceanic: {
    baseHue: [186, 242], accentOffset: [14, 40], hueDrift: [-14, 10], oceanLevel: [0.56, 0.82], roughness: [0.35, 0.58], metalness: [0.01, 0.05],
    reliefStrength: [0.04, 0.12], reliefSharpness: [0.82, 1.24], continentScale: [1.6, 3.8], ridgeScale: [5.5, 9.2], ridgeScaleBonus: 1.8, craterScale: [3.1, 5.8],
    oceanSaturation: [48, 72], landSaturation: [26, 48], oceanLightness: [34, 52], landLightness: [31, 49], lightIntensity: [1.2, 1.78], atmosphereLightness: [72, 84],
    ruggedness: [0.05, 0.45], macroBias: [-0.15, 0.08], ridgeWeight: [0.1, 0.22], craterWeight: [0.08, 0.14], polarWeight: [0.08, 0.24], humidityStrength: [0.24, 0.52], emissiveIntensity: [0.01, 0.03],
  },
  barren: {
    baseHue: [32, 88], accentOffset: [14, 32], hueDrift: [-8, 6], oceanLevel: [0, 0.1], roughness: [0.56, 0.88], metalness: [0.02, 0.12],
    reliefStrength: [0.08, 0.19], reliefSharpness: [1.08, 1.92], continentScale: [1.3, 2.9], ridgeScale: [6.8, 11.8], ridgeScaleBonus: 3.5, craterScale: [5.1, 9.2],
    oceanSaturation: [15, 26], landSaturation: [20, 38], oceanLightness: [20, 30], landLightness: [30, 46], lightIntensity: [1.05, 1.42], atmosphereLightness: [58, 70],
    ruggedness: [0.3, 0.9], macroBias: [0.12, 0.29], ridgeWeight: [0.24, 0.43], craterWeight: [0.18, 0.32], polarWeight: [0.03, 0.14], humidityStrength: [0.02, 0.16], emissiveIntensity: [0.01, 0.04],
  },
};
