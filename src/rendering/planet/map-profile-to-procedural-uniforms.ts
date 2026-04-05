import * as THREE from 'three';

import type { PlanetVisualProfile } from '@/domain/world/planet-visual.types';

import type { ProceduralPlanetUniforms, SurfaceCategoryKind, TerrainProfileKind } from './types';

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function colorToTuple(color: THREE.Color): [number, number, number] {
  return [color.r, color.g, color.b];
}

function pickWaterColor(palette: PlanetVisualProfile['paletteFamily']): string {
  switch (palette) {
    case 'cobalt-ice':
      return '#4f88d6';
    case 'glacier-mint':
      return '#6da9b6';
    case 'violet-ash':
      return '#555ba0';
    case 'amethyst-haze':
      return '#725ab8';
    case 'ember-dust':
      return '#2f4f6c';
    case 'arid-ochre':
      return '#4d5b68';
    case 'verdant-umber':
      return '#307a66';
    case 'emerald-sea':
      return '#1f8f7a';
    case 'obsidian-lava':
      return '#2b2e35';
    case 'charcoal-abyss':
      return '#181f2d';
    case 'toxic-neon':
      return '#2d5f47';
    case 'rose-quartz':
      return '#7a67af';
    default:
      return '#2a659a';
  }
}

function pickLandColor(palette: PlanetVisualProfile['paletteFamily']): string {
  switch (palette) {
    case 'ember-dust':
      return '#9b6c43';
    case 'basalt-moss':
      return '#586f50';
    case 'cobalt-ice':
      return '#6e8796';
    case 'sulfur-stone':
      return '#ac9450';
    case 'violet-ash':
      return '#7c688f';
    case 'verdant-umber':
      return '#688c52';
    case 'rose-quartz':
      return '#ae7898';
    case 'glacier-mint':
      return '#afcfc8';
    case 'arid-ochre':
      return '#c39a5a';
    case 'obsidian-lava':
      return '#4f3b38';
    case 'toxic-neon':
      return '#65a349';
    case 'amethyst-haze':
      return '#8c74bd';
    case 'emerald-sea':
      return '#479466';
    case 'charcoal-abyss':
      return '#38404d';
  }
}

function paletteClimateBias(palette: PlanetVisualProfile['paletteFamily']): { dry: number; lush: number; mineral: number; cryo: number; oddity: number } {
  switch (palette) {
    case 'ember-dust':
      return { dry: 0.84, lush: 0.1, mineral: 0.62, cryo: 0.08, oddity: 0.12 };
    case 'basalt-moss':
      return { dry: 0.3, lush: 0.72, mineral: 0.56, cryo: 0.12, oddity: 0.1 };
    case 'cobalt-ice':
      return { dry: 0.18, lush: 0.18, mineral: 0.66, cryo: 0.9, oddity: 0.08 };
    case 'sulfur-stone':
      return { dry: 0.78, lush: 0.1, mineral: 0.8, cryo: 0.06, oddity: 0.18 };
    case 'violet-ash':
      return { dry: 0.52, lush: 0.18, mineral: 0.74, cryo: 0.16, oddity: 0.7 };
    case 'verdant-umber':
      return { dry: 0.34, lush: 0.82, mineral: 0.42, cryo: 0.16, oddity: 0.14 };
    case 'rose-quartz':
      return { dry: 0.42, lush: 0.38, mineral: 0.5, cryo: 0.22, oddity: 0.66 };
    case 'glacier-mint':
      return { dry: 0.2, lush: 0.32, mineral: 0.4, cryo: 0.96, oddity: 0.2 };
    case 'arid-ochre':
      return { dry: 0.9, lush: 0.08, mineral: 0.52, cryo: 0.03, oddity: 0.08 };
    case 'obsidian-lava':
      return { dry: 0.76, lush: 0.05, mineral: 0.92, cryo: 0.02, oddity: 0.22 };
    case 'toxic-neon':
      return { dry: 0.48, lush: 0.36, mineral: 0.68, cryo: 0.04, oddity: 0.95 };
    case 'amethyst-haze':
      return { dry: 0.36, lush: 0.3, mineral: 0.58, cryo: 0.26, oddity: 0.92 };
    case 'emerald-sea':
      return { dry: 0.24, lush: 0.74, mineral: 0.36, cryo: 0.18, oddity: 0.28 };
    case 'charcoal-abyss':
      return { dry: 0.58, lush: 0.08, mineral: 0.88, cryo: 0.06, oddity: 0.4 };
  }
}

