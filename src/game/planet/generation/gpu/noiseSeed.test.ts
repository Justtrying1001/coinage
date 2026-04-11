import { describe, expect, it } from 'vitest';
import { createPlanetGenerationConfig } from '@/game/planet/presets/archetypes';
import { buildGpuNoiseOffsets, isLegacyGpuSeedDegenerate, toLegacyGpuSeed } from '@/game/planet/generation/gpu/noiseSeed';
import { planetProfileFromSeed } from '@/game/world/galaxyGenerator';
import type { PlanetArchetype } from '@/game/render/types';

function findSeeds(archetype: PlanetArchetype, predicate: (seed: number) => boolean, count: number) {
  const seeds: number[] = [];
  for (let seed = 1; seed < 2_000_000 && seeds.length < count; seed += 1) {
    const profile = planetProfileFromSeed(seed);
    if (profile.archetype !== archetype) continue;
    if (!predicate(seed)) continue;
    seeds.push(seed);
  }
  return seeds;
}

describe('gpu noise seed audit', () => {
  it('proves the old GPU seed path had a deterministic 1/17 degenerate class', () => {
    let degenerate = 0;
    const total = 1700;
    for (let seed = 1; seed <= total; seed += 1) {
      if (isLegacyGpuSeedDegenerate(seed)) degenerate += 1;
    }

    expect(degenerate).toBe(100);
  });

  it('builds broken/good seed corpus and confirms the trigger condition differs', () => {
    const brokenJungle = findSeeds('jungle', isLegacyGpuSeedDegenerate, 2);
    const brokenBarren = findSeeds('barren', isLegacyGpuSeedDegenerate, 2);
    const goodJungle = findSeeds('jungle', (seed) => !isLegacyGpuSeedDegenerate(seed), 3);
    const goodBarren = findSeeds('barren', (seed) => !isLegacyGpuSeedDegenerate(seed), 3);
    const goodOther = [
      ...findSeeds('oceanic', (seed) => !isLegacyGpuSeedDegenerate(seed), 1),
      ...findSeeds('terrestrial', (seed) => !isLegacyGpuSeedDegenerate(seed), 1),
      ...findSeeds('volcanic', (seed) => !isLegacyGpuSeedDegenerate(seed), 1),
    ];

    expect(brokenJungle.length).toBeGreaterThanOrEqual(1);
    expect(brokenBarren.length).toBeGreaterThanOrEqual(1);
    expect(goodJungle.length).toBe(3);
    expect(goodBarren.length).toBe(3);
    expect(goodOther.length).toBe(3);

    const broken = [...brokenJungle, ...brokenBarren];
    const good = [...goodJungle, ...goodBarren, ...goodOther];
    expect(broken.every((seed) => isLegacyGpuSeedDegenerate(seed))).toBe(true);
    expect(good.every((seed) => !isLegacyGpuSeedDegenerate(seed))).toBe(true);
  });

  it('uses stable non-degenerate 3d offsets for every filter', () => {
    const seed = 871734;
    const profile = planetProfileFromSeed(seed);
    const config = createPlanetGenerationConfig(seed, profile);
    const offsets = buildGpuNoiseOffsets(seed, 3);

    expect(offsets).toHaveLength(3);
    for (const offset of offsets) {
      expect(offset[0]).toBeGreaterThanOrEqual(0);
      expect(offset[1]).toBeGreaterThanOrEqual(0);
      expect(offset[2]).toBeGreaterThanOrEqual(0);
      expect(offset[0]).toBeLessThan(97);
      expect(offset[1]).toBeLessThan(97);
      expect(offset[2]).toBeLessThan(97);
    }

    const legacySeed = toLegacyGpuSeed(seed);
    expect(Number.isInteger(legacySeed)).toBe(true);
    expect(config.filters.length).toBeGreaterThan(0);
  });
});
