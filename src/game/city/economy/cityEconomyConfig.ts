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
  storageCap?: ResourceBundle;
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

export interface BuildingLevelBandPrerequisite {
  minTargetLevel: number;
  maxTargetLevel: number;
  minHqLevel?: number;
  prerequisites?: BuildingPrerequisite[];
}

export interface EconomyBuildingConfig {
  id: EconomyBuildingId;
  name: string;
  maxLevel: number;
  unlockAtHq: number;
  consumesPopulation: boolean;
  prerequisites?: BuildingPrerequisite[];
  levelBandPrerequisites?: BuildingLevelBandPrerequisite[];
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
  buildSecondsByLevel?: (level: number) => number;
  baseSeconds?: number;
  timeScale?: number;
  populationCostByLevel: (level: number) => number;
  effectByLevel: (level: number) => BuildingLevelEffect;
}): BuildingLevelCost[] {
  return Array.from({ length: MAX_LEVEL }, (_, idx) => {
    const level = idx + 1;
    const costMult = Math.pow(params.costScale, idx);
    const timeMult = Math.pow(params.timeScale ?? 1, idx);
    return {
      level,
      resources: {
        ore: Math.round(params.baseCost.ore * costMult),
        stone: Math.round(params.baseCost.stone * costMult),
        iron: Math.round(params.baseCost.iron * costMult),
      },
      buildSeconds: params.buildSecondsByLevel?.(level) ?? roundTo5((params.baseSeconds ?? 5) * timeMult),
      populationCost: params.populationCostByLevel(level),
      effect: params.effectByLevel(level),
    };
  });
}

function expProduction(base: number, scale: number, level: number) {
  return Math.round(base * Math.pow(scale, level - 1));
}

function stagedBuildSeconds(level: number, earlyBaseSeconds: number, weight = 1) {
  const earlyGrowth = 1.22;
  const lateGrowth = 1.9;
  const earlyBand = Math.min(level - 1, 9);
  const lateBand = Math.max(0, level - 10);
  const earlyValue = earlyBaseSeconds * Math.pow(earlyGrowth, earlyBand);
  const value = lateBand > 0 ? earlyValue * Math.pow(lateGrowth, lateBand) : earlyValue;
  return roundTo5(value * weight);
}

