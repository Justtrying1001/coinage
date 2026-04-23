import {
  canSetPolicy,
  canStartConstruction,
  canStartIntelProject,
  canStartEspionageMission,
  canDepositSpySilver,
  canStartResearch,
  canStartTroopTraining,
  getBuildingConfig,
  getConstructionCostResources,
  getBuildingLevel,
  getCityDerivedStats,
  getConstructionDurationSeconds,
  getConstructionQueueSlots,
  getEconomyBuildingOrder,
  getPopulationSnapshot,
  getMilitiaMaxSize,
  getMilitiaFarmEquivalentLevel,
  getMilitiaProductionMultiplier,
  isMilitiaActive,
  getProductionPerHour,
  getStorageCaps,
  getSpyVaultCap,
  getSpySilverCommittedInTransit,
  isBuildingUnlocked,
  type CityEconomyState,
} from '@/game/city/economy/cityEconomySystem';
import {
  loadCityEconomyState,
  activateCityMilitia,
  depositCitySpySilver,
  setCityPolicy,
  sendCityEspionageMission,
  startCityBuildingUpgrade,
  startCityIntelProject,
  startCityResearch,
  startCityTroopTraining,
  type CityPersistenceContext,
} from '@/game/city/economy/cityEconomyPersistence';
import {
  CITY_ECONOMY_CONFIG,
  type EconomyBuildingId,
  type EconomyResource,
  type LocalPolicyId,
  type ResearchId,
  type TroopId,
} from '@/game/city/economy/cityEconomyConfig';
import type { ModeContext, RenderModeController } from '@/game/render/modes/RenderModeController';
import type { PlanetArchetype, SelectedPlanetRef } from '@/game/render/types';
import { planetProfileFromSeed } from '@/game/world/galaxyGenerator';
import {
  buildingStateLabel,
  buildingUnlockSummary,
  formatBundle,
  formatEffectList,
  formatPolicyEffects,
  formatTroopProductionSite,
  formatTroopStats,
} from '@/game/render/modes/cityViewUiHelpers';

interface CityState {
  planetId: string;
  owner: string;
  archetype: PlanetArchetype;
  economy: CityEconomyState;
}

type LocalCitySection = 'command' | 'economy' | 'military' | 'defense' | 'research' | 'intelligence' | 'governance' | 'market';

const QUEUE_CAP = getConstructionQueueSlots();
const LOCAL_SECTIONS: Array<{ id: LocalCitySection; label: string; icon: string }> = [
  { id: 'command', label: 'Command', icon: 'home' },
  { id: 'economy', label: 'Economy', icon: 'payments' },
  { id: 'military', label: 'Military', icon: 'military_tech' },
  { id: 'defense', label: 'Defense', icon: 'shield' },
  { id: 'research', label: 'Research', icon: 'science' },
  { id: 'intelligence', label: 'Intelligence', icon: 'visibility' },
  { id: 'governance', label: 'Governance', icon: 'account_balance' },
  { id: 'market', label: 'Market', icon: 'currency_exchange' },
];

const RESOURCE_LABELS: Record<EconomyResource, string> = {
  ore: 'Ore',
  stone: 'Stone',
  iron: 'Iron',
};
const RESOURCE_ICONS: Record<EconomyResource, string> = {
  ore: '/assets/cg_resource_ore_20.svg',
  stone: '/assets/cg_resource_stone_20.svg',
  iron: '/assets/cg_resource_iron_20.svg',
};

const BUILDING_ASSETS: Partial<Record<EconomyBuildingId, string>> = {
  hq: '/assets/HQ.png',
  quarry: '/assets/stone.png',
  refinery: '/assets/refinery.png',
  warehouse: '/assets/warehouse.png',
  housing_complex: '/assets/housing.png',
  barracks: '/assets/barracks.png',
  space_dock: '/assets/building/spacedock.png',
  defensive_wall: '/assets/walls.png',
  skyshield_battery: '/assets/watchtower.png',
  armament_factory: '/assets/cg_token_slot_placeholder_64.svg',
  intelligence_center: '/assets/building/spycenter.png',
  research_lab: '/assets/researchlabs.png',
  market: '/assets/market.png',
  council_chamber: '/assets/council_chamber.png',
};

const ALL_BUILDINGS = getEconomyBuildingOrder();
const COMMAND_CORE_BUILDINGS: EconomyBuildingId[] = ['hq', 'housing_complex', 'research_lab'];
const COMMAND_EXTRACTION_BUILDINGS: EconomyBuildingId[] = ['mine', 'quarry', 'refinery', 'warehouse'];
const COMMAND_TACTICAL_BUILDINGS: EconomyBuildingId[] = ['barracks', 'space_dock', 'armament_factory', 'skyshield_battery', 'defensive_wall'];
const COMMAND_SUPPORT_BUILDINGS: EconomyBuildingId[] = ['intelligence_center', 'market', 'council_chamber'];
const ECONOMY_BUILDINGS: EconomyBuildingId[] = ['mine', 'quarry', 'refinery', 'warehouse', 'housing_complex'];
const DEFENSE_BUILDINGS: EconomyBuildingId[] = ['defensive_wall', 'skyshield_battery'];
const MARKET_BUILDINGS: EconomyBuildingId[] = ['market', 'warehouse'];
const INTEL_PROJECT_LABELS: Record<'sweep' | 'network' | 'cipher', string> = {
  sweep: 'Signal Sweep',
  network: 'Network Infiltration',
  cipher: 'Cipher Breach',
};

export class CityFoundationMode implements RenderModeController {
  readonly id = 'city3d' as const;

  private root: HTMLElement | null = null;
  private topBar: HTMLElement | null = null;
  private sideNav: HTMLElement | null = null;
  private mainCanvas: HTMLElement | null = null;
  private detailPanel: HTMLElement | null = null;

