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

describe('CityFoundationMode command-deck micro UX', () => {
  beforeEach(() => {
    clearCityEconomyPersistenceForTests();
    window.localStorage.clear();
  });

  it('shows command bar with only Ore/Stone/Iron and city identity', () => {
    const { host, mode } = mountMode();

    const text = host.textContent ?? '';
    expect(text).toContain('Owner');
    expect(text).toContain('Queue: 0/2');
    expect(text).toContain('Ore');
    expect(text).toContain('Stone');
    expect(text).toContain('Iron');
    expect(text).not.toContain('Crystal');

    mode.destroy();
    host.remove();
  });

  it('renders all micro sections and switches context branch', () => {
    const { host, mode } = mountMode();

    ['Economy', 'Military', 'Defense', 'Research', 'Intelligence', 'Governance', 'Logistics'].forEach((section) => {
      expect(host.textContent).toContain(section);
    });

    const researchButton = host.querySelector<HTMLButtonElement>('.citycmd__rail-item[aria-label="Research"]');
    expect(researchButton).not.toBeNull();
    researchButton!.click();

    const text = host.textContent ?? '';
    expect(text).toContain('Research Queue');
    expect(text).toContain('Research Lab');

    mode.destroy();
    host.remove();
  });

  it('supports building selection + immediate upgrade CTA + queue cap feedback', () => {
    const { host, mode } = mountMode();

    const mineHotspot = host.querySelector<HTMLButtonElement>('.citycmd__hotspot[aria-label^="Mine"]');
    const quarryHotspot = host.querySelector<HTMLButtonElement>('.citycmd__hotspot[aria-label^="Quarry"]');
    expect(mineHotspot).not.toBeNull();
    expect(quarryHotspot).not.toBeNull();

    mineHotspot!.click();
    const mineUpgrade = host.querySelector<HTMLButtonElement>('.city-management__upgrade[data-building-id="mine"]');
    expect(mineUpgrade).not.toBeNull();
    mineUpgrade!.click();

    quarryHotspot!.click();
    const quarryUpgrade = host.querySelector<HTMLButtonElement>('.city-management__upgrade[data-building-id="quarry"]');
    expect(quarryUpgrade).not.toBeNull();
    quarryUpgrade!.click();

    const text = host.textContent ?? '';
    expect(text).toContain('Queue: 2/2');
    expect(text).toContain('Queue full (2/2)');

    mode.destroy();
    host.remove();
  });

  it('keeps premium/special features out of active city UX', () => {
    const { host, mode } = mountMode();
    const text = host.textContent ?? '';

    expect(text).not.toContain('Shard Vault');
    expect(text).not.toContain('Training Grounds');
    expect(text).toContain('Premium / wallet / special buildings: disabled in MVP MICRO');

    mode.destroy();
    host.remove();
  });
});
