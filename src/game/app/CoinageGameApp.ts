import * as PIXI from 'pixi.js';
import { PanController } from '@/game/input/PanController';
import type { GameScene } from '@/game/scenes/GameScene';
import { MapViewScene } from '@/game/scenes/MapViewScene';
import { generateWorld } from '@/game/world/worldGenerator';

interface CoinageGameConfig {
  seed: number;
  worldWidth: number;
  worldHeight: number;
}

export class CoinageGameApp {
  private app: PIXI.Application | null = null;

  private worldContainer = new PIXI.Container();

  private scene: GameScene | null = null;

  private resizeObserver: ResizeObserver | null = null;

  private panController: PanController | null = null;

  private mounted = false;

  constructor(
    private readonly host: HTMLDivElement,
    private readonly config: CoinageGameConfig,
  ) {}

  mount() {
    void this.bootstrap();
  }

  destroy() {
    if (!this.mounted) return;

    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    this.panController?.destroy();
    this.panController = null;

    this.scene?.destroy();
    this.scene = null;

    this.worldContainer.removeChildren();

    this.app?.destroy(true, { children: true, texture: false, textureSource: false });
    this.app = null;

    this.host.innerHTML = '';
    this.mounted = false;
  }

  private async bootstrap() {
    if (this.mounted) return;

    const app = new PIXI.Application();
    await app.init({
      antialias: true,
      autoDensity: true,
      backgroundAlpha: 0,
      resizeTo: this.host,
      preference: 'webgl',
      powerPreference: 'high-performance',
    });

    this.app = app;
    this.mounted = true;

    this.host.appendChild(app.canvas);
    app.stage.addChild(this.worldContainer);

    const world = generateWorld({
      seed: this.config.seed,
      width: this.config.worldWidth,
      height: this.config.worldHeight,
      factionCount: 560,
    });

    const scene = new MapViewScene(world);
    this.scene = scene;
    this.worldContainer.addChild(scene.root);

    this.panController = new PanController(
      this.host,
      this.worldContainer,
      { width: app.screen.width, height: app.screen.height },
      { width: world.width, height: world.height },
    );
    this.panController.mount();
    this.panController.centerOn({ x: world.width * 0.5, y: world.height * 0.58 });

    app.ticker.add((ticker) => {
      scene.update(ticker.deltaMS);
    });

    this.resizeObserver = new ResizeObserver(() => {
      if (!this.app || !this.scene || !this.panController) return;
      this.panController.setViewport({ width: this.app.screen.width, height: this.app.screen.height });
      this.scene.onResize(this.app.screen.width, this.app.screen.height);
    });
    this.resizeObserver.observe(this.host);
  }
}
