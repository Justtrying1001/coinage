import type { GalaxyData, GalaxyNode } from '@/game/render/types';
import type { ModeContext, RenderModeController } from '@/game/render/modes/RenderModeController';
import type { SelectedPlanetRef } from '@/game/render/types';

interface ViewTransform {
  x: number;
  y: number;
  zoom: number;
}

export interface Galaxy2DViewSnapshot {
  transform: ViewTransform;
}

interface Galaxy2DModeOptions {
  initialSelectedPlanet?: SelectedPlanetRef | null;
  initialViewSnapshot?: Galaxy2DViewSnapshot | null;
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

  private readonly minZoom = 0.55;

  private readonly maxZoom = 2.8;

  private entryTransition:
    | {
        nodeId: string;
        startedAt: number;
        durationMs: number;
      }
    | null = null;

  private initialViewSnapshot: Galaxy2DViewSnapshot | null = null;

  constructor(
    private readonly galaxy: GalaxyData,
    private readonly context: ModeContext,
    options?: Galaxy2DModeOptions,
  ) {
    this.selectedNodeId = options?.initialSelectedPlanet?.id ?? null;
    this.initialViewSnapshot = options?.initialViewSnapshot ?? null;
  }

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

    if (this.initialViewSnapshot) {
      this.transform = { ...this.initialViewSnapshot.transform };
      this.clampTransform();
    } else {
      this.centerMap();
    }
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
    if (this.entryTransition) {
      this.invalidate();
      const elapsed = performance.now() - this.entryTransition.startedAt;
      if (elapsed >= this.entryTransition.durationMs) {
        this.entryTransition = null;
        this.context.onRequestMode('planet3d');
        return;
      }
    }

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
    this.entryTransition = null;
  }

  private readonly onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    if (this.entryTransition) return;
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
    if (this.entryTransition) return;
    const rect = this.canvas.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;

    const nextHovered = this.pickNode(localX, localY)?.id ?? null;
    if (nextHovered !== this.hoveredNodeId) {
      this.hoveredNodeId = nextHovered;
      if (!this.isDragging) {
        this.context.host.style.cursor = this.hoveredNodeId ? 'pointer' : 'grab';
      }
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
        this.entryTransition = {
          nodeId: node.id,
          startedAt: performance.now(),
          durationMs: 220,
        };
        this.invalidate();
      }
    }

    this.pointerId = null;
    this.isDragging = false;
    this.context.host.style.cursor = 'grab';
    this.invalidate();
  };

  private readonly onWheel = (event: WheelEvent) => {
    if (this.entryTransition) return;
    event.preventDefault();
    const previous = this.transform.zoom;
    const next = clamp(previous * (event.deltaY < 0 ? 1.08 : 0.92), this.minZoom, this.maxZoom);
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
    this.drawHud();
  }

  private drawBackdrop() {
    if (!this.ctx) return;
    this.ctx.fillStyle = 'rgba(82, 171, 213, 0.09)';
    for (let i = 0; i < this.galaxy.nodes.length; i += 7) {
      const node = this.galaxy.nodes[i];
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, 1.1, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.strokeStyle = 'rgba(84, 145, 184, 0.05)';
    this.ctx.lineWidth = 1 / this.transform.zoom;
    this.ctx.strokeRect(0, 0, this.galaxy.width, this.galaxy.height);
  }

  private drawNode(node: GalaxyNode) {
    if (!this.ctx) return;

    const isHovered = node.id === this.hoveredNodeId;
    const isSelected = node.id === this.selectedNodeId;
    const transitionSelected = node.id === this.entryTransition?.nodeId;
    const transitionT = transitionSelected ? this.getEntryProgress() : 0;
    const alpha = node.populationBand === 'dense' ? 0.92 : node.populationBand === 'settled' ? 0.72 : 0.5;
    const radius = this.getNodeRadius(node) * (isHovered ? 1.18 : 1) + transitionT * 1.8;
    const fillColor =
      node.populationBand === 'dense'
        ? `rgba(180, 235, 255, ${alpha})`
        : node.populationBand === 'settled'
          ? `rgba(126, 206, 246, ${alpha})`
          : `rgba(96, 171, 218, ${alpha})`;

    this.ctx.beginPath();
    this.ctx.fillStyle = isSelected ? 'rgba(214, 244, 255, 0.98)' : fillColor;
    this.ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
    this.ctx.fill();

    if (isHovered || isSelected || transitionSelected) {
      this.ctx.beginPath();
      this.ctx.strokeStyle = isSelected || transitionSelected ? 'rgba(149, 236, 255, 0.96)' : 'rgba(149, 236, 255, 0.72)';
      this.ctx.lineWidth = clamp(1.6 / this.transform.zoom, 0.8, 2);
      this.ctx.arc(node.x, node.y, radius + this.getFocusHalo(), 0, Math.PI * 2);
      this.ctx.stroke();

      if (isSelected || transitionSelected) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = transitionSelected ? `rgba(149, 236, 255, ${0.45 + transitionT * 0.45})` : 'rgba(149, 236, 255, 0.48)';
        this.ctx.lineWidth = clamp(1 / this.transform.zoom, 0.6, 1.4);
        this.ctx.arc(node.x, node.y, radius + this.getFocusHalo() + 4.4 + transitionT * 9.5, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    }
  }

  private pickNode(viewX: number, viewY: number): GalaxyNode | null {
    const wx = (viewX - this.transform.x) / this.transform.zoom;
    const wy = (viewY - this.transform.y) / this.transform.zoom;

    for (let i = this.galaxy.nodes.length - 1; i >= 0; i -= 1) {
      const node = this.galaxy.nodes[i];
      const dx = wx - node.x;
      const dy = wy - node.y;
      const hitRadius = this.getNodeRadius(node) + this.getFocusHalo();
      const hit = hitRadius ** 2;
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

  private drawHud() {
    if (!this.ctx) return;

    const focusNode = this.galaxy.nodes.find((node) => node.id === this.hoveredNodeId)
      ?? this.galaxy.nodes.find((node) => node.id === this.selectedNodeId);

    if (!focusNode) return;

    const screenX = focusNode.x * this.transform.zoom + this.transform.x;
    const screenY = focusNode.y * this.transform.zoom + this.transform.y;
    const panelX = clamp(screenX + 16, 12, this.width - 228);
    const panelY = clamp(screenY - 62, 12, this.height - 68);

    this.ctx.save();
    this.ctx.fillStyle = 'rgba(8, 22, 35, 0.86)';
    this.ctx.strokeStyle = 'rgba(128, 214, 255, 0.46)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    roundRect(this.ctx, panelX, panelY, 216, 54, 8);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.fillStyle = '#dbf2ff';
    this.ctx.font = '600 12px Inter, system-ui, sans-serif';
    this.ctx.fillText(focusNode.name, panelX + 10, panelY + 19);

    this.ctx.fillStyle = 'rgba(189, 224, 244, 0.9)';
    this.ctx.font = '500 11px Inter, system-ui, sans-serif';
    this.ctx.fillText(`ID ${focusNode.id} • ${focusNode.populationBand.toUpperCase()}`, panelX + 10, panelY + 37);
    this.ctx.restore();
  }

  private getNodeRadius(node: GalaxyNode) {
    const zoomT = normalize(this.transform.zoom, this.minZoom, this.maxZoom);
    const emphasis = 1.3 - zoomT * 0.25;
    return node.radius * emphasis;
  }

  private getFocusHalo() {
    const zoomT = normalize(this.transform.zoom, this.minZoom, this.maxZoom);
    return 5.4 - zoomT * 2.2;
  }

  setSelectedPlanet(nextPlanet: SelectedPlanetRef) {
    this.selectedNodeId = nextPlanet.id;
    this.invalidate();
  }

  getViewSnapshot(): Galaxy2DViewSnapshot {
    return {
      transform: { ...this.transform },
    };
  }

  private getEntryProgress() {
    if (!this.entryTransition) return 0;
    const elapsed = performance.now() - this.entryTransition.startedAt;
    return clamp(elapsed / this.entryTransition.durationMs, 0, 1);
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalize(value: number, min: number, max: number) {
  if (max <= min) return 0;
  return clamp((value - min) / (max - min), 0, 1);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
