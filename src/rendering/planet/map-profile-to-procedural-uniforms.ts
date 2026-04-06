import * as THREE from 'three';

import { getArchetypeDefinition, PALETTE_LIBRARY } from '@/domain/world/planet-archetype-rules';
import type { PlanetVisualProfile } from '@/domain/world/planet-visual.types';

import type { ProceduralPlanetUniforms, SurfaceCategoryKind, TerrainProfileKind } from './types';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function colorToTuple(color: THREE.Color): [number, number, number] {
  return [color.r, color.g, color.b];
}

const SURFACE_PALETTES: Record<SurfaceCategoryKind, { shallow: string; mountain: string; ice: string }> = {
  ocean: { shallow: '#64afd2', mountain: '#8da899', ice: '#e6f3ff' },
  lush: { shallow: '#5fb3b8', mountain: '#7f9368', ice: '#dfead8' },
  desert: { shallow: '#7e7052', mountain: '#8b6847', ice: '#d8d2be' },
  ice: { shallow: '#84abc8', mountain: '#ccdbe7', ice: '#f2fbff' },
  volcanic: { shallow: '#4f433f', mountain: '#3c2a2a', ice: '#b8aba0' },
  mineral: { shallow: '#6b6b61', mountain: '#938777', ice: '#ddd4c7' },
  barren: { shallow: '#71675e', mountain: '#6b5d55', ice: '#ccc0b4' },
  toxic: { shallow: '#7f9048', mountain: '#567649', ice: '#d6efbc' },
  abyssal: { shallow: '#2f3850', mountain: '#5a5f6d', ice: '#b9becb' },
};

const SURFACE_TERRAIN: Record<SurfaceCategoryKind, {
  terrainProfile: TerrainProfileKind;
  elevationCap: number;
  terrainSmoothing: number;
  ridgeAttenuation: number;
  detailAttenuation: number;
  continentThreshold: number;
  continentSharpness: number;
  continentDrift: number;
  trenchDepth: number;
  biomeHarshness: number;
  mountainBase: number;
}> = {
  ocean: {
    terrainProfile: 'smooth', elevationCap: 0.21, terrainSmoothing: 0.84, ridgeAttenuation: 0.3, detailAttenuation: 0.22,
    continentThreshold: 0.6, continentSharpness: 0.12, continentDrift: 0.08, trenchDepth: 0.14, biomeHarshness: 0.2, mountainBase: 0.9,
  },
  lush: {
    terrainProfile: 'continental', elevationCap: 0.24, terrainSmoothing: 0.72, ridgeAttenuation: 0.54, detailAttenuation: 0.32,
    continentThreshold: 0.52, continentSharpness: 0.16, continentDrift: 0.14, trenchDepth: 0.11, biomeHarshness: 0.32, mountainBase: 0.74,
  },
  desert: {
    terrainProfile: 'rough', elevationCap: 0.25, terrainSmoothing: 0.6, ridgeAttenuation: 0.64, detailAttenuation: 0.38,
    continentThreshold: 0.48, continentSharpness: 0.2, continentDrift: 0.2, trenchDepth: 0.1, biomeHarshness: 0.66, mountainBase: 0.68,
  },
  ice: {
    terrainProfile: 'smooth', elevationCap: 0.22, terrainSmoothing: 0.84, ridgeAttenuation: 0.32, detailAttenuation: 0.22,
    continentThreshold: 0.56, continentSharpness: 0.14, continentDrift: 0.1, trenchDepth: 0.12, biomeHarshness: 0.22, mountainBase: 0.72,
  },
  volcanic: {
    terrainProfile: 'extreme', elevationCap: 0.28, terrainSmoothing: 0.52, ridgeAttenuation: 0.74, detailAttenuation: 0.5,
    continentThreshold: 0.44, continentSharpness: 0.25, continentDrift: 0.24, trenchDepth: 0.16, biomeHarshness: 0.84, mountainBase: 0.72,
  },
  mineral: {
    terrainProfile: 'rough', elevationCap: 0.25, terrainSmoothing: 0.6, ridgeAttenuation: 0.66, detailAttenuation: 0.42,
    continentThreshold: 0.5, continentSharpness: 0.2, continentDrift: 0.18, trenchDepth: 0.12, biomeHarshness: 0.64, mountainBase: 0.71,
  },
  barren: {
    terrainProfile: 'fragmented', elevationCap: 0.26, terrainSmoothing: 0.58, ridgeAttenuation: 0.68, detailAttenuation: 0.44,
    continentThreshold: 0.57, continentSharpness: 0.28, continentDrift: 0.34, trenchDepth: 0.18, biomeHarshness: 0.7, mountainBase: 0.7,
  },
  toxic: {
    terrainProfile: 'extreme', elevationCap: 0.27, terrainSmoothing: 0.56, ridgeAttenuation: 0.7, detailAttenuation: 0.46,
    continentThreshold: 0.5, continentSharpness: 0.23, continentDrift: 0.22, trenchDepth: 0.14, biomeHarshness: 0.76, mountainBase: 0.72,
  },
  abyssal: {
    terrainProfile: 'moderate', elevationCap: 0.24, terrainSmoothing: 0.66, ridgeAttenuation: 0.58, detailAttenuation: 0.36,
    continentThreshold: 0.53, continentSharpness: 0.2, continentDrift: 0.16, trenchDepth: 0.14, biomeHarshness: 0.54, mountainBase: 0.74,
  },
};

