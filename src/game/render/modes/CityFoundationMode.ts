import {
  canStartConstruction,
  getBuildingConfig,
  getBuildingLevel,
  getConstructionQueueSlots,
  getEconomyBuildingOrder,
  getPopulationSnapshot,
  getProductionPerHour,
  getStorageCaps,
  isBuildingUnlocked,
  type CityEconomyState,
} from '@/game/city/economy/cityEconomySystem';
import {
  loadCityEconomyState,
  startCityBuildingUpgrade,
  type CityPersistenceContext,
} from '@/game/city/economy/cityEconomyPersistence';
import type { EconomyBuildingId, EconomyResource } from '@/game/city/economy/cityEconomyConfig';
import type { ModeContext, RenderModeController } from '@/game/render/modes/RenderModeController';
import type { PlanetArchetype, SelectedPlanetRef } from '@/game/render/types';
import { planetProfileFromSeed } from '@/game/world/galaxyGenerator';

interface CityState {
  planetId: string;
  owner: string;
  archetype: PlanetArchetype;
  economy: CityEconomyState;
  citySlotTotal: number;
}

const RESOURCE_LABELS: Record<EconomyResource, string> = {
  ore: 'Ore',
  stone: 'Stone',
  iron: 'Iron',
};

export class CityFoundationMode implements RenderModeController {
  readonly id = 'city3d' as const;

  private root: HTMLElement | null = null;
  private headerIdentity: HTMLDivElement | null = null;
  private resourceStrip: HTMLElement | null = null;
  private buildingsGrid: HTMLDivElement | null = null;
  private queuePanel: HTMLDivElement | null = null;
  private summaryPanel: HTMLDivElement | null = null;

  private uiAccumulatorMs = 0;
  private state: CityState;
  private persistenceContext: CityPersistenceContext;

  constructor(
    private selectedPlanet: SelectedPlanetRef,
    private readonly context: ModeContext,
  ) {
    const owner = buildOwnerLabel(selectedPlanet.id);
    this.persistenceContext = buildPersistenceContext(selectedPlanet.id, owner);
    this.state = getCityState(selectedPlanet, planetProfileFromSeed(selectedPlanet.seed).archetype, this.persistenceContext);
  }

  mount() {
    const root = document.createElement('section');
    root.className = 'city-management';
    root.append(this.createHeader(), this.createResourceBar(), this.createBodyLayout());

    this.context.host.appendChild(root);
    this.root = root;

    this.renderAll();
  }

  resize() {}

  update(deltaMs: number) {
    this.uiAccumulatorMs += deltaMs;
    if (this.uiAccumulatorMs < 1000) return;
    this.uiAccumulatorMs = 0;

    const previousQueueSize = this.state.economy.queue.length;
    this.refreshFromPersistence();
    const completed = previousQueueSize > this.state.economy.queue.length;

    this.renderResourceBar();
    this.renderQueue();
    if (completed) {
      this.renderBuildings();
      this.renderSummary();
      this.renderHeader();
      return;
    }

    this.renderSummary();
  }

  setSelectedPlanet(nextPlanet: SelectedPlanetRef) {
    if (nextPlanet.id === this.selectedPlanet.id && nextPlanet.seed === this.selectedPlanet.seed) return;
    this.selectedPlanet = nextPlanet;
    const archetype = planetProfileFromSeed(nextPlanet.seed).archetype;
    const owner = buildOwnerLabel(nextPlanet.id);
    this.persistenceContext = buildPersistenceContext(nextPlanet.id, owner);
    this.state = getCityState(nextPlanet, archetype, this.persistenceContext);
    this.uiAccumulatorMs = 0;
    this.renderAll();
  }

  destroy() {
    this.root?.remove();
    this.root = null;
    this.headerIdentity = null;
    this.resourceStrip = null;
    this.buildingsGrid = null;
    this.queuePanel = null;
    this.summaryPanel = null;
  }

