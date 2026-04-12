// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import { CoinageRenderApp } from '@/game/app/CoinageRenderApp';
import type { ModeContext, RenderModeController } from '@/game/render/modes/RenderModeController';
import type { SelectedPlanetRef } from '@/game/render/types';

class TestResizeObserver {
  observe() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', TestResizeObserver);

class FakeGalaxyMode implements RenderModeController {
  readonly id = 'galaxy2d' as const;

  readonly el = document.createElement('canvas');

  constructor(private readonly context: ModeContext) {}

  mount() {
    this.el.dataset.mode = 'galaxy';
    this.context.host.appendChild(this.el);
    window.addEventListener('pointermove', this.onPointerMove);
  }

  resize() {}

  update() {}

  destroy() {
    window.removeEventListener('pointermove', this.onPointerMove);
    this.el.remove();
  }

  triggerSelect(planet: SelectedPlanetRef) {
    this.context.onSelectPlanet(planet);
    this.context.onRequestMode('planet3d');
  }

  private readonly onPointerMove = () => {};
}

class FakePlanetMode implements RenderModeController {
  readonly id = 'planet3d' as const;

  readonly el = document.createElement('canvas');

  selected: SelectedPlanetRef;

  setSelectedPlanetCalls = 0;

  constructor(
    planet: SelectedPlanetRef,
    private readonly context: ModeContext,
  ) {
    this.selected = planet;
  }

  mount() {
    this.el.dataset.mode = 'planet';
    this.context.host.appendChild(this.el);
    window.addEventListener('pointerup', this.onPointerUp);
  }

  resize() {}

  update() {}

  destroy() {
    window.removeEventListener('pointerup', this.onPointerUp);
    this.el.remove();
  }

  setSelectedPlanet(planet: SelectedPlanetRef) {
    this.selected = planet;
    this.setSelectedPlanetCalls += 1;
  }

  triggerEnterCity(slotId: string) {
    this.context.onEnterCity(slotId);
  }

  private readonly onPointerUp = () => {};
}


class FakeCityMode implements RenderModeController {
  readonly id = 'city3d' as const;

  readonly el = document.createElement('canvas');

  selected: SelectedPlanetRef;

  constructor(
    planet: SelectedPlanetRef,
    private readonly context: ModeContext,
  ) {
    this.selected = planet;
  }

  mount() {
    this.el.dataset.mode = 'city';
    this.context.host.appendChild(this.el);
  }

  resize() {}

  update() {}

  destroy() {
    this.el.remove();
  }

  setSelectedPlanet(planet: SelectedPlanetRef) {
    this.selected = planet;
  }
}

describe('CoinageRenderApp integration flow', () => {
  it('propagates selected planet from galaxy mode to planet mode and boundary callback', () => {
    const host = document.createElement('div');
    host.style.width = '1000px';
    host.style.height = '800px';
    document.body.appendChild(host);

    const selectedChanges: SelectedPlanetRef[] = [];
    let galaxyMode: FakeGalaxyMode | null = null;
    let planetMode: FakePlanetMode | null = null;

    const app = new CoinageRenderApp(host, {
      seed: 78231,
      galaxyWidth: 18000,
      galaxyHeight: 12000,
      onSelectedPlanetChange: (planet) => selectedChanges.push(planet),
      modeFactory: {
        createGalaxyMode: (context) => {
          galaxyMode = new FakeGalaxyMode(context);
          return galaxyMode;
        },
        createPlanetMode: (planet, context) => {
          planetMode = new FakePlanetMode(planet, context);
          return planetMode;
        },
        createCityMode: (planet, context) => new FakeCityMode(planet, context),
      },
    });

    app.mount();

    const chosen = { id: 'p-99', seed: 88776655 };
    expect(galaxyMode).not.toBeNull();
    galaxyMode!.triggerSelect(chosen);

    expect(selectedChanges.at(-1)).toEqual(chosen);
    expect(planetMode).not.toBeNull();
    expect(planetMode!.selected).toEqual(chosen);

    app.destroy();
    host.remove();
  });


  it('honors city access policy before entering city mode', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);

    let planetMode: FakePlanetMode | null = null;
    let cityMode: FakeCityMode | null = null;

    const app = new CoinageRenderApp(host, {
      seed: 78231,
      galaxyWidth: 18000,
      galaxyHeight: 12000,
      cityAccessPolicy: {
        mode: 'live',
      },
      ownedSettlementIds: ['slot-02'],
      modeFactory: {
        createGalaxyMode: (context) => new FakeGalaxyMode(context),
        createPlanetMode: (planet, context) => {
          planetMode = new FakePlanetMode(planet, context);
          return planetMode;
        },
        createCityMode: (planet, context) => {
          cityMode = new FakeCityMode(planet, context);
          return cityMode;
        },
      },
    });

    app.mount();
    app.setMode('planet3d');

    planetMode!.triggerEnterCity('slot-99');
    expect(cityMode).toBeNull();

    planetMode!.triggerEnterCity('slot-02');
    expect(cityMode).not.toBeNull();

    app.destroy();
    host.remove();
  });

  it('mode switching and destroy do not accumulate duplicate canvases or leaked listener registrations', () => {
    const host = document.createElement('div');
    host.style.width = '1000px';
    host.style.height = '800px';
    document.body.appendChild(host);

    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const app = new CoinageRenderApp(host, {
      seed: 78231,
      galaxyWidth: 18000,
      galaxyHeight: 12000,
      modeFactory: {
        createGalaxyMode: (context) => new FakeGalaxyMode(context),
        createPlanetMode: (planet, context) => new FakePlanetMode(planet, context),
        createCityMode: (planet, context) => new FakeCityMode(planet, context),
      },
    });

    app.mount();
    app.setMode('planet3d');
    app.setMode('galaxy2d');
    app.setMode('planet3d');

    expect(host.querySelectorAll('canvas').length).toBeLessThanOrEqual(1);

    app.destroy();

    const pointerMoveAdds = addSpy.mock.calls.filter(([name]) => name === 'pointermove').length;
    const pointerMoveRemoves = removeSpy.mock.calls.filter(([name]) => name === 'pointermove').length;
    const pointerUpAdds = addSpy.mock.calls.filter(([name]) => name === 'pointerup').length;
    const pointerUpRemoves = removeSpy.mock.calls.filter(([name]) => name === 'pointerup').length;

    expect(pointerMoveRemoves).toBe(pointerMoveAdds);
    expect(pointerUpRemoves).toBe(pointerUpAdds);

    addSpy.mockRestore();
    removeSpy.mockRestore();
    host.remove();
  });
});
