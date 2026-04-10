import type { RenderMode, SelectedPlanetRef } from '@/game/render/types';
import { generateGalaxyData, selectPrimaryPlanet } from '@/game/world/galaxyGenerator';
import { Galaxy2DMode } from '@/game/render/modes/Galaxy2DMode';
import type { Galaxy2DViewSnapshot } from '@/game/render/modes/Galaxy2DMode';
import type { ModeContext, RenderModeController } from '@/game/render/modes/RenderModeController';
import { Planet3DMode } from '@/game/render/modes/Planet3DMode';

interface RenderModeFactory {
  createGalaxyMode: (
    context: ModeContext,
    options?: { selectedPlanet?: SelectedPlanetRef | null; viewSnapshot?: Galaxy2DViewSnapshot | null },
  ) => RenderModeController;
  createPlanetMode: (planet: SelectedPlanetRef, context: ModeContext) => RenderModeController;
}

interface CoinageRenderConfig {
  seed: number;
  galaxyWidth: number;
  galaxyHeight: number;
  planetCount?: number;
  initialMode?: RenderMode;
  initialSelectedPlanet?: SelectedPlanetRef;
  onSelectedPlanetChange?: (planet: SelectedPlanetRef) => void;
  modeFactory?: RenderModeFactory;
}

export class CoinageRenderApp {
  private mode: RenderMode = 'galaxy2d';

  private activeController: RenderModeController | null = null;

  private rafId: number | null = null;

  private lastTime = 0;

  private mounted = false;

  private resizeObserver: ResizeObserver | null = null;

  private selectedPlanet: SelectedPlanetRef | null = null;

  private galaxyData;

  private galaxyViewSnapshot: Galaxy2DViewSnapshot | null = null;

  private readonly modeFactory: RenderModeFactory;

  constructor(
    private readonly host: HTMLDivElement,
    private readonly config: CoinageRenderConfig,
  ) {
    this.mode = config.initialMode ?? 'galaxy2d';
    this.galaxyData = generateGalaxyData({
      seed: this.config.seed,
      width: this.config.galaxyWidth,
      height: this.config.galaxyHeight,
      nodeCount: this.config.planetCount,
    });
    this.selectedPlanet = config.initialSelectedPlanet ?? selectPrimaryPlanet(this.galaxyData);
    this.modeFactory = config.modeFactory ?? {
      createGalaxyMode: (context, options) =>
        new Galaxy2DMode(this.galaxyData, context, {
          initialSelectedPlanet: options?.selectedPlanet ?? this.selectedPlanet,
          initialViewSnapshot: options?.viewSnapshot ?? this.galaxyViewSnapshot,
        }),
      createPlanetMode: (planet, context) => new Planet3DMode(planet, context),
    };
  }

  mount() {
    if (this.mounted) return;

    this.mounted = true;
    this.host.innerHTML = '';

    this.switchMode(this.mode);

    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
    });
    this.resizeObserver.observe(this.host);

    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  setMode(nextMode: RenderMode) {
    this.switchMode(nextMode);
  }

  setSelectedPlanet(planet: SelectedPlanetRef) {
    this.selectedPlanet = planet;
    if (this.activeController && 'setSelectedPlanet' in this.activeController && typeof this.activeController.setSelectedPlanet === 'function') {
      this.activeController.setSelectedPlanet(planet);
    }
  }

  destroy() {
    if (!this.mounted) return;

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    this.activeController?.destroy();
    this.activeController = null;

    this.host.innerHTML = '';
    this.mounted = false;
  }

  private readonly tick = (time: number) => {
    if (!this.mounted) return;

    const deltaMs = time - this.lastTime;
    this.lastTime = time;

    this.activeController?.update(deltaMs);
    this.rafId = requestAnimationFrame(this.tick);
  };

  private switchMode(nextMode: RenderMode) {
    if (this.mode === nextMode && this.activeController) {
      if (
        nextMode === 'planet3d' &&
        this.selectedPlanet &&
        'setSelectedPlanet' in this.activeController &&
        typeof this.activeController.setSelectedPlanet === 'function'
      ) {
        this.activeController.setSelectedPlanet(this.selectedPlanet);
      }
      this.resize();
      return;
    }

    const previousMode = this.mode;
    this.mode = nextMode;

    if (
      this.activeController &&
      previousMode === 'galaxy2d' &&
      'getViewSnapshot' in this.activeController &&
      typeof this.activeController.getViewSnapshot === 'function'
    ) {
      this.galaxyViewSnapshot = this.activeController.getViewSnapshot();
    }
    this.activeController?.destroy();

    const context = {
      host: this.host,
      onSelectPlanet: (planet: SelectedPlanetRef) => {
        this.setSelectedPlanet(planet);
        this.config.onSelectedPlanetChange?.(planet);
      },
      onRequestMode: (mode: RenderMode) => {
        this.switchMode(mode);
      },
    };

    this.activeController =
      nextMode === 'galaxy2d'
        ? this.modeFactory.createGalaxyMode(context, {
            selectedPlanet: this.selectedPlanet,
            viewSnapshot: this.galaxyViewSnapshot,
          })
        : this.modeFactory.createPlanetMode(this.selectedPlanet ?? selectPrimaryPlanet(this.galaxyData), context);

    this.activeController.mount();
    this.resize();
  }

  private resize() {
    const width = this.host.clientWidth || 1;
    const height = this.host.clientHeight || 1;
    this.activeController?.resize(width, height);
  }

}
