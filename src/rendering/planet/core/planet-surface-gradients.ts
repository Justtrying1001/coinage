import type { CanonicalPlanet } from '@/domain/world/planet-visual.types';

export interface GradientStop {
  anchor: number;
  color: [number, number, number];
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function mix(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [
    clamp01(a[0] + (b[0] - a[0]) * t),
    clamp01(a[1] + (b[1] - a[1]) * t),
    clamp01(a[2] + (b[2] - a[2]) * t),
  ];
}

function boost(color: [number, number, number], amount: number): [number, number, number] {
  return [
    clamp01(color[0] + amount),
    clamp01(color[1] + amount),
    clamp01(color[2] + amount),
  ];
}

function luminance(color: [number, number, number]): number {
  return color[0] * 0.2126 + color[1] * 0.7152 + color[2] * 0.0722;
}

export function createPlanetSurfaceGradients(planet: CanonicalPlanet): { land: GradientStop[]; depth: GradientStop[] } {
  const deep = planet.render.surface.colorDeep;
  const mid = planet.render.surface.colorMid;
  const high = planet.render.surface.colorHigh;
  const ocean = planet.render.surface.oceanColor;
  const accent = planet.render.surface.accentColor;

  const landBase = mix(deep, mid, 0.58);
  const landMid = mix(mid, high, 0.42);
  const landPeak = boost(mix(high, accent, 0.18), 0.06);

  const oceanDeep = boost(mix(ocean, deep, 0.62), 0.0);
  const oceanShallow = boost(mix(ocean, accent, 0.32), 0.12);

  const land = [
    { anchor: 0.0, color: boost(landBase, 0.04) },
    { anchor: 0.45, color: boost(landMid, 0.07) },
    { anchor: 0.8, color: boost(mix(landMid, landPeak, 0.5), 0.1) },
    { anchor: 1.0, color: landPeak },
  ];

  const depth = [
    { anchor: 0.0, color: oceanDeep },
    { anchor: 0.52, color: boost(mix(oceanDeep, oceanShallow, 0.5), 0.05) },
    { anchor: 1.0, color: oceanShallow },
  ];

  return { land, depth };
}

export function validateGradientReadability(land: GradientStop[], depth: GradientStop[]): string[] {
  const issues: string[] = [];
  const landLuma = land.map((s) => luminance(s.color));
  const depthLuma = depth.map((s) => luminance(s.color));

  const landContrast = Math.max(...landLuma) - Math.min(...landLuma);
  const depthContrast = Math.max(...depthLuma) - Math.min(...depthLuma);

  if (landContrast < 0.12) issues.push('land-gradient-low-contrast');
  if (depthContrast < 0.08) issues.push('depth-gradient-low-contrast');
  if (Math.max(...landLuma) < 0.2) issues.push('land-gradient-too-dark');

  return issues;
}
