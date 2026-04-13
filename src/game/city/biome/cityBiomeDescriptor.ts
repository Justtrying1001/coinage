import type { PlanetArchetype, PlanetSeed, PlanetVisualProfile } from '@/game/render/types';
import { planetProfileFromSeed } from '@/game/world/galaxyGenerator';
import { createPlanetGenerationConfig } from '@/game/planet/presets/archetypes';
import type { GradientStop, PlanetGenerationConfig, PlanetSurfaceMode } from '@/game/planet/types';

export type CityLotStyle = 'terraced' | 'platform' | 'courtyard' | 'stilted' | 'reinforced';
export type CityPerimeterStyle = 'coastal' | 'dune' | 'glacial' | 'basalt' | 'crystalline' | 'temperate' | 'overgrown' | 'wasteland';

export interface CityBiomeDescriptor {
  archetype: PlanetArchetype;
  surfaceMode: PlanetSurfaceMode;
  ambience: string;
  dominantGround: [string, string, string];
  secondaryAccents: [string, string, string];
  humidity: number;
  dryness: number;
  frost: number;
  thermal: number;
  minerality: number;
  vegetation: number;
  lotStyle: CityLotStyle;
  perimeterStyle: CityPerimeterStyle;
  lotContrast: number;
  peripheralDensity: number;
}

export function createCityBiomeDescriptorFromSeed(seed: PlanetSeed) {
  const profile = planetProfileFromSeed(seed);
  const generation = createPlanetGenerationConfig(seed, profile);
  return createCityBiomeDescriptor(profile, generation);
}

export function createCityBiomeDescriptor(profile: PlanetVisualProfile, generation: PlanetGenerationConfig): CityBiomeDescriptor {
  const wetness = clamp(generation.material.wetness);
  const vegetation = clamp(generation.material.vegetationDensity);
  const dryness = clamp(1 - wetness * 0.82);
  const frost = generation.surfaceMode === 'ice' ? clamp(0.6 + profile.polarWeight * 0.8) : clamp(profile.polarWeight * 0.4);
  const thermal = generation.surfaceMode === 'lava'
    ? clamp(0.58 + generation.material.lavaAccentStrength * 0.45 + profile.emissiveIntensity * 0.8)
    : clamp(profile.emissiveIntensity * 1.9);
  const minerality = clamp(generation.material.metalness * 1.65 + generation.material.basaltContrast * 0.95 + profile.craterWeight * 0.42);

  const dominantGround = gradientTriplet(generation.elevationGradient, [0.18, 0.56, 0.85]);
  const secondaryAccents = gradientTriplet(generation.depthGradient, [0.22, 0.52, 0.82]);

  const archetypeStyle = ARCHETYPE_STYLE[profile.archetype] ?? styleForSurfaceMode(generation.surfaceMode);

  return {
    archetype: profile.archetype,
    surfaceMode: generation.surfaceMode,
    ambience: archetypeStyle.ambience,
    dominantGround,
    secondaryAccents,
    humidity: clamp((profile.humidityStrength + wetness) * 0.5),
    dryness,
    frost,
    thermal,
    minerality,
    vegetation,
    lotStyle: archetypeStyle.lotStyle,
    perimeterStyle: archetypeStyle.perimeterStyle,
    lotContrast: clamp(0.2 + generation.material.microAlbedoBreakup * 1.6 + (1 - wetness) * 0.1),
    peripheralDensity: clamp(0.26 + vegetation * 0.36 + minerality * 0.24),
  };
}

const ARCHETYPE_STYLE: Record<PlanetArchetype, { ambience: string; lotStyle: CityLotStyle; perimeterStyle: CityPerimeterStyle }> = {
  oceanic: { ambience: 'Harbor terraces over lagoon shelf', lotStyle: 'stilted', perimeterStyle: 'coastal' },
  arid: { ambience: 'Sun-scorched plateaus and dust basins', lotStyle: 'courtyard', perimeterStyle: 'dune' },
  frozen: { ambience: 'Cryo plateaus and wind-cut ridges', lotStyle: 'platform', perimeterStyle: 'glacial' },
  volcanic: { ambience: 'Stabilized basalt shelves near thermal seams', lotStyle: 'reinforced', perimeterStyle: 'basalt' },
  mineral: { ambience: 'Dense extraction-ready crystalline bedrock', lotStyle: 'terraced', perimeterStyle: 'crystalline' },
  terrestrial: { ambience: 'Balanced temperate foundations', lotStyle: 'courtyard', perimeterStyle: 'temperate' },
  jungle: { ambience: 'Humid clearings carved into dense canopy', lotStyle: 'stilted', perimeterStyle: 'overgrown' },
  barren: { ambience: 'Austere frontier slabs on sterile ground', lotStyle: 'reinforced', perimeterStyle: 'wasteland' },
};

function styleForSurfaceMode(surfaceMode: PlanetSurfaceMode) {
  if (surfaceMode === 'ice') return { ambience: 'Cold engineered outpost', lotStyle: 'platform' as const, perimeterStyle: 'glacial' as const };
  if (surfaceMode === 'lava') return { ambience: 'Thermal fortified district', lotStyle: 'reinforced' as const, perimeterStyle: 'basalt' as const };
  return { ambience: 'Hydrated expansion district', lotStyle: 'courtyard' as const, perimeterStyle: 'temperate' as const };
}

function gradientTriplet(gradient: GradientStop[], anchors: [number, number, number]): [string, string, string] {
  return [
    sampleGradient(gradient, anchors[0]),
    sampleGradient(gradient, anchors[1]),
    sampleGradient(gradient, anchors[2]),
  ];
}

function sampleGradient(gradient: GradientStop[], anchor: number) {
  if (gradient.length === 0) return '#7f8a95';
  const sorted = [...gradient].sort((a, b) => a.anchor - b.anchor);
  if (anchor <= sorted[0].anchor) return toHex(sorted[0].color);
  if (anchor >= sorted[sorted.length - 1].anchor) return toHex(sorted[sorted.length - 1].color);

  for (let i = 0; i < sorted.length - 1; i += 1) {
    const from = sorted[i];
    const to = sorted[i + 1];
    if (anchor < from.anchor || anchor > to.anchor) continue;
    const t = (anchor - from.anchor) / Math.max(to.anchor - from.anchor, 0.0001);
    return toHex([
      from.color[0] + (to.color[0] - from.color[0]) * t,
      from.color[1] + (to.color[1] - from.color[1]) * t,
      from.color[2] + (to.color[2] - from.color[2]) * t,
    ]);
  }

  return toHex(sorted[sorted.length - 1].color);
}

function toHex(color: [number, number, number]) {
  const [r, g, b] = color.map((channel) => Math.round(clamp(channel) * 255));
  return `#${toHexPart(r)}${toHexPart(g)}${toHexPart(b)}`;
}

function toHexPart(value: number) {
  return value.toString(16).padStart(2, '0');
}

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}
