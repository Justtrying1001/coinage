import type { ModeContext, RenderModeController } from '@/game/render/modes/RenderModeController';
import type { PlanetArchetype, SelectedPlanetRef } from '@/game/render/types';
import { planetProfileFromSeed } from '@/game/world/galaxyGenerator';

interface ResourceState {
  metal: number;
  crystal: number;
  deuterium: number;
  energy: number;
}

interface ProductionState {
  metal: number;
  crystal: number;
  deuterium: number;
  energy: number;
}

interface CapacityState {
  metal: number;
  crystal: number;
  deuterium: number;
  population: number;
  slots: number;
}

interface BuildingDefinition {
  id: string;
  name: string;
  group: 'economy' | 'industry' | 'military' | 'civic' | 'logistics';
  effect: string;
  baseCost: { metal: number; crystal: number; deuterium: number };
  baseBuildSeconds: number;
  maxLevel: number;
  prerequisites?: Array<{ id: string; level: number }>;
  slotCost?: number;
}

interface CityQueueEntry {
  id: string;
  targetLevel: number;
  remainingMs: number;
  totalMs: number;
}

interface BuildingState {
  id: string;
  level: number;
}

interface CityState {
  owner: string;
  archetype: PlanetArchetype;
  resources: ResourceState;
  production: ProductionState;
  capacity: CapacityState;
  usedSlots: number;
  population: number;
  buildings: BuildingState[];
  queue: CityQueueEntry[];
}

const BUILDINGS: BuildingDefinition[] = [
  { id: 'metal-mine', name: 'Metal Mine', group: 'economy', effect: 'Increases metal production.', baseCost: { metal: 120, crystal: 60, deuterium: 0 }, baseBuildSeconds: 75, maxLevel: 25 },
  { id: 'crystal-farm', name: 'Crystal Farm', group: 'economy', effect: 'Increases crystal production.', baseCost: { metal: 90, crystal: 120, deuterium: 0 }, baseBuildSeconds: 80, maxLevel: 25 },
  { id: 'fusion-well', name: 'Fusion Well', group: 'industry', effect: 'Adds deuterium and energy output.', baseCost: { metal: 220, crystal: 140, deuterium: 50 }, baseBuildSeconds: 110, maxLevel: 20 },
  {
    id: 'factory-core',
    name: 'Factory Core',
    group: 'industry',
    effect: 'Reduces future build times.',
    baseCost: { metal: 300, crystal: 260, deuterium: 60 },
    baseBuildSeconds: 130,
    maxLevel: 15,
    prerequisites: [{ id: 'metal-mine', level: 3 }],
  },
  { id: 'orbital-yard', name: 'Orbital Yard', group: 'military', effect: 'Unlocks fleet assembly throughput.', baseCost: { metal: 420, crystal: 260, deuterium: 180 }, baseBuildSeconds: 180, maxLevel: 15, prerequisites: [{ id: 'factory-core', level: 2 }] },
  {
    id: 'command-nexus',
    name: 'Command Nexus',
    group: 'civic',
    effect: 'Increases population cap and command efficiency.',
    baseCost: { metal: 260, crystal: 310, deuterium: 80 },
    baseBuildSeconds: 120,
    maxLevel: 20,
  },
  {
    id: 'district-hab',
    name: 'District Habitat',
    group: 'civic',
    effect: 'Adds available district slots.',
    baseCost: { metal: 180, crystal: 150, deuterium: 40 },
    baseBuildSeconds: 95,
    maxLevel: 18,
    slotCost: 0,
  },
  {
    id: 'cargo-port',
    name: 'Cargo Port',
    group: 'logistics',
    effect: 'Raises storage capacity for all resources.',
    baseCost: { metal: 140, crystal: 200, deuterium: 30 },
    baseBuildSeconds: 105,
    maxLevel: 20,
  },
];

