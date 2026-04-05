import type { PlanetVisualProfile } from '@/domain/world/planet-visual.types';

export interface PlanetRenderStyle {
  oceanColor: string;
  shoreColor: string;
  lowlandColor: string;
  highlandColor: string;
  ridgeColor: string;
  snowColor: string;
  emissiveColor: string;
  emissiveIntensity: number;
  roughness: number;
  metalness: number;
  displacementScale: number;
  macroFrequency: number;
  microFrequency: number;
  warpFrequency: number;
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
      return 0.5;
    case 'icy':
      return 0.22;
    case 'dusty':
      return 0.08;
    default:
      return 0.16;
  }
}

export function mapProfileToRenderStyle(profile: PlanetVisualProfile): PlanetRenderStyle {
  const baseHex = PALETTE_BASE_COLORS[profile.paletteFamily];
  const baseHsl = hexToHsl(baseHex);

  const hue = (baseHsl.h + profile.color.hueShift + 360) % 360;
  const saturation = clamp(profile.color.saturation * 0.9 + baseHsl.s * 0.35, 0.2, 0.95);
  const lightness = clamp(profile.color.lightness * 0.82 + baseHsl.l * 0.3, 0.2, 0.86);

  const oceanColor = hslToHex((hue + 18 + profile.surface.heatBias * 22 + 360) % 360, clamp(saturation * 0.95, 0.35, 0.9), clamp(lightness * 0.48, 0.16, 0.52));
  const shoreColor = hslToHex((hue + 7 + 360) % 360, clamp(saturation * 0.75, 0.25, 0.8), clamp(lightness * 0.66, 0.24, 0.7));
  const lowlandColor = hslToHex((hue - 10 + profile.surface.moistureBias * 26 + 360) % 360, clamp(saturation * 1.02, 0.25, 0.95), clamp(lightness * 0.88, 0.24, 0.76));
  const highlandColor = hslToHex((hue - 2 + 360) % 360, clamp(saturation * 0.82, 0.15, 0.84), clamp(lightness * 0.72, 0.2, 0.66));
  const ridgeColor = hslToHex((hue + 3 + 360) % 360, clamp(saturation * 0.52, 0.08, 0.58), clamp(lightness * 0.54, 0.16, 0.6));
  const snowColor = hslToHex((hue + 8 + 360) % 360, clamp(saturation * 0.25, 0.03, 0.3), clamp(lightness * 1.15, 0.72, 0.94));

  const emissiveColor = hslToHex(hue, clamp(saturation * 0.65, 0.08, 0.7), clamp(lightness * 0.38, 0.04, 0.32));
  const atmosphereHue = (hue + profile.atmosphere.tintShift + 360) % 360;
  const atmosphereColor = hslToHex(atmosphereHue, clamp(saturation * 0.76, 0.14, 0.86), clamp(lightness * 0.9, 0.24, 0.88));

  return {
    oceanColor,
    shoreColor,
    lowlandColor,
    highlandColor,
    ridgeColor,
    snowColor,
    emissiveColor,
    emissiveIntensity: 0.03 + profile.color.accentMix * 0.11,
    roughness: clamp(profile.relief.roughness, 0.25, 1),
    metalness: materialToMetalness(profile),
    displacementScale: clamp(
      profile.relief.macroStrength * 0.26 + profile.relief.microStrength * 0.16,
      0.08,
      0.34,
    ),
    macroFrequency: 0.75 + profile.shape.wobbleFrequency * 1.2,
    microFrequency: 3.2 + profile.shape.wobbleFrequency * 4.8,
    warpFrequency: 1.1 + profile.surface.biomeScale * 0.95,
    atmosphereColor,
  };
}
