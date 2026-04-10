import { describe, expect, it } from 'vitest';
import { generateGalaxyData, planetProfileFromSeed, selectPrimaryPlanet } from '@/game/world/galaxyGenerator';

describe('galaxyGenerator determinism', () => {
  it('returns identical galaxy nodes for the same seed and config', () => {
    const a = generateGalaxyData({ seed: 78231, width: 18000, height: 12000, nodeCount: 560 });
    const b = generateGalaxyData({ seed: 78231, width: 18000, height: 12000, nodeCount: 560 });

    expect(a.nodes.length).toBe(560);
    expect(a.nodes).toEqual(b.nodes);
  });

  it('returns stable planet visual profile for the same seed', () => {
    const profileA = planetProfileFromSeed(178231);
    const profileB = planetProfileFromSeed(178231);

    expect(profileA).toEqual(profileB);
  });

  it('returns meaningfully different data for different seeds', () => {
    const galaxyA = generateGalaxyData({ seed: 78231, width: 18000, height: 12000, nodeCount: 560 });
    const galaxyB = generateGalaxyData({ seed: 78232, width: 18000, height: 12000, nodeCount: 560 });

    const coordsMatch = galaxyA.nodes.filter((node, index) => {
      const other = galaxyB.nodes[index];
      return node.x === other.x && node.y === other.y;
    });

    expect(coordsMatch.length).toBeLessThan(50);
    expect(planetProfileFromSeed(111)).not.toEqual(planetProfileFromSeed(112));
  });

  it('selectPrimaryPlanet is stable for a generated galaxy and explicit about id ordering contract', () => {
    const galaxy = generateGalaxyData({ seed: 78231, width: 18000, height: 12000, nodeCount: 25 });

    const selectedA = selectPrimaryPlanet(galaxy);
    const selectedB = selectPrimaryPlanet(galaxy);

    expect(selectedA).toEqual(selectedB);
    expect(selectedA.id).toBe('p-1');
    expect(selectedA.seed).toBe(galaxy.nodes[0].seed);
  });
});
