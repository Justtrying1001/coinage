// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';

const resizeSpy = vi.fn();
const updateSpy = vi.fn();
const destroySpy = vi.fn();
const rebuildSpy = vi.fn();

vi.mock('@/game/city/runtime/CityTerrainRuntime', () => ({
  CityTerrainRuntime: class {
    readonly renderer = { domElement: document.createElement('canvas') };

    constructor(host: HTMLDivElement) {
      host.appendChild(this.renderer.domElement);
    }

    rebuild = rebuildSpy;
    resize = resizeSpy;
    update = updateSpy;
    destroy = destroySpy;
  },
}));

import { CityFoundationMode } from '@/game/render/modes/CityFoundationMode';
import type { ModeContext } from '@/game/render/modes/RenderModeController';

describe('CityFoundationMode base layer', () => {
  it('renders terrain mode shell without exposing debug grid controls', () => {
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
    mode.resize(1280, 720);
    mode.update(16);

    expect(host.querySelector('.city-base-layer-stage')).not.toBeNull();
    expect(host.querySelector('canvas')).not.toBeNull();
    expect(host.querySelector('.city-foundation-grid')).toBeNull();
    expect(host.textContent).not.toContain('Place Building');
    expect(host.textContent).not.toContain('Place Road');
    expect(rebuildSpy).toHaveBeenCalled();
    expect(resizeSpy).toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalled();

    const backButton = host.querySelector('.city-base-layer-button');
    expect(backButton).not.toBeNull();
    backButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onRequestMode).toHaveBeenCalledWith('planet3d');

    mode.destroy();
    expect(destroySpy).toHaveBeenCalled();
    host.remove();
  });
});
