import type { ModeContext, RenderModeController } from '@/game/render/modes/RenderModeController';
import type { PlanetArchetype, SelectedPlanetRef } from '@/game/render/types';
import { planetProfileFromSeed } from '@/game/world/galaxyGenerator';

type CoinageResource = 'ore' | 'stone' | 'iron';
type ResourceBundle = Record<CoinageResource, number>;
type BuildingId = 'hq' | 'mine' | 'quarry' | 'refinery' | 'warehouse' | 'housing_complex';

interface BuildingDefinition {
  id: BuildingId;
  name: string;
  effect: string;
  hqRequired: number;
  maxLevel: number;
  baseCost: ResourceBundle;
  baseBuildSeconds: number;
  populationPerLevel: number;
}

interface ConstructionEntry {
  buildingId: BuildingId;
  targetLevel: number;
  startedAtMs: number;
  endsAtMs: number;
  costPaid: ResourceBundle;
}

interface CityMvpState {
  owner: string;
  archetype: PlanetArchetype;
  citySlotTotal: number;
  buildings: Record<BuildingId, number>;
  resources: ResourceBundle;
  queue: ConstructionEntry[];
  lastUpdatedAtMs: number;
  baseStorage: ResourceBundle;
  basePopulationCap: number;
}

const MVP_QUEUE_CAP = 2;

const BUILDINGS: BuildingDefinition[] = [
  {
    id: 'hq',
    name: 'HQ',
    effect: 'Controls unlocks and core city progression.',
    hqRequired: 0,
    maxLevel: 20,
    baseCost: { ore: 220, stone: 160, iron: 40 },
    baseBuildSeconds: 80,
    populationPerLevel: 1,
  },
  {
    id: 'mine',
    name: 'Mine',
    effect: 'Produces Ore continuously over time.',
    hqRequired: 1,
    maxLevel: 20,
    baseCost: { ore: 90, stone: 50, iron: 0 },
    baseBuildSeconds: 55,
    populationPerLevel: 1,
  },
  {
    id: 'quarry',
    name: 'Quarry',
    effect: 'Produces Stone continuously over time.',
    hqRequired: 1,
    maxLevel: 20,
    baseCost: { ore: 70, stone: 85, iron: 0 },
    baseBuildSeconds: 58,
    populationPerLevel: 1,
  },
  {
    id: 'refinery',
    name: 'Refinery',
    effect: 'Produces Iron continuously over time.',
    hqRequired: 3,
    maxLevel: 20,
    baseCost: { ore: 130, stone: 120, iron: 35 },
    baseBuildSeconds: 74,
    populationPerLevel: 1,
  },
  {
    id: 'warehouse',
    name: 'Warehouse',
    effect: 'Increases storage caps for Ore, Stone, and Iron.',
    hqRequired: 1,
    maxLevel: 20,
    baseCost: { ore: 115, stone: 115, iron: 25 },
    baseBuildSeconds: 70,
    populationPerLevel: 0,
  },
  {
    id: 'housing_complex',
    name: 'Housing Complex',
    effect: 'Increases population cap for city growth.',
    hqRequired: 1,
    maxLevel: 20,
    baseCost: { ore: 95, stone: 100, iron: 15 },
    baseBuildSeconds: 62,
    populationPerLevel: 0,
  },
];

const RESOURCE_LABELS: Record<CoinageResource, string> = {
  ore: 'Ore',
  stone: 'Stone',
  iron: 'Iron',
};

export class CityFoundationMode implements RenderModeController {
  readonly id = 'city3d' as const;

  private root: HTMLElement | null = null;
  private headerTitle: HTMLHeadingElement | null = null;
  private resourceStrip: HTMLElement | null = null;
  private buildingsRoot: HTMLDivElement | null = null;
  private queueRoot: HTMLDivElement | null = null;
  private summaryRoot: HTMLDivElement | null = null;

  private uiTickMs = 0;
  private state: CityMvpState;

  constructor(
    private selectedPlanet: SelectedPlanetRef,
    private readonly context: ModeContext,
  ) {
    this.state = createFallbackMvpCityState(selectedPlanet);
  }

