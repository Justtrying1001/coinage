import type { GalaxyData, GalaxyNode } from '@/game/render/types';
import type { ModeContext, RenderModeController } from '@/game/render/modes/RenderModeController';

interface ViewTransform {
  x: number;
  y: number;
  zoom: number;
}

export class Galaxy2DMode implements RenderModeController {
  readonly id = 'galaxy2d' as const;

  private readonly canvas = document.createElement('canvas');

  private readonly ctx = this.canvas.getContext('2d');

  private transform: ViewTransform = { x: 0, y: 0, zoom: 1 };

  private width = 1;

  private height = 1;

  private hoveredNodeId: string | null = null;

  private selectedNodeId: string | null = null;

  private isDragging = false;

  private pointerId: number | null = null;

  private lastX = 0;

  private lastY = 0;

  private downX = 0;

  private downY = 0;

  private dirty = true;

  constructor(
    private readonly galaxy: GalaxyData,
    private readonly context: ModeContext,
  ) {}

  mount() {
    if (!this.ctx) return;

    this.canvas.className = 'render-surface render-surface--galaxy';
    this.context.host.appendChild(this.canvas);
    this.context.host.style.cursor = 'grab';

    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false });

    this.centerMap();
    this.draw();
  }

  resize(width: number, height: number) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(this.width * dpr);
    this.canvas.height = Math.floor(this.height * dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.clampTransform();
    this.invalidate();
  }

  update() {
    if (!this.dirty) return;
    this.draw();
    this.dirty = false;
  }

  destroy() {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
    this.canvas.removeEventListener('wheel', this.onWheel);
    this.canvas.remove();
    this.context.host.style.cursor = 'default';
  }

  private readonly onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    this.pointerId = event.pointerId;
    this.isDragging = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.downX = event.clientX;
    this.downY = event.clientY;
    this.context.host.style.cursor = 'grabbing';
    this.invalidate();
  };

  private readonly onPointerMove = (event: PointerEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;

    const nextHovered = this.pickNode(localX, localY)?.id ?? null;
    if (nextHovered !== this.hoveredNodeId) {
      this.hoveredNodeId = nextHovered;
      this.invalidate();
    }

    if (this.isDragging && this.pointerId === event.pointerId) {
      const dx = event.clientX - this.lastX;
      const dy = event.clientY - this.lastY;
      this.lastX = event.clientX;
      this.lastY = event.clientY;

      this.transform.x += dx;
      this.transform.y += dy;
      this.clampTransform();
      this.invalidate();
    }
  };

  private readonly onPointerUp = (event: PointerEvent) => {
    if (event.pointerId !== this.pointerId) return;

    const clickDistance = Math.hypot(event.clientX - this.downX, event.clientY - this.downY);
    if (clickDistance < 4) {
      const rect = this.canvas.getBoundingClientRect();
      const node = this.pickNode(event.clientX - rect.left, event.clientY - rect.top);
      if (node) {
        this.selectedNodeId = node.id;
        this.context.onSelectPlanet({ id: node.id, seed: node.seed });
        this.invalidate();
        this.context.onRequestMode('planet3d');
      }
    }

    this.pointerId = null;
    this.isDragging = false;
    this.context.host.style.cursor = 'grab';
    this.invalidate();
  };

  private readonly onWheel = (event: WheelEvent) => {
    event.preventDefault();
    const previous = this.transform.zoom;
    const next = clamp(previous * (event.deltaY < 0 ? 1.08 : 0.92), 0.55, 2.8);
    if (next === previous) return;

    const rect = this.canvas.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;

    const worldX = (localX - this.transform.x) / previous;
    const worldY = (localY - this.transform.y) / previous;

    this.transform.zoom = next;
    this.transform.x = localX - worldX * next;
    this.transform.y = localY - worldY * next;

    this.clampTransform();
    this.invalidate();
  };

  private draw() {
    if (!this.ctx) return;

    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = '#040811';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.save();
    this.ctx.translate(this.transform.x, this.transform.y);
    this.ctx.scale(this.transform.zoom, this.transform.zoom);

    this.drawBackdrop();
    for (const node of this.galaxy.nodes) {
      this.drawNode(node);
    }

    this.ctx.restore();
  }

  private drawBackdrop() {
    if (!this.ctx) return;
    this.ctx.fillStyle = 'rgba(82, 171, 213, 0.08)';
    for (let i = 0; i < this.galaxy.nodes.length; i += 7) {
      const node = this.galaxy.nodes[i];
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, 1.2, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawNode(node: GalaxyNode) {
    if (!this.ctx) return;

    const isHovered = node.id === this.hoveredNodeId;
    const isSelected = node.id === this.selectedNodeId;
    const alpha = node.populationBand === 'dense' ? 0.82 : node.populationBand === 'settled' ? 0.66 : 0.44;

    this.ctx.beginPath();
    this.ctx.fillStyle = isSelected ? 'rgba(173, 233, 255, 0.95)' : `rgba(130, 205, 238, ${alpha})`;
    this.ctx.arc(node.x, node.y, node.radius * (isHovered ? 1.35 : 1), 0, Math.PI * 2);
    this.ctx.fill();

    if (isHovered || isSelected) {
      this.ctx.beginPath();
      this.ctx.strokeStyle = isSelected ? 'rgba(139, 228, 255, 0.92)' : 'rgba(139, 228, 255, 0.55)';
      this.ctx.lineWidth = 1.3 / this.transform.zoom;
      this.ctx.arc(node.x, node.y, node.radius + 4.5, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }

  private pickNode(viewX: number, viewY: number): GalaxyNode | null {
    const wx = (viewX - this.transform.x) / this.transform.zoom;
    const wy = (viewY - this.transform.y) / this.transform.zoom;

    for (let i = this.galaxy.nodes.length - 1; i >= 0; i -= 1) {
      const node = this.galaxy.nodes[i];
      const dx = wx - node.x;
      const dy = wy - node.y;
      const hit = (node.radius + 4.5) ** 2;
      if (dx * dx + dy * dy <= hit) {
        return node;
      }
    }

    return null;
  }

  private centerMap() {
    this.transform.x = this.width * 0.5 - this.galaxy.width * 0.5;
    this.transform.y = this.height * 0.5 - this.galaxy.height * 0.5;
    this.transform.zoom = 1;
    this.clampTransform();
  }

  private clampTransform() {
    const viewWidth = this.galaxy.width * this.transform.zoom;
    const viewHeight = this.galaxy.height * this.transform.zoom;

    const minX = Math.min(0, this.width - viewWidth);
    const minY = Math.min(0, this.height - viewHeight);

    this.transform.x = clamp(this.transform.x, minX, 0);
    this.transform.y = clamp(this.transform.y, minY, 0);
  }

  private invalidate() {
    this.dirty = true;
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
