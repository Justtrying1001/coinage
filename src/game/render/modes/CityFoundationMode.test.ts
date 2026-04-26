// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { CityFoundationMode } from '@/game/render/modes/CityFoundationMode';
import { clearCityEconomyPersistenceForTests } from '@/game/city/economy/cityEconomyPersistence';

function mountMode() {
  const host = document.createElement('div') as HTMLDivElement;
  document.body.appendChild(host);

  const mode = new CityFoundationMode(
    { id: 'p-1', seed: 123456 },
    {
      host,
      onSelectPlanet: () => {},
      onRequestMode: () => {},
    },
  );

  mode.mount();

  return { host, mode };
}

describe('CityFoundationMode stitch IA responsibilities', () => {
  beforeEach(() => {
    clearCityEconomyPersistenceForTests();
    window.localStorage.clear();
  });

  it('renders stitch shell only and required branch map', () => {
    const { host, mode } = mountMode();

    expect(host.querySelector('.city-stitch')).not.toBeNull();
    expect(host.querySelector('.city-management')).toBeNull();
    expect(host.querySelector('.citycmd')).toBeNull();

    ['Command', 'Economy', 'Military', 'Defense', 'Research', 'Intelligence', 'Governance', 'Market'].forEach((section) => {
      expect(host.querySelector(`.city-stitch__nav-btn[aria-label="${section}"]`)).not.toBeNull();
    });
    ['payments', 'military_tech', 'science', 'visibility', 'account_balance', 'currency_exchange'].forEach((technicalLabel) => {
      expect(host.textContent).not.toContain(technicalLabel);
    });
    expect(host.textContent).not.toContain('Token');
    expect(host.textContent).not.toContain('Logistics');

    mode.destroy();
    host.remove();
  });

  it('keeps building management in command page and uses functional content in branches', () => {
    const { host, mode } = mountMode();

    expect(host.textContent).toContain('City Command');
    expect(host.querySelectorAll('.city-stitch__card').length).toBeGreaterThan(5);

    host.querySelector<HTMLButtonElement>('.city-stitch__nav-btn[aria-label="Economy"]')?.click();
    expect(host.textContent).toContain('Production, storage, and population usage');
    expect(host.textContent).toContain('Building intel');

    host.querySelector<HTMLButtonElement>('.city-stitch__nav-btn[aria-label="Military"]')?.click();
    expect(host.textContent).toContain('Train units and inspect combat stats');

    host.querySelector<HTMLButtonElement>('.city-stitch__nav-btn[aria-label="Research"]')?.click();
    expect(host.textContent).toContain('Research nodes');

    host.querySelector<HTMLButtonElement>('.city-stitch__nav-btn[aria-label="Market"]')?.click();
    expect(host.textContent).toContain('Transfer capacity');

    mode.destroy();
    host.remove();
  });

  it('keeps branches visible without classified overlays and shows runtime status badges', () => {
    const { host, mode } = mountMode();

    const marketButton = host.querySelector<HTMLButtonElement>('.city-stitch__nav-btn[aria-label="Market"]');
    expect(marketButton).not.toBeNull();
    expect(marketButton?.textContent).toContain('Partial');
    const researchButton = host.querySelector<HTMLButtonElement>('.city-stitch__nav-btn[aria-label="Research"]');
    expect(researchButton).not.toBeNull();
    expect(researchButton?.textContent).toContain('Timed');

    const main = host.querySelector<HTMLElement>('.city-stitch__main');
    const right = host.querySelector<HTMLElement>('.city-stitch__right');
    const bottom = host.querySelector<HTMLElement>('.city-stitch__bottom');
    expect(bottom).toBeNull();
    expect(main?.classList.contains('is-classified')).toBe(false);
    expect(right?.classList.contains('is-classified')).toBe(false);

    host.querySelector<HTMLButtonElement>('.city-stitch__nav-btn[aria-label="Research"]')?.click();
    expect(main?.classList.contains('is-classified')).toBe(false);
    expect(right?.classList.contains('is-classified')).toBe(false);
    expect(host.querySelectorAll('.city-stitch__classified-overlay').length).toBe(0);
    expect(host.textContent).toContain('Research nodes');

    host.querySelector<HTMLButtonElement>('.city-stitch__nav-btn[aria-label="Defense"]')?.click();
    expect(main?.classList.contains('is-classified')).toBe(false);
    expect(right?.classList.contains('is-classified')).toBe(false);

    mode.destroy();
    host.remove();
  });

  it('supports command-page building upgrade workflow and queue cap', () => {
    const { host, mode } = mountMode();

    const mineCard = host.querySelector<HTMLButtonElement>('.city-stitch__card[data-building-id="mine"]');
    const quarryCard = host.querySelector<HTMLButtonElement>('.city-stitch__card[data-building-id="quarry"]');
    expect(mineCard).not.toBeNull();
    expect(quarryCard).not.toBeNull();

    mineCard!.click();
    host.querySelector<HTMLButtonElement>('.city-stitch__detail-block .city-stitch__line-btn')?.click();

    quarryCard!.click();
    host.querySelector<HTMLButtonElement>('.city-stitch__detail-block .city-stitch__line-btn')?.click();

    const text = host.textContent ?? '';
    expect(text).toContain('Build 2/2');
    expect(text).toContain('Queue full (2/2)');

    mode.destroy();
    host.remove();
  });

  it('does not display legacy instant wording for research and includes queued RP in UI points', () => {
    const { host, mode } = mountMode();
    const unsafeMode = mode as unknown as {
      activeSection: string;
      state: {
        economy: {
          levels: Record<string, number>;
          completedResearch: string[];
          researchQueue: Array<{ researchId: string; startedAtMs: number; endsAtMs: number; costPaid: { ore: number; stone: number; iron: number } }>;
        };
      };
      renderTopBar: () => void;
      renderMainCanvas: () => void;
      renderDetailPanel: () => void;
    };

    unsafeMode.state.economy.levels.research_lab = 10;
    unsafeMode.state.economy.completedResearch = ['city_guard']; // 3 RP
    unsafeMode.state.economy.researchQueue = [
      {
        researchId: 'diplomacy', // 3 RP
        startedAtMs: 0,
        endsAtMs: 60_000,
        costPaid: { ore: 100, stone: 400, iron: 200 },
      },
    ];
    unsafeMode.activeSection = 'research';
    unsafeMode.renderTopBar();
    unsafeMode.renderMainCanvas();
    unsafeMode.renderDetailPanel();
    const text = host.textContent ?? '';
    expect(text).not.toContain('Research: instant');
    expect(text).not.toContain('Instant');
    expect(text).toMatch(/Points\s*6\/40/);
    expect(text).toContain('Points used: 6/40');

    mode.destroy();
    host.remove();
  });
});
