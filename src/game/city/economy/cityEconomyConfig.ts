export type EconomyResource = 'ore' | 'stone' | 'iron';
export type EconomyBuildingId =
  | 'hq'
  | 'mine'
  | 'quarry'
  | 'refinery'
  | 'warehouse'
  | 'housing_complex'
  | 'barracks'
  | 'combat_forge'
  | 'space_dock';

export type TroopId =
  | 'infantry'
  | 'shield_guard'
  | 'marksman'
  | 'raider_cavalry'
  | 'assault'
  | 'breacher'
  | 'interception_sentinel'
  | 'rapid_escort';

export type TroopCategory = 'ground' | 'air';

export type ResourceBundle = Record<EconomyResource, number>;

export interface BuildingLevelEffect {
  orePerHour?: number;
  stonePerHour?: number;
  ironPerHour?: number;
  storageMultiplier?: number;
  populationCapBonus?: number;
  unlocks?: EconomyBuildingId[];
}

export interface BuildingLevelCost {
  level: number;
  resources: ResourceBundle;
  buildSeconds: number;
  populationCost: number;
  effect: BuildingLevelEffect;
}

export interface BuildingPrerequisite {
  buildingId: EconomyBuildingId;
  minLevel: number;
}

export interface EconomyBuildingConfig {
  id: EconomyBuildingId;
  name: string;
  maxLevel: number;
  unlockAtHq: number;
  consumesPopulation: boolean;
  prerequisites?: BuildingPrerequisite[];
  levels: BuildingLevelCost[];
}

export interface TroopConfig {
  id: TroopId;
  name: string;
  category: TroopCategory;
  requiredBuildingId: EconomyBuildingId;
  requiredBuildingLevel: number;
  cost: ResourceBundle;
  trainingSeconds: number;
  populationCost: number;
}

export interface CityEconomyConfig {
  queueSlots: number;
  premiumQueueEnabled: false;
  holdingMultiplierEnabled: false;
  shardsEnabled: false;
  holdingMultiplier: 1;
  resources: {
    baseStorageCap: ResourceBundle;
    startingStock: ResourceBundle;
  };
  population: {
    baseCap: number;
  };
  buildings: Record<EconomyBuildingId, EconomyBuildingConfig>;
  troops: Record<TroopId, TroopConfig>;
}

const MAX_LEVEL = 20;

function populationBand(level: number, early: number, mid: number, late: number) {
  if (level <= 5) return early;
  if (level <= 12) return mid;
  return late;
}

function roundTo5(value: number) {
  return Math.max(5, Math.round(value / 5) * 5);
}

function buildLevels(params: {
  baseCost: ResourceBundle;
  costScale: number;
  baseSeconds: number;
  timeScale: number;
  populationCostByLevel: (level: number) => number;
  effectByLevel: (level: number) => BuildingLevelEffect;
}): BuildingLevelCost[] {
  return Array.from({ length: MAX_LEVEL }, (_, idx) => {
    const level = idx + 1;
    const costMult = Math.pow(params.costScale, idx);
    const timeMult = Math.pow(params.timeScale, idx);
    return {
      level,
      resources: {
        ore: Math.round(params.baseCost.ore * costMult),
        stone: Math.round(params.baseCost.stone * costMult),
        iron: Math.round(params.baseCost.iron * costMult),
      },
      buildSeconds: roundTo5(params.baseSeconds * timeMult),
      populationCost: params.populationCostByLevel(level),
      effect: params.effectByLevel(level),
    };
  });
}

function expProduction(base: number, scale: number, level: number) {
  return Math.round(base * Math.pow(scale, level - 1));
}

const CORE_ECONOMY_BUILDINGS: Record<
  'hq' | 'mine' | 'quarry' | 'refinery' | 'warehouse' | 'housing_complex',
  EconomyBuildingConfig
