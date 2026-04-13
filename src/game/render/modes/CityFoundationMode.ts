import type { ModeContext, RenderModeController } from '@/game/render/modes/RenderModeController';
import type { SelectedPlanetRef } from '@/game/render/types';
import { CityLayoutStore, tileKey, type BuildingDefinition, type TileCoord } from '@/game/city/layout/cityLayout';

type BuildMode = 'idle' | 'place-building' | 'place-road' | 'move-building';

const GRID_WIDTH = 20;
const GRID_HEIGHT = 14;

const BUILDING_LIBRARY: Record<string, BuildingDefinition> = {
  habitat: { type: 'habitat', label: 'Habitat', footprint: { width: 2, height: 2 } },
  foundry: { type: 'industry', label: 'Foundry', footprint: { width: 3, height: 2 } },
};

export class CityFoundationMode implements RenderModeController {
  readonly id = 'city3d' as const;

  private readonly layout = new CityLayoutStore({ width: GRID_WIDTH, height: GRID_HEIGHT });
  private root: HTMLElement | null = null;
  private gridEl: HTMLDivElement | null = null;
  private hudMeta: HTMLParagraphElement | null = null;
  private hudHint: HTMLParagraphElement | null = null;
  private selectedBlueprintKey: keyof typeof BUILDING_LIBRARY = 'habitat';
  private mode: BuildMode = 'idle';
  private hoverCoord: TileCoord | null = null;
  private dragRoadActive = false;
  private movingBuildingId: string | null = null;

  constructor(
    private selectedPlanet: SelectedPlanetRef,
    private readonly context: ModeContext,
  ) {}

  mount() {
    const root = document.createElement('section');
    root.className = 'city-foundation-root';

    const hud = this.buildHud();
    const grid = document.createElement('div');
    grid.className = 'city-foundation-grid';
    grid.style.gridTemplateColumns = `repeat(${GRID_WIDTH}, minmax(0, 1fr))`;
    grid.addEventListener('pointerleave', this.onGridPointerLeave);

    root.append(hud, grid);
    this.context.host.appendChild(root);

    this.root = root;
    this.gridEl = grid;
    this.renderGrid();
    this.syncHud();
  }

  resize() {}
  update() {}

  setSelectedPlanet(nextPlanet: SelectedPlanetRef) {
    this.selectedPlanet = nextPlanet;
    this.syncHud();
  }

  destroy() {
    window.removeEventListener('pointerup', this.onWindowPointerUp);
    this.root?.remove();
    this.root = null;
    this.gridEl = null;
    this.hudMeta = null;
    this.hudHint = null;
  }

  private buildHud() {
    const panel = document.createElement('div');
    panel.className = 'city-foundation-hud';

    const title = document.createElement('h2');
    title.className = 'city-foundation-title';
    title.textContent = 'City Foundation / Debug Layout';

    const meta = document.createElement('p');
    meta.className = 'city-foundation-meta';
    this.hudMeta = meta;

    const controls = document.createElement('div');
    controls.className = 'city-foundation-controls';

    controls.append(
      this.createModeButton('Idle', () => this.setMode('idle')),
      this.createModeButton('Place Building', () => this.setMode('place-building')),
      this.createModeButton('Place Road', () => this.setMode('place-road')),
      this.createModeButton('Move Building', () => this.setMode('move-building')),
      this.createModeButton('Back to Planet', () => this.context.onRequestMode('planet3d')),
    );

    const blueprintControls = document.createElement('div');
    blueprintControls.className = 'city-foundation-controls';
    blueprintControls.append(
      this.createModeButton('Blueprint: Habitat 2x2', () => {
        this.selectedBlueprintKey = 'habitat';
        this.syncHud();
        this.renderGrid();
      }),
      this.createModeButton('Blueprint: Foundry 3x2', () => {
        this.selectedBlueprintKey = 'foundry';
        this.syncHud();
        this.renderGrid();
      }),
    );

    const legend = document.createElement('p');
    legend.className = 'city-foundation-legend';
    legend.textContent = 'Legend: blocked · buildable · road · building · preview(valid/invalid)';

    const hint = document.createElement('p');
    hint.className = 'city-foundation-hint';
    this.hudHint = hint;

    panel.append(title, meta, controls, blueprintControls, legend, hint);
    return panel;
  }

