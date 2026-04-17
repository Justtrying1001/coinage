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
      expect(host.textContent).toContain(section);
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
    expect(host.textContent).toContain('Economic Core');
    expect(host.textContent).toContain('Building intel');

    host.querySelector<HTMLButtonElement>('.city-stitch__nav-btn[aria-label="Military"]')?.click();
    expect(host.textContent).toContain('Unit training');

    host.querySelector<HTMLButtonElement>('.city-stitch__nav-btn[aria-label="Research"]')?.click();
    expect(host.textContent).toContain('Research nodes');

    host.querySelector<HTMLButtonElement>('.city-stitch__nav-btn[aria-label="Market"]')?.click();
    expect(host.textContent).toContain('Not implemented in runtime');

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
    expect(text).toContain('Queue: 2/2');
    expect(text).toContain('Queue full (2/2)');

    mode.destroy();
    host.remove();
  });
});
