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

describe('CityFoundationMode stitch city replacement shell', () => {
  beforeEach(() => {
    clearCityEconomyPersistenceForTests();
    window.localStorage.clear();
  });

  it('renders only stitch shell and not legacy city classes', () => {
    const { host, mode } = mountMode();

    expect(host.querySelector('.city-stitch')).not.toBeNull();
    expect(host.querySelector('.city-management')).toBeNull();
    expect(host.querySelector('.citycmd')).toBeNull();

    mode.destroy();
    host.remove();
  });

  it('renders required branch views and switches to market/research', () => {
    const { host, mode } = mountMode();

    ['Command', 'Economy', 'Military', 'Defense', 'Research', 'Intelligence', 'Governance', 'Market'].forEach((section) => {
      expect(host.textContent).toContain(section);
    });
    expect(host.textContent).not.toContain('Logistics');

    const marketButton = host.querySelector<HTMLButtonElement>('.city-stitch__nav-btn[aria-label="Market"]');
    expect(marketButton).not.toBeNull();
    marketButton!.click();
    expect(host.textContent).toContain('Exchange Hub');

    const researchButton = host.querySelector<HTMLButtonElement>('.city-stitch__nav-btn[aria-label="Research"]');
    expect(researchButton).not.toBeNull();
    researchButton!.click();

    expect(host.textContent).toContain('Research queue');
    expect(host.textContent).toContain('Research Lab');

    mode.destroy();
    host.remove();
  });

  it('supports selecting buildings and issuing upgrade action', () => {
    const { host, mode } = mountMode();

    const economyButton = host.querySelector<HTMLButtonElement>('.city-stitch__nav-btn[aria-label="Economy"]');
    economyButton?.click();

    const mineCard = host.querySelector<HTMLButtonElement>('.city-stitch__card[data-building-id="mine"]');
    const quarryCard = host.querySelector<HTMLButtonElement>('.city-stitch__card[data-building-id="quarry"]');
    expect(mineCard).not.toBeNull();
    expect(quarryCard).not.toBeNull();

    mineCard!.click();
    host.querySelector<HTMLButtonElement>('.city-stitch__primary[data-building-id="mine"]')?.click();

    quarryCard!.click();
    host.querySelector<HTMLButtonElement>('.city-stitch__primary[data-building-id="quarry"]')?.click();

    const text = host.textContent ?? '';
    expect(text).toContain('Queue: 2/2');
    expect(text).toContain('Queue full (2/2)');

    mode.destroy();
    host.remove();
  });
});
