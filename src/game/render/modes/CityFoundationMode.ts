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
type NodeTier = 'anchor' | 'standard' | 'context';

interface StageNode {
  id: EconomyBuildingId;
  x: number;
  y: number;
  tier: NodeTier;
}

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

const STAGE_LAYOUTS: Record<LocalCitySection, StageNode[]> = {
  economy: [
    { id: 'hq', x: 50, y: 50, tier: 'anchor' },
    { id: 'mine', x: 24, y: 64, tier: 'standard' },
    { id: 'quarry', x: 35, y: 74, tier: 'standard' },
    { id: 'refinery', x: 48, y: 78, tier: 'standard' },
    { id: 'warehouse', x: 64, y: 70, tier: 'standard' },
    { id: 'housing_complex', x: 76, y: 58, tier: 'standard' },
  ],
  military: [
    { id: 'hq', x: 48, y: 50, tier: 'anchor' },
    { id: 'barracks', x: 67, y: 61, tier: 'standard' },
    { id: 'space_dock', x: 80, y: 30, tier: 'anchor' },
    { id: 'armament_factory', x: 56, y: 22, tier: 'anchor' },
  ],
  defense: [
    { id: 'hq', x: 50, y: 52, tier: 'anchor' },
    { id: 'defensive_wall', x: 50, y: 80, tier: 'anchor' },
    { id: 'watch_tower', x: 76, y: 55, tier: 'standard' },
  ],
  research: [
    { id: 'hq', x: 48, y: 56, tier: 'anchor' },
    { id: 'research_lab', x: 52, y: 32, tier: 'anchor' },
  ],
  intelligence: [
    { id: 'hq', x: 50, y: 58, tier: 'anchor' },
    { id: 'intelligence_center', x: 44, y: 34, tier: 'anchor' },
    { id: 'watch_tower', x: 70, y: 45, tier: 'context' },
  ],
  governance: [
    { id: 'hq', x: 49, y: 58, tier: 'anchor' },
    { id: 'council_chamber', x: 38, y: 38, tier: 'anchor' },
    { id: 'armament_factory', x: 68, y: 34, tier: 'context' },
  ],
  logistics: [
    { id: 'hq', x: 50, y: 56, tier: 'anchor' },
    { id: 'market', x: 29, y: 51, tier: 'anchor' },
    { id: 'warehouse', x: 66, y: 63, tier: 'context' },
  ],
};

export class CityFoundationMode implements RenderModeController {
  readonly id = 'city3d' as const;

  private root: HTMLElement | null = null;
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
    if (!this.resourceStrip) return;
    this.resourceStrip.innerHTML = '';

    const pop = getPopulationSnapshot(this.state.economy);
    const storage = getStorageCaps(this.state.economy);
    const production = getProductionPerHour(this.state.economy);

    const meta = document.createElement('div');
    meta.className = 'citycmd__identity';
    meta.innerHTML = `<p class="citycmd__city">${this.state.planetId.toUpperCase()} • ${this.state.archetype.toUpperCase()}</p>
      <p class="citycmd__owner">Owner ${this.state.owner}</p>
      <p class="citycmd__ops">Queue: ${this.state.economy.queue.length}/${QUEUE_CAP} · Pop ${pop.used}/${pop.cap}</p>`;

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
    controls.append(this.makeControlButton('Back to planet', () => this.context.onRequestMode('planet3d')));
    controls.append(this.makeControlButton('Galaxy', () => this.context.onRequestMode('galaxy2d')));

