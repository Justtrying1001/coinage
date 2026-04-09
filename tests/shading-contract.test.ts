import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveSeaLevelFromRange, isValidElevationRange } from '@/rendering/planet/shading-contract';

test('sea level mapping aligns ocean control with elevation range', () => {
  const min = -0.1;
  const max = 0.5;

  const highOcean = resolveSeaLevelFromRange(min, max, 0.2);
  const lowOcean = resolveSeaLevelFromRange(min, max, 0.9);

  assert.ok(highOcean.seaLevel > lowOcean.seaLevel, 'more ocean coverage should push sea level upward');
  assert.ok(highOcean.seaLevel <= max);
  assert.ok(lowOcean.seaLevel >= min);
});

test('elevation range guardrail rejects invalid ranges', () => {
  assert.equal(isValidElevationRange(0, 1), true);
  assert.equal(isValidElevationRange(1, 1), false);
  assert.equal(isValidElevationRange(Number.NaN, 1), false);
});
