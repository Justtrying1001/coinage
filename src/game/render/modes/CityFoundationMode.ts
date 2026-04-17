import {
  canSetPolicy,
  canStartConstruction,
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
const LOCAL_SECTIONS: Array<{ id: LocalCitySection; label: string; tagline: string }> = [
  { id: 'economy', label: 'Economy', tagline: 'Extraction & growth' },
  { id: 'military', label: 'Military', tagline: 'Force projection' },
  { id: 'defense', label: 'Defense', tagline: 'City hardening' },
  { id: 'research', label: 'Research', tagline: 'Doctrine lab' },
  { id: 'intelligence', label: 'Intelligence', tagline: 'Recon & counter-intel' },
  { id: 'governance', label: 'Governance', tagline: 'Local directives' },
  { id: 'logistics', label: 'Logistics', tagline: 'Market throughput' },
];

const RESOURCE_LABELS: Record<EconomyResource, string> = {
  ore: 'Ore',
  stone: 'Stone',
  iron: 'Iron',
};

const BUILDING_STAGE_COORDS: Record<EconomyBuildingId, { x: number; y: number; district: string }> = {
  hq: { x: 50, y: 56, district: 'Command Core' },
  mine: { x: 18, y: 68, district: 'Ore Basin' },
  quarry: { x: 30, y: 74, district: 'Stone Ridge' },
  refinery: { x: 43, y: 73, district: 'Smelter Ring' },
  warehouse: { x: 61, y: 72, district: 'Storage Yard' },
  housing_complex: { x: 72, y: 63, district: 'Residential Arc' },
  barracks: { x: 77, y: 48, district: 'Garrison Block' },
  combat_forge: { x: 66, y: 45, district: 'Forge Array' },
  space_dock: { x: 84, y: 35, district: 'Orbital Ramp' },
  defensive_wall: { x: 52, y: 84, district: 'Perimeter Ring' },
  watch_tower: { x: 89, y: 57, district: 'Sentinel Tower' },
  military_academy: { x: 74, y: 32, district: 'War College' },
  armament_factory: { x: 59, y: 35, district: 'Armament Lines' },
  intelligence_center: { x: 38, y: 34, district: 'Cipher Node' },
  research_lab: { x: 49, y: 28, district: 'Research Cluster' },
  market: { x: 24, y: 52, district: 'Trade Spine' },
  council_chamber: { x: 34, y: 44, district: 'Council Hall' },
};

export class CityFoundationMode implements RenderModeController {
  readonly id = 'city3d' as const;

  private root: HTMLElement | null = null;
  private topBar: HTMLElement | null = null;
  private resourceStrip: HTMLElement | null = null;
  private rail: HTMLElement | null = null;
  private stage: HTMLElement | null = null;
  private contextPanel: HTMLElement | null = null;
  private queueStrip: HTMLElement | null = null;

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
    root.className = 'city-management citycmd';
    root.append(this.createTopCommandBar(), this.createCommandDeck());

    this.context.host.appendChild(root);
    this.root = root;
    this.renderAll();
  }

  resize() {}

  update(deltaMs: number) {
    this.uiAccumulatorMs += deltaMs;
    if (this.uiAccumulatorMs < 1000) return;
    this.uiAccumulatorMs = 0;
    this.refreshFromPersistence();
    this.renderTopBar();
    this.renderQueueStrip();
    this.renderStage();
    this.renderContextPanel();
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

  private createTopCommandBar() {
    const top = document.createElement('header');
    top.className = 'citycmd__top';
    this.topBar = top;

    const resourceStrip = document.createElement('section');
    resourceStrip.className = 'citycmd__resources';
    this.resourceStrip = resourceStrip;

    const queue = document.createElement('section');
    queue.className = 'citycmd__queues';
    this.queueStrip = queue;

    top.append(resourceStrip, queue);
    return top;
  }

  private createCommandDeck() {
    const body = document.createElement('div');
    body.className = 'citycmd__deck';

    const rail = document.createElement('aside');
    rail.className = 'citycmd__rail';
    this.rail = rail;

    const stage = document.createElement('section');
    stage.className = 'citycmd__stage';
    this.stage = stage;

    const contextPanel = document.createElement('aside');
    contextPanel.className = 'citycmd__context';
    this.contextPanel = contextPanel;

    body.append(rail, stage, contextPanel);
    return body;
  }

  private renderAll() {
    this.refreshFromPersistence();
    this.ensureSelectedBuildingInActiveSection();
    this.renderTopBar();
    this.renderQueueStrip();
    this.renderRail();
    this.renderStage();
    this.renderContextPanel();
  }

  private renderTopBar() {
    if (!this.resourceStrip || !this.topBar) return;
    this.resourceStrip.innerHTML = '';

    const pop = getPopulationSnapshot(this.state.economy);
    const storage = getStorageCaps(this.state.economy);
    const production = getProductionPerHour(this.state.economy);

    const meta = document.createElement('div');
    meta.className = 'citycmd__identity';
    meta.innerHTML = `<p class="citycmd__city">${this.state.planetId.toUpperCase()} • ${this.state.archetype.toUpperCase()}</p>
      <p class="citycmd__owner">Owner ${this.state.owner}</p>
      <p class="citycmd__ops">Pop ${pop.used}/${pop.cap} · Slots ${this.getUsedSlots()}/${this.state.citySlotTotal} · Queue: ${this.state.economy.queue.length}/${QUEUE_CAP}</p>`;

    const resources = document.createElement('div');
    resources.className = 'citycmd__resource-strip';

    (Object.keys(RESOURCE_LABELS) as EconomyResource[]).forEach((resource) => {
      const item = document.createElement('article');
      item.className = `citycmd__resource citycmd__resource--${resource}`;
      item.innerHTML = `<p class="citycmd__resource-label">${RESOURCE_LABELS[resource]}</p>
      <p class="citycmd__resource-stock">${Math.floor(this.state.economy.resources[resource]).toLocaleString()} / ${storage[resource].toLocaleString()}</p>
      <p class="citycmd__resource-rate">+${Math.round(production[resource]).toLocaleString()}/h</p>`;
      resources.append(item);
    });

    const controls = document.createElement('div');
    controls.className = 'citycmd__controls';
    const backPlanet = this.makeControlButton('Back to planet', () => this.context.onRequestMode('planet3d'));
    const backGalaxy = this.makeControlButton('Galaxy', () => this.context.onRequestMode('galaxy2d'));
    controls.append(backPlanet, backGalaxy);

    this.resourceStrip.append(meta, resources, controls);
  }

  private renderQueueStrip() {
    if (!this.queueStrip) return;
    this.queueStrip.innerHTML = '';

    const construction = document.createElement('div');
    construction.className = 'citycmd__queue-group';
    construction.innerHTML = `<p class="citycmd__queue-title">Construction ${this.state.economy.queue.length}/${QUEUE_CAP}</p>`;
    const sorted = this.state.economy.queue.slice().sort((a, b) => a.endsAtMs - b.endsAtMs);
    if (sorted.length === 0) {
      construction.append(this.createQueueLine('No active build order'));
    }
    sorted.forEach((entry) => construction.append(this.createQueueLine(`${entry.buildingId} → lvl ${entry.targetLevel} · ${formatDuration(Math.max(0, entry.endsAtMs - Date.now()))}`)));

    const operational = document.createElement('div');
    operational.className = 'citycmd__queue-group';
    operational.innerHTML = `<p class="citycmd__queue-title">Ops queues</p>`;
    operational.append(
      this.createQueueLine(`Training: ${this.state.economy.trainingQueue.length}`),
      this.createQueueLine(`Research: ${this.state.economy.researchQueue.length}`),
      this.createQueueLine(`Intel projects: ${this.state.economy.intelProjects.length}`),
    );

    this.queueStrip.append(construction, operational);
  }

  private renderRail() {
    if (!this.rail) return;
    this.rail.innerHTML = '';

    const title = document.createElement('p');
    title.className = 'citycmd__rail-title';
    title.textContent = 'City Operations';
    this.rail.append(title);

    LOCAL_SECTIONS.forEach((section) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'citycmd__rail-item';
      button.setAttribute('aria-label', section.label);
      if (this.activeSection === section.id) button.classList.add('is-active');
      button.innerHTML = `<span class="citycmd__rail-item-label">${section.label}</span><span class="citycmd__rail-item-tag">${section.tagline}</span>`;
      button.addEventListener('click', () => {
        this.activeSection = section.id;
        this.ensureSelectedBuildingInActiveSection();
        this.renderRail();
        this.renderStage();
        this.renderContextPanel();
      });
      this.rail!.append(button);
    });

    const premiumOff = document.createElement('p');
    premiumOff.className = 'citycmd__rail-foot';
    premiumOff.textContent = 'Premium / wallet / special buildings: disabled in MVP MICRO';
    this.rail.append(premiumOff);
  }

  private renderStage() {
    if (!this.stage) return;
    this.stage.innerHTML = '';

    const frame = document.createElement('div');
    frame.className = `citycmd__stage-frame citycmd__stage-frame--${this.activeSection}`;

    const skyline = document.createElement('div');
    skyline.className = 'citycmd__skyline';
    skyline.innerHTML = '<span></span><span></span><span></span><span></span>';

    const grid = document.createElement('div');
    grid.className = 'citycmd__district-grid';

    const sectionBuildings = this.getSectionBuildings();
    sectionBuildings.forEach((buildingId) => {
      const cfg = getBuildingConfig(buildingId);
      const level = getBuildingLevel(this.state.economy, buildingId);
      const guard = canStartConstruction(this.state.economy, buildingId);
      const unlocked = isBuildingUnlocked(this.state.economy, buildingId);
      const pos = BUILDING_STAGE_COORDS[buildingId];

      const hotspot = document.createElement('button');
      hotspot.type = 'button';
      hotspot.className = 'citycmd__hotspot';
      if (this.selectedBuildingId === buildingId) hotspot.classList.add('is-selected');
      if (!unlocked) hotspot.classList.add('is-locked');
      hotspot.style.left = `${pos.x}%`;
      hotspot.style.top = `${pos.y}%`;
      hotspot.setAttribute('aria-label', `${cfg.name} level ${level}`);
      hotspot.innerHTML = `<span class="citycmd__hotspot-core"></span><span class="citycmd__hotspot-name">${cfg.name}</span><span class="citycmd__hotspot-level">Lv ${level}</span>`;
      hotspot.addEventListener('click', () => {
        this.selectedBuildingId = buildingId;
        this.renderStage();
        this.renderContextPanel();
      });

      const chip = document.createElement('p');
      chip.className = 'citycmd__district-chip';
      chip.style.left = `${Math.max(5, pos.x - 5)}%`;
      chip.style.top = `${Math.max(6, pos.y - 7)}%`;
      chip.textContent = guard.ok ? pos.district : `${pos.district} • ${guard.reason}`;

      grid.append(hotspot, chip);
    });

    const footer = document.createElement('div');
    footer.className = 'citycmd__stage-footer';
    footer.textContent = `Active branch: ${this.activeSection.toUpperCase()} • ${sectionBuildings.length} structures visible`;

    frame.append(skyline, grid, footer);
    this.stage.append(frame);
  }

  private renderContextPanel() {
    if (!this.contextPanel) return;
    this.contextPanel.innerHTML = '';

    const config = getBuildingConfig(this.selectedBuildingId);
    const level = getBuildingLevel(this.state.economy, this.selectedBuildingId);
    const next = config.levels[level] ?? null;
    const guard = canStartConstruction(this.state.economy, this.selectedBuildingId);
    const derived = getCityDerivedStats(this.state.economy);

    const header = document.createElement('header');
    header.className = 'citycmd__context-header';
    header.innerHTML = `<p class="citycmd__context-id">${this.selectedBuildingId}</p>
      <h3>${config.name}</h3>
      <p>Current level: ${level} / ${config.maxLevel}</p>
      <p>${this.getBuildingEffectText(this.selectedBuildingId, level)}</p>`;

    const requirements = document.createElement('section');
    requirements.className = 'citycmd__context-block';
    requirements.innerHTML = `<h4>Upgrade status</h4>
      <p>${guard.ok ? 'All prerequisites met.' : `Locked: ${guard.reason}`}</p>
      <p>${next ? `Next cost: O ${next.resources.ore} · S ${next.resources.stone} · I ${next.resources.iron}` : 'Next cost: max level reached'}</p>
      <p>${next ? `Build time: ${formatDuration(next.buildSeconds * 1000)}` : 'Build time: —'}</p>`;

    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'city-management__upgrade citycmd__primary-cta';
    action.dataset.buildingId = this.selectedBuildingId;
    action.disabled = !guard.ok;
    action.textContent = guard.reason ?? 'Upgrade now';
    action.addEventListener('click', () => {
      const result = startCityBuildingUpgrade(this.persistenceContext, this.selectedBuildingId, Date.now());
      this.state.economy = result.state.economy;
      this.renderAll();
    });

    const branchBlock = this.renderBranchContextBlock();

    const stats = document.createElement('section');
    stats.className = 'citycmd__context-block';
    stats.innerHTML = `<h4>Local city effects</h4>
      <p>Training speed +${derived.trainingSpeedPct.toFixed(1)}%</p>
      <p>Defense +${derived.cityDefensePct.toFixed(1)}% · Mitigation +${derived.damageMitigationPct.toFixed(1)}%</p>
      <p>Detection +${derived.detectionPct.toFixed(1)}% · Counter-intel +${derived.counterIntelPct.toFixed(1)}%</p>
      <p>Research capacity ${derived.researchCapacity} · Market efficiency +${derived.marketEfficiencyPct.toFixed(1)}%</p>`;

    this.contextPanel.append(header, requirements, action, branchBlock, stats);
  }

  private renderBranchContextBlock() {
    if (this.activeSection === 'military') return this.renderMilitaryBlock();
    if (this.activeSection === 'research') return this.renderResearchBlock();
    if (this.activeSection === 'intelligence') return this.renderIntelBlock();
    if (this.activeSection === 'governance') return this.renderGovernanceBlock();

    const block = document.createElement('section');
    block.className = 'citycmd__context-block';
    block.innerHTML = `<h4>Branch operations</h4>
      <p>Focus: ${this.activeSection}</p>
      <p>Construction queue visible in command bar. Locked actions always show exact reasons.</p>`;
    return block;
  }

  private renderMilitaryBlock() {
    const block = document.createElement('section');
    block.className = 'citycmd__context-block';
    block.innerHTML = '<h4>Training Command</h4>';

    (Object.keys(CITY_ECONOMY_CONFIG.troops) as TroopId[]).forEach((troopId) => {
      const troop = CITY_ECONOMY_CONFIG.troops[troopId];
      const guard = canStartTroopTraining(this.state.economy, troopId, 1);
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'city-management__upgrade citycmd__line-cta';
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
    block.className = 'citycmd__context-block';
    block.innerHTML = `<h4>Research Queue (${this.state.economy.researchQueue.length}/1)</h4>`;

    (Object.keys(CITY_ECONOMY_CONFIG.research) as ResearchId[]).forEach((researchId) => {
      const guard = canStartResearch(this.state.economy, researchId);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'city-management__upgrade citycmd__line-cta';
      btn.disabled = !guard.ok;
      btn.textContent = `${CITY_ECONOMY_CONFIG.research[researchId].name} (${guard.ok ? 'Start' : guard.reason})`;
      btn.addEventListener('click', () => {
        const start = startCityResearch(this.persistenceContext, researchId, Date.now());
        this.state.economy = start.state.economy;
        this.renderAll();
      });
      block.append(btn);
    });

    return block;
  }

  private renderIntelBlock() {
    const block = document.createElement('section');
    block.className = 'citycmd__context-block';
    block.innerHTML = `<h4>Intel Operations</h4><p>Readiness: ${this.state.economy.intelReadiness}%</p>`;

    (['sweep', 'network', 'cipher'] as const).forEach((projectType) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'city-management__upgrade citycmd__line-cta';
      btn.textContent = `Start ${projectType}`;
      btn.addEventListener('click', () => {
        const start = startCityIntelProject(this.persistenceContext, projectType, Date.now());
        this.state.economy = start.state.economy;
        this.renderAll();
      });
      block.append(btn);
    });

    return block;
  }

  private renderGovernanceBlock() {
    const block = document.createElement('section');
    block.className = 'citycmd__context-block';
    block.innerHTML = `<h4>Council Policies</h4><p>Active: ${this.state.economy.activePolicy ?? 'none'}</p>`;

    (Object.keys(CITY_ECONOMY_CONFIG.policies) as LocalPolicyId[]).forEach((policyId) => {
      const guard = canSetPolicy(this.state.economy, policyId);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'city-management__upgrade citycmd__line-cta';
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

  private makeControlButton(label: string, onClick: () => void) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'city-management__btn citycmd__control';
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
  }

  private createQueueLine(text: string) {
    const row = document.createElement('p');
    row.className = 'citycmd__queue-line';
    row.textContent = text;
    return row;
  }

  private ensureSelectedBuildingInActiveSection() {
    const ids = this.getSectionBuildings();
    if (!ids.includes(this.selectedBuildingId)) {
      this.selectedBuildingId = ids[0] ?? 'hq';
    }
  }

  private getSectionBuildings() {
    return BUILDING_ORDER_BY_BRANCH[this.activeSection] ?? [];
  }

  private getUsedSlots() {
    return getEconomyBuildingOrder().reduce((sum, buildingId) => (getBuildingLevel(this.state.economy, buildingId) > 0 ? sum + 1 : sum), 0);
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
    return `Local branch unlock and progression node`;
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
    citySlotTotal: 17,
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
