import type { GalaxyData, GalaxyNode } from '@/game/render/types';
import type { ModeContext, RenderModeController } from '@/game/render/modes/RenderModeController';
import type { SelectedPlanetRef } from '@/game/render/types';
import { planetProfileFromSeed } from '@/game/world/galaxyGenerator';
import * as THREE from 'three';
import { createPlanetGenerationConfig } from '@/game/planet/presets/archetypes';
import { PlanetGenerator } from '@/game/planet/generation/PlanetGenerator';
import { generateSettlementSlots } from '@/game/planet/runtime/SettlementSlots';
import { SeededStarBackground } from '@/game/render/SeededStarBackground';

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
  private readonly starBackground = new SeededStarBackground({
    seed: 0xdecafbad,
    count: 1400,
    radiusRange: { min: 8, max: 18 },
  });
  private readonly archetypeByNodeId = new Map<string, ReturnType<typeof planetProfileFromSeed>['archetype']>();
  private readonly spriteCache = new Map<string, HTMLCanvasElement>();

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
  private minZoom = 0.65;
  private maxZoom = 3;
  private initialViewSnapshot: Galaxy2DViewSnapshot | null = null;
  private nodeBounds: Bounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };

  private infoPanel: HTMLDivElement | null = null;
  private infoTitle: HTMLHeadingElement | null = null;
  private infoMeta: HTMLParagraphElement | null = null;
  private infoSlotSummary: HTMLParagraphElement | null = null;
  private infoSlotList: HTMLUListElement | null = null;
  private readonly settlementCache = new Map<string, { total: number; occupied: number; slots: Array<{ id: string; state: 'Free' | 'Occupied' }> }>();
  private readonly settlementLoading = new Set<string>();
  private inspectorRenderer: THREE.WebGLRenderer | null = null;
  private inspectorGenerator: PlanetGenerator | null = null;

  constructor(
    private readonly galaxy: GalaxyData,
    private readonly context: ModeContext,
    options?: Galaxy2DModeOptions,
  ) {
    this.selectedNodeId = options?.initialSelectedPlanet?.id ?? null;
    this.initialViewSnapshot = options?.initialViewSnapshot ?? null;
    this.nodeBounds = this.computeNodeBounds();

    for (const node of galaxy.nodes) {
      this.archetypeByNodeId.set(node.id, planetProfileFromSeed(node.seed).archetype);
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
    this.inspectorGenerator = null;
    this.inspectorRenderer?.dispose();
    this.inspectorRenderer = null;
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
    this.starBackground.renderToWorld2D(this.ctx, this.galaxy.width, this.galaxy.height);
  }

  private drawNode(node: GalaxyNode) {
    if (!this.ctx) return;

    const isHovered = node.id === this.hoveredNodeId;
    const isSelected = node.id === this.selectedNodeId;
    const radius = this.getNodeRadius(node) * (isHovered ? 1.08 : 1);
    const archetype = this.archetypeByNodeId.get(node.id) ?? 'terrestrial';
    const sprite = this.getOrCreatePlanetSprite(archetype);

    this.ctx.drawImage(sprite, node.x - radius, node.y - radius, radius * 2, radius * 2);

    if (isSelected) {
      this.ctx.beginPath();
      this.ctx.strokeStyle = 'rgba(178, 229, 255, 0.92)';
      this.ctx.lineWidth = clamp(1.45 / this.transform.zoom, 0.8, 1.8);
      this.ctx.arc(node.x, node.y, radius + 1.9, 0, Math.PI * 2);
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
      const hitRadius = this.getNodeRadius(node) + 2.5;
      if (dx * dx + dy * dy <= hitRadius ** 2) return node;
    }

    return null;
  }

  private centerMap() {
    const bounds = this.nodeBounds;
    const occupiedWidth = Math.max(1, bounds.maxX - bounds.minX);
    const occupiedHeight = Math.max(1, bounds.maxY - bounds.minY);

    const targetWidthUsage = 0.78;
    const targetHeightUsage = 0.66;
    const fitZoom = Math.min(
      (this.width * targetWidthUsage) / occupiedWidth,
      (this.height * targetHeightUsage) / occupiedHeight,
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
    const worldPadding = 70;
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
    this.minZoom = clamp(fit * 0.72, 0.65, 1.22);
    this.maxZoom = Math.max(2.6, this.minZoom + 1.15);
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
    const emphasis = 1.12 - zoomT * 0.15;
    return node.radius * emphasis;
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
    slotSummary.className = 'galaxy-inspect-summary';

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
      this.infoPanel.style.opacity = '0.82';
      this.infoTitle.textContent = 'Select a planet';
      this.infoMeta.textContent = 'Biome: —';
      this.infoSlotSummary.textContent = 'Cities: —';
      this.infoSlotList.innerHTML = '';
      return;
    }

    const archetype = this.archetypeByNodeId.get(focusNode.id) ?? 'terrestrial';
    this.infoPanel.style.opacity = '1';
    this.infoTitle.textContent = focusNode.name;
    this.infoMeta.textContent = `Biome: ${toDisplayArchetype(archetype)}`;
    this.infoSlotSummary.textContent = 'Cities: settlement slot data available in Planet View';

    this.infoSlotList.innerHTML = '';
    const cached = this.settlementCache.get(focusNode.id);
    if (!cached) {
      this.infoSlotSummary.textContent = 'Cities: loading real slot data...';
      this.ensureSettlementData(focusNode);
      const entry = document.createElement('li');
      entry.className = 'galaxy-inspect-slot';
      entry.textContent = 'Computing city slot map from planet data source.';
      this.infoSlotList.appendChild(entry);
      return;
    }

    this.infoSlotSummary.textContent = `Cities: ${cached.total} total — ${cached.occupied} occupied — ${cached.total - cached.occupied} free`;
    for (const slot of cached.slots) {
      const entry = document.createElement('li');
      entry.className = 'galaxy-inspect-slot';
      entry.textContent = `${slot.id.toUpperCase()} — ${slot.state}`;
      this.infoSlotList.appendChild(entry);
    }
  }

  private getOrCreatePlanetSprite(archetype: ReturnType<typeof planetProfileFromSeed>['archetype']) {
    if (this.spriteCache.has(archetype)) return this.spriteCache.get(archetype) as HTMLCanvasElement;
    const canvas = document.createElement('canvas');
    canvas.width = 96;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const style = getBiomeStyle(archetype);
    const cx = 48;
    const cy = 48;
    const r = 42;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    const body = ctx.createRadialGradient(cx - 13, cy - 14, 6, cx, cy, r + 4);
    body.addColorStop(0, style.lit);
    body.addColorStop(0.55, style.mid);
    body.addColorStop(1, style.dark);
    ctx.fillStyle = body;
    ctx.fillRect(0, 0, 96, 96);

    drawBiomePattern(ctx, archetype, style);
    drawBiomeClouds(ctx, archetype);

    const terminator = ctx.createLinearGradient(cx + 6, cy - r, cx + r, cy + r * 0.55);
    terminator.addColorStop(0, 'rgba(4, 8, 14, 0)');
    terminator.addColorStop(0.75, 'rgba(4, 8, 14, 0.38)');
    terminator.addColorStop(1, 'rgba(4, 8, 14, 0.56)');
    ctx.fillStyle = terminator;
    ctx.fillRect(0, 0, 96, 96);

    ctx.restore();

    ctx.beginPath();
    ctx.strokeStyle = style.rim;
    ctx.lineWidth = 1.4;
    ctx.arc(cx, cy, r - 0.3, 0, Math.PI * 2);
    ctx.stroke();

    this.spriteCache.set(archetype, canvas);
    return canvas;
  }

  private ensureSettlementData(node: GalaxyNode) {
    if (this.settlementCache.has(node.id) || this.settlementLoading.has(node.id)) return;
    this.settlementLoading.add(node.id);

    setTimeout(() => {
      try {
        const profile = planetProfileFromSeed(node.seed);
        const config = createPlanetGenerationConfig(node.seed, profile);
        if (!this.inspectorRenderer) {
          this.inspectorRenderer = new THREE.WebGLRenderer({
            antialias: false,
            alpha: true,
            powerPreference: 'low-power',
          });
        }
        if (!this.inspectorGenerator) {
          this.inspectorGenerator = new PlanetGenerator(this.inspectorRenderer);
        }

        const generated = this.inspectorGenerator.generate(config);
        const slots = generateSettlementSlots(generated.surfaceGeometry, config);
        this.settlementCache.set(node.id, {
          total: slots.length,
          occupied: slots.filter((slot) => slot.state !== 'empty').length,
          slots: slots.map((slot) => ({
            id: slot.id.replace('slot', 'City'),
            state: slot.state === 'empty' ? 'Free' : 'Occupied',
          })),
        });
        disposeGeneratedRoot(generated.root);
      } catch {
        this.settlementCache.set(node.id, {
          total: 0,
          occupied: 0,
          slots: [],
        });
      } finally {
        this.settlementLoading.delete(node.id);
        this.refreshInfoPanel();
        this.invalidate();
      }
    }, 0);
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalize(value: number, min: number, max: number) {
  if (max <= min) return 0;
  return clamp((value - min) / (max - min), 0, 1);
}

function toDisplayArchetype(archetype: ReturnType<typeof planetProfileFromSeed>['archetype']) {
  return `${archetype.charAt(0).toUpperCase()}${archetype.slice(1)}`;
}

function getBiomeStyle(archetype: ReturnType<typeof planetProfileFromSeed>['archetype']) {
  const base: Record<ReturnType<typeof planetProfileFromSeed>['archetype'], { lit: string; mid: string; dark: string; rim: string; accent: string }> = {
    frozen: { lit: '#eef8ff', mid: '#bfdff2', dark: '#7393b4', rim: '#ddf0ff', accent: '#f8fdff' },
    oceanic: { lit: '#87d9ff', mid: '#2f8dc3', dark: '#184163', rim: '#9de3ff', accent: '#64bd87' },
    arid: { lit: '#f0d4a7', mid: '#c89050', dark: '#7d5533', rim: '#eec58d', accent: '#cc8756' },
    volcanic: { lit: '#db6948', mid: '#6f332f', dark: '#2d1719', rim: '#ff9961', accent: '#ffbe67' },
    mineral: { lit: '#d8cfdf', mid: '#9788aa', dark: '#544964', rim: '#cfc1df', accent: '#8ebbd6' },
    terrestrial: { lit: '#a0dba2', mid: '#4d8658', dark: '#2a4a34', rim: '#b4dfb4', accent: '#77a66f' },
    barren: { lit: '#ccc9c6', mid: '#8e8b88', dark: '#54524f', rim: '#b8b4b0', accent: '#a09588' },
    jungle: { lit: '#93e28f', mid: '#2f7f42', dark: '#1a4727', rim: '#baecb5', accent: '#66be63' },
  };

  return base[archetype];
}

function drawBiomePattern(
  ctx: CanvasRenderingContext2D,
  archetype: ReturnType<typeof planetProfileFromSeed>['archetype'],
  style: { accent: string },
) {
  if (archetype === 'oceanic' || archetype === 'terrestrial' || archetype === 'jungle') {
    ctx.fillStyle = style.accent;
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.ellipse(24 + i * 14, 32 + (i % 2) * 8, 9, 5, i * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  if (archetype === 'volcanic') {
    ctx.strokeStyle = style.accent;
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.moveTo(18 + i * 12, 20 + (i % 2) * 8);
      ctx.lineTo(28 + i * 11, 72 - (i % 3) * 7);
      ctx.stroke();
    }
    return;
  }

  ctx.fillStyle = style.accent;
  ctx.globalAlpha = 0.26;
  for (let i = 0; i < 12; i += 1) {
    ctx.beginPath();
    ctx.arc(14 + (i * 19) % 70, 14 + (i * 13) % 70, 2 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawBiomeClouds(ctx: CanvasRenderingContext2D, archetype: ReturnType<typeof planetProfileFromSeed>['archetype']) {
  if (archetype !== 'oceanic' && archetype !== 'terrestrial' && archetype !== 'frozen') return;
  ctx.fillStyle = 'rgba(236, 246, 255, 0.22)';
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.ellipse(26 + i * 12, 56 + (i % 2) * 7, 7, 3.6, i * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function disposeGeneratedRoot(root: THREE.Object3D) {
  const disposedMaterials = new Set<THREE.Material>();
  root.traverse((object) => {
    if (!(object as THREE.Mesh).isMesh) return;
    const mesh = object as THREE.Mesh;
    mesh.geometry?.dispose();
    if (Array.isArray(mesh.material)) {
      for (const material of mesh.material) {
        if (disposedMaterials.has(material)) continue;
        disposedMaterials.add(material);
        material.dispose();
      }
      return;
    }
    if (mesh.material && !disposedMaterials.has(mesh.material)) {
      disposedMaterials.add(mesh.material);
      mesh.material.dispose();
    }
  });
}