interface TerrainProfileSettings {
  type: TerrainProfileKind;
  elevationCap: number;
  terrainSmoothing: number;
  ridgeAttenuation: number;
  detailAttenuation: number;
  macroScale: number;
  ridgedScale: number;
  continentThreshold: number;
  continentSharpness: number;
  continentDrift: number;
  trenchDepth: number;
  biomeHarshness: number;
}

function minimumLandRatioForCategory(category: SurfaceCategoryKind): number {
  switch (category) {
    case 'ocean':
      return 0.4;
    case 'ice':
      return 0.42;
    case 'toxic':
      return 0.44;
    case 'abyssal':
      return 0.43;
    case 'lush':
      return 0.5;
    case 'desert':
      return 0.54;
    case 'volcanic':
      return 0.58;
    case 'mineral':
      return 0.54;
    case 'barren':
      return 0.5;
  }
}

function applyMacroStyleToTerrain(
  terrain: TerrainProfileSettings,
  macroStyle: PlanetVisualProfile['macroStyle'],
): TerrainProfileSettings {
  switch (macroStyle) {
    case 'supercontinent':
      return {
        ...terrain,
        type: terrain.type === 'fragmented' ? 'continental' : terrain.type,
        continentThreshold: clamp(terrain.continentThreshold - 0.06, 0.36, 0.68),
        continentSharpness: clamp(terrain.continentSharpness + 0.05, 0.1, 0.34),
        continentDrift: clamp(terrain.continentDrift - 0.08, 0.02, 0.36),
        trenchDepth: clamp(terrain.trenchDepth + 0.02, 0.06, 0.24),
      };
    case 'archipelago':
      return {
        ...terrain,
        continentThreshold: clamp(terrain.continentThreshold + 0.08, 0.42, 0.72),
        continentSharpness: clamp(terrain.continentSharpness + 0.03, 0.1, 0.36),
        continentDrift: clamp(terrain.continentDrift + 0.11, 0.02, 0.44),
      };
    case 'island-chain':
      return {
        ...terrain,
        continentThreshold: clamp(terrain.continentThreshold + 0.04, 0.42, 0.72),
        continentSharpness: clamp(terrain.continentSharpness + 0.08, 0.1, 0.36),
        continentDrift: clamp(terrain.continentDrift + 0.14, 0.02, 0.44),
        ridgeAttenuation: clamp(terrain.ridgeAttenuation + 0.04, 0.2, 0.82),
      };
    case 'fractured':
      return {
        ...terrain,
        type: 'fragmented',
        terrainSmoothing: clamp(terrain.terrainSmoothing - 0.08, 0.46, 0.9),
        continentThreshold: clamp(terrain.continentThreshold + 0.09, 0.42, 0.76),
        continentDrift: clamp(terrain.continentDrift + 0.18, 0.04, 0.48),
        detailAttenuation: clamp(terrain.detailAttenuation + 0.05, 0.16, 0.58),
      };
    case 'dual-hemisphere':
      return {
        ...terrain,
        continentThreshold: clamp(terrain.continentThreshold - 0.02, 0.36, 0.68),
        continentSharpness: clamp(terrain.continentSharpness + 0.03, 0.1, 0.36),
        continentDrift: clamp(terrain.continentDrift + 0.04, 0.02, 0.44),
      };
    case 'basin':
      return {
        ...terrain,
        trenchDepth: clamp(terrain.trenchDepth + 0.05, 0.08, 0.26),
        continentThreshold: clamp(terrain.continentThreshold + 0.02, 0.4, 0.72),
      };
  }
}

function estimateLandRatio(
  oceanLevel: number,
  simpleStrength: number,
  ridgedStrength: number,
  maskStrength: number,
  terrainProfile: TerrainProfileKind,
): number {
  const profileReliefBoost =
    terrainProfile === 'smooth'
      ? 0.01
      : terrainProfile === 'moderate'
        ? 0.025
        : terrainProfile === 'rough'
          ? 0.04
          : 0.05;

  return clamp(
    1 - oceanLevel + simpleStrength * 0.2 + ridgedStrength * 0.08 + maskStrength * 0.05 + profileReliefBoost,
    0.08,
    0.92,
  );
}