    this.resourceStrip.append(meta, resources, controls);
  }

  private renderQueueStrip() {
    if (!this.queueStrip) return;
    this.queueStrip.innerHTML = '';

    const construction = document.createElement('div');
    construction.className = 'citycmd__queue-group';
    construction.innerHTML = `<p class="citycmd__queue-title">Construction</p>`;
    const sorted = this.state.economy.queue.slice().sort((a, b) => a.endsAtMs - b.endsAtMs);
    if (sorted.length === 0) construction.append(this.createQueueLine('No active build order'));
    sorted.forEach((entry) => construction.append(this.createQueueLine(`${entry.buildingId} → lv${entry.targetLevel} · ${formatDuration(Math.max(0, entry.endsAtMs - Date.now()))}`)));

    const ops = document.createElement('div');
    ops.className = 'citycmd__queue-group';
    ops.innerHTML = `<p class="citycmd__queue-title">Ops</p>`;
    ops.append(
      this.createQueueLine(`Training ${this.state.economy.trainingQueue.length}`),
      this.createQueueLine(`Research ${this.state.economy.researchQueue.length}`),
      this.createQueueLine(`Intel ${this.state.economy.intelProjects.length}`),
    );

    this.queueStrip.append(construction, ops);
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

    const foot = document.createElement('p');
    foot.className = 'citycmd__rail-foot';
    foot.textContent = 'MVP MICRO only · premium/wallet/special disabled';
    this.rail.append(foot);
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

    this.getStageNodes().forEach((node) => {
      const cfg = getBuildingConfig(node.id);
      const level = getBuildingLevel(this.state.economy, node.id);
      const guard = canStartConstruction(this.state.economy, node.id);
      const unlocked = isBuildingUnlocked(this.state.economy, node.id);
      const isSelected = this.selectedBuildingId === node.id;

      const hotspot = document.createElement('button');
      hotspot.type = 'button';
      hotspot.className = `citycmd__hotspot citycmd__hotspot--${node.tier}`;
      if (isSelected) hotspot.classList.add('is-selected');
      if (!unlocked) hotspot.classList.add('is-locked');
      hotspot.style.left = `${node.x}%`;
      hotspot.style.top = `${node.y}%`;
      hotspot.dataset.buildingId = node.id;
      hotspot.setAttribute('aria-label', `${cfg.name} level ${level}`);
      hotspot.title = `${cfg.name} · level ${level}${guard.ok ? '' : ` · ${guard.reason}`}`;
      hotspot.innerHTML = `<span class="citycmd__hotspot-core"></span><span class="citycmd__hotspot-level">Lv ${level}</span>${
        isSelected ? `<span class="citycmd__hotspot-name">${cfg.name}</span>` : ''
      }`;
      hotspot.addEventListener('click', () => {
        this.selectedBuildingId = node.id;
        this.renderStage();
        this.renderContextPanel();
      });

      grid.append(hotspot);
    });

    const footer = document.createElement('div');
    footer.className = 'citycmd__stage-footer';
    footer.textContent = `Branch ${this.activeSection.toUpperCase()} · ${this.getStageNodes().length} visible nodes`;

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

    const hero = document.createElement('header');
    hero.className = 'citycmd__context-header citycmd__context-hero';
    hero.innerHTML = `<p class="citycmd__context-id">${this.selectedBuildingId}</p>
      <h3>${config.name}</h3>
      <p class="citycmd__hero-level">Current level: ${level} / ${config.maxLevel}</p>
      <p>${this.getBuildingEffectText(this.selectedBuildingId, level)}</p>`;

    const actionBlock = document.createElement('section');
    actionBlock.className = 'citycmd__context-block';
    actionBlock.innerHTML = `<h4>Next action</h4>
      <p>${guard.ok ? 'All prerequisites met.' : `Locked: ${guard.reason}`}</p>
      <p>${next ? `Cost O ${next.resources.ore} · S ${next.resources.stone} · I ${next.resources.iron}` : 'Cost: max level reached'}</p>
      <p>${next ? `Build ${formatDuration(next.buildSeconds * 1000)}` : 'Build: —'}</p>`;

    const cta = document.createElement('button');
    cta.type = 'button';
    cta.className = 'city-management__upgrade citycmd__primary-cta';
    cta.dataset.buildingId = this.selectedBuildingId;
    cta.disabled = !guard.ok;
    cta.textContent = guard.reason ?? 'Upgrade now';
    cta.addEventListener('click', () => {
      const result = startCityBuildingUpgrade(this.persistenceContext, this.selectedBuildingId, Date.now());
      this.state.economy = result.state.economy;
      this.renderAll();
    });

    const branchBlock = this.renderBranchContextBlock();

    const advanced = document.createElement('details');
    advanced.className = 'citycmd__context-advanced';
    advanced.innerHTML = `<summary>Advanced local effects</summary>
      <p>Training speed +${derived.trainingSpeedPct.toFixed(1)}%</p>
      <p>Defense +${derived.cityDefensePct.toFixed(1)}% · Mitigation +${derived.damageMitigationPct.toFixed(1)}%</p>
      <p>Detection +${derived.detectionPct.toFixed(1)}% · Counter-intel +${derived.counterIntelPct.toFixed(1)}%</p>
      <p>Research capacity ${derived.researchCapacity} · Market efficiency +${derived.marketEfficiencyPct.toFixed(1)}%</p>`;

    this.contextPanel.append(hero, actionBlock, cta, branchBlock, advanced);
  }

  private renderBranchContextBlock() {
    if (this.activeSection === 'military') return this.renderMilitaryBlock();
    if (this.activeSection === 'research') return this.renderResearchBlock();
    if (this.activeSection === 'intelligence') return this.renderIntelBlock();
    if (this.activeSection === 'governance') return this.renderGovernanceBlock();

    const block = document.createElement('section');
    block.className = 'citycmd__context-block';
    block.innerHTML = `<h4>Branch summary</h4>
      <p>Active branch: ${this.activeSection}</p>
      <p>Use stage nodes to change focus; queue and advanced stats are progressively disclosed.</p>`;
    return block;
  }

  private renderMilitaryBlock() {
    const block = document.createElement('section');
    block.className = 'citycmd__context-block';
    block.innerHTML = '<h4>Training command</h4>';

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
    block.innerHTML = `<h4>Research queue ${this.state.economy.researchQueue.length}/1</h4>`;

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
    block.innerHTML = `<h4>Intel operations</h4><p>Readiness ${this.state.economy.intelReadiness}%</p>`;

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
    block.innerHTML = `<h4>Council policies</h4><p>Active: ${this.state.economy.activePolicy ?? 'none'}</p>`;

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

  private getStageNodes() {
    return STAGE_LAYOUTS[this.activeSection];
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
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (minutes <= 0) return `${remainder}s`;
  return `${minutes}m ${remainder.toString().padStart(2, '0')}s`;
}