  private createHeader() {
    const header = document.createElement('header');
    header.className = 'city-management__header';

    const left = document.createElement('div');
    left.className = 'city-management__header-left';
    this.headerIdentity = left;

    const right = document.createElement('div');
    right.className = 'city-management__header-right';

    const switcher = document.createElement('select');
    switcher.className = 'city-management__switch';
    const current = document.createElement('option');
    current.value = this.selectedPlanet.id;
    current.textContent = `Switch planet: ${this.selectedPlanet.id.toUpperCase()}`;
    switcher.append(current);
    switcher.addEventListener('change', () => {
      if (switcher.value === this.selectedPlanet.id) return;
      this.context.onSelectPlanet({ id: switcher.value, seed: this.selectedPlanet.seed });
    });

    const backPlanet = document.createElement('button');
    backPlanet.type = 'button';
    backPlanet.className = 'city-management__btn';
    backPlanet.textContent = 'Back to planet';
    backPlanet.addEventListener('click', () => this.context.onRequestMode('planet3d'));

    const backGalaxy = document.createElement('button');
    backGalaxy.type = 'button';
    backGalaxy.className = 'city-management__btn';
    backGalaxy.textContent = 'Galaxy';
    backGalaxy.addEventListener('click', () => this.context.onRequestMode('galaxy2d'));

    right.append(switcher, backPlanet, backGalaxy);
    header.append(left, right);

    return header;
  }

  private createResourceBar() {
    const resourceBar = document.createElement('section');
    resourceBar.className = 'city-management__resource-bar';
    this.resourceStrip = resourceBar;
    return resourceBar;
  }

  private createBodyLayout() {
    const layout = document.createElement('div');
    layout.className = 'city-management__layout';

    const left = document.createElement('section');
    left.className = 'city-management__left';

    const buildingTitle = document.createElement('h3');
    buildingTitle.className = 'city-management__section-title';
    buildingTitle.textContent = 'Buildings';

    const buildingGrid = document.createElement('div');
    buildingGrid.className = 'city-management__building-grid';
    this.buildingsGrid = buildingGrid;

    left.append(buildingTitle, buildingGrid);

    const right = document.createElement('aside');
    right.className = 'city-management__right';

    const queueTitle = document.createElement('h3');
    queueTitle.className = 'city-management__section-title';
    queueTitle.textContent = 'Construction Queue';

    const queue = document.createElement('div');
    queue.className = 'city-management__queue-panel';
    this.queuePanel = queue;

    const summaryTitle = document.createElement('h3');
    summaryTitle.className = 'city-management__section-title';
    summaryTitle.textContent = 'City Stats';

    const summary = document.createElement('div');
    summary.className = 'city-management__summary-panel';
    this.summaryPanel = summary;

    right.append(queueTitle, queue, summaryTitle, summary);
    layout.append(left, right);

    return layout;
  }

  private renderAll() {
    this.refreshFromPersistence();
    this.renderHeader();
    this.renderResourceBar();
    this.renderBuildings();
    this.renderQueue();
    this.renderSummary();
  }

  private renderHeader() {
    if (!this.headerIdentity) return;
    this.headerIdentity.innerHTML = '';

    const items = [`City ${this.state.planetId.toUpperCase()}`, `Planet: ${this.state.archetype.toUpperCase()}`, `Owner: ${this.state.owner}`];

    items.forEach((text) => {
      const chip = document.createElement('span');
      chip.className = 'city-management__header-chip';
      chip.textContent = text;
      this.headerIdentity!.append(chip);
    });
  }

