import test from 'node:test';
import assert from 'node:assert/strict';

import { generateGalaxyLayout } from '@/domain/world/generate-galaxy-layout';

function minDistance(layout: ReturnType<typeof generateGalaxyLayout>): number {
  let min = Number.POSITIVE_INFINITY;

  for (let i = 0; i < layout.length; i += 1) {
    for (let j = i + 1; j < layout.length; j += 1) {
      const dx = layout[i].x - layout[j].x;
      const dy = layout[i].y - layout[j].y;
      const dist = Math.hypot(dx, dy);
      if (dist < min) {
        min = dist;
      }
    }
  }

  return min;
}

test('galaxy layout is deterministic for the same world seed', () => {
  const a = generateGalaxyLayout('coinage-mvp-seed');
  const b = generateGalaxyLayout('coinage-mvp-seed');

  assert.deepEqual(a, b);
});

test('galaxy layout has stable spacing and bounds', () => {
  const layout = generateGalaxyLayout('coinage-mvp-seed', {
    planetCount: 90,
    fieldRadius: 65,
    minSpacing: 6.5,
    depthRange: 9,
  });

  assert.equal(layout.length, 90);

  const spacing = minDistance(layout);
  assert.ok(spacing >= 6.5, `Expected min spacing >= 6.5, got ${spacing}`);

  for (const planet of layout) {
    const radial = Math.hypot(planet.x, planet.y);
    assert.ok(radial <= 65.0001, `Planet out of radial bound: ${radial}`);
    assert.ok(planet.z >= -9 && planet.z <= 9, `Planet z out of bounds: ${planet.z}`);
  }
});
