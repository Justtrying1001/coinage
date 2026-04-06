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
  });

  assert.equal(layout.length, 90);

  const spacing = minDistance(layout);
  assert.ok(spacing >= 6.5, `Expected min spacing >= 6.5, got ${spacing}`);

  for (const planet of layout) {
    const radial = Math.hypot(planet.x, planet.y);
    assert.ok(radial <= 65.0001, `Planet out of radial bound: ${radial}`);
    assert.equal(planet.z, 0, `Planet z should remain fixed at 0 in 2D layout: ${planet.z}`);
  }
});

test('galaxy layout has broad radial and angular coverage for macro readability', () => {
  const fieldRadius = 88;
  const layout = generateGalaxyLayout('coinage-mvp-seed', {
    planetCount: 158,
    fieldRadius,
    minSpacing: 4.4,
  });

  assert.equal(layout.length, 158);

  const innerThreshold = fieldRadius * 0.33;
  const outerThreshold = fieldRadius * 0.66;

  let innerCount = 0;
  let outerCount = 0;
  const sectorCounts = new Array<number>(8).fill(0);

  for (const planet of layout) {
    const radial = Math.hypot(planet.x, planet.y);
    if (radial <= innerThreshold) innerCount += 1;
    if (radial >= outerThreshold) outerCount += 1;

    const angle = Math.atan2(planet.y, planet.x);
    const normalized = (angle + Math.PI) / (Math.PI * 2);
    const sector = Math.min(7, Math.floor(normalized * 8));
    sectorCounts[sector] += 1;
  }

  assert.ok(innerCount >= 15, `Expected at least 15 planets in inner third, got ${innerCount}`);
  assert.ok(outerCount >= 45, `Expected at least 45 planets in outer third, got ${outerCount}`);

  const minSector = Math.min(...sectorCounts);
  const maxSector = Math.max(...sectorCounts);
  assert.ok(minSector >= 12, `Expected all sectors to have at least 12 planets, got ${minSector}`);
  assert.ok(maxSector - minSector <= 10, `Expected angular balance spread <= 10, got ${maxSector - minSector}`);
});

test('galaxy layout keeps peripheral occupancy in high-density runtime configuration', () => {
  const fieldRadius = 360;
  const layout = generateGalaxyLayout('coinage-mvp-seed', {
    planetCount: 500,
    fieldRadius,
    minSpacing: 9.1,
  });

  assert.equal(layout.length, 500);

  const outerRingThreshold = fieldRadius * 0.82;
  const edgePlanets = layout.filter((planet) => Math.hypot(planet.x, planet.y) >= outerRingThreshold).length;
  const edgeRatio = edgePlanets / layout.length;

  assert.ok(edgeRatio >= 0.35, `Expected peripheral occupancy >= 35%, got ${(edgeRatio * 100).toFixed(2)}%`);
});
