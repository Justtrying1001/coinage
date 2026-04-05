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
      return '#3f77c7';
    case 'violet-ash':
      return '#4f5fa6';
    case 'ember-dust':
      return '#2f5a7e';
    case 'verdant-umber':
      return '#3c7f74';
    case 'rose-quartz':
      return '#5968a8';
    default:
      return '#2a659a';
  }
}

function pickLandColor(palette: PlanetVisualProfile['paletteFamily']): string {
  switch (palette) {
    case 'ember-dust':
      return '#8f714f';
    case 'basalt-moss':
      return '#65795a';
    case 'cobalt-ice':
      return '#6f888b';
    case 'sulfur-stone':
      return '#9e8751';
    case 'violet-ash':
      return '#7b6f86';
    case 'verdant-umber':
      return '#667f57';
    case 'rose-quartz':
      return '#9b7687';
  }
}

function paletteClimateBias(palette: PlanetVisualProfile['paletteFamily']): { dry: number; lush: number; mineral: number } {
  switch (palette) {
    case 'ember-dust':
      return { dry: 0.8, lush: 0.1, mineral: 0.6 };
    case 'basalt-moss':
      return { dry: 0.3, lush: 0.7, mineral: 0.55 };
    case 'cobalt-ice':
      return { dry: 0.2, lush: 0.25, mineral: 0.65 };
    case 'sulfur-stone':
      return { dry: 0.7, lush: 0.15, mineral: 0.75 };
    case 'violet-ash':
      return { dry: 0.55, lush: 0.25, mineral: 0.7 };
    case 'verdant-umber':
      return { dry: 0.35, lush: 0.78, mineral: 0.45 };
    case 'rose-quartz':
      return { dry: 0.45, lush: 0.45, mineral: 0.52 };
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
}

function pickSurfaceCategory(profile: PlanetVisualProfile, climate: { dry: number; lush: number; mineral: number }): SurfaceCategoryKind {
  if (profile.materialFamily === 'icy') {
    return 'ice';
  }

  if (profile.materialFamily === 'metallic') {
    return climate.dry > 0.6 ? 'volcanic' : 'mineral';
  }

  if (profile.materialFamily === 'dusty') {
    return climate.lush > 0.55 ? 'lush' : 'desert';
  }

  if (profile.color.accentMix > 0.72 && climate.lush > 0.5) {
    return 'ocean';
  }

  if (climate.lush > 0.66) {
    return 'lush';
  }

  if (climate.dry > 0.68) {
    return 'desert';
  }

  return climate.mineral > 0.62 ? 'mineral' : 'ocean';
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
  }
}

function pickTerrainProfile(profile: PlanetVisualProfile): TerrainProfileSettings {
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
  };
}

export function mapProfileToProceduralUniforms(profile: PlanetVisualProfile): ProceduralPlanetUniforms {
  const climate = paletteClimateBias(profile.paletteFamily);
  const surfaceCategory = pickSurfaceCategory(profile, climate);
  const categoryColors = categoryPalette(surfaceCategory);

  const landBase = new THREE.Color(pickLandColor(profile.paletteFamily)).lerp(new THREE.Color(categoryColors.land), 0.72);
  const oceanBase = new THREE.Color(pickWaterColor(profile.paletteFamily)).lerp(new THREE.Color(categoryColors.water), 0.78);
  const categoryMountain = new THREE.Color(categoryColors.mountain);
  const categoryIce = new THREE.Color(categoryColors.ice);
  const categoryShallow = new THREE.Color(categoryColors.shallow);

  const hsl = { h: 0, s: 0, l: 0 };
  landBase.getHSL(hsl);

  const hue = (hsl.h + profile.color.hueShift / 360 + 1) % 1;
  const saturation = clamp(hsl.s * 0.72 + profile.color.saturation * 0.46 + climate.mineral * 0.07, 0.2, 0.98);
  const lightness = clamp(hsl.l * 0.7 + profile.color.lightness * 0.4, 0.18, 0.84);

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
  const terrainProfile = pickTerrainProfile(profile);

  const categoryOceanLevel: Record<SurfaceCategoryKind, number> = {
    ocean: 0.6,
    desert: 0.28,
    ice: 0.5,
    volcanic: 0.26,
    lush: 0.46,
    mineral: 0.34,
  };
  const categoryMountainLevel: Record<SurfaceCategoryKind, number> = {
    ocean: 0.74,
    desert: 0.66,
    ice: 0.7,
    volcanic: 0.64,
    lush: 0.72,
    mineral: 0.68,
  };
  const categorySimpleScale: Record<SurfaceCategoryKind, number> = {
    ocean: 0.82,
    desert: 0.78,
    ice: 0.7,
    volcanic: 0.86,
    lush: 0.8,
    mineral: 0.76,
  };
  const categoryRidgedScale: Record<SurfaceCategoryKind, number> = {
    ocean: 0.62,
    desert: 0.58,
    ice: 0.54,
    volcanic: 0.72,
    lush: 0.6,
    mineral: 0.64,
  };

  const landSurfaceColor = landColor.clone().lerp(new THREE.Color(categoryColors.land), 0.72).lerp(coastalColor, 0.15);
  const mountainSurfaceColor = mountainColor.clone().lerp(categoryMountain, 0.82);
  const iceSurfaceColor = iceColor.clone().lerp(categoryIce, 0.86);
  const shallowSurfaceColor = shallowWaterColor.clone().lerp(categoryShallow, 0.8);

  return {
    shapeSeed: profile.derivedSubSeeds.shapeSeed >>> 0,
    reliefSeed: profile.derivedSubSeeds.reliefSeed >>> 0,
    baseColor: colorToTuple(oceanColor),
    shallowWaterColor: colorToTuple(shallowSurfaceColor),
    landColor: colorToTuple(landSurfaceColor),
    mountainColor: colorToTuple(mountainSurfaceColor),
    iceColor: colorToTuple(iceSurfaceColor),
    radius: clamp(profile.shape.radius * 0.97, 1.1, 4.6),
    meshResolution: Math.round(clamp(15 + profile.shape.radius * 3.6 + profile.relief.macroStrength * 7, 16, 24)),
    oceanLevel: clamp(
      categoryOceanLevel[surfaceCategory] +
        (0.5 - profile.color.accentMix) * 0.08 +
        (isIcy ? 0.03 : 0) -
        climate.dry * 0.03,
      0.24,
      0.64,
    ),
    mountainLevel: clamp(
      categoryMountainLevel[surfaceCategory] + profile.relief.macroStrength * 0.1 + (isRocky ? 0.02 : 0) + climate.mineral * 0.02,
      0.64,
      0.9,
    ),
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
    roughness: clamp(profile.relief.roughness * 0.9 + 0.05, 0.2, 1),
    metalness: clamp(profile.materialFamily === 'metallic' ? 0.35 : profile.materialFamily === 'icy' ? 0.18 : 0.08, 0.05, 0.45),
    atmosphereEnabled: profile.atmosphere.enabled,
    atmosphereIntensity: profile.atmosphere.enabled ? clamp(profile.atmosphere.intensity, 0.16, 0.95) : 0,
    atmosphereThickness: profile.atmosphere.enabled ? clamp(profile.atmosphere.thickness, 0.02, 0.12) : 0,
    atmosphereColor: colorToTuple(
      new THREE.Color().setHSL(
        (hue + profile.atmosphere.tintShift / 360 + 1) % 1,
        clamp(saturation * 0.52, 0.08, 0.72),
        clamp(lightness * 0.78, 0.2, 0.76),
      ),
    ),
  };
}
