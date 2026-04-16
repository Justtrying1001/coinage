import type { ModeContext, RenderModeController } from '@/game/render/modes/RenderModeController';
import type { PlanetArchetype, SelectedPlanetRef } from '@/game/render/types';
import { planetProfileFromSeed } from '@/game/world/galaxyGenerator';

type CoinageResource = 'ore' | 'stone' | 'iron';
type BuildingId = 'hq' | 'mine' | 'quarry' | 'refinery' | 'warehouse' | 'housing_complex';
type CatalogBuildingId =
  | BuildingId
  | 'barracks'
  | 'research_lab'
  | 'market'
  | 'spy_center'
  | 'dock'
  | 'academy'
  | 'shipyard'
  | 'wall'
  | 'senate';
type LocalCitySection = 'city' | 'buildings' | 'military' | 'research' | 'espionage' | 'trade' | 'governance';
type BuildingCategory = 'economy' | 'military' | 'research' | 'espionage' | 'governance' | 'special';

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

interface BuildingOpsSpecializedBlock {
  title: string;
  rows: string[];
}

interface CitySectionItem {
  id: LocalCitySection;
  label: string;
  implemented: boolean;
}

interface CatalogBuilding {
  id: CatalogBuildingId;
  name: string;
  category: BuildingCategory;
  section: LocalCitySection;
  unlockAtHq: number;
  operationalId?: BuildingId;
  notes?: string;
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

const LOCAL_SECTIONS: CitySectionItem[] = [
  { id: 'city', label: 'City', implemented: true },
  { id: 'buildings', label: 'Buildings', implemented: true },
  { id: 'military', label: 'Military', implemented: false },
  { id: 'research', label: 'Research', implemented: false },
  { id: 'espionage', label: 'Espionage', implemented: false },
  { id: 'trade', label: 'Trade', implemented: false },
  { id: 'governance', label: 'Governance', implemented: false },
];

const BUILDING_CATEGORIES: Array<{ id: BuildingCategory | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'economy', label: 'Economy' },
  { id: 'military', label: 'Military' },
  { id: 'research', label: 'Research' },
  { id: 'espionage', label: 'Espionage' },
  { id: 'governance', label: 'Governance' },
  { id: 'special', label: 'Special' },
];

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

const BUILDING_CATALOG: CatalogBuilding[] = [
  { id: 'hq', name: 'HQ', category: 'governance', section: 'governance', unlockAtHq: 1, operationalId: 'hq' },
  { id: 'mine', name: 'Mine', category: 'economy', section: 'buildings', unlockAtHq: 1, operationalId: 'mine' },
  { id: 'quarry', name: 'Quarry', category: 'economy', section: 'buildings', unlockAtHq: 1, operationalId: 'quarry' },
  { id: 'refinery', name: 'Refinery', category: 'economy', section: 'buildings', unlockAtHq: 3, operationalId: 'refinery' },
  { id: 'warehouse', name: 'Warehouse', category: 'economy', section: 'buildings', unlockAtHq: 1, operationalId: 'warehouse' },
  { id: 'housing_complex', name: 'Housing Complex', category: 'special', section: 'city', unlockAtHq: 1, operationalId: 'housing_complex' },
  { id: 'barracks', name: 'Barracks', category: 'military', section: 'military', unlockAtHq: 2, notes: 'Unit recruitment surface.' },
  { id: 'shipyard', name: 'Shipyard', category: 'military', section: 'military', unlockAtHq: 4, notes: 'Ship and defense production.' },
  { id: 'wall', name: 'Wall', category: 'military', section: 'military', unlockAtHq: 2, notes: 'City defense multiplier.' },
  { id: 'research_lab', name: 'Research Lab', category: 'research', section: 'research', unlockAtHq: 3, notes: 'Research queue and tech unlocks.' },
  { id: 'academy', name: 'Academy', category: 'research', section: 'research', unlockAtHq: 2, notes: 'Research specialization bonuses.' },
  { id: 'spy_center', name: 'Spy Center', category: 'espionage', section: 'espionage', unlockAtHq: 4, notes: 'Intel and covert operations.' },
  { id: 'market', name: 'Market', category: 'special', section: 'trade', unlockAtHq: 2, notes: 'Trade offers and contracts.' },
  { id: 'dock', name: 'Dock', category: 'special', section: 'trade', unlockAtHq: 5, notes: 'Fleet logistics and transports.' },
  { id: 'senate', name: 'Senate', category: 'governance', section: 'governance', unlockAtHq: 4, notes: 'Policy and city governance actions.' },
];

