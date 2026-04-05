import * as THREE from 'three';

import type { PlanetVisualProfile } from '@/domain/world/planet-visual.types';

import type { ProceduralPlanetUniforms } from './types';

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

export function mapProfileToProceduralUniforms(profile: PlanetVisualProfile): ProceduralPlanetUniforms {
  const landBase = new THREE.Color(pickLandColor(profile.paletteFamily));
  const oceanBase = new THREE.Color(pickWaterColor(profile.paletteFamily));

  const hsl = { h: 0, s: 0, l: 0 };
  landBase.getHSL(hsl);

  const hue = (hsl.h + profile.color.hueShift / 360 + 1) % 1;
  const saturation = clamp(hsl.s * 0.7 + profile.color.saturation * 0.4, 0.18, 0.92);
  const lightness = clamp(hsl.l * 0.7 + profile.color.lightness * 0.35, 0.2, 0.82);

  const landColor = new THREE.Color().setHSL(hue, saturation, lightness);
  const mountainColor = new THREE.Color().setHSL(hue, clamp(saturation * 0.35, 0.08, 0.6), clamp(lightness * 1.28, 0.35, 0.92));
  const iceColor = new THREE.Color().setHSL(hue, clamp(saturation * 0.12, 0.02, 0.2), clamp(lightness * 1.35, 0.62, 0.97));

  const oceanColor = oceanBase.clone().offsetHSL(profile.color.hueShift / 720, 0, -0.05);
  const shallowWaterColor = oceanBase.clone().offsetHSL(profile.color.hueShift / 840, 0.04, 0.06);

  const isIcy = profile.materialFamily === 'icy';
  const isRocky = profile.materialFamily === 'rocky';

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
    simpleStrength: clamp(profile.relief.macroStrength * 0.85 + profile.shape.wobbleAmplitude * 0.6, 0.08, 0.9),
    ridgedFrequency: clamp(profile.shape.wobbleFrequency * 2.0 + 1.4, 1.8, 8.2),
    ridgedStrength: clamp(profile.relief.microStrength * 1.8 + profile.shape.ridgeWarp * 0.35, 0.06, 0.95),
    maskStrength: clamp(0.45 + profile.shape.ridgeWarp * 0.4 + profile.relief.craterDensity * 0.1, 0.3, 0.95),
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
