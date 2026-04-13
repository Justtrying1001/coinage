import type { ModeContext, RenderModeController } from '@/game/render/modes/RenderModeController';
import type { SelectedPlanetRef } from '@/game/render/types';
import { CitySceneController } from '@/game/city/scene/CitySceneController';

export class City3DMode implements RenderModeController {
  readonly id = 'city3d' as const;

  private scene: CitySceneController | null = null;
  private panel: HTMLDivElement | null = null;
  private headerTitle: HTMLHeadingElement | null = null;
  private headerSubtitle: HTMLParagraphElement | null = null;
  private sectionMeta: HTMLDivElement | null = null;
  private archetypeLabel = 'unknown';

  constructor(
    private selectedPlanet: SelectedPlanetRef,
    private readonly context: ModeContext,
    private readonly settlementId: string | null,
  ) {}

  mount() {
    this.scene = new CitySceneController(this.context.host, this.selectedPlanet.seed);
    this.archetypeLabel = this.scene.archetype;
    this.scene.mount();
    this.mountOverlayPanel();
    window.addEventListener('keydown', this.onKeyDown);
  }

  resize(width: number, height: number) {
    this.scene?.resize(width, height);
  }

  update() {
    this.scene?.update();
  }

  setSelectedPlanet(nextPlanet: SelectedPlanetRef) {
    if (nextPlanet.id === this.selectedPlanet.id && nextPlanet.seed === this.selectedPlanet.seed) return;
    this.selectedPlanet = nextPlanet;

    this.scene?.destroy();
    this.scene = new CitySceneController(this.context.host, this.selectedPlanet.seed);
    this.archetypeLabel = this.scene.archetype;
    this.scene.mount();
    this.refreshPanel();
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown);
    this.scene?.destroy();
    this.scene = null;

    this.panel?.remove();
    this.panel = null;
    this.headerTitle = null;
    this.headerSubtitle = null;
    this.sectionMeta = null;
  }

  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      this.context.onRequestMode('planet3d');
    }
  };

  private mountOverlayPanel() {
    const panel = document.createElement('div');
    panel.className = 'city-panel';

    const title = document.createElement('h2');
    title.className = 'city-panel__title';

    const subtitle = document.createElement('p');
    subtitle.className = 'city-panel__subtitle';

    const meta = document.createElement('div');
    meta.className = 'city-panel__meta';

    const buttonRow = document.createElement('div');
    buttonRow.className = 'city-panel__row';

    const backButton = document.createElement('button');
    backButton.type = 'button';
    backButton.className = 'city-panel__button';
    backButton.textContent = 'Back to Planet';
    backButton.addEventListener('click', () => this.context.onRequestMode('planet3d'));

    const galaxyButton = document.createElement('button');
    galaxyButton.type = 'button';
    galaxyButton.className = 'city-panel__button city-panel__button--ghost';
    galaxyButton.textContent = 'Galaxy';
    galaxyButton.addEventListener('click', () => this.context.onRequestMode('galaxy2d'));

    buttonRow.append(backButton, galaxyButton);
    panel.append(title, subtitle, meta, buttonRow);

    this.context.host.appendChild(panel);
    this.panel = panel;
    this.headerTitle = title;
    this.headerSubtitle = subtitle;
    this.sectionMeta = meta;
    this.refreshPanel();
  }

  private refreshPanel() {
    if (!this.headerTitle || !this.headerSubtitle || !this.sectionMeta || !this.scene) return;

    const metrics = this.scene.terrainAnalysis.buildZone.metrics;
    this.headerTitle.textContent = 'City Terrain Foundation';
    this.headerSubtitle.textContent = `Planet ${this.selectedPlanet.id.toUpperCase()} · ${this.settlementId ? `Settlement ${this.settlementId.toUpperCase()}` : 'Terrain Phase'}`;

    this.sectionMeta.innerHTML = '';
    this.appendLine(this.sectionMeta, `Biome recipe: ${this.archetypeLabel}.`);
    this.appendLine(this.sectionMeta, `Reserved zone cells: ${metrics.reservedCellCount} · Buildable cells: ${metrics.buildableCellCount}.`);
    this.appendLine(this.sectionMeta, `Slope mean/p90: ${metrics.meanSlopeBuildZone.toFixed(2)}° / ${metrics.p90SlopeBuildZone.toFixed(2)}°.`);
    this.appendLine(this.sectionMeta, `Contiguous score: ${metrics.contiguousUsableAreaScore.toFixed(2)} · Camera relevance: ${metrics.cameraBuildZoneRelevance.toFixed(2)}.`);
    this.appendLine(this.sectionMeta, 'Terrain-only phase: no buildings, slots, roads, or construction systems.');
    this.appendLine(this.sectionMeta, 'Press I to toggle inspect camera controls.');
  }

  private appendLine(container: HTMLElement, text: string) {
    const line = document.createElement('p');
    line.className = 'city-panel__line';
    line.textContent = text;
    container.appendChild(line);
  }
}
