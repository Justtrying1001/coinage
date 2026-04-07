import test from 'node:test';
import assert from 'node:assert/strict';

import { buildGalaxyPlanetManifest } from '@/domain/world/build-galaxy-planet-manifest';
import { resolvePlanetIdentity } from '@/domain/world/resolve-planet-identity';
import { WORLD_SEED } from '@/domain/world/world.constants';

const KNOWN_PLANET_ID = 'planet-42';

test('planet resolution is deterministic from manifest canonical source', () => {
  const first = resolvePlanetIdentity(WORLD_SEED, KNOWN_PLANET_ID);
  const second = resolvePlanetIdentity(WORLD_SEED, KNOWN_PLANET_ID);

  assert.notEqual(first, null);
  assert.notEqual(second, null);
  assert.deepEqual(first, second);
});

test('planet view and galaxy manifest reference same canonical planet instance payload', () => {
  const manifest = buildGalaxyPlanetManifest(WORLD_SEED);
  const manifestPlanet = manifest.find((planet) => planet.id === KNOWN_PLANET_ID);
  const resolved = resolvePlanetIdentity(WORLD_SEED, KNOWN_PLANET_ID);

  assert.notEqual(manifestPlanet, undefined);
  assert.notEqual(resolved, null);
  assert.deepEqual(resolved?.planet, manifestPlanet?.planet);
});
