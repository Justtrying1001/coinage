import type { BuildingPrerequisite, BuildingLevelEffect, EconomyBuildingConfig, EconomyBuildingId, EconomyResource, LocalPolicyConfig, ResourceBundle, TroopConfig } from '@/game/city/economy/cityEconomyConfig';
import type { GuardResult } from '@/game/city/economy/cityEconomySystem';

export type UiTone = 'ok' | 'warn' | 'locked' | 'muted';

export function formatBundle(bundle: ResourceBundle) {
  return `O ${bundle.ore} · S ${bundle.stone} · I ${bundle.iron}`;
}

export function formatPrerequisites(prerequisites: BuildingPrerequisite[] | undefined): string {
  if (!prerequisites || prerequisites.length === 0) return 'None';
  return prerequisites.map((entry) => `${entry.buildingId} ${entry.minLevel}`).join(', ');
}

export function buildingStateLabel(input: {
  isUnlocked: boolean;
  currentLevel: number;
  maxLevel: number;
  guard: GuardResult;
}): { label: string; tone: UiTone } {
  if (input.currentLevel >= input.maxLevel) return { label: 'MAX LEVEL', tone: 'muted' };
  if (!input.isUnlocked) return { label: input.guard.reason ?? 'LOCKED', tone: 'locked' };
  if (input.guard.ok) return { label: 'AVAILABLE', tone: 'ok' };
  if (input.guard.reason?.includes('Queue')) return { label: input.guard.reason.toUpperCase(), tone: 'warn' };
  return { label: (input.guard.reason ?? 'UNAVAILABLE').toUpperCase(), tone: 'warn' };
}

export function formatEffectList(effect: BuildingLevelEffect): string[] {
  const lines: string[] = [];
  if (effect.orePerHour) lines.push(`Ore +${effect.orePerHour}/h`);
  if (effect.stonePerHour) lines.push(`Stone +${effect.stonePerHour}/h`);
  if (effect.ironPerHour) lines.push(`Iron +${effect.ironPerHour}/h`);
  if (effect.storageCap) lines.push(`Storage ${formatBundle(effect.storageCap)}`);
  if (effect.populationCapBonus) lines.push(`Population +${effect.populationCapBonus}`);
  if (effect.researchCapacity) lines.push(`Research capacity +${effect.researchCapacity}`);
  if (effect.marketEfficiencyPct) lines.push(`Market efficiency +${effect.marketEfficiencyPct}%`);
  if (effect.trainingSpeedPct) lines.push(`Training speed +${effect.trainingSpeedPct}%`);
  if (effect.groundAttackPct) lines.push(`Ground attack +${effect.groundAttackPct}%`);
  if (effect.groundDefensePct) lines.push(`Ground defense +${effect.groundDefensePct}%`);
  if (effect.airAttackPct) lines.push(`Air attack +${effect.airAttackPct}%`);
  if (effect.airDefensePct) lines.push(`Air defense +${effect.airDefensePct}%`);
  if (effect.cityDefensePct) lines.push(`City defense +${effect.cityDefensePct}%`);
  if (effect.groundWallDefensePct) lines.push(`Ground wall defense +${effect.groundWallDefensePct}%`);
  if (effect.groundWallBaseDefense) lines.push(`Ground wall base defense +${effect.groundWallBaseDefense}`);
  if (effect.airWallDefensePct) lines.push(`Air wall defense +${effect.airWallDefensePct}%`);
  if (effect.airWallBaseDefense) lines.push(`Air wall base defense +${effect.airWallBaseDefense}`);
  if (effect.damageMitigationPct) lines.push(`Damage mitigation +${effect.damageMitigationPct}%`);
  if (effect.antiAirDefensePct) lines.push(`Anti-air +${effect.antiAirDefensePct}%`);
  if (effect.siegeResistancePct) lines.push(`Siege resistance +${effect.siegeResistancePct}%`);
  if (effect.detectionPct) lines.push(`Detection +${effect.detectionPct}%`);
  if (effect.counterIntelPct) lines.push(`Counter-intel +${effect.counterIntelPct}%`);
  if (effect.buildSpeedPct) lines.push(`Build speed +${effect.buildSpeedPct}%`);
  if (effect.buildCostReductionPct) lines.push(`Build cost -${effect.buildCostReductionPct}%`);
  if (lines.length === 0) lines.push('No direct numeric effect in runtime');
  return lines;
}

export function formatTroopProductionSite(troop: TroopConfig) {
  return `${troop.requiredBuildingId} ${troop.requiredBuildingLevel}`;
}

export function formatTroopStats(troop: TroopConfig) {
  if (troop.category === 'naval') {
    const navalAttack = troop.navalAttack ?? troop.attack;
    const navalDefense = troop.navalDefense ?? 0;
    return `NAVAL ATK ${navalAttack} · NAVAL DEF ${navalDefense} · SPD ${troop.speed}`;
  }
  return `ATK ${troop.attack} (${troop.attackType}) · DEF ${troop.defenseBlunt}/${troop.defenseSharp}/${troop.defenseDistance} · SPD ${troop.speed}`;
}

export function formatPolicyEffects(policy: LocalPolicyConfig) {
  const effectParts: string[] = [];
  if (policy.effect.productionPct) effectParts.push(`Production ${withSigned(policy.effect.productionPct)}%`);
  if (policy.effect.trainingSpeedPct) effectParts.push(`Training ${withSigned(policy.effect.trainingSpeedPct)}%`);
  if (policy.effect.defensePct) effectParts.push(`Defense ${withSigned(policy.effect.defensePct)}%`);
  if (policy.effect.antiAirDefensePct) effectParts.push(`Anti-air ${withSigned(policy.effect.antiAirDefensePct)}%`);
  if (policy.effect.detectionPct) effectParts.push(`Detection ${withSigned(policy.effect.detectionPct)}%`);
  return effectParts.join(' · ') || 'No numeric runtime effect';
}

function withSigned(value: number) {
  return `${value >= 0 ? '+' : ''}${value}`;
}

export function formatResourceRateLine(resource: EconomyResource, amount: number, cap: number, rate: number) {
  const pct = Math.round((amount / Math.max(cap, 1)) * 100);
  return `${resource.toUpperCase()} ${Math.floor(amount)}/${Math.floor(cap)} (${pct}%) · +${Math.round(rate)}/h`;
}

export function buildingUnlockSummary(config: EconomyBuildingConfig) {
  const hqGate = `HQ ${config.unlockAtHq}`;
  const prereqs = formatPrerequisites(config.prerequisites);
  return `Unlock: ${hqGate}${prereqs !== 'None' ? ` · ${prereqs}` : ''}`;
}
