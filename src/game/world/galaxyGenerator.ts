import type { GalaxyData, GalaxyNode, PlanetArchetype, PlanetSeed, PlanetVisualProfile, SelectedPlanetRef } from '@/game/render/types';
import { SeededRng } from '@/game/world/rng';
import { ARCHETYPE_SPAWN_WEIGHTS, PLANET_ARCHETYPE_RULES } from '@/game/planet/presets/archetypeRules';

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
  const total = ARCHETYPE_SPAWN_WEIGHTS.reduce((sum, entry) => sum + entry.weight, 0);
  let marker = rng.range(0, total);

  for (const entry of ARCHETYPE_SPAWN_WEIGHTS) {
    marker -= entry.weight;
    if (marker <= 0) return entry.archetype;
  }

  return ARCHETYPE_SPAWN_WEIGHTS[ARCHETYPE_SPAWN_WEIGHTS.length - 1].archetype;
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

const ARCHETYPE_CONFIGS: Record<PlanetArchetype, ArchetypeConfig> = Object.fromEntries(
  Object.entries(PLANET_ARCHETYPE_RULES).map(([key, definition]) => [key, definition.profile]),
) as Record<PlanetArchetype, ArchetypeConfig>;
