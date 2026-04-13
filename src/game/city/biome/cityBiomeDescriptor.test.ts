import { describe, expect, it } from 'vitest';
import type { PlanetArchetype } from '@/game/render/types';
import { planetProfileFromSeed } from '@/game/world/galaxyGenerator';
import { createCityBiomeDescriptorFromSeed } from '@/game/city/biome/cityBiomeDescriptor';

const ARCHETYPES: PlanetArchetype[] = ['oceanic', 'arid', 'frozen', 'volcanic', 'mineral', 'terrestrial', 'jungle', 'barren'];

function findSeedForArchetype(target: PlanetArchetype) {
  for (let seed = 1; seed < 200000; seed += 1) {
    if (planetProfileFromSeed(seed).archetype === target) return seed;
  }
  throw new Error(`Missing seed for archetype ${target}`);
}

describe('createCityBiomeDescriptorFromSeed', () => {
  it('builds a valid descriptor for all canonical archetypes', () => {
    for (const archetype of ARCHETYPES) {
      const seed = findSeedForArchetype(archetype);
      const descriptor = createCityBiomeDescriptorFromSeed(seed);

      expect(descriptor.archetype).toBe(archetype);
      expect(descriptor.surfaceMode).toMatch(/water|ice|lava/);
      expect(descriptor.ambience.length).toBeGreaterThan(12);
      expect(descriptor.landform).toBeTruthy();
      expect(descriptor.dominantGround).toHaveLength(3);
      expect(descriptor.secondaryAccents).toHaveLength(3);
      expect(descriptor.lotStyle).toBeTruthy();
      expect(descriptor.perimeterStyle).toBeTruthy();
      expect(descriptor.humidity).toBeGreaterThanOrEqual(0);
      expect(descriptor.humidity).toBeLessThanOrEqual(1);
      expect(descriptor.dryness).toBeGreaterThanOrEqual(0);
      expect(descriptor.dryness).toBeLessThanOrEqual(1);
      expect(descriptor.relief).toBeGreaterThanOrEqual(0);
      expect(descriptor.roughness).toBeGreaterThanOrEqual(0);
    }
  });

  it('gives each biome a distinct environmental signature (not tint-only)', () => {
    const descriptors = ARCHETYPES.map((archetype) => createCityBiomeDescriptorFromSeed(findSeedForArchetype(archetype)));
    const landforms = new Set(descriptors.map((descriptor) => descriptor.landform));
    const perimeters = new Set(descriptors.map((descriptor) => descriptor.perimeterStyle));

    expect(landforms.size).toBe(ARCHETYPES.length);
    expect(perimeters.size).toBe(ARCHETYPES.length);
  });

  it('is deterministic for the same seed', () => {
    const seed = findSeedForArchetype('jungle');
    const a = createCityBiomeDescriptorFromSeed(seed);
    const b = createCityBiomeDescriptorFromSeed(seed);

    expect(a).toEqual(b);
  });
});
