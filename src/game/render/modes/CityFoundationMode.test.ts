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

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const queueText = host.textContent ?? '';
      if (queueText.includes('Queue occupancy: 2/2')) break;
      const nextButton = [...host.querySelectorAll<HTMLButtonElement>('.city-management__upgrade')].find((button) => !button.disabled);
      if (!nextButton) break;
      nextButton.click();
    }

    const queueCountAfterTwo = host.querySelectorAll('.city-management__queue-item').length;
    expect(queueCountAfterTwo).toBe(2);

    const queueText = host.textContent ?? '';
    expect(queueText).toContain('Queue occupancy: 2/2');
    expect(queueText).toContain('Queue full (2/2)');

    mode.destroy();
    host.remove();
  });
});