  private renderResourceBar() {
    if (!this.resourceStrip) return;
    this.resourceStrip.innerHTML = '';

    const production = getProductionPerHour(this.state.economy);
    const storage = getStorageCaps(this.state.economy);

    (Object.keys(RESOURCE_LABELS) as EconomyResource[]).forEach((resource) => {
      const item = document.createElement('div');
      item.className = 'city-management__resource-item';

      const top = document.createElement('div');
      top.className = 'city-management__resource-top';

      const icon = document.createElement('span');
      icon.className = `city-management__resource-icon city-management__resource-icon--${resource}`;
      icon.textContent = resource === 'ore' ? '●' : resource === 'stone' ? '◆' : '■';

      const name = document.createElement('span');
      name.className = 'city-management__resource-name';
      name.textContent = RESOURCE_LABELS[resource];

      top.append(icon, name);

      const stock = document.createElement('p');
      stock.className = 'city-management__resource-stock';
      stock.textContent = `${Math.floor(this.state.economy.resources[resource]).toLocaleString()} / ${storage[resource].toLocaleString()}`;

      const rate = document.createElement('p');
      rate.className = 'city-management__resource-rate';
      rate.textContent = `+${Math.round(production[resource]).toLocaleString()}/h`;

      item.append(top, stock, rate);
      this.resourceStrip!.append(item);
    });
  }

  private renderBuildings() {
    if (!this.buildingsGrid) return;
    this.buildingsGrid.innerHTML = '';

    getEconomyBuildingOrder().forEach((buildingId) => {
      const building = getBuildingConfig(buildingId);
      const card = document.createElement('article');
      card.className = 'city-management__building-card';

      const unlocked = isBuildingUnlocked(this.state.economy, buildingId);
      if (!unlocked) card.classList.add('is-locked');

      const currentLevel = getBuildingLevel(this.state.economy, buildingId);

      const row = document.createElement('div');
      row.className = 'city-management__building-row';

      const name = document.createElement('p');
      name.className = 'city-management__building-name';
      name.textContent = building.name;

      const levelTag = document.createElement('span');
      levelTag.className = 'city-management__building-level';
      levelTag.textContent = unlocked ? `LVL ${currentLevel}` : 'LOCKED';

      row.append(name, levelTag);

      const prodLine = document.createElement('p');
      prodLine.className = 'city-management__building-production';
      prodLine.textContent = this.getBuildingEffectText(buildingId, currentLevel);

      const nextCost = building.levels[currentLevel];
      const costLine = document.createElement('p');
      costLine.className = 'city-management__building-meta';
      costLine.textContent = nextCost
        ? `Cost: Ore ${nextCost.resources.ore} · Stone ${nextCost.resources.stone} · Iron ${nextCost.resources.iron}`
        : 'Cost: Max level reached';

      const duration = document.createElement('p');
      duration.className = 'city-management__building-meta';
      duration.textContent = nextCost ? `Build time: ${formatDuration(nextCost.buildSeconds * 1000)}` : 'Build time: N/A';

      const action = document.createElement('button');
      action.type = 'button';
      action.className = 'city-management__upgrade';
      action.dataset.buildingId = buildingId;

      const guard = canStartConstruction(this.state.economy, buildingId);
      action.disabled = !guard.ok;
      action.textContent = guard.reason ?? 'Upgrade';
      action.addEventListener('click', () => {
        const result = startCityBuildingUpgrade(this.persistenceContext, buildingId, Date.now());
        this.state.economy = result.state.economy;
        this.renderAll();
      });

      card.append(row, prodLine, costLine, duration, action);
      this.buildingsGrid!.append(card);
    });
  }

  private renderQueue() {
    if (!this.queuePanel) return;
    this.queuePanel.innerHTML = '';

    const sorted = this.state.economy.queue.slice().sort((a, b) => a.endsAtMs - b.endsAtMs);
    const queueSlots = getConstructionQueueSlots();

    for (let i = 0; i < queueSlots; i += 1) {
      const slot = document.createElement('div');
      slot.className = 'city-management__queue-slot';

      const slotTitle = document.createElement('p');
      slotTitle.className = 'city-management__queue-slot-title';
      slotTitle.textContent = `Slot ${i + 1}`;

      const entry = sorted[i];
      if (!entry) {
        const empty = document.createElement('p');
        empty.className = 'city-management__queue-empty';
        empty.textContent = 'Queue empty';
        slot.append(slotTitle, empty);
        this.queuePanel.append(slot);
        continue;
      }

      const definition = getBuildingConfig(entry.buildingId);
      const remainingMs = Math.max(0, entry.endsAtMs - Date.now());
      const totalMs = Math.max(1, entry.endsAtMs - entry.startedAtMs);
      const progress = Math.min(100, Math.max(0, ((totalMs - remainingMs) / totalMs) * 100));

      const label = document.createElement('p');
      label.className = 'city-management__queue-name';
      label.textContent = `${definition.name} → lvl ${entry.targetLevel}`;

      const timer = document.createElement('p');
      timer.className = 'city-management__queue-time';
      timer.textContent = `⏳ ${formatDuration(remainingMs)} remaining`;

      const bar = document.createElement('div');
      bar.className = 'city-management__progress';
      const fill = document.createElement('span');
      fill.className = 'city-management__progress-fill';
      fill.style.width = `${progress}%`;
      bar.append(fill);

      slot.append(slotTitle, label, timer, bar);
      this.queuePanel.append(slot);
    }
  }