function pickSurfaceCategory(
  profile: PlanetVisualProfile,
  climate: { dry: number; lush: number; mineral: number; cryo: number; oddity: number },
): SurfaceCategoryKind {
  switch (profile.archetype) {
    case 'oceanic':
      return 'ocean';
    case 'icy':
    case 'clouded':
      return 'ice';
    case 'arid':
      return 'desert';
    case 'lush':
    case 'superterran':
      return 'lush';
    case 'volcanic':
      return 'volcanic';
    case 'dead':
      return 'barren';
    case 'toxic':
      return 'toxic';
    case 'mineral':
      return 'mineral';
    case 'exotic':
      return climate.oddity > 0.65 ? 'toxic' : 'abyssal';
    case 'fragmented':
      return climate.dry > 0.55 ? 'desert' : 'barren';
  }

  if (profile.paletteFamily === 'toxic-neon') {
    return 'toxic';
  }

  if (profile.paletteFamily === 'charcoal-abyss') {
    return 'abyssal';
  }

  if (profile.paletteFamily === 'obsidian-lava') {
    return 'volcanic';
  }

  if (profile.paletteFamily === 'arid-ochre') {
    return 'desert';
  }

  if (profile.materialFamily === 'icy' || climate.cryo > 0.72) {
    return 'ice';
  }

  if (profile.materialFamily === 'metallic') {
    if (climate.dry > 0.66) {
      return 'volcanic';
    }

    return climate.oddity > 0.58 ? 'barren' : 'mineral';
  }

  if (profile.materialFamily === 'dusty') {
    return climate.lush > 0.55 ? 'lush' : climate.dry > 0.62 ? 'desert' : 'barren';
  }

  if (profile.color.accentMix > 0.74 && climate.lush > 0.56) {
    return 'ocean';
  }

  if (climate.lush > 0.72) {
    return 'lush';
  }

  if (climate.dry > 0.72) {
    return 'desert';
  }

  if (climate.mineral > 0.74) {
    return 'mineral';
  }

  return climate.oddity > 0.6 ? 'barren' : 'ocean';
}

function categoryPalette(category: SurfaceCategoryKind): {
  water: string;
  shallow: string;
  land: string;
  mountain: string;
  ice: string;
} {
  switch (category) {
    case 'ocean':
      return {
        water: '#2d63b8',
        shallow: '#5ea6d8',
        land: '#3d7352',
        mountain: '#8ea38d',
        ice: '#ddefff',
      };
    case 'desert':
      return {
        water: '#315f87',
        shallow: '#5f8ea8',
        land: '#bf8f4c',
        mountain: '#8a6743',
        ice: '#d8d2be',
      };
    case 'ice':
      return {
        water: '#5f81af',
        shallow: '#88b4d1',
        land: '#b4c7d6',
        mountain: '#d6e3ef',
        ice: '#f3fbff',
      };
    case 'volcanic':
      return {
        water: '#2f394f',
        shallow: '#535a72',
        land: '#5b3a35',
        mountain: '#3c2a2a',
        ice: '#b7a99e',
      };
    case 'lush':
      return {
        water: '#2f76ab',
        shallow: '#62b9c1',
        land: '#4f8d4c',
        mountain: '#7d8f63',
        ice: '#ddebdc',
      };
    case 'mineral':
      return {
        water: '#3c5f88',
        shallow: '#69879f',
        land: '#7f735f',
        mountain: '#a39684',
        ice: '#ddd4c7',
      };
    case 'barren':
      return {
        water: '#46586d',
        shallow: '#687587',
        land: '#866f60',
        mountain: '#6f5f56',
        ice: '#cfc3b8',
      };
    case 'toxic':
      return {
        water: '#2f684f',
        shallow: '#5f9f6c',
        land: '#84b94a',
        mountain: '#547746',
        ice: '#d8f0be',
      };
    case 'abyssal':
      return {
        water: '#1d2232',
        shallow: '#2f3850',
        land: '#383f4e',
        mountain: '#5a5f6d',
        ice: '#b9becb',
      };
  }
}

