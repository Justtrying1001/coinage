import { describe, expect, it } from 'vitest';
import { canEnterCity, evaluateCityAccess } from '@/game/city/access/cityAccessPolicy';

describe('city access policy', () => {
  it('allows entering any city in explicit build mode override', () => {
    expect(
      canEnterCity({
        settlementId: 'slot-7',
        ownedSettlementIds: [],
        policy: {
          buildMode: true,
          canEnterAnyCityInBuildMode: true,
          enforceOwnershipInLiveMode: true,
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
          buildMode: false,
          canEnterAnyCityInBuildMode: false,
          enforceOwnershipInLiveMode: true,
        },
      }),
    ).toBe(false);
  });

  it('returns a reasoned decision to keep policy checks out of UI branching', () => {
    expect(
      evaluateCityAccess({
        settlementId: 'slot-9',
        ownedSettlementIds: ['slot-1'],
        policy: {
          buildMode: false,
          canEnterAnyCityInBuildMode: false,
          enforceOwnershipInLiveMode: true,
        },
      }),
    ).toEqual({
      allowed: false,
      reason: 'not-owner',
    });
  });
});
