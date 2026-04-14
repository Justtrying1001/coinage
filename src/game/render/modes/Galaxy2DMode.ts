import type { GalaxyData, GalaxyNode, PlanetSettlementTelemetry } from '@/game/render/types';
import type { ModeContext, RenderModeController } from '@/game/render/modes/RenderModeController';
import type { SelectedPlanetRef } from '@/game/render/types';
import { generateSeededStarfield } from '@/game/render/starfield';
import { planetProfileFromSeed } from '@/game/world/galaxyGenerator';

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
  settlementTelemetry?: Map<string, PlanetSettlementTelemetry>;
}

export class Galaxy2DMode implements RenderModeController {
  readonly id = 'galaxy2d' as const;

  private readonly canvas = document.createElement('canvas');
  private readonly ctx = this.canvas.getContext('2d');
  private readonly starfield = generateSeededStarfield(0xdecafbad, 1400, { min: 8, max: 18 });
  private readonly archetypeByNodeId = new Map<string, ReturnType<typeof planetProfileFromSeed>['archetype']>();
  private readonly spriteCache = new Map<string, HTMLCanvasElement>();
  private readonly worldStars: Array<{ x: number; y: number; alpha: number; size: number }> = [];

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
  private infoChipRow: HTMLDivElement | null = null;
  private infoSlotList: HTMLUListElement | null = null;
  private settlementTelemetry = new Map<string, PlanetSettlementTelemetry>();

  constructor(
    private readonly galaxy: GalaxyData,
    private readonly context: ModeContext,
    options?: Galaxy2DModeOptions,
  ) {
    this.selectedNodeId = options?.initialSelectedPlanet?.id ?? null;
    this.initialViewSnapshot = options?.initialViewSnapshot ?? null;
    this.settlementTelemetry = options?.settlementTelemetry ?? this.settlementTelemetry;
    this.nodeBounds = this.computeNodeBounds();
    for (const node of galaxy.nodes) {
      this.archetypeByNodeId.set(node.id, planetProfileFromSeed(node.seed).archetype);
    }
    for (let index = 0; index < this.starfield.length; index += 1) {
      const star = this.starfield[index];
      this.worldStars.push({
        x: normalize(star.x, -18, 18) * this.galaxy.width + (index % 5) * 11,
        y: normalize(star.y + star.z * 0.5, -18, 18) * this.galaxy.height + (index % 7) * 9,
        alpha: 0.13 + star.intensity * 0.24,
        size: 0.8 + star.size * 1.15,
      });
    }
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
    this.ctx.fillStyle = '#02050d';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.save();
    this.ctx.translate(this.transform.x, this.transform.y);
    this.ctx.scale(this.transform.zoom, this.transform.zoom);
    this.drawWorldBackground();

    for (const node of this.galaxy.nodes) {
      this.drawNode(node);
    }

    this.ctx.restore();
  }