function pickTerrainProfile(profile: PlanetVisualProfile): TerrainProfileSettings {
  switch (profile.archetype) {
    case 'oceanic':
      return {
        type: 'smooth',
        elevationCap: 0.2,
        terrainSmoothing: 0.84,
        ridgeAttenuation: 0.28,
        detailAttenuation: 0.21,
        macroScale: 0.74,
        ridgedScale: 0.44,
        continentThreshold: 0.6,
        continentSharpness: 0.11,
        continentDrift: 0.05,
        trenchDepth: 0.08,
        biomeHarshness: 0.14,
      };
    case 'icy':
    case 'clouded':
      return {
        type: 'smooth',
        elevationCap: 0.21,
        terrainSmoothing: 0.86,
        ridgeAttenuation: 0.32,
        detailAttenuation: 0.2,
        macroScale: 0.78,
        ridgedScale: 0.46,
        continentThreshold: 0.56,
        continentSharpness: 0.12,
        continentDrift: 0.08,
        trenchDepth: 0.09,
        biomeHarshness: 0.2,
      };
    case 'arid':
      return {
        type: 'rough',
        elevationCap: 0.25,
        terrainSmoothing: 0.62,
        ridgeAttenuation: 0.62,
        detailAttenuation: 0.38,
        macroScale: 0.98,
        ridgedScale: 0.66,
        continentThreshold: 0.47,
        continentSharpness: 0.2,
        continentDrift: 0.2,
        trenchDepth: 0.12,
        biomeHarshness: 0.66,
      };
    case 'lush':
    case 'superterran':
      return {
        type: 'continental',
        elevationCap: 0.24,
        terrainSmoothing: 0.74,
        ridgeAttenuation: 0.54,
        detailAttenuation: 0.3,
        macroScale: 0.9,
        ridgedScale: 0.57,
        continentThreshold: 0.52,
        continentSharpness: 0.16,
        continentDrift: 0.11,
        trenchDepth: 0.1,
        biomeHarshness: 0.28,
      };
    case 'volcanic':
      return {
        type: 'extreme',
        elevationCap: 0.28,
        terrainSmoothing: 0.54,
        ridgeAttenuation: 0.72,
        detailAttenuation: 0.5,
        macroScale: 1.04,
        ridgedScale: 0.74,
        continentThreshold: 0.45,
        continentSharpness: 0.24,
        continentDrift: 0.22,
        trenchDepth: 0.18,
        biomeHarshness: 0.86,
      };
    case 'dead':
      return {
        type: 'rough',
        elevationCap: 0.23,
        terrainSmoothing: 0.64,
        ridgeAttenuation: 0.56,
        detailAttenuation: 0.36,
        macroScale: 0.96,
        ridgedScale: 0.64,
        continentThreshold: 0.48,
        continentSharpness: 0.22,
        continentDrift: 0.16,
        trenchDepth: 0.15,
        biomeHarshness: 0.72,
      };
    case 'toxic':
    case 'exotic':
      return {
        type: 'extreme',
        elevationCap: 0.27,
        terrainSmoothing: 0.58,
        ridgeAttenuation: 0.7,
        detailAttenuation: 0.46,
        macroScale: 1.02,
        ridgedScale: 0.68,
        continentThreshold: 0.5,
        continentSharpness: 0.23,
        continentDrift: 0.24,
        trenchDepth: 0.14,
        biomeHarshness: 0.78,
      };
    case 'mineral':
      return {
        type: 'rough',
        elevationCap: 0.25,
        terrainSmoothing: 0.62,
        ridgeAttenuation: 0.65,
        detailAttenuation: 0.42,
        macroScale: 1,
        ridgedScale: 0.7,
        continentThreshold: 0.5,
        continentSharpness: 0.2,
        continentDrift: 0.18,
        trenchDepth: 0.12,
        biomeHarshness: 0.63,
      };
    case 'fragmented':
      return {
        type: 'fragmented',
        elevationCap: 0.26,
        terrainSmoothing: 0.6,
        ridgeAttenuation: 0.66,
        detailAttenuation: 0.44,
        macroScale: 1.06,
        ridgedScale: 0.72,
        continentThreshold: 0.57,
        continentSharpness: 0.28,
        continentDrift: 0.34,
        trenchDepth: 0.19,
        biomeHarshness: 0.68,
      };
  }

  const ruggedness =
    profile.relief.macroStrength * 0.55 + profile.relief.microStrength * 0.35 + profile.shape.ridgeWarp * 0.28;

  const rarity = ((profile.derivedSubSeeds.reliefSeed ^ (profile.derivedSubSeeds.shapeSeed >>> 3)) & 1023) / 1023;
  const rareExtremeGate = (profile.derivedSubSeeds.reliefSeed % 43 === 0 || profile.derivedSubSeeds.shapeSeed % 61 === 0) && rarity > 0.72;

  if (ruggedness < 0.55 && rarity < 0.48) {
    return {
      type: 'smooth',
      elevationCap: 0.19,
      terrainSmoothing: 0.82,
      ridgeAttenuation: 0.32,
      detailAttenuation: 0.24,
      macroScale: 0.8,
      ridgedScale: 0.48,
      continentThreshold: 0.55,
      continentSharpness: 0.14,
      continentDrift: 0.1,
      trenchDepth: 0.1,
      biomeHarshness: 0.24,
    };
  }

  if (rareExtremeGate) {
    return {
      type: 'extreme',
      elevationCap: 0.27,
      terrainSmoothing: 0.56,
      ridgeAttenuation: 0.68,
      detailAttenuation: 0.46,
      macroScale: 0.96,
      ridgedScale: 0.62,
      continentThreshold: 0.5,
      continentSharpness: 0.24,
      continentDrift: 0.24,
      trenchDepth: 0.16,
      biomeHarshness: 0.74,
    };
  }

  if (ruggedness > 0.88 || rarity > 0.86) {
    return {
      type: 'rough',
      elevationCap: 0.24,
      terrainSmoothing: 0.64,
      ridgeAttenuation: 0.54,
      detailAttenuation: 0.34,
      macroScale: 0.92,
      ridgedScale: 0.56,
      continentThreshold: 0.52,
      continentSharpness: 0.2,
      continentDrift: 0.17,
      trenchDepth: 0.12,
      biomeHarshness: 0.56,
    };
  }

  return {
    type: 'moderate',
    elevationCap: 0.23,
    terrainSmoothing: 0.7,
    ridgeAttenuation: 0.5,
    detailAttenuation: 0.34,
    macroScale: 0.9,
    ridgedScale: 0.6,
    continentThreshold: 0.52,
    continentSharpness: 0.16,
    continentDrift: 0.12,
    trenchDepth: 0.11,
    biomeHarshness: 0.42,
  };
}

