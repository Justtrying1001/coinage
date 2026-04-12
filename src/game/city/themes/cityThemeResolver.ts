import { Color } from 'three';
import { createPlanetGenerationConfig } from '@/game/planet/presets/archetypes';
import type { PlanetVisualProfile } from '@/game/render/types';
import type { CityTheme } from '@/game/city/themes/cityThemePresets';
import { CITY_THEME_PRESETS } from '@/game/city/themes/cityThemePresets';

export function resolveCityTheme(seed: number, profile: PlanetVisualProfile): CityTheme {
  const generation = createPlanetGenerationConfig(seed, profile);
  const fallback = profile.archetype === 'frozen' ? CITY_THEME_PRESETS.frozen : CITY_THEME_PRESETS.neutral;
  const low = sampleGradient(generation.elevationGradient, 0.2);
  const mid = sampleGradient(generation.elevationGradient, 0.56);
  const high = sampleGradient(generation.elevationGradient, 0.92);
  const depth = sampleGradient(generation.depthGradient, 0.58);

  const terrainMid = mid.clone().lerp(high, 0.24);
  const terrainLow = low.clone().lerp(depth, 0.18);
  const terrainHigh = high.clone().lerp(new Color(0xe7f6ff), profile.archetype === 'frozen' ? 0.32 : 0.1);

  return {
    ...fallback,
    terrainLowColor: terrainLow.getHex(),
    terrainMidColor: terrainMid.getHex(),
    terrainHighColor: terrainHigh.getHex(),
    terrainShadowColor: terrainLow.clone().multiplyScalar(0.72).getHex(),
    terrainSpecularColor: terrainHigh.clone().lerp(new Color(0xffffff), 0.36).getHex(),
    clearColor: depth.clone().multiplyScalar(0.2).lerp(new Color(fallback.clearColor), 0.7).getHex(),
    horizonColor: depth.clone().lerp(mid, 0.45).multiplyScalar(0.7).getHex(),
    fogColor: depth.clone().lerp(mid, 0.4).getHex(),
    padColor: terrainMid.clone().lerp(new Color(fallback.padColor), 0.5).getHex(),
    foundationColor: terrainLow.clone().lerp(new Color(fallback.foundationColor), 0.45).getHex(),
    metalColor: terrainHigh.clone().lerp(new Color(fallback.metalColor), 0.62).getHex(),
    padTrimColor: terrainHigh.clone().lerp(new Color(fallback.padTrimColor), 0.72).getHex(),
    accentColor: terrainHigh.clone().lerp(new Color(fallback.accentColor), 0.6).getHex(),
    emissiveAccent: terrainHigh.clone().lerp(new Color(0xa5ebff), 0.52).getHex(),
  };
}

function sampleGradient(gradient: { anchor: number; color: [number, number, number] }[], t: number): Color {
  if (gradient.length === 0) return new Color(0.5, 0.5, 0.5);

  const clamped = Math.max(0, Math.min(1, t));
  for (let i = 1; i < gradient.length; i += 1) {
    const prev = gradient[i - 1];
    const next = gradient[i];
    if (clamped <= next.anchor) {
      const span = Math.max(next.anchor - prev.anchor, 0.0001);
      const alpha = (clamped - prev.anchor) / span;
      return new Color(prev.color[0], prev.color[1], prev.color[2]).lerp(new Color(next.color[0], next.color[1], next.color[2]), alpha);
    }
  }

  const tail = gradient[gradient.length - 1].color;
  return new Color(tail[0], tail[1], tail[2]);
}
