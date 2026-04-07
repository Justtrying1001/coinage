import test from 'node:test';
import assert from 'node:assert/strict';

import { generateCanonicalPlanet } from '@/domain/world/generate-planet-visual-profile';
import {
  __resetGalaxyThumbnailInternalsForTests,
  createPlanetGalaxyRenderInstance,
  getGalaxyThumbnailCacheSize,
  getGalaxyThumbnailPerfStats,
} from '@/rendering/planet/planet-galaxy-renderer';

type Ctx = {
  clearRect: () => void;
  createRadialGradient: () => { addColorStop: () => void };
  createLinearGradient: () => { addColorStop: () => void };
  beginPath: () => void;
  arc: () => void;
  fill: () => void;
  fillRect: () => void;
  ellipse: () => void;
  moveTo: () => void;
  quadraticCurveTo: () => void;
  stroke: () => void;
  globalCompositeOperation: string;
  fillStyle: string;
  strokeStyle: string;
  lineWidth: number;
};

function installCanvasStub() {
  const originalDocument = (globalThis as { document?: unknown }).document;
  const ctx: Ctx = {
    clearRect: () => {},
    createRadialGradient: () => ({ addColorStop: () => {} }),
    createLinearGradient: () => ({ addColorStop: () => {} }),
    beginPath: () => {},
    arc: () => {},
    fill: () => {},
    fillRect: () => {},
    ellipse: () => {},
    moveTo: () => {},
    quadraticCurveTo: () => {},
    stroke: () => {},
    globalCompositeOperation: 'source-over',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
  };

  (globalThis as { document?: { createElement: (tag: string) => unknown } }).document = {
    createElement: (tag: string) => {
      if (tag !== 'canvas') {
        throw new Error(`Unexpected tag: ${tag}`);
      }
      return {
        width: 0,
        height: 0,
        getContext: () => ctx,
      };
    },
  };

  return () => {
    if (originalDocument === undefined) {
      delete (globalThis as { document?: unknown }).document;
    } else {
      (globalThis as { document?: unknown }).document = originalDocument;
    }
  };
}

test('galaxy thumbnail cache records hit/miss and reuses cached texture', () => {
  const restore = installCanvasStub();
  __resetGalaxyThumbnailInternalsForTests();

  const planet = generateCanonicalPlanet({ worldSeed: 'coinage-mvp-seed', planetSeed: 'cache-guardrail' });

  const a = createPlanetGalaxyRenderInstance({
    planet,
    x: 0,
    y: 0,
    z: 0,
    options: { viewMode: 'galaxy' },
  });
  const b = createPlanetGalaxyRenderInstance({
    planet,
    x: 1,
    y: 0,
    z: 0,
    options: { viewMode: 'galaxy' },
  });

  const stats = getGalaxyThumbnailPerfStats();
  assert.equal(stats.cacheMisses, 1);
  assert.equal(stats.cacheHits, 1);
  assert.equal(getGalaxyThumbnailCacheSize(), 1);

  a.dispose();
  b.dispose();
  restore();
});
