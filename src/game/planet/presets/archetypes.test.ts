import { describe, expect, it } from 'vitest';
import { planetProfileFromSeed } from '@/game/world/galaxyGenerator';
import { createPlanetGenerationConfig } from '@/game/planet/presets/archetypes';
import type { PlanetArchetype } from '@/game/render/types';

const ARCHETYPES: PlanetArchetype[] = ['oceanic', 'terrestrial', 'jungle', 'frozen', 'volcanic', 'arid', 'mineral', 'barren'];

function findSeedForArchetype(target: PlanetArchetype) {
  for (let seed = 1; seed < 50000; seed += 1) {
    if (planetProfileFromSeed(seed).archetype === target) return seed;
  }
  throw new Error(`No seed found for archetype: ${target}`);
}

function avgColor(stops: { color: [number, number, number] }[]) {
  const total = stops.reduce(
    (acc, stop) => [acc[0] + stop.color[0], acc[1] + stop.color[1], acc[2] + stop.color[2]] as [number, number, number],
    [0, 0, 0] as [number, number, number],
  );

  return [total[0] / stops.length, total[1] / stops.length, total[2] / stops.length] as [number, number, number];
}

describe('planet archetype presets', () => {
  it('produces stable and valid generation config for each archetype', () => {
    for (const archetype of ARCHETYPES) {
      const seed = findSeedForArchetype(archetype);
      const profile = planetProfileFromSeed(seed);
      const configA = createPlanetGenerationConfig(seed, profile);
      const configB = createPlanetGenerationConfig(seed, profile);

      expect(configA).toEqual(configB);
      expect(configA.filters.length).toBeGreaterThan(0);
      expect(configA.elevationGradient.length).toBeGreaterThanOrEqual(3);
      expect(configA.depthGradient.length).toBeGreaterThanOrEqual(2);
      expect(configA.blendDepth).toBeGreaterThan(0);
      expect(configA.seaLevel).toBeGreaterThanOrEqual(0.8);
      expect(configA.seaLevel).toBeLessThanOrEqual(1.1);
      expect(configA.material.vegetationDensity).toBeGreaterThanOrEqual(0);
      expect(configA.material.vegetationDensity).toBeLessThanOrEqual(1);
      expect(configA.material.wetness).toBeGreaterThanOrEqual(0);
      expect(configA.material.wetness).toBeLessThanOrEqual(1);
      expect(configA.material.canopyTint).toHaveLength(3);
    }
  });

  it('keeps jungle distinct from terrestrial and oceanic', () => {
    const jungleSeed = findSeedForArchetype('jungle');
    const terrestrialSeed = findSeedForArchetype('terrestrial');
    const oceanicSeed = findSeedForArchetype('oceanic');

    const jungle = createPlanetGenerationConfig(jungleSeed, planetProfileFromSeed(jungleSeed));
    const terrestrial = createPlanetGenerationConfig(terrestrialSeed, planetProfileFromSeed(terrestrialSeed));
    const oceanic = createPlanetGenerationConfig(oceanicSeed, planetProfileFromSeed(oceanicSeed));

    expect(jungle.material.vegetationDensity).toBeGreaterThan(terrestrial.material.vegetationDensity);
    expect(jungle.material.wetness).toBeGreaterThan(terrestrial.material.wetness);

    const [jR, jG, jB] = avgColor(jungle.elevationGradient);
    const [tR] = avgColor(terrestrial.elevationGradient);
    const [oR, , oB] = avgColor(oceanic.elevationGradient);

    expect(jG).toBeGreaterThan(jR);
    expect(jG).toBeGreaterThan(jB);
    expect(jR).toBeLessThan(tR);
    expect(jB).toBeLessThan(oB);
    expect(jR).toBeLessThan(oR);
    expect(oceanic.seaLevel).toBeGreaterThan(jungle.seaLevel);
  });

  it('maps low-surface mode per archetype', () => {
    const frozenSeed = findSeedForArchetype('frozen');
    const volcanicSeed = findSeedForArchetype('volcanic');
    const terrestrialSeed = findSeedForArchetype('terrestrial');

    const frozen = createPlanetGenerationConfig(frozenSeed, planetProfileFromSeed(frozenSeed));
    const volcanic = createPlanetGenerationConfig(volcanicSeed, planetProfileFromSeed(volcanicSeed));
    const terrestrial = createPlanetGenerationConfig(terrestrialSeed, planetProfileFromSeed(terrestrialSeed));

    expect(frozen.surfaceMode).toBe('ice');
    expect(volcanic.surfaceMode).toBe('lava');
    expect(terrestrial.surfaceMode).toBe('water');
  });

  it('enforces volcanic and arid palette intent', () => {
    const volcanicSeed = findSeedForArchetype('volcanic');
    const aridSeed = findSeedForArchetype('arid');

    const volcanic = createPlanetGenerationConfig(volcanicSeed, planetProfileFromSeed(volcanicSeed));
    const arid = createPlanetGenerationConfig(aridSeed, planetProfileFromSeed(aridSeed));

    const [vR, vG, vB] = avgColor(volcanic.elevationGradient);
    const [aR, aG, aB] = avgColor(arid.elevationGradient);

    expect(vR).toBeGreaterThan(vG);
    expect(vG).toBeGreaterThanOrEqual(vB - 0.02);
    expect(aR).toBeGreaterThan(aG);
    expect(aG).toBeGreaterThan(aB);
    expect(arid.material.wetness).toBeLessThan(volcanic.material.wetness + 0.2);
  });
});
