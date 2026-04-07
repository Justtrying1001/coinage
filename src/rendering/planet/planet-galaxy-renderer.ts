import * as THREE from 'three';

import type { PlanetRenderInput, PlanetRenderInstance } from './types';

interface CachedThumbnail {
  texture: THREE.CanvasTexture;
  refs: number;
  lastUsedTick: number;
}

const thumbnailCache = new Map<string, CachedThumbnail>();
const MAX_THUMBNAIL_CACHE_ENTRIES = 256;
let usageTick = 0;
const galaxyThumbnailPerf = {
  cacheHits: 0,
  cacheMisses: 0,
  generatedCount: 0,
  generatedTotalMs: 0,
  instancesCreated: 0,
};

export function getGalaxyThumbnailPerfStats(): Readonly<typeof galaxyThumbnailPerf> {
  return galaxyThumbnailPerf;
}

export function getGalaxyThumbnailCacheSize(): number {
  return thumbnailCache.size;
}

/**
 * Test-only helper to keep cache assertions deterministic.
 */
export function __resetGalaxyThumbnailInternalsForTests(): void {
  for (const entry of thumbnailCache.values()) {
    entry.texture.dispose();
  }
  thumbnailCache.clear();
  usageTick = 0;
  galaxyThumbnailPerf.cacheHits = 0;
  galaxyThumbnailPerf.cacheMisses = 0;
  galaxyThumbnailPerf.generatedCount = 0;
  galaxyThumbnailPerf.generatedTotalMs = 0;
  galaxyThumbnailPerf.instancesCreated = 0;
}

function cacheKey(planet: PlanetRenderInput['planet']): string {
  const p = planet.render;
  return [
    p.family,
    planet.visualDNA.paletteId,
    p.surface.colorDeep.join(','),
    p.surface.colorMid.join(','),
    p.surface.colorHigh.join(','),
    p.surface.oceanColor.join(','),
    p.clouds.coverage.toFixed(2),
    p.clouds.enabled ? 'c' : 'nc',
    p.surface.noiseSeed.toString(36),
    p.rings.enabled ? 'r' : 'n',
    p.rings.enabled ? p.rings.color.join(',') : '',
  ].join('|');
}