function patternBandingStrength(rule: 'forbidden' | 'subtle' | 'limited' | 'allowed', wobbleFrequency: number): number {
  if (rule === 'allowed') return clamp(0.3 + wobbleFrequency * 0.03, 0.3, 0.45);
  if (rule === 'subtle') return clamp(0.02 + wobbleFrequency * 0.003, 0.02, 0.06);
  return 0;
}

function patternThermalStrength(rule: 'forbidden' | 'subtle' | 'limited' | 'allowed', macroStrength: number): number {
  if (rule === 'allowed') return clamp(0.64 + macroStrength * 0.3, 0.65, 0.95);
  if (rule === 'limited') return clamp(0.16 + macroStrength * 0.28, 0.14, 0.48);
  return 0;
}

export function mapProfileToProceduralUniforms(profile: PlanetVisualProfile): ProceduralPlanetUniforms {
  const definition = getArchetypeDefinition(profile.archetype);
  const palette = PALETTE_LIBRARY[profile.paletteFamily];
  if (!definition.allowedPalettes.includes(profile.paletteFamily) || palette.owner !== profile.archetype) {
    throw new Error(`Invalid palette ${profile.paletteFamily} for archetype ${profile.archetype}`);
  }

  const surfaceCategory = definition.surfaceRules.allowedSurfaceTypes[
    profile.derivedSubSeeds.reliefSeed % definition.surfaceRules.allowedSurfaceTypes.length
  ] as SurfaceCategoryKind;

  const surfacePalette = SURFACE_PALETTES[surfaceCategory];
  const terrain = SURFACE_TERRAIN[surfaceCategory];

  const waterBase = new THREE.Color(palette.water);
  const landBase = new THREE.Color(palette.land);

  const hueNormalized = ((profile.color.hueShift + 180) % 360) / 360;
  const hueOffset = hueNormalized - 0.5;

  const oceanColor = waterBase.clone().offsetHSL(hueOffset * 0.06, -0.03, -0.06);
  const shallowColor = waterBase.clone().lerp(new THREE.Color(surfacePalette.shallow), 0.52);
  const landColor = landBase.clone().offsetHSL(hueOffset * 0.04, 0.04, 0.02);
  const mountainColor = landBase.clone().lerp(new THREE.Color(surfacePalette.mountain), 0.62);
  const iceColor = new THREE.Color(surfacePalette.ice);

  const oceanLevel = clamp(profile.hydrology.oceanBias, definition.hydrology.oceanMin, definition.hydrology.oceanMax);
  const mountainLevel = clamp(
    Math.max(terrain.mountainBase, oceanLevel + 0.18 + profile.relief.macroStrength * 0.06),
    0.6,
    0.92,
  );

  const craterStrength = definition.patternRules.crater === 'none'
    ? 0.02
    : definition.patternRules.crater === 'light'
      ? clamp(profile.relief.craterDensity * 0.52 + 0.08, 0.02, 0.46)
      : clamp(profile.relief.craterDensity * 1.1 + 0.18, 0.3, 1);

  const bandingStrength = patternBandingStrength(definition.patternRules.banding, profile.shape.wobbleFrequency);
  const thermalActivity = patternThermalStrength(definition.patternRules.thermal, profile.relief.macroStrength);

  return {
    shapeSeed: profile.derivedSubSeeds.shapeSeed >>> 0,
    reliefSeed: profile.derivedSubSeeds.reliefSeed >>> 0,
    baseColor: colorToTuple(oceanColor),
    shallowWaterColor: colorToTuple(shallowColor),
    landColor: colorToTuple(landColor),
    mountainColor: colorToTuple(mountainColor),
    iceColor: colorToTuple(iceColor),
    radius: clamp(profile.shape.radius * 0.98, 1.86, 5.1),
    meshResolution: Math.round(clamp(15 + profile.shape.radius * 3.6 + profile.relief.macroStrength * 7, 16, 25)),
    oceanLevel,
    mountainLevel,
    minLandRatio: profile.hydrology.minLandRatio,
    simpleFrequency: clamp(profile.shape.wobbleFrequency * 0.88 + 0.58, 0.8, 4.2),
    simpleStrength: clamp(profile.relief.macroStrength * 0.86 + profile.shape.wobbleAmplitude * 0.28, 0.08, 0.7),
    ridgedFrequency: clamp(profile.shape.wobbleFrequency * 2 + 1.4, 1.8, 8.2),
    ridgedStrength: clamp(profile.relief.microStrength * 1.05 + profile.shape.ridgeWarp * 0.08, 0.04, 0.62),
    maskStrength: clamp(0.44 + profile.shape.ridgeWarp * 0.36 + profile.relief.craterDensity * 0.12, 0.3, 0.95),
    surfaceCategory,
    terrainProfile: terrain.terrainProfile,
    elevationCap: terrain.elevationCap,
    terrainSmoothing: terrain.terrainSmoothing,
    ridgeAttenuation: terrain.ridgeAttenuation,
    detailAttenuation: terrain.detailAttenuation,
    continentThreshold: terrain.continentThreshold,
    continentSharpness: terrain.continentSharpness,
    continentDrift: terrain.continentDrift,
    trenchDepth: terrain.trenchDepth,
    biomeHarshness: terrain.biomeHarshness,
    craterStrength,
    thermalActivity,
    bandingStrength,
    bandingFrequency: bandingStrength > 0 ? clamp(4.6 + profile.shape.wobbleFrequency * 0.4, 2.8, 8.2) : 2.2,
    colorContrast: clamp(1.06 + profile.relief.roughness * 0.18 + (surfaceCategory === 'volcanic' ? 0.06 : 0), 1.02, 1.34),
    roughness: clamp(profile.relief.roughness * 0.9 + 0.05, 0.2, 1),
    metalness: clamp(profile.materialFamily === 'metallic' ? 0.35 : profile.materialFamily === 'icy' ? 0.18 : 0.08, 0.05, 0.45),
    atmosphereEnabled: profile.atmosphere.enabled,
    atmosphereIntensity: profile.atmosphere.enabled ? clamp(profile.atmosphere.intensity, 0.12, 1) : 0,
    atmosphereThickness: profile.atmosphere.enabled ? clamp(profile.atmosphere.thickness, 0.015, 0.14) : 0,
    atmosphereColor: colorToTuple(
      landBase.clone().lerp(oceanColor, 0.58).offsetHSL(profile.atmosphere.tintShift / 360, 0, 0.08),
    ),
  };
}
