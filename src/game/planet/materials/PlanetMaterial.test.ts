import { describe, expect, it } from 'vitest';
import type { PlanetArchetype } from '@/game/render/types';
import { planetProfileFromSeed } from '@/game/world/galaxyGenerator';
import { createPlanetGenerationConfig } from '@/game/planet/presets/archetypes';
import { createPlanetMaterial } from '@/game/planet/materials/PlanetMaterial';

const ARCHETYPES_TO_VALIDATE: PlanetArchetype[] = ['jungle', 'barren', 'oceanic', 'terrestrial', 'volcanic'];

function findSeedForArchetype(target: PlanetArchetype) {
  for (let seed = 1; seed < 50000; seed += 1) {
    if (planetProfileFromSeed(seed).archetype === target) return seed;
  }

  throw new Error(`No seed found for archetype: ${target}`);
}

describe('planet material shader stability', () => {
  it('samples breakup noise from stable object-space coordinates', () => {
    const material = createPlanetMaterial(
      [{ anchor: 0, color: [0, 0, 0] }, { anchor: 1, color: [1, 1, 1] }],
      [{ anchor: 0, color: [0, 0, 0.3] }, { anchor: 1, color: [0.2, 0.4, 0.9] }],
      0.82,
      1.32,
      0.01,
      0.5,
      0.1,
      0.4,
      0.6,
    );

    expect(material.vertexShader).toContain('varying vec3 vPositionOS;');
    expect(material.fragmentShader).toContain('vec3 localUp = normalize(vPositionOS);');
    expect(material.fragmentShader).toContain('fbm(localUp * 2.6');
    expect(material.fragmentShader).toContain('fbm(localUp * 7.5');
    expect(material.fragmentShader).not.toContain('fbm(vPositionW');
  });

  it('builds valid deterministic material inputs for representative archetypes', () => {
    for (const archetype of ARCHETYPES_TO_VALIDATE) {
      const seed = findSeedForArchetype(archetype);
      const profile = planetProfileFromSeed(seed);
      const config = createPlanetGenerationConfig(seed, profile);

      const material = createPlanetMaterial(
        config.elevationGradient,
        config.depthGradient,
        0.82,
        1.32,
        config.blendDepth,
        config.material.roughness,
        config.material.metalness,
        config.material.vegetationDensity,
        config.material.wetness,
      );

      expect(material.uniforms.uVegetationDensity.value).toBeGreaterThanOrEqual(0);
      expect(material.uniforms.uVegetationDensity.value).toBeLessThanOrEqual(1);
      expect(material.uniforms.uWetness.value).toBeGreaterThanOrEqual(0);
      expect(material.uniforms.uWetness.value).toBeLessThanOrEqual(1);
      expect(material.uniforms.uBlendDepth.value).toBeGreaterThan(0);
    }
  });
});
