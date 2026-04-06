import test from 'node:test';
import assert from 'node:assert/strict';

import { generateCanonicalPlanet } from '@/domain/world/generate-planet-visual-profile';
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

test('non-regression: galaxy visual radius always enforces silhouette protection >= 3.05', () => {
  const worldSeed = 'coinage-mvp-seed';
  const sampleSize = 400;

  for (let index = 0; index < sampleSize; index += 1) {
    const planet = generateCanonicalPlanet({
      worldSeed,
      planetSeed: `galaxy-visual-floor-${index}`,
      planetId: `galaxy-visual-floor-${index}`,
    });

    const visualRadius = computeGalaxyVisualRadius(planet.render.scale);
    assert.ok(
      visualRadius >= 3.05,
      `expected visual radius >= 3.05, got ${visualRadius} for ${planet.identity.planetId}`,
    );
  }
});