  mount() {
    const root = document.createElement('section');
    root.className = 'city-management';

    root.append(this.createHeaderSection(), this.createResourceSection(), this.createMainLayout());

    this.context.host.appendChild(root);
    this.root = root;

    this.applyClaimOnAccess();
    this.renderAll();
  }

  resize() {}

  update(deltaMs: number) {
    this.uiTickMs += deltaMs;
    if (this.uiTickMs < 1000) return;
    this.uiTickMs = 0;

    this.applyClaimOnAccess();
    const completed = this.resolveCompletedConstruction();

    this.renderResources();
    this.renderQueue();
    if (completed) {
      this.renderBuildings();
      this.renderSummary();
      this.renderHeader();
    }
  }

  setSelectedPlanet(nextPlanet: SelectedPlanetRef) {
    if (nextPlanet.id === this.selectedPlanet.id && nextPlanet.seed === this.selectedPlanet.seed) return;
    this.selectedPlanet = nextPlanet;
    this.state = createFallbackMvpCityState(nextPlanet);
    this.uiTickMs = 0;
    this.renderAll();
  }

  destroy() {
    this.root?.remove();
    this.root = null;
    this.headerTitle = null;
    this.resourceStrip = null;
    this.buildingsRoot = null;
    this.queueRoot = null;
    this.summaryRoot = null;
  }

  private createHeaderSection() {
    const header = document.createElement('header');
    header.className = 'city-management__header';

    const identity = document.createElement('div');
    const title = document.createElement('h2');
    title.className = 'city-management__title';
    this.headerTitle = title;

    const subtitle = document.createElement('p');
    subtitle.className = 'city-management__subtitle';
    subtitle.textContent = 'City management · MVP economy loop · claim-on-access production';

    identity.append(title, subtitle);

    const actions = document.createElement('div');
    actions.className = 'city-management__actions';

    const backToPlanet = document.createElement('button');
    backToPlanet.type = 'button';
    backToPlanet.className = 'city-management__btn';
    backToPlanet.textContent = 'Back to Planet';
    backToPlanet.addEventListener('click', () => this.context.onRequestMode('planet3d'));

    const backToGalaxy = document.createElement('button');
    backToGalaxy.type = 'button';
    backToGalaxy.className = 'city-management__btn city-management__btn--ghost';
    backToGalaxy.textContent = 'Back to Galaxy';
    backToGalaxy.addEventListener('click', () => this.context.onRequestMode('galaxy2d'));

    actions.append(backToPlanet, backToGalaxy);
    header.append(identity, actions);

    return header;
  }

  private createResourceSection() {
    const section = document.createElement('section');
    section.className = 'city-management__resources';
    this.resourceStrip = section;
    return section;
  }

  private createMainLayout() {
    const layout = document.createElement('div');
    layout.className = 'city-management__layout';

    const buildingsPanel = document.createElement('section');
    buildingsPanel.className = 'city-management__buildings';

    const buildingsTitle = document.createElement('h3');
    buildingsTitle.className = 'city-management__section-title';
    buildingsTitle.textContent = 'MVP Buildings';

    const buildings = document.createElement('div');
    buildings.className = 'city-management__building-list';
    this.buildingsRoot = buildings;

    buildingsPanel.append(buildingsTitle, buildings);

    const sidePanel = document.createElement('aside');
    sidePanel.className = 'city-management__side';

    const queueTitle = document.createElement('h3');
    queueTitle.className = 'city-management__section-title';
    queueTitle.textContent = 'Construction Queue';

    const queue = document.createElement('div');
    queue.className = 'city-management__queue';
    this.queueRoot = queue;

    const summaryTitle = document.createElement('h3');
    summaryTitle.className = 'city-management__section-title';
    summaryTitle.textContent = 'City Summary';

    const summary = document.createElement('div');
    summary.className = 'city-management__capacity';
    this.summaryRoot = summary;

    sidePanel.append(queueTitle, queue, summaryTitle, summary);
    layout.append(buildingsPanel, sidePanel);

    return layout;
  }

