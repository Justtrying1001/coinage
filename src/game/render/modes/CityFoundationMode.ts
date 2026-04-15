import type { ModeContext, RenderModeController } from '@/game/render/modes/RenderModeController';
import type { PlanetArchetype, SelectedPlanetRef } from '@/game/render/types';
import { planetProfileFromSeed } from '@/game/world/galaxyGenerator';

type CoinageResource = 'ore' | 'stone' | 'iron';
type BuildingId = 'hq' | 'mine' | 'quarry' | 'refinery' | 'warehouse' | 'housing_complex';

type ResourceBundle = Record<CoinageResource, number>;
type BuildingLevels = Partial<Record<BuildingId, number>>;

interface BuildingDefinition {
  id: BuildingId;
  name: string;
  unlockAtHq: number;
  maxLevel: number;
  baseCost: ResourceBundle;
  baseBuildSeconds: number;
  production: Partial<ResourceBundle>;
  populationPerLevel: number;
}

interface ConstructionEntry {
  buildingId: BuildingId;
  targetLevel: number;
  startedAtMs: number;
  endsAtMs: number;
  costPaid: ResourceBundle;
}

interface CityState {
  planetId: string;
  owner: string;
  archetype: PlanetArchetype;
  levels: BuildingLevels;
  resources: ResourceBundle;
  queue: ConstructionEntry[];
  citySlotTotal: number;
  baseStorage: ResourceBundle;
  basePopulationCap: number;
  lastUpdatedAtMs: number;
}

const QUEUE_CAP = 2;

const RESOURCE_LABELS: Record<CoinageResource, string> = {
  ore: 'Ore',
  stone: 'Stone',
  iron: 'Iron',
};

const BUILDINGS: BuildingDefinition[] = [
  {
    id: 'hq',
    name: 'HQ',
    unlockAtHq: 1,
    maxLevel: 20,
    baseCost: { ore: 240, stone: 200, iron: 60 },
    baseBuildSeconds: 95,
    production: {},
    populationPerLevel: 1,
  },
  {
    id: 'mine',
    name: 'Mine',
    unlockAtHq: 1,
    maxLevel: 20,
    baseCost: { ore: 110, stone: 70, iron: 0 },
    baseBuildSeconds: 65,
    production: { ore: 42 },
    populationPerLevel: 1,
  },
  {
    id: 'quarry',
    name: 'Quarry',
    unlockAtHq: 1,
    maxLevel: 20,
    baseCost: { ore: 80, stone: 105, iron: 0 },
    baseBuildSeconds: 68,
    production: { stone: 34 },
    populationPerLevel: 1,
  },
  {
    id: 'refinery',
    name: 'Refinery',
    unlockAtHq: 3,
    maxLevel: 20,
    baseCost: { ore: 180, stone: 150, iron: 50 },
    baseBuildSeconds: 78,
    production: { iron: 21 },
    populationPerLevel: 1,
  },
  {
    id: 'warehouse',
    name: 'Warehouse',
    unlockAtHq: 1,
    maxLevel: 20,
    baseCost: { ore: 130, stone: 120, iron: 25 },
    baseBuildSeconds: 72,
    production: {},
    populationPerLevel: 0,
  },
  {
    id: 'housing_complex',
    name: 'Housing Complex',
    unlockAtHq: 1,
    maxLevel: 20,
    baseCost: { ore: 125, stone: 118, iron: 22 },
    baseBuildSeconds: 70,
    production: {},
    populationPerLevel: 0,
  },
];

const CITY_STATE_CACHE = new Map<string, CityState>();

export class CityFoundationMode implements RenderModeController {
  readonly id = 'city3d' as const;

  private root: HTMLElement | null = null;
  private headerIdentity: HTMLDivElement | null = null;
  private resourceStrip: HTMLElement | null = null;
  private buildingsGrid: HTMLDivElement | null = null;
  private selectedPanel: HTMLDivElement | null = null;
  private queuePanel: HTMLDivElement | null = null;
  private summaryPanel: HTMLDivElement | null = null;
  private selectedBuildingId: BuildingId = 'hq';

