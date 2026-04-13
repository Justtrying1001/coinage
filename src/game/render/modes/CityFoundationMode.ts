import type { ModeContext, RenderModeController } from '@/game/render/modes/RenderModeController';
import type { SelectedPlanetRef } from '@/game/render/types';
import { SeededRng } from '@/game/world/rng';
import { CityLayoutStore, type CityLayoutSnapshot } from '@/game/city/layout/cityLayout';
import { createCityBiomeDescriptorFromSeed } from '@/game/city/biome/cityBiomeDescriptor';

const GRID_WIDTH = 20;
const GRID_HEIGHT = 14;

interface CityLotVisual {
  x: number;
  y: number;
  width: number;
  height: number;
  zone: 'core' | 'expansion';
  intensity: number;
}

export class CityFoundationMode implements RenderModeController {
  readonly id = 'city3d' as const;

  private readonly layout = new CityLayoutStore({ width: GRID_WIDTH, height: GRID_HEIGHT });
  private root: HTMLElement | null = null;
  private titleEl: HTMLHeadingElement | null = null;
  private subtitleEl: HTMLParagraphElement | null = null;
  private ambienceEl: HTMLParagraphElement | null = null;
  private stageEl: HTMLDivElement | null = null;

  constructor(
    private selectedPlanet: SelectedPlanetRef,
    private readonly context: ModeContext,
  ) {}

  mount() {
    const root = document.createElement('section');
    root.className = 'city-base-layer-root';

    const hud = this.buildHud();
    const stage = document.createElement('div');
    stage.className = 'city-base-layer-stage';

    root.append(hud, stage);
    this.context.host.appendChild(root);

    this.root = root;
    this.stageEl = stage;

    this.renderBaseLayer();
  }

  resize() {}
  update() {}

  setSelectedPlanet(nextPlanet: SelectedPlanetRef) {
    this.selectedPlanet = nextPlanet;
    this.renderBaseLayer();
  }

  destroy() {
    this.root?.remove();
    this.root = null;
    this.titleEl = null;
    this.subtitleEl = null;
    this.ambienceEl = null;
    this.stageEl = null;
  }

  private buildHud() {
    const panel = document.createElement('div');
    panel.className = 'city-base-layer-hud';

    const title = document.createElement('h2');
    title.className = 'city-base-layer-title';
    this.titleEl = title;

    const subtitle = document.createElement('p');
    subtitle.className = 'city-base-layer-subtitle';
    this.subtitleEl = subtitle;

    const ambience = document.createElement('p');
    ambience.className = 'city-base-layer-ambience';
    this.ambienceEl = ambience;

    const controls = document.createElement('div');
    controls.className = 'city-base-layer-controls';

    const backButton = document.createElement('button');
    backButton.type = 'button';
    backButton.className = 'city-base-layer-button';
    backButton.textContent = 'Back to Planet';
    backButton.addEventListener('click', () => this.context.onRequestMode('planet3d'));

    controls.append(backButton);
    panel.append(title, subtitle, ambience, controls);
    return panel;
  }

  private renderBaseLayer() {
    if (!this.stageEl) return;

    const descriptor = createCityBiomeDescriptorFromSeed(this.selectedPlanet.seed);
    const snapshot = this.layout.getSnapshot();

    if (this.titleEl) this.titleEl.textContent = `City Base Layer · ${descriptor.archetype.toUpperCase()}`;
    if (this.subtitleEl) this.subtitleEl.textContent = `Planet ${this.selectedPlanet.id.toUpperCase()} · ${descriptor.surfaceMode.toUpperCase()} SURFACE`;
    if (this.ambienceEl) this.ambienceEl.textContent = descriptor.ambience;

    this.stageEl.innerHTML = '';
    this.stageEl.style.setProperty('--city-ground-a', descriptor.dominantGround[0]);
    this.stageEl.style.setProperty('--city-ground-b', descriptor.dominantGround[1]);
    this.stageEl.style.setProperty('--city-ground-c', descriptor.dominantGround[2]);
    this.stageEl.style.setProperty('--city-accent-a', descriptor.secondaryAccents[0]);
    this.stageEl.style.setProperty('--city-accent-b', descriptor.secondaryAccents[1]);
    this.stageEl.style.setProperty('--city-accent-c', descriptor.secondaryAccents[2]);

    const surface = document.createElement('div');
    surface.className = 'city-base-layer-surface';
    surface.dataset.surfaceMode = descriptor.surfaceMode;
    surface.dataset.perimeterStyle = descriptor.perimeterStyle;
    surface.dataset.lotStyle = descriptor.lotStyle;

    const center = document.createElement('div');
    center.className = 'city-base-layer-core';
    surface.appendChild(center);

    const lots = deriveCityLots(snapshot, this.selectedPlanet.seed, descriptor.peripheralDensity);
    for (const lot of lots) {
      const lotEl = document.createElement('div');
      lotEl.className = `city-base-layer-lot is-${lot.zone}`;
      lotEl.style.left = `${lot.x}%`;
      lotEl.style.top = `${lot.y}%`;
      lotEl.style.width = `${lot.width}%`;
      lotEl.style.height = `${lot.height}%`;
      lotEl.style.opacity = `${0.38 + lot.intensity * 0.34}`;
      surface.appendChild(lotEl);
    }

    const decorCount = Math.max(6, Math.round(8 + descriptor.peripheralDensity * 10));
    const rng = new SeededRng(this.selectedPlanet.seed ^ 0x4d1af17c);
    for (let i = 0; i < decorCount; i += 1) {
      const decor = document.createElement('span');
      decor.className = 'city-base-layer-decor';
      decor.style.left = `${rng.range(2, 96)}%`;
      decor.style.top = `${rng.range(3, 92)}%`;
      decor.style.width = `${rng.range(4.5, 13)}%`;
      decor.style.height = `${rng.range(3.6, 10.5)}%`;
      decor.style.opacity = `${0.08 + rng.range(0.03, 0.2)}`;
      surface.appendChild(decor);
    }

    this.stageEl.appendChild(surface);
  }
}

function deriveCityLots(snapshot: CityLayoutSnapshot, seed: number, density: number) {
  const rng = new SeededRng(seed ^ 0x8f7d3b2a);
  const lots: CityLotVisual[] = [];

  for (let y = 1; y < snapshot.grid.height - 1; y += 2) {
    for (let x = 1; x < snapshot.grid.width - 1; x += 2) {
      const key = `${x},${y}`;
      if (snapshot.blocked.has(key) || snapshot.roads.has(key)) continue;
      if (rng.next() > 0.72 + density * 0.08) continue;

      const zone: 'core' | 'expansion' = snapshot.expansion.has(key) ? 'expansion' : 'core';
      const width = zone === 'expansion' ? rng.range(5.4, 8.8) : rng.range(6.2, 11.8);
      const height = zone === 'expansion' ? rng.range(3.8, 6.2) : rng.range(4.1, 7.4);

      lots.push({
        x: ((x + 0.5) / snapshot.grid.width) * 100 - width * 0.5,
        y: ((y + 0.5) / snapshot.grid.height) * 100 - height * 0.5,
        width,
        height,
        zone,
        intensity: zone === 'core' ? rng.range(0.45, 1) : rng.range(0.24, 0.76),
      });
    }
  }

  return lots.slice(0, 60);
}