const GROUP_LABELS: Record<BuildingDefinition['group'], string> = {
  economy: 'Economy',
  industry: 'Industry',
  military: 'Military',
  civic: 'Civic',
  logistics: 'Logistics',
};

export class CityFoundationMode implements RenderModeController {
  readonly id = 'city3d' as const;

  private root: HTMLElement | null = null;
  private queueTimer = 0;
  private selectedPlanetSummary: HTMLHeadingElement | null = null;
  private resourceStrip: HTMLElement | null = null;
  private capacitySummary: HTMLDivElement | null = null;
  private buildingsRoot: HTMLDivElement | null = null;
  private queueRoot: HTMLDivElement | null = null;
  private planetSelect: HTMLSelectElement | null = null;

  private state: CityState;

  constructor(
    private selectedPlanet: SelectedPlanetRef,
    private readonly context: ModeContext,
  ) {
    this.state = this.createCityState(this.selectedPlanet);
  }

  mount() {
    const root = document.createElement('section');
    root.className = 'city-management';

    root.append(
      this.createHeaderSection(),
      this.createResourceSection(),
      this.createMainLayout(),
    );

    this.context.host.appendChild(root);
    this.root = root;
    this.renderAll();
  }

  resize() {}

  update(deltaMs: number) {
    if (!this.state.queue.length) return;

    this.queueTimer += deltaMs;
    if (this.queueTimer < 1000) return;
    const elapsedSeconds = Math.floor(this.queueTimer / 1000);
    this.queueTimer -= elapsedSeconds * 1000;

    let dirty = false;
    const active = this.state.queue[0];
    if (active) {
      active.remainingMs = Math.max(0, active.remainingMs - elapsedSeconds * 1000);
      dirty = true;
      if (active.remainingMs <= 0) {
        this.finishQueueEntry(active);
      }
    }

    if (dirty) {
      this.applyPassiveIncome(elapsedSeconds);
      this.renderResources();
      this.renderCapacity();
      this.renderBuildings();
      this.renderQueue();
    }
  }

  setSelectedPlanet(nextPlanet: SelectedPlanetRef) {
    if (nextPlanet.id === this.selectedPlanet.id && nextPlanet.seed === this.selectedPlanet.seed) return;
    this.selectedPlanet = nextPlanet;
    this.state = this.createCityState(nextPlanet);
    this.queueTimer = 0;
    this.renderAll();
  }

  destroy() {
    this.root?.remove();
    this.root = null;
    this.selectedPlanetSummary = null;
    this.resourceStrip = null;
    this.capacitySummary = null;
    this.buildingsRoot = null;
    this.queueRoot = null;
    this.planetSelect = null;
  }

  private createHeaderSection() {
    const header = document.createElement('header');
    header.className = 'city-management__header';

    const identity = document.createElement('div');
    identity.className = 'city-management__identity';

    const title = document.createElement('h2');
    title.className = 'city-management__title';
    this.selectedPlanetSummary = title;

    const subtitle = document.createElement('p');
    subtitle.className = 'city-management__subtitle';
    subtitle.textContent = 'Planet management loop · non-spatial colony controls';

    identity.append(title, subtitle);

    const actions = document.createElement('div');
    actions.className = 'city-management__actions';

    const backPlanet = document.createElement('button');
    backPlanet.className = 'city-management__btn';
    backPlanet.textContent = 'Back to Planet';
    backPlanet.type = 'button';
    backPlanet.addEventListener('click', () => this.context.onRequestMode('planet3d'));

    const backGalaxy = document.createElement('button');
    backGalaxy.className = 'city-management__btn city-management__btn--ghost';
    backGalaxy.textContent = 'Back to Galaxy';
    backGalaxy.type = 'button';
    backGalaxy.addEventListener('click', () => this.context.onRequestMode('galaxy2d'));

    const planetSelect = document.createElement('select');
    planetSelect.className = 'city-management__select';
    const current = document.createElement('option');
    current.value = this.selectedPlanet.id;
    current.textContent = `Current: ${this.selectedPlanet.id.toUpperCase()}`;
    planetSelect.append(current);
    planetSelect.addEventListener('change', () => {
      if (planetSelect.value === this.selectedPlanet.id) return;
      // TODO(coinage): replace with actual owned-colony list once account state is available.
      this.context.onSelectPlanet({ id: planetSelect.value, seed: this.selectedPlanet.seed ^ 0x9e3779b9 });
    });
    this.planetSelect = planetSelect;

    actions.append(planetSelect, backPlanet, backGalaxy);
    header.append(identity, actions);
    return header;
  }

