// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { CityFoundationMode } from '@/game/render/modes/CityFoundationMode';

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

describe('CityFoundationMode MVP alignment', () => {
  it('uses deterministic MVP start state with refinery locked behind HQ 3', () => {
    const { host, mode } = mountMode();

    const text = host.textContent ?? '';
    expect(text).toContain('HQ');
    expect(text).toContain('Mine');
    expect(text).toContain('Quarry');
    expect(text).toContain('Warehouse');
    expect(text).toContain('Housing Complex');
    expect(text).toContain('Requires HQ 3');
    expect(text).toContain('LVL 1');
    expect(text).not.toContain('LVL 2');

    mode.destroy();
    host.remove();
  });

  it('renders only Ore/Stone/Iron resources in city strip', () => {
    const { host, mode } = mountMode();

    const text = host.textContent ?? '';
    expect(text).toContain('Ore');
    expect(text).toContain('Stone');
    expect(text).toContain('Iron');
    expect(text).not.toContain('Metal');
    expect(text).not.toContain('Crystal');
    expect(text).not.toContain('Deuterium');
    expect(text).not.toContain('Energy');

    mode.destroy();
    host.remove();
  });

  it('enforces MVP queue cap of 2 concurrent constructions', () => {
    const { host, mode } = mountMode();

    const mineButton = host.querySelector<HTMLButtonElement>('.city-management__upgrade[data-building-id=\"mine\"]');
    const quarryButton = host.querySelector<HTMLButtonElement>('.city-management__upgrade[data-building-id=\"quarry\"]');
    expect(mineButton).not.toBeNull();
    expect(quarryButton).not.toBeNull();

    mineButton!.click();
    quarryButton!.click();

    const queueText = host.textContent ?? '';
    expect(queueText).toContain('Queue: 2/2');
    expect(queueText).toContain('Queue full (2/2)');

    mode.destroy();
    host.remove();
  });
});
