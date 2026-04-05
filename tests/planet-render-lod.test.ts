import test from 'node:test';
import assert from 'node:assert/strict';

import { generatePlanetVisualProfile } from '@/domain/world/generate-planet-visual-profile';
import { mapProfileToProceduralUniforms } from '@/rendering/planet/map-profile-to-procedural-uniforms';
import { applyPlanetRenderLod } from '@/rendering/planet/create-planet-render-instance';

test('LOD contract: planet close-up has higher geometric/detail budget than galaxy', () => {
  const profile = generatePlanetVisualProfile({
    worldSeed: 'coinage-mvp-seed',
    planetSeed: 'planet-lod-contract',
  });

  const base = mapProfileToProceduralUniforms(profile);
  const galaxy = applyPlanetRenderLod(base, 'galaxy');
  const planet = applyPlanetRenderLod(base, 'planet');

  assert.ok(planet.meshResolution >= galaxy.meshResolution);
  assert.ok(planet.detailAttenuation > galaxy.detailAttenuation);
});
