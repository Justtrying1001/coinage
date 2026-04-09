import * as PIXI from 'pixi.js';

interface Bounds {
  width: number;
  height: number;
}

interface Viewport {
  width: number;
  height: number;
}

export class PanController {
  private isDragging = false;

  private pointerId: number | null = null;

  private lastX = 0;

  private lastY = 0;

  private readonly onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    this.isDragging = true;
    this.pointerId = event.pointerId;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.host.style.cursor = 'grabbing';
  };

  private readonly onPointerMove = (event: PointerEvent) => {
    if (!this.isDragging || this.pointerId !== event.pointerId) return;
    const dx = event.clientX - this.lastX;
    const dy = event.clientY - this.lastY;
    this.lastX = event.clientX;
    this.lastY = event.clientY;

    this.world.x += dx;
    this.world.y += dy;
    this.clampToBounds();
  };

  private readonly onPointerUp = (event: PointerEvent) => {
    if (this.pointerId !== event.pointerId) return;
    this.isDragging = false;
    this.pointerId = null;
    this.host.style.cursor = 'grab';
  };

  constructor(
    private readonly host: HTMLDivElement,
    private readonly world: PIXI.Container,
    private viewport: Viewport,
    private readonly bounds: Bounds,
  ) {}

  mount() {
    this.host.style.cursor = 'grab';
    this.host.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
  }

  destroy() {
    this.host.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
  }

  setViewport(viewport: Viewport) {
    this.viewport = viewport;
    this.clampToBounds();
  }

  centerOn(point: PIXI.PointData) {
    this.world.x = this.viewport.width * 0.5 - point.x;
    this.world.y = this.viewport.height * 0.5 - point.y;
    this.clampToBounds();
  }

  private clampToBounds() {
    const minX = this.viewport.width - this.bounds.width;
    const minY = this.viewport.height - this.bounds.height;

    this.world.x = clamp(this.world.x, Math.min(0, minX), 0);
    this.world.y = clamp(this.world.y, Math.min(0, minY), 0);
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
