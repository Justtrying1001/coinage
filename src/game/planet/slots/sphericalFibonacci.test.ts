import { describe, expect, it } from 'vitest';
import { generateSphericalFibonacciDirections } from '@/game/planet/slots/sphericalFibonacci';

describe('generateSphericalFibonacciDirections', () => {
  it('is deterministic and normalized', () => {
    const a = generateSphericalFibonacciDirections(64, 12345);
    const b = generateSphericalFibonacciDirections(64, 12345);
    const c = generateSphericalFibonacciDirections(64, 54321);

    expect(a).toHaveLength(64);
    expect(a.map((v) => v.toArray())).toEqual(b.map((v) => v.toArray()));
    expect(a.map((v) => v.toArray())).not.toEqual(c.map((v) => v.toArray()));

    for (const dir of a) {
      expect(dir.length()).toBeCloseTo(1, 6);
    }
  });
});
