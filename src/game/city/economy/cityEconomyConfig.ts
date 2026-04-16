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

function defineLevels(rows: Omit<BuildingLevelCost, 'level'>[]): BuildingLevelCost[] {
  if (rows.length !== MAX_LEVEL) {
    throw new Error(`Expected ${MAX_LEVEL} levels, received ${rows.length}`);
  }
  return rows.map((row, idx) => ({ ...row, level: idx + 1 }));
}

function defineScaledLevels(input: {
  baseCost: ResourceBundle;
  costScale: number;
  baseSeconds: number;
  timeScale: number;
  populationCost: number;
}): BuildingLevelCost[] {
  return defineLevels(
    Array.from({ length: MAX_LEVEL }, (_, idx) => {
      const mult = Math.pow(input.costScale, idx);
      const timeMult = Math.pow(input.timeScale, idx);
      return {
        resources: {
          ore: Math.round(input.baseCost.ore * mult),
          stone: Math.round(input.baseCost.stone * mult),
          iron: Math.round(input.baseCost.iron * mult),
        },
        buildSeconds: Math.round(input.baseSeconds * timeMult),
        populationCost: input.populationCost,
        effect: {},
      };
    }),
  );
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
    levels: defineLevels([
      { resources: { ore: 240, stone: 200, iron: 40 }, buildSeconds: 60, populationCost: 1, effect: { unlocks: ['mine', 'quarry', 'warehouse', 'housing_complex', 'barracks'] } },
      { resources: { ore: 320, stone: 270, iron: 55 }, buildSeconds: 90, populationCost: 1, effect: {} },
      { resources: { ore: 430, stone: 360, iron: 75 }, buildSeconds: 130, populationCost: 1, effect: { unlocks: ['refinery'] } },
      { resources: { ore: 570, stone: 475, iron: 100 }, buildSeconds: 180, populationCost: 1, effect: {} },
      { resources: { ore: 760, stone: 630, iron: 135 }, buildSeconds: 240, populationCost: 2, effect: { unlocks: ['combat_forge'] } },
      { resources: { ore: 1000, stone: 830, iron: 180 }, buildSeconds: 315, populationCost: 2, effect: {} },
      { resources: { ore: 1320, stone: 1100, iron: 240 }, buildSeconds: 405, populationCost: 2, effect: {} },
      { resources: { ore: 1740, stone: 1450, iron: 320 }, buildSeconds: 510, populationCost: 2, effect: {} },
      { resources: { ore: 2290, stone: 1920, iron: 420 }, buildSeconds: 630, populationCost: 3, effect: {} },
      { resources: { ore: 3020, stone: 2530, iron: 560 }, buildSeconds: 765, populationCost: 3, effect: { unlocks: ['space_dock'] } },
      { resources: { ore: 3980, stone: 3330, iron: 740 }, buildSeconds: 915, populationCost: 3, effect: {} },
      { resources: { ore: 5250, stone: 4390, iron: 980 }, buildSeconds: 1080, populationCost: 3, effect: {} },
      { resources: { ore: 6920, stone: 5790, iron: 1290 }, buildSeconds: 1260, populationCost: 4, effect: {} },
      { resources: { ore: 9120, stone: 7640, iron: 1710 }, buildSeconds: 1455, populationCost: 4, effect: {} },
      { resources: { ore: 12020, stone: 10080, iron: 2260 }, buildSeconds: 1665, populationCost: 4, effect: {} },
      { resources: { ore: 15840, stone: 13290, iron: 2980 }, buildSeconds: 1890, populationCost: 4, effect: {} },
      { resources: { ore: 20880, stone: 17540, iron: 3930 }, buildSeconds: 2130, populationCost: 5, effect: {} },
      { resources: { ore: 27530, stone: 23150, iron: 5190 }, buildSeconds: 2385, populationCost: 5, effect: {} },
      { resources: { ore: 36310, stone: 30570, iron: 6850 }, buildSeconds: 2655, populationCost: 5, effect: {} },
      { resources: { ore: 47900, stone: 40350, iron: 9040 }, buildSeconds: 2940, populationCost: 6, effect: {} },
    ]),
  },
  mine: {
    id: 'mine',
    name: 'Mine',
    maxLevel: MAX_LEVEL,
    unlockAtHq: 1,
    consumesPopulation: true,
    levels: defineLevels([
      { resources: { ore: 110, stone: 70, iron: 0 }, buildSeconds: 40, populationCost: 1, effect: { orePerHour: 20 } },
      { resources: { ore: 145, stone: 93, iron: 0 }, buildSeconds: 55, populationCost: 1, effect: { orePerHour: 28 } },
      { resources: { ore: 192, stone: 122, iron: 0 }, buildSeconds: 72, populationCost: 1, effect: { orePerHour: 37 } },
      { resources: { ore: 253, stone: 161, iron: 0 }, buildSeconds: 91, populationCost: 1, effect: { orePerHour: 47 } },
      { resources: { ore: 334, stone: 213, iron: 0 }, buildSeconds: 113, populationCost: 1, effect: { orePerHour: 58 } },
      { resources: { ore: 441, stone: 281, iron: 0 }, buildSeconds: 138, populationCost: 1, effect: { orePerHour: 70 } },
      { resources: { ore: 582, stone: 371, iron: 0 }, buildSeconds: 166, populationCost: 2, effect: { orePerHour: 83 } },
      { resources: { ore: 768, stone: 490, iron: 0 }, buildSeconds: 197, populationCost: 2, effect: { orePerHour: 97 } },
      { resources: { ore: 1014, stone: 646, iron: 0 }, buildSeconds: 231, populationCost: 2, effect: { orePerHour: 112 } },
      { resources: { ore: 1338, stone: 853, iron: 0 }, buildSeconds: 269, populationCost: 2, effect: { orePerHour: 128 } },
      { resources: { ore: 1766, stone: 1126, iron: 0 }, buildSeconds: 310, populationCost: 2, effect: { orePerHour: 145 } },
      { resources: { ore: 2331, stone: 1486, iron: 0 }, buildSeconds: 354, populationCost: 2, effect: { orePerHour: 163 } },
      { resources: { ore: 3077, stone: 1961, iron: 0 }, buildSeconds: 402, populationCost: 3, effect: { orePerHour: 182 } },
      { resources: { ore: 4062, stone: 2588, iron: 0 }, buildSeconds: 454, populationCost: 3, effect: { orePerHour: 202 } },
      { resources: { ore: 5362, stone: 3416, iron: 0 }, buildSeconds: 510, populationCost: 3, effect: { orePerHour: 223 } },
      { resources: { ore: 7077, stone: 4509, iron: 0 }, buildSeconds: 570, populationCost: 3, effect: { orePerHour: 245 } },
      { resources: { ore: 9342, stone: 5952, iron: 0 }, buildSeconds: 634, populationCost: 4, effect: { orePerHour: 268 } },
      { resources: { ore: 12331, stone: 7856, iron: 0 }, buildSeconds: 703, populationCost: 4, effect: { orePerHour: 292 } },
      { resources: { ore: 16277, stone: 10370, iron: 0 }, buildSeconds: 776, populationCost: 4, effect: { orePerHour: 317 } },
      { resources: { ore: 21486, stone: 13688, iron: 0 }, buildSeconds: 854, populationCost: 4, effect: { orePerHour: 343 } },
    ]),
  },
  quarry: {
    id: 'quarry',
    name: 'Quarry',
    maxLevel: MAX_LEVEL,
    unlockAtHq: 1,
    consumesPopulation: true,
    levels: defineLevels([
      { resources: { ore: 85, stone: 105, iron: 0 }, buildSeconds: 42, populationCost: 1, effect: { stonePerHour: 16 } },
      { resources: { ore: 112, stone: 139, iron: 0 }, buildSeconds: 58, populationCost: 1, effect: { stonePerHour: 23 } },
      { resources: { ore: 148, stone: 183, iron: 0 }, buildSeconds: 75, populationCost: 1, effect: { stonePerHour: 31 } },
      { resources: { ore: 196, stone: 242, iron: 0 }, buildSeconds: 95, populationCost: 1, effect: { stonePerHour: 40 } },
      { resources: { ore: 258, stone: 319, iron: 0 }, buildSeconds: 117, populationCost: 1, effect: { stonePerHour: 50 } },
      { resources: { ore: 341, stone: 421, iron: 0 }, buildSeconds: 142, populationCost: 1, effect: { stonePerHour: 61 } },
      { resources: { ore: 450, stone: 556, iron: 0 }, buildSeconds: 170, populationCost: 2, effect: { stonePerHour: 73 } },
      { resources: { ore: 594, stone: 734, iron: 0 }, buildSeconds: 201, populationCost: 2, effect: { stonePerHour: 86 } },
      { resources: { ore: 784, stone: 969, iron: 0 }, buildSeconds: 236, populationCost: 2, effect: { stonePerHour: 100 } },
      { resources: { ore: 1034, stone: 1279, iron: 0 }, buildSeconds: 274, populationCost: 2, effect: { stonePerHour: 115 } },
      { resources: { ore: 1365, stone: 1688, iron: 0 }, buildSeconds: 315, populationCost: 2, effect: { stonePerHour: 131 } },
      { resources: { ore: 1801, stone: 2228, iron: 0 }, buildSeconds: 360, populationCost: 2, effect: { stonePerHour: 148 } },
      { resources: { ore: 2378, stone: 2941, iron: 0 }, buildSeconds: 409, populationCost: 3, effect: { stonePerHour: 166 } },
      { resources: { ore: 3138, stone: 3882, iron: 0 }, buildSeconds: 462, populationCost: 3, effect: { stonePerHour: 185 } },
      { resources: { ore: 4143, stone: 5124, iron: 0 }, buildSeconds: 519, populationCost: 3, effect: { stonePerHour: 205 } },
      { resources: { ore: 5470, stone: 6764, iron: 0 }, buildSeconds: 580, populationCost: 3, effect: { stonePerHour: 226 } },
      { resources: { ore: 7220, stone: 8929, iron: 0 }, buildSeconds: 646, populationCost: 4, effect: { stonePerHour: 248 } },
      { resources: { ore: 9531, stone: 11787, iron: 0 }, buildSeconds: 717, populationCost: 4, effect: { stonePerHour: 271 } },
      { resources: { ore: 12581, stone: 15559, iron: 0 }, buildSeconds: 793, populationCost: 4, effect: { stonePerHour: 295 } },
      { resources: { ore: 16607, stone: 20538, iron: 0 }, buildSeconds: 874, populationCost: 4, effect: { stonePerHour: 320 } },
    ]),
  },
  refinery: {
    id: 'refinery',
    name: 'Refinery',
    maxLevel: MAX_LEVEL,
    unlockAtHq: 3,
    consumesPopulation: true,
    levels: defineLevels([
      { resources: { ore: 210, stone: 170, iron: 35 }, buildSeconds: 55, populationCost: 1, effect: { ironPerHour: 8 } },
      { resources: { ore: 278, stone: 225, iron: 47 }, buildSeconds: 74, populationCost: 1, effect: { ironPerHour: 12 } },
      { resources: { ore: 367, stone: 297, iron: 62 }, buildSeconds: 95, populationCost: 1, effect: { ironPerHour: 17 } },
      { resources: { ore: 484, stone: 392, iron: 82 }, buildSeconds: 119, populationCost: 1, effect: { ironPerHour: 23 } },
      { resources: { ore: 639, stone: 517, iron: 108 }, buildSeconds: 146, populationCost: 1, effect: { ironPerHour: 30 } },
      { resources: { ore: 843, stone: 683, iron: 143 }, buildSeconds: 176, populationCost: 1, effect: { ironPerHour: 38 } },
      { resources: { ore: 1112, stone: 901, iron: 189 }, buildSeconds: 209, populationCost: 2, effect: { ironPerHour: 47 } },
      { resources: { ore: 1468, stone: 1190, iron: 249 }, buildSeconds: 246, populationCost: 2, effect: { ironPerHour: 57 } },
      { resources: { ore: 1938, stone: 1571, iron: 329 }, buildSeconds: 286, populationCost: 2, effect: { ironPerHour: 68 } },
      { resources: { ore: 2558, stone: 2074, iron: 434 }, buildSeconds: 330, populationCost: 2, effect: { ironPerHour: 80 } },
      { resources: { ore: 3377, stone: 2738, iron: 573 }, buildSeconds: 378, populationCost: 2, effect: { ironPerHour: 93 } },
      { resources: { ore: 4457, stone: 3615, iron: 756 }, buildSeconds: 430, populationCost: 2, effect: { ironPerHour: 107 } },
      { resources: { ore: 5884, stone: 4772, iron: 998 }, buildSeconds: 486, populationCost: 3, effect: { ironPerHour: 122 } },
      { resources: { ore: 7768, stone: 6300, iron: 1317 }, buildSeconds: 546, populationCost: 3, effect: { ironPerHour: 138 } },
      { resources: { ore: 10254, stone: 8316, iron: 1738 }, buildSeconds: 610, populationCost: 3, effect: { ironPerHour: 155 } },
      { resources: { ore: 13535, stone: 10978, iron: 2294 }, buildSeconds: 678, populationCost: 3, effect: { ironPerHour: 173 } },
      { resources: { ore: 17866, stone: 14492, iron: 3028 }, buildSeconds: 750, populationCost: 4, effect: { ironPerHour: 192 } },
      { resources: { ore: 23582, stone: 19130, iron: 3997 }, buildSeconds: 826, populationCost: 4, effect: { ironPerHour: 212 } },
      { resources: { ore: 31129, stone: 25251, iron: 5276 }, buildSeconds: 906, populationCost: 4, effect: { ironPerHour: 233 } },
      { resources: { ore: 41090, stone: 33331, iron: 6964 }, buildSeconds: 990, populationCost: 4, effect: { ironPerHour: 255 } },
    ]),
  },
  warehouse: {
    id: 'warehouse',
    name: 'Warehouse',
    maxLevel: MAX_LEVEL,
    unlockAtHq: 1,
    consumesPopulation: false,
    levels: defineLevels([
      { resources: { ore: 130, stone: 120, iron: 20 }, buildSeconds: 45, populationCost: 0, effect: { storageMultiplier: 1.15 } },
      { resources: { ore: 172, stone: 158, iron: 26 }, buildSeconds: 62, populationCost: 0, effect: { storageMultiplier: 1.32 } },
      { resources: { ore: 228, stone: 209, iron: 34 }, buildSeconds: 81, populationCost: 0, effect: { storageMultiplier: 1.5 } },
      { resources: { ore: 301, stone: 276, iron: 45 }, buildSeconds: 103, populationCost: 0, effect: { storageMultiplier: 1.69 } },
      { resources: { ore: 397, stone: 364, iron: 59 }, buildSeconds: 127, populationCost: 0, effect: { storageMultiplier: 1.89 } },
      { resources: { ore: 524, stone: 480, iron: 78 }, buildSeconds: 154, populationCost: 0, effect: { storageMultiplier: 2.1 } },
      { resources: { ore: 692, stone: 634, iron: 103 }, buildSeconds: 184, populationCost: 0, effect: { storageMultiplier: 2.32 } },
      { resources: { ore: 914, stone: 836, iron: 136 }, buildSeconds: 217, populationCost: 0, effect: { storageMultiplier: 2.55 } },
      { resources: { ore: 1206, stone: 1104, iron: 179 }, buildSeconds: 253, populationCost: 0, effect: { storageMultiplier: 2.79 } },
      { resources: { ore: 1592, stone: 1457, iron: 237 }, buildSeconds: 292, populationCost: 0, effect: { storageMultiplier: 3.04 } },
      { resources: { ore: 2102, stone: 1924, iron: 312 }, buildSeconds: 334, populationCost: 0, effect: { storageMultiplier: 3.3 } },
      { resources: { ore: 2774, stone: 2542, iron: 412 }, buildSeconds: 379, populationCost: 0, effect: { storageMultiplier: 3.57 } },
      { resources: { ore: 3661, stone: 3359, iron: 544 }, buildSeconds: 427, populationCost: 0, effect: { storageMultiplier: 3.85 } },
      { resources: { ore: 4832, stone: 4438, iron: 718 }, buildSeconds: 478, populationCost: 0, effect: { storageMultiplier: 4.14 } },
      { resources: { ore: 6378, stone: 5862, iron: 948 }, buildSeconds: 532, populationCost: 0, effect: { storageMultiplier: 4.44 } },
      { resources: { ore: 8419, stone: 7743, iron: 1251 }, buildSeconds: 589, populationCost: 0, effect: { storageMultiplier: 4.75 } },
      { resources: { ore: 11113, stone: 10227, iron: 1652 }, buildSeconds: 649, populationCost: 0, effect: { storageMultiplier: 5.07 } },
      { resources: { ore: 14669, stone: 13505, iron: 2181 }, buildSeconds: 712, populationCost: 0, effect: { storageMultiplier: 5.4 } },
      { resources: { ore: 19364, stone: 17835, iron: 2879 }, buildSeconds: 778, populationCost: 0, effect: { storageMultiplier: 5.74 } },
      { resources: { ore: 25564, stone: 23552, iron: 3801 }, buildSeconds: 847, populationCost: 0, effect: { storageMultiplier: 6.09 } },
    ]),
  },
  housing_complex: {
    id: 'housing_complex',
    name: 'Housing Complex',
    maxLevel: MAX_LEVEL,
    unlockAtHq: 1,
    consumesPopulation: false,
    levels: defineLevels([
      { resources: { ore: 125, stone: 118, iron: 18 }, buildSeconds: 44, populationCost: 0, effect: { populationCapBonus: 80 } },
      { resources: { ore: 165, stone: 156, iron: 24 }, buildSeconds: 61, populationCost: 0, effect: { populationCapBonus: 170 } },
      { resources: { ore: 218, stone: 206, iron: 32 }, buildSeconds: 80, populationCost: 0, effect: { populationCapBonus: 270 } },
      { resources: { ore: 288, stone: 272, iron: 42 }, buildSeconds: 102, populationCost: 0, effect: { populationCapBonus: 380 } },
      { resources: { ore: 380, stone: 359, iron: 56 }, buildSeconds: 126, populationCost: 0, effect: { populationCapBonus: 500 } },
      { resources: { ore: 502, stone: 474, iron: 74 }, buildSeconds: 153, populationCost: 0, effect: { populationCapBonus: 630 } },
      { resources: { ore: 663, stone: 626, iron: 98 }, buildSeconds: 183, populationCost: 0, effect: { populationCapBonus: 770 } },
      { resources: { ore: 875, stone: 826, iron: 129 }, buildSeconds: 216, populationCost: 0, effect: { populationCapBonus: 920 } },
      { resources: { ore: 1155, stone: 1091, iron: 171 }, buildSeconds: 252, populationCost: 0, effect: { populationCapBonus: 1080 } },
      { resources: { ore: 1525, stone: 1440, iron: 225 }, buildSeconds: 291, populationCost: 0, effect: { populationCapBonus: 1250 } },
      { resources: { ore: 2014, stone: 1901, iron: 297 }, buildSeconds: 333, populationCost: 0, effect: { populationCapBonus: 1430 } },
      { resources: { ore: 2659, stone: 2510, iron: 392 }, buildSeconds: 378, populationCost: 0, effect: { populationCapBonus: 1620 } },
      { resources: { ore: 3510, stone: 3313, iron: 517 }, buildSeconds: 426, populationCost: 0, effect: { populationCapBonus: 1820 } },
      { resources: { ore: 4633, stone: 4374, iron: 682 }, buildSeconds: 477, populationCost: 0, effect: { populationCapBonus: 2030 } },
      { resources: { ore: 6116, stone: 5774, iron: 900 }, buildSeconds: 531, populationCost: 0, effect: { populationCapBonus: 2250 } },
      { resources: { ore: 8074, stone: 7622, iron: 1188 }, buildSeconds: 588, populationCost: 0, effect: { populationCapBonus: 2480 } },
      { resources: { ore: 10658, stone: 10062, iron: 1568 }, buildSeconds: 648, populationCost: 0, effect: { populationCapBonus: 2720 } },
      { resources: { ore: 14069, stone: 13282, iron: 2070 }, buildSeconds: 711, populationCost: 0, effect: { populationCapBonus: 2970 } },
      { resources: { ore: 18570, stone: 17532, iron: 2732 }, buildSeconds: 777, populationCost: 0, effect: { populationCapBonus: 3230 } },
      { resources: { ore: 24512, stone: 23141, iron: 3606 }, buildSeconds: 846, populationCost: 0, effect: { populationCapBonus: 3500 } },
    ]),
  },
};

