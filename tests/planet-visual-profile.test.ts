import test from 'node:test';
import assert from 'node:assert/strict';

import { generateCanonicalPlanet, isPlanetVisualProfileInBounds, profileSignature } from '@/domain/world/generate-planet-visual-profile';

test('canonical generation is deterministic for worldSeed + planetSeed', () => {
  const input = { worldSeed: 'coinage-mvp-seed', planetSeed: 'planet-42', planetId: 'planet-42' };
  const a = generateCanonicalPlanet(input);
  const b = generateCanonicalPlanet(input);

  assert.deepEqual(a, b);
  assert.equal(profileSignature(a), profileSignature(b));
});

test('generated planet obeys centralized render radius guardrails', () => {
  for (let i = 0; i < 120; i += 1) {
    const planet = generateCanonicalPlanet({ worldSeed: 'coinage-mvp-seed', planetSeed: `bounds-${i}` });
    assert.equal(isPlanetVisualProfileInBounds(planet), true);
    assert.ok(planet.render.renderRadius >= planet.render.scale.minRadiusGuardrail);
    assert.ok(planet.render.renderRadius <= planet.render.scale.maxRadiusGuardrail);
  }
});
