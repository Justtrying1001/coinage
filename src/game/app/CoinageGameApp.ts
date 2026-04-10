import { WebGLRenderer } from 'three';
import { PanController } from '@/game/input/PanController';
import { MapViewScene } from '@/game/scenes/MapViewScene';
import { generateWorld } from '@/game/world/worldGenerator';

interface CoinageGameConfig {
  seed: number;
  worldWidth: number;
  worldHeight: number;
}

export class CoinageGameApp {
  private renderer: WebGLRenderer | null = null;

  private scene: MapViewScene | null = null;

  private resizeObserver: ResizeObserver | null = null;

  private panController: PanController | null = null;

  private mounted = false;

  private rafId = 0;

  private previousTick = 0;

  constructor(
    private readonly host: HTMLDivElement,
    private readonly config: CoinageGameConfig,
  ) {}

  mount() {
    if (this.mounted) return;

    const world = generateWorld({
      seed: this.config.seed,
      width: this.config.worldWidth,
      height: this.config.worldHeight,
      factionCount: 560,
    });

    const width = Math.max(1, this.host.clientWidth);
    const height = Math.max(1, this.host.clientHeight);

    const renderer = new WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    this.host.appendChild(renderer.domElement);

    const scene = new MapViewScene(world, { width, height });
    const panController = new PanController(this.host, scene.camera, { width, height }, { width: world.width, height: world.height });

    panController.mount();
    panController.centerOn({ x: world.width * 0.5, y: world.height * 0.58 });

    this.host.addEventListener('pointermove', this.handlePointerMove);
    this.host.addEventListener('pointerup', this.handlePointerUp);

    this.resizeObserver = new ResizeObserver(() => {
      if (!this.renderer || !this.scene || !this.panController) return;
      const nextWidth = Math.max(1, this.host.clientWidth);
      const nextHeight = Math.max(1, this.host.clientHeight);
      this.renderer.setSize(nextWidth, nextHeight);
      this.panController.setViewport({ width: nextWidth, height: nextHeight });
      this.panController.updateViewportRect();
      this.scene.onResize(nextWidth, nextHeight);
    });
    this.resizeObserver.observe(this.host);

    this.renderer = renderer;
    this.scene = scene;
    this.panController = panController;
    this.mounted = true;

    this.previousTick = performance.now();
    this.rafId = requestAnimationFrame(this.renderLoop);
  }

  destroy() {
    if (!this.mounted) return;

    cancelAnimationFrame(this.rafId);
    this.rafId = 0;

    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    this.host.removeEventListener('pointermove', this.handlePointerMove);
    this.host.removeEventListener('pointerup', this.handlePointerUp);

    this.panController?.destroy();
    this.panController = null;

    this.scene?.destroy();
    this.scene = null;

    this.renderer?.dispose();
    this.renderer = null;

    this.host.innerHTML = '';
    this.mounted = false;
  }

  private readonly renderLoop = (timestamp: number) => {
    if (!this.renderer || !this.scene || !this.panController) return;

    const delta = timestamp - this.previousTick;
    this.previousTick = timestamp;

    this.scene.setPointerNdc(this.panController.getPointerNdc());
    this.scene.update(delta);
    this.renderer.render(this.scene.scene, this.scene.camera);

    this.rafId = requestAnimationFrame(this.renderLoop);
  };

  private readonly handlePointerMove = () => {
    if (!this.scene || !this.panController) return;
    this.scene.setPointerNdc(this.panController.getPointerNdc());
    this.scene.pointerMove();
  };

  private readonly handlePointerUp = () => {
    if (!this.scene || !this.panController) return;
    this.scene.setPointerNdc(this.panController.getPointerNdc());
    this.scene.pointerTap();
  };
}