const WAREHOUSE_STORAGE_CAPS: ResourceBundle[] = [
  { ore: 1500, stone: 1200, iron: 800 },
  { ore: 2000, stone: 1600, iron: 1000 },
  { ore: 2600, stone: 2100, iron: 1300 },
  { ore: 3400, stone: 2700, iron: 1700 },
  { ore: 4400, stone: 3500, iron: 2200 },
  { ore: 5600, stone: 4500, iron: 2800 },
  { ore: 7200, stone: 5800, iron: 3600 },
  { ore: 9200, stone: 7400, iron: 4600 },
  { ore: 11700, stone: 9400, iron: 5900 },
  { ore: 14800, stone: 11800, iron: 7400 },
  { ore: 18600, stone: 14900, iron: 9300 },
  { ore: 23300, stone: 18600, iron: 11600 },
  { ore: 29100, stone: 23300, iron: 14500 },
  { ore: 36300, stone: 29000, iron: 18100 },
  { ore: 45200, stone: 36200, iron: 22600 },
  { ore: 56300, stone: 45000, iron: 28100 },
  { ore: 70100, stone: 56100, iron: 35100 },
  { ore: 87300, stone: 69800, iron: 43600 },
  { ore: 108700, stone: 86900, iron: 54300 },
  { ore: 135000, stone: 108000, iron: 67500 },
];

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
      buildSecondsByLevel: (level) => stagedBuildSeconds(level, 55),
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
    levelBandPrerequisites: [
      { minTargetLevel: 6, maxTargetLevel: 10, minHqLevel: 4, prerequisites: [{ buildingId: 'quarry', minLevel: 5 }] },
      { minTargetLevel: 11, maxTargetLevel: 15, minHqLevel: 8, prerequisites: [{ buildingId: 'warehouse', minLevel: 6 }] },
      { minTargetLevel: 16, maxTargetLevel: 20, minHqLevel: 12, prerequisites: [{ buildingId: 'refinery', minLevel: 8 }] },
    ],
    levels: buildLevels({
      baseCost: { ore: 76, stone: 60, iron: 0 },
      costScale: 1.16,
      buildSecondsByLevel: (level) => stagedBuildSeconds(level, 30),
      populationCostByLevel: (level) => populationBand(level, 1, 1, 2),
      effectByLevel: (level) => ({ orePerHour: expProduction(30, 1.15, level) }),
    }),
  },
  quarry: {
    id: 'quarry',
    name: 'Quarry',
    maxLevel: MAX_LEVEL,
    unlockAtHq: 1,
    consumesPopulation: true,
    levelBandPrerequisites: [
      { minTargetLevel: 6, maxTargetLevel: 10, minHqLevel: 4, prerequisites: [{ buildingId: 'mine', minLevel: 5 }] },
      { minTargetLevel: 11, maxTargetLevel: 15, minHqLevel: 8, prerequisites: [{ buildingId: 'warehouse', minLevel: 6 }] },
      { minTargetLevel: 16, maxTargetLevel: 20, minHqLevel: 12, prerequisites: [{ buildingId: 'refinery', minLevel: 8 }] },
    ],
    levels: buildLevels({
      baseCost: { ore: 68, stone: 78, iron: 0 },
      costScale: 1.16,
      buildSecondsByLevel: (level) => stagedBuildSeconds(level, 30),
      populationCostByLevel: (level) => populationBand(level, 1, 1, 2),
      effectByLevel: (level) => ({ stonePerHour: expProduction(26, 1.15, level) }),
    }),
  },
  refinery: {
    id: 'refinery',
    name: 'Refinery',
    maxLevel: MAX_LEVEL,
    unlockAtHq: 3,
    consumesPopulation: true,
    prerequisites: [
      { buildingId: 'mine', minLevel: 4 },
      { buildingId: 'quarry', minLevel: 4 },
    ],
    levelBandPrerequisites: [
      { minTargetLevel: 6, maxTargetLevel: 10, minHqLevel: 6, prerequisites: [{ buildingId: 'warehouse', minLevel: 5 }] },
      {
        minTargetLevel: 11,
        maxTargetLevel: 15,
        minHqLevel: 10,
        prerequisites: [
          { buildingId: 'mine', minLevel: 10 },
          { buildingId: 'quarry', minLevel: 10 },
        ],
      },
      {
        minTargetLevel: 16,
        maxTargetLevel: 20,
        minHqLevel: 14,
        prerequisites: [
          { buildingId: 'warehouse', minLevel: 12 },
          { buildingId: 'housing_complex', minLevel: 10 },
        ],
      },
    ],
    levels: buildLevels({
      baseCost: { ore: 125, stone: 105, iron: 35 },
      costScale: 1.165,
      buildSecondsByLevel: (level) => stagedBuildSeconds(level, 45),
      populationCostByLevel: (level) => populationBand(level, 1, 1, 2),
      effectByLevel: (level) => ({ ironPerHour: expProduction(14, 1.17, level) }),
    }),
  },
  warehouse: {
    id: 'warehouse',
    name: 'Warehouse',
    maxLevel: MAX_LEVEL,
    unlockAtHq: 1,
    consumesPopulation: false,
    levelBandPrerequisites: [
      { minTargetLevel: 6, maxTargetLevel: 10, minHqLevel: 5 },
      { minTargetLevel: 11, maxTargetLevel: 15, minHqLevel: 9, prerequisites: [{ buildingId: 'housing_complex', minLevel: 5 }] },
      { minTargetLevel: 16, maxTargetLevel: 20, minHqLevel: 13, prerequisites: [{ buildingId: 'refinery', minLevel: 8 }] },
    ],
    levels: buildLevels({
      baseCost: { ore: 90, stone: 84, iron: 10 },
      costScale: 1.17,
      buildSecondsByLevel: (level) => stagedBuildSeconds(level, 35),
      populationCostByLevel: () => 0,
      effectByLevel: (level) => ({ storageCap: WAREHOUSE_STORAGE_CAPS[level - 1] }),
    }),
  },
  housing_complex: {
    id: 'housing_complex',
    name: 'Housing Complex',
    maxLevel: MAX_LEVEL,
    unlockAtHq: 1,
    consumesPopulation: false,
    levelBandPrerequisites: [
      { minTargetLevel: 6, maxTargetLevel: 10, minHqLevel: 4, prerequisites: [{ buildingId: 'quarry', minLevel: 4 }] },
      { minTargetLevel: 11, maxTargetLevel: 15, minHqLevel: 8, prerequisites: [{ buildingId: 'warehouse', minLevel: 6 }] },
      { minTargetLevel: 16, maxTargetLevel: 20, minHqLevel: 12, prerequisites: [{ buildingId: 'refinery', minLevel: 7 }] },
    ],
    levels: buildLevels({
      baseCost: { ore: 90, stone: 84, iron: 10 },
      costScale: 1.17,
      buildSecondsByLevel: (level) => stagedBuildSeconds(level, 35),
      populationCostByLevel: () => 0,
      effectByLevel: (level) => ({ populationCapBonus: 140 + level * 85 + level * level * 4 }),
    }),
  },
};