function toCss(color: [number, number, number], alpha = 1): string {
  const r = Math.round(THREE.MathUtils.clamp(color[0], 0, 1) * 255);
  const g = Math.round(THREE.MathUtils.clamp(color[1], 0, 1) * 255);
  const b = Math.round(THREE.MathUtils.clamp(color[2], 0, 1) * 255);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildThumbnailTexture(planet: PlanetRenderInput['planet']): THREE.CanvasTexture {
  const size = 96;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas2D not available');

  const center = size * 0.5;
  const radius = size * 0.42;
  const isGaseous = planet.render.surfaceModel === 'gaseous';
  const family = planet.render.family;

  ctx.clearRect(0, 0, size, size);

  const base = ctx.createRadialGradient(center * 0.72, center * 0.74, radius * 0.15, center, center, radius);
  base.addColorStop(0, toCss(planet.render.surface.colorHigh));
  base.addColorStop(0.55, toCss(planet.render.surface.colorMid));
  base.addColorStop(1, toCss(planet.render.surface.colorDeep));

  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fillStyle = base;
  ctx.fill();

  // cheap macro variation baked in 2D, not per-frame.
  const seed = planet.render.surface.noiseSeed % 1024;
  for (let i = 0; i < (isGaseous ? 9 : 6); i += 1) {
    const t = (seed * (i + 1) * 0.00017) % 1;
    const bandY = center + (t - 0.5) * radius * 1.3;
    const bandH = radius * (isGaseous ? 0.05 : 0.08) + ((seed + i * 13) % 5) * radius * 0.012;
    const bandAlpha = isGaseous ? 0.28 : 0.22;
    ctx.fillStyle = toCss(i % 2 === 0 ? planet.render.surface.colorMid : planet.render.surface.colorHigh, bandAlpha);
    ctx.fillRect(center - radius, bandY, radius * 2, bandH);
  }

  if (planet.classification.hasOceans) {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = toCss(planet.render.surface.oceanColor, 0.25);
    ctx.beginPath();
    ctx.arc(center + radius * 0.16, center + radius * 0.05, radius * 0.78, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  if (planet.render.clouds.enabled && planet.render.clouds.coverage > 0.08) {
    ctx.strokeStyle = toCss(planet.render.clouds.color, 0.18 + planet.render.clouds.coverage * 0.24);
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 4; i += 1) {
      const y = center + (i - 1.5) * radius * 0.24;
      ctx.beginPath();
      ctx.ellipse(center, y, radius * 0.94, radius * 0.2, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  if (!isGaseous) {
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(12, 18, 28, 0.18)';
    ctx.beginPath();
    ctx.arc(center + radius * 0.36, center + radius * 0.14, radius * 0.95, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  const familyTint: Record<typeof family, string> = {
    'terrestrial-lush': 'rgba(120, 200, 120, 0.06)',
    oceanic: 'rgba(100, 180, 255, 0.07)',
    'desert-arid': 'rgba(235, 180, 90, 0.09)',
    'ice-frozen': 'rgba(170, 220, 255, 0.09)',
    'volcanic-infernal': 'rgba(255, 110, 70, 0.08)',
    'barren-rocky': 'rgba(170, 150, 130, 0.06)',
    'toxic-alien': 'rgba(140, 255, 180, 0.08)',
    'gas-giant': 'rgba(245, 200, 150, 0.07)',
    'ringed-giant': 'rgba(245, 210, 160, 0.08)',
  };
  ctx.fillStyle = familyTint[family];
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fill();

  const rim = ctx.createRadialGradient(center, center, radius * 0.84, center, center, radius * 1.08);
  rim.addColorStop(0, 'rgba(0,0,0,0)');
  rim.addColorStop(1, toCss(planet.render.atmosphere.color, planet.render.atmosphere.enabled ? 0.22 : 0.06));
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.arc(center, center, radius * 1.08, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function getThumbnailTexture(planet: PlanetRenderInput['planet']): { key: string; texture: THREE.CanvasTexture } {
  const key = cacheKey(planet);
  const cached = thumbnailCache.get(key);
  if (cached) {
    cached.refs += 1;
    usageTick += 1;
    cached.lastUsedTick = usageTick;
    galaxyThumbnailPerf.cacheHits += 1;
    return { key, texture: cached.texture };
  }
  galaxyThumbnailPerf.cacheMisses += 1;
  const startedAt = performance.now();
  const texture = buildThumbnailTexture(planet);
  galaxyThumbnailPerf.generatedCount += 1;
  galaxyThumbnailPerf.generatedTotalMs += performance.now() - startedAt;
  usageTick += 1;
  thumbnailCache.set(key, { texture, refs: 1, lastUsedTick: usageTick });
  return { key, texture };
}

function enforceCacheLimit(): void {
  if (thumbnailCache.size <= MAX_THUMBNAIL_CACHE_ENTRIES) return;
  const releasable = [...thumbnailCache.entries()]
    .filter(([, entry]) => entry.refs <= 0)
    .sort((a, b) => a[1].lastUsedTick - b[1].lastUsedTick);
  while (thumbnailCache.size > MAX_THUMBNAIL_CACHE_ENTRIES && releasable.length > 0) {
    const [oldestKey, oldest] = releasable.shift()!;
    oldest.texture.dispose();
    thumbnailCache.delete(oldestKey);
  }
}

function releaseThumbnailTexture(key: string): void {
  const cached = thumbnailCache.get(key);
  if (!cached) return;
  cached.refs -= 1;
  usageTick += 1;
  cached.lastUsedTick = usageTick;
  if (cached.refs <= 0) {
    enforceCacheLimit();
  }
}

export function createPlanetGalaxyRenderInstance(input: PlanetRenderInput): PlanetRenderInstance {
  const { planet, x, y, z, options } = input;
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const { key, texture } = getThumbnailTexture(planet);
  galaxyThumbnailPerf.instancesCreated += 1;
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(spriteMaterial);
  const diameter = planet.render.renderRadius * 2;
  sprite.scale.set(diameter, diameter, 1);
  sprite.name = 'planet-impostor';
  group.add(sprite);

  if (planet.render.rings.enabled) {
    const ringMaterial = new THREE.SpriteMaterial({ color: new THREE.Color(...planet.render.rings.color), transparent: true, opacity: planet.render.rings.opacity * 0.45, depthWrite: false });
    const ring = new THREE.Sprite(ringMaterial);
    ring.scale.set(planet.render.rings.outerRadius * 2, planet.render.rings.outerRadius * 0.7, 1);
    ring.material.rotation = planet.render.rings.tilt;
    ring.name = 'planet-ring-impostor';
    group.add(ring);
  }

  const debugSnapshot = {
    planetId: planet.identity.planetId,
    seed: planet.identity.planetSeed,
    family: planet.identity.family,
    radiusClass: planet.identity.radiusClass,
    physicalRadius: planet.generated.physicalRadius,
    renderRadiusBase: planet.render.scale.renderRadiusBase,
    finalMeshScale: planet.render.scale.galaxyViewScaleMultiplier,
    atmosphereThickness: planet.render.atmosphere.thickness,
    cloudCoverage: planet.render.clouds.coverage,
    hasRings: planet.render.rings.enabled,
    paletteId: planet.visualDNA.paletteId,
    activeNoiseFamilies: ['thumbnail-baked'],
    currentViewMode: options.viewMode,
    currentLOD: 'low' as const,
  };

  return {
    object: group,
    debugSnapshot,
    dispose: () => {
      releaseThumbnailTexture(key);
      for (const child of group.children) {
        if (child instanceof THREE.Sprite) {
          child.material.dispose();
        }
      }
    },
  };
}