> = {
  hq: {
    id: 'hq',
    name: 'HQ',
    maxLevel: MAX_LEVEL,
    unlockAtHq: 1,
    consumesPopulation: true,
    levels: buildLevels({
      baseCost: { ore: 220, stone: 180, iron: 35 },
      costScale: 1.2,
      baseSeconds: 55,
      timeScale: 1.11,
      populationCostByLevel: (level) => populationBand(level, 1, 1, 2),
      effectByLevel: (level) => {
        if (level === 1) return { unlocks: ['mine', 'quarry', 'warehouse', 'housing_complex', 'barracks'] };
        if (level === 3) return { unlocks: ['refinery'] };
        if (level === 5) return { unlocks: ['combat_forge'] };
        if (level === 10) return { unlocks: ['space_dock'] };
        return {};
      },
    }),
  },
  mine: {
    id: 'mine',
    name: 'Mine',
    maxLevel: MAX_LEVEL,
    unlockAtHq: 1,
    consumesPopulation: true,
    levels: buildLevels({
      baseCost: { ore: 80, stone: 65, iron: 0 },
      costScale: 1.17,
      baseSeconds: 35,
      timeScale: 1.1,
      populationCostByLevel: (level) => populationBand(level, 1, 1, 2),
      effectByLevel: (level) => ({ orePerHour: expProduction(28, 1.15, level) }),
    }),
  },
  quarry: {
    id: 'quarry',
    name: 'Quarry',
    maxLevel: MAX_LEVEL,
    unlockAtHq: 1,
    consumesPopulation: true,
    levels: buildLevels({
      baseCost: { ore: 72, stone: 82, iron: 0 },
      costScale: 1.17,
      baseSeconds: 35,
      timeScale: 1.1,
      populationCostByLevel: (level) => populationBand(level, 1, 1, 2),
      effectByLevel: (level) => ({ stonePerHour: expProduction(24, 1.15, level) }),
    }),
  },
  refinery: {
    id: 'refinery',
    name: 'Refinery',
    maxLevel: MAX_LEVEL,
    unlockAtHq: 3,
    consumesPopulation: true,
    levels: buildLevels({
      baseCost: { ore: 150, stone: 125, iron: 45 },
      costScale: 1.18,
      baseSeconds: 45,
      timeScale: 1.11,
      populationCostByLevel: (level) => populationBand(level, 1, 1, 2),
      effectByLevel: (level) => ({ ironPerHour: expProduction(13, 1.16, level) }),
    }),
  },
  warehouse: {
    id: 'warehouse',
    name: 'Warehouse',
    maxLevel: MAX_LEVEL,
    unlockAtHq: 1,
    consumesPopulation: false,
    levels: buildLevels({
      baseCost: { ore: 100, stone: 90, iron: 12 },
      costScale: 1.18,
      baseSeconds: 35,
      timeScale: 1.1,
      populationCostByLevel: () => 0,
      effectByLevel: (level) => ({ storageMultiplier: Number((1 + level * 0.1 + level * level * 0.002).toFixed(2)) }),
    }),
  },
  housing_complex: {
    id: 'housing_complex',
    name: 'Housing Complex',
    maxLevel: MAX_LEVEL,
    unlockAtHq: 1,
    consumesPopulation: false,
    levels: buildLevels({
      baseCost: { ore: 95, stone: 88, iron: 12 },
      costScale: 1.18,
      baseSeconds: 35,
      timeScale: 1.1,
      populationCostByLevel: () => 0,
      effectByLevel: (level) => ({ populationCapBonus: 60 + level * 70 + level * level * 3 }),
    }),
  },
};

const MILITARY_BUILDINGS: Record<'barracks' | 'combat_forge' | 'space_dock', EconomyBuildingConfig> = {
  barracks: {
    id: 'barracks',
    name: 'Barracks',
    maxLevel: MAX_LEVEL,
    unlockAtHq: 1,
    consumesPopulation: true,
    levels: buildLevels({
      baseCost: { ore: 140, stone: 110, iron: 20 },
      costScale: 1.2,
      baseSeconds: 50,
      timeScale: 1.11,
      populationCostByLevel: () => 1,
      effectByLevel: () => ({}),
    }),
  },
  combat_forge: {
    id: 'combat_forge',
    name: 'Combat Forge',
    maxLevel: MAX_LEVEL,
    unlockAtHq: 5,
    consumesPopulation: true,
    prerequisites: [{ buildingId: 'barracks', minLevel: 8 }],
    levels: buildLevels({
      baseCost: { ore: 240, stone: 205, iron: 80 },
      costScale: 1.21,
      baseSeconds: 65,
      timeScale: 1.12,
      populationCostByLevel: (level) => populationBand(level, 1, 1, 2),
      effectByLevel: () => ({}),
    }),
  },
  space_dock: {
    id: 'space_dock',
    name: 'Space Dock',
    // Docs call this "Hub de déploiement"; Space Dock naming is a project alias.
    maxLevel: MAX_LEVEL,
    unlockAtHq: 10,
    consumesPopulation: true,
    prerequisites: [{ buildingId: 'combat_forge', minLevel: 5 }],
    levels: buildLevels({
      baseCost: { ore: 360, stone: 300, iron: 150 },
      costScale: 1.22,
      baseSeconds: 80,
      timeScale: 1.13,
      populationCostByLevel: (level) => populationBand(level, 1, 2, 2),
      effectByLevel: () => ({}),
    }),
  },
};