  private createModeButton(label: string, onClick: () => void) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'city-foundation-button';
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
  }

  private renderGrid() {
    if (!this.gridEl) return;
    this.gridEl.innerHTML = '';

    const previewTiles = this.getPreviewTiles();
    const occupiedOrigins = new Map<string, string>();
    for (const building of this.layout.getSnapshot().buildings) {
      occupiedOrigins.set(tileKey(building.anchor.x, building.anchor.y), building.label);
    }

    for (let y = 0; y < GRID_HEIGHT; y += 1) {
      for (let x = 0; x < GRID_WIDTH; x += 1) {
        const tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'city-foundation-tile';
        tile.dataset.x = String(x);
        tile.dataset.y = String(y);
        tile.addEventListener('pointerenter', this.onTilePointerEnter);
        tile.addEventListener('pointerdown', this.onTilePointerDown);
        tile.addEventListener('click', this.onTileClick);

        const kind = this.layout.getTileKind(x, y);
        tile.classList.add(`is-${kind}`);

        const preview = previewTiles.get(tileKey(x, y));
        if (preview === 'valid') tile.classList.add('is-preview-valid');
        if (preview === 'invalid') tile.classList.add('is-preview-invalid');

        const building = this.layout.getBuildingAt(x, y);
        if (building && building.anchor.x === x && building.anchor.y === y) {
          const marker = document.createElement('span');
          marker.className = 'city-foundation-label';
          marker.textContent = building.label;
          tile.appendChild(marker);
        } else if (occupiedOrigins.has(tileKey(x, y))) {
          tile.setAttribute('aria-label', occupiedOrigins.get(tileKey(x, y)) ?? '');
        }

        this.gridEl.appendChild(tile);
      }
    }
  }

  private getPreviewTiles() {
    const preview = new Map<string, 'valid' | 'invalid'>();
    if (!this.hoverCoord) return preview;

    if (this.mode === 'place-road') {
      preview.set(tileKey(this.hoverCoord.x, this.hoverCoord.y), this.layout.canPlaceRoad(this.hoverCoord.x, this.hoverCoord.y) ? 'valid' : 'invalid');
      return preview;
    }

    if (this.mode !== 'place-building' && !(this.mode === 'move-building' && this.movingBuildingId)) return preview;

    const footprint =
      this.mode === 'move-building' && this.movingBuildingId
        ? this.layout.getBuildingById(this.movingBuildingId)?.footprint
        : BUILDING_LIBRARY[this.selectedBlueprintKey].footprint;
    if (!footprint) return preview;

    const valid =
      this.mode === 'move-building' && this.movingBuildingId
        ? this.layout.canPlaceBuilding(this.hoverCoord, footprint, this.movingBuildingId)
        : this.layout.canPlaceBuilding(this.hoverCoord, footprint);

    for (let y = 0; y < footprint.height; y += 1) {
      for (let x = 0; x < footprint.width; x += 1) {
        preview.set(tileKey(this.hoverCoord.x + x, this.hoverCoord.y + y), valid ? 'valid' : 'invalid');
      }
    }
    return preview;
  }

  private setMode(next: BuildMode) {
    this.mode = next;
    this.dragRoadActive = false;
    this.movingBuildingId = next === 'move-building' ? this.movingBuildingId : null;
    this.syncHud();
    this.renderGrid();
  }

  private syncHud() {
    const snapshot = this.layout.getSnapshot();
    if (this.hudMeta) {
      this.hudMeta.textContent = `Planet ${this.selectedPlanet.id.toUpperCase()} · grid ${snapshot.grid.width}x${snapshot.grid.height} · buildings ${snapshot.buildings.length} · roads ${snapshot.roads.size}`;
    }

    if (!this.hudHint) return;
    if (this.mode === 'idle') this.hudHint.textContent = 'Idle mode: inspect the flat/debug layout.';
    if (this.mode === 'place-building') this.hudHint.textContent = `Place building: click a tile anchor (${BUILDING_LIBRARY[this.selectedBlueprintKey].label}).`;
    if (this.mode === 'place-road') this.hudHint.textContent = 'Place road: click/drag across buildable tiles.';
    if (this.mode === 'move-building') {
      this.hudHint.textContent = this.movingBuildingId
        ? 'Move building: choose destination tile for selected building.'
        : 'Move building: click an existing building first, then click destination.';
    }
  }

  private readonly onTilePointerEnter = (event: PointerEvent) => {
    const coord = this.extractCoord(event.currentTarget);
    if (!coord) return;
    this.hoverCoord = coord;

    if (this.mode === 'place-road' && this.dragRoadActive) {
      this.layout.placeRoad(coord.x, coord.y);
      this.syncHud();
    }
    this.renderGrid();
  };

  private readonly onTilePointerDown = (event: PointerEvent) => {
    const coord = this.extractCoord(event.currentTarget);
    if (!coord) return;
    if (this.mode === 'place-road') {
      this.dragRoadActive = true;
      this.layout.placeRoad(coord.x, coord.y);
      window.addEventListener('pointerup', this.onWindowPointerUp);
      this.syncHud();
      this.renderGrid();
    }
  };

  private readonly onTileClick = (event: MouseEvent) => {
    const coord = this.extractCoord(event.currentTarget);
    if (!coord) return;

    if (this.mode === 'place-building') {
      this.layout.placeBuilding(BUILDING_LIBRARY[this.selectedBlueprintKey], coord);
    } else if (this.mode === 'move-building') {
      if (!this.movingBuildingId) {
        this.movingBuildingId = this.layout.getBuildingAt(coord.x, coord.y)?.id ?? null;
      } else if (this.layout.moveBuilding(this.movingBuildingId, coord)) {
        this.movingBuildingId = null;
      }
    }

    this.syncHud();
    this.renderGrid();
  };

  private readonly onGridPointerLeave = () => {
    this.hoverCoord = null;
    this.renderGrid();
  };

  private readonly onWindowPointerUp = () => {
    this.dragRoadActive = false;
    window.removeEventListener('pointerup', this.onWindowPointerUp);
  };

  private extractCoord(target: EventTarget | null): TileCoord | null {
    if (!(target instanceof HTMLElement)) return null;
    const x = Number.parseInt(target.dataset.x ?? '', 10);
    const y = Number.parseInt(target.dataset.y ?? '', 10);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return { x, y };
  }
}