  private uiAccumulatorMs = 0;
  private state: CityState;

  constructor(
    private selectedPlanet: SelectedPlanetRef,
    private readonly context: ModeContext,
  ) {
    this.state = getCityState(selectedPlanet, planetProfileFromSeed(selectedPlanet.seed).archetype);
  }

  mount() {
    const root = document.createElement('section');
    root.className = 'city-management';
    root.append(this.createHeader(), this.createBodyLayout());

    this.context.host.appendChild(root);
    this.root = root;

    this.applyClaimOnAccess();
    this.renderAll();
  }

  resize() {}

  update(deltaMs: number) {
    this.uiAccumulatorMs += deltaMs;
    if (this.uiAccumulatorMs < 1000) return;
    this.uiAccumulatorMs = 0;

    this.applyClaimOnAccess();
    const completed = this.resolveCompletedConstruction();

    this.renderResourceBar();
    this.renderQueue();
    this.renderSelectedBuilding();
    if (completed) {
      this.renderBuildings();
      this.renderSummary();
      this.renderHeader();
    }
  }

  setSelectedPlanet(nextPlanet: SelectedPlanetRef) {
    if (nextPlanet.id === this.selectedPlanet.id && nextPlanet.seed === this.selectedPlanet.seed) return;
    this.selectedPlanet = nextPlanet;
    const archetype = planetProfileFromSeed(nextPlanet.seed).archetype;
    this.state = getCityState(nextPlanet, archetype);
    this.uiAccumulatorMs = 0;
    this.renderAll();
  }

  destroy() {
    this.root?.remove();
    this.root = null;
    this.headerIdentity = null;
    this.resourceStrip = null;
    this.buildingsGrid = null;
    this.selectedPanel = null;
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

    const rail = document.createElement('aside');
    rail.className = 'city-management__rail';

    const railTitle = document.createElement('p');
    railTitle.className = 'city-management__rail-title';
    railTitle.textContent = 'City Ops';

    const railItems = ['City', 'Build', 'Queue', 'Overview'];
    railItems.forEach((item, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `city-management__rail-btn${index === 0 ? ' is-active' : ''}`;
      button.textContent = item;
      rail.append(button);
    });
    rail.prepend(railTitle);

    const left = document.createElement('section');
    left.className = 'city-management__left';

    const buildingTitle = document.createElement('h3');
    buildingTitle.className = 'city-management__section-title';
    buildingTitle.textContent = 'City';

    const stage = document.createElement('div');
    stage.className = 'city-management__city-stage';

    const stageFrame = document.createElement('div');
    stageFrame.className = 'city-management__stage-frame';

    const skyline = document.createElement('div');
    skyline.className = 'city-management__reserved-zone city-management__reserved-zone--sky';
    skyline.textContent = 'Future Air / Fleet Visual Zone';

    const ground = document.createElement('div');
    ground.className = 'city-management__reserved-zone city-management__reserved-zone--ground';
    ground.textContent = 'Future Ground Unit Zone';

    const buildingGrid = document.createElement('div');
    buildingGrid.className = 'city-management__building-grid city-management__stage-map';
    this.buildingsGrid = buildingGrid;

    stageFrame.append(skyline, buildingGrid, ground);
    stage.append(stageFrame);
    left.append(buildingTitle, stage);

    const right = document.createElement('aside');
    right.className = 'city-management__right';

    const resourceTitle = document.createElement('h3');
    resourceTitle.className = 'city-management__section-title';
    resourceTitle.textContent = 'Resources';

    const resource = this.createResourceBar();

    const selectedTitle = document.createElement('h3');
    selectedTitle.className = 'city-management__section-title';
    selectedTitle.textContent = 'Selected Building';

    const selected = document.createElement('div');
    selected.className = 'city-management__selected-panel';
    this.selectedPanel = selected;

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

    right.append(resourceTitle, resource, selectedTitle, selected, queueTitle, queue, summaryTitle, summary);
    layout.append(rail, left, right);

    return layout;
  }

