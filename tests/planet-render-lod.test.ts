import test from 'node:test';
import assert from 'node:assert/strict';

import { createPlanetViewProfile } from '@/domain/world/generate-planet-visual-profile';

test('view strategy separates galaxy and planet budgets', () => {
  const galaxy = createPlanetViewProfile('galaxy');
  const planet = createPlanetViewProfile('planet');

  assert.ok(planet.meshSegments > galaxy.meshSegments);
  assert.equal(galaxy.enableAtmosphere, false);
  assert.equal(planet.enableAtmosphere, true);
  assert.equal(galaxy.lod, 'low');
  assert.equal(planet.lod, 'high');
});
