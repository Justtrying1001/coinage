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
  BUILDING_ORDER_BY_BRANCH,
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
  citySlotTotal: number;
}

type LocalCitySection = keyof typeof BUILDING_ORDER_BY_BRANCH;

const QUEUE_CAP = getConstructionQueueSlots();
const LOCAL_SECTIONS: Array<{ id: LocalCitySection; label: string; tag: string; icon: string; accentClass: string }> = [
  { id: 'economy', label: 'Economy', tag: 'Extraction', icon: 'payments', accentClass: 'is-economy' },
  { id: 'military', label: 'Military', tag: 'Force', icon: 'military_tech', accentClass: 'is-military' },
  { id: 'defense', label: 'Defense', tag: 'Shield', icon: 'shield', accentClass: 'is-defense' },
  { id: 'research', label: 'Research', tag: 'Tech', icon: 'science', accentClass: 'is-research' },
  { id: 'intelligence', label: 'Intelligence', tag: 'Intel', icon: 'visibility', accentClass: 'is-intelligence' },
  { id: 'governance', label: 'Governance', tag: 'Policy', icon: 'account_balance', accentClass: 'is-governance' },
  { id: 'logistics', label: 'Logistics', tag: 'Trade', icon: 'local_shipping', accentClass: 'is-logistics' },
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
  watch_tower: '/assets/watchtower.png',
  defensive_wall: '/assets/walls.png',
  intelligence_center: '/assets/spycenter.png',
  research_lab: '/assets/researchlabs.png',
  market: '/assets/market.png',
  council_chamber: '/assets/councill.png',
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
  private activeSection: LocalCitySection = 'economy';
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
    this.ensureSelectedBuildingInActiveSection();
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
    const storagePct = Math.max(0, Math.min(100, Math.max(
      this.state.economy.resources.ore / Math.max(1, storage.ore),
      this.state.economy.resources.stone / Math.max(1, storage.stone),
      this.state.economy.resources.iron / Math.max(1, storage.iron),
    ) * 100));

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
    controls.append(this.makeTopControl('planet', () => this.context.onRequestMode('planet3d')));
    controls.append(this.makeTopControl('public', () => this.context.onRequestMode('galaxy2d')));

    this.topBar.append(left, resources, right, controls);
  }

  private renderSideNav() {
    if (!this.sideNav) return;
    this.sideNav.innerHTML = `<div class="city-stitch__sector">SECTOR 07</div>`;

    const nav = document.createElement('nav');
    nav.className = 'city-stitch__nav';
    LOCAL_SECTIONS.forEach((section) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `city-stitch__nav-btn ${section.accentClass}`;
      if (this.activeSection === section.id) button.classList.add('is-active');
      button.setAttribute('aria-label', section.label);
      button.innerHTML = `<span class="material-symbols-outlined">${section.icon}</span><span>${section.label}</span>`;
      button.addEventListener('click', () => {
        this.activeSection = section.id;
        this.ensureSelectedBuildingInActiveSection();
        this.renderMainCanvas();
        this.renderSideNav();
        this.renderDetailPanel();
      });
      nav.append(button);
    });

    this.sideNav.append(nav);
  }

  private renderMainCanvas() {
    if (!this.mainCanvas) return;
    this.mainCanvas.innerHTML = '';

    const header = document.createElement('header');
    header.className = 'city-stitch__main-header';
    header.innerHTML = `<h1>${LOCAL_SECTIONS.find((s) => s.id === this.activeSection)?.label ?? 'City'} Sector</h1>
      <p>${this.state.planetId.toUpperCase()} • ${this.state.archetype.toUpperCase()} • OWNER ${this.state.owner}</p>`;

    const grid = document.createElement('section');
    grid.className = 'city-stitch__cards';

    BUILDING_ORDER_BY_BRANCH[this.activeSection].forEach((buildingId) => {
      grid.append(this.createBuildingCard(buildingId));
    });

    this.mainCanvas.append(header, grid);
  }

  private createBuildingCard(buildingId: EconomyBuildingId) {
    const config = getBuildingConfig(buildingId);
    const level = getBuildingLevel(this.state.economy, buildingId);
    const guard = canStartConstruction(this.state.economy, buildingId);
    const unlocked = isBuildingUnlocked(this.state.economy, buildingId);
    const next = config.levels[level] ?? null;
    const selected = this.selectedBuildingId === buildingId;

    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'city-stitch__card';
    if (selected) card.classList.add('is-selected');
    if (!unlocked) card.classList.add('is-disabled');
    card.dataset.buildingId = buildingId;

    const image = BUILDING_ASSETS[buildingId];
    const imageMarkup = image
      ? `<div class="city-stitch__card-image"><img src="${image}" alt="${config.name}"/></div>`
      : '<div class="city-stitch__card-image city-stitch__card-image--empty"><span class="material-symbols-outlined">domain</span></div>';

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

  private renderDetailPanel() {
    if (!this.detailPanel) return;
    this.detailPanel.innerHTML = '';

    const config = getBuildingConfig(this.selectedBuildingId);
    const level = getBuildingLevel(this.state.economy, this.selectedBuildingId);
    const next = config.levels[level] ?? null;
    const guard = canStartConstruction(this.state.economy, this.selectedBuildingId);
    const derived = getCityDerivedStats(this.state.economy);

    const hero = document.createElement('section');
    hero.className = 'city-stitch__detail-hero';
    hero.innerHTML = `<h2>${config.name}</h2>
      <p>Current level: ${level}/${config.maxLevel}</p>
      <p>${this.getBuildingEffectText(this.selectedBuildingId, level)}</p>`;

    const nextAction = document.createElement('section');
    nextAction.className = 'city-stitch__detail-block';
    nextAction.innerHTML = `<h3>Next action</h3>
      <p>${guard.ok ? 'All prerequisites met.' : guard.reason ?? 'Unavailable'}</p>
      <p>${next ? `Cost O ${next.resources.ore} · S ${next.resources.stone} · I ${next.resources.iron}` : 'Cost: max level reached'}</p>
      <p>${next ? `Build ${formatDuration(next.buildSeconds * 1000)}` : 'Build: —'}</p>`;

    const upgrade = document.createElement('button');
    upgrade.type = 'button';
    upgrade.className = 'city-stitch__primary';
    upgrade.dataset.buildingId = this.selectedBuildingId;
    upgrade.disabled = !guard.ok;
    upgrade.textContent = guard.ok ? 'Upgrade now' : guard.reason ?? 'Unavailable';
    upgrade.addEventListener('click', () => {
      const result = startCityBuildingUpgrade(this.persistenceContext, this.selectedBuildingId, Date.now());
      this.state.economy = result.state.economy;
      this.renderAll();
    });

    this.detailPanel.append(hero, nextAction, upgrade, this.renderBranchBlock(), this.renderDerivedBlock(derived));
  }

  private renderBranchBlock() {
    if (this.activeSection === 'military') return this.renderMilitaryBlock();
    if (this.activeSection === 'research') return this.renderResearchBlock();
    if (this.activeSection === 'intelligence') return this.renderIntelBlock();
    if (this.activeSection === 'governance') return this.renderGovernanceBlock();

    const block = document.createElement('section');
    block.className = 'city-stitch__detail-block';
    if (this.activeSection === 'defense' || this.activeSection === 'logistics') {
      block.innerHTML = '<h3>Branch operations</h3><p>Visual panel active. No branch-specific action wiring beyond building upgrades in current runtime.</p>';
      return block;
    }
    block.innerHTML = `<h3>Branch summary</h3><p>Active branch: ${this.activeSection}</p>`;
    return block;
  }

  private renderMilitaryBlock() {
    const block = document.createElement('section');
    block.className = 'city-stitch__detail-block';
    block.innerHTML = '<h3>Training command</h3>';

    (Object.keys(CITY_ECONOMY_CONFIG.troops) as TroopId[]).forEach((troopId) => {
      const troop = CITY_ECONOMY_CONFIG.troops[troopId];
      const guard = canStartTroopTraining(this.state.economy, troopId, 1);
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'city-stitch__line-btn';
      row.disabled = !guard.ok;
      row.textContent = `${troop.name} x1 (${guard.ok ? 'Train' : guard.reason})`;
      row.addEventListener('click', () => {
        const result = startCityTroopTraining(this.persistenceContext, troopId, 1, Date.now());
        this.state.economy = result.state.economy;
        this.renderAll();
      });
      block.append(row);
    });

    return block;
  }

  private renderResearchBlock() {
    const block = document.createElement('section');
    block.className = 'city-stitch__detail-block';
    block.innerHTML = `<h3>Research queue ${this.state.economy.researchQueue.length}/1</h3>`;

    (Object.keys(CITY_ECONOMY_CONFIG.research) as ResearchId[]).forEach((researchId) => {
      const guard = canStartResearch(this.state.economy, researchId);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'city-stitch__line-btn';
      btn.disabled = !guard.ok;
      btn.textContent = `${CITY_ECONOMY_CONFIG.research[researchId].name} (${guard.ok ? 'Start' : guard.reason})`;
      btn.addEventListener('click', () => {
        const result = startCityResearch(this.persistenceContext, researchId, Date.now());
        this.state.economy = result.state.economy;
        this.renderAll();
      });
      block.append(btn);
    });

    return block;
  }

  private renderIntelBlock() {
    const block = document.createElement('section');
    block.className = 'city-stitch__detail-block';
    const baseGuard = canStartIntelProject(this.state.economy);
    block.innerHTML = `<h3>Intel operations</h3><p>Readiness ${this.state.economy.intelReadiness.toFixed(1)}%</p>`;

    (['sweep', 'network', 'cipher'] as const).forEach((projectType) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'city-stitch__line-btn';
      btn.disabled = !baseGuard.ok;
      btn.textContent = `Start ${projectType} (${baseGuard.ok ? 'Begin' : baseGuard.reason})`;
      btn.addEventListener('click', () => {
        const result = startCityIntelProject(this.persistenceContext, projectType, Date.now());
        this.state.economy = result.state.economy;
        this.renderAll();
      });
      block.append(btn);
    });

    return block;
  }

  private renderGovernanceBlock() {
    const block = document.createElement('section');
    block.className = 'city-stitch__detail-block';
    block.innerHTML = `<h3>Council policies</h3><p>Active: ${this.state.economy.activePolicy ?? 'none'}</p>`;

    (Object.keys(CITY_ECONOMY_CONFIG.policies) as LocalPolicyId[]).forEach((policyId) => {
      const guard = canSetPolicy(this.state.economy, policyId);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'city-stitch__line-btn';
      btn.disabled = !guard.ok;
      btn.textContent = `${CITY_ECONOMY_CONFIG.policies[policyId].name} (${guard.ok ? 'Apply' : guard.reason})`;
      btn.addEventListener('click', () => {
        const result = setCityPolicy(this.persistenceContext, policyId, Date.now());
        this.state.economy = result.state.economy;
        this.renderAll();
      });
      block.append(btn);
    });

    return block;
  }

  private renderDerivedBlock(derived: ReturnType<typeof getCityDerivedStats>) {
    const block = document.createElement('section');
    block.className = 'city-stitch__detail-block';
    block.innerHTML = `<h3>City effects</h3>
      <p>Defense +${derived.cityDefensePct.toFixed(1)}% · Mitigation +${derived.damageMitigationPct.toFixed(1)}%</p>
      <p>Training +${derived.trainingSpeedPct.toFixed(1)}% · Troop power +${derived.troopCombatPowerPct.toFixed(1)}%</p>
      <p>Detection +${derived.detectionPct.toFixed(1)}% · Counter-intel +${derived.counterIntelPct.toFixed(1)}%</p>
      <p>Research cap ${derived.researchCapacity} · Market +${derived.marketEfficiencyPct.toFixed(1)}%</p>`;
    return block;
  }

  private renderBottomBar() {
    if (!this.bottomBar) return;
    this.bottomBar.innerHTML = '';

    const queue = document.createElement('div');
    queue.className = 'city-stitch__queue';
    queue.innerHTML = '<p class="city-stitch__queue-title">Construction Queue</p>';
    const builds = this.state.economy.queue.slice().sort((a, b) => a.endsAtMs - b.endsAtMs);
    if (builds.length === 0) {
      queue.append(this.createQueueLine('No active build order'));
    }
    builds.forEach((entry) => {
      queue.append(this.createQueueLine(`${entry.buildingId} → lv${entry.targetLevel} · ${formatDuration(Math.max(0, entry.endsAtMs - Date.now()))}`));
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

  private makeTopControl(icon: string, onClick: () => void) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'city-stitch__top-btn material-symbols-outlined';
    button.textContent = icon;
    button.addEventListener('click', onClick);
    return button;
  }

  private createQueueLine(text: string) {
    const row = document.createElement('p');
    row.className = 'city-stitch__queue-line';
    row.textContent = text;
    return row;
  }

  private ensureSelectedBuildingInActiveSection() {
    const ids = BUILDING_ORDER_BY_BRANCH[this.activeSection];
    if (!ids.includes(this.selectedBuildingId)) this.selectedBuildingId = ids[0] ?? 'hq';
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
    citySlotTotal: getEconomyBuildingOrder().length,
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
