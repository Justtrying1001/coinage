import { describe, expect, it } from 'vitest';
import { buildingStateLabel, formatEffectList, formatPolicyEffects } from '@/game/render/modes/cityViewUiHelpers';

describe('cityViewUiHelpers', () => {
  it('maps building states to explicit labels', () => {
    expect(buildingStateLabel({ isUnlocked: true, currentLevel: 1, maxLevel: 5, guard: { ok: true, reason: null } }).label).toBe('AVAILABLE');
    expect(buildingStateLabel({ isUnlocked: false, currentLevel: 0, maxLevel: 5, guard: { ok: false, reason: 'Requires HQ 4' } }).label).toContain('Requires HQ 4');
    expect(buildingStateLabel({ isUnlocked: true, currentLevel: 5, maxLevel: 5, guard: { ok: false, reason: 'Max level' } }).label).toBe('MAX LEVEL');
  });

  it('formats building effects and policy effects into readable lines', () => {
    const effectLines = formatEffectList({ orePerHour: 12, cityDefensePct: 3, detectionPct: 4 });
    expect(effectLines).toEqual(expect.arrayContaining(['Ore +12/h', 'City defense +3%', 'Detection +4%']));

    const armamentLines = formatEffectList({ trainingSpeedPct: 1.2, groundAttackPct: 1.6, airDefensePct: 1.4 });
    expect(armamentLines).toEqual(
      expect.arrayContaining([
        'Training speed +1.2%',
        'Ground attack +1.6%',
        'Air defense +1.4%',
      ]),
    );

    const policyLine = formatPolicyEffects({
      id: 'industrial_push',
      name: 'Industrial Push',
      description: '',
      requiredCouncilLevel: 1,
      effect: { productionPct: 10, detectionPct: -5 },
    });
    expect(policyLine).toContain('Production +10%');
    expect(policyLine).toContain('Detection -5%');
  });
});
