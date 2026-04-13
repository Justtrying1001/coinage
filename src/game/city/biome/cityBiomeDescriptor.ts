import type { PlanetArchetype, PlanetSeed, PlanetVisualProfile } from '@/game/render/types';
import { planetProfileFromSeed } from '@/game/world/galaxyGenerator';
import { createPlanetGenerationConfig } from '@/game/planet/presets/archetypes';
import type { GradientStop, PlanetGenerationConfig, PlanetSurfaceMode } from '@/game/planet/types';

export type CityLotStyle = 'terraced' | 'platform' | 'courtyard' | 'stilted' | 'reinforced';
export type CityPerimeterStyle = 'coastal' | 'dune' | 'glacial' | 'basalt' | 'crystalline' | 'temperate' | 'overgrown' | 'wasteland';
export type CityLandform = 'archipelago' | 'mesa' | 'ice-shelf' | 'caldera' | 'fault-plateau' | 'green-basin' | 'canopy-clearing' | 'sterile-basin';

export interface CityBiomeDescriptor {
  archetype: PlanetArchetype;
  surfaceMode: PlanetSurfaceMode;
  landform: CityLandform;
  ambience: string;
  dominantGround: [string, string, string];
  secondaryAccents: [string, string, string];
  humidity: number;
  dryness: number;
  frost: number;
  thermal: number;
  minerality: number;
  vegetation: number;
  relief: number;
  roughness: number;
  lotStyle: CityLotStyle;
  perimeterStyle: CityPerimeterStyle;
  lotContrast: number;
  peripheralDensity: number;
  edgeGlow: number;
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
  const frost = generation.surfaceMode === 'ice' ? clamp(0.62 + profile.polarWeight * 0.75) : clamp(profile.polarWeight * 0.38);
  const thermal = generation.surfaceMode === 'lava'
    ? clamp(0.55 + generation.material.lavaAccentStrength * 0.6 + profile.emissiveIntensity * 0.85)
    : clamp(profile.emissiveIntensity * 1.65);
  const minerality = clamp(generation.material.metalness * 1.6 + generation.material.basaltContrast * 0.92 + profile.craterWeight * 0.46);

  const dominantGround = gradientTriplet(generation.elevationGradient, [0.16, 0.52, 0.82]);
  const secondaryAccents = gradientTriplet(generation.depthGradient, [0.16, 0.48, 0.78]);
  const archetypeStyle = ARCHETYPE_STYLE[profile.archetype] ?? styleForSurfaceMode(generation.surfaceMode);

  return {
    archetype: profile.archetype,
    surfaceMode: generation.surfaceMode,
    landform: archetypeStyle.landform,
    ambience: archetypeStyle.ambience,
    dominantGround,
    secondaryAccents,
    humidity: clamp((profile.humidityStrength + wetness) * 0.5),
    dryness,
    frost,
    thermal,
    minerality,
    vegetation,
    relief: clamp(profile.reliefStrength * 4.2),
    roughness: clamp((profile.roughness + generation.material.microReliefStrength) * 0.6),
    lotStyle: archetypeStyle.lotStyle,
    perimeterStyle: archetypeStyle.perimeterStyle,
    lotContrast: clamp(0.26 + generation.material.microAlbedoBreakup * 1.25 + (1 - wetness) * 0.1),
    peripheralDensity: clamp(0.22 + vegetation * 0.36 + minerality * 0.26),
    edgeGlow: clamp(0.14 + thermal * 0.42 + frost * 0.12 + wetness * 0.06),
  };
}

const ARCHETYPE_STYLE: Record<PlanetArchetype, {
  ambience: string;
  lotStyle: CityLotStyle;
  perimeterStyle: CityPerimeterStyle;
  landform: CityLandform;
}> = {
  oceanic: {
    ambience: 'Coastal colony terraces anchored between lagoon and reef shelf',
    lotStyle: 'stilted',
    perimeterStyle: 'coastal',
    landform: 'archipelago',
  },
  arid: {
    ambience: 'Wind-cut desert mesas prepared for settlement pads',
    lotStyle: 'courtyard',
    perimeterStyle: 'dune',
    landform: 'mesa',
  },
  frozen: {
    ambience: 'Engineered outpost carved into fractured ice shelf',
    lotStyle: 'platform',
    perimeterStyle: 'glacial',
    landform: 'ice-shelf',
  },
  volcanic: {
    ambience: 'Basaltic caldera rim stabilized around thermal vents',
    lotStyle: 'reinforced',
    perimeterStyle: 'basalt',
    landform: 'caldera',
  },
  mineral: {
    ambience: 'Dense tectonic terrace over mineral-rich fault plateau',
    lotStyle: 'terraced',
    perimeterStyle: 'crystalline',
    landform: 'fault-plateau',
  },
  terrestrial: {
    ambience: 'Temperate basin with prepared civic terraces',
    lotStyle: 'courtyard',
    perimeterStyle: 'temperate',
    landform: 'green-basin',
  },
  jungle: {
    ambience: 'Humid canopy clearing with reinforced foundation rings',
    lotStyle: 'stilted',
    perimeterStyle: 'overgrown',
    landform: 'canopy-clearing',
  },
  barren: {
    ambience: 'Austere sterile basin with functional colony slabs',
    lotStyle: 'reinforced',
    perimeterStyle: 'wasteland',
    landform: 'sterile-basin',
  },
};

function styleForSurfaceMode(surfaceMode: PlanetSurfaceMode) {
  if (surfaceMode === 'ice') {
    return { ambience: 'Cold engineered outpost', lotStyle: 'platform' as const, perimeterStyle: 'glacial' as const, landform: 'ice-shelf' as const };
  }
  if (surfaceMode === 'lava') {
    return { ambience: 'Thermal fortified district', lotStyle: 'reinforced' as const, perimeterStyle: 'basalt' as const, landform: 'caldera' as const };
  }
  return { ambience: 'Hydrated expansion district', lotStyle: 'courtyard' as const, perimeterStyle: 'temperate' as const, landform: 'green-basin' as const };
}

function gradientTriplet(gradient: GradientStop[], anchors: [number, number, number]): [string, string, string] {
  return [sampleGradient(gradient, anchors[0]), sampleGradient(gradient, anchors[1]), sampleGradient(gradient, anchors[2])];
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
