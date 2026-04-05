import * as THREE from 'three';

import type { PlanetVisualProfile } from '@/domain/world/planet-visual.types';

import type { ProceduralPlanetUniforms } from './types';

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

function colorToTuple(color: THREE.Color): [number, number, number] {
  return [color.r, color.g, color.b];
}

const PALETTE_BASE_COLORS: Record<PlanetVisualProfile['paletteFamily'], string> = {
  'ember-dust': '#c76b4c',
  'basalt-moss': '#5f6956',
  'cobalt-ice': '#7fa5d6',
  'sulfur-stone': '#ad9a52',
  'violet-ash': '#8f78a8',
};

export function mapProfileToProceduralUniforms(profile: PlanetVisualProfile): ProceduralPlanetUniforms {
  const base = new THREE.Color(PALETTE_BASE_COLORS[profile.paletteFamily]);
  const hsl = { h: 0, s: 0, l: 0 };
  base.getHSL(hsl);

  const hue = (hsl.h + profile.color.hueShift / 360 + 1) % 1;
  const saturation = clamp(profile.color.saturation * 0.84 + hsl.s * 0.35, 0.18, 0.95);
  const lightness = clamp(profile.color.lightness * 0.82 + hsl.l * 0.28, 0.16, 0.84);

  const baseColor = new THREE.Color().setHSL(hue, saturation, lightness);
  const accentColor = new THREE.Color().setHSL(
    (hue + 0.06 + profile.color.accentMix * 0.08) % 1,
    clamp(saturation * 0.75, 0.18, 0.95),
    clamp(lightness * 1.05, 0.22, 0.9),
  );

  const atmosphereHue = (hue + profile.atmosphere.tintShift / 360 + 1) % 1;
  const atmosphereColor = new THREE.Color().setHSL(
    atmosphereHue,
    clamp(saturation * 0.78, 0.12, 0.9),
    clamp(lightness * 0.92, 0.2, 0.88),
  );

  return {
    baseColor: colorToTuple(baseColor),
    accentColor: colorToTuple(accentColor),
    seedA: (profile.derivedSubSeeds.shapeSeed >>> 0) / 0xffffffff,
    seedB: (profile.derivedSubSeeds.reliefSeed >>> 0) / 0xffffffff,
    radius: clamp(profile.shape.radius * 0.82, 0.55, 2.2),
    wobbleFrequency: clamp(profile.shape.wobbleFrequency, 0.5, 4.0),
    wobbleAmplitude: clamp(profile.shape.wobbleAmplitude, 0.0, 0.24),
    ridgeWarp: clamp(profile.shape.ridgeWarp, 0.0, 1.0),
    macroStrength: clamp(profile.relief.macroStrength, 0.05, 0.75),
    microStrength: clamp(profile.relief.microStrength, 0.01, 0.45),
    roughness: clamp(profile.relief.roughness, 0.15, 1.0),
    craterDensity: clamp(profile.relief.craterDensity, 0.0, 1.0),
    atmosphereEnabled: profile.atmosphere.enabled,
    atmosphereIntensity: profile.atmosphere.enabled ? clamp(profile.atmosphere.intensity, 0.0, 1.0) : 0,
    atmosphereThickness: profile.atmosphere.enabled ? clamp(profile.atmosphere.thickness, 0.0, 0.12) : 0,
    atmosphereColor: colorToTuple(atmosphereColor),
  };
}
