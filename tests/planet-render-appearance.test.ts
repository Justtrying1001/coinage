import test from 'node:test';
import assert from 'node:assert/strict';

import { generateCanonicalPlanet } from '@/domain/world/generate-planet-visual-profile';
import { createPlanetRenderInstance } from '@/rendering/planet/create-planet-render-instance';

test('renderer builds layered group for planet mode', () => {
  const planet = generateCanonicalPlanet({ worldSeed: 'coinage-mvp-seed', planetSeed: 'render-layers' });
  const instance = createPlanetRenderInstance({
    planet,
    x: 0,
    y: 0,
    z: 0,
    options: { viewMode: 'planet' },
  });

  const meshCount = instance.object.children.length;
  assert.ok(meshCount >= 1);
  assert.equal(instance.debugSnapshot.planetId, planet.identity.planetId);
  assert.equal(instance.debugSnapshot.currentViewMode, 'planet');
  instance.dispose();
});
