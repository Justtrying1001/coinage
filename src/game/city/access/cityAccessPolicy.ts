export interface CityAccessPolicy {
  buildMode: boolean;
  canEnterAnyCityInBuildMode: boolean;
  enforceOwnershipInLiveMode: boolean;
}

export interface CityAccessContext {
  settlementId: string;
  ownedSettlementIds: string[];
  policy: CityAccessPolicy;
}

export const DEFAULT_CITY_ACCESS_POLICY: CityAccessPolicy = {
  buildMode: false,
  canEnterAnyCityInBuildMode: false,
  enforceOwnershipInLiveMode: true,
};

export function canEnterCity(context: CityAccessContext): boolean {
  const { settlementId, ownedSettlementIds, policy } = context;

  if (policy.buildMode && policy.canEnterAnyCityInBuildMode) {
    return true;
  }

  if (!policy.enforceOwnershipInLiveMode) {
    return true;
  }

  return ownedSettlementIds.includes(settlementId);
}
