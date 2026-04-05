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
    a.shapeSeed !== b.shapeSeed ||
    a.reliefSeed !== b.reliefSeed ||
    a.simpleFrequency !== b.simpleFrequency ||
    a.ridgedStrength !== b.ridgedStrength ||
    a.landColor.join(',') !== b.landColor.join(',');

  assert.equal(signaturesDiffer, true);
});

test('procedural uniforms contain no undefined/NaN values and remain in expected bounds', () => {
  const profileCounts: Record<string, number> = {
    smooth: 0,
    moderate: 0,
    rough: 0,
    extreme: 0,
  };
  const paletteFamilies = new Set<string>();
  const surfaceCategories = new Set<string>();

  for (let i = 0; i < 150; i += 1) {
    const profile = generatePlanetVisualProfile({
      worldSeed: 'coinage-mvp-seed',
      planetSeed: `uniform-bounds-${i}`,
    });

    const uniforms = mapProfileToProceduralUniforms(profile);
    paletteFamilies.add(profile.paletteFamily);
    surfaceCategories.add(uniforms.surfaceCategory);

    assertFiniteTuple(uniforms.baseColor, 'baseColor');
    assertFiniteTuple(uniforms.shallowWaterColor, 'shallowWaterColor');
    assertFiniteTuple(uniforms.landColor, 'landColor');
    assertFiniteTuple(uniforms.mountainColor, 'mountainColor');
    assertFiniteTuple(uniforms.iceColor, 'iceColor');
    assertFiniteTuple(uniforms.atmosphereColor, 'atmosphereColor');

    const numericKeys: Array<keyof typeof uniforms> = [
      'shapeSeed',
      'reliefSeed',
      'radius',
      'meshResolution',
      'oceanLevel',
      'mountainLevel',
      'simpleFrequency',
      'simpleStrength',
      'ridgedFrequency',
      'ridgedStrength',
      'maskStrength',
      'elevationCap',
      'terrainSmoothing',
      'ridgeAttenuation',
      'detailAttenuation',
      'roughness',
      'metalness',
      'atmosphereIntensity',
      'atmosphereThickness',
    ];

    for (const key of numericKeys) {
      const value = uniforms[key];
      assert.equal(value === undefined, false, `${key} is undefined`);
      assert.equal(Number.isFinite(value as number), true, `${key} is not finite`);
      assert.equal(Number.isNaN(value as number), false, `${key} is NaN`);
    }

    assert.ok(uniforms.shapeSeed >= 0, `shapeSeed out of range: ${uniforms.shapeSeed}`);
    assert.ok(uniforms.reliefSeed >= 0, `reliefSeed out of range: ${uniforms.reliefSeed}`);
    assert.ok(uniforms.radius >= 1.45 && uniforms.radius <= 4.8, `radius out of range: ${uniforms.radius}`);
    assert.ok(
      uniforms.meshResolution >= 20 && uniforms.meshResolution <= 34,
      `meshResolution out of range: ${uniforms.meshResolution}`,
    );
    assert.ok(
      uniforms.oceanLevel >= 0.2 && uniforms.oceanLevel <= 0.58,
      `oceanLevel out of range: ${uniforms.oceanLevel}`,
    );
    assert.ok(
      uniforms.mountainLevel >= 0.64 && uniforms.mountainLevel <= 0.9,
      `mountainLevel out of range: ${uniforms.mountainLevel}`,
    );
    assert.ok(
      uniforms.mountainLevel - uniforms.oceanLevel >= 0.16,
      `expected land band gap >= 0.16, got ${uniforms.mountainLevel - uniforms.oceanLevel}`,
    );
    assert.ok(
      uniforms.simpleFrequency >= 0.8 && uniforms.simpleFrequency <= 4.2,
      `simpleFrequency out of range: ${uniforms.simpleFrequency}`,
    );
    assert.ok(
      uniforms.simpleStrength >= 0.08 && uniforms.simpleStrength <= 0.7,
      `simpleStrength out of range: ${uniforms.simpleStrength}`,
    );
    assert.ok(
      uniforms.ridgedFrequency >= 1.8 && uniforms.ridgedFrequency <= 8.2,
      `ridgedFrequency out of range: ${uniforms.ridgedFrequency}`,
    );
    assert.ok(
      uniforms.ridgedStrength >= 0.04 && uniforms.ridgedStrength <= 0.62,
      `ridgedStrength out of range: ${uniforms.ridgedStrength}`,
    );
    assert.ok(
      uniforms.maskStrength >= 0.3 && uniforms.maskStrength <= 0.95,
      `maskStrength out of range: ${uniforms.maskStrength}`,
    );
    assert.ok(uniforms.elevationCap >= 0.19 && uniforms.elevationCap <= 0.27, `elevationCap out of range: ${uniforms.elevationCap}`);
    assert.ok(
      uniforms.terrainSmoothing >= 0.56 && uniforms.terrainSmoothing <= 0.82,
      `terrainSmoothing out of range: ${uniforms.terrainSmoothing}`,
    );
    assert.ok(
      uniforms.ridgeAttenuation >= 0.32 && uniforms.ridgeAttenuation <= 0.68,
      `ridgeAttenuation out of range: ${uniforms.ridgeAttenuation}`,
    );
    assert.ok(
      uniforms.detailAttenuation >= 0.24 && uniforms.detailAttenuation <= 0.46,
      `detailAttenuation out of range: ${uniforms.detailAttenuation}`,
    );
    assert.ok(uniforms.roughness >= 0.2 && uniforms.roughness <= 1, `roughness out of range: ${uniforms.roughness}`);
    assert.ok(uniforms.metalness >= 0.05 && uniforms.metalness <= 0.45, `metalness out of range: ${uniforms.metalness}`);
    assert.ok(
      uniforms.atmosphereIntensity >= 0 && uniforms.atmosphereIntensity <= 0.95,
      `atmosphereIntensity out of range: ${uniforms.atmosphereIntensity}`,
    );
    assert.ok(
      uniforms.atmosphereThickness >= 0 && uniforms.atmosphereThickness <= 0.12,
      `atmosphereThickness out of range: ${uniforms.atmosphereThickness}`,
    );

    profileCounts[uniforms.terrainProfile] += 1;
  }

  assert.ok(profileCounts.smooth > 0, 'expected smooth terrain profiles to exist');
  assert.ok(profileCounts.moderate > 0, 'expected moderate terrain profiles to exist');
  assert.ok(profileCounts.rough > 0, 'expected rough terrain profiles to exist');
  assert.ok(profileCounts.extreme > 0, 'expected rare extreme terrain profiles to exist');
  assert.ok(profileCounts.extreme <= 15, `expected extreme terrain to remain rare, got ${profileCounts.extreme}`);
  assert.ok(paletteFamilies.size >= 10, `expected at least 10 palette families, got ${paletteFamilies.size}`);
  assert.ok(surfaceCategories.size >= 7, `expected at least 7 surface categories, got ${surfaceCategories.size}`);
});
