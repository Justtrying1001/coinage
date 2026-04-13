import type { ModeContext, RenderModeController } from '@/game/render/modes/RenderModeController';
import type { SelectedPlanetRef } from '@/game/render/types';

export class CityViewPlaceholderMode implements RenderModeController {
  readonly id = 'city3d' as const;

  private panel: HTMLElement | null = null;

  constructor(
    private selectedPlanet: SelectedPlanetRef,
    private readonly context: ModeContext,
  ) {}

  mount() {
    const panel = document.createElement('section');
    panel.className = 'city-reset-panel';

    const title = document.createElement('h2');
    title.className = 'city-reset-panel__title';
    title.textContent = 'City View reset in progress';

    const subtitle = document.createElement('p');
    subtitle.className = 'city-reset-panel__subtitle';
    subtitle.textContent = `Planet ${this.selectedPlanet.id.toUpperCase()} · legacy city pipeline removed`;

    const backButton = document.createElement('button');
    backButton.type = 'button';
    backButton.className = 'planet-back-button';
    backButton.textContent = 'Back to Planet';
    backButton.addEventListener('click', () => this.context.onRequestMode('planet3d'));

    panel.append(title, subtitle, backButton);
    this.context.host.appendChild(panel);
    this.panel = panel;
  }

  resize() {}

  update() {}

  setSelectedPlanet(nextPlanet: SelectedPlanetRef) {
    this.selectedPlanet = nextPlanet;
    const subtitle = this.panel?.querySelector('.city-reset-panel__subtitle');
    if (subtitle) {
      subtitle.textContent = `Planet ${nextPlanet.id.toUpperCase()} · legacy city pipeline removed`;
    }
  }

  destroy() {
    this.panel?.remove();
    this.panel = null;
  }
}