  private drawWorldBackground() {
    if (!this.ctx) return;
    for (const star of this.worldStars) {
      const px = modulo(star.x, this.galaxy.width);
      const py = modulo(star.y, this.galaxy.height);
      this.ctx.fillStyle = `rgba(191, 216, 255, ${star.alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(px, py, star.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawNode(node: GalaxyNode) {
    if (!this.ctx) return;

    const isHovered = node.id === this.hoveredNodeId;
    const isSelected = node.id === this.selectedNodeId;
    const radius = this.getNodeRadius(node) * (isHovered ? 1.14 : 1);
    const archetype = this.archetypeByNodeId.get(node.id) ?? 'terrestrial';
    const sprite = this.getOrCreatePlanetSprite(archetype);

    this.ctx.beginPath();
    this.ctx.fillStyle = 'rgba(153, 225, 255, 0.16)';
    this.ctx.arc(node.x, node.y, radius + 2.8, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.drawImage(sprite, node.x - radius, node.y - radius, radius * 2, radius * 2);

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

    const chipRow = document.createElement('div');
    chipRow.className = 'galaxy-inspect-chips';

    const slotSummary = document.createElement('p');
    slotSummary.className = 'galaxy-inspect-summary';

    const slotList = document.createElement('ul');
    slotList.className = 'galaxy-inspect-slots';

    panel.appendChild(title);
    panel.appendChild(meta);
    panel.appendChild(chipRow);
    panel.appendChild(slotSummary);
    panel.appendChild(slotList);

    this.context.host.appendChild(panel);
    this.infoPanel = panel;
    this.infoTitle = title;
    this.infoMeta = meta;
    this.infoChipRow = chipRow;
    this.infoSlotSummary = slotSummary;
    this.infoSlotList = slotList;
  }

  private refreshInfoPanel() {
    if (!this.infoPanel || !this.infoTitle || !this.infoMeta || !this.infoSlotSummary || !this.infoSlotList || !this.infoChipRow) return;

    const focusNode = this.galaxy.nodes.find((node) => node.id === this.selectedNodeId)
      ?? this.galaxy.nodes.find((node) => node.id === this.hoveredNodeId)
      ?? null;

    if (!focusNode) {
      this.infoPanel.style.opacity = '0.75';
      this.infoTitle.textContent = 'Select a planet';
      this.infoMeta.textContent = 'Click a world to inspect biome and settlement slots.';
      this.infoChipRow.innerHTML = '';
      this.infoSlotSummary.textContent = '';
      this.infoSlotList.innerHTML = '';
      return;
    }

    this.infoPanel.style.opacity = '1';
    this.infoTitle.textContent = focusNode.name;

    const archetype = this.archetypeByNodeId.get(focusNode.id) ?? 'terrestrial';
    this.infoMeta.textContent = `Biome: ${toDisplayArchetype(archetype)}`;
    this.infoChipRow.innerHTML = '';
    this.infoChipRow.appendChild(makeChip(`Biome: ${toDisplayArchetype(archetype)}`));
    this.infoChipRow.appendChild(makeChip(`Population: ${focusNode.populationBand}`));

    this.infoSlotList.innerHTML = '';
    const telemetry = this.settlementTelemetry.get(focusNode.id);
    if (!telemetry) {
      this.infoSlotSummary.textContent = 'Villes / emplacements: non inspectés';
      const line = document.createElement('li');
      line.className = 'galaxy-inspect-slot';
      line.textContent = 'Ouvre Planet View une fois pour charger les emplacements réels.';
      this.infoSlotList.appendChild(line);
      return;
    }

    this.infoSlotSummary.textContent = `${telemetry.occupied}/${telemetry.total} emplacements occupés`;
    for (let i = 0; i < telemetry.slots.length; i += 1) {
      const slot = telemetry.slots[i];
      const line = document.createElement('li');
      line.className = 'galaxy-inspect-slot';
      const city = slot.cityName ? ` — ville: ${slot.cityName}` : '';
      const owner = slot.owner ? ` — owner: ${slot.owner}` : '';
      line.textContent = `Emplacement ${i + 1} — ${slot.state === 'occupied' ? 'occupé' : 'libre'}${city}${owner}`;
      this.infoSlotList.appendChild(line);
    }
  }

  private getOrCreatePlanetSprite(archetype: ReturnType<typeof planetProfileFromSeed>['archetype']) {
    if (this.spriteCache.has(archetype)) return this.spriteCache.get(archetype) as HTMLCanvasElement;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const style = getBiomeStyle(archetype);
    const cx = 64;
    const cy = 64;
    const r = 56;
    ctx.clearRect(0, 0, 128, 128);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    const base = ctx.createRadialGradient(cx - 18, cy - 20, 8, cx, cy, r + 2);
    base.addColorStop(0, style.lit);
    base.addColorStop(0.56, style.mid);
    base.addColorStop(1, style.dark);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 128, 128);

    drawBiomePattern(ctx, archetype, style);

    const shadow = ctx.createLinearGradient(cx + 8, cy - r, cx + r, cy + r * 0.7);
    shadow.addColorStop(0, 'rgba(5, 8, 14, 0)');
    shadow.addColorStop(0.72, 'rgba(5, 8, 14, 0.34)');
    shadow.addColorStop(1, 'rgba(4, 7, 12, 0.56)');
    ctx.fillStyle = shadow;
    ctx.fillRect(0, 0, 128, 128);

    ctx.restore();
    ctx.beginPath();
    ctx.strokeStyle = style.rim;
    ctx.lineWidth = 2.2;
    ctx.arc(cx, cy, r - 0.8, 0, Math.PI * 2);
    ctx.stroke();

    this.spriteCache.set(archetype, canvas);
    return canvas;
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalize(value: number, min: number, max: number) {
  if (max <= min) return 0;
  return clamp((value - min) / (max - min), 0, 1);
}

function modulo(value: number, size: number) {
  const wrapped = value % size;
  return wrapped < 0 ? wrapped + size : wrapped;
}

function toDisplayArchetype(archetype: ReturnType<typeof planetProfileFromSeed>['archetype']) {
  return `${archetype.charAt(0).toUpperCase()}${archetype.slice(1)}`;
}

function getBiomeStyle(archetype: ReturnType<typeof planetProfileFromSeed>['archetype']) {
  const base: Record<ReturnType<typeof planetProfileFromSeed>['archetype'], { lit: string; mid: string; dark: string; rim: string; accent: string }> = {
    frozen: {
      lit: '#eef8ff', mid: '#b8dbf3', dark: '#6f93b8', rim: '#d7ebff', accent: '#f8fdff',
    },
    oceanic: {
      lit: '#7fd6ff', mid: '#2f8bc2', dark: '#1a4369', rim: '#9de1ff', accent: '#6bc07e',
    },
    arid: {
      lit: '#f2d6a5', mid: '#c7914f', dark: '#7d5431', rim: '#efc78c', accent: '#c97642',
    },
    volcanic: {
      lit: '#d7613f', mid: '#6d312d', dark: '#2c1719', rim: '#ff8a53', accent: '#ffb15a',
    },
    mineral: {
      lit: '#d4cade', mid: '#9587a8', dark: '#544a63', rim: '#c9bcdb', accent: '#8ec5d6',
    },
    terrestrial: {
      lit: '#9fdaa2', mid: '#4f8a58', dark: '#2d4f35', rim: '#b2ddb2', accent: '#75a16a',
    },
    barren: {
      lit: '#cbcbc9', mid: '#8f8f8b', dark: '#545452', rim: '#b9b9b5', accent: '#9f8b7d',
    },
    jungle: {
      lit: '#8ee08a', mid: '#2f7f40', dark: '#1b4826', rim: '#b6ebb0', accent: '#65b85c',
    },
  };

  return base[archetype];
}

function drawBiomePattern(
  ctx: CanvasRenderingContext2D,
  archetype: ReturnType<typeof planetProfileFromSeed>['archetype'],
  style: { accent: string },
) {
  ctx.fillStyle = style.accent;
  if (archetype === 'oceanic' || archetype === 'terrestrial' || archetype === 'jungle') {
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.ellipse(30 + i * 14, 48 + (i % 2) * 10, 12, 6, i * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (archetype === 'volcanic') {
    ctx.strokeStyle = style.accent;
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i += 1) {
      ctx.beginPath();
      ctx.moveTo(24 + i * 14, 26 + (i % 3) * 7);
      ctx.lineTo(34 + i * 12, 92 - (i % 2) * 9);
      ctx.stroke();
    }
  } else {
    for (let i = 0; i < 16; i += 1) {
      ctx.globalAlpha = 0.28;
      ctx.beginPath();
      ctx.arc(20 + (i * 23) % 92, 20 + (i * 17) % 92, 3 + (i % 4), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

function makeChip(text: string) {
  const chip = document.createElement('span');
  chip.className = 'galaxy-inspect-chip';
  chip.textContent = text;
  return chip;
}
