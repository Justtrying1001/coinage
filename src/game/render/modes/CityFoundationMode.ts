import {
  canSetPolicy,
  canStartConstruction,
  canStartIntelProject,
  canStartResearch,
  canStartTroopTraining,
  getBuildingConfig,
  getBuildingLevel,
  getCityDerivedStats,
  getConstructionQueueSlots,
  getEconomyBuildingOrder,
  getPopulationSnapshot,
  getMilitiaMaxSize,
  getMilitiaFarmEquivalentLevel,
  getMilitiaProductionMultiplier,
  isMilitiaActive,
  getProductionPerHour,
  getStorageCaps,
  isBuildingUnlocked,
  type CityEconomyState,
} from '@/game/city/economy/cityEconomySystem';
import {
  loadCityEconomyState,
  activateCityMilitia,
  setCityPolicy,
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

interface CityState {
  planetId: string;
  owner: string;
  archetype: PlanetArchetype;
  economy: CityEconomyState;
}

type LocalCitySection = 'command' | 'economy' | 'military' | 'defense' | 'research' | 'intelligence' | 'governance' | 'market';

const QUEUE_CAP = getConstructionQueueSlots();
const CLASSIFIED_BRANCHES = new Set<LocalCitySection>(['governance', 'intelligence', 'market', 'research']);
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
const RESOURCE_GLYPHS: Record<EconomyResource, string> = {
  ore: 'OR',
  stone: 'ST',
  iron: 'IR',
};

const BUILDING_ASSETS: Partial<Record<EconomyBuildingId, string>> = {
  hq: '/assets/HQ.png',
  mine: '/assets/stone.png',
  quarry: '/assets/stone.png',
  refinery: '/assets/refeniry.png',
  warehouse: '/assets/warehouse.png',
  housing_complex: '/assets/housing.png',
  barracks: '/assets/barrack.png',
  space_dock: '/assets/spacedock.png',
  defensive_wall: '/assets/walls.png',
  watch_tower: '/assets/watchtower.png',
  intelligence_center: '/assets/spycenter.png',
  research_lab: '/assets/researchlabs.png',
  market: '/assets/market.png',
  council_chamber: '/assets/councill.png',
};

const ALL_BUILDINGS = getEconomyBuildingOrder();
const COMMAND_CORE_BUILDINGS: EconomyBuildingId[] = ['hq', 'housing_complex', 'research_lab'];
const COMMAND_EXTRACTION_BUILDINGS: EconomyBuildingId[] = ['mine', 'quarry', 'refinery', 'warehouse'];
const COMMAND_TACTICAL_BUILDINGS: EconomyBuildingId[] = ['barracks', 'space_dock', 'armament_factory', 'watch_tower', 'defensive_wall'];
const COMMAND_SUPPORT_BUILDINGS: EconomyBuildingId[] = ['intelligence_center', 'market', 'council_chamber'];
const ECONOMY_BUILDINGS: EconomyBuildingId[] = ['mine', 'quarry', 'refinery', 'warehouse', 'housing_complex'];
const DEFENSE_BUILDINGS: EconomyBuildingId[] = ['defensive_wall', 'watch_tower'];
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
    this.renderClassifiedOverlays();
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
    leftCluster.innerHTML = `<p class="city-stitch__overline">Sector command</p>
      <p class="city-stitch__logo">COINAGE</p>
      <p class="city-stitch__hud-muted">Sector 07 · ${activeSectionLabel}</p>`;

    const contextAnchor = document.createElement('section');
    contextAnchor.className = 'city-stitch__hud-segment city-stitch__hud-segment--context';
    contextAnchor.innerHTML = `<p class="city-stitch__overline">Local context</p>
      <p class="city-stitch__hud-context-title">${activeSectionLabel} branch</p>
      <p class="city-stitch__hud-muted">${getBuildingConfig(this.selectedBuildingId).name} focus · Queue ${this.state.economy.queue.length}/${QUEUE_CAP}</p>`;

    const resources = document.createElement('section');
    resources.className = 'city-stitch__hud-segment city-stitch__hud-segment--resources';
    (Object.keys(RESOURCE_LABELS) as EconomyResource[]).forEach((resource) => {
      const item = document.createElement('article');
      item.className = 'city-stitch__resource city-stitch__resource--compact';
      const resourcePct = Math.max(0, Math.min(100, (this.state.economy.resources[resource] / Math.max(1, storage[resource])) * 100));
      item.innerHTML = `<p class="city-stitch__resource-name">${RESOURCE_LABELS[resource]}</p>
      <p class="city-stitch__resource-icon">${RESOURCE_GLYPHS[resource]}</p>
      <p class="city-stitch__resource-amount city-stitch__metric">${Math.floor(this.state.economy.resources[resource]).toLocaleString()}</p>
      <p class="city-stitch__resource-rate city-stitch__metric">+${Math.round(production[resource]).toLocaleString()}/h</p>
      <div class="city-stitch__resource-fill"><span style="width:${resourcePct.toFixed(1)}%"></span></div>`;
      resources.append(item);
    });
    const meta = document.createElement('article');
    meta.className = 'city-stitch__resource city-stitch__resource--compact city-stitch__resource--meta';
    meta.innerHTML = `<p class="city-stitch__resource-name">Population</p>
      <p class="city-stitch__resource-amount city-stitch__metric">${pop.used.toLocaleString()} / ${pop.cap.toLocaleString()}</p>
      <p class="city-stitch__resource-rate city-stitch__metric">Storage ${storagePct.toFixed(1)}%</p>`;
    resources.append(meta);

    const queueModule = document.createElement('section');
    queueModule.className = 'city-stitch__hud-segment city-stitch__hud-segment--queue';
    queueModule.append(this.createTopQueueModule());

    frame.append(switchCluster, leftCluster, contextAnchor, resources, queueModule);
    this.topBar.append(frame);
  }

  private renderSideNav() {
    if (!this.sideNav) return;

    this.sideNav.innerHTML = '<div class="city-stitch__sector">SECTOR 07</div><div class="city-stitch__sector-sub">Local branches</div>';
    const nav = document.createElement('nav');
    nav.className = 'city-stitch__nav';

    LOCAL_SECTIONS.forEach((section) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'city-stitch__nav-btn';
      if (this.activeSection === section.id) button.classList.add('is-active');
      button.setAttribute('aria-label', section.label);
      const icon = this.createNavIcon(section.icon);
      const label = document.createElement('span');
      label.className = 'city-stitch__nav-label';
      label.textContent = section.label;
      const subLabel = document.createElement('span');
      subLabel.className = 'city-stitch__nav-sub';
      subLabel.textContent = this.getSectionSubLabel(section.id);
      button.append(icon, label, subLabel);
      if (CLASSIFIED_BRANCHES.has(section.id)) {
        const lock = document.createElement('span');
        lock.className = 'city-stitch__nav-lock';
        lock.textContent = 'Classified';
        button.append(lock);
      }
      button.addEventListener('click', () => {
        this.activeSection = section.id;
        this.renderMainCanvas();
        this.renderDetailPanel();
        this.renderClassifiedOverlays();
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
    page.append(this.createViewHeader('City Command', 'Core infrastructure, tactical buildings, and direct upgrade access.'));
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
    page.append(this.createViewHeader('Economic Core', 'Production throughput and extraction monitoring.'));
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
            Math.max(
              (this.state.economy.resources.ore / Math.max(1, storage.ore)) * 100,
              (this.state.economy.resources.stone / Math.max(1, storage.stone)) * 100,
              (this.state.economy.resources.iron / Math.max(1, storage.iron)) * 100,
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
      <p>${Math.round((this.state.economy.resources[resource] / Math.max(1, storage[resource])) * 100)}% cap</p>`;
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
    page.append(this.createViewHeader('Military Sector', 'Unit training and active force projection queue.'));
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
      const row = document.createElement('div');
      row.className = 'city-stitch__ops-row';
      row.innerHTML = `<p>${troop.name}</p><p>${guard.ok ? `${troop.trainingSeconds}s` : guard.reason ?? 'Unavailable'}</p><p>${troop.category === 'naval' ? 'Naval' : 'Ground'}</p>`;
      row.append(this.makeActionButton(guard.ok ? 'Train x1' : 'Unavailable', !guard.ok, () => {
        const result = startCityTroopTraining(this.persistenceContext, troopId, 1, Date.now());
        this.state.economy = result.state.economy;
        this.renderAll();
      }));
      rosterGrid.append(card);
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
    page.append(this.createViewHeader('Defensive Grid', 'Defense hardening and mitigation controls.'));
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
    page.append(this.createViewHeader('Research Lab', 'Research nodes, queue, and progression gating.'));
    page.append(
      this.createBranchKpis([
        { label: 'Completed', value: `${this.state.economy.completedResearch.length}` },
        { label: 'Queue', value: `${this.state.economy.researchQueue.length}/1` },
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
      node.className = `city-stitch__node-card${completed ? ' is-complete' : ''}`;
      node.innerHTML = `<p class="city-stitch__unit-head">${completed ? 'Complete' : guard.ok ? 'Ready' : 'Locked'}</p>
        <h4>${cfg.name}</h4>
        <p class="city-stitch__unit-meta">Duration ${cfg.durationSeconds}s</p>
        <p class="city-stitch__unit-meta">Cost O${cfg.cost.ore} S${cfg.cost.stone} I${cfg.cost.iron}</p>`;
      node.append(this.makeActionButton(guard.ok ? 'Start' : 'Unavailable', !guard.ok, () => {
        const result = startCityResearch(this.persistenceContext, researchId, Date.now());
        this.state.economy = result.state.economy;
        this.renderAll();
      }));
      nodeGrid.append(node);
    });
    list.append(nodeGrid);

    const queue = document.createElement('section');
    queue.className = 'city-stitch__ops-list';
    queue.innerHTML = `<h3>Queue ${this.state.economy.researchQueue.length}/1</h3>`;
    if (this.state.economy.researchQueue.length === 0) {
      queue.append(this.createQueueLine('No active research node'));
    } else {
      this.state.economy.researchQueue.forEach((entry) => {
        const researchName = CITY_ECONOMY_CONFIG.research[entry.researchId].name;
        queue.append(this.createQueueLine(`${researchName} · ${formatDuration(Math.max(0, entry.endsAtMs - Date.now()))}`));
      });
    }

    page.append(list, queue);
    return page;
  }

  private renderIntelligencePage() {
    const page = document.createElement('section');
    const guard = canStartIntelProject(this.state.economy);
    page.append(this.createViewHeader('Intel Ops Board', 'Manage recon and counter-intelligence projects.'));
    page.append(
      this.createBranchKpis([
        { label: 'Readiness', value: `${this.state.economy.intelReadiness.toFixed(1)}%` },
        { label: 'Active projects', value: `${this.state.economy.intelProjects.length}` },
        { label: 'Center level', value: `LVL ${getBuildingLevel(this.state.economy, 'intelligence_center')}` },
      ]),
    );

    const list = document.createElement('section');
    list.className = 'city-stitch__ops-list';
    list.innerHTML = `<h3>Readiness ${this.state.economy.intelReadiness.toFixed(1)}%</h3>`;
    const board = document.createElement('div');
    board.className = 'city-stitch__intel-grid';

    (['sweep', 'network', 'cipher'] as const).forEach((projectType) => {
      const card = document.createElement('article');
      card.className = 'city-stitch__intel-card';
      card.innerHTML = `<p class="city-stitch__unit-head">${projectType.toUpperCase()}</p>
        <h4>${INTEL_PROJECT_LABELS[projectType]}</h4>
        <p class="city-stitch__unit-meta">${guard.ok ? 'Ready' : guard.reason ?? 'Unavailable'}</p>`;
      card.append(this.makeActionButton(guard.ok ? 'Start' : 'Unavailable', !guard.ok, () => {
        const result = startCityIntelProject(this.persistenceContext, projectType, Date.now());
        this.state.economy = result.state.economy;
        this.renderAll();
      }));
      board.append(card);
    });
    list.append(board);

    const active = document.createElement('section');
    active.className = 'city-stitch__ops-list';
    active.innerHTML = '<h3>Active queue</h3>';
    if (this.state.economy.intelProjects.length === 0) {
      active.append(this.createQueueLine('No active intelligence project'));
    } else {
      this.state.economy.intelProjects.forEach((entry) => {
        const projectLabel = INTEL_PROJECT_LABELS[entry.projectType];
        active.append(this.createQueueLine(`${projectLabel} · +${entry.readinessGain.toFixed(1)} readiness · ${formatDuration(Math.max(0, entry.endsAtMs - Date.now()))}`));
      });
    }

    page.append(list, active);
    return page;
  }

  private renderGovernancePage() {
    const page = document.createElement('section');
    page.append(this.createViewHeader('Legislative Hub', 'Apply directives and monitor policy impact.'));
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
      card.className = `city-stitch__directive-card${this.state.economy.activePolicy === policyId ? ' is-active' : ''}`;
      card.innerHTML = `<p class="city-stitch__unit-head">${this.state.economy.activePolicy === policyId ? 'Active' : 'Directive'}</p>
        <h4>${policy.name}</h4>
        <p class="city-stitch__unit-meta">${policy.description}</p>`;
      card.append(this.makeActionButton(guard.ok ? 'Apply' : 'Unavailable', !guard.ok, () => {
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
    page.append(this.createViewHeader('Exchange Hub', 'Resource exchange controls and market efficiency.'));
    page.append(
      this.createBranchKpis([
        { label: 'Efficiency', value: `+${derived.marketEfficiencyPct.toFixed(1)}%` },
        { label: 'Market lvl', value: `LVL ${getBuildingLevel(this.state.economy, 'market')}` },
        { label: 'Storage hub', value: `LVL ${getBuildingLevel(this.state.economy, 'warehouse')}` },
      ]),
    );

    const marketPanel = document.createElement('section');
    marketPanel.className = 'city-stitch__ops-list';
    marketPanel.innerHTML = `<h3>Exchange operations</h3>
      <div class="city-stitch__ops-row"><p>Source resource</p><p>Select in UI</p><p>Live</p></div>
      <div class="city-stitch__ops-row"><p>Target resource</p><p>Select in UI</p><p>Live</p></div>
      <div class="city-stitch__ops-row"><p>Estimated efficiency</p><p>+${derived.marketEfficiencyPct.toFixed(1)}%</p><p>Computed</p></div>
      <div class="city-stitch__ops-row"><p>Execution</p><p>Not implemented in runtime</p><p>Unavailable</p></div>`;

    const disabled = document.createElement('div');
    disabled.className = 'city-stitch__ops-row';
    disabled.innerHTML = '<p>Source → Target</p><p>Unavailable</p><p>Authorization blocked</p>';
    disabled.append(this.makeActionButton('Confirm trade (Unavailable)', true, () => {}));
    marketPanel.append(disabled);

    const presets = document.createElement('section');
    presets.className = 'city-stitch__ops-list';
    presets.innerHTML = `<h3>Quick presets</h3>
      <div class="city-stitch__ops-row"><p>ORE → STONE</p><p>Batch A</p><p>Unavailable</p></div>
      <div class="city-stitch__ops-row"><p>STONE → IRON</p><p>Batch B</p><p>Unavailable</p></div>
      <div class="city-stitch__ops-row"><p>IRON → ORE</p><p>Batch C</p><p>Unavailable</p></div>`;

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
      <p>${this.state.planetId.toUpperCase()} • ${this.state.archetype.toUpperCase()} • OWNER ${this.state.owner}</p>
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
        <p>${next ? `O ${next.resources.ore} · S ${next.resources.stone} · I ${next.resources.iron}` : 'MAX LEVEL'}</p>
        <p>${guard.ok ? 'READY' : guard.reason ?? 'LOCKED'}</p>
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
    panel.innerHTML = `<h3>${config.name}</h3>
      <p>Current level: ${level}/${config.maxLevel}</p>
      <p>${this.getBuildingEffectText(this.selectedBuildingId, level)}</p>
      <p>${next ? `Cost O ${next.resources.ore} · S ${next.resources.stone} · I ${next.resources.iron}` : 'Max level reached'}</p>
      <p>${next ? `Build ${formatDuration(next.buildSeconds * 1000)}` : 'Build: —'}</p>`;

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
    panel.innerHTML = `<h3>Selected unit</h3>
      <p>Active batches: ${this.state.economy.trainingQueue.length}</p>
      <p>Barracks level: ${getBuildingLevel(this.state.economy, 'barracks')}</p>
      <p>Space dock level: ${getBuildingLevel(this.state.economy, 'space_dock')}</p>
      <p>Citizen militia: ${isMilitiaActive(this.state.economy) ? `${this.state.economy.militia.currentMilitia} (local defense only)` : 'inactive'}</p>`;
    return panel;
  }

  private renderResearchDetailPanel() {
    const panel = document.createElement('section');
    panel.className = 'city-stitch__detail-block';
    panel.innerHTML = `<h3>Research status</h3>
      <p>Queue: ${this.state.economy.researchQueue.length}/1</p>
      <p>Completed: ${this.state.economy.completedResearch.length}</p>
      <p>Lab level: ${getBuildingLevel(this.state.economy, 'research_lab')}</p>`;
    return panel;
  }

  private renderIntelDetailPanel() {
    const panel = document.createElement('section');
    panel.className = 'city-stitch__detail-block';
    panel.innerHTML = `<h3>Intel status</h3>
      <p>Readiness: ${this.state.economy.intelReadiness.toFixed(1)}%</p>
      <p>Active projects: ${this.state.economy.intelProjects.length}</p>
      <p>Center level: ${getBuildingLevel(this.state.economy, 'intelligence_center')}</p>`;
    return panel;
  }

  private renderGovernanceDetailPanel() {
    const panel = document.createElement('section');
    panel.className = 'city-stitch__detail-block';
    panel.innerHTML = `<h3>Governance status</h3>
      <p>Active policy: ${this.state.economy.activePolicy ?? 'none'}</p>
      <p>Council level: ${getBuildingLevel(this.state.economy, 'council_chamber')}</p>`;
    return panel;
  }

  private renderDerivedPanel() {
    const derived = getCityDerivedStats(this.state.economy);
    const panel = document.createElement('section');
    panel.className = 'city-stitch__detail-block';
    const militiaMultiplier = getMilitiaProductionMultiplier(this.state.economy);
    panel.innerHTML = `<h3>City effects</h3>
      <p>Defense +${derived.cityDefensePct.toFixed(1)}% · Mitigation +${derived.damageMitigationPct.toFixed(1)}%</p>
      <p>Training +${derived.trainingSpeedPct.toFixed(1)}% · Troop power +${derived.troopCombatPowerPct.toFixed(1)}%</p>
      <p>Detection +${derived.detectionPct.toFixed(1)}% · Counter-intel +${derived.counterIntelPct.toFixed(1)}%</p>
      <p>Research cap ${derived.researchCapacity} · Market +${derived.marketEfficiencyPct.toFixed(1)}%</p>
      <p>Militia production modifier x${militiaMultiplier.toFixed(2)}</p>`;
    return panel;
  }

  private createTopQueueModule() {
    const block = document.createElement('section');
    block.className = 'city-stitch__top-queue';
    block.innerHTML = `<p class="city-stitch__queue-title">Construction queue</p>`;

    const builds = this.state.economy.queue.slice().sort((a, b) => a.endsAtMs - b.endsAtMs);
    if (builds.length === 0) {
      block.append(this.createQueueLine(`Queue: 0/${QUEUE_CAP} · idle`));
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
      this.createQueueLine(`Queue: ${builds.length}/${QUEUE_CAP}`),
    );
    return block;
  }

  private isClassifiedBranch(section: LocalCitySection) {
    return CLASSIFIED_BRANCHES.has(section);
  }

  private renderClassifiedOverlays() {
    const isClassifiedBranch = this.isClassifiedBranch(this.activeSection);
    this.syncOverlay(this.mainCanvas, isClassifiedBranch, {
      title: 'CLASSIFIED',
      subtitle: 'ACCESS WITHHELD',
      variant: 'panel',
    });
    this.syncOverlay(this.detailPanel, isClassifiedBranch, {
      title: 'CLASSIFIED',
      subtitle: 'TACTICAL FILE SEALED',
      variant: 'chip',
    });
  }

    const ops = document.createElement('div');
    ops.className = 'city-stitch__queue';
    ops.innerHTML = `<p class="city-stitch__queue-title">Operations</p>
      <p class="city-stitch__queue-line">Training: ${this.state.economy.trainingQueue.length}</p>
      <p class="city-stitch__queue-line">Research: ${this.state.economy.researchQueue.length}</p>
      <p class="city-stitch__queue-line">Intel: ${this.state.economy.intelProjects.length}</p>
      <p class="city-stitch__queue-line">Militia: ${isMilitiaActive(this.state.economy) ? `ACTIVE (${this.state.economy.militia.currentMilitia})` : 'Inactive'}</p>`;

    if (current) return;

    const overlay = document.createElement('section');
    overlay.className = `city-stitch__classified-overlay city-stitch__classified-overlay--${content.variant}`;
    if (content.variant === 'chip') {
      overlay.innerHTML = `<div class="city-stitch__classified-chip">${content.title} · ${content.subtitle}</div>`;
    } else {
      overlay.innerHTML = `<div class="city-stitch__classified-card">
        <p class="city-stitch__classified-title">${content.title}</p>
        <p class="city-stitch__classified-subtitle">${content.subtitle}</p>
      </div>`;
    }
    target.append(overlay);
  }

  private makeModeButton(label: string, mode: 'galaxy2d' | 'planet3d' | 'city3d', active: boolean) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `city-stitch__top-btn${active ? ' is-active' : ''}`;
    button.innerHTML = `<span class="city-stitch__top-btn-glyph">${modeToGlyph(mode)}</span><span class="city-stitch__top-btn-label">${label}</span>`;
    button.setAttribute('aria-label', `Open ${label} view`);
    button.disabled = active;
    button.addEventListener('click', () => this.context.onRequestMode(mode));
    return button;
  }

  private createNavIcon(icon: string) {
    const span = document.createElement('span');
    span.className = 'city-stitch__nav-icon';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = iconToGlyph(icon);
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
    if (section === 'research') return `${this.state.economy.researchQueue.length}/1 queue`;
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
    if (effect.cityDefensePct || effect.damageMitigationPct) return `Defense +${effect.cityDefensePct ?? 0}% / Mitigation +${effect.damageMitigationPct ?? 0}%`;
    if (effect.researchCapacity) return `Research capacity +${effect.researchCapacity}`;
    if (effect.marketEfficiencyPct) return `Market efficiency +${effect.marketEfficiencyPct}%`;
    if (effect.detectionPct || effect.counterIntelPct) return `Detection +${effect.detectionPct ?? 0}% / Counter-intel +${effect.counterIntelPct ?? 0}%`;
    if (effect.trainingSpeedPct) return `Training speed +${effect.trainingSpeedPct}%`;
    if (effect.troopCombatPowerPct) return `Troop power +${effect.troopCombatPowerPct}%`;
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

function iconToGlyph(icon: string) {
  if (icon === 'home') return 'CM';
  if (icon === 'payments') return 'EC';
  if (icon === 'military_tech') return 'MI';
  if (icon === 'shield') return 'DF';
  if (icon === 'science') return 'RS';
  if (icon === 'visibility') return 'IN';
  if (icon === 'account_balance') return 'GV';
  if (icon === 'currency_exchange') return 'MK';
  return '--';
}

function modeToGlyph(mode: 'galaxy2d' | 'planet3d' | 'city3d') {
  if (mode === 'galaxy2d') return 'GX';
  if (mode === 'planet3d') return 'PL';
  return 'CT';
}
