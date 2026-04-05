import test from 'node:test';
import assert from 'node:assert/strict';

import {
  generatePlanetVisualProfile,
  isPlanetVisualProfileInBounds,
  profileSignature,
} from '@/domain/world/generate-planet-visual-profile';
import { DEFAULT_VISUAL_GEN_VERSION } from '@/domain/world/planet-visual.constants';

test('deterministic: same inputs produce identical profile', () => {
  const input = { worldSeed: 'coinage-mvp-seed', planetSeed: 'planet-042' };

  const a = generatePlanetVisualProfile(input);
  const b = generatePlanetVisualProfile(input);

  assert.deepEqual(a, b);
  assert.equal(a.visualGenVersion, DEFAULT_VISUAL_GEN_VERSION);
});

test('variation: different planet seeds produce distinct signatures', () => {
  const signatures = new Set<string>();

  for (let i = 0; i < 40; i += 1) {
    const profile = generatePlanetVisualProfile({
      worldSeed: 'coinage-mvp-seed',
      planetSeed: `planet-${i}`,
    });
    signatures.add(profileSignature(profile));
  }

  assert.ok(signatures.size >= 25, `Expected at least 25 unique signatures, got ${signatures.size}`);
});

test('boundedness: profile values always remain within allowed ranges', () => {
  for (let i = 0; i < 250; i += 1) {
    const profile = generatePlanetVisualProfile({
      worldSeed: 'coinage-mvp-seed',
      planetSeed: `bounded-${i}`,
    });

    assert.equal(
      isPlanetVisualProfileInBounds(profile),
      true,
      `Profile out of bounds for seed bounded-${i}`,
    );
  }
});

test('runtime generator path does not depend on Math.random', () => {
  const originalMathRandom = Math.random;
  Math.random = () => {
    throw new Error('Math.random must not be called by visual profile generation');
  };

  try {
    const profile = generatePlanetVisualProfile({
      worldSeed: 'coinage-mvp-seed',
      planetSeed: 'planet-no-random',
    });

    assert.equal(isPlanetVisualProfileInBounds(profile), true);
  } finally {
    Math.random = originalMathRandom;
  }
});

test('version override changes id and keeps deterministic output', () => {
  const input = { worldSeed: 'coinage-mvp-seed', planetSeed: 'planet-versioned' };

  const v1 = generatePlanetVisualProfile(input, { visualGenVersion: 1 });
  const v2 = generatePlanetVisualProfile(input, { visualGenVersion: 2 });
  const v2Again = generatePlanetVisualProfile(input, { visualGenVersion: 2 });

  assert.notEqual(v1.id, v2.id);
  assert.equal(v2.id, v2Again.id);
  assert.deepEqual(v2, v2Again);
});
