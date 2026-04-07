import test from 'node:test';
import assert from 'node:assert/strict';

import { createPlanetViewProfile } from '@/domain/world/generate-planet-visual-profile';

test('view strategy separates galaxy and planet budgets', () => {
  const galaxy = createPlanetViewProfile('galaxy');
  const planet = createPlanetViewProfile('planet');

  assert.ok(planet.meshSegments > galaxy.meshSegments);
  assert.ok(planet.cloudSegments > galaxy.cloudSegments);
  assert.equal(galaxy.lod, 'low');
  assert.equal(planet.lod, 'high');
});