  private renderAll() {
    this.applyClaimOnAccess();
    this.renderHeader();
    this.renderResources();
    this.renderBuildings();
    this.renderQueue();
    this.renderSummary();
  }

  private renderHeader() {
    if (!this.headerTitle) return;
    this.headerTitle.textContent = `City ${this.selectedPlanet.id.toUpperCase()} · Planet ${this.state.archetype} · Owner ${this.state.owner}`;
  }

  private renderResources() {
    if (!this.resourceStrip) return;
    this.resourceStrip.innerHTML = '';

    const production = this.getProductionPerHour();
    const caps = this.getStorageCaps();

    (Object.keys(RESOURCE_LABELS) as CoinageResource[]).forEach((resourceKey) => {
      const card = document.createElement('article');
      card.className = 'city-management__resource-card';

      const title = document.createElement('p');
      title.className = 'city-management__resource-title';
      title.textContent = RESOURCE_LABELS[resourceKey];

      const stock = document.createElement('p');
      stock.className = 'city-management__resource-value';
      stock.textContent = `${Math.floor(this.state.resources[resourceKey]).toLocaleString()} / ${caps[resourceKey].toLocaleString()}`;

      const rate = document.createElement('p');
      rate.className = 'city-management__resource-rate';
      rate.textContent = `+${Math.round(production[resourceKey]).toLocaleString()} /h`;

      card.append(title, stock, rate);
      this.resourceStrip!.append(card);
    });
  }

  private renderBuildings() {
    if (!this.buildingsRoot) return;
    this.buildingsRoot.innerHTML = '';

    BUILDINGS.forEach((building) => {
      const card = document.createElement('article');
      card.className = 'city-management__building-card';

      const level = this.getBuildingLevel(building.id);
      const nextLevel = level + 1;
      const cost = this.getUpgradeCost(building, nextLevel);
      const durationMs = this.getBuildDurationMs(building, nextLevel);
      const blockedReason = this.getUpgradeBlockedReason(building, nextLevel);

      const name = document.createElement('p');
      name.className = 'city-management__building-name';
      name.textContent = `${building.name} · Lv ${level}`;

      const effect = document.createElement('p');
      effect.className = 'city-management__building-effect';
      effect.textContent = building.effect;

      const unlockLine = document.createElement('p');
      unlockLine.className = 'city-management__meta';
      unlockLine.textContent = `Unlock: HQ ${building.hqRequired}`;

      const costLine = document.createElement('p');
      costLine.className = 'city-management__meta';
      costLine.textContent = `Cost: Ore ${cost.ore} · Stone ${cost.stone} · Iron ${cost.iron}`;

      const timeLine = document.createElement('p');
      timeLine.className = 'city-management__meta';
      timeLine.textContent = `Build time: ${formatDuration(durationMs)}`;

      const action = document.createElement('button');
      action.type = 'button';
      action.className = 'city-management__upgrade';
      action.disabled = blockedReason !== null;
      action.textContent = blockedReason ?? `Upgrade to Lv ${nextLevel}`;
      action.addEventListener('click', () => {
        this.applyClaimOnAccess();
        this.startConstruction(building, nextLevel);
        this.renderAll();
      });

      card.append(name, effect, unlockLine, costLine, timeLine, action);
      this.buildingsRoot!.append(card);
    });
  }

  private renderQueue() {
    if (!this.queueRoot) return;
    this.queueRoot.innerHTML = '';

    if (!this.state.queue.length) {
      const empty = document.createElement('p');
      empty.className = 'city-management__empty';
      empty.textContent = `Queue empty · ${MVP_QUEUE_CAP} concurrent slots available (F2P MVP).`;
      this.queueRoot.append(empty);
      return;
    }

    this.state.queue
      .slice()
      .sort((a, b) => a.endsAtMs - b.endsAtMs)
      .forEach((entry, index) => {
        const definition = getBuildingDefinition(entry.buildingId);
        if (!definition) return;

        const row = document.createElement('div');
        row.className = index === 0 ? 'city-management__queue-item is-active' : 'city-management__queue-item';

        const name = document.createElement('p');
        name.className = 'city-management__queue-name';
        name.textContent = `${definition.name} → Lv ${entry.targetLevel}`;

        const timer = document.createElement('p');
        timer.className = 'city-management__queue-time';
        timer.textContent = `Remaining: ${formatDuration(Math.max(0, entry.endsAtMs - Date.now()))}`;

        row.append(name, timer);
        this.queueRoot!.append(row);
      });
  }

