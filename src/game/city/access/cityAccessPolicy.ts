export interface CityAccessPolicy {
  mode: 'build' | 'live';
}

export interface CityAccessContext {
  settlementId: string;
  ownedSettlementIds: string[];
  policy: CityAccessPolicy;
}

export const DEFAULT_CITY_ACCESS_POLICY: CityAccessPolicy = {
  mode: 'build',
};

export function canEnterCity(context: CityAccessContext): boolean {
  const { settlementId, ownedSettlementIds, policy } = context;

  if (policy.mode === 'build') {
    return true;
  }

  return ownedSettlementIds.includes(settlementId);
}
