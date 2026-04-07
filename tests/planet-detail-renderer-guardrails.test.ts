import test from 'node:test';
import assert from 'node:assert/strict';

import { generateCanonicalPlanet } from '@/domain/world/generate-planet-visual-profile';
import { createPlanetDetailRenderInstance } from '@/rendering/planet/planet-detail-renderer';

test('detail renderer refuses galaxy view mode to prevent coupling regression', () => {
  const planet = generateCanonicalPlanet({ worldSeed: 'coinage-mvp-seed', planetSeed: 'detail-guardrail' });

  assert.throws(() => {
    createPlanetDetailRenderInstance({
      planet,
      x: 0,
      y: 0,
      z: 0,
      options: { viewMode: 'galaxy' },
    });
  });
});