const MILITARY_BUILDINGS: Record<'barracks' | 'combat_forge' | 'space_dock', EconomyBuildingConfig> = {
  barracks: {
    id: 'barracks',
    name: 'Barracks',
    maxLevel: MAX_LEVEL,
    unlockAtHq: 2,
    consumesPopulation: true,
    prerequisites: [{ buildingId: 'housing_complex', minLevel: 2 }],
    levelBandPrerequisites: [
      { minTargetLevel: 6, maxTargetLevel: 10, minHqLevel: 6, prerequisites: [{ buildingId: 'mine', minLevel: 6 }] },
      { minTargetLevel: 11, maxTargetLevel: 15, minHqLevel: 10, prerequisites: [{ buildingId: 'quarry', minLevel: 8 }] },
      { minTargetLevel: 16, maxTargetLevel: 20, minHqLevel: 14, prerequisites: [{ buildingId: 'housing_complex', minLevel: 12 }] },
    ],
    levels: buildLevels({
      baseCost: { ore: 140, stone: 110, iron: 20 },
      costScale: 1.2,
      buildSecondsByLevel: (level) => stagedBuildSeconds(level, 50),
      populationCostByLevel: () => 1,
      effectByLevel: () => ({}),
    }),
  },
  combat_forge: {
    id: 'combat_forge',
    name: 'Combat Forge',
    maxLevel: MAX_LEVEL,
    unlockAtHq: 6,
    consumesPopulation: true,
    prerequisites: [
      { buildingId: 'barracks', minLevel: 8 },
      { buildingId: 'refinery', minLevel: 5 },
    ],
    levelBandPrerequisites: [
      { minTargetLevel: 6, maxTargetLevel: 10, minHqLevel: 10, prerequisites: [{ buildingId: 'warehouse', minLevel: 8 }] },
      { minTargetLevel: 11, maxTargetLevel: 15, minHqLevel: 13, prerequisites: [{ buildingId: 'barracks', minLevel: 12 }] },
      { minTargetLevel: 16, maxTargetLevel: 20, minHqLevel: 16, prerequisites: [{ buildingId: 'housing_complex', minLevel: 14 }] },
    ],
    levels: buildLevels({
      baseCost: { ore: 240, stone: 205, iron: 80 },
      costScale: 1.21,
      buildSecondsByLevel: (level) => stagedBuildSeconds(level, 65),
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
    prerequisites: [
      { buildingId: 'combat_forge', minLevel: 5 },
      { buildingId: 'refinery', minLevel: 6 },
    ],
    levelBandPrerequisites: [
      { minTargetLevel: 6, maxTargetLevel: 10, minHqLevel: 13, prerequisites: [{ buildingId: 'warehouse', minLevel: 10 }] },
      { minTargetLevel: 11, maxTargetLevel: 15, minHqLevel: 16, prerequisites: [{ buildingId: 'combat_forge', minLevel: 10 }] },
      { minTargetLevel: 16, maxTargetLevel: 20, minHqLevel: 18, prerequisites: [{ buildingId: 'housing_complex', minLevel: 14 }] },
    ],
    levels: buildLevels({
      baseCost: { ore: 360, stone: 300, iron: 150 },
      costScale: 1.22,
      buildSecondsByLevel: (level) => stagedBuildSeconds(level, 80),
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
    cost: { ore: 30, stone: 18, iron: 0 },
    trainingSeconds: 20,
    populationCost: 1,
  },
  shield_guard: {
    id: 'shield_guard',
    name: 'Shield Guard',
    category: 'ground',
    requiredBuildingId: 'barracks',
    requiredBuildingLevel: 5,
    cost: { ore: 62, stone: 48, iron: 10 },
    trainingSeconds: 35,
    populationCost: 2,
  },
  marksman: {
    id: 'marksman',
    name: 'Marksman',
    category: 'ground',
    requiredBuildingId: 'barracks',
    requiredBuildingLevel: 10,
    cost: { ore: 90, stone: 56, iron: 30 },
    trainingSeconds: 45,
    populationCost: 1,
  },
  raider_cavalry: {
    id: 'raider_cavalry',
    name: 'Raider Cavalry',
    category: 'ground',
    requiredBuildingId: 'barracks',
    requiredBuildingLevel: 15,
    cost: { ore: 128, stone: 88, iron: 48 },
    trainingSeconds: 60,
    populationCost: 2,
  },
  assault: {
    id: 'assault',
    name: 'Assault',
    category: 'ground',
    requiredBuildingId: 'combat_forge',
    requiredBuildingLevel: 1,
    cost: { ore: 155, stone: 110, iron: 80 },
    trainingSeconds: 70,
    populationCost: 2,
  },
  breacher: {
    id: 'breacher',
    name: 'Breacher',
    category: 'ground',
    requiredBuildingId: 'combat_forge',
    requiredBuildingLevel: 8,
    cost: { ore: 225, stone: 185, iron: 120 },
    trainingSeconds: 95,
    populationCost: 3,
  },
  interception_sentinel: {
    id: 'interception_sentinel',
    name: 'Interception Sentinel',
    category: 'air',
    requiredBuildingId: 'space_dock',
    requiredBuildingLevel: 1,
    cost: { ore: 195, stone: 140, iron: 115 },
    trainingSeconds: 85,
    populationCost: 3,
  },
  rapid_escort: {
    id: 'rapid_escort',
    name: 'Rapid Escort',
    category: 'air',
    requiredBuildingId: 'space_dock',
    requiredBuildingLevel: 5,
    cost: { ore: 255, stone: 175, iron: 155 },
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
