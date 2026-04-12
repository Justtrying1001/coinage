// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import { CoinageRenderApp } from '@/game/app/CoinageRenderApp';
import type { ModeContext, RenderModeController } from '@/game/render/modes/RenderModeController';
import type { SelectedPlanetRef } from '@/game/render/types';
import type { CityEntryPayload } from '@/game/city/terrain/CityBiomeContext';

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
    this.context.onEnterCity(makeEntryPayload(slotId));
  }

  private readonly onPointerUp = () => {};
}

function makeEntryPayload(slotId: string): CityEntryPayload {
  return {
    settlementId: slotId,
    settlementSurface: {
      id: slotId,
      position: [0.42, 0.93, 0.1],
      normal: [0.41, 0.9, 0.12],
      elevation: 1.04,
      latitude: 22,
      longitude: 13,
      habitability: 0.7,
    },
    planetProfile: {
      archetype: 'frozen',
      oceanLevel: 0.08,
      roughness: 0.62,
      metalness: 0.05,
      reliefStrength: 0.11,
      reliefSharpness: 1.32,
      continentScale: 2.2,
      ridgeScale: 8.1,
      craterScale: 4.8,
      lightIntensity: 1.25,
      atmosphereLightness: 82,
      macroBias: 0.14,
      ridgeWeight: 0.25,
      craterWeight: 0.12,
      polarWeight: 0.3,
      humidityStrength: 0.16,
      emissiveIntensity: 0.02,
    },
    planetGenerationConfig: {
      seed: 123,
      archetype: 'frozen',
      resolution: 128,
      radius: 1,
      filters: [],
      elevationGradient: [{ anchor: 0, color: [0.5, 0.6, 0.7] }, { anchor: 1, color: [0.9, 0.95, 0.98] }],
      depthGradient: [{ anchor: 0, color: [0.2, 0.3, 0.4] }, { anchor: 1, color: [0.6, 0.7, 0.8] }],
      blendDepth: 0.01,
      seaLevel: 1,
      surfaceLevel01: 0.44,
      surfaceMode: 'ice',
      material: {
        roughness: 0.4,
        metalness: 0.1,
        vegetationDensity: 0.06,
        wetness: 0.28,
        canopyTint: [0.6, 0.7, 0.76],
        submergedFlattening: 0.8,
        slopeDarkening: 0.25,
        basinDarkening: 0.34,
        uplandLift: 0.08,
        peakLift: 0.05,
        shadowTint: [0.24, 0.35, 0.45],
        shadowTintStrength: 0.3,
        coastTintStrength: 0.1,
        shallowSurfaceBrightness: 0.05,
        microReliefStrength: 0.2,
        microReliefScale: 15,
        microNormalStrength: 0.08,
        microAlbedoBreakup: 0.1,
        hotspotCoverage: 0.03,
        hotspotIntensity: 0.04,
        fissureScale: 11,
        fissureSharpness: 2.4,
        lavaAccentStrength: 0.03,
        emissiveStrength: 0.02,
        basaltContrast: 0.06,
      },
      postfx: {
        bloom: { strength: 0.01, radius: 0.08, threshold: 0.82 },
        exposure: 1.12,
      },
    },
  };
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
        buildMode: false,
        canEnterAnyCityInBuildMode: false,
        enforceOwnershipInLiveMode: true,
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
