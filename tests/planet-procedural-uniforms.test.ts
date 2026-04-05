import test from 'node:test';
import assert from 'node:assert/strict';

import { generatePlanetVisualProfile } from '@/domain/world/generate-planet-visual-profile';
import { mapProfileToProceduralUniforms } from '@/rendering/planet/map-profile-to-procedural-uniforms';

function assertFiniteTuple(values: [number, number, number], label: string): void {
  assert.equal(values.length, 3, `${label} must contain 3 components`);

  for (const value of values) {
    assert.equal(Number.isFinite(value), true, `${label} contains non-finite value ${value}`);
    assert.equal(Number.isNaN(value), false, `${label} contains NaN`);
    assert.ok(value >= 0 && value <= 1, `${label} channel out of [0, 1]: ${value}`);
  }
}

test('deterministic mapper: same profile produces same procedural uniforms', () => {
  const profile = generatePlanetVisualProfile({
    worldSeed: 'coinage-mvp-seed',
    planetSeed: 'procedural-uniforms-1',
  });

  const a = mapProfileToProceduralUniforms(profile);
  const b = mapProfileToProceduralUniforms(profile);

  assert.deepEqual(a, b);
});

test('variation mapper: different profiles produce meaningfully different uniforms', () => {
  const alpha = generatePlanetVisualProfile({
    worldSeed: 'coinage-mvp-seed',
    planetSeed: 'procedural-alpha',
  });

  const beta = generatePlanetVisualProfile({
    worldSeed: 'coinage-mvp-seed',
    planetSeed: 'procedural-beta',
  });

  const a = mapProfileToProceduralUniforms(alpha);
  const b = mapProfileToProceduralUniforms(beta);

  const signaturesDiffer =
    a.seedA !== b.seedA ||
    a.seedB !== b.seedB ||
    a.wobbleFrequency !== b.wobbleFrequency ||
    a.macroStrength !== b.macroStrength ||
    a.baseColor.join(',') !== b.baseColor.join(',');

  assert.equal(signaturesDiffer, true);
});

test('procedural uniforms contain no undefined/NaN values and remain in expected bounds', () => {
  for (let i = 0; i < 150; i += 1) {
    const profile = generatePlanetVisualProfile({
      worldSeed: 'coinage-mvp-seed',
      planetSeed: `uniform-bounds-${i}`,
    });

    const uniforms = mapProfileToProceduralUniforms(profile);

    assertFiniteTuple(uniforms.baseColor, 'baseColor');
    assertFiniteTuple(uniforms.accentColor, 'accentColor');
    assertFiniteTuple(uniforms.atmosphereColor, 'atmosphereColor');

    const numericKeys: Array<keyof typeof uniforms> = [
      'seedA',
      'seedB',
      'radius',
      'wobbleFrequency',
      'wobbleAmplitude',
      'ridgeWarp',
      'macroStrength',
      'microStrength',
      'roughness',
      'craterDensity',
      'atmosphereIntensity',
      'atmosphereThickness',
    ];

    for (const key of numericKeys) {
      const value = uniforms[key];
      assert.equal(value === undefined, false, `${key} is undefined`);
      assert.equal(Number.isFinite(value as number), true, `${key} is not finite`);
      assert.equal(Number.isNaN(value as number), false, `${key} is NaN`);
    }

    assert.ok(uniforms.seedA >= 0 && uniforms.seedA <= 1, `seedA out of range: ${uniforms.seedA}`);
    assert.ok(uniforms.seedB >= 0 && uniforms.seedB <= 1, `seedB out of range: ${uniforms.seedB}`);
    assert.ok(uniforms.radius >= 0.55 && uniforms.radius <= 2.2, `radius out of range: ${uniforms.radius}`);
    assert.ok(
      uniforms.wobbleFrequency >= 0.5 && uniforms.wobbleFrequency <= 4,
      `wobbleFrequency out of range: ${uniforms.wobbleFrequency}`,
    );
    assert.ok(
      uniforms.wobbleAmplitude >= 0 && uniforms.wobbleAmplitude <= 0.24,
      `wobbleAmplitude out of range: ${uniforms.wobbleAmplitude}`,
    );
    assert.ok(uniforms.ridgeWarp >= 0 && uniforms.ridgeWarp <= 1, `ridgeWarp out of range: ${uniforms.ridgeWarp}`);
    assert.ok(
      uniforms.macroStrength >= 0.05 && uniforms.macroStrength <= 0.75,
      `macroStrength out of range: ${uniforms.macroStrength}`,
    );
    assert.ok(
      uniforms.microStrength >= 0.01 && uniforms.microStrength <= 0.45,
      `microStrength out of range: ${uniforms.microStrength}`,
    );
    assert.ok(uniforms.roughness >= 0.15 && uniforms.roughness <= 1, `roughness out of range: ${uniforms.roughness}`);
    assert.ok(
      uniforms.craterDensity >= 0 && uniforms.craterDensity <= 1,
      `craterDensity out of range: ${uniforms.craterDensity}`,
    );
    assert.ok(
      uniforms.atmosphereIntensity >= 0 && uniforms.atmosphereIntensity <= 1,
      `atmosphereIntensity out of range: ${uniforms.atmosphereIntensity}`,
    );
    assert.ok(
      uniforms.atmosphereThickness >= 0 && uniforms.atmosphereThickness <= 0.12,
      `atmosphereThickness out of range: ${uniforms.atmosphereThickness}`,
    );
  }
});