const MILITARY_BUILDINGS: Record<'barracks' | 'combat_forge' | 'space_dock', EconomyBuildingConfig> = {
  barracks: {
    id: 'barracks',
    name: 'Barracks',
    maxLevel: MAX_LEVEL,
    unlockAtHq: 1,
    consumesPopulation: true,
    levels: defineScaledLevels({
      baseCost: { ore: 180, stone: 150, iron: 30 },
      costScale: 1.33,
      baseSeconds: 65,
      timeScale: 1.16,
      populationCost: 1,
    }),
  },
  combat_forge: {
    id: 'combat_forge',
    name: 'Combat Forge',
    maxLevel: MAX_LEVEL,
    unlockAtHq: 5,
    consumesPopulation: true,
    prerequisites: [{ buildingId: 'barracks', minLevel: 8 }],
    levels: defineScaledLevels({
      baseCost: { ore: 320, stone: 290, iron: 110 },
      costScale: 1.34,
      baseSeconds: 95,
      timeScale: 1.18,
      populationCost: 2,
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
    levels: defineScaledLevels({
      baseCost: { ore: 520, stone: 460, iron: 240 },
      costScale: 1.35,
      baseSeconds: 130,
      timeScale: 1.2,
      populationCost: 3,
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
    cost: { ore: 45, stone: 20, iron: 0 },
    trainingSeconds: 24,
    populationCost: 1,
  },
  shield_guard: {
    id: 'shield_guard',
    name: 'Shield Guard',
    category: 'ground',
    requiredBuildingId: 'barracks',
    requiredBuildingLevel: 5,
    cost: { ore: 90, stone: 75, iron: 10 },
    trainingSeconds: 46,
    populationCost: 3,
  },
  marksman: {
    id: 'marksman',
    name: 'Marksman',
    category: 'ground',
    requiredBuildingId: 'barracks',
    requiredBuildingLevel: 10,
    cost: { ore: 110, stone: 70, iron: 45 },
    trainingSeconds: 58,
    populationCost: 1,
  },
  raider_cavalry: {
    id: 'raider_cavalry',
    name: 'Raider Cavalry',
    category: 'ground',
    requiredBuildingId: 'barracks',
    requiredBuildingLevel: 15,
    cost: { ore: 150, stone: 95, iron: 70 },
    trainingSeconds: 74,
    populationCost: 3,
  },
  assault: {
    id: 'assault',
    name: 'Assault',
    category: 'ground',
    requiredBuildingId: 'combat_forge',
    requiredBuildingLevel: 1,
    cost: { ore: 170, stone: 120, iron: 95 },
    trainingSeconds: 82,
    populationCost: 2,
  },
  breacher: {
    id: 'breacher',
    name: 'Breacher',
    category: 'ground',
    requiredBuildingId: 'combat_forge',
    requiredBuildingLevel: 8,
    cost: { ore: 260, stone: 220, iron: 140 },
    trainingSeconds: 120,
    populationCost: 5,
  },
  interception_sentinel: {
    id: 'interception_sentinel',
    name: 'Interception Sentinel',
    category: 'air',
    requiredBuildingId: 'space_dock',
    requiredBuildingLevel: 1,
    cost: { ore: 210, stone: 150, iron: 140 },
    trainingSeconds: 95,
    populationCost: 4,
  },
  rapid_escort: {
    id: 'rapid_escort',
    name: 'Rapid Escort',
    category: 'air',
    requiredBuildingId: 'space_dock',
    requiredBuildingLevel: 5,
    cost: { ore: 280, stone: 190, iron: 190 },
    trainingSeconds: 130,
    populationCost: 3,
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
