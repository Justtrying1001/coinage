import {
  canStartConstruction,
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
  getCityResearchGuard,
  getCityPolicyGuard,
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

type LocalCitySection = 'economy' | 'military' | 'defense' | 'research' | 'intelligence' | 'governance' | 'logistics';

const QUEUE_CAP = getConstructionQueueSlots();
const LOCAL_SECTIONS: Array<{ id: LocalCitySection; label: string }> = [
  { id: 'economy', label: 'Economy' },
  { id: 'military', label: 'Military' },
  { id: 'defense', label: 'Defense' },
  { id: 'research', label: 'Research' },
  { id: 'intelligence', label: 'Intelligence' },
  { id: 'governance', label: 'Governance' },
  { id: 'logistics', label: 'Logistics' },
];

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
  private buildingsGrid: HTMLDivElement | null = null;
  private selectedPanel: HTMLDivElement | null = null;
  private queuePanel: HTMLDivElement | null = null;
  private summaryPanel: HTMLDivElement | null = null;
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

    this.refreshFromPersistence();
    this.renderResourceBar();
    this.renderQueue();
    this.renderSelectedBuilding();
    this.renderSummary();
    this.renderHeader();
    this.renderBuildings();
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

    const backPlanet = document.createElement('button');
    backPlanet.type = 'button';
    backPlanet.className = 'city-management__btn';
    backPlanet.textContent = 'Back to planet';
    backPlanet.addEventListener('click', () => this.context.onRequestMode('planet3d'));

    const resource = this.createResourceBar();
    resource.classList.add('city-management__resource-bar--header');
    right.append(resource, switcher, backPlanet);
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

    const buildingGrid = document.createElement('div');
    buildingGrid.className = 'city-management__ops-grid city-management__ops-grid--rich';
    this.buildingsGrid = buildingGrid;

    main.append(summary, buildingGrid);

    const right = document.createElement('aside');
    right.className = 'city-management__ops-right';

    const selected = document.createElement('div');
    selected.className = 'city-management__selected-panel';
    this.selectedPanel = selected;

    const queue = document.createElement('div');
    queue.className = 'city-management__queue-panel';
    this.queuePanel = queue;

    right.append(selected, queue);
    layout.append(localNav, main, right);

    return layout;
  }

  private renderAll() {
    this.refreshFromPersistence();
    this.renderHeader();
    this.renderResourceBar();
    this.renderLocalNav();
    this.renderBuildings();
    this.renderSelectedBuilding();
    this.renderQueue();
    this.renderSummary();
  }

  private renderLocalNav() {
    if (!this.localNavRail) return;
    this.localNavRail.innerHTML = '';

    LOCAL_SECTIONS.forEach((section) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'city-management__nav-item';
      if (this.activeSection === section.id) button.classList.add('is-active');
      button.textContent = section.label;
      button.addEventListener('click', () => {
        this.activeSection = section.id;
        this.renderLocalNav();
        this.renderBuildings();
      });
      this.localNavRail!.append(button);
    });
  }

  private sectionBuildingIds() {
    return BUILDING_ORDER_BY_BRANCH[this.activeSection] ?? [];
  }

  private renderHeader() {
    if (!this.headerIdentity) return;
    const pop = getPopulationSnapshot(this.state.economy);
    this.headerIdentity.textContent = `City ${this.state.planetId.toUpperCase()} · ${this.state.archetype.toUpperCase()} · Owner ${this.state.owner} · Slots ${this.getUsedSlots()}/${this.state.citySlotTotal} · Pop ${pop.used}/${pop.cap} · Queue: ${this.state.economy.queue.length}/${QUEUE_CAP}`;
  }

  private renderResourceBar() {
    if (!this.resourceStrip) return;
    this.resourceStrip.innerHTML = '';

    const production = getProductionPerHour(this.state.economy);
    const storage = getStorageCaps(this.state.economy);

    (Object.keys(RESOURCE_LABELS) as EconomyResource[]).forEach((resource) => {
      const item = document.createElement('div');
      item.className = 'city-management__resource-item';
      item.textContent = `${RESOURCE_LABELS[resource]} ${Math.floor(this.state.economy.resources[resource]).toLocaleString()} / ${storage[resource].toLocaleString()} (+${Math.round(production[resource]).toLocaleString()}/h)`;
      this.resourceStrip!.append(item);
    });
  }

  private renderBuildings() {
    if (!this.buildingsGrid) return;
    this.buildingsGrid.innerHTML = '';

    this.sectionBuildingIds().forEach((buildingId) => {
      const card = document.createElement('article');
      card.className = 'city-management__building-card';
      const cfg = getBuildingConfig(buildingId);
      const currentLevel = getBuildingLevel(this.state.economy, buildingId);
      const unlocked = isBuildingUnlocked(this.state.economy, buildingId);
      const guard = canStartConstruction(this.state.economy, buildingId);
      const nextCost = cfg.levels[currentLevel] ?? null;

      if (!unlocked) card.classList.add('is-locked');

      card.innerHTML = `<p class="city-management__building-name">${cfg.name}</p>
      <p class="city-management__building-production">Lvl ${currentLevel} / ${cfg.maxLevel}</p>
      <p class="city-management__building-meta">${this.getBuildingEffectText(buildingId, currentLevel)}</p>
      <p class="city-management__building-meta">${nextCost ? `Next: O ${nextCost.resources.ore} · S ${nextCost.resources.stone} · I ${nextCost.resources.iron} · ${formatDuration(nextCost.buildSeconds * 1000)}` : 'Max level reached'}</p>
      <p class="city-management__building-meta">${guard.ok ? 'Ready to upgrade' : guard.reason ?? 'Locked'}</p>`;

      const action = document.createElement('button');
      action.type = 'button';
      action.className = 'city-management__upgrade';
      action.dataset.buildingId = buildingId;
      action.disabled = !guard.ok;
      action.textContent = guard.reason ?? 'Upgrade';
      action.addEventListener('click', (event) => {
        event.stopPropagation();
        const result = startCityBuildingUpgrade(this.persistenceContext, buildingId, Date.now());
        this.state.economy = result.state.economy;
        this.renderAll();
      });

      card.addEventListener('click', () => {
        this.selectedBuildingId = buildingId;
        this.renderSelectedBuilding();
      });

      card.append(action);
      this.buildingsGrid!.append(card);
    });
  }

  private renderSelectedBuilding() {
    if (!this.selectedPanel) return;
    this.selectedPanel.innerHTML = '';

    const cfg = getBuildingConfig(this.selectedBuildingId);
    const currentLevel = getBuildingLevel(this.state.economy, this.selectedBuildingId);
    const nextUpgrade = cfg.levels[currentLevel] ?? null;
    const guard = canStartConstruction(this.state.economy, this.selectedBuildingId);

    const title = document.createElement('h4');
    title.textContent = `${cfg.name} (${this.selectedBuildingId})`;

    const status = document.createElement('p');
    status.textContent = `Current level: ${currentLevel}. ${this.getBuildingEffectText(this.selectedBuildingId, currentLevel)}`;

    const unlockLine = document.createElement('p');
    unlockLine.textContent = guard.ok ? 'All prerequisites met.' : `Locked: ${guard.reason}`;

    const next = document.createElement('p');
    next.textContent = nextUpgrade
      ? `Next cost Ore ${nextUpgrade.resources.ore} · Stone ${nextUpgrade.resources.stone} · Iron ${nextUpgrade.resources.iron} · ${formatDuration(nextUpgrade.buildSeconds * 1000)}`
      : 'Max level reached';

    const action = document.createElement('button');
    action.className = 'city-management__upgrade';
    action.textContent = guard.reason ?? 'Upgrade';
    action.disabled = !guard.ok;
    action.addEventListener('click', () => {
      const result = startCityBuildingUpgrade(this.persistenceContext, this.selectedBuildingId, Date.now());
      this.state.economy = result.state.economy;
      this.renderAll();
    });

    this.selectedPanel.append(title, status, unlockLine, next, action, this.renderTrainingBlock(), this.renderResearchBlock(), this.renderIntelBlock(), this.renderGovernanceBlock(), this.renderDerivedStatsBlock());
  }

  private renderTrainingBlock() {
    const block = document.createElement('section');
    block.className = 'city-management__selected-specialized';
    const t = document.createElement('p');
    t.textContent = 'Troop Training';
    block.append(t);

    (Object.keys(CITY_ECONOMY_CONFIG.troops) as TroopId[]).forEach((troopId) => {
      const troop = CITY_ECONOMY_CONFIG.troops[troopId];
      const guard = canStartTroopTraining(this.state.economy, troopId, 1);
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'city-management__upgrade';
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
    const title = document.createElement('p');
    title.textContent = `Research Queue (${this.state.economy.researchQueue.length}/1)`;
    block.append(title);

    (Object.keys(CITY_ECONOMY_CONFIG.research) as ResearchId[]).forEach((researchId) => {
      const btn = document.createElement('button');
      btn.className = 'city-management__upgrade';
      const guard = getCityResearchGuard(this.persistenceContext, researchId, Date.now());
      const allowed = guard.ok;
      btn.disabled = !allowed;
      btn.textContent = `${CITY_ECONOMY_CONFIG.research[researchId].name} (${allowed ? 'Start' : guard.reason})`;
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
    const title = document.createElement('p');
    title.textContent = `Intel readiness: ${this.state.economy.intelReadiness}%`;
    block.append(title);

    (['sweep', 'network', 'cipher'] as const).forEach((projectType) => {
      const btn = document.createElement('button');
      btn.className = 'city-management__upgrade';
      btn.textContent = `Intel project: ${projectType}`;
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
    const title = document.createElement('p');
    title.textContent = `Policy: ${this.state.economy.activePolicy ?? 'none'}`;
    block.append(title);

    (Object.keys(CITY_ECONOMY_CONFIG.policies) as LocalPolicyId[]).forEach((policyId) => {
      const guard = getCityPolicyGuard(this.persistenceContext, policyId, Date.now());
      const btn = document.createElement('button');
      btn.className = 'city-management__upgrade';
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

  private renderDerivedStatsBlock() {
    const block = document.createElement('section');
    const stats = getCityDerivedStats(this.state.economy);
    block.innerHTML = `<p>Local Effects</p>
    <p>Training speed +${stats.trainingSpeedPct.toFixed(1)}%</p>
    <p>Defense +${stats.cityDefensePct.toFixed(1)}% · Mitigation +${stats.damageMitigationPct.toFixed(1)}%</p>
    <p>Detection +${stats.detectionPct.toFixed(1)}% · Counter-intel +${stats.counterIntelPct.toFixed(1)}%</p>
    <p>Research capacity ${stats.researchCapacity} · Market efficiency +${stats.marketEfficiencyPct.toFixed(1)}%</p>`;
    return block;
  }

  private renderQueue() {
    if (!this.queuePanel) return;
    this.queuePanel.innerHTML = `<p>Construction queue ${this.state.economy.queue.length}/${getConstructionQueueSlots()}</p>`;
    const sorted = this.state.economy.queue.slice().sort((a, b) => a.endsAtMs - b.endsAtMs);
    sorted.forEach((entry) => {
      const row = document.createElement('p');
      row.textContent = `${entry.buildingId} -> lvl ${entry.targetLevel} (${formatDuration(Math.max(0, entry.endsAtMs - Date.now()))})`;
      this.queuePanel!.append(row);
    });
  }

  private renderSummary() {
    if (!this.summaryPanel) return;
    this.summaryPanel.innerHTML = '';

    const storage = getStorageCaps(this.state.economy);
    const pop = getPopulationSnapshot(this.state.economy);
    const rows = [
      `Slots: ${this.getUsedSlots()}/${this.state.citySlotTotal}`,
      `Population: ${pop.used}/${pop.cap}`,
      `Storage · Ore: ${storage.ore}`,
      `Storage · Stone: ${storage.stone}`,
      `Storage · Iron: ${storage.iron}`,
      `Construction queue: ${this.state.economy.queue.length}`,
      `Training queue: ${this.state.economy.trainingQueue.length}`,
      `Completed research: ${this.state.economy.completedResearch.length}`,
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