  private createResourceSection() {
    const strip = document.createElement('section');
    strip.className = 'city-management__resources';
    this.resourceStrip = strip;
    return strip;
  }

  private createMainLayout() {
    const grid = document.createElement('div');
    grid.className = 'city-management__layout';

    const buildings = document.createElement('section');
    buildings.className = 'city-management__buildings';

    const buildingsTitle = document.createElement('h3');
    buildingsTitle.className = 'city-management__section-title';
    buildingsTitle.textContent = 'Buildings';

    const buildingList = document.createElement('div');
    buildingList.className = 'city-management__building-list';
    this.buildingsRoot = buildingList;

    buildings.append(buildingsTitle, buildingList);

    const side = document.createElement('aside');
    side.className = 'city-management__side';

    const queueTitle = document.createElement('h3');
    queueTitle.className = 'city-management__section-title';
    queueTitle.textContent = 'Construction Queue';

    const queue = document.createElement('div');
    queue.className = 'city-management__queue';
    this.queueRoot = queue;

    const capTitle = document.createElement('h3');
    capTitle.className = 'city-management__section-title';
    capTitle.textContent = 'Capacity & Development';

    const capacity = document.createElement('div');
    capacity.className = 'city-management__capacity';
    this.capacitySummary = capacity;

    side.append(queueTitle, queue, capTitle, capacity);
    grid.append(buildings, side);

    return grid;
  }

  private renderAll() {
    this.renderHeader();
    this.renderResources();
    this.renderBuildings();
    this.renderQueue();
    this.renderCapacity();
  }

  private renderHeader() {
    if (!this.selectedPlanetSummary) return;
    const owner = this.state.owner;
    this.selectedPlanetSummary.textContent = `Planet ${this.selectedPlanet.id.toUpperCase()} · ${this.state.archetype} · Owner ${owner}`;
  }

  private renderResources() {
    if (!this.resourceStrip) return;
    const entries: Array<{ label: string; value: number; cap: number; prod: number }> = [
      { label: 'Metal', value: this.state.resources.metal, cap: this.state.capacity.metal, prod: this.state.production.metal },
      { label: 'Crystal', value: this.state.resources.crystal, cap: this.state.capacity.crystal, prod: this.state.production.crystal },
      { label: 'Deuterium', value: this.state.resources.deuterium, cap: this.state.capacity.deuterium, prod: this.state.production.deuterium },
      { label: 'Energy', value: this.state.resources.energy, cap: 99999, prod: this.state.production.energy },
    ];

    this.resourceStrip.innerHTML = '';
    for (const entry of entries) {
      const card = document.createElement('article');
      card.className = 'city-management__resource-card';

      const title = document.createElement('p');
      title.className = 'city-management__resource-title';
      title.textContent = entry.label;

      const current = document.createElement('p');
      current.className = 'city-management__resource-value';
      current.textContent = `${Math.floor(entry.value).toLocaleString()} / ${entry.cap.toLocaleString()}`;

      const prod = document.createElement('p');
      prod.className = 'city-management__resource-rate';
      prod.textContent = `+${Math.round(entry.prod).toLocaleString()} /h`;

      card.append(title, current, prod);
      this.resourceStrip.append(card);
    }
  }