  private renderSummary() {
    if (!this.summaryRoot) return;
    this.summaryRoot.innerHTML = '';

    const caps = this.getStorageCaps();
    const population = this.getPopulationUsage();
    const usedSlots = this.getUsedBuildingSlots();

    const lines = [
      `Building slots: ${usedSlots}/${this.state.citySlotTotal}`,
      `Population: ${population.used}/${population.cap}`,
      `Storage caps: Ore ${caps.ore} · Stone ${caps.stone} · Iron ${caps.iron}`,
      `Queue occupancy: ${this.state.queue.length}/${MVP_QUEUE_CAP}`,
      'Construction is non-cancelable once started.',
    ];

    lines.forEach((line) => {
      const item = document.createElement('p');
      item.className = 'city-management__capacity-line';
      item.textContent = line;
      this.summaryRoot!.append(item);
    });
  }

  private getBuildingLevel(buildingId: BuildingId) {
    return this.state.buildings[buildingId] ?? 0;
  }

  private getUpgradeBlockedReason(building: BuildingDefinition, targetLevel: number): string | null {
    if (targetLevel > building.maxLevel) return 'Max level reached';

    if (building.id !== 'hq' && this.getBuildingLevel('hq') < building.hqRequired) {
      return `Requires HQ ${building.hqRequired}`;
    }

    if (this.state.queue.length >= MVP_QUEUE_CAP) return `Queue full (${MVP_QUEUE_CAP}/${MVP_QUEUE_CAP})`;

    if (this.state.queue.some((entry) => entry.buildingId === building.id)) {
      return 'Already in queue';
    }

    const cost = this.getUpgradeCost(building, targetLevel);
    if (!this.canAfford(cost)) return 'Not enough resources';

    return null;
  }

  private startConstruction(building: BuildingDefinition, targetLevel: number) {
    const blockedReason = this.getUpgradeBlockedReason(building, targetLevel);
    if (blockedReason) return;

    const cost = this.getUpgradeCost(building, targetLevel);
    this.state.resources.ore -= cost.ore;
    this.state.resources.stone -= cost.stone;
    this.state.resources.iron -= cost.iron;

    const startedAtMs = Date.now();
    const endsAtMs = startedAtMs + this.getBuildDurationMs(building, targetLevel);

    this.state.queue.push({
      buildingId: building.id,
      targetLevel,
      startedAtMs,
      endsAtMs,
      costPaid: cost,
    });
  }

  private resolveCompletedConstruction() {
    const now = Date.now();
    const completed = this.state.queue.filter((entry) => entry.endsAtMs <= now);
    if (!completed.length) return false;

    completed.forEach((entry) => {
      this.state.buildings[entry.buildingId] = Math.max(this.state.buildings[entry.buildingId], entry.targetLevel);
    });

    this.state.queue = this.state.queue.filter((entry) => entry.endsAtMs > now);
    return true;
  }

  private canAfford(cost: ResourceBundle) {
    return this.state.resources.ore >= cost.ore && this.state.resources.stone >= cost.stone && this.state.resources.iron >= cost.iron;
  }

  private getUpgradeCost(building: BuildingDefinition, targetLevel: number): ResourceBundle {
    const scale = Math.pow(1.32, Math.max(0, targetLevel - 1));
    return {
      ore: Math.round(building.baseCost.ore * scale),
      stone: Math.round(building.baseCost.stone * scale),
      iron: Math.round(building.baseCost.iron * scale),
    };
  }

