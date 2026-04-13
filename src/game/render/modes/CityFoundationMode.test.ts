// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import { CityFoundationMode } from '@/game/render/modes/CityFoundationMode';
import type { ModeContext } from '@/game/render/modes/RenderModeController';

describe('CityFoundationMode base layer', () => {
  it('renders biome base layer without exposing debug grid controls', () => {
    const host = document.createElement('div') as HTMLDivElement;
    document.body.appendChild(host);

    const onRequestMode = vi.fn();
    const context: ModeContext = {
      host,
      onSelectPlanet: () => {},
      onRequestMode,
    };

    const mode = new CityFoundationMode({ id: 'p-1', seed: 178231 }, context);
    mode.mount();

    expect(host.querySelector('.city-base-layer-stage')).not.toBeNull();
    expect(host.querySelectorAll('.city-base-layer-lot').length).toBeGreaterThan(8);
    expect(host.querySelector('.city-foundation-grid')).toBeNull();
    expect(host.textContent).not.toContain('Place Building');
    expect(host.textContent).not.toContain('Place Road');

    const backButton = host.querySelector('.city-base-layer-button');
    expect(backButton).not.toBeNull();
    backButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onRequestMode).toHaveBeenCalledWith('planet3d');

    mode.destroy();
    host.remove();
  });
});