export function mapProfileToProceduralUniforms(profile: PlanetVisualProfile): ProceduralPlanetUniforms {
  const climate = paletteClimateBias(profile.paletteFamily);
  const surfaceCategory = pickSurfaceCategory(profile, climate);
  const categoryColors = categoryPalette(surfaceCategory);

  const landBase = new THREE.Color(pickLandColor(profile.paletteFamily)).lerp(new THREE.Color(categoryColors.land), 0.4);
  const oceanBase = new THREE.Color(pickWaterColor(profile.paletteFamily)).lerp(new THREE.Color(categoryColors.water), 0.44);
  const categoryMountain = new THREE.Color(categoryColors.mountain);
  const categoryIce = new THREE.Color(categoryColors.ice);
  const categoryShallow = new THREE.Color(categoryColors.shallow);

  const hsl = { h: 0, s: 0, l: 0 };
  landBase.getHSL(hsl);

  const hue = (hsl.h + profile.color.hueShift / 360 + 1) % 1;
  const saturation = clamp(hsl.s * 0.64 + profile.color.saturation * 0.6 + climate.mineral * 0.06 + climate.oddity * 0.08, 0.16, 1);
  const lightness = clamp(hsl.l * 0.66 + profile.color.lightness * 0.46 - climate.dry * 0.06 + climate.cryo * 0.05, 0.12, 0.88);

  const lowlandColor = new THREE.Color().setHSL(
    hue,
    clamp(saturation * (0.74 + climate.lush * 0.18), 0.18, 0.92),
    clamp(lightness * (0.84 + climate.lush * 0.16), 0.2, 0.78),
  );
  const landColor = new THREE.Color().setHSL(
    (hue + (climate.dry - climate.lush) * 0.02 + 1) % 1,
    clamp(saturation * (0.7 + climate.dry * 0.2), 0.16, 0.92),
    clamp(lightness * (0.92 + climate.dry * 0.1), 0.22, 0.82),
  );
  const mountainColor = new THREE.Color().setHSL(
    (hue + climate.mineral * 0.025 + 1) % 1,
    clamp(saturation * (0.24 + climate.mineral * 0.17), 0.08, 0.58),
    clamp(lightness * (1.04 + climate.mineral * 0.21), 0.34, 0.9),
  );
  const iceColor = new THREE.Color().setHSL(
    (hue + 0.015 + climate.mineral * 0.02) % 1,
    clamp(saturation * (0.06 + climate.mineral * 0.06), 0.015, 0.2),
    clamp(lightness * (1.32 + climate.lush * 0.1), 0.68, 0.98),
  );

  const oceanColor = oceanBase
    .clone()
    .offsetHSL(profile.color.hueShift / 660, 0.01 - climate.dry * 0.04, -0.1 + climate.mineral * 0.03);
  const shallowWaterColor = oceanBase
    .clone()
    .offsetHSL(profile.color.hueShift / 780, 0.1 + climate.lush * 0.08, 0.12 - climate.dry * 0.05);
  const coastalColor = lowlandColor.clone().lerp(shallowWaterColor, 0.32);

  const isIcy = profile.materialFamily === 'icy';
  const isRocky = profile.materialFamily === 'rocky';
  const terrainProfile = applyMacroStyleToTerrain(pickTerrainProfile(profile), profile.macroStyle);

  const categoryOceanLevel: Record<SurfaceCategoryKind, number> = {
    ocean: 0.56,
    desert: 0.23,
    ice: 0.42,
    volcanic: 0.17,
    lush: 0.44,
    mineral: 0.3,
    barren: 0.15,
    toxic: 0.32,
    abyssal: 0.38,
  };
  const categoryMountainLevel: Record<SurfaceCategoryKind, number> = {
    ocean: 0.75,
    desert: 0.64,
    ice: 0.68,
    volcanic: 0.6,
    lush: 0.72,
    mineral: 0.66,
    barren: 0.62,
    toxic: 0.67,
    abyssal: 0.71,
  };
  const categorySimpleScale: Record<SurfaceCategoryKind, number> = {
    ocean: 0.82,
    desert: 0.76,
    ice: 0.68,
    volcanic: 0.88,
    lush: 0.8,
    mineral: 0.75,
    barren: 0.7,
    toxic: 0.77,
    abyssal: 0.73,
  };
  const categoryRidgedScale: Record<SurfaceCategoryKind, number> = {
    ocean: 0.6,
    desert: 0.56,
    ice: 0.5,
    volcanic: 0.74,
    lush: 0.58,
    mineral: 0.64,
    barren: 0.68,
    toxic: 0.6,
    abyssal: 0.66,
  };
  const archetypeOceanOffset: Record<PlanetVisualProfile['archetype'], number> = {
    oceanic: 0.09,
    icy: 0.04,
    arid: -0.1,
    lush: 0.03,
    volcanic: -0.13,
    dead: -0.08,
    toxic: -0.02,
    mineral: -0.07,
    clouded: 0.06,
    exotic: -0.01,
    fragmented: -0.11,
    superterran: 0.05,
  };
  const archetypeMountainOffset: Record<PlanetVisualProfile['archetype'], number> = {
    oceanic: -0.03,
    icy: -0.01,
    arid: 0.03,
    lush: 0.01,
    volcanic: 0.07,
    dead: 0.04,
    toxic: 0.03,
    mineral: 0.05,
    clouded: -0.02,
    exotic: 0.02,
    fragmented: 0.06,
    superterran: 0.01,
  };

  const rawMountainLevel = clamp(
    categoryMountainLevel[surfaceCategory] +
      archetypeMountainOffset[profile.archetype] +
      profile.relief.macroStrength * 0.1 +
      (isRocky ? 0.02 : 0) +
      climate.mineral * 0.02,
    0.6,
    0.92,
  );
  const rawOceanLevel = clamp(
    categoryOceanLevel[surfaceCategory] +
      archetypeOceanOffset[profile.archetype] +
      (profile.hydrology.oceanBias - 0.5) * 0.18 +
      (0.5 - profile.color.accentMix) * 0.08 +
      (isIcy ? 0.03 : 0) -
      climate.dry * 0.03,
    0.06,
    0.68,
  );
  const minLandRatio = Math.max(minimumLandRatioForCategory(surfaceCategory), profile.hydrology.minLandRatio);
  const estimatedLandRatio = estimateLandRatio(
    rawOceanLevel,
    profile.relief.macroStrength,
    profile.relief.microStrength,
    0.45 + profile.shape.ridgeWarp * 0.4 + profile.relief.craterDensity * 0.1,
    terrainProfile.type,
  );
  const guardedOceanLevel = rawOceanLevel - Math.max(0, minLandRatio - estimatedLandRatio) * 1.18;
  const maxOceanLevelFromHydrology = clamp(profile.hydrology.maxOceanRatio, 0.2, 0.68);
  const finalOceanLevel = clamp(guardedOceanLevel, 0.06, Math.min(maxOceanLevelFromHydrology, rawMountainLevel - 0.16));

  const landSurfaceColor = landColor.clone().lerp(new THREE.Color(categoryColors.land), 0.38).lerp(coastalColor, 0.14);
  const mountainSurfaceColor = mountainColor.clone().lerp(categoryMountain, 0.56);
  const iceSurfaceColor = iceColor.clone().lerp(categoryIce, 0.62);
  const shallowSurfaceColor = shallowWaterColor.clone().lerp(categoryShallow, 0.46);

  return {
    shapeSeed: profile.derivedSubSeeds.shapeSeed >>> 0,
    reliefSeed: profile.derivedSubSeeds.reliefSeed >>> 0,
    baseColor: colorToTuple(oceanColor),
    shallowWaterColor: colorToTuple(shallowSurfaceColor),
    landColor: colorToTuple(landSurfaceColor),
    mountainColor: colorToTuple(mountainSurfaceColor),
    iceColor: colorToTuple(iceSurfaceColor),
    radius: clamp(profile.shape.radius * 0.98, 1.86, 5.1),
    meshResolution: Math.round(clamp(15 + profile.shape.radius * 3.6 + profile.relief.macroStrength * 7, 16, 25)),
    oceanLevel: finalOceanLevel,
    mountainLevel: rawMountainLevel,
    simpleFrequency: clamp(profile.shape.wobbleFrequency * 0.9 + 0.55, 0.8, 4.2),
    simpleStrength: clamp(
      (profile.relief.macroStrength * 0.62 + profile.shape.wobbleAmplitude * 0.35) *
        terrainProfile.macroScale *
        categorySimpleScale[surfaceCategory],
      0.08,
      0.7,
    ),
    ridgedFrequency: clamp(profile.shape.wobbleFrequency * 2.0 + 1.4, 1.8, 8.2),
    ridgedStrength: clamp(
      (profile.relief.microStrength * 0.9 + profile.shape.ridgeWarp * 0.14) *
        terrainProfile.ridgedScale *
        categoryRidgedScale[surfaceCategory],
      0.04,
      0.62,
    ),
    maskStrength: clamp(0.45 + profile.shape.ridgeWarp * 0.4 + profile.relief.craterDensity * 0.1, 0.3, 0.95),
    surfaceCategory,
    terrainProfile: terrainProfile.type,
    elevationCap: terrainProfile.elevationCap,
    terrainSmoothing: terrainProfile.terrainSmoothing,
    ridgeAttenuation: terrainProfile.ridgeAttenuation,
    detailAttenuation: terrainProfile.detailAttenuation,
    continentThreshold: terrainProfile.continentThreshold,
    continentSharpness: terrainProfile.continentSharpness,
    continentDrift: terrainProfile.continentDrift,
    trenchDepth: terrainProfile.trenchDepth,
    biomeHarshness: terrainProfile.biomeHarshness,
    roughness: clamp(profile.relief.roughness * 0.9 + 0.05, 0.2, 1),
    metalness: clamp(profile.materialFamily === 'metallic' ? 0.35 : profile.materialFamily === 'icy' ? 0.18 : 0.08, 0.05, 0.45),
    atmosphereEnabled: profile.atmosphere.enabled,
    atmosphereIntensity: profile.atmosphere.enabled ? clamp(profile.atmosphere.intensity * (0.86 + climate.oddity * 0.24), 0.12, 1) : 0,
    atmosphereThickness: profile.atmosphere.enabled ? clamp(profile.atmosphere.thickness * (0.86 + climate.cryo * 0.24), 0.015, 0.14) : 0,
    atmosphereColor: colorToTuple(
      new THREE.Color().setHSL(
        (hue + profile.atmosphere.tintShift / 360 + 1) % 1,
        clamp(saturation * (0.42 + climate.oddity * 0.28), 0.06, 0.9),
        clamp(lightness * (0.68 + climate.cryo * 0.24), 0.14, 0.78),
      ),
    ),
  };
}
