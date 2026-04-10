import { Vector2 } from 'three';
import type { OrthographicCamera } from 'three';

interface Bounds {
  width: number;
  height: number;
}

interface Viewport {
  width: number;
  height: number;
}

interface PointLike {
  x: number;
  y: number;
}

export class PanController {
  private isDragging = false;

  private pointerId: number | null = null;

  private lastX = 0;

  private lastY = 0;

  private readonly panScale = 1;

  private readonly pointerNdc: Vector2;

  private readonly onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    this.isDragging = true;
    this.pointerId = event.pointerId;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.host.style.cursor = 'grabbing';
  };

  private readonly onPointerMove = (event: PointerEvent) => {
    this.pointerNdc.x = ((event.clientX - this.viewportRect.left) / this.viewport.width) * 2 - 1;
    this.pointerNdc.y = -(((event.clientY - this.viewportRect.top) / this.viewport.height) * 2 - 1);

    if (!this.isDragging || this.pointerId !== event.pointerId) return;

    const dx = event.clientX - this.lastX;
    const dy = event.clientY - this.lastY;
    this.lastX = event.clientX;
    this.lastY = event.clientY;

    const worldUnitsPerScreenPx = ((this.camera.top - this.camera.bottom) / this.viewport.height) * this.panScale;
    this.camera.position.x -= dx * worldUnitsPerScreenPx;
    this.camera.position.y += dy * worldUnitsPerScreenPx;
    this.clampToBounds();
  };

  private readonly onPointerUp = (event: PointerEvent) => {
    if (this.pointerId !== event.pointerId) return;
    this.isDragging = false;
    this.pointerId = null;
    this.host.style.cursor = 'grab';
  };

  private viewportRect: DOMRect;

  constructor(
    private readonly host: HTMLDivElement,
    private readonly camera: OrthographicCamera,
    private viewport: Viewport,
    private readonly bounds: Bounds,
  ) {
    this.pointerNdc = new Vector2(0, 0);
    this.viewportRect = host.getBoundingClientRect();
  }

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
    this.viewportRect = this.host.getBoundingClientRect();
    this.clampToBounds();
  }

  centerOn(point: PointLike) {
    this.camera.position.x = point.x;
    this.camera.position.y = point.y;
    this.clampToBounds();
  }

  updateViewportRect() {
    this.viewportRect = this.host.getBoundingClientRect();
  }

  getPointerNdc() {
    return this.pointerNdc;
  }

  private clampToBounds() {
    const viewWidth = this.camera.right - this.camera.left;
    const viewHeight = this.camera.top - this.camera.bottom;
    const halfW = viewWidth / 2;
    const halfH = viewHeight / 2;

    const minX = halfW;
    const maxX = this.bounds.width - halfW;
    const minY = halfH;
    const maxY = this.bounds.height - halfH;

    this.camera.position.x = clamp(this.camera.position.x, minX, Math.max(minX, maxX));
    this.camera.position.y = clamp(this.camera.position.y, minY, Math.max(minY, maxY));
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
