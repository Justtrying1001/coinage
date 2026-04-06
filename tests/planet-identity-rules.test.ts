import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { generatePlanetVisualProfile } from '@/domain/world/generate-planet-visual-profile';
import { validateProfileIdentity } from '@/domain/world/generate-planet-identity';
import { ARCHETYPE_IDENTITY_RULES, MIN_GAMEPLAY_LAND_RATIO } from '@/domain/world/planet-identity.constants';
import { mapProfileToProceduralUniforms } from '@/rendering/planet/map-profile-to-procedural-uniforms';
import { applyPlanetRenderLod } from '@/rendering/planet/create-planet-render-instance';

test('identity layer is deterministic for same seeds', () => {
  const a = generatePlanetVisualProfile({ worldSeed: 'coinage-mvp-seed', planetSeed: 'identity-001' });
  const b = generatePlanetVisualProfile({ worldSeed: 'coinage-mvp-seed', planetSeed: 'identity-001' });

  assert.deepEqual(a.identity, b.identity);
});

test('generated profiles satisfy identity coherence validation', () => {
  for (let i = 0; i < 240; i += 1) {
    const profile = generatePlanetVisualProfile({
      worldSeed: 'coinage-mvp-seed',
      planetSeed: `identity-coherence-${i}`,
    });

    const issues = validateProfileIdentity(profile);
    assert.equal(issues.length, 0, `identity issues for ${profile.id}: ${issues.join(', ')}`);
  }
});

test('mapper respects identity surface family and land/ocean constraints', () => {
  for (let i = 0; i < 120; i += 1) {
    const profile = generatePlanetVisualProfile({
      worldSeed: 'coinage-mvp-seed',
      planetSeed: `identity-surface-${i}`,
    });

    const uniforms = mapProfileToProceduralUniforms(profile);
    assert.equal(uniforms.surfaceCategory, profile.identity.surfaceFamily);
    assert.ok(
      uniforms.minLandRatio >= profile.identity.visualConstraints.minLandRatio - 1e-6,
      `expected minLandRatio >= identity minLandRatio for ${profile.id}`,
    );
    assert.ok(
      uniforms.minLandRatio >= MIN_GAMEPLAY_LAND_RATIO,
      `expected minLandRatio >= gameplay minimum for ${profile.id}`,
    );
    assert.ok(
      uniforms.oceanLevel <= profile.identity.visualConstraints.maxOceanRatio + 0.02,
      `expected oceanLevel <= identity maxOceanRatio envelope for ${profile.id}`,
    );
  }
});

test('archetype identity rules enforce gameplay minimum land ratio', () => {
  for (const [archetype, rule] of Object.entries(ARCHETYPE_IDENTITY_RULES)) {
    assert.ok(
      rule.targetLandRatio.min >= MIN_GAMEPLAY_LAND_RATIO,
      `${archetype} targetLandRatio.min below gameplay minimum`,
    );
  }
});

test('galaxy LOD does not alter planet identity markers', () => {
  const profile = generatePlanetVisualProfile({ worldSeed: 'coinage-mvp-seed', planetSeed: 'lod-identity' });
  const base = mapProfileToProceduralUniforms(profile);
  const galaxy = applyPlanetRenderLod(base, 'galaxy');

  assert.equal(galaxy.shapeSeed, base.shapeSeed);
  assert.equal(galaxy.reliefSeed, base.reliefSeed);
  assert.deepEqual(galaxy.baseColor, base.baseColor);
  assert.deepEqual(galaxy.landColor, base.landColor);
  assert.deepEqual(galaxy.shallowWaterColor, base.shallowWaterColor);
  assert.equal(galaxy.surfaceCategory, base.surfaceCategory);
  assert.equal(galaxy.oceanLevel, base.oceanLevel);
  assert.equal(galaxy.mountainLevel, base.mountainLevel);
  assert.ok(galaxy.meshResolution <= base.meshResolution);
});

test('mapper remains translation-only and does not branch on archetype directly', () => {
  const mapperSource = readFileSync('src/rendering/planet/map-profile-to-procedural-uniforms.ts', 'utf8');
  assert.equal(
    mapperSource.includes('profile.archetype'),
    false,
    'mapper should not branch on profile.archetype',
  );
});