  private getBuildDurationMs(building: BuildingDefinition, targetLevel: number) {
    const scale = Math.pow(1.2, Math.max(0, targetLevel - 1));
    return Math.round(building.baseBuildSeconds * scale * 1000);
  }

  private getProductionPerHour(): ResourceBundle {
    const hqLevel = this.getBuildingLevel('hq');
    const mineLevel = this.getBuildingLevel('mine');
    const quarryLevel = this.getBuildingLevel('quarry');
    const refineryLevel = this.getBuildingLevel('refinery');

    return {
      ore: 35 + mineLevel * 24 + hqLevel * 3,
      stone: 22 + quarryLevel * 20 + hqLevel * 2,
      iron: refineryLevel > 0 ? 8 + refineryLevel * 15 : 0,
    };
  }

  private getStorageCaps(): ResourceBundle {
    const warehouseLevel = this.getBuildingLevel('warehouse');
    const factor = 1 + warehouseLevel * 0.24;
    return {
      ore: Math.round(this.state.baseStorage.ore * factor),
      stone: Math.round(this.state.baseStorage.stone * factor),
      iron: Math.round(this.state.baseStorage.iron * factor),
    };
  }

  private getPopulationUsage() {
    const housingLevel = this.getBuildingLevel('housing_complex');
    const cap = this.state.basePopulationCap + housingLevel * 120;

    const used = BUILDINGS.reduce((sum, building) => {
      return sum + this.getBuildingLevel(building.id) * building.populationPerLevel;
    }, 0);

    return { used, cap };
  }

  private getUsedBuildingSlots() {
    return BUILDINGS.filter((building) => this.getBuildingLevel(building.id) > 0).length;
  }

  private applyClaimOnAccess() {
    const now = Date.now();
    const elapsedMs = Math.max(0, now - this.state.lastUpdatedAtMs);
    if (elapsedMs <= 0) return;

    const production = this.getProductionPerHour();
    const caps = this.getStorageCaps();
    const elapsedHours = elapsedMs / (1000 * 60 * 60);

    this.state.resources.ore = Math.min(caps.ore, this.state.resources.ore + production.ore * elapsedHours);
    this.state.resources.stone = Math.min(caps.stone, this.state.resources.stone + production.stone * elapsedHours);
    this.state.resources.iron = Math.min(caps.iron, this.state.resources.iron + production.iron * elapsedHours);

    this.state.lastUpdatedAtMs = now;
  }
}

function getBuildingDefinition(buildingId: BuildingId) {
  return BUILDINGS.find((building) => building.id === buildingId) ?? null;
}

/**
 * TODO(coinage-data): replace this seeded fallback with real city/account payload once backend city endpoints are connected.
 * This adapter intentionally mirrors MVP-only Coinage systems (Ore/Stone/Iron, HQ gating, fixed slots, F2P queue=2).
 */
function createFallbackMvpCityState(planet: SelectedPlanetRef): CityMvpState {
  const profile = planetProfileFromSeed(planet.seed);
  const seed = planet.seed >>> 0;
  const hqLevel = 1 + (seed % 2);

  return {
    owner: `Cmdr-${((seed % 9000) + 100).toString(36).toUpperCase()}`,
    archetype: profile.archetype,
    citySlotTotal: 10 + (seed % 6),
    buildings: {
      hq: hqLevel,
      mine: 1 + ((seed >> 4) % 2),
      quarry: 1 + ((seed >> 6) % 2),
      refinery: hqLevel >= 3 ? 1 : 0,
      warehouse: 1 + ((seed >> 8) % 2),
      housing_complex: 1 + ((seed >> 10) % 2),
    },
    resources: {
      ore: 260 + (seed % 180),
      stone: 190 + ((seed >> 4) % 140),
      iron: 90 + ((seed >> 8) % 90),
    },
    queue: [],
    lastUpdatedAtMs: Date.now(),
    baseStorage: { ore: 500, stone: 300, iron: 200 },
    basePopulationCap: 260,
  };
}

function formatDuration(durationMs: number) {
  const totalSeconds = Math.max(0, Math.ceil(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  if (minutes > 0) return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  return `${seconds}s`;
}
