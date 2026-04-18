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
  getProductionPerHour,
  getStorageCaps,
  isBuildingUnlocked,
  type CityEconomyState,
} from '@/game/city/economy/cityEconomySystem';
import {
  loadCityEconomyState,
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
  private bottomBar: HTMLElement | null = null;

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
    root.append(this.createTopBar(), this.createSideNav(), this.createMainCanvas(), this.createDetailPanel(), this.createBottomBar());
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

  private createBottomBar() {
    const bar = document.createElement('footer');
    bar.className = 'city-stitch__bottom';
    this.bottomBar = bar;
    return bar;
  }

  private renderAll() {
    this.refreshFromPersistence();
    this.renderTopBar();
    this.renderSideNav();
    this.renderMainCanvas();
    this.renderDetailPanel();
    this.renderBottomBar();
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

    const left = document.createElement('div');
    left.className = 'city-stitch__brand';
    left.innerHTML = '<span class="city-stitch__logo">COINAGE</span>';

    const resources = document.createElement('div');
    resources.className = 'city-stitch__resource-strip';
    (Object.keys(RESOURCE_LABELS) as EconomyResource[]).forEach((resource) => {
      const item = document.createElement('article');
      item.className = 'city-stitch__resource';
      item.innerHTML = `<p class="city-stitch__resource-name">${RESOURCE_LABELS[resource]}</p>
      <p class="city-stitch__resource-amount">${Math.floor(this.state.economy.resources[resource]).toLocaleString()}</p>
      <p class="city-stitch__resource-rate">+${Math.round(production[resource]).toLocaleString()}/h</p>`;
      resources.append(item);
    });

    const right = document.createElement('div');
    right.className = 'city-stitch__meta';
    right.innerHTML = `<p class="city-stitch__meta-row">POP: ${pop.used.toLocaleString()} / ${pop.cap.toLocaleString()}</p>
      <p class="city-stitch__meta-row">STORAGE: ${storagePct.toFixed(1)}%</p>
      <div class="city-stitch__storage-bar"><span style="width:${storagePct.toFixed(1)}%"></span></div>`;

    const controls = document.createElement('div');
    controls.className = 'city-stitch__top-controls';
    controls.append(
      this.makeModeButton('Galaxy', 'galaxy2d', false),
      this.makeModeButton('Planet', 'planet3d', false),
      this.makeModeButton('City', 'city3d', true),
    );

    this.topBar.append(left, resources, right, controls);
  }

  private renderSideNav() {
    if (!this.sideNav) return;

    this.sideNav.innerHTML = '<div class="city-stitch__sector">SECTOR 07</div>';
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
      button.append(icon, label);
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
    page.append(this.createViewHeader('City Command', 'Core infrastructure, tactical buildings, and direct upgrade access.'));

    const sectionRow = document.createElement('section');
    sectionRow.className = 'city-stitch__command-zones';

    sectionRow.append(this.createListBlock('Core infrastructure', ['hq', 'warehouse', 'housing_complex']));
    sectionRow.append(this.createListBlock('Extraction & processing', ['mine', 'quarry', 'refinery']));
    sectionRow.append(this.createListBlock('Tactical operations', ['barracks', 'space_dock', 'armament_factory', 'watch_tower', 'defensive_wall']));

    const cards = document.createElement('section');
    cards.className = 'city-stitch__cards city-stitch__cards--command';
    ALL_BUILDINGS.forEach((buildingId) => cards.append(this.createBuildingCard(buildingId)));

    page.append(sectionRow, cards);
    return page;
  }

  private renderEconomyPage() {
    const page = document.createElement('section');
    page.append(this.createViewHeader('Economic Core', 'Production throughput and extraction monitoring.'));

    const primary = document.createElement('section');
    primary.className = 'city-stitch__tile-grid';
    ECONOMY_BUILDINGS.forEach((buildingId) => primary.append(this.createProductionTile(buildingId)));

    const split = document.createElement('section');
    split.className = 'city-stitch__ops-grid city-stitch__ops-grid--double';

    const throughput = document.createElement('section');
    throughput.className = 'city-stitch__ops-list';
    throughput.innerHTML = '<h3>Throughput telemetry</h3>';
    const production = getProductionPerHour(this.state.economy);
    const storage = getStorageCaps(this.state.economy);
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

    split.append(throughput, intel);
    page.append(primary, split);
    return page;
  }

  private renderMilitaryPage() {
    const page = document.createElement('section');
    page.append(this.createViewHeader('Military Sector', 'Unit training and active force projection queue.'));

    const train = document.createElement('section');
    train.className = 'city-stitch__ops-list';
    train.innerHTML = '<h3>Training roster</h3>';

    (Object.keys(CITY_ECONOMY_CONFIG.troops) as TroopId[]).forEach((troopId) => {
      const troop = CITY_ECONOMY_CONFIG.troops[troopId];
      const guard = canStartTroopTraining(this.state.economy, troopId, 1);
      const row = document.createElement('div');
      row.className = 'city-stitch__ops-row';
      row.innerHTML = `<p>${troop.name}</p><p>${guard.ok ? `${troop.trainingSeconds}s` : guard.reason ?? 'Unavailable'}</p><p>${troop.category === 'air' ? 'Air' : 'Ground'}</p>`;
      row.append(this.makeActionButton(guard.ok ? 'Train x1' : 'Unavailable', !guard.ok, () => {
        const result = startCityTroopTraining(this.persistenceContext, troopId, 1, Date.now());
        this.state.economy = result.state.economy;
        this.renderAll();
      }));
      train.append(row);
    });

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

    page.append(train, feed, support);
    return page;
  }

  private renderDefensePage() {
    const page = document.createElement('section');
    const derived = getCityDerivedStats(this.state.economy);
    page.append(this.createViewHeader('Defensive Grid', 'Defense hardening and mitigation controls.'));

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
    hardening.innerHTML = `<h3>Hardening overview</h3>
      <div class="city-stitch__ops-row"><p>Wall integrity</p><p>${Math.min(100, 40 + derived.cityDefensePct).toFixed(1)}%</p><p>Stable</p></div>
      <div class="city-stitch__ops-row"><p>Reactive plating</p><p>+${derived.damageMitigationPct.toFixed(1)}%</p><p>Active</p></div>
      <div class="city-stitch__ops-row"><p>Breach risk</p><p>${Math.max(2, 30 - derived.siegeResistancePct * 0.2).toFixed(1)}%</p><p>Monitored</p></div>`;

    page.append(metrics, hardening, structures);
    return page;
  }

  private renderResearchPage() {
    const page = document.createElement('section');
    page.append(this.createViewHeader('Research Lab', 'Research nodes, queue, and progression gating.'));

    const list = document.createElement('section');
    list.className = 'city-stitch__ops-list';
    list.innerHTML = '<h3>Research nodes</h3>';

    (Object.keys(CITY_ECONOMY_CONFIG.research) as ResearchId[]).forEach((researchId) => {
      const cfg = CITY_ECONOMY_CONFIG.research[researchId];
      const guard = canStartResearch(this.state.economy, researchId);
      const row = document.createElement('div');
      row.className = 'city-stitch__ops-row';
      row.innerHTML = `<p>${cfg.name}</p><p>${guard.ok ? `${cfg.durationSeconds}s` : guard.reason ?? 'Unavailable'}</p><p>${this.state.economy.completedResearch.includes(researchId) ? 'Completed' : 'Available'}</p>`;
      row.append(this.makeActionButton(guard.ok ? 'Start' : 'Unavailable', !guard.ok, () => {
        const result = startCityResearch(this.persistenceContext, researchId, Date.now());
        this.state.economy = result.state.economy;
        this.renderAll();
      }));
      list.append(row);
    });

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

    const list = document.createElement('section');
    list.className = 'city-stitch__ops-list';
    list.innerHTML = `<h3>Readiness ${this.state.economy.intelReadiness.toFixed(1)}%</h3>`;

    (['sweep', 'network', 'cipher'] as const).forEach((projectType) => {
      const row = document.createElement('div');
      row.className = 'city-stitch__ops-row';
      row.innerHTML = `<p>${projectType.toUpperCase()}</p><p>${guard.ok ? 'Ready' : guard.reason ?? 'Unavailable'}</p><p>Ops board</p>`;
      row.append(this.makeActionButton(guard.ok ? 'Start' : 'Unavailable', !guard.ok, () => {
        const result = startCityIntelProject(this.persistenceContext, projectType, Date.now());
        this.state.economy = result.state.economy;
        this.renderAll();
      }));
      list.append(row);
    });

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

    const list = document.createElement('section');
    list.className = 'city-stitch__ops-list';
    list.innerHTML = '<h3>Available directives</h3>';

    (Object.keys(CITY_ECONOMY_CONFIG.policies) as LocalPolicyId[]).forEach((policyId) => {
      const policy = CITY_ECONOMY_CONFIG.policies[policyId];
      const guard = canSetPolicy(this.state.economy, policyId);
      const row = document.createElement('div');
      row.className = 'city-stitch__ops-row';
      row.innerHTML = `<p>${policy.name}</p><p>${guard.ok ? 'Ready' : guard.reason ?? 'Unavailable'}</p><p>${this.state.economy.activePolicy === policyId ? 'Active' : 'Dormant'}</p>`;
      row.append(this.makeActionButton(guard.ok ? 'Apply' : 'Unavailable', !guard.ok, () => {
        const result = setCityPolicy(this.persistenceContext, policyId, Date.now());
        this.state.economy = result.state.economy;
        this.renderAll();
      }));
      list.append(row);
    });

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
      <p>Space dock level: ${getBuildingLevel(this.state.economy, 'space_dock')}</p>`;
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
    panel.innerHTML = `<h3>City effects</h3>
      <p>Defense +${derived.cityDefensePct.toFixed(1)}% · Mitigation +${derived.damageMitigationPct.toFixed(1)}%</p>
      <p>Training +${derived.trainingSpeedPct.toFixed(1)}% · Troop power +${derived.troopCombatPowerPct.toFixed(1)}%</p>
      <p>Detection +${derived.detectionPct.toFixed(1)}% · Counter-intel +${derived.counterIntelPct.toFixed(1)}%</p>
      <p>Research cap ${derived.researchCapacity} · Market +${derived.marketEfficiencyPct.toFixed(1)}%</p>`;
    return panel;
  }

  private renderBottomBar() {
    if (!this.bottomBar) return;
    this.bottomBar.innerHTML = '';

    const queue = document.createElement('div');
    queue.className = 'city-stitch__queue';
    queue.innerHTML = '<p class="city-stitch__queue-title">Construction queue</p>';
    const builds = this.state.economy.queue.slice().sort((a, b) => a.endsAtMs - b.endsAtMs);
    if (builds.length === 0) queue.append(this.createQueueLine('No active build order'));
    builds.forEach((entry) => {
      const buildingName = getBuildingConfig(entry.buildingId).name;
      queue.append(this.createQueueLine(`${buildingName} → LVL ${entry.targetLevel} · ${formatDuration(Math.max(0, entry.endsAtMs - Date.now()))}`));
    });

    const ops = document.createElement('div');
    ops.className = 'city-stitch__queue';
    ops.innerHTML = `<p class="city-stitch__queue-title">Operations</p>
      <p class="city-stitch__queue-line">Training: ${this.state.economy.trainingQueue.length}</p>
      <p class="city-stitch__queue-line">Research: ${this.state.economy.researchQueue.length}</p>
      <p class="city-stitch__queue-line">Intel: ${this.state.economy.intelProjects.length}</p>`;

    const status = document.createElement('div');
    status.className = 'city-stitch__queue';
    status.innerHTML = `<p class="city-stitch__queue-title">Runtime status</p>
      <p class="city-stitch__queue-line">Queue: ${this.state.economy.queue.length}/${QUEUE_CAP}</p>
      <p class="city-stitch__queue-line">MVP MICRO only · premium/wallet/special disabled</p>`;

    this.bottomBar.append(queue, ops, status);
  }

  private makeModeButton(label: string, mode: 'galaxy2d' | 'planet3d' | 'city3d', active: boolean) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `city-stitch__top-btn${active ? ' is-active' : ''}`;
    button.textContent = label;
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
