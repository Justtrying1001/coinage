import test from 'node:test';
import assert from 'node:assert/strict';

import { getGalaxyPlanetManifest } from '@/domain/world/build-galaxy-planet-manifest';
import { mapProfileToProceduralUniforms } from '@/rendering/planet/map-profile-to-procedural-uniforms';
import {
  computeGalaxyVisualRadius,
  GALAXY_VISUAL_RADIUS_MAX,
  GALAXY_VISUAL_RADIUS_MIN,
} from '@/ui/galaxy/planet-visual-scale';

test('galaxy view visual radius enforces a hard minimum floor for every manifest planet', () => {
  const manifest = getGalaxyPlanetManifest('coinage-mvp-seed');

  for (const planet of manifest) {
    const renderUniforms = mapProfileToProceduralUniforms(planet.profile);
    const visualRadius = computeGalaxyVisualRadius({
      manifestRadius: planet.radius,
      renderRadius: renderUniforms.radius,
    });

    assert.ok(
      visualRadius >= GALAXY_VISUAL_RADIUS_MIN,
      `visual radius dropped below floor for ${planet.id}: ${visualRadius}`,
    );
    assert.ok(
      visualRadius <= GALAXY_VISUAL_RADIUS_MAX,
      `visual radius exceeded max for ${planet.id}: ${visualRadius}`,
    );
  }
});

test('galaxy view keeps size variety after visual floor remapping', () => {
  const manifest = getGalaxyPlanetManifest('coinage-mvp-seed');
  const quantizedVisualRadii = new Set<number>();

  for (const planet of manifest) {
    const renderUniforms = mapProfileToProceduralUniforms(planet.profile);
    const visualRadius = computeGalaxyVisualRadius({
      manifestRadius: planet.radius,
      renderRadius: renderUniforms.radius,
    });
    quantizedVisualRadii.add(Math.round(visualRadius * 100));
  }

  assert.ok(
    quantizedVisualRadii.size >= 100,
    `expected rich visual radius distribution, got ${quantizedVisualRadii.size} unique buckets`,
  );
});

test('galaxy visual radius remains coherent with engine radius ordering', () => {
  const manifest = getGalaxyPlanetManifest('coinage-mvp-seed');
  const samples = manifest
    .map((planet) => {
      const renderUniforms = mapProfileToProceduralUniforms(planet.profile);
      return {
        id: planet.id,
        renderRadius: renderUniforms.radius,
        visualRadius: computeGalaxyVisualRadius({
          manifestRadius: planet.radius,
          renderRadius: renderUniforms.radius,
        }),
      };
    })
    .sort((a, b) => a.renderRadius - b.renderRadius);

  for (let i = 1; i < samples.length; i += 1) {
    const previous = samples[i - 1]!;
    const current = samples[i]!;
    assert.ok(
      current.visualRadius + 1e-9 >= previous.visualRadius,
      `non-monotonic mapping between ${previous.id} and ${current.id}`,
    );
  }
});