  private selectedBuildingId: EconomyBuildingId = 'hq';
  private selectedTroopId: TroopId | null = null;
  private selectedResearchId: ResearchId | null = null;
  private selectedPolicyId: LocalPolicyId | null = null;
  private selectedIntelProject: 'sweep' | 'network' | 'cipher' | null = null;
  private activeSection: LocalCitySection = 'command';
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
    this.context.host.innerHTML = '';
    const root = document.createElement('section');
    root.className = 'city-stitch';
    root.append(this.createTopBar(), this.createSideNav(), this.createMainCanvas(), this.createDetailPanel());
    this.context.host.append(root);
    this.root = root;
    this.renderAll();
  }

  resize() {}

  update(deltaMs: number) {
    this.uiAccumulatorMs += deltaMs;
    if (this.uiAccumulatorMs < 1000) return;
    this.uiAccumulatorMs = 0;
    this.refreshFromPersistence();
    this.renderAll();
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
  }

  private createTopBar() {
    const bar = document.createElement('header');
    bar.className = 'city-stitch__top';
    this.topBar = bar;
    return bar;
  }

  private createSideNav() {
    const nav = document.createElement('aside');
    nav.className = 'city-stitch__side';
    this.sideNav = nav;
    return nav;
  }

  private createMainCanvas() {
    const canvas = document.createElement('main');
    canvas.className = 'city-stitch__main';
    this.mainCanvas = canvas;
    return canvas;
  }

  private createDetailPanel() {
    const panel = document.createElement('aside');
    panel.className = 'city-stitch__right';
    this.detailPanel = panel;
    return panel;
  }

  private renderAll() {
    this.refreshFromPersistence();
    this.renderTopBar();
    this.renderSideNav();
    this.renderMainCanvas();
    this.renderDetailPanel();
  }

  private renderTopBar() {
    if (!this.topBar) return;

    const pop = getPopulationSnapshot(this.state.economy);
    const storage = getStorageCaps(this.state.economy);
    const production = getProductionPerHour(this.state.economy);
    const storagePct = Math.max(
      0,
      Math.min(
        100,
        Math.max(
          this.state.economy.resources.ore / Math.max(1, storage.ore),
          this.state.economy.resources.stone / Math.max(1, storage.stone),
          this.state.economy.resources.iron / Math.max(1, storage.iron),
        ) * 100,
      ),
    );

    this.topBar.innerHTML = '';
    const activeSectionLabel = LOCAL_SECTIONS.find((section) => section.id === this.activeSection)?.label ?? 'Command';

    const frame = document.createElement('div');
    frame.className = 'city-stitch__hud-frame';

    const switchCluster = document.createElement('section');
    switchCluster.className = 'city-stitch__hud-segment city-stitch__hud-segment--switch';
    switchCluster.append(
      this.makeModeButton('Galaxy', 'galaxy2d', false),
      this.makeModeButton('Planet', 'planet3d', false),
      this.makeModeButton('City', 'city3d', true),
    );

    const leftCluster = document.createElement('section');
    leftCluster.className = 'city-stitch__hud-segment city-stitch__hud-segment--brand';
    leftCluster.innerHTML = `<p class="city-stitch__overline">City</p>
      <p class="city-stitch__logo">${this.state.planetId.toUpperCase()}</p>
      <p class="city-stitch__hud-muted">${this.state.owner} · ${this.state.archetype}</p>`;

    const contextAnchor = document.createElement('section');
    contextAnchor.className = 'city-stitch__hud-segment city-stitch__hud-segment--context';
    contextAnchor.innerHTML = `<p class="city-stitch__overline">Selection</p>
      <p class="city-stitch__hud-context-title">${activeSectionLabel}</p>
      <p class="city-stitch__hud-muted">${getBuildingConfig(this.selectedBuildingId).name} · Build ${this.state.economy.queue.length}/${QUEUE_CAP} · Train ${this.state.economy.trainingQueue.length} · Intel ${this.state.economy.intelProjects.length}</p>`;

    const resources = document.createElement('section');
    resources.className = 'city-stitch__hud-segment city-stitch__hud-segment--resources';
    (Object.keys(RESOURCE_LABELS) as EconomyResource[]).forEach((resource) => {
      const item = document.createElement('article');
      item.className = 'city-stitch__resource city-stitch__resource--compact';
      item.title = RESOURCE_LABELS[resource];
      item.setAttribute('data-tooltip', RESOURCE_LABELS[resource]);
      const resourcePct = Math.max(0, Math.min(100, (this.state.economy.resources[resource] / Math.max(1, storage[resource])) * 100));
      item.innerHTML = `<p class="city-stitch__resource-icon"><img src="${RESOURCE_ICONS[resource]}" alt="${RESOURCE_LABELS[resource]}" /></p>
      <p class="city-stitch__resource-amount city-stitch__metric">${Math.floor(this.state.economy.resources[resource]).toLocaleString()}</p>
      <p class="city-stitch__resource-rate city-stitch__metric">+${Math.round(production[resource]).toLocaleString()}/h</p>
      <div class="city-stitch__resource-fill"><span style="width:${resourcePct.toFixed(1)}%"></span></div>`;
      resources.append(item);
    });
    const meta = document.createElement('article');
    meta.className = 'city-stitch__resource city-stitch__resource--compact city-stitch__resource--meta';
    meta.title = 'Population';
    meta.setAttribute('data-tooltip', 'Population');
    meta.innerHTML = `<p class="city-stitch__resource-icon"><img src="/assets/cg_resource_population_20.svg" alt="Population" /></p>
      <p class="city-stitch__resource-amount city-stitch__metric">${pop.used.toLocaleString()} / ${pop.cap.toLocaleString()}</p>
      <p class="city-stitch__resource-rate city-stitch__metric">Storage ${storagePct.toFixed(1)}% · ${this.getHudAlert()}</p>`;
    resources.append(meta);

    const queueModule = document.createElement('section');
    queueModule.className = 'city-stitch__hud-segment city-stitch__hud-segment--queue';
    queueModule.append(this.createTopQueueModule());

    frame.append(switchCluster, leftCluster, contextAnchor, resources, queueModule);
    this.topBar.append(frame);
  }

  private renderSideNav() {
    if (!this.sideNav) return;

    this.sideNav.innerHTML = '<div class="city-stitch__sector">CITYVIEW</div><div class="city-stitch__sector-sub">Sections</div>';
    const nav = document.createElement('nav');
    nav.className = 'city-stitch__nav';

    LOCAL_SECTIONS.forEach((section) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'city-stitch__nav-btn';
      if (this.activeSection === section.id) button.classList.add('is-active');
      button.setAttribute('aria-label', section.label);
      button.title = section.label;
      button.setAttribute('data-tooltip', section.label);
      const icon = this.createNavIcon(section.icon);
      const subLabel = document.createElement('span');
      subLabel.className = 'city-stitch__nav-sub';
      subLabel.textContent = this.getSectionSubLabel(section.id);
      button.append(icon, subLabel);
      const lock = document.createElement('span');
      lock.className = 'city-stitch__nav-lock';
      lock.textContent = this.getSectionStatusBadge(section.id);
      button.append(lock);
      button.addEventListener('click', () => {
        this.activeSection = section.id;
        this.renderMainCanvas();
        this.renderDetailPanel();
        this.renderSideNav();
      });
      nav.append(button);
    });

    this.sideNav.append(nav);
  }

  private renderMainCanvas() {
    if (!this.mainCanvas) return;
    this.mainCanvas.innerHTML = '';

    const wrapper = document.createElement('section');
    wrapper.className = `city-stitch__view city-stitch__view--${this.activeSection}`;

    if (this.activeSection === 'command') wrapper.append(this.renderCommandPage());
    if (this.activeSection === 'economy') wrapper.append(this.renderEconomyPage());
    if (this.activeSection === 'military') wrapper.append(this.renderMilitaryPage());
    if (this.activeSection === 'defense') wrapper.append(this.renderDefensePage());
    if (this.activeSection === 'research') wrapper.append(this.renderResearchPage());
    if (this.activeSection === 'intelligence') wrapper.append(this.renderIntelligencePage());
    if (this.activeSection === 'governance') wrapper.append(this.renderGovernancePage());
    if (this.activeSection === 'market') wrapper.append(this.renderMarketPage());

    this.mainCanvas.append(wrapper);
  }

  private renderCommandPage() {
    const page = document.createElement('section');
    page.append(this.createViewHeader('City Command', 'Upgrade buildings and track requirements.'));
    page.append(
      this.createBranchKpis([
        { label: 'Structures', value: `${ALL_BUILDINGS.filter((id) => getBuildingLevel(this.state.economy, id) > 0).length}/${ALL_BUILDINGS.length}` },
        { label: 'Queue', value: `${this.state.economy.queue.length}/${QUEUE_CAP}` },
        { label: 'Focus', value: getBuildingConfig(this.selectedBuildingId).name },
      ]),
    );

    const coreSection = document.createElement('section');
    coreSection.className = 'city-stitch__command-core';
    coreSection.append(this.createSectionTitle('Core infrastructure'));
    const coreGrid = document.createElement('div');
    coreGrid.className = 'city-stitch__cards city-stitch__cards--core';
    COMMAND_CORE_BUILDINGS.forEach((buildingId) => coreGrid.append(this.createBuildingCard(buildingId)));
    coreSection.append(coreGrid);

    const operations = document.createElement('section');
    operations.className = 'city-stitch__command-ops';

    const extraction = document.createElement('section');
    extraction.className = 'city-stitch__command-column';
    extraction.append(this.createSectionTitle('Extraction & processing'));
    const extractionGrid = document.createElement('div');
    extractionGrid.className = 'city-stitch__cards city-stitch__cards--ops';
    COMMAND_EXTRACTION_BUILDINGS.forEach((buildingId) => extractionGrid.append(this.createBuildingCard(buildingId)));
    extraction.append(extractionGrid);

    const tactical = document.createElement('section');
    tactical.className = 'city-stitch__command-column';
    tactical.append(this.createSectionTitle('Tactical operations'));
    const tacticalGrid = document.createElement('div');
    tacticalGrid.className = 'city-stitch__cards city-stitch__cards--ops';
    COMMAND_TACTICAL_BUILDINGS.forEach((buildingId) => tacticalGrid.append(this.createBuildingCard(buildingId)));
    tactical.append(tacticalGrid);

    operations.append(extraction, tactical);

    const support = document.createElement('section');
    support.className = 'city-stitch__command-support';
    support.append(this.createSectionTitle('Governance & infrastructure'));
    const supportGrid = document.createElement('div');
    supportGrid.className = 'city-stitch__cards city-stitch__cards--support';
    COMMAND_SUPPORT_BUILDINGS.forEach((buildingId) => supportGrid.append(this.createBuildingCard(buildingId)));
    support.append(supportGrid);

    page.append(coreSection, operations, support);
    return page;
  }

  private renderEconomyPage() {
    const page = document.createElement('section');
    page.append(this.createViewHeader('Economy', 'Production, storage, and population usage.'));
    const production = getProductionPerHour(this.state.economy);
    const storage = getStorageCaps(this.state.economy);
    page.append(
      this.createBranchKpis([
        { label: 'Ore', value: `+${Math.round(production.ore)}/h` },
        { label: 'Stone', value: `+${Math.round(production.stone)}/h` },
        { label: 'Iron', value: `+${Math.round(production.iron)}/h` },
        {
          label: 'Storage',
          value: `${Math.round(
            clampPercent(
              Math.max(
                (this.state.economy.resources.ore / Math.max(1, storage.ore)) * 100,
                (this.state.economy.resources.stone / Math.max(1, storage.stone)) * 100,
                (this.state.economy.resources.iron / Math.max(1, storage.iron)) * 100,
              ),
            ),
          )}%`,
        },
      ]),
    );

    const primary = document.createElement('section');
    primary.className = 'city-stitch__tile-grid';
    ECONOMY_BUILDINGS.forEach((buildingId) => primary.append(this.createProductionTile(buildingId)));

    const split = document.createElement('section');
    split.className = 'city-stitch__ops-grid city-stitch__ops-grid--double';

    const throughput = document.createElement('section');
    throughput.className = 'city-stitch__ops-list';
    throughput.innerHTML = '<h3>Throughput telemetry</h3>';
    (Object.keys(RESOURCE_LABELS) as EconomyResource[]).forEach((resource) => {
      const row = document.createElement('div');
      row.className = 'city-stitch__ops-row';
      row.innerHTML = `<p>${RESOURCE_LABELS[resource]} pipeline</p>
      <p>+${Math.round(production[resource]).toLocaleString()}/h</p>
      <p>${Math.round(clampPercent((this.state.economy.resources[resource] / Math.max(1, storage[resource])) * 100))}% cap</p>`;
      throughput.append(row);
    });

    const intel = document.createElement('section');
    intel.className = 'city-stitch__ops-list';
    intel.innerHTML = '<h3>Building intel</h3>';
    ECONOMY_BUILDINGS.forEach((id) => intel.append(this.createBuildingLinkRow(id)));

    const militia = document.createElement('section');
    militia.className = 'city-stitch__ops-list';
    const militiaActive = isMilitiaActive(this.state.economy);
    const militiaMax = getMilitiaMaxSize(this.state.economy);
    const remaining = this.state.economy.militia.expiresAtMs ? Math.max(0, this.state.economy.militia.expiresAtMs - Date.now()) : 0;
    militia.innerHTML = `<h3>Citizen Militia protocol</h3>
      <div class="city-stitch__ops-row"><p>Status</p><p>${militiaActive ? 'ACTIVE' : 'INACTIVE'}</p><p>Housing LVL ${getMilitiaFarmEquivalentLevel(this.state.economy)}</p></div>
      <div class="city-stitch__ops-row"><p>Current / max</p><p>${this.state.economy.militia.currentMilitia}/${militiaMax}</p><p>Local defense only</p></div>
      <div class="city-stitch__ops-row"><p>Economic malus</p><p>${militiaActive ? '-50% production' : 'No malus'}</p><p>${militiaActive ? formatDuration(remaining) : '—'}</p></div>`;
    militia.append(
      this.makeActionButton(militiaActive ? 'Militia active' : 'Activate militia (3h)', militiaActive, () => {
        const result = activateCityMilitia(this.persistenceContext, Date.now());
        this.state.economy = result.state.economy;
        this.renderAll();
      }),
    );

    split.append(throughput, intel, militia);
    page.append(primary, split);
    return page;
  }

  private renderMilitaryPage() {
    const page = document.createElement('section');
    page.append(this.createViewHeader('Military', 'Train units and inspect combat stats.'));
    page.append(
      this.createBranchKpis([
        { label: 'Training queue', value: `${this.state.economy.trainingQueue.length}` },
        { label: 'Barracks', value: `LVL ${getBuildingLevel(this.state.economy, 'barracks')}` },
        { label: 'Space dock', value: `LVL ${getBuildingLevel(this.state.economy, 'space_dock')}` },
      ]),
    );

    const roster = document.createElement('section');
    roster.className = 'city-stitch__ops-list';
    roster.innerHTML = '<h3>Training roster</h3>';
    const rosterGrid = document.createElement('div');
    rosterGrid.className = 'city-stitch__unit-grid';

    (Object.keys(CITY_ECONOMY_CONFIG.troops) as TroopId[]).forEach((troopId) => {
      const troop = CITY_ECONOMY_CONFIG.troops[troopId];
      if (troop.category === 'militia') return;
      const guard = canStartTroopTraining(this.state.economy, troopId, 1);
      const row = document.createElement('article');
      row.className = `city-stitch__unit-card${this.selectedTroopId === troopId ? ' is-active' : ''}`;
      row.innerHTML = `<p class="city-stitch__unit-head">${troop.category.toUpperCase()} · ${guard.ok ? 'AVAILABLE' : 'UNAVAILABLE'}</p>
        <h4>${troop.name}</h4>
        <p class="city-stitch__unit-meta">${formatTroopStats(troop)}</p>
        <p class="city-stitch__unit-meta">Cost ${formatBundle(troop.cost)} · Train ${formatDuration(troop.trainingSeconds * 1000)}</p>
        <p class="city-stitch__unit-meta">Req ${formatTroopProductionSite(troop)}${troop.requiredResearch ? ` · Research ${troop.requiredResearch}` : ''}</p>
        <p class="city-stitch__unit-meta">Owned ${this.state.economy.troops[troopId]} · Queued ${this.state.economy.trainingQueue.filter((entry) => entry.troopId === troopId).reduce((sum, entry) => sum + entry.quantity, 0)}</p>
        <p class="city-stitch__unit-meta">${guard.ok ? 'Ready to train' : guard.reason ?? 'Unavailable'}</p>`;
      row.addEventListener('click', () => {
        this.selectedTroopId = troopId;
        this.renderDetailPanel();
        this.renderMainCanvas();
      });
      row.append(this.makeActionButton(guard.ok ? 'Train x1' : guard.reason ?? 'Unavailable', !guard.ok, () => {
        const result = startCityTroopTraining(this.persistenceContext, troopId, 1, Date.now());
        this.state.economy = result.state.economy;
        this.renderAll();
      }));
      rosterGrid.append(row);
    });
    roster.append(rosterGrid);

    const feed = document.createElement('section');
    feed.className = 'city-stitch__ops-list';
    feed.innerHTML = '<h3>Active manufacturing feed</h3>';
    const queue = this.state.economy.trainingQueue.slice().sort((a, b) => a.endsAtMs - b.endsAtMs);
    if (queue.length === 0) {
      feed.append(this.createQueueLine('No active military batch'));
    } else {
      queue.forEach((entry) => {
        const troopName = CITY_ECONOMY_CONFIG.troops[entry.troopId].name;
        feed.append(this.createQueueLine(`${troopName} x${entry.quantity} · ${formatDuration(Math.max(0, entry.endsAtMs - Date.now()))}`));
      });
    }

    const support = document.createElement('section');
    support.className = 'city-stitch__ops-list';
    support.innerHTML = '<h3>Support structures</h3>';
    ['barracks', 'armament_factory', 'space_dock'].forEach((id) => support.append(this.createBuildingLinkRow(id as EconomyBuildingId)));

    page.append(roster, feed, support);
    return page;
  }

  private renderDefensePage() {
    const page = document.createElement('section');
    const derived = getCityDerivedStats(this.state.economy);
    page.append(this.createViewHeader('Defense', 'Defense bonuses and mitigation values.'));
    page.append(
      this.createBranchKpis([
        { label: 'Integrity', value: `${Math.min(100, 40 + derived.cityDefensePct).toFixed(1)}%` },
        { label: 'Mitigation', value: `+${derived.damageMitigationPct.toFixed(1)}%` },
        { label: 'Breach risk', value: `${Math.max(2, 30 - derived.siegeResistancePct * 0.2).toFixed(1)}%` },
      ]),
    );

    const metrics = document.createElement('section');
    metrics.className = 'city-stitch__ops-grid city-stitch__ops-grid--defense';
    metrics.innerHTML = `<article class="city-stitch__ops-card"><h3>Integrity</h3><p>+${derived.cityDefensePct.toFixed(1)}%</p></article>
      <article class="city-stitch__ops-card"><h3>Reactive plating</h3><p>+${derived.damageMitigationPct.toFixed(1)}%</p></article>
      <article class="city-stitch__ops-card"><h3>Breach risk</h3><p>${Math.max(2, 30 - derived.siegeResistancePct * 0.2).toFixed(1)}%</p></article>`;

    const structures = document.createElement('section');
    structures.className = 'city-stitch__ops-list';
    structures.innerHTML = '<h3>Defense structures</h3>';
    DEFENSE_BUILDINGS.forEach((id) => structures.append(this.createBuildingLinkRow(id)));

    const hardening = document.createElement('section');
    hardening.className = 'city-stitch__ops-list';
    const militiaActive = isMilitiaActive(this.state.economy);
    hardening.innerHTML = `<h3>Hardening overview</h3>
      <div class="city-stitch__ops-row"><p>Wall integrity</p><p>${Math.min(100, 40 + derived.cityDefensePct).toFixed(1)}%</p><p>Stable</p></div>
      <div class="city-stitch__ops-row"><p>Reactive plating</p><p>+${derived.damageMitigationPct.toFixed(1)}%</p><p>Active</p></div>
      <div class="city-stitch__ops-row"><p>Breach risk</p><p>${Math.max(2, 30 - derived.siegeResistancePct * 0.2).toFixed(1)}%</p><p>Monitored</p></div>
      <div class="city-stitch__ops-row"><p>Citizen militia</p><p>${militiaActive ? this.state.economy.militia.currentMilitia : 0}</p><p>${militiaActive ? 'Active local defenders' : 'Inactive'}</p></div>`;

    page.append(metrics, hardening, structures);
    return page;
  }

  private renderResearchPage() {
    const page = document.createElement('section');
    page.append(this.createViewHeader('Research', 'Unlock research using resources and RP capacity.'));
    const researchCapacity = getBuildingLevel(this.state.economy, 'research_lab') * 4;
    const researchSpent = this.state.economy.completedResearch.reduce(
      (sum, researchId) => sum + CITY_ECONOMY_CONFIG.research[researchId].researchPointsCost,
      0,
    );
    page.append(
      this.createBranchKpis([
        { label: 'Completed', value: `${this.state.economy.completedResearch.length}` },
        { label: 'Points', value: `${researchSpent}/${researchCapacity}` },
        { label: 'Lab level', value: `LVL ${getBuildingLevel(this.state.economy, 'research_lab')}` },
      ]),
    );

    const list = document.createElement('section');
    list.className = 'city-stitch__ops-list';
    list.innerHTML = '<h3>Research nodes</h3>';
    const nodeGrid = document.createElement('div');
    nodeGrid.className = 'city-stitch__node-grid';
    (Object.keys(CITY_ECONOMY_CONFIG.research) as ResearchId[]).forEach((researchId) => {
      const cfg = CITY_ECONOMY_CONFIG.research[researchId];
      const guard = canStartResearch(this.state.economy, researchId);
      const completed = this.state.economy.completedResearch.includes(researchId);
      const node = document.createElement('article');
      node.className = `city-stitch__node-card${completed ? ' is-complete' : ''}${this.selectedResearchId === researchId ? ' is-active' : ''}`;
      node.innerHTML = `<p class="city-stitch__unit-head">${completed ? 'COMPLETED' : guard.ok ? 'AVAILABLE' : 'LOCKED'}</p>
        <h4>${cfg.name}</h4>
        <p class="city-stitch__unit-meta">Lab lvl ${cfg.requiredBuildingLevel} · ${cfg.researchPointsCost} RP</p>
        <p class="city-stitch__unit-meta">Cost ${formatBundle(cfg.cost)}</p>
        <p class="city-stitch__unit-meta">${formatResearchEffect(cfg.effect)}</p>
        <p class="city-stitch__unit-meta">${guard.ok ? 'Ready to start' : guard.reason ?? 'Unavailable'}</p>`;
      node.addEventListener('click', () => {
        this.selectedResearchId = researchId;
        this.renderDetailPanel();
        this.renderMainCanvas();
      });
      node.append(this.makeActionButton(guard.ok ? 'Start research' : guard.reason ?? 'Unavailable', !guard.ok, () => {
        const result = startCityResearch(this.persistenceContext, researchId, Date.now());
        this.state.economy = result.state.economy;
        this.renderAll();
      }));
      nodeGrid.append(node);
    });
    list.append(nodeGrid);

    page.append(list);
    return page;
  }

  private renderIntelligencePage() {
    const page = document.createElement('section');
    const guard = canStartIntelProject(this.state.economy);
    page.append(this.createViewHeader('Intelligence', 'Run intel projects, vault silver, and espionage missions.'));
    page.append(
      this.createBranchKpis([
        { label: 'Readiness', value: `${this.state.economy.intelReadiness.toFixed(1)}%` },
        { label: 'Active projects', value: `${this.state.economy.intelProjects.length}` },
        { label: 'Center level', value: `LVL ${getBuildingLevel(this.state.economy, 'intelligence_center')}` },
        { label: 'Vault silver', value: `${Math.floor(this.state.economy.spyVaultSilver)}` },
      ]),
    );

    const list = document.createElement('section');
    list.className = 'city-stitch__ops-list';
    list.innerHTML = `<h3>Readiness ${this.state.economy.intelReadiness.toFixed(1)}%</h3>`;
    const board = document.createElement('div');
    board.className = 'city-stitch__intel-grid';

    (['sweep', 'network', 'cipher'] as const).forEach((projectType) => {
      const card = document.createElement('article');
      const runtimeDurationSeconds = projectType === 'sweep' ? 70 : projectType === 'network' ? 120 : 160;
      const runtimeReadinessGain = projectType === 'sweep' ? 8 : projectType === 'network' ? 14 : 20;
      card.className = `city-stitch__intel-card${this.selectedIntelProject === projectType ? ' is-active' : ''}`;
      card.innerHTML = `<p class="city-stitch__unit-head">${projectType.toUpperCase()} · ${guard.ok ? 'AVAILABLE' : 'BLOCKED'}</p>
        <h4>${INTEL_PROJECT_LABELS[projectType]}</h4>
        <p class="city-stitch__unit-meta">Duration ${formatDuration(runtimeDurationSeconds * 1000)} · +${runtimeReadinessGain}% readiness</p>
        <p class="city-stitch__unit-meta">${guard.ok ? 'Ready to start' : guard.reason ?? 'Unavailable'}</p>`;
      card.addEventListener('click', () => {
        this.selectedIntelProject = projectType;
        this.renderDetailPanel();
        this.renderMainCanvas();
      });
      card.append(this.makeActionButton(guard.ok ? 'Start project' : guard.reason ?? 'Unavailable', !guard.ok, () => {
        const result = startCityIntelProject(this.persistenceContext, projectType, Date.now());
        this.state.economy = result.state.economy;
        this.renderAll();
      }));
      board.append(card);
    });
    list.append(board);

    const active = document.createElement('section');
    active.className = 'city-stitch__ops-list';
    active.innerHTML = '<h3>Active operations</h3>';
    if (this.state.economy.intelProjects.length === 0) {
      active.append(this.createQueueLine('No active intelligence project'));
    } else {
      this.state.economy.intelProjects.forEach((entry) => {
        const projectLabel = INTEL_PROJECT_LABELS[entry.projectType];
        active.append(this.createQueueLine(`${projectLabel} · +${entry.readinessGain.toFixed(1)} readiness · ${formatDuration(Math.max(0, entry.endsAtMs - Date.now()))}`));
      });
    }
    if (this.state.economy.espionageMissions.length === 0) {
      active.append(this.createQueueLine('No active espionage mission'));
    } else {
      this.state.economy.espionageMissions.forEach((mission) => {
        active.append(
          this.createQueueLine(
            `Spy mission → ${mission.targetCityId} · ${Math.floor(mission.silverCommitted)} silver · ETA ${formatDuration(Math.max(0, mission.endsAtMs - Date.now()))}`,
          ),
        );
      });
    }

    const espionage = document.createElement('section');
    espionage.className = 'city-stitch__ops-list';
    const cap = getSpyVaultCap(this.state.economy);
    const inFlight = getSpySilverCommittedInTransit(this.state.economy);
    espionage.innerHTML = `<h3>Spy vault</h3>
      <div class="city-stitch__ops-row"><p>Stored silver</p><p>${Math.floor(this.state.economy.spyVaultSilver)}</p><p>Converted from iron</p></div>
      <div class="city-stitch__ops-row"><p>Capacity</p><p>${Number.isFinite(cap) ? Math.floor(cap) : '∞'}</p><p>In flight ${Math.floor(inFlight)}</p></div>`;

    const depositGuard = canDepositSpySilver(this.state.economy, 1000);
    espionage.append(this.makeActionButton(depositGuard.ok ? 'Bank 1000 silver' : depositGuard.reason ?? 'Unavailable', !depositGuard.ok, () => {
      const result = depositCitySpySilver(this.persistenceContext, 1000, Date.now());
      this.state.economy = result.state.economy;
      this.renderAll();
    }));

    const targetInput = document.createElement('input');
    targetInput.placeholder = 'Target city id';
    targetInput.value = 'planet-b';
    const silverInput = document.createElement('input');
    silverInput.type = 'number';
    silverInput.value = '1000';
    silverInput.min = '1000';
    const sendButton = this.makeActionButton('Launch espionage', false, () => {
      const silver = Number(silverInput.value || '0');
      const guardMission = canStartEspionageMission(this.state.economy, targetInput.value.trim(), silver);
      if (!guardMission.ok) {
        sendButton.textContent = guardMission.reason ?? 'Unavailable';
        return;
      }
      const result = sendCityEspionageMission(this.persistenceContext, targetInput.value.trim(), silver, Date.now());
      this.state.economy = result.state.economy;
      this.renderAll();
    });
    const controls = document.createElement('div');
    controls.className = 'city-stitch__ops-row';
    controls.append(targetInput, silverInput, sendButton);
    espionage.append(controls);

    const reports = document.createElement('section');
    reports.className = 'city-stitch__ops-list';
    reports.innerHTML = '<h3>Espionage reports</h3>';
    if (this.state.economy.espionageReports.length === 0) {
      reports.append(this.createQueueLine('No espionage reports yet'));
    } else {
      this.state.economy.espionageReports.slice(0, 6).forEach((entry) => {
        const kindLine =
          entry.kind === 'attack_success'
            ? `Success vs ${entry.targetCityId}`
            : entry.kind === 'attack_failed'
              ? `Failed vs ${entry.targetCityId}`
              : entry.kind === 'defense_failed_attempt'
                ? `Detected failed attempt from ${entry.sourceCityId}`
                : `Mission cancelled (target missing)`;
        const detail =
          entry.kind === 'attack_success'
            ? `Sent ${entry.silverSent} > defense ${Math.floor(entry.defenderEffectiveSpyDefense)}`
            : entry.kind === 'attack_failed'
              ? `Sent ${entry.silverSent} vs defense ${Math.floor(entry.defenderEffectiveSpyDefense)}`
              : entry.kind === 'defense_failed_attempt'
                ? `Defender spent ${entry.defenderSilverSpentOnDefense} silver`
                : `Silver refunded ${entry.silverSent}`;
        reports.append(this.createQueueLine(`${kindLine} · ${detail}`));
      });
    }

    page.append(list, active, espionage, reports);
    return page;
  }

  private renderGovernancePage() {
    const page = document.createElement('section');
    page.append(this.createViewHeader('Governance', 'Apply local policies and review effects.'));
    page.append(
      this.createBranchKpis([
        { label: 'Authority', value: 'EXARCH-IV' },
        { label: 'Compliance', value: `${Math.min(99, 70 + getCityDerivedStats(this.state.economy).cityDefensePct * 0.2).toFixed(1)}%` },
        { label: 'Policy', value: this.state.economy.activePolicy ? CITY_ECONOMY_CONFIG.policies[this.state.economy.activePolicy].name : 'None' },
      ]),
    );

    const list = document.createElement('section');
    list.className = 'city-stitch__ops-list';
    list.innerHTML = '<h3>Available directives</h3>';
    const directiveGrid = document.createElement('div');
    directiveGrid.className = 'city-stitch__directive-grid';

    (Object.keys(CITY_ECONOMY_CONFIG.policies) as LocalPolicyId[]).forEach((policyId) => {
      const policy = CITY_ECONOMY_CONFIG.policies[policyId];
      const guard = canSetPolicy(this.state.economy, policyId);
      const card = document.createElement('article');
      card.className = `city-stitch__directive-card${this.state.economy.activePolicy === policyId ? ' is-active' : ''}${this.selectedPolicyId === policyId ? ' is-active' : ''}`;
      card.innerHTML = `<p class="city-stitch__unit-head">${this.state.economy.activePolicy === policyId ? 'Active' : 'Directive'}</p>
        <h4>${policy.name}</h4>
        <p class="city-stitch__unit-meta">${policy.description}</p>
        <p class="city-stitch__unit-meta">${formatPolicyEffects(policy)}</p>
        <p class="city-stitch__unit-meta">${guard.ok ? 'Can be applied now' : guard.reason ?? 'Unavailable'}</p>`;
      card.addEventListener('click', () => {
        this.selectedPolicyId = policyId;
        this.renderDetailPanel();
        this.renderMainCanvas();
      });
      card.append(this.makeActionButton(guard.ok ? 'Apply policy' : guard.reason ?? 'Unavailable', !guard.ok, () => {
        const result = setCityPolicy(this.persistenceContext, policyId, Date.now());
        this.state.economy = result.state.economy;
        this.renderAll();
      }));
      directiveGrid.append(card);
    });
    list.append(directiveGrid);

    const impact = document.createElement('section');
    impact.className = 'city-stitch__ops-list';
    impact.innerHTML = `<h3>Impact panel</h3>
      <div class="city-stitch__ops-row"><p>Authority level</p><p>EXARCH-IV</p><p>Stable</p></div>
      <div class="city-stitch__ops-row"><p>Compliance rate</p><p>${Math.min(99, 70 + getCityDerivedStats(this.state.economy).cityDefensePct * 0.2).toFixed(1)}%</p><p>Monitored</p></div>
      <div class="city-stitch__ops-row"><p>Active policy</p><p>${this.state.economy.activePolicy ? CITY_ECONOMY_CONFIG.policies[this.state.economy.activePolicy].name : 'None'}</p><p>Live</p></div>`;

    page.append(list, impact);
    return page;
  }

  private renderMarketPage() {
    const page = document.createElement('section');
    const derived = getCityDerivedStats(this.state.economy);
    page.append(this.createViewHeader('Market', 'Market efficiency status and runtime availability.'));
    page.append(
      this.createBranchKpis([
        { label: 'Efficiency', value: `+${derived.marketEfficiencyPct.toFixed(1)}%` },
        { label: 'Market lvl', value: `LVL ${getBuildingLevel(this.state.economy, 'market')}` },
        { label: 'Storage hub', value: `LVL ${getBuildingLevel(this.state.economy, 'warehouse')}` },
      ]),
    );

    const marketPanel = document.createElement('section');
    marketPanel.className = 'city-stitch__ops-list';
    marketPanel.innerHTML = `<h3>Exchange runtime status</h3>
      <div class="city-stitch__ops-row"><p>Trade execution</p><p>Not implemented</p><p>No buy/sell action in system</p></div>
      <div class="city-stitch__ops-row"><p>Efficiency stat</p><p>+${derived.marketEfficiencyPct.toFixed(1)}%</p><p>Calculated from Market + research</p></div>
      <div class="city-stitch__ops-row"><p>Current value to player</p><p>Building progression</p><p>Unlocks intel/governance prereqs</p></div>`;

    const disabled = document.createElement('div');
    disabled.className = 'city-stitch__ops-row';
    disabled.innerHTML = '<p>Trade controls</p><p>Disabled</p><p>UI intentionally disabled until runtime trade flow exists</p>';
    disabled.append(this.makeActionButton('Trade action unavailable (not implemented)', true, () => {}));
    marketPanel.append(disabled);

    const presets = document.createElement('section');
    presets.className = 'city-stitch__ops-list';
    presets.innerHTML = `<h3>Why this section is partial</h3>
      <div class="city-stitch__ops-row"><p>What exists</p><p>Market efficiency stat</p><p>Affects derived city stats only</p></div>
      <div class="city-stitch__ops-row"><p>What does not exist</p><p>Exchange transaction runtime</p><p>No source/target conversion API</p></div>
      <div class="city-stitch__ops-row"><p>UI behavior</p><p>Informational</p><p>No fake interactive controls</p></div>`;

    const buildings = document.createElement('section');
    buildings.className = 'city-stitch__ops-list';
    buildings.innerHTML = '<h3>Market infrastructure</h3>';
    MARKET_BUILDINGS.forEach((id) => buildings.append(this.createBuildingLinkRow(id)));

    page.append(marketPanel, presets, buildings);
    return page;
  }

  private createViewHeader(title: string, subtitle: string) {
    const header = document.createElement('header');
    header.className = 'city-stitch__main-header';
    header.innerHTML = `<h1>${title}</h1>
      <p>Planet ${this.state.planetId.toUpperCase()} · ${this.state.archetype.toUpperCase()} · ${this.state.owner}</p>
      <p>${subtitle}</p>`;
    return header;
  }

  private createBranchKpis(items: Array<{ label: string; value: string }>) {
    const row = document.createElement('section');
    row.className = 'city-stitch__branch-kpis';
    items.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'city-stitch__kpi';
      card.innerHTML = `<p>${item.label}</p><h3 class="city-stitch__metric">${item.value}</h3>`;
      row.append(card);
    });
    return row;
  }

  private createSectionTitle(text: string) {
    const title = document.createElement('h2');
    title.className = 'city-stitch__section-title';
    title.textContent = text;
    return title;
  }

  private createListBlock(title: string, ids: EconomyBuildingId[]) {
    const block = document.createElement('section');
    block.className = 'city-stitch__ops-list';
    block.innerHTML = `<h3>${title}</h3>`;
    ids.forEach((buildingId) => block.append(this.createBuildingLinkRow(buildingId)));
    return block;
  }

  private createProductionTile(buildingId: EconomyBuildingId) {
    const config = getBuildingConfig(buildingId);
    const level = getBuildingLevel(this.state.economy, buildingId);
    const effect = this.getBuildingEffectText(buildingId, level);

    const tile = document.createElement('article');
    tile.className = 'city-stitch__tile';
    tile.innerHTML = `<div class="city-stitch__tile-header"><p>${config.name}</p><span>LVL ${level}</span></div>
      <p class="city-stitch__tile-effect">${effect}</p>`;
    const image = BUILDING_ASSETS[buildingId];
    if (image) {
      const media = document.createElement('div');
      media.className = 'city-stitch__tile-media';
      media.innerHTML = `<img src="${image}" alt="${config.name}" />`;
      tile.append(media);
    }
    tile.addEventListener('click', () => {
      this.selectedBuildingId = buildingId;
      this.renderDetailPanel();
    });
    return tile;
  }

  private createBuildingCard(buildingId: EconomyBuildingId) {
    const config = getBuildingConfig(buildingId);
    const level = getBuildingLevel(this.state.economy, buildingId);
    const guard = canStartConstruction(this.state.economy, buildingId);
    const unlocked = isBuildingUnlocked(this.state.economy, buildingId);
    const next = config.levels[level] ?? null;
    const state = buildingStateLabel({ isUnlocked: unlocked, currentLevel: level, maxLevel: config.maxLevel, guard });

    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'city-stitch__card';
    if (this.selectedBuildingId === buildingId) card.classList.add('is-selected');
    if (!unlocked) card.classList.add('is-disabled');
    card.dataset.buildingId = buildingId;

    const image = BUILDING_ASSETS[buildingId];
    const imageMarkup = image
      ? `<div class="city-stitch__card-image"><img src="${image}" alt="${config.name}"/></div>`
      : '<div class="city-stitch__card-image city-stitch__card-image--empty"><span class="city-stitch__fallback-badge">No Art</span></div>';

    card.innerHTML = `<div class="city-stitch__card-top"><p class="city-stitch__card-name">${config.name}</p><p class="city-stitch__card-level">LVL ${level}</p></div>
      ${imageMarkup}
      <div class="city-stitch__card-bottom">
        <p>${next ? formatBundle(next.resources) : 'MAX LEVEL'}</p>
        <p class="city-stitch__state city-stitch__state--${state.tone}">${state.label}</p>
      </div>`;

    card.addEventListener('click', () => {
      this.selectedBuildingId = buildingId;
      this.renderMainCanvas();
      this.renderDetailPanel();
    });

    return card;
  }

  private createBuildingLinkRow(buildingId: EconomyBuildingId) {
    const cfg = getBuildingConfig(buildingId);
    const level = getBuildingLevel(this.state.economy, buildingId);
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'city-stitch__link-row';
    row.textContent = `${cfg.name} · LVL ${level}`;
    row.addEventListener('click', () => {
      this.selectedBuildingId = buildingId;
      this.activeSection = 'command';
      this.renderAll();
    });
    return row;
  }

  private renderDetailPanel() {
    if (!this.detailPanel) return;
    this.detailPanel.innerHTML = '';

    if (this.activeSection === 'command') {
      this.detailPanel.append(this.renderBuildingDetailPanel(), this.renderDerivedPanel());
      return;
    }

    if (this.activeSection === 'economy' || this.activeSection === 'defense' || this.activeSection === 'market') {
      this.detailPanel.append(this.renderBuildingDetailPanel(), this.renderDerivedPanel());
      return;
    }

    if (this.activeSection === 'military') {
      this.detailPanel.append(this.renderMilitaryDetailPanel(), this.renderDerivedPanel());
      return;
    }

    if (this.activeSection === 'research') {
      this.detailPanel.append(this.renderResearchDetailPanel(), this.renderDerivedPanel());
      return;
    }

    if (this.activeSection === 'intelligence') {
      this.detailPanel.append(this.renderIntelDetailPanel(), this.renderDerivedPanel());
      return;
    }

    this.detailPanel.append(this.renderGovernanceDetailPanel(), this.renderDerivedPanel());
  }

  private renderBuildingDetailPanel() {
    const config = getBuildingConfig(this.selectedBuildingId);
    const level = getBuildingLevel(this.state.economy, this.selectedBuildingId);
    const next = config.levels[level] ?? null;
    const guard = canStartConstruction(this.state.economy, this.selectedBuildingId);

    const panel = document.createElement('section');
    panel.className = 'city-stitch__detail-block';
    const durationSeconds = next ? getConstructionDurationSeconds(this.state.economy, this.selectedBuildingId, next.level) : null;
    const currentEffect = level > 0 ? formatEffectList(config.levels[level - 1]?.effect ?? {}) : ['No effect at level 0'];
    const nextEffect = next ? formatEffectList(next.effect) : [];
    const requirementLines = this.getBuildingRequirementLines(this.selectedBuildingId);
    panel.innerHTML = `<h3>${config.name}</h3>
      <p>Status: level ${level}/${config.maxLevel}</p>
      <p>${buildingUnlockSummary(config)}</p>
      <p>Requirements: ${requirementLines.join(' · ')}</p>
      <p>Current effect: ${currentEffect.join(' · ')}</p>
      <p>${next ? `Next level cost: ${formatBundle(getConstructionCostResources(this.state.economy, this.selectedBuildingId, next.level))} · Population +${Math.max(0, next.populationCost - (level > 0 ? config.levels[level - 1]?.populationCost ?? 0 : 0))}` : 'Max level reached'}</p>
      <p>${next && durationSeconds !== null ? `Construction time: ${formatDuration(durationSeconds * 1000)}` : 'Construction time: —'}</p>
      <p>${nextEffect.length > 0 ? `Next level effect: ${nextEffect.join(' · ')}` : 'Next level effect: —'}</p>`;

    panel.append(this.makeActionButton(guard.ok ? 'Upgrade now' : guard.reason ?? 'Unavailable', !guard.ok, () => {
      const result = startCityBuildingUpgrade(this.persistenceContext, this.selectedBuildingId, Date.now());
      this.state.economy = result.state.economy;
      this.renderAll();
    }));

    return panel;
  }

  private renderMilitaryDetailPanel() {
    const panel = document.createElement('section');
    panel.className = 'city-stitch__detail-block';
    if (this.selectedTroopId) {
      const troop = CITY_ECONOMY_CONFIG.troops[this.selectedTroopId];
      const guard = canStartTroopTraining(this.state.economy, this.selectedTroopId, 1);
      panel.innerHTML = `<h3>${troop.name}</h3>
        <p>Category: ${troop.category}</p>
        <p>${formatTroopStats(troop)}</p>
        <p>Cost: ${formatBundle(troop.cost)} · Population ${troop.populationCost}</p>
        <p>Training: ${formatDuration(troop.trainingSeconds * 1000)} · Facility ${formatTroopProductionSite(troop)}</p>
        <p>Requirement: ${troop.requiredResearch ? `research ${troop.requiredResearch}` : 'none'}</p>
        <p>Owned: ${this.state.economy.troops[this.selectedTroopId]} · Queued: ${this.state.economy.trainingQueue.filter((entry) => entry.troopId === this.selectedTroopId).reduce((sum, entry) => sum + entry.quantity, 0)}</p>
        <p>Role: ${troop.notes ?? 'No runtime notes'}</p>
        <p>${guard.ok ? 'Available now' : `Blocked: ${guard.reason ?? 'Unavailable'}`}</p>`;
      return panel;
    }
    panel.innerHTML = `<h3>Military overview</h3>
      <p>Select a unit card to inspect full costs, stats, and exact requirements.</p>
      <p>Active batches: ${this.state.economy.trainingQueue.length}</p>
      <p>Barracks level: ${getBuildingLevel(this.state.economy, 'barracks')} · Space dock level: ${getBuildingLevel(this.state.economy, 'space_dock')}</p>
      <p>Citizen militia: ${isMilitiaActive(this.state.economy) ? `${this.state.economy.militia.currentMilitia} active` : 'inactive'}</p>`;
    return panel;
  }

  private renderResearchDetailPanel() {
    const panel = document.createElement('section');
    panel.className = 'city-stitch__detail-block';
    const researchCapacity = getBuildingLevel(this.state.economy, 'research_lab') * 4;
    const researchSpent = this.state.economy.completedResearch.reduce(
      (sum, researchId) => sum + CITY_ECONOMY_CONFIG.research[researchId].researchPointsCost,
      0,
    );
    if (this.selectedResearchId) {
      const cfg = CITY_ECONOMY_CONFIG.research[this.selectedResearchId];
      const guard = canStartResearch(this.state.economy, this.selectedResearchId);
      panel.innerHTML = `<h3>${cfg.name}</h3>
        <p>Effect: ${formatResearchEffect(cfg.effect)}</p>
        <p>Cost: ${formatBundle(cfg.cost)} · RP ${cfg.researchPointsCost}</p>
        <p>Requires research lab ${cfg.requiredBuildingLevel}</p>
        <p>Status: ${this.state.economy.completedResearch.includes(this.selectedResearchId) ? 'Completed' : guard.ok ? 'Available' : `Blocked (${guard.reason ?? 'Unavailable'})`}</p>
        <p>Points used: ${researchSpent}/${researchCapacity}</p>`;
      return panel;
    }
    panel.innerHTML = `<h3>Research status</h3>
      <p>Points used: ${researchSpent}/${researchCapacity}</p>
      <p>Completed: ${this.state.economy.completedResearch.length}</p>
      <p>Lab level: ${getBuildingLevel(this.state.economy, 'research_lab')}</p>
      <p>Select a research node for exact effects and blockers.</p>`;
    return panel;
  }

  private renderIntelDetailPanel() {
    const panel = document.createElement('section');
    panel.className = 'city-stitch__detail-block';
    panel.innerHTML = `<h3>${this.selectedIntelProject ? `${INTEL_PROJECT_LABELS[this.selectedIntelProject]} detail` : 'Intel status'}</h3>
      <p>Readiness: ${this.state.economy.intelReadiness.toFixed(1)}%</p>
      <p>Active projects: ${this.state.economy.intelProjects.length}</p>
      <p>Center level: ${getBuildingLevel(this.state.economy, 'intelligence_center')}</p>
      <p>Vault silver: ${Math.floor(this.state.economy.spyVaultSilver)} / ${Number.isFinite(getSpyVaultCap(this.state.economy)) ? Math.floor(getSpyVaultCap(this.state.economy)) : '∞'}</p>
      <p>Silver in flight: ${Math.floor(getSpySilverCommittedInTransit(this.state.economy))}</p>
      <p>${this.selectedIntelProject ? 'Project details shown in main panel. One project may run at once.' : 'Select a project card for duration and readiness gain.'}</p>`;
    return panel;
  }

  private renderGovernanceDetailPanel() {
    const panel = document.createElement('section');
    panel.className = 'city-stitch__detail-block';
    if (this.selectedPolicyId) {
      const policy = CITY_ECONOMY_CONFIG.policies[this.selectedPolicyId];
      const guard = canSetPolicy(this.state.economy, this.selectedPolicyId);
      panel.innerHTML = `<h3>${policy.name}</h3>
        <p>${policy.description}</p>
        <p>Effects: ${formatPolicyEffects(policy)}</p>
        <p>Requires council chamber ${policy.requiredCouncilLevel}</p>
        <p>Status: ${this.state.economy.activePolicy === this.selectedPolicyId ? 'Active' : guard.ok ? 'Available' : `Blocked (${guard.reason ?? 'Unavailable'})`}</p>`;
      return panel;
    }
    panel.innerHTML = `<h3>Governance status</h3>
      <p>Active policy: ${this.state.economy.activePolicy ?? 'none'}</p>
      <p>Council level: ${getBuildingLevel(this.state.economy, 'council_chamber')}</p>
      <p>Select a directive to inspect exact effects and requirements.</p>`;
    return panel;
  }

  private renderDerivedPanel() {
    const derived = getCityDerivedStats(this.state.economy);
    const panel = document.createElement('section');
    panel.className = 'city-stitch__detail-block';
    const militiaMultiplier = getMilitiaProductionMultiplier(this.state.economy);
    panel.innerHTML = `<h3>City effects</h3>
      <p>Defense +${derived.cityDefensePct.toFixed(1)}% · Mitigation +${derived.damageMitigationPct.toFixed(1)}%</p>
      <p>Anti-air defense +${(derived.antiAirDefensePct ?? 0).toFixed(1)}%</p>
      <p>Training +${derived.trainingSpeedPct.toFixed(1)}% · Ground ATK +${derived.groundAttackPct.toFixed(1)}% · Ground DEF +${derived.groundDefensePct.toFixed(1)}%</p>
      <p>Air ATK +${derived.airAttackPct.toFixed(1)}% · Air DEF +${derived.airDefensePct.toFixed(1)}%</p>
      <p>Detection +${derived.detectionPct.toFixed(1)}% · Counter-intel +${derived.counterIntelPct.toFixed(1)}%</p>
      <p>Research cap ${derived.researchCapacity} · Market +${derived.marketEfficiencyPct.toFixed(1)}%</p>
      <p>Militia production modifier x${militiaMultiplier.toFixed(2)}</p>`;
    return panel;
  }

  private createTopQueueModule() {
    const block = document.createElement('section');
    block.className = 'city-stitch__top-queue';
    block.innerHTML = `<p class="city-stitch__queue-title">Runtime queues</p>`;

    const builds = this.state.economy.queue.slice().sort((a, b) => a.endsAtMs - b.endsAtMs);
    if (builds.length === 0) {
      block.append(this.createQueueLine(`Build 0/${QUEUE_CAP} · idle`));
      block.append(this.createQueueLine(`Train ${this.state.economy.trainingQueue.length} · Research ${this.state.economy.completedResearch.length} done`));
      block.append(this.createQueueLine(`Intel ${this.state.economy.intelProjects.length} · Missions ${this.state.economy.espionageMissions.length}`));
      return block;
    }

    const current = builds[0];
    const buildingName = getBuildingConfig(current.buildingId).name;
    block.append(
      this.createQueueRow({
        label: `${buildingName} → LVL ${current.targetLevel}`,
        meta: formatDuration(Math.max(0, current.endsAtMs - Date.now())),
        progressPct: progressFromTimes(current.startedAtMs, current.endsAtMs, Date.now()),
        tone: 'cyan',
      }),
      this.createQueueLine(`Build ${builds.length}/${QUEUE_CAP} · Train ${this.state.economy.trainingQueue.length}`),
      this.createQueueLine(`Intel ${this.state.economy.intelProjects.length} · Spy missions ${this.state.economy.espionageMissions.length}`),
    );
    return block;
  }

  private getHudAlert() {
    const pop = getPopulationSnapshot(this.state.economy);
    if (this.state.economy.queue.length >= QUEUE_CAP) return 'Build queue full';
    if (pop.free <= 0) return 'Population cap reached';
    return 'Nominal';
  }

  private getSectionStatusBadge(section: LocalCitySection) {
    if (section === 'market') return 'Partial';
    if (section === 'research') return 'Instant';
    return 'Runtime';
  }

  private getBuildingRequirementLines(buildingId: EconomyBuildingId) {
    const config = getBuildingConfig(buildingId);
    const rows = [`HQ ${getBuildingLevel(this.state.economy, 'hq')}/${config.unlockAtHq}`];
    (config.prerequisites ?? []).forEach((prereq) => {
      rows.push(`${prereq.buildingId} ${getBuildingLevel(this.state.economy, prereq.buildingId)}/${prereq.minLevel}`);
    });
    return rows;
  }

  private createOperationsModule() {
    const ops = document.createElement('div');
    ops.className = 'city-stitch__queue';
    ops.innerHTML = `<p class="city-stitch__queue-title">Operations</p>
      <p class="city-stitch__queue-line">Training: ${this.state.economy.trainingQueue.length}</p>
      <p class="city-stitch__queue-line">Research: instant (${this.state.economy.completedResearch.length} completed)</p>
      <p class="city-stitch__queue-line">Intel: ${this.state.economy.intelProjects.length}</p>
      <p class="city-stitch__queue-line">Militia: ${isMilitiaActive(this.state.economy) ? `ACTIVE (${this.state.economy.militia.currentMilitia})` : 'Inactive'}</p>`;
    return ops;
  }

  private makeModeButton(label: string, mode: 'galaxy2d' | 'planet3d' | 'city3d', active: boolean) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `city-stitch__top-btn${active ? ' is-active' : ''}`;
    const glyph = document.createElement('span');
    glyph.className = 'city-stitch__top-btn-glyph';
    glyph.setAttribute('aria-hidden', 'true');
    glyph.innerHTML = `<img src="${modeToIcon(mode)}" alt="" />`;
    button.append(glyph);
    button.setAttribute('aria-label', `Open ${label} view`);
    button.title = label;
    button.setAttribute('data-tooltip', label);
    button.disabled = active;
    button.addEventListener('click', () => this.context.onRequestMode(mode));
    return button;
  }

  private createNavIcon(icon: string) {
    const span = document.createElement('span');
    span.className = 'city-stitch__nav-icon';
    span.setAttribute('aria-hidden', 'true');
    span.innerHTML = `<img src="${iconToAsset(icon)}" alt="" />`;
    return span;
  }

  private makeActionButton(label: string, disabled: boolean, onClick: () => void) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'city-stitch__line-btn';
    button.textContent = label;
    button.disabled = disabled;
    button.addEventListener('click', onClick);
    return button;
  }

  private createQueueLine(text: string) {
    const row = document.createElement('p');
    row.className = 'city-stitch__queue-line';
    row.textContent = text;
    return row;
  }

  private createQueueRow(input: { label: string; meta: string; progressPct: number; tone: 'cyan' | 'ok' | 'warn' | 'brass' }) {
    const row = document.createElement('article');
    row.className = `city-stitch__queue-row city-stitch__queue-row--${input.tone}`;
    row.innerHTML = `<div class="city-stitch__queue-row-top"><p>${input.label}</p><p class="city-stitch__metric">${input.meta}</p></div>
      <div class="city-stitch__queue-progress"><span style="width:${Math.max(0, Math.min(100, input.progressPct)).toFixed(1)}%"></span></div>`;
    return row;
  }

  private getSectionSubLabel(section: LocalCitySection) {
    if (section === 'command') return `${ALL_BUILDINGS.filter((id) => getBuildingLevel(this.state.economy, id) > 0).length} online`;
    if (section === 'economy') return `${ECONOMY_BUILDINGS.filter((id) => getBuildingLevel(this.state.economy, id) > 0).length} nodes`;
    if (section === 'military') return `${this.state.economy.trainingQueue.length} active`;
    if (section === 'defense') return `${DEFENSE_BUILDINGS.filter((id) => getBuildingLevel(this.state.economy, id) > 0).length} fortified`;
    if (section === 'research') return `${this.state.economy.completedResearch.length} completed`;
    if (section === 'intelligence') return `${this.state.economy.intelProjects.length} ops`;
    if (section === 'governance') return this.state.economy.activePolicy ? 'policy active' : 'policy idle';
    return `+${getCityDerivedStats(this.state.economy).marketEfficiencyPct.toFixed(0)}%`;
  }

  private getBuildingEffectText(buildingId: EconomyBuildingId, currentLevel: number) {
    const building = getBuildingConfig(buildingId);
    const row = currentLevel > 0 ? building.levels[currentLevel - 1] : null;
    const effect = row?.effect ?? {};

    if (effect.orePerHour) return `+${effect.orePerHour} Ore/h`;
    if (effect.stonePerHour) return `+${effect.stonePerHour} Stone/h`;
    if (effect.ironPerHour) return `+${effect.ironPerHour} Iron/h`;
    if (effect.storageCap) return `Storage cap O:${effect.storageCap.ore} S:${effect.storageCap.stone} I:${effect.storageCap.iron}`;
    if (effect.populationCapBonus) return `Population +${effect.populationCapBonus}`;
    if (
      effect.cityDefensePct ||
      effect.groundWallDefensePct ||
      effect.groundWallBaseDefense ||
      effect.airWallDefensePct ||
      effect.airWallBaseDefense ||
      effect.damageMitigationPct ||
      effect.antiAirDefensePct
    ) {
      return `Defense +${effect.cityDefensePct ?? 0}% / Ground wall +${effect.groundWallDefensePct ?? 0}% (+${effect.groundWallBaseDefense ?? 0}) / Air wall +${effect.airWallDefensePct ?? 0}% (+${effect.airWallBaseDefense ?? 0}) / Anti-air +${effect.antiAirDefensePct ?? 0}% / Mitigation +${effect.damageMitigationPct ?? 0}%`;
    }
    if (effect.researchCapacity) return `Research capacity +${effect.researchCapacity}`;
    if (effect.marketEfficiencyPct) return `Market efficiency +${effect.marketEfficiencyPct}%`;
    if (effect.detectionPct || effect.counterIntelPct) return `Detection +${effect.detectionPct ?? 0}% / Counter-intel +${effect.counterIntelPct ?? 0}%`;
    if (effect.trainingSpeedPct) return `Training speed +${effect.trainingSpeedPct}%`;
    if (effect.groundAttackPct || effect.groundDefensePct || effect.airAttackPct || effect.airDefensePct) {
      return `Ground ATK +${effect.groundAttackPct ?? 0}% / Ground DEF +${effect.groundDefensePct ?? 0}% / Air ATK +${effect.airAttackPct ?? 0}% / Air DEF +${effect.airDefensePct ?? 0}%`;
    }
    return 'Local branch unlock and progression node';
  }

  private refreshFromPersistence() {
    const snapshot = loadCityEconomyState(this.persistenceContext, Date.now());
    this.state.economy = snapshot.economy;
  }
}