  private renderSummary() {
    if (!this.summaryPanel) return;
    this.summaryPanel.innerHTML = '';

    const storage = getStorageCaps(this.state.economy);
    const pop = getPopulationSnapshot(this.state.economy);
    const queueSlots = getConstructionQueueSlots();
    const rows = [
      `Slots: ${this.getUsedSlots()}/${this.state.citySlotTotal}`,
      `Population: ${pop.used}/${pop.cap}`,
      `Storage · Ore: ${storage.ore}`,
      `Storage · Stone: ${storage.stone}`,
      `Storage · Iron: ${storage.iron}`,
      `Queue: ${this.state.economy.queue.length}/${queueSlots}`,
    ];

    rows.forEach((text) => {
      const row = document.createElement('p');
      row.className = 'city-management__summary-row';
      row.textContent = text;
      this.summaryPanel!.append(row);
    });
  }

  private getUsedSlots() {
    return getEconomyBuildingOrder().reduce((sum, buildingId) => (getBuildingLevel(this.state.economy, buildingId) > 0 ? sum + 1 : sum), 0);
  }

  private getBuildingEffectText(buildingId: EconomyBuildingId, currentLevel: number) {
    const building = getBuildingConfig(buildingId);
    const row = currentLevel > 0 ? building.levels[currentLevel - 1] : null;

    if (buildingId === 'mine') return `+${row?.effect.orePerHour ?? 0} Ore / h`;
    if (buildingId === 'quarry') return `+${row?.effect.stonePerHour ?? 0} Stone / h`;
    if (buildingId === 'refinery') return `+${row?.effect.ironPerHour ?? 0} Iron / h`;
    if (buildingId === 'warehouse') return `Storage boost x${(row?.effect.storageMultiplier ?? 1).toFixed(2)}`;
    if (buildingId === 'housing_complex') return `Population cap +${row?.effect.populationCapBonus ?? 0}`;
    return `Unlocks city progression (HQ ${currentLevel})`;
  }

  private refreshFromPersistence() {
    const snapshot = loadCityEconomyState(this.persistenceContext, Date.now());
    this.state.economy = snapshot.economy;
  }
}

/**
 * MVP persistent city source of truth adapter for city mode.
 */
function getCityState(planet: SelectedPlanetRef, archetype: PlanetArchetype, context: CityPersistenceContext): CityState {
  const snapshot = loadCityEconomyState(context, Date.now());

  return {
    planetId: planet.id,
    owner: snapshot.ownerId,
    archetype,
    economy: snapshot.economy,
    citySlotTotal: 15,
  };
}


function buildPersistenceContext(cityId: string, ownerId: string): CityPersistenceContext {
  return {
    cityId,
    ownerId,
    planetId: cityId,
    sectorId: `sector-${cityId}`,
  };
}

function buildOwnerLabel(planetId: string) {
  const compact = planetId.replace(/[^a-z0-9]/gi, '').toUpperCase();
  return `CMDR-${(compact || '001').slice(0, 4).padEnd(3, '0')}`;
}

function formatDuration(durationMs: number) {
  const seconds = Math.max(0, Math.ceil(durationMs / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (minutes <= 0) return `${remainder}s`;
  return `${minutes}m ${remainder.toString().padStart(2, '0')}s`;
}
