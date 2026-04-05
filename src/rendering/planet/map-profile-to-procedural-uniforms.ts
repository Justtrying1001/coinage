import * as THREE from 'three';

import type { PlanetVisualProfile } from '@/domain/world/planet-visual.types';

import type { ProceduralPlanetUniforms, TerrainProfileKind } from './types';

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
      elevationCap: 0.33,
      terrainSmoothing: 0.45,
      ridgeAttenuation: 0.9,
      detailAttenuation: 0.72,
      macroScale: 1.08,
      ridgedScale: 0.88,
    };
  }

  if (ruggedness > 0.88 || rarity > 0.86) {
    return {
      type: 'rough',
      elevationCap: 0.27,
      terrainSmoothing: 0.58,
      ridgeAttenuation: 0.66,
      detailAttenuation: 0.44,
      macroScale: 0.98,
      ridgedScale: 0.72,
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
  const landBase = new THREE.Color(pickLandColor(profile.paletteFamily));
  const oceanBase = new THREE.Color(pickWaterColor(profile.paletteFamily));

  const hsl = { h: 0, s: 0, l: 0 };
  landBase.getHSL(hsl);

  const hue = (hsl.h + profile.color.hueShift / 360 + 1) % 1;
  const saturation = clamp(hsl.s * 0.76 + profile.color.saturation * 0.42, 0.2, 0.95);
  const lightness = clamp(hsl.l * 0.74 + profile.color.lightness * 0.38, 0.2, 0.8);

  const landColor = new THREE.Color().setHSL(hue, saturation, lightness);
  const mountainColor = new THREE.Color().setHSL(
    hue,
    clamp(saturation * 0.3 + 0.05, 0.1, 0.55),
    clamp(lightness * 1.22, 0.34, 0.9),
  );
  const iceColor = new THREE.Color().setHSL(
    hue,
    clamp(saturation * 0.09, 0.015, 0.18),
    clamp(lightness * 1.38, 0.66, 0.97),
  );

  const oceanColor = oceanBase.clone().offsetHSL(profile.color.hueShift / 720, -0.02, -0.07);
  const shallowWaterColor = oceanBase.clone().offsetHSL(profile.color.hueShift / 840, 0.06, 0.08);

  const isIcy = profile.materialFamily === 'icy';
  const isRocky = profile.materialFamily === 'rocky';
  const terrainProfile = pickTerrainProfile(profile);

  return {
    shapeSeed: profile.derivedSubSeeds.shapeSeed >>> 0,
    reliefSeed: profile.derivedSubSeeds.reliefSeed >>> 0,
    baseColor: colorToTuple(oceanColor),
    shallowWaterColor: colorToTuple(shallowWaterColor),
    landColor: colorToTuple(landColor),
    mountainColor: colorToTuple(mountainColor),
    iceColor: colorToTuple(iceColor),
    radius: clamp(profile.shape.radius * 0.84, 0.55, 2.2),
    meshResolution: Math.round(clamp(20 + profile.shape.radius * 6 + profile.relief.macroStrength * 12, 22, 34)),
    oceanLevel: clamp(0.38 + (0.5 - profile.color.accentMix) * 0.18 + (isIcy ? 0.08 : 0), 0.25, 0.62),
    mountainLevel: clamp(0.7 + profile.relief.macroStrength * 0.18 + (isRocky ? 0.03 : 0), 0.66, 0.92),
    simpleFrequency: clamp(profile.shape.wobbleFrequency * 0.9 + 0.55, 0.8, 4.2),
    simpleStrength: clamp(
      (profile.relief.macroStrength * 0.72 + profile.shape.wobbleAmplitude * 0.45) * terrainProfile.macroScale,
      0.08,
      0.76,
    ),
    ridgedFrequency: clamp(profile.shape.wobbleFrequency * 2.0 + 1.4, 1.8, 8.2),
    ridgedStrength: clamp(
      (profile.relief.microStrength * 1.12 + profile.shape.ridgeWarp * 0.22) * terrainProfile.ridgedScale,
      0.04,
      0.72,
    ),
    maskStrength: clamp(0.45 + profile.shape.ridgeWarp * 0.4 + profile.relief.craterDensity * 0.1, 0.3, 0.95),
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
        clamp(saturation * 0.72, 0.1, 0.9),
        clamp(lightness * 0.88, 0.22, 0.86),
      ),
    ),
  };
}
