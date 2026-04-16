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

type CatalogBuildingId =
  | EconomyBuildingId
  | 'market'
  | 'spy_center'
  | 'dock'
  | 'shipyard'
  | 'academy'
  | 'wall'
  | 'research_lab';
type LocalCitySection = 'city' | 'buildings' | 'military' | 'research' | 'espionage' | 'governance';
type BuildingCategory = 'economy' | 'military' | 'research' | 'espionage' | 'governance';
type BuildingDefinition = ReturnType<typeof getBuildingConfig>;
interface BuildingOpsSpecializedBlock {
  title: string;
  rows: string[];
}
interface CatalogBuilding {
  id: CatalogBuildingId;
  name: string;
  section: LocalCitySection;
  category: BuildingCategory;
  unlockAtHq: number;
  notes?: string;
}

const QUEUE_CAP = getConstructionQueueSlots();
const LOCAL_SECTIONS: Array<{ id: LocalCitySection; label: string; implemented: boolean }> = [
  { id: 'buildings', label: 'Buildings', implemented: true },
  { id: 'city', label: 'City', implemented: true },
  { id: 'military', label: 'Military', implemented: false },
  { id: 'research', label: 'Research', implemented: false },
  { id: 'espionage', label: 'Espionage', implemented: false },
  { id: 'governance', label: 'Governance', implemented: false },
];
const BUILDING_CATALOG: CatalogBuilding[] = [
  ...getEconomyBuildingOrder().map((id) => ({
    id,
    name: getBuildingConfig(id).name,
    section: 'buildings' as const,
    category: id === 'barracks' || id === 'combat_forge' || id === 'space_dock' ? ('military' as const) : ('economy' as const),
    unlockAtHq: getBuildingConfig(id).unlockAtHq,
  })),
  { id: 'research_lab', name: 'Research Lab', section: 'research', category: 'research', unlockAtHq: 4, notes: 'Planned module.' },
  { id: 'market', name: 'Market', section: 'city', category: 'economy', unlockAtHq: 2, notes: 'Planned module.' },
  { id: 'spy_center', name: 'Spy Center', section: 'espionage', category: 'espionage', unlockAtHq: 5, notes: 'Planned module.' },
  { id: 'dock', name: 'Dock', section: 'military', category: 'military', unlockAtHq: 6, notes: 'Planned module.' },
  { id: 'shipyard', name: 'Shipyard', section: 'military', category: 'military', unlockAtHq: 8, notes: 'Planned module.' },
  { id: 'academy', name: 'Academy', section: 'city', category: 'governance', unlockAtHq: 3, notes: 'Planned module.' },
  { id: 'wall', name: 'Wall', section: 'city', category: 'military', unlockAtHq: 4, notes: 'Planned module.' },
];
const ECONOMY_BUILDING_IDS = new Set<EconomyBuildingId>(getEconomyBuildingOrder());

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
  private localNavRail: HTMLElement | null = null;
  private categoryTabs: HTMLElement | null = null;
  private buildingsGrid: HTMLDivElement | null = null;
  private selectedPanel: HTMLDivElement | null = null;
  private queuePanel: HTMLDivElement | null = null;
  private summaryPanel: HTMLDivElement | null = null;
  private selectedBuildingId: CatalogBuildingId = 'hq';
  private activeSection: LocalCitySection = 'buildings';
  private activeCategory: BuildingCategory | 'all' = 'all';

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
    root.append(this.createHeader(), this.createBodyLayout());

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
    this.renderSelectedBuilding();
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
    this.localNavRail = null;
    this.categoryTabs = null;
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
    const identity = document.createElement('div');
    identity.className = 'city-management__header-identity';
    this.headerIdentity = identity;
    left.append(identity);

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

    const resource = this.createResourceBar();
    resource.classList.add('city-management__resource-bar--header');
    right.append(resource, switcher, backPlanet, backGalaxy);
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
    layout.className = 'city-management__ops-layout';

    const localNav = document.createElement('aside');
    localNav.className = 'city-management__local-nav';
    this.localNavRail = localNav;

    const main = document.createElement('section');
    main.className = 'city-management__ops-main';

    const summary = document.createElement('div');
    summary.className = 'city-management__summary-panel city-management__summary-panel--compact';
    this.summaryPanel = summary;

    const tabs = document.createElement('div');
    tabs.className = 'city-management__category-tabs';
    this.categoryTabs = tabs;

    const buildingGrid = document.createElement('div');
    buildingGrid.className = 'city-management__ops-grid city-management__ops-grid--rich';
    this.buildingsGrid = buildingGrid;

    main.append(summary, tabs, buildingGrid);

    const right = document.createElement('aside');
    right.className = 'city-management__ops-right';

    const selectedTitle = document.createElement('h3');
    selectedTitle.className = 'city-management__section-title';
    selectedTitle.textContent = 'Building Operations';

    const selected = document.createElement('div');
    selected.className = 'city-management__selected-panel';
    this.selectedPanel = selected;

    const queueTitle = document.createElement('h3');
    queueTitle.className = 'city-management__section-title';
    queueTitle.textContent = 'Construction Queue';

    const queue = document.createElement('div');
    queue.className = 'city-management__queue-panel';
    this.queuePanel = queue;

    right.append(selectedTitle, selected, queueTitle, queue);
    layout.append(localNav, main, right);

    return layout;
  }

  private renderAll() {
    this.refreshFromPersistence();
    this.renderHeader();
    this.renderResourceBar();
    this.renderLocalNav();
    this.renderCategoryTabs();
    this.renderBuildings();
    this.renderSelectedBuilding();
    this.renderQueue();
    this.renderSummary();
  }

  private renderLocalNav() {
    if (!this.localNavRail) return;
    this.localNavRail.innerHTML = '';

    const title = document.createElement('h3');
    title.className = 'city-management__section-title';
    title.textContent = 'City Systems';
    this.localNavRail.append(title);

    LOCAL_SECTIONS.forEach((section) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'city-management__nav-item';
      if (this.activeSection === section.id) button.classList.add('is-active');
      if (!section.implemented) button.classList.add('is-locked');
      button.disabled = !section.implemented;
      button.textContent = section.implemented ? section.label : `${section.label} · Locked`;
      button.addEventListener('click', () => {
        this.activeSection = section.id;
        if (section.id === 'military') this.activeCategory = 'military';
        if (section.id === 'research') this.activeCategory = 'research';
        if (section.id === 'espionage') this.activeCategory = 'espionage';
        if (section.id === 'governance') this.activeCategory = 'governance';
        this.renderLocalNav();
        this.renderCategoryTabs();
        this.renderBuildings();
      });
      this.localNavRail!.append(button);
    });
  }

  private getIdentityItems() {
    return [`City ${this.state.planetId.toUpperCase()}`, `Planet: ${this.state.archetype.toUpperCase()}`, `Owner: ${this.state.owner}`];
  }

  private renderCategoryTabs() {
    if (!this.categoryTabs) return;
    this.categoryTabs.innerHTML = '';
    const visible = this.getVisibleCatalog();
    const categories = Array.from(new Set(visible.map((item) => item.category)));
    const tabs: Array<BuildingCategory | 'all'> = ['all', ...categories];

    tabs.forEach((category) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'city-management__category-tab';
      if (this.activeCategory === category) button.classList.add('is-active');
      button.textContent = category === 'all' ? 'All' : category[0].toUpperCase() + category.slice(1);
      button.addEventListener('click', () => {
        this.activeCategory = category;
        this.renderCategoryTabs();
        this.renderBuildings();
      });
      this.categoryTabs!.append(button);
    });
  }

  private getVisibleCatalog() {
    return BUILDING_CATALOG.filter((building) => {
      if (this.activeCategory !== 'all' && building.category !== this.activeCategory) return false;
      if (this.activeSection === 'city' || this.activeSection === 'buildings') return true;
      return building.section === this.activeSection;
    });
  }

  private getCatalogBuilding(id: CatalogBuildingId) {
    return BUILDING_CATALOG.find((building) => building.id === id) ?? null;
  }

  private renderHeader() {
    if (!this.headerIdentity) return;
    const pop = this.getPopulationSnapshot();
    this.headerIdentity.textContent = `City ${this.state.planetId.toUpperCase()} · ${this.state.archetype.toUpperCase()} · Owner ${this.state.owner} · Slots ${this.getUsedSlots()}/${this.state.citySlotTotal} · Pop ${pop.used}/${pop.cap} · Queue ${this.state.economy.queue.length}/${QUEUE_CAP}`;
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
      const catalog = this.getCatalogBuilding(buildingId);
      if (!catalog) return;
      const building = getBuildingConfig(buildingId);
      const card = document.createElement('article');
      card.className = 'city-management__building-card';

      const unlocked = isBuildingUnlocked(this.state.economy, buildingId);
      if (!unlocked) card.classList.add('is-locked');

      const currentLevel = getBuildingLevel(this.state.economy, buildingId);

      const glyph = document.createElement('span');
      glyph.className = 'city-management__building-glyph';
      glyph.textContent = getBuildingGlyph(catalog.id);

      const name = document.createElement('p');
      name.className = 'city-management__building-name';
      name.textContent = catalog.name;

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

      card.addEventListener('click', () => {
        this.selectedBuildingId = buildingId;
        this.renderSelectedBuilding();
      });
      card.append(glyph, name, prodLine, costLine, duration, action);
      this.buildingsGrid!.append(card);
    });
  }

  private renderSelectedBuilding() {
    if (!this.selectedPanel) return;
    this.selectedPanel.innerHTML = '';

    const catalog = this.getCatalogBuilding(this.selectedBuildingId);
    if (!catalog) return;
    const operation = this.getBuildingDefinition(catalog.id);
    const currentLevel = operation ? getBuildingLevel(this.state.economy, operation.id) : 0;
    const nextUpgrade = operation ? operation.levels[currentLevel] ?? null : null;
    const guard = operation ? canStartConstruction(this.state.economy, operation.id) : { ok: false, reason: 'Locked' };

    const header = document.createElement('h4');
    header.className = 'city-management__selected-title';
    header.textContent = `${catalog.name} (${catalog.id.toUpperCase()})`;

    const currentState = document.createElement('p');
    currentState.className = 'city-management__selected-row';
    currentState.textContent = `Current level: ${currentLevel}`;

    const next = document.createElement('p');
    next.className = 'city-management__selected-row';
    next.textContent = nextUpgrade
      ? `Next: Ore ${nextUpgrade.resources.ore} · Stone ${nextUpgrade.resources.stone} · Iron ${nextUpgrade.resources.iron}`
      : 'Next: Max level reached / unavailable';

    const requirements = this.createSelectedBlockFromData(this.getRequirementsUnlockBlock(catalog, operation));
    const specialized = this.createSelectedBlockFromData(this.getSpecializedOperationsBlock(catalog, operation, currentLevel));
    const relatedQueue = this.createSelectedBlockFromData(this.getRelatedQueueNotesBlock(catalog, operation));

    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'city-management__upgrade';
    action.disabled = !operation || !guard.ok;
    action.textContent = operation ? guard.reason ?? 'Upgrade' : 'Unavailable';
    action.addEventListener('click', () => {
      if (!operation) return;
      const result = startCityBuildingUpgrade(this.persistenceContext, operation.id, Date.now());
      this.state.economy = result.state.economy;
      this.renderAll();
    });

    this.selectedPanel.append(header, currentState, next, requirements, specialized, relatedQueue, action);
  }

  private getRequirementsUnlockBlock(catalog: CatalogBuilding, operation: BuildingDefinition | null): BuildingOpsSpecializedBlock {
    if (catalog.id === 'hq' && operation) {
      const currentHq = this.getBuildingLevel('hq');
      const unlocked = BUILDING_CATALOG.filter((item) => item.id !== 'hq' && currentHq >= item.unlockAtHq).map((item) => item.name);
      const locked = BUILDING_CATALOG.filter((item) => item.id !== 'hq' && currentHq < item.unlockAtHq).map(
        (item) => `${item.name} (HQ ${item.unlockAtHq})`,
      );
      return {
        title: 'Requirements / Unlocks',
        rows: [
          `Unlocked buildings: ${unlocked.length ? unlocked.join(', ') : 'None'}`,
          `Locked requirements: ${locked.length ? locked.join(', ') : 'No pending locks'}`,
        ],
      };
    }

    if (!operation) {
      return {
        title: 'Requirements / Unlocks',
        rows: [`Requires HQ ${catalog.unlockAtHq}`, 'Additional dependency trees will appear here.'],
      };
    }

    return {
      title: 'Requirements / Unlocks',
      rows: [this.isUnlocked(operation) ? 'All current requirements met.' : `Requires HQ ${operation.unlockAtHq}`, 'Unlock path is governed by HQ progression.'],
    };
  }

  private createSelectedBlock(title: string, rows: string[]) {
    const block = document.createElement('section');
    block.className = 'city-management__selected-specialized';

    const heading = document.createElement('p');
    heading.className = 'city-management__selected-block-title';
    heading.textContent = title;
    block.append(heading);

    rows.forEach((text) => {
      const row = document.createElement('p');
      row.className = 'city-management__selected-block-row';
      row.textContent = text;
      block.append(row);
    });

    return block;
  }

  private createSelectedBlockFromData(block: BuildingOpsSpecializedBlock) {
    return this.createSelectedBlock(block.title, block.rows);
  }

  private getSpecializedOperationsBlock(
    catalog: CatalogBuilding,
    operation: BuildingDefinition | null,
    currentLevel: number,
  ): BuildingOpsSpecializedBlock {
    if (catalog.id === 'hq' && operation) {
      const currentHq = this.getBuildingLevel('hq');
      const unlocksOnNext = BUILDING_CATALOG.filter((item) => currentHq < item.unlockAtHq && currentHq + 1 >= item.unlockAtHq).map((item) => item.name);
      return {
        title: 'Specialized Operations',
        rows: [`HQ controls city progression and requirement trees.`, `Next unlocks: ${unlocksOnNext.length ? unlocksOnNext.join(', ') : 'No new unlock at next HQ level'}`],
      };
    }

    if (operation && (operation.id === 'mine' || operation.id === 'quarry' || operation.id === 'refinery')) {
      const current = this.getBuildingEffectText(operation.id, currentLevel);
      const next = this.getBuildingEffectText(operation.id, currentLevel + 1);
      return {
        title: 'Specialized Operations',
        rows: [`Current production: ${current}`, `Next-level production: ${next}`, 'State: Production line operational'],
      };
    }

    if (operation && operation.id === 'warehouse') {
      const currentBoost = (1 + currentLevel * 0.48).toFixed(2);
      const nextBoost = (1 + (currentLevel + 1) * 0.48).toFixed(2);
      const caps = this.getStorageCaps();
      return {
        title: 'Specialized Operations',
        rows: [`Storage multiplier: x${currentBoost} → x${nextBoost}`, `Caps: Ore ${caps.ore} · Stone ${caps.stone} · Iron ${caps.iron}`],
      };
    }

    if (operation && operation.id === 'housing_complex') {
      const pop = this.getPopulationSnapshot();
      return {
        title: 'Specialized Operations',
        rows: [`Population cap: ${pop.cap}`, `Usage: ${pop.used}/${pop.cap}`, 'Next level cap increase: +120'],
      };
    }

    if (catalog.id === 'barracks') {
      return {
        title: 'Specialized Operations',
        rows: [
          'Recruitable units: Militia, Rifle Squad (planned).',
          'Locked units: Armored Team (requires HQ 5 + Research Lab 2).',
          'Recruitment controls, costs, training times, and unit queue will render here.',
        ],
      };
    }

    if (catalog.id === 'research_lab') {
      return {
        title: 'Specialized Operations',
        rows: ['Available research: Resource Optimization I (planned).', 'Locked research: Metallurgy II (requires HQ 4).', 'Research queue and requirement tree will render here.'],
      };
    }

    return {
      title: 'Specialized Operations',
      rows: [catalog.notes ?? 'Building-specific operations surface.', 'Extensible module ready for future city systems.'],
    };
  }

  private getRelatedQueueNotesBlock(catalog: CatalogBuilding, operation: BuildingDefinition | null): BuildingOpsSpecializedBlock {
    if (operation) {
      const queueEntry = this.state.economy.queue
        .filter((entry) => entry.buildingId === operation.id)
        .sort((a, b) => a.endsAtMs - b.endsAtMs)[0];

      if (!queueEntry) {
        return {
          title: 'Related Queue / Notes',
          rows: ['No active construction for this building.', 'Queue slots are shared across city construction operations.'],
        };
      }

      const remainingMs = Math.max(0, queueEntry.endsAtMs - Date.now());
      return {
        title: 'Related Queue / Notes',
        rows: [`Queued upgrade: level ${queueEntry.targetLevel}`, `Remaining: ${formatDuration(remainingMs)}`],
      };
    }

    if (catalog.id === 'barracks') {
      return {
        title: 'Related Queue / Notes',
        rows: ['Recruitment queue: no active training.', 'Training queue UI will appear once barracks operations are implemented.'],
      };
    }

    if (catalog.id === 'research_lab') {
      return {
        title: 'Related Queue / Notes',
        rows: ['Research queue: empty.', 'Research queue controls will be connected in a future update.'],
      };
    }

    return {
      title: 'Related Queue / Notes',
      rows: ['No active related queue.', 'System reserved for specialized operations and notes.'],
    };
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
    if (buildingId === 'warehouse') return `Storage boost ${row?.effect.storageCap ? `Ore ${row.effect.storageCap.ore}` : 'active'}`;
    if (buildingId === 'housing_complex') return `Population cap +${row?.effect.populationCapBonus ?? 0}`;
    return `Unlocks city progression (HQ ${currentLevel})`;
  }

  private refreshFromPersistence() {
    const snapshot = loadCityEconomyState(this.persistenceContext, Date.now());
    this.state.economy = snapshot.economy;
  }

  private getStorageCaps() {
    return getStorageCaps(this.state.economy);
  }

  private getPopulationSnapshot() {
    return getPopulationSnapshot(this.state.economy);
  }

  private getBuildingLevel(buildingId: EconomyBuildingId) {
    return getBuildingLevel(this.state.economy, buildingId);
  }

  private isUnlocked(building: BuildingDefinition) {
    return isBuildingUnlocked(this.state.economy, building.id);
  }

  private getBuildingDefinition(id: CatalogBuildingId): BuildingDefinition | null {
    if (!ECONOMY_BUILDING_IDS.has(id as EconomyBuildingId)) return null;
    return getBuildingConfig(id as EconomyBuildingId);
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

function getBuildingGlyph(buildingId: CatalogBuildingId) {
  if (buildingId === 'hq') return '▦';
  if (buildingId === 'mine') return '◫';
  if (buildingId === 'quarry') return '◧';
  if (buildingId === 'refinery') return '⛭';
  if (buildingId === 'warehouse') return '▣';
  if (buildingId === 'housing_complex') return '⌂';
  if (buildingId === 'barracks') return '⚔';
  if (buildingId === 'research_lab') return '⌬';
  if (buildingId === 'market') return '⛁';
  if (buildingId === 'spy_center') return '◉';
  if (buildingId === 'dock') return '⚓';
  if (buildingId === 'shipyard') return '⛴';
  if (buildingId === 'academy') return '⌘';
  if (buildingId === 'wall') return '▤';
  return '✦';
}
