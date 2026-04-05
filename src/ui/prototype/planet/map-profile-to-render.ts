import type { PlanetVisualProfile } from '@/domain/world/planet-visual.types';

export interface PlanetRenderStyle {
  baseColor: string;
  emissiveColor: string;
  emissiveIntensity: number;
  roughness: number;
  metalness: number;
  displacementScale: number;
  macroFrequency: number;
  microFrequency: number;
  atmosphereColor: string;
}

const PALETTE_BASE_COLORS: Record<PlanetVisualProfile['paletteFamily'], string> = {
  'ember-dust': '#c76b4c',
  'basalt-moss': '#5f6956',
  'cobalt-ice': '#7fa5d6',
  'sulfur-stone': '#ad9a52',
  'violet-ash': '#8f78a8',
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hh = h / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));

  let r = 0;
  let g = 0;
  let b = 0;

  if (hh >= 0 && hh < 1) {
    r = c;
    g = x;
  } else if (hh >= 1 && hh < 2) {
    r = x;
    g = c;
  } else if (hh >= 2 && hh < 3) {
    g = c;
    b = x;
  } else if (hh >= 3 && hh < 4) {
    g = x;
    b = c;
  } else if (hh >= 4 && hh < 5) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const m = l - c / 2;
  const toHex = (channel: number) => Math.round((channel + m) * 255)
    .toString(16)
    .padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const normalized = hex.replace('#', '');
  const bigint = Number.parseInt(normalized, 16);

  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) {
      h = 60 * (((g - b) / delta) % 6);
    } else if (max === g) {
      h = 60 * ((b - r) / delta + 2);
    } else {
      h = 60 * ((r - g) / delta + 4);
    }
  }

  if (h < 0) {
    h += 360;
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return { h, s, l };
}

function materialToMetalness(profile: PlanetVisualProfile): number {
  switch (profile.materialFamily) {
    case 'metallic':
      return 0.55;
    case 'icy':
      return 0.28;
    case 'dusty':
      return 0.12;
    default:
      return 0.2;
  }
}

export function mapProfileToRenderStyle(profile: PlanetVisualProfile): PlanetRenderStyle {
  const baseHex = PALETTE_BASE_COLORS[profile.paletteFamily];
  const baseHsl = hexToHsl(baseHex);

  const hue = (baseHsl.h + profile.color.hueShift + 360) % 360;
  const saturation = clamp(profile.color.saturation * 0.9 + baseHsl.s * 0.3, 0.2, 0.95);
  const lightness = clamp(profile.color.lightness * 0.85 + baseHsl.l * 0.25, 0.2, 0.8);

  const baseColor = hslToHex(hue, saturation, lightness);
  const emissiveColor = hslToHex(hue, clamp(saturation * 0.8, 0.2, 1), clamp(lightness * 0.35, 0.08, 0.3));

  const atmosphereHue = (hue + profile.atmosphere.tintShift + 360) % 360;
  const atmosphereColor = hslToHex(atmosphereHue, clamp(saturation * 0.8, 0.1, 1), clamp(lightness * 0.8, 0.2, 0.9));

  return {
    baseColor,
    emissiveColor,
    emissiveIntensity: 0.05 + profile.color.accentMix * 0.18,
    roughness: clamp(profile.relief.roughness, 0.2, 1),
    metalness: materialToMetalness(profile),
    displacementScale: clamp(
      profile.relief.macroStrength * 0.13 + profile.relief.microStrength * 0.05,
      0.01,
      0.12,
    ),
    macroFrequency: 0.8 + profile.shape.wobbleFrequency * 1.4,
    microFrequency: 2.2 + profile.shape.wobbleFrequency * 3.5,
    atmosphereColor,
  };
}