  private renderBuildings() {
    if (!this.buildingsRoot) return;
    this.buildingsRoot.innerHTML = '';

    const levels = new Map(this.state.buildings.map((entry) => [entry.id, entry.level]));

    for (const [group, label] of Object.entries(GROUP_LABELS) as Array<[BuildingDefinition['group'], string]>) {
      const section = document.createElement('section');
      section.className = 'city-management__building-group';

      const title = document.createElement('h4');
      title.className = 'city-management__group-title';
      title.textContent = label;
      section.append(title);

      const cards = document.createElement('div');
      cards.className = 'city-management__cards';

      for (const building of BUILDINGS.filter((entry) => entry.group === group)) {
        const card = document.createElement('article');
        card.className = 'city-management__building-card';

        const level = levels.get(building.id) ?? 0;
        const nextLevel = level + 1;
        const cost = this.getUpgradeCost(building, nextLevel);
        const buildSeconds = this.getBuildSeconds(building, nextLevel);

        const heading = document.createElement('p');
        heading.className = 'city-management__building-name';
        heading.textContent = `${building.name} · Lv ${level}`;

        const effect = document.createElement('p');
        effect.className = 'city-management__building-effect';
        effect.textContent = building.effect;

        const costLine = document.createElement('p');
        costLine.className = 'city-management__meta';
        costLine.textContent = `Upgrade cost: M ${cost.metal} · C ${cost.crystal} · D ${cost.deuterium}`;

        const reqLine = document.createElement('p');
        reqLine.className = 'city-management__meta';
        reqLine.textContent = this.getPrerequisiteText(building, levels);

        const timeLine = document.createElement('p');
        timeLine.className = 'city-management__meta';
        timeLine.textContent = `Build time: ${formatDuration(buildSeconds * 1000)}`;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'city-management__upgrade';

        const disabledReason = this.getUpgradeBlockedReason(building, nextLevel, levels);
        button.textContent = disabledReason ? disabledReason : `Upgrade to Lv ${nextLevel}`;
        button.disabled = disabledReason !== null;
        button.addEventListener('click', () => {
          this.queueUpgrade(building, nextLevel, buildSeconds * 1000, cost);
        });

        card.append(heading, effect, costLine, reqLine, timeLine, button);
        cards.append(card);
      }

      section.append(cards);
      this.buildingsRoot.append(section);
    }
  }

  private renderQueue() {
    if (!this.queueRoot) return;
    this.queueRoot.innerHTML = '';

    if (!this.state.queue.length) {
      const empty = document.createElement('p');
      empty.className = 'city-management__empty';
      empty.textContent = 'Queue is empty. Start an upgrade to begin development.';
      this.queueRoot.append(empty);
      return;
    }

    this.state.queue.forEach((entry, index) => {
      const def = BUILDINGS.find((item) => item.id === entry.id);
      if (!def) return;

      const row = document.createElement('div');
      row.className = index === 0 ? 'city-management__queue-item is-active' : 'city-management__queue-item';

      const name = document.createElement('p');
      name.className = 'city-management__queue-name';
      name.textContent = `${def.name} → Lv ${entry.targetLevel}`;

      const timer = document.createElement('p');
      timer.className = 'city-management__queue-time';
      timer.textContent = index === 0 ? `Remaining: ${formatDuration(entry.remainingMs)}` : `Queued: ${formatDuration(entry.totalMs)}`;

      row.append(name, timer);
      this.queueRoot!.append(row);
    });
  }

  private renderCapacity() {
    if (!this.capacitySummary) return;

    const energyBalance = this.state.production.energy - this.calculateEnergyDemand();
    const details = [
      `District slots: ${this.state.usedSlots}/${this.state.capacity.slots}`,
      `Population: ${Math.floor(this.state.population).toLocaleString()} / ${this.state.capacity.population.toLocaleString()}`,
      `Energy balance: ${Math.round(energyBalance).toLocaleString()} /h`,
      `Queue depth: ${this.state.queue.length}`,
    ];

    this.capacitySummary.innerHTML = '';
    for (const detail of details) {
      const line = document.createElement('p');
      line.className = 'city-management__capacity-line';
      line.textContent = detail;
      this.capacitySummary.append(line);
    }
  }

