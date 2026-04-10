import type { RenderMode, SelectedPlanetRef } from '@/game/render/types';
import { generateGalaxyData } from '@/game/world/galaxyGenerator';
import { Galaxy2DMode } from '@/game/render/modes/Galaxy2DMode';
import type { RenderModeController } from '@/game/render/modes/RenderModeController';
import { Planet3DMode } from '@/game/render/modes/Planet3DMode';

interface CoinageRenderConfig {
  seed: number;
  galaxyWidth: number;
  galaxyHeight: number;
  planetCount?: number;
  initialMode?: RenderMode;
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
    this.selectedPlanet = this.makeDeterministicSelection();
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
      if (nextMode === 'planet3d' && this.activeController instanceof Planet3DMode && this.selectedPlanet) {
        this.activeController.setSelectedPlanet(this.selectedPlanet);
      }
      this.resize();
      return;
    }

    this.mode = nextMode;
    this.activeController?.destroy();

    const context = {
      host: this.host,
      onSelectPlanet: (planet: SelectedPlanetRef) => {
        this.selectedPlanet = planet;
      },
      onRequestMode: (mode: RenderMode) => {
        this.switchMode(mode);
      },
    };

    this.activeController =
      nextMode === 'galaxy2d'
        ? new Galaxy2DMode(this.galaxyData, context)
        : new Planet3DMode(this.selectedPlanet ?? this.makeDeterministicSelection(), context);

    this.activeController.mount();
    this.resize();
  }

  private resize() {
    const width = this.host.clientWidth || 1;
    const height = this.host.clientHeight || 1;
    this.activeController?.resize(width, height);
  }

  private makeDeterministicSelection(): SelectedPlanetRef {
    const first = this.galaxyData.nodes[0];
    return { id: first.id, seed: first.seed };
  }
}
