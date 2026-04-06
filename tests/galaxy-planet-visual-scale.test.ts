import test from 'node:test';
import assert from 'node:assert/strict';

import { getGalaxyPlanetManifest } from '@/domain/world/build-galaxy-planet-manifest';
import { computeGalaxyVisualRadius } from '@/ui/galaxy/planet-visual-scale';

test('galaxy visual radius uses centralized scale profile only', () => {
  const manifest = getGalaxyPlanetManifest('coinage-mvp-seed');
  assert.ok(manifest.length > 0);

  for (const planet of manifest) {
    const visualRadius = computeGalaxyVisualRadius(planet.planet.render.scale);
    assert.ok(visualRadius >= planet.planet.render.scale.minRadiusGuardrail);
    assert.ok(visualRadius <= planet.planet.render.scale.maxRadiusGuardrail);
  }
});
