import type { GalaxyData, GalaxyNode } from '@/game/render/types';
import type { ModeContext, RenderModeController } from '@/game/render/modes/RenderModeController';
import type { SelectedPlanetRef } from '@/game/render/types';
import { generateSeededStarfield } from '@/game/render/starfield';

interface ViewTransform {
  x: number;
  y: number;
  zoom: number;
}

interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
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
  private readonly starfield = generateSeededStarfield(0xdecafbad, 1400, { min: 8, max: 18 });

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
  private minZoom = 0.6;
  private maxZoom = 3.1;
  private initialViewSnapshot: Galaxy2DViewSnapshot | null = null;
  private nodeBounds: Bounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };

  private infoPanel: HTMLDivElement | null = null;
  private infoTitle: HTMLHeadingElement | null = null;
  private infoMeta: HTMLParagraphElement | null = null;
  private infoSlotSummary: HTMLParagraphElement | null = null;
  private infoSlotList: HTMLUListElement | null = null;

  constructor(
    private readonly galaxy: GalaxyData,
    private readonly context: ModeContext,
    options?: Galaxy2DModeOptions,
  ) {
    this.selectedNodeId = options?.initialSelectedPlanet?.id ?? null;
    this.initialViewSnapshot = options?.initialViewSnapshot ?? null;
    this.nodeBounds = this.computeNodeBounds();
  }

  mount() {
    if (!this.ctx) return;

    this.canvas.className = 'render-surface render-surface--galaxy';
    this.context.host.appendChild(this.canvas);
    this.context.host.style.cursor = 'grab';

    this.mountInfoPanel();

    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false });

    if (this.initialViewSnapshot) {
      this.transform = { ...this.initialViewSnapshot.transform };
      this.updateZoomBounds();
      this.clampTransform();
    } else {
      this.centerMap();
    }

    this.refreshInfoPanel();
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

    this.updateZoomBounds();
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
    this.infoPanel?.remove();
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
      if (!this.isDragging) {
        this.context.host.style.cursor = this.hoveredNodeId ? 'pointer' : 'grab';
      }
      this.refreshInfoPanel();
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
        this.refreshInfoPanel();
        this.invalidate();
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
    this.drawScreenBackground();

    this.ctx.save();
    this.ctx.translate(this.transform.x, this.transform.y);
    this.ctx.scale(this.transform.zoom, this.transform.zoom);

    this.drawConnections();
    for (const node of this.galaxy.nodes) {
      this.drawNode(node);
    }

    this.ctx.restore();
  }

  private drawScreenBackground() {
    if (!this.ctx) return;

    this.ctx.fillStyle = '#02050d';
    this.ctx.fillRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.starfield.length; i += 1) {
      const star = this.starfield[i];
      const sx = ((star.x * 0.5 + star.z * 0.5) * 20 + this.width * 0.5 + i * 3.1) % this.width;
      const sy = ((star.y * 0.7 - star.z * 0.35) * 18 + this.height * 0.5 + i * 1.9) % this.height;
      const px = sx < 0 ? sx + this.width : sx;
      const py = sy < 0 ? sy + this.height : sy;
      this.ctx.fillStyle = `rgba(191, 216, 255, ${0.18 + star.intensity * 0.34})`;
      this.ctx.beginPath();
      this.ctx.arc(px, py, star.size * 0.7, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawConnections() {
    if (!this.ctx) return;

    this.ctx.strokeStyle = 'rgba(84, 145, 184, 0.06)';
    this.ctx.lineWidth = 0.8 / this.transform.zoom;

    for (let i = 0; i < this.galaxy.nodes.length; i += 1) {
      const source = this.galaxy.nodes[i];
      let nearestA: GalaxyNode | null = null;
      let nearestB: GalaxyNode | null = null;
      let da = Number.POSITIVE_INFINITY;
      let db = Number.POSITIVE_INFINITY;

      for (let j = 0; j < this.galaxy.nodes.length; j += 1) {
        if (i === j) continue;
        const target = this.galaxy.nodes[j];
        const d = Math.hypot(source.x - target.x, source.y - target.y);
        if (d < da) {
          nearestB = nearestA;
          db = da;
          nearestA = target;
          da = d;
        } else if (d < db) {
          nearestB = target;
          db = d;
        }
      }

      for (const target of [nearestA, nearestB]) {
        if (!target || target.id < source.id) continue;
        this.ctx.beginPath();
        this.ctx.moveTo(source.x, source.y);
        this.ctx.lineTo(target.x, target.y);
        this.ctx.stroke();
      }
    }
  }

  private drawNode(node: GalaxyNode) {
    if (!this.ctx) return;

    const isHovered = node.id === this.hoveredNodeId;
    const isSelected = node.id === this.selectedNodeId;
    const radius = this.getNodeRadius(node) * (isHovered ? 1.14 : 1);
    const style = getBiomeStyle(node.archetype);

    this.ctx.beginPath();
    this.ctx.fillStyle = style.halo;
    this.ctx.arc(node.x, node.y, radius + 3.2, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.fillStyle = style.rim;
    this.ctx.arc(node.x, node.y, radius + 0.9, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.fillStyle = style.base;
    this.ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.fillStyle = style.core;
    this.ctx.arc(node.x - radius * 0.25, node.y - radius * 0.2, radius * 0.48, 0, Math.PI * 2);
    this.ctx.fill();

    if (style.ring) {
      this.ctx.beginPath();
      this.ctx.strokeStyle = style.ring;
      this.ctx.lineWidth = clamp(1.4 / this.transform.zoom, 0.7, 1.6);
      this.ctx.ellipse(node.x, node.y, radius + 1.7, radius * 0.65, Math.PI * 0.2, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    if (isHovered || isSelected) {
      this.ctx.beginPath();
      this.ctx.strokeStyle = isSelected ? 'rgba(196, 241, 255, 0.96)' : 'rgba(154, 227, 255, 0.82)';
      this.ctx.lineWidth = clamp(1.8 / this.transform.zoom, 0.9, 2.1);
      this.ctx.arc(node.x, node.y, radius + this.getFocusHalo(), 0, Math.PI * 2);
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
      const hitRadius = this.getNodeRadius(node) + this.getFocusHalo();
      const hit = hitRadius ** 2;
      if (dx * dx + dy * dy <= hit) {
        return node;
      }
    }

    return null;
  }

  private centerMap() {
    const bounds = this.nodeBounds;
    const occupiedWidth = Math.max(1, bounds.maxX - bounds.minX);
    const occupiedHeight = Math.max(1, bounds.maxY - bounds.minY);
    const fitPadding = 0.14;
    const fitZoom = Math.min(
      this.width / (occupiedWidth * (1 + fitPadding)),
      this.height / (occupiedHeight * (1 + fitPadding)),
    );

    this.updateZoomBounds();
    this.transform.zoom = clamp(fitZoom, this.minZoom, this.maxZoom);

    const centerX = (bounds.minX + bounds.maxX) * 0.5;
    const centerY = (bounds.minY + bounds.maxY) * 0.5;
    this.transform.x = this.width * 0.5 - centerX * this.transform.zoom;
    this.transform.y = this.height * 0.5 - centerY * this.transform.zoom;
    this.clampTransform();
  }

  private clampTransform() {
    const bounds = this.nodeBounds;
    const worldPadding = 80;
    const minWorldX = Math.max(0, bounds.minX - worldPadding);
    const maxWorldX = Math.min(this.galaxy.width, bounds.maxX + worldPadding);
    const minWorldY = Math.max(0, bounds.minY - worldPadding);
    const maxWorldY = Math.min(this.galaxy.height, bounds.maxY + worldPadding);

    const minX = this.width - maxWorldX * this.transform.zoom;
    const maxX = -minWorldX * this.transform.zoom;
    const minY = this.height - maxWorldY * this.transform.zoom;
    const maxY = -minWorldY * this.transform.zoom;

    this.transform.x = clamp(this.transform.x, Math.min(minX, maxX), Math.max(minX, maxX));
    this.transform.y = clamp(this.transform.y, Math.min(minY, maxY), Math.max(minY, maxY));
  }

  private updateZoomBounds() {
    const bounds = this.nodeBounds;
    const occupiedWidth = Math.max(1, bounds.maxX - bounds.minX);
    const occupiedHeight = Math.max(1, bounds.maxY - bounds.minY);
    const fit = Math.min(this.width / occupiedWidth, this.height / occupiedHeight);
    this.minZoom = clamp(fit * 0.78, 0.7, 1.3);
    this.maxZoom = Math.max(2.7, this.minZoom + 1.2);
    this.transform.zoom = clamp(this.transform.zoom, this.minZoom, this.maxZoom);
  }

  private computeNodeBounds(): Bounds {
    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const node of this.galaxy.nodes) {
      minX = Math.min(minX, node.x - node.radius);
      maxX = Math.max(maxX, node.x + node.radius);
      minY = Math.min(minY, node.y - node.radius);
      maxY = Math.max(maxY, node.y + node.radius);
    }

    if (!Number.isFinite(minX)) return { minX: 0, maxX: this.galaxy.width, minY: 0, maxY: this.galaxy.height };
    return { minX, maxX, minY, maxY };
  }

  private invalidate() {
    this.dirty = true;
  }

  private getNodeRadius(node: GalaxyNode) {
    const zoomT = normalize(this.transform.zoom, this.minZoom, this.maxZoom);
    const emphasis = 1.18 - zoomT * 0.18;
    return node.radius * emphasis;
  }

  private getFocusHalo() {
    const zoomT = normalize(this.transform.zoom, this.minZoom, this.maxZoom);
    return 5 - zoomT * 1.7;
  }

  setSelectedPlanet(nextPlanet: SelectedPlanetRef) {
    this.selectedNodeId = nextPlanet.id;
    this.refreshInfoPanel();
    this.invalidate();
  }

  getViewSnapshot(): Galaxy2DViewSnapshot {
    return {
      transform: { ...this.transform },
    };
  }

  private mountInfoPanel() {
    const panel = document.createElement('div');
    panel.className = 'galaxy-inspect-panel';

    const title = document.createElement('h2');
    title.className = 'galaxy-inspect-title';

    const meta = document.createElement('p');
    meta.className = 'galaxy-inspect-meta';

    const slotSummary = document.createElement('p');
    slotSummary.className = 'galaxy-inspect-meta';

    const slotList = document.createElement('ul');
    slotList.className = 'galaxy-inspect-slots';

    panel.appendChild(title);
    panel.appendChild(meta);
    panel.appendChild(slotSummary);
    panel.appendChild(slotList);

    this.context.host.appendChild(panel);
    this.infoPanel = panel;
    this.infoTitle = title;
    this.infoMeta = meta;
    this.infoSlotSummary = slotSummary;
    this.infoSlotList = slotList;
  }

  private refreshInfoPanel() {
    if (!this.infoPanel || !this.infoTitle || !this.infoMeta || !this.infoSlotSummary || !this.infoSlotList) return;

    const focusNode = this.galaxy.nodes.find((node) => node.id === this.selectedNodeId)
      ?? this.galaxy.nodes.find((node) => node.id === this.hoveredNodeId)
      ?? null;

    if (!focusNode) {
      this.infoPanel.style.opacity = '0.75';
      this.infoTitle.textContent = 'Select a planet';
      this.infoMeta.textContent = 'Click a world to inspect biome and settlement slots.';
      this.infoSlotSummary.textContent = '';
      this.infoSlotList.innerHTML = '';
      return;
    }

    this.infoPanel.style.opacity = '1';
    this.infoTitle.textContent = focusNode.name;
    this.infoMeta.textContent = `Biome: ${toDisplayArchetype(focusNode.archetype)}`;

    const occupied = focusNode.slots.filter((slot) => slot.owner).length;
    this.infoSlotSummary.textContent = `${occupied}/${focusNode.slots.length} slots occupied`;

    this.infoSlotList.innerHTML = '';
    for (let i = 0; i < focusNode.slots.length; i += 1) {
      const slot = focusNode.slots[i];
      const line = document.createElement('li');
      line.className = 'galaxy-inspect-slot';
      line.textContent = slot.owner
        ? `Slot ${i + 1} — occupied — owner: ${slot.owner}`
        : `Slot ${i + 1} — free`;
      this.infoSlotList.appendChild(line);
    }
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalize(value: number, min: number, max: number) {
  if (max <= min) return 0;
  return clamp((value - min) / (max - min), 0, 1);
}

function toDisplayArchetype(archetype: GalaxyNode['archetype']) {
  return `${archetype.charAt(0).toUpperCase()}${archetype.slice(1)}`;
}

function getBiomeStyle(archetype: GalaxyNode['archetype']) {
  const base: Record<GalaxyNode['archetype'], { base: string; core: string; rim: string; halo: string; ring?: string }> = {
    frozen: {
      base: '#d6eeff', core: '#f5fdff', rim: '#9fd7ff', halo: 'rgba(179, 222, 255, 0.2)', ring: 'rgba(205, 237, 255, 0.6)',
    },
    oceanic: {
      base: '#2c91c4', core: '#74d8ff', rim: '#b7f1ff', halo: 'rgba(116, 203, 255, 0.2)',
    },
    arid: {
      base: '#c39255', core: '#f1d09c', rim: '#f3bc73', halo: 'rgba(233, 179, 115, 0.18)',
    },
    volcanic: {
      base: '#4a2a2d', core: '#ff6f39', rim: '#d34a3f', halo: 'rgba(255, 120, 76, 0.22)',
    },
    mineral: {
      base: '#8b8198', core: '#dad1e6', rim: '#b9a8cc', halo: 'rgba(171, 155, 214, 0.2)', ring: 'rgba(208, 193, 240, 0.48)',
    },
    terrestrial: {
      base: '#4a8759', core: '#9fdea4', rim: '#8ec99a', halo: 'rgba(139, 214, 152, 0.2)',
    },
    barren: {
      base: '#7f7f7f', core: '#c8c8c8', rim: '#9f9f9f', halo: 'rgba(176, 176, 176, 0.16)',
    },
    jungle: {
      base: '#2d8740', core: '#79df80', rim: '#a1eba1', halo: 'rgba(113, 228, 131, 0.2)',
    },
  };

  return base[archetype];
}
