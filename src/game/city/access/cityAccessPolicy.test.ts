import { describe, expect, it } from 'vitest';
import { canEnterCity } from '@/game/city/access/cityAccessPolicy';

describe('city access policy', () => {
  it('allows entering any city in explicit build mode override', () => {
    expect(
      canEnterCity({
        settlementId: 'slot-7',
        ownedSettlementIds: [],
        policy: {
          mode: 'build',
        },
      }),
    ).toBe(true);
  });

  it('requires ownership in live mode', () => {
    expect(
      canEnterCity({
        settlementId: 'slot-2',
        ownedSettlementIds: ['slot-1'],
        policy: {
          mode: 'live',
        },
      }),
    ).toBe(false);
  });
});