export const TROOP_CONFIG: Record<TroopId, TroopConfig> = {
  infantry: {
    id: 'infantry',
    name: 'Infantry',
    category: 'ground',
    requiredBuildingId: 'barracks',
    requiredBuildingLevel: 1,
    cost: { ore: 35, stone: 20, iron: 0 },
    trainingSeconds: 20,
    populationCost: 1,
  },
  shield_guard: {
    id: 'shield_guard',
    name: 'Shield Guard',
    category: 'ground',
    requiredBuildingId: 'barracks',
    requiredBuildingLevel: 5,
    cost: { ore: 70, stone: 55, iron: 10 },
    trainingSeconds: 35,
    populationCost: 2,
  },
  marksman: {
    id: 'marksman',
    name: 'Marksman',
    category: 'ground',
    requiredBuildingId: 'barracks',
    requiredBuildingLevel: 10,
    cost: { ore: 98, stone: 62, iron: 35 },
    trainingSeconds: 45,
    populationCost: 1,
  },
  raider_cavalry: {
    id: 'raider_cavalry',
    name: 'Raider Cavalry',
    category: 'ground',
    requiredBuildingId: 'barracks',
    requiredBuildingLevel: 15,
    cost: { ore: 140, stone: 95, iron: 55 },
    trainingSeconds: 60,
    populationCost: 2,
  },
  assault: {
    id: 'assault',
    name: 'Assault',
    category: 'ground',
    requiredBuildingId: 'combat_forge',
    requiredBuildingLevel: 1,
    cost: { ore: 165, stone: 120, iron: 85 },
    trainingSeconds: 70,
    populationCost: 2,
  },
  breacher: {
    id: 'breacher',
    name: 'Breacher',
    category: 'ground',
    requiredBuildingId: 'combat_forge',
    requiredBuildingLevel: 8,
    cost: { ore: 240, stone: 200, iron: 130 },
    trainingSeconds: 95,
    populationCost: 3,
  },
  interception_sentinel: {
    id: 'interception_sentinel',
    name: 'Interception Sentinel',
    category: 'air',
    requiredBuildingId: 'space_dock',
    requiredBuildingLevel: 1,
    cost: { ore: 210, stone: 150, iron: 125 },
    trainingSeconds: 85,
    populationCost: 3,
  },
  rapid_escort: {
    id: 'rapid_escort',
    name: 'Rapid Escort',
    category: 'air',
    requiredBuildingId: 'space_dock',
    requiredBuildingLevel: 5,
    cost: { ore: 275, stone: 190, iron: 170 },
    trainingSeconds: 105,
    populationCost: 2,
  },
};

export const CITY_ECONOMY_CONFIG: CityEconomyConfig = {
  queueSlots: 2,
  premiumQueueEnabled: false,
  holdingMultiplierEnabled: false,
  shardsEnabled: false,
  holdingMultiplier: 1,
  resources: {
    baseStorageCap: { ore: 500, stone: 300, iron: 200 },
    startingStock: { ore: 520, stone: 340, iron: 180 },
  },
  population: {
    baseCap: 120,
  },
  buildings: {
    ...CORE_ECONOMY_BUILDINGS,
    ...MILITARY_BUILDINGS,
  },
  troops: TROOP_CONFIG,
};

export const ECONOMY_BUILDING_ORDER: EconomyBuildingId[] = ['hq', 'mine', 'quarry', 'refinery', 'warehouse', 'housing_complex'];
export const MILITARY_BUILDING_ORDER: EconomyBuildingId[] = ['barracks', 'combat_forge', 'space_dock'];
