import test from 'node:test';
import assert from 'node:assert/strict';

import { generateCanonicalPlanet } from '@/domain/world/generate-planet-visual-profile';

test('render mapping is deterministic and stable', () => {
  const a = generateCanonicalPlanet({ worldSeed: 'coinage-mvp-seed', planetSeed: 'mapping-1' });
  const b = generateCanonicalPlanet({ worldSeed: 'coinage-mvp-seed', planetSeed: 'mapping-1' });

  assert.deepEqual(a.render, b.render);
});

test('render mapping exposes separated surface/cloud/atmosphere/rings layers', () => {
  const planet = generateCanonicalPlanet({ worldSeed: 'coinage-mvp-seed', planetSeed: 'mapping-2' });
  assert.ok(planet.render.surface !== undefined);
  assert.ok(planet.render.clouds !== undefined);
  assert.ok(planet.render.atmosphere !== undefined);
  assert.ok(planet.render.rings !== undefined);
});
