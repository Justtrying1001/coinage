import type { ModeContext, RenderModeController } from '@/game/render/modes/RenderModeController';
import type { SelectedPlanetRef } from '@/game/render/types';
import { CityLayoutStore } from '@/game/city/layout/cityLayout';
import { createCityBiomeDescriptorFromSeed } from '@/game/city/biome/cityBiomeDescriptor';
import { CityTerrainRuntime } from '@/game/city/runtime/CityTerrainRuntime';

const GRID_WIDTH = 20;
const GRID_HEIGHT = 14;

export class CityFoundationMode implements RenderModeController {
  readonly id = 'city3d' as const;

  private readonly layout = new CityLayoutStore({ width: GRID_WIDTH, height: GRID_HEIGHT });
  private runtime: CityTerrainRuntime | null = null;
  private root: HTMLElement | null = null;
  private stageEl: HTMLDivElement | null = null;
  private titleEl: HTMLHeadingElement | null = null;
  private subtitleEl: HTMLParagraphElement | null = null;
  private ambienceEl: HTMLParagraphElement | null = null;

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

    root.append(stage, hud);
    this.context.host.appendChild(root);

    this.root = root;
    this.stageEl = stage;

    this.runtime = new CityTerrainRuntime(stage);
    this.rebuildTerrain();
  }

  resize(width: number, height: number) {
    this.runtime?.resize(width, height);
  }

  update(deltaMs: number) {
    this.runtime?.update(deltaMs);
  }

  setSelectedPlanet(nextPlanet: SelectedPlanetRef) {
    this.selectedPlanet = nextPlanet;
    this.rebuildTerrain();
  }

  destroy() {
    this.runtime?.destroy();
    this.runtime = null;

    this.root?.remove();
    this.root = null;
    this.stageEl = null;
    this.titleEl = null;
    this.subtitleEl = null;
    this.ambienceEl = null;
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

    const backButton = document.createElement('button');
    backButton.type = 'button';
    backButton.className = 'city-base-layer-button';
    backButton.textContent = 'Back to Planet';
    backButton.addEventListener('click', () => this.context.onRequestMode('planet3d'));

    panel.append(title, subtitle, ambience, backButton);
    return panel;
  }

  private rebuildTerrain() {
    const descriptor = createCityBiomeDescriptorFromSeed(this.selectedPlanet.seed);
    this.runtime?.rebuild(descriptor, this.layout.getSnapshot(), this.selectedPlanet.seed);

    if (this.stageEl) {
      this.stageEl.dataset.archetype = descriptor.archetype;
      this.stageEl.dataset.perimeterStyle = descriptor.perimeterStyle;
      this.stageEl.style.setProperty('--city-ground-a', descriptor.dominantGround[0]);
      this.stageEl.style.setProperty('--city-ground-b', descriptor.dominantGround[1]);
      this.stageEl.style.setProperty('--city-ground-c', descriptor.dominantGround[2]);
      this.stageEl.style.setProperty('--city-accent-a', descriptor.secondaryAccents[0]);
      this.stageEl.style.setProperty('--city-accent-b', descriptor.secondaryAccents[1]);
      this.stageEl.style.setProperty('--city-accent-c', descriptor.secondaryAccents[2]);
      this.stageEl.style.setProperty('--city-glow', String(descriptor.edgeGlow));
    }

    if (this.titleEl) this.titleEl.textContent = `City View · ${descriptor.archetype.toUpperCase()}`;
    if (this.subtitleEl) this.subtitleEl.textContent = `Planet ${this.selectedPlanet.id.toUpperCase()} · ${descriptor.landform}`;
    if (this.ambienceEl) this.ambienceEl.textContent = descriptor.ambience;
  }
}
