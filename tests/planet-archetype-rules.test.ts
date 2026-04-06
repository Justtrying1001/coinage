import test from 'node:test';
import assert from 'node:assert/strict';

import { generatePlanetVisualProfile } from '@/domain/world/generate-planet-visual-profile';
import { validatePlanetProfile } from '@/domain/world/planet-archetype-rules';
import { mapProfileToProceduralUniforms } from '@/rendering/planet/map-profile-to-procedural-uniforms';

test('strict archetype rules: arid is not blue, mineral has no banding, oceanic stays high-water', () => {
  let aridSeen = 0;
  let mineralSeen = 0;
  let oceanicSeen = 0;

  for (let i = 0; i < 1200; i += 1) {
    const profile = generatePlanetVisualProfile({ worldSeed: 'coinage-mvp-seed', planetSeed: `strict-${i}` });
    validatePlanetProfile(profile);
    const uniforms = mapProfileToProceduralUniforms(profile);

    if (profile.archetype === 'arid') {
      aridSeen += 1;
      assert.ok(uniforms.baseColor[2] <= uniforms.baseColor[0] + 0.03, `arid water looks blue for ${profile.id}`);
      assert.ok(uniforms.landColor[2] <= uniforms.landColor[0], `arid land drifts to blue for ${profile.id}`);
    }

    if (profile.archetype === 'mineral') {
      mineralSeen += 1;
      assert.equal(uniforms.bandingStrength, 0, `mineral has banding for ${profile.id}`);
    }

    if (profile.archetype === 'oceanic') {
      oceanicSeen += 1;
      assert.ok(uniforms.oceanLevel >= 0.7, `oceanic water coverage too low for ${profile.id}`);
    }
  }

  assert.ok(aridSeen > 0, 'expected to sample arid archetype');
  assert.ok(mineralSeen > 0, 'expected to sample mineral archetype');
  assert.ok(oceanicSeen > 0, 'expected to sample oceanic archetype');
});

test('non-confusion guardrails: archetype medians remain separated on key visual features', () => {
  const byArchetype = new Map<string, Array<{ ocean: number; banding: number; thermal: number; coolness: number }>>();

  for (let i = 0; i < 1400; i += 1) {
    const profile = generatePlanetVisualProfile({ worldSeed: 'coinage-mvp-seed', planetSeed: `separation-${i}` });
    const uniforms = mapProfileToProceduralUniforms(profile);
    const sample = {
      ocean: uniforms.oceanLevel,
      banding: uniforms.bandingStrength,
      thermal: uniforms.thermalActivity,
      coolness: uniforms.baseColor[2] - uniforms.baseColor[0],
    };
    const list = byArchetype.get(profile.archetype) ?? [];
    list.push(sample);
    byArchetype.set(profile.archetype, list);
  }

  const median = (values: number[]): number => {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)] ?? 0;
  };

  const medianOf = (archetype: string, key: 'ocean' | 'banding' | 'thermal' | 'coolness'): number => {
    const samples = byArchetype.get(archetype) ?? [];
    assert.ok(samples.length > 8, `not enough samples for ${archetype}`);
    return median(samples.map((sample) => sample[key]));
  };

  const oceanicOcean = medianOf('oceanic', 'ocean');
  const aridOcean = medianOf('arid', 'ocean');
  const mineralBanding = medianOf('mineral', 'banding');
  const cloudedBanding = medianOf('clouded', 'banding');
  const volcanicThermal = medianOf('volcanic', 'thermal');
  const lushThermal = medianOf('lush', 'thermal');

  assert.ok(oceanicOcean - aridOcean >= 0.55, `oceanic/arid overlap too high: ${oceanicOcean} vs ${aridOcean}`);
  assert.ok(cloudedBanding - mineralBanding >= 0.2, `clouded/mineral banding overlap too high: ${cloudedBanding} vs ${mineralBanding}`);
  assert.ok(volcanicThermal - lushThermal >= 0.45, `volcanic/lush thermal overlap too high: ${volcanicThermal} vs ${lushThermal}`);

  const toxicThermal = medianOf('toxic', 'thermal');
  assert.ok(toxicThermal >= 0.16 && toxicThermal <= 0.48, `toxic thermal should remain limited, got ${toxicThermal}`);
});