  private queueUpgrade(building: BuildingDefinition, targetLevel: number, durationMs: number, cost: { metal: number; crystal: number; deuterium: number }) {
    if (!this.canAfford(cost)) return;

    this.state.resources.metal -= cost.metal;
    this.state.resources.crystal -= cost.crystal;
    this.state.resources.deuterium -= cost.deuterium;

    this.state.queue.push({
      id: building.id,
      targetLevel,
      remainingMs: durationMs,
      totalMs: durationMs,
    });

    this.renderResources();
    this.renderBuildings();
    this.renderQueue();
  }

  private finishQueueEntry(entry: CityQueueEntry) {
    this.state.queue.shift();
    const target = this.state.buildings.find((building) => building.id === entry.id);
    if (!target) return;

    target.level = Math.max(target.level, entry.targetLevel);

    this.recomputeFromBuildingLevels();
  }

  private recomputeProduction() {
    const metalLevel = this.getBuildingLevel('metal-mine');
    const crystalLevel = this.getBuildingLevel('crystal-farm');
    const fusionLevel = this.getBuildingLevel('fusion-well');
    const nexusLevel = this.getBuildingLevel('command-nexus');

    this.state.production.metal = 90 + metalLevel * 32 + nexusLevel * 9;
    this.state.production.crystal = 54 + crystalLevel * 25 + nexusLevel * 7;
    this.state.production.deuterium = 25 + fusionLevel * 16;
    this.state.production.energy = 180 + fusionLevel * 44 - metalLevel * 6 - crystalLevel * 4;

    this.state.population = Math.min(
      this.state.capacity.population,
      9000 + nexusLevel * 1400 + this.getBuildingLevel('district-hab') * 500,
    );
  }

  private applyPassiveIncome(elapsedSeconds: number) {
    const gainFactor = elapsedSeconds / 3600;
    this.state.resources.metal += this.state.production.metal * gainFactor;
    this.state.resources.crystal += this.state.production.crystal * gainFactor;
    this.state.resources.deuterium += this.state.production.deuterium * gainFactor;
    this.state.resources.energy = Math.max(0, this.state.resources.energy + this.state.production.energy * gainFactor);
    this.applyCapacityCaps();
  }

  private applyCapacityCaps() {
    this.state.resources.metal = Math.min(this.state.resources.metal, this.state.capacity.metal);
    this.state.resources.crystal = Math.min(this.state.resources.crystal, this.state.capacity.crystal);
    this.state.resources.deuterium = Math.min(this.state.resources.deuterium, this.state.capacity.deuterium);
  }

  private getUpgradeBlockedReason(building: BuildingDefinition, nextLevel: number, levels: Map<string, number>): string | null {
    if (nextLevel > building.maxLevel) return 'Max level reached';

    if (building.prerequisites) {
      const missing = building.prerequisites.find((entry) => (levels.get(entry.id) ?? 0) < entry.level);
      if (missing) {
        const required = BUILDINGS.find((item) => item.id === missing.id);
        return `Needs ${required?.name ?? missing.id} Lv ${missing.level}`;
      }
    }

    if (this.state.queue.length >= 5) return 'Queue full';

    const cost = this.getUpgradeCost(building, nextLevel);
    if (!this.canAfford(cost)) return 'Not enough resources';

    return null;
  }

  private getPrerequisiteText(building: BuildingDefinition, levels: Map<string, number>) {
    if (!building.prerequisites || !building.prerequisites.length) {
      return 'Prerequisites: none';
    }
    const labels = building.prerequisites.map((entry) => {
      const current = levels.get(entry.id) ?? 0;
      const required = BUILDINGS.find((item) => item.id === entry.id)?.name ?? entry.id;
      return `${required} ${current}/${entry.level}`;
    });
    return `Prerequisites: ${labels.join(' · ')}`;
  }