  private renderAll() {
    this.applyClaimOnAccess();
    this.renderHeader();
    this.renderResourceBar();
    this.renderBuildings();
    this.renderSelectedBuilding();
    this.renderQueue();
    this.renderSummary();
  }

  private renderHeader() {
    if (!this.headerIdentity) return;
    this.headerIdentity.innerHTML = '';

    const items = [
      `City ${this.state.planetId.toUpperCase()}`,
      `Planet: ${this.state.archetype.toUpperCase()}`,
      `Owner: ${this.state.owner}`,
    ];

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

    const production = this.getProductionPerHour();
    const storage = this.getStorageCaps();

    (Object.keys(RESOURCE_LABELS) as CoinageResource[]).forEach((resource) => {
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
      stock.textContent = `${Math.floor(this.state.resources[resource]).toLocaleString()} / ${storage[resource].toLocaleString()}`;

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

    const slotOrder: BuildingId[] = ['hq', 'mine', 'quarry', 'refinery', 'warehouse', 'housing_complex'];
    slotOrder.forEach((buildingId) => {
      const building = getBuilding(buildingId);
      if (!building) return;
      const card = document.createElement('article');
      card.className = `city-management__building-card city-management__building-slot city-management__building-slot--${building.id}`;
      card.dataset.buildingId = building.id;

      const unlocked = this.isUnlocked(building);
      if (!unlocked) card.classList.add('is-locked');
      if (this.selectedBuildingId === building.id) card.classList.add('is-selected');

      const currentLevel = this.getBuildingLevel(building.id);
      const nextLevel = currentLevel + 1;
      const glyph = document.createElement('div');
      glyph.className = 'city-management__building-glyph';
      glyph.textContent = getBuildingGlyph(building.id);

      const blockedReason = this.getBlockedReason(building, nextLevel);
      const upgradeHook = this.createHiddenUpgradeTrigger(building, nextLevel, blockedReason);

      card.addEventListener('click', () => {
        this.selectedBuildingId = building.id;
        this.renderBuildings();
        this.renderSelectedBuilding();
      });

      if (building.id === 'hq') {
        card.append(this.createHqCoreModule(building.name, currentLevel, glyph), upgradeHook);
      } else {
        card.classList.add('city-management__building-marker-shell');
        card.append(this.createStructureMarker(building.name, currentLevel, blockedReason, glyph), upgradeHook);
      }
      this.buildingsGrid!.append(card);
    });

    const emptySlots = Math.max(0, this.state.citySlotTotal - BUILDINGS.length);
    const emptyVisible = Math.min(5, emptySlots);
    for (let i = 0; i < emptyVisible; i += 1) {
      const pad = document.createElement('button');
      pad.type = 'button';
      pad.className = `city-management__empty-pad city-management__empty-pad--${i + 1}`;
      pad.textContent = `Open Slot ${i + 1}`;
      pad.addEventListener('click', () => {
        this.selectedBuildingId = 'hq';
        this.renderSelectedBuilding();
      });
      this.buildingsGrid!.append(pad);
    }
  }

  private createHqCoreModule(name: string, level: number, glyph: HTMLDivElement) {
    const title = document.createElement('p');
    title.className = 'city-management__building-name city-management__building-name--hq';
    title.textContent = name;

    const levelBadge = document.createElement('span');
    levelBadge.className = 'city-management__building-level city-management__building-level--hq';
    levelBadge.textContent = `LVL ${level}`;

    const core = document.createElement('div');
    core.className = 'city-management__hq-core';
    const coreLevel = document.createElement('p');
    coreLevel.className = 'city-management__hq-level';
    coreLevel.textContent = `HQ LEVEL ${level}`;
    core.append(glyph, coreLevel);

    const status = document.createElement('p');
    status.className = 'city-management__building-status';
    status.textContent = 'City Core Online';

    const header = document.createElement('div');
    header.className = 'city-management__building-row';
    header.append(title, levelBadge);

    const wrapper = document.createElement('div');
    wrapper.className = 'city-management__hq-module';
    wrapper.append(header, core, status);
    return wrapper;
  }

  private createStructureMarker(name: string, level: number, blockedReason: string | null, glyph: HTMLDivElement) {
    const title = document.createElement('p');
    title.className = 'city-management__building-name';
    title.textContent = name;

    const levelBadge = document.createElement('span');
    levelBadge.className = 'city-management__building-level';
    levelBadge.textContent = `LVL ${level}`;

    const status = document.createElement('p');
    status.className = 'city-management__building-status';
    status.textContent = blockedReason && blockedReason !== 'Max level' ? 'LOCKED' : 'OPERATIONAL';

    const marker = document.createElement('div');
    marker.className = 'city-management__structure-marker';
    marker.append(glyph, title, levelBadge, status);
    return marker;
  }

  private createHiddenUpgradeTrigger(building: BuildingDefinition, nextLevel: number, blockedReason: string | null) {
    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'city-management__upgrade city-management__stage-test-hook';
    action.dataset.buildingId = building.id;
    action.disabled = blockedReason !== null;
    action.textContent = blockedReason ?? 'Upgrade';
    action.tabIndex = -1;
    action.setAttribute('aria-hidden', 'true');
    action.addEventListener('click', (event) => {
      event.stopPropagation();
      this.applyClaimOnAccess();
      this.startConstruction(building, nextLevel);
      this.renderAll();
    });
    return action;
  }

  private renderSelectedBuilding() {
    if (!this.selectedPanel) return;
    this.selectedPanel.innerHTML = '';
    const building = getBuilding(this.selectedBuildingId);
    if (!building) return;

    const unlocked = this.isUnlocked(building);
    const currentLevel = this.getBuildingLevel(building.id);
    const nextLevel = currentLevel + 1;
    const cost = this.getUpgradeCost(building, nextLevel);
    const blockedReason = this.getBlockedReason(building, nextLevel);

    const title = document.createElement('h4');
    title.className = 'city-management__selected-name';
    title.textContent = building.name;

    const level = document.createElement('p');
    level.className = 'city-management__selected-level';
    level.textContent = unlocked ? `Level ${currentLevel}` : `Locked · Requires HQ ${building.unlockAtHq}`;

    const effect = document.createElement('p');
    effect.className = 'city-management__selected-effect';
    effect.textContent = this.getBuildingEffectText(building, currentLevel);

    const costLine = document.createElement('p');
    costLine.className = 'city-management__building-meta';
    costLine.textContent = `Upgrade Cost: Ore ${cost.ore} · Stone ${cost.stone} · Iron ${cost.iron}`;

    const duration = document.createElement('p');
    duration.className = 'city-management__building-meta';
    duration.textContent = `Build time: ${formatDuration(this.getBuildDurationMs(building, nextLevel))}`;

    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'city-management__upgrade city-management__upgrade--selected';
    action.disabled = blockedReason !== null;
    action.textContent = blockedReason ?? `Upgrade to Level ${nextLevel}`;
    action.addEventListener('click', () => {
      this.applyClaimOnAccess();
      this.startConstruction(building, nextLevel);
      this.renderAll();
    });

    this.selectedPanel.append(title, level, effect, costLine, duration, action);
  }

  private renderQueue() {
    if (!this.queuePanel) return;
    this.queuePanel.innerHTML = '';

    const sorted = this.state.queue.slice().sort((a, b) => a.endsAtMs - b.endsAtMs);

    for (let i = 0; i < QUEUE_CAP; i += 1) {
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

      const definition = getBuilding(entry.buildingId);
      const remainingMs = Math.max(0, entry.endsAtMs - Date.now());
      const totalMs = Math.max(1, entry.endsAtMs - entry.startedAtMs);
      const progress = Math.min(100, Math.max(0, ((totalMs - remainingMs) / totalMs) * 100));

      const label = document.createElement('p');
      label.className = 'city-management__queue-name';
      label.textContent = `${definition?.name ?? entry.buildingId} → lvl ${entry.targetLevel}`;

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

    const storage = this.getStorageCaps();
    const pop = this.getPopulationSnapshot();
    const rows = [
      `Slots: ${this.getUsedSlots()}/${this.state.citySlotTotal}`,
      `Population: ${pop.used}/${pop.cap}`,
      `Storage · Ore: ${storage.ore}`,
      `Storage · Stone: ${storage.stone}`,
      `Storage · Iron: ${storage.iron}`,
      `Queue: ${this.state.queue.length}/${QUEUE_CAP}`,
    ];

    rows.forEach((text) => {
      const row = document.createElement('p');
      row.className = 'city-management__summary-row';
      row.textContent = text;
      this.summaryPanel!.append(row);
    });
  }

  private getBuildingLevel(buildingId: BuildingId) {
    return this.state.levels[buildingId] ?? 0;
  }

  private isUnlocked(building: BuildingDefinition) {
    if (building.id === 'hq') return true;
    return this.getBuildingLevel('hq') >= building.unlockAtHq;
  }

  private getBlockedReason(building: BuildingDefinition, targetLevel: number): string | null {
    if (!this.isUnlocked(building)) return `Requires HQ ${building.unlockAtHq}`;
    if (targetLevel > building.maxLevel) return 'Max level';
    if (this.state.queue.length >= QUEUE_CAP) return `Queue full (${QUEUE_CAP}/${QUEUE_CAP})`;
    if (this.state.queue.some((entry) => entry.buildingId === building.id)) return 'Already queued';

    const cost = this.getUpgradeCost(building, targetLevel);
    if (!this.canAfford(cost)) return 'Not enough resources';
    return null;
  }

  private startConstruction(building: BuildingDefinition, targetLevel: number) {
    const blockedReason = this.getBlockedReason(building, targetLevel);
    if (blockedReason) return;

    const cost = this.getUpgradeCost(building, targetLevel);
    this.state.resources.ore -= cost.ore;
    this.state.resources.stone -= cost.stone;
    this.state.resources.iron -= cost.iron;

    const startedAtMs = Date.now();
    this.state.queue.push({
      buildingId: building.id,
      targetLevel,
      startedAtMs,
      endsAtMs: startedAtMs + this.getBuildDurationMs(building, targetLevel),
      costPaid: cost,
    });
  }

  private resolveCompletedConstruction() {
    const now = Date.now();
    const complete = this.state.queue.filter((entry) => entry.endsAtMs <= now);
    if (!complete.length) return false;

    complete.forEach((entry) => {
      this.state.levels[entry.buildingId] = entry.targetLevel;
    });
    this.state.queue = this.state.queue.filter((entry) => entry.endsAtMs > now);

    return true;
  }

  private getUpgradeCost(building: BuildingDefinition, targetLevel: number): ResourceBundle {
    const multiplier = Math.pow(1.34, Math.max(0, targetLevel - 1));
    return {
      ore: Math.round(building.baseCost.ore * multiplier),
      stone: Math.round(building.baseCost.stone * multiplier),
      iron: Math.round(building.baseCost.iron * multiplier),
    };
  }

  private getBuildDurationMs(building: BuildingDefinition, targetLevel: number) {
    const multiplier = Math.pow(1.2, Math.max(0, targetLevel - 1));
    return Math.round(building.baseBuildSeconds * multiplier * 1000);
  }

  private getProductionPerHour(): ResourceBundle {
    return {
      ore: this.getBuildingLevel('mine') * (BUILDINGS.find((building) => building.id === 'mine')?.production.ore ?? 0),
      stone: this.getBuildingLevel('quarry') * (BUILDINGS.find((building) => building.id === 'quarry')?.production.stone ?? 0),
      iron: this.getBuildingLevel('refinery') * (BUILDINGS.find((building) => building.id === 'refinery')?.production.iron ?? 0),
    };
  }

  private getStorageCaps(): ResourceBundle {
    const warehouseLevel = this.getBuildingLevel('warehouse');
    const storageScale = 1 + warehouseLevel * 0.48;
    return {
      ore: Math.round(this.state.baseStorage.ore * storageScale),
      stone: Math.round(this.state.baseStorage.stone * storageScale),
      iron: Math.round(this.state.baseStorage.iron * storageScale),
    };
  }

  private getPopulationSnapshot() {
    const housingLevel = this.getBuildingLevel('housing_complex');
    const cap = this.state.basePopulationCap + housingLevel * 120;
    const used = BUILDINGS.reduce((sum, building) => sum + this.getBuildingLevel(building.id) * building.populationPerLevel, 0);
    return { used, cap };
  }

  private getUsedSlots() {
    return BUILDINGS.reduce((sum, building) => (this.getBuildingLevel(building.id) > 0 ? sum + 1 : sum), 0);
  }

  private getBuildingEffectText(building: BuildingDefinition, currentLevel: number) {
    if (building.id === 'mine') return `+${currentLevel * (building.production.ore ?? 0)} Ore / h`;
    if (building.id === 'quarry') return `+${currentLevel * (building.production.stone ?? 0)} Stone / h`;
    if (building.id === 'refinery') return `+${currentLevel * (building.production.iron ?? 0)} Iron / h`;
    if (building.id === 'warehouse') return `Storage boost x${(1 + currentLevel * 0.48).toFixed(2)}`;
    if (building.id === 'housing_complex') return `Population cap +${currentLevel * 120}`;
    return `Unlocks city progression (HQ ${currentLevel})`;
  }

  private canAfford(cost: ResourceBundle) {
    return this.state.resources.ore >= cost.ore && this.state.resources.stone >= cost.stone && this.state.resources.iron >= cost.iron;
  }

  private applyClaimOnAccess() {
    const now = Date.now();
    const elapsedMs = Math.max(0, now - this.state.lastUpdatedAtMs);
    if (elapsedMs <= 0) return;

    const elapsedHours = elapsedMs / (1000 * 60 * 60);
    const production = this.getProductionPerHour();
    const storage = this.getStorageCaps();

    this.state.resources.ore = Math.min(storage.ore, this.state.resources.ore + production.ore * elapsedHours);
    this.state.resources.stone = Math.min(storage.stone, this.state.resources.stone + production.stone * elapsedHours);
    this.state.resources.iron = Math.min(storage.iron, this.state.resources.iron + production.iron * elapsedHours);
    this.state.lastUpdatedAtMs = now;
  }
}

function getBuilding(buildingId: BuildingId) {
  return BUILDINGS.find((building) => building.id === buildingId) ?? null;
}

/**
 * Single source of truth adapter for city mode while backend city payload is not wired.
 * TODO(coinage-data): replace this adapter with real getCityState(planetId) API payload.
 */
function getCityState(planet: SelectedPlanetRef, archetype: PlanetArchetype): CityState {
  const cached = CITY_STATE_CACHE.get(planet.id);
  if (cached) return cached;

  const state: CityState = {
    planetId: planet.id,
    owner: buildOwnerLabel(planet.id),
    archetype,
    levels: {
      hq: 1,
      mine: 1,
      quarry: 1,
      warehouse: 1,
      housing_complex: 1,
    },
    resources: {
      ore: 520,
      stone: 340,
      iron: 180,
    },
    queue: [],
    citySlotTotal: 15,
    baseStorage: {
      ore: 500,
      stone: 300,
      iron: 200,
    },
    basePopulationCap: 260,
    lastUpdatedAtMs: Date.now(),
  };

  CITY_STATE_CACHE.set(planet.id, state);
  return state;
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

function getBuildingGlyph(buildingId: BuildingId) {
  if (buildingId === 'hq') return '▦';
  if (buildingId === 'mine') return '◫';
  if (buildingId === 'quarry') return '◧';
  if (buildingId === 'refinery') return '⛭';
  if (buildingId === 'warehouse') return '▣';
  return '⌂';
}