const CITY_STATE_CACHE = new Map<string, CityState>();

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
    this.applyClaimOnAccess();
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

  private renderCategoryTabs() {
    if (!this.categoryTabs) return;
    this.categoryTabs.innerHTML = '';

    BUILDING_CATEGORIES.forEach((category) => {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'city-management__category-tab';
      if (this.activeCategory === category.id) tab.classList.add('is-active');
      tab.textContent = category.label;
      tab.addEventListener('click', () => {
        this.activeCategory = category.id;
        this.renderCategoryTabs();
        this.renderBuildings();
      });
      this.categoryTabs!.append(tab);
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
    this.headerIdentity.textContent = `City ${this.state.planetId.toUpperCase()} · ${this.state.archetype.toUpperCase()} · Owner ${this.state.owner} · Slots ${this.getUsedSlots()}/${this.state.citySlotTotal} · Pop ${pop.used}/${pop.cap} · Queue ${this.state.queue.length}/${QUEUE_CAP}`;
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

    const visible = this.getVisibleCatalog();

    visible.forEach((catalog) => {
      const card = document.createElement('article');
      card.className = 'city-management__building-op-card city-management__building-op-card--rich';
      card.dataset.buildingId = catalog.id;
      if (this.selectedBuildingId === catalog.id) card.classList.add('is-selected');

      const operation = catalog.operationalId ? getBuilding(catalog.operationalId) : null;
      const currentLevel = operation ? this.getBuildingLevel(operation.id) : 0;
      const nextLevel = currentLevel + 1;
      const blockedReason = operation ? this.getBlockedReason(operation, nextLevel) : `Requires HQ ${catalog.unlockAtHq}`;
      const unlocked = this.getBuildingLevel('hq') >= catalog.unlockAtHq;

      const glyph = document.createElement('span');
      glyph.className = 'city-management__building-glyph';
      glyph.textContent = getBuildingGlyph(catalog.id);

      const name = document.createElement('p');
      name.className = 'city-management__building-name';
      name.textContent = catalog.name;

      const level = document.createElement('span');
      level.className = 'city-management__building-level';
      level.textContent = operation ? `LVL ${currentLevel}` : unlocked ? 'PLANNED' : 'LOCKED';

      const info = document.createElement('p');
      info.className = 'city-management__building-status';
      info.textContent = operation ? this.getBuildingQuickInfo(operation, currentLevel) : catalog.notes ?? 'Future operations building.';

      const state = document.createElement('p');
      state.className = 'city-management__building-op-state';
      state.textContent = operation
        ? this.getBuildingCardStateText(operation, currentLevel, blockedReason)
        : unlocked
          ? 'State: Planned system (not yet active)'
          : `State: Locked · HQ ${catalog.unlockAtHq} required`;

      const action = document.createElement('button');
      action.type = 'button';
      action.className = 'city-management__upgrade';
      action.dataset.buildingId = catalog.id;
      if (operation) {
        action.disabled = blockedReason !== null;
        action.textContent = blockedReason ?? 'Upgrade';
        action.addEventListener('click', (event) => {
          event.stopPropagation();
          this.applyClaimOnAccess();
          this.startConstruction(operation, nextLevel);
          this.renderAll();
        });
      } else {
        action.disabled = true;
        action.textContent = unlocked ? 'Operations pending implementation' : `Requires HQ ${catalog.unlockAtHq}`;
      }

      card.addEventListener('click', () => {
        this.selectedBuildingId = catalog.id;
        this.renderSelectedBuilding();
        this.renderBuildings();
      });

      card.append(glyph, name, level, info, state, action);
      this.buildingsGrid!.append(card);
    });
  }

  private getBuildingQuickInfo(building: BuildingDefinition, currentLevel: number) {
    if (building.id === 'mine') return `Production ${currentLevel * (building.production.ore ?? 0)} Ore/h`;
    if (building.id === 'quarry') return `Production ${currentLevel * (building.production.stone ?? 0)} Stone/h`;
    if (building.id === 'refinery') return `Production ${currentLevel * (building.production.iron ?? 0)} Iron/h`;
    if (building.id === 'warehouse') return `Storage x${(1 + currentLevel * 0.48).toFixed(2)}`;
    if (building.id === 'housing_complex') return `Population +${currentLevel * 120}`;
    return 'City progression anchor';
  }

  private getBuildingCardStateText(building: BuildingDefinition, currentLevel: number, blockedReason: string | null) {
    if (!this.isUnlocked(building)) return `Locked · HQ ${building.unlockAtHq} required`;
    if (blockedReason === 'Max level') return 'State: Maxed';
    if (this.state.queue.some((entry) => entry.buildingId === building.id)) return `State: Upgrading to LVL ${currentLevel + 1}`;
    return 'State: Operational';
  }

  private renderSelectedBuilding() {
    if (!this.selectedPanel) return;
    this.selectedPanel.innerHTML = '';

    const catalog = this.getCatalogBuilding(this.selectedBuildingId);
    if (!catalog) return;

    const operation = catalog.operationalId ? getBuilding(catalog.operationalId) : null;
    const unlocked = this.getBuildingLevel('hq') >= catalog.unlockAtHq;
    const currentLevel = operation ? this.getBuildingLevel(operation.id) : 0;
    const nextLevel = currentLevel + 1;
    const blockedReason = operation ? this.getBlockedReason(operation, nextLevel) : `Requires HQ ${catalog.unlockAtHq}`;

    const header = document.createElement('div');
    header.className = 'city-management__selected-header';

    const glyph = document.createElement('span');
    glyph.className = 'city-management__selected-glyph';
    glyph.textContent = getBuildingGlyph(catalog.id);

    const titleWrap = document.createElement('div');
    const title = document.createElement('h4');
    title.className = 'city-management__selected-name';
    title.textContent = catalog.name;

    const level = document.createElement('p');
    level.className = 'city-management__selected-level';
    level.textContent = operation
      ? unlocked
        ? `Level ${currentLevel}`
        : `Locked · Requires HQ ${catalog.unlockAtHq}`
      : unlocked
        ? 'Planned city system'
        : `Locked · Requires HQ ${catalog.unlockAtHq}`;
    titleWrap.append(title, level);
    header.append(glyph, titleWrap);

    const currentState = this.createSelectedBlock('Current State', [
      operation ? this.getBuildingEffectText(operation, currentLevel) : catalog.notes ?? 'Planned building operations module.',
    ]);

    const nextUpgrade = this.createSelectedBlock('Next Level / Upgrade', [
      operation ? this.getBuildingEffectText(operation, Math.min(operation.maxLevel, nextLevel)) : 'Upgrade path will be enabled with feature implementation.',
    ]);

    const requirements = this.createSelectedBlockFromData(this.getRequirementsUnlockBlock(catalog, operation));
    const specialized = this.createSelectedBlockFromData(this.getSpecializedOperationsBlock(catalog, operation, currentLevel));
    const relatedQueue = this.createSelectedBlockFromData(this.getRelatedQueueNotesBlock(catalog, operation));

    const costRows = operation
      ? [
          `Ore ${this.getUpgradeCost(operation, nextLevel).ore} · Stone ${this.getUpgradeCost(operation, nextLevel).stone} · Iron ${this.getUpgradeCost(operation, nextLevel).iron}`,
          `Build time: ${formatDuration(this.getBuildDurationMs(operation, nextLevel))}`,
        ]
      : ['Upgrade/operation costs will appear once the system is unlocked in gameplay.'];
    const costTime = this.createSelectedBlock('Cost / Time', costRows);

    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'city-management__upgrade city-management__upgrade--selected';

    if (!operation) {
      action.disabled = true;
      action.textContent = unlocked ? 'Operations pending implementation' : `Requires HQ ${catalog.unlockAtHq}`;
    } else {
      action.disabled = blockedReason !== null;
      action.textContent = blockedReason ?? `Upgrade to Level ${nextLevel}`;
      action.addEventListener('click', () => {
        this.applyClaimOnAccess();
        this.startConstruction(operation, nextLevel);
        this.renderAll();
      });
    }

    this.selectedPanel.append(header, currentState, nextUpgrade, requirements, specialized, costTime, relatedQueue, action);
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
      const current = this.getBuildingEffectText(operation, currentLevel);
      const next = this.getBuildingEffectText(operation, currentLevel + 1);
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
      const queueEntry = this.state.queue
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
      `Queue: ${this.state.queue.length}/${QUEUE_CAP}`,
      `Storage Ore: ${storage.ore}`,
      `Storage Stone: ${storage.stone}`,
      `Storage Iron: ${storage.iron}`,
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