function getCityState(planet: SelectedPlanetRef, archetype: PlanetArchetype, context: CityPersistenceContext): CityState {
  const snapshot = loadCityEconomyState(context, Date.now());
  return {
    planetId: planet.id,
    owner: snapshot.ownerId,
    archetype,
    economy: snapshot.economy,
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
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (hours > 0) {
    const m = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${m.toString().padStart(2, '0')}m`;
  }
  if (minutes <= 0) return `${remainder}s`;
  return `${minutes}m ${remainder.toString().padStart(2, '0')}s`;
}

function progressFromTimes(startedAtMs: number, endsAtMs: number, nowMs: number) {
  const duration = Math.max(1, endsAtMs - startedAtMs);
  const elapsed = Math.max(0, nowMs - startedAtMs);
  return Math.max(0, Math.min(100, (elapsed / duration) * 100));
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

function iconToAsset(icon: string) {
  if (icon === 'home') return '/assets/cg_city_nav_command_18.svg';
  if (icon === 'payments') return '/assets/cg_city_nav_economy_18.svg';
  if (icon === 'military_tech') return '/assets/cg_city_nav_military_18.svg';
  if (icon === 'shield') return '/assets/cg_city_nav_defense_18.svg';
  if (icon === 'science') return '/assets/cg_city_nav_research_18.svg';
  if (icon === 'visibility') return '/assets/cg_city_nav_intelligence_18.svg';
  if (icon === 'account_balance') return '/assets/cg_city_nav_governance_18.svg';
  if (icon === 'currency_exchange') return '/assets/cg_city_nav_market_18.svg';
  return '/assets/cg_token_slot_placeholder_64.svg';
}

function modeToIcon(mode: 'galaxy2d' | 'planet3d' | 'city3d') {
  if (mode === 'galaxy2d') return '/assets/cg_hud_mode_galaxy_20.svg';
  if (mode === 'planet3d') return '/assets/cg_hud_mode_planet_20.svg';
  return '/assets/cg_hud_mode_city_20.svg';
}

function formatResearchEffect(effect: { [key: string]: number | undefined }) {
  const lines = Object.entries(effect)
    .filter(([, value]) => typeof value === 'number' && value !== 0)
    .map(([key, value]) => `${key} ${value && value > 0 ? '+' : ''}${value}%`);
  return lines.length > 0 ? lines.join(' · ') : 'No direct numeric modifier in runtime';
}
