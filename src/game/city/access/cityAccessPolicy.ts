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

export type CityAccessDecisionReason =
  | 'build-mode-override'
  | 'ownership-not-enforced'
  | 'owner'
  | 'not-owner';

export interface CityAccessDecision {
  allowed: boolean;
  reason: CityAccessDecisionReason;
}

export const DEFAULT_CITY_ACCESS_POLICY: CityAccessPolicy = {
  buildMode: false,
  canEnterAnyCityInBuildMode: false,
  enforceOwnershipInLiveMode: true,
};

export function evaluateCityAccess(context: CityAccessContext): CityAccessDecision {
  const { settlementId, ownedSettlementIds, policy } = context;

  if (policy.buildMode && policy.canEnterAnyCityInBuildMode) {
    return { allowed: true, reason: 'build-mode-override' };
  }

  if (!policy.enforceOwnershipInLiveMode) {
    return { allowed: true, reason: 'ownership-not-enforced' };
  }

  if (ownedSettlementIds.includes(settlementId)) {
    return { allowed: true, reason: 'owner' };
  }

  return { allowed: false, reason: 'not-owner' };
}

export function canEnterCity(context: CityAccessContext): boolean {
  return evaluateCityAccess(context).allowed;
}
