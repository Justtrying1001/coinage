// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearCityEconomyPersistenceForTests,
  loadCityEconomyState,
  startCityBuildingUpgrade,
  startCityTroopTraining,
} from '@/game/city/economy/cityEconomyPersistence';

const context = {
  cityId: 'planet-a',
  ownerId: 'user-1',
  planetId: 'planet-a',
  sectorId: 'sector-planet-a',
};

describe('cityEconomyPersistence MVP flow', () => {
  beforeEach(() => {
    clearCityEconomyPersistenceForTests();
    window.localStorage.clear();
  });

  it('persists city load state across reloads/sessions', () => {
    const first = loadCityEconomyState(context, 1_000);
    expect(first.economy.levels.hq).toBe(1);

    const started = startCityBuildingUpgrade(context, 'mine', 2_000);
    expect(started.guard.ok).toBe(true);

    const reloaded = loadCityEconomyState(context, 2_100);
    expect(reloaded.economy.queue.length).toBe(1);
    expect(reloaded.economy.queue[0].buildingId).toBe('mine');
  });

  it('updates claim-on-access resources from stored timestamp and persists new timestamp', () => {
    const initial = loadCityEconomyState(context, 0);
    const oreBefore = initial.economy.resources.ore;

    const later = loadCityEconomyState(context, 3_600_000);
    expect(later.economy.resources.ore).toBeGreaterThan(oreBefore);
    expect(later.economy.lastUpdatedAtMs).toBe(3_600_000);

    const persisted = loadCityEconomyState(context, 3_600_000);
    expect(persisted.economy.lastUpdatedAtMs).toBe(3_600_000);
  });

  it('persists construction start with immediate cost deduction and enforces queue slots', () => {
    const before = loadCityEconomyState(context, 0);
    const oreBefore = before.economy.resources.ore;

    const first = startCityBuildingUpgrade(context, 'mine', 1_000);
    const second = startCityBuildingUpgrade(context, 'quarry', 1_100);
    const third = startCityBuildingUpgrade(context, 'warehouse', 1_200);

    expect(first.guard.ok).toBe(true);
    expect(second.guard.ok).toBe(true);
    expect(third.guard).toEqual({ ok: false, reason: 'Queue full (2/2)' });

    const loaded = loadCityEconomyState(context, 1_250);
    expect(loaded.economy.resources.ore).toBeLessThan(oreBefore);
    expect(loaded.economy.queue.length).toBe(2);
  });

  it('resolves completed constructions lazily on load after elapsed time', () => {
    const start = startCityBuildingUpgrade(context, 'mine', 5_000);
    expect(start.guard.ok).toBe(true);

    const queueItem = start.state.economy.queue[0];

    const beforeFinish = loadCityEconomyState(context, queueItem.endsAtMs - 1);
    expect(beforeFinish.economy.levels.mine).toBe(1);
    expect(beforeFinish.economy.queue.length).toBe(1);

    const afterFinish = loadCityEconomyState(context, queueItem.endsAtMs);
    expect(afterFinish.economy.levels.mine).toBe(2);
    expect(afterFinish.economy.queue.length).toBe(0);
  });

  it('persists troop training and resolves trained troops lazily', () => {
    const barracksBuild = startCityBuildingUpgrade(context, 'barracks', 1000);
    expect(barracksBuild.guard.ok).toBe(true);

    const barracksQueue = barracksBuild.state.economy.queue.find((item) => item.buildingId === 'barracks');
    const barracksDone = loadCityEconomyState(context, barracksQueue!.endsAtMs);
    expect(barracksDone.economy.levels.barracks).toBe(1);

    const training = startCityTroopTraining(context, 'infantry', 2, barracksQueue!.endsAtMs + 1_000);
    expect(training.guard.ok).toBe(true);
    expect(training.state.economy.trainingQueue.length).toBe(1);

    const trainingEntry = training.state.economy.trainingQueue[0];
    const before = loadCityEconomyState(context, trainingEntry.endsAtMs - 1);
    expect(before.economy.troops.infantry).toBe(0);

    const after = loadCityEconomyState(context, trainingEntry.endsAtMs);
    expect(after.economy.troops.infantry).toBe(2);
    expect(after.economy.trainingQueue.length).toBe(0);
  });
});
