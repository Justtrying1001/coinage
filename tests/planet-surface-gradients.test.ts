import test from 'node:test';
import assert from 'node:assert/strict';

import { generateCanonicalPlanet } from '@/domain/world/generate-planet-visual-profile';
import { createPlanetSurfaceGradients, validateGradientReadability } from '@/rendering/planet/core/planet-surface-gradients';

test('surface gradients derive from canonical planet palette with readable contrast', () => {
  const planet = generateCanonicalPlanet({ worldSeed: 'coinage-mvp-seed', planetSeed: 'gradient-readability' });
  const gradients = createPlanetSurfaceGradients(planet);

  assert.ok(gradients.land.length >= 3);
  assert.ok(gradients.depth.length >= 2);

  const issues = validateGradientReadability(gradients.land, gradients.depth);
  assert.equal(issues.length, 0, `unexpected readability issues: ${issues.join(', ')}`);
});
