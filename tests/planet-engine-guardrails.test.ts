import test from 'node:test';
import assert from 'node:assert/strict';

import { getGalaxyPlanetManifest } from '@/domain/world/build-galaxy-planet-manifest';

test('no absurd tiny planets in manifest after centralized scale refactor', () => {
  const manifest = getGalaxyPlanetManifest('coinage-mvp-seed');
  assert.ok(manifest.length > 0);

  for (const item of manifest) {
    assert.ok(item.planet.render.scale.silhouetteProtectedRadius >= 3.05, `${item.id} is too small`);
    assert.ok(item.planet.render.renderRadius >= item.planet.render.scale.minRadiusGuardrail);
  }
});
