import type { ModeContext, RenderModeController } from '@/game/render/modes/RenderModeController';
import type { SelectedPlanetRef } from '@/game/render/types';
import { perfLog, perfMark, perfMeasure } from '@/game/perf/perfMarks';

export class LazyPlanet3DMode implements RenderModeController {
  readonly id = 'planet3d' as const;

  private activeMode: RenderModeController | null = null;
  private destroyed = false;
  private pendingSize: { width: number; height: number } | null = null;
  private pendingSelectedPlanet: SelectedPlanetRef | null = null;
  private loadingOverlay: HTMLDivElement | null = null;

  constructor(
    private selectedPlanet: SelectedPlanetRef,
    private readonly context: ModeContext,
  ) {}

  mount() {
    this.showLoadingOverlay();
    perfMark('planet.mount.start');
    perfMark('planet.lazy.import.start');

    void import('@/game/render/modes/Planet3DMode')
      .then(({ Planet3DMode }) => {
        perfMark('planet.lazy.import.end');
        perfMeasure('planet.lazy.import', 'planet.lazy.import.start', 'planet.lazy.import.end');
        if (this.destroyed) return;

        this.activeMode = new Planet3DMode(this.pendingSelectedPlanet ?? this.selectedPlanet, this.context);
        this.activeMode.mount();

        if (this.pendingSize) {
          this.activeMode.resize(this.pendingSize.width, this.pendingSize.height);
        }
        this.hideLoadingOverlay();
      })
      .catch((error) => {
        perfLog('planet.lazy.import.failed', { error });
        this.hideLoadingOverlay();
      });
  }

  resize(width: number, height: number) {
    this.pendingSize = { width, height };
    this.activeMode?.resize(width, height);
  }

  update(deltaMs: number) {
    this.activeMode?.update(deltaMs);
  }

  setSelectedPlanet(nextPlanet: SelectedPlanetRef) {
    this.pendingSelectedPlanet = nextPlanet;
    this.selectedPlanet = nextPlanet;
    const mode = this.activeMode as RenderModeController & { setSelectedPlanet?: (planet: SelectedPlanetRef) => void } | null;
    mode?.setSelectedPlanet?.(nextPlanet);
  }

  destroy() {
    this.destroyed = true;
    this.hideLoadingOverlay();
    this.activeMode?.destroy();
    this.activeMode = null;
  }

  private showLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'planet-loading-overlay';
    overlay.textContent = 'Preparing Planet…';
    this.context.host.appendChild(overlay);
    this.loadingOverlay = overlay;
  }

  private hideLoadingOverlay() {
    this.loadingOverlay?.remove();
    this.loadingOverlay = null;
  }
}
