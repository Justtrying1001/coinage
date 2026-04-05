import test from 'node:test';
import assert from 'node:assert/strict';

import { buildGalaxyPlanetManifest } from '@/domain/world/build-galaxy-planet-manifest';
import { resolvePlanetIdentity } from '@/domain/world/resolve-planet-identity';
import { WORLD_SEED } from '@/domain/world/world.constants';

const KNOWN_PLANET_ID = 'planet-42';

test('planet resolution is deterministic: planetId -> same planetSeed -> same profile id', () => {
  const first = resolvePlanetIdentity(WORLD_SEED, KNOWN_PLANET_ID);
  const second = resolvePlanetIdentity(WORLD_SEED, KNOWN_PLANET_ID);

  assert.notEqual(first, null);
  assert.notEqual(second, null);

  assert.equal(first?.planetId, KNOWN_PLANET_ID);
  assert.equal(second?.planetId, KNOWN_PLANET_ID);
  assert.equal(first?.planetSeed, second?.planetSeed);
  assert.equal(first?.profile.id, second?.profile.id);
  assert.deepEqual(first?.profile, second?.profile);
});

test('planet resolution uses same deterministic layout source as galaxy manifest', () => {
  const manifest = buildGalaxyPlanetManifest(WORLD_SEED);
  const manifestPlanet = manifest.find((planet) => planet.id === KNOWN_PLANET_ID);
  const resolved = resolvePlanetIdentity(WORLD_SEED, KNOWN_PLANET_ID);

  assert.notEqual(manifestPlanet, undefined);
  assert.notEqual(resolved, null);

  assert.equal(resolved?.planetSeed, manifestPlanet?.planetSeed);
  assert.equal(resolved?.profile.id, manifestPlanet?.profile.id);
});

test('planet resolution returns null for unknown planet id', () => {
  const resolved = resolvePlanetIdentity(WORLD_SEED, 'planet-9999');
  assert.equal(resolved, null);
});