  private getUpgradeCost(building: BuildingDefinition, nextLevel: number) {
    const scale = Math.pow(1.3, Math.max(nextLevel - 1, 0));
    return {
      metal: Math.round(building.baseCost.metal * scale),
      crystal: Math.round(building.baseCost.crystal * scale),
      deuterium: Math.round(building.baseCost.deuterium * scale),
    };
  }

  private getBuildSeconds(building: BuildingDefinition, nextLevel: number) {
    const factoryBonus = this.getBuildingLevel('factory-core') * 0.04;
    const scaled = building.baseBuildSeconds * Math.pow(1.18, Math.max(nextLevel - 1, 0));
    return Math.max(10, Math.round(scaled * (1 - Math.min(factoryBonus, 0.55))));
  }

  private getBuildingLevel(id: string) {
    return this.state.buildings.find((entry) => entry.id === id)?.level ?? 0;
  }

  private canAfford(cost: { metal: number; crystal: number; deuterium: number }) {
    return this.state.resources.metal >= cost.metal && this.state.resources.crystal >= cost.crystal && this.state.resources.deuterium >= cost.deuterium;
  }

  private calculateEnergyDemand() {
    return this.getBuildingLevel('metal-mine') * 6 + this.getBuildingLevel('crystal-farm') * 4 + this.getBuildingLevel('orbital-yard') * 3;
  }

  private createCityState(planet: SelectedPlanetRef): CityState {
    const profile = planetProfileFromSeed(planet.seed);
    const seed = planet.seed >>> 0;
    const owner = `Cmdr-${((seed % 7919) + 100).toString(36).toUpperCase()}`;

    const initialBuildings = BUILDINGS.map((entry, index) => ({
      id: entry.id,
      level: index < 3 ? (seed >> (index * 3)) % 4 : (seed >> (index * 4)) % 3,
    }));

    const state: CityState = {
      owner,
      archetype: profile.archetype,
      resources: {
        metal: 900 + (seed % 700),
        crystal: 620 + ((seed >> 4) % 500),
        deuterium: 260 + ((seed >> 8) % 320),
        energy: 500 + ((seed >> 12) % 300),
      },
      production: {
        metal: 0,
        crystal: 0,
        deuterium: 0,
        energy: 0,
      },
      capacity: {
        metal: 2200,
        crystal: 1800,
        deuterium: 1300,
        population: 24000,
        slots: 8,
      },
      usedSlots: 3,
      population: 10800,
      buildings: initialBuildings,
      queue: [],
    };

    this.state = state;
    this.recomputeFromBuildingLevels();
    return this.state;
  }

  private recomputeFromBuildingLevels() {
    const factoryLevel = this.getBuildingLevel('factory-core');
    const districtLevel = this.getBuildingLevel('district-hab');
    const commandLevel = this.getBuildingLevel('command-nexus');
    const cargoLevel = this.getBuildingLevel('cargo-port');

    this.state.capacity.slots = 6 + districtLevel * 2;
    this.state.capacity.population = 22000 + commandLevel * 2200;
    const storageBoost = 1 + cargoLevel * 0.18;
    this.state.capacity.metal = Math.round(2200 * storageBoost);
    this.state.capacity.crystal = Math.round(1800 * storageBoost);
    this.state.capacity.deuterium = Math.round(1300 * storageBoost);

    this.state.usedSlots = Math.min(this.state.capacity.slots, 2 + Math.ceil((BUILDINGS.reduce((sum, def) => sum + this.getBuildingLevel(def.id), 0) + factoryLevel) / 6));

    this.recomputeProduction();
    this.applyCapacityCaps();
  }
}

function formatDuration(totalMs: number) {
  const sec = Math.max(0, Math.ceil(totalMs / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`;
  return `${s}s`;
}
