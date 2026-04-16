import { describe, expect, it } from 'vitest';
import {
  applyClaimOnAccess,
  canStartConstruction,
  canStartTroopTraining,
  createInitialCityEconomyState,
  getBuildingLevel,
  getConstructionQueueSlots,
  getMilitaryBuildingOrder,
  getPopulationSnapshot,
  getProductionPerHour,
  getStorageCaps,
  resolveCompletedConstruction,
  resolveCompletedTraining,
  startConstruction,
  startTroopTraining,
} from '@/game/city/economy/cityEconomySystem';

describe('cityEconomySystem MVP+V0 economy logic', () => {
  it('enforces economy building unlock rules (refinery requires HQ 3)', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-1', owner: 'p1', nowMs: 0 });

    expect(canStartConstruction(state, 'refinery')).toEqual({ ok: false, reason: 'Requires HQ 3' });

    state.levels.hq = 3;
    expect(canStartConstruction(state, 'refinery').reason).not.toBe('Requires HQ 3');
  });

  it('enforces military building unlock + prerequisite chain', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-1', owner: 'p1', nowMs: 0 });
    state.resources = { ore: 9_999_999, stone: 9_999_999, iron: 9_999_999 };

    expect(canStartConstruction(state, 'barracks').ok).toBe(true);
    expect(canStartConstruction(state, 'combat_forge')).toEqual({ ok: false, reason: 'Requires HQ 5' });

    state.levels.hq = 5;
    expect(canStartConstruction(state, 'combat_forge')).toEqual({ ok: false, reason: 'Requires barracks 8' });

    state.levels.barracks = 8;
    expect(canStartConstruction(state, 'combat_forge').ok).toBe(true);

    state.levels.hq = 10;
    expect(canStartConstruction(state, 'space_dock')).toEqual({ ok: false, reason: 'Requires combat_forge 5' });
    state.levels.combat_forge = 5;
    expect(canStartConstruction(state, 'space_dock').ok).toBe(true);
  });

  it('computes production on claim-on-access and clamps at storage caps', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-1', owner: 'p1', nowMs: 0 });
    state.resources = { ore: 0, stone: 0, iron: 0 };

    applyClaimOnAccess(state, 60 * 60 * 1000);

    const perHour = getProductionPerHour(state);
    expect(Math.floor(state.resources.ore)).toBe(perHour.ore);
    expect(Math.floor(state.resources.stone)).toBe(perHour.stone);
    expect(Math.floor(state.resources.iron)).toBe(perHour.iron);

    state.levels.refinery = 1;
    const caps = getStorageCaps(state);
    applyClaimOnAccess(state, 5000 * 60 * 60 * 1000);
    expect(state.resources.ore).toBe(caps.ore);
    expect(state.resources.stone).toBe(caps.stone);
    expect(state.resources.iron).toBe(caps.iron);
  });

  it('updates storage cap with warehouse level', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-1', owner: 'p1' });
    const base = getStorageCaps(state);
    state.levels.warehouse = 2;
    const upgraded = getStorageCaps(state);

    expect(upgraded.ore).toBeGreaterThan(base.ore);
    expect(upgraded.stone).toBeGreaterThan(base.stone);
    expect(upgraded.iron).toBeGreaterThan(base.iron);
  });

  it('enforces combined population usage across buildings + troops + queued training', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-1', owner: 'p1' });
    state.resources = { ore: 9_999_999, stone: 9_999_999, iron: 9_999_999 };

    state.levels.housing_complex = 0;
    state.levels.hq = 20;
    state.levels.mine = 20;
    state.levels.quarry = 19;
    state.levels.refinery = 20;
    state.troops.infantry = 30;
    state.troops.shield_guard = 15;
    const blockedBuilding = canStartConstruction(state, 'quarry');
    expect(blockedBuilding).toEqual({ ok: false, reason: 'Not enough population' });

    state.levels.housing_complex = 20;
    state.levels.barracks = 10;
    const before = getPopulationSnapshot(state);
    const trainGuard = startTroopTraining(state, 'marksman', 20, 0);
    expect(trainGuard.ok).toBe(true);
    const after = getPopulationSnapshot(state);
    expect(after.used).toBeGreaterThan(before.used);
    expect(after.breakdown.trainingReserved).toBeGreaterThan(0);
  });

  it('enforces queue slot limit at 2 and deducts cost at start', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-1', owner: 'p1', nowMs: 0 });
    const before = { ...state.resources };

    const first = startConstruction(state, 'mine', 0);
    const second = startConstruction(state, 'quarry', 0);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(state.queue).toHaveLength(getConstructionQueueSlots());
    expect(state.resources.ore).toBeLessThan(before.ore);
    expect(state.resources.stone).toBeLessThan(before.stone);

    const third = canStartConstruction(state, 'warehouse');
    expect(third).toEqual({ ok: false, reason: 'Queue full (2/2)' });
  });

  it('applies construction completion only after timer', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-1', owner: 'p1', nowMs: 0 });
    const current = getBuildingLevel(state, 'mine');

    startConstruction(state, 'mine', 0);
    const entry = state.queue[0];

    const beforeDone = resolveCompletedConstruction(state, entry.endsAtMs - 1);
    expect(beforeDone).toBe(false);
    expect(getBuildingLevel(state, 'mine')).toBe(current);

    const afterDone = resolveCompletedConstruction(state, entry.endsAtMs);
    expect(afterDone).toBe(true);
    expect(getBuildingLevel(state, 'mine')).toBe(current + 1);
    expect(state.queue).toHaveLength(0);
  });

  it('validates troop unlock and training cost/pop requirements', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-1', owner: 'p1', nowMs: 0 });

    expect(canStartTroopTraining(state, 'infantry', 1)).toEqual({ ok: false, reason: 'Requires barracks 1' });

    state.levels.barracks = 1;
    state.resources = { ore: 0, stone: 0, iron: 0 };
    expect(canStartTroopTraining(state, 'infantry', 1)).toEqual({ ok: false, reason: 'Not enough resources' });

    state.resources = { ore: 999, stone: 999, iron: 999 };
    expect(canStartTroopTraining(state, 'infantry', 1).ok).toBe(true);
  });

  it('handles troop training timer and unit creation on completion', () => {
    const state = createInitialCityEconomyState({ cityId: 'c-1', owner: 'p1', nowMs: 0 });
    state.levels.barracks = 1;
    state.resources = { ore: 9999, stone: 9999, iron: 9999 };

    const start = startTroopTraining(state, 'infantry', 3, 0);
    expect(start.ok).toBe(true);
    expect(state.trainingQueue).toHaveLength(1);

    const entry = state.trainingQueue[0];
    const before = resolveCompletedTraining(state, entry.endsAtMs - 1);
    expect(before).toBe(false);
    expect(state.troops.infantry).toBe(0);

    const after = resolveCompletedTraining(state, entry.endsAtMs);
    expect(after).toBe(true);
    expect(state.troops.infantry).toBe(3);
    expect(state.trainingQueue).toHaveLength(0);
  });

  it('exposes military building order for economy/training dependency graph', () => {
    expect(getMilitaryBuildingOrder()).toEqual(['barracks', 'combat_forge', 'space_dock']);
  });
});
