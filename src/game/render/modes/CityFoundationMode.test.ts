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

describe('CityFoundationMode stitch city port', () => {
  beforeEach(() => {
    clearCityEconomyPersistenceForTests();
    window.localStorage.clear();
  });

  it('renders stitch shell with top bar and core resources', () => {
    const { host, mode } = mountMode();

    const text = host.textContent ?? '';
    expect(host.querySelector('.city-stitch')).not.toBeNull();
    expect(host.querySelector('.city-stitch__top')).not.toBeNull();
    expect(text).toContain('COINAGE');
    expect(text).toContain('Ore');
    expect(text).toContain('Stone');
    expect(text).toContain('Iron');

    mode.destroy();
    host.remove();
  });

  it('renders all branch nav tabs and supports branch switch to research', () => {
    const { host, mode } = mountMode();

    ['Economy', 'Military', 'Defense', 'Research', 'Intelligence', 'Governance', 'Logistics'].forEach((section) => {
      expect(host.textContent).toContain(section);
    });

    const researchButton = host.querySelector<HTMLButtonElement>('.city-stitch__nav-btn[aria-label="Research"]');
    expect(researchButton).not.toBeNull();
    researchButton!.click();

    const text = host.textContent ?? '';
    expect(text).toContain('Research queue');
    expect(text).toContain('Research Lab');
    expect(host.querySelectorAll('.city-stitch__card').length).toBeGreaterThan(0);

    mode.destroy();
    host.remove();
  });

  it('supports selecting a building and issuing upgrade action', () => {
    const { host, mode } = mountMode();

    const mineCard = host.querySelector<HTMLButtonElement>('.city-stitch__card[data-building-id="mine"]');
    const quarryCard = host.querySelector<HTMLButtonElement>('.city-stitch__card[data-building-id="quarry"]');
    expect(mineCard).not.toBeNull();
    expect(quarryCard).not.toBeNull();

    mineCard!.click();
    const mineUpgrade = host.querySelector<HTMLButtonElement>('.city-stitch__primary[data-building-id="mine"]');
    expect(mineUpgrade).not.toBeNull();
    mineUpgrade!.click();

    quarryCard!.click();
    const quarryUpgrade = host.querySelector<HTMLButtonElement>('.city-stitch__primary[data-building-id="quarry"]');
    expect(quarryUpgrade).not.toBeNull();
    quarryUpgrade!.click();

    const text = host.textContent ?? '';
    expect(text).toContain('Queue: 2/2');
    expect(text).toContain('Queue full (2/2)');

    mode.destroy();
    host.remove();
  });

  it('keeps non-runtime premium/special features disabled', () => {
    const { host, mode } = mountMode();
    const text = host.textContent ?? '';

    expect(text).not.toContain('Shard Vault');
    expect(text).not.toContain('Training Grounds');
    expect(text).toContain('MVP MICRO only · premium/wallet/special disabled');

    mode.destroy();
    host.remove();
  });
});
