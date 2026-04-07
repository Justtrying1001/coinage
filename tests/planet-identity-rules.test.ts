import test from 'node:test';
import assert from 'node:assert/strict';

import { generateCanonicalPlanet } from '@/domain/world/generate-planet-visual-profile';

test('identity layer remains canonical and detached from rendering implementation details', () => {
  const planet = generateCanonicalPlanet({ worldSeed: 'coinage-mvp-seed', planetSeed: 'identity-001', planetId: 'planet-identity-001' });

  assert.equal(typeof planet.identity.planetId, 'string');
  assert.equal(typeof planet.identity.canonicalSeed, 'number');
  assert.ok(planet.identity.worldSeed.length > 0);
  assert.ok(planet.identity.planetSeed.length > 0);
});
