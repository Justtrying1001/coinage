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
  | 'space_dock'
  | 'defensive_wall'
  | 'watch_tower'
  | 'military_academy'
  | 'armament_factory'
  | 'intelligence_center'
  | 'research_lab'
  | 'market'
  | 'council_chamber';

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

export type ResearchId =
  | 'economy_drills'
  | 'fortified_districts'
  | 'logistics_automation'
  | 'signals_intel'
  | 'war_protocols';

export type LocalPolicyId = 'industrial_push' | 'martial_law' | 'civic_watch';

export type ResourceBundle = Record<EconomyResource, number>;

export interface BuildingLevelEffect {
  orePerHour?: number;
  stonePerHour?: number;
  ironPerHour?: number;
  storageCap?: ResourceBundle;
  populationCapBonus?: number;
  buildCostReductionPct?: number;
  buildSpeedPct?: number;
  trainingSpeedPct?: number;
  troopCombatPowerPct?: number;
  troopUpkeepEfficiencyPct?: number;
  cityDefensePct?: number;
  damageMitigationPct?: number;
  siegeResistancePct?: number;
  detectionPct?: number;
  counterIntelPct?: number;
  researchCapacity?: number;
  marketEfficiencyPct?: number;
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

export interface ResearchConfig {
  id: ResearchId;
  name: string;
  requiredBuildingLevel: number;
  cost: ResourceBundle;
  durationSeconds: number;
  effect: {
    productionPct?: number;
    trainingSpeedPct?: number;
    defensePct?: number;
    marketEfficiencyPct?: number;
    detectionPct?: number;
    counterIntelPct?: number;
  };
}

export interface LocalPolicyConfig {
  id: LocalPolicyId;
  name: string;
  description: string;
  requiredCouncilLevel: number;
  effect: {
    productionPct?: number;
    trainingSpeedPct?: number;
    defensePct?: number;
    detectionPct?: number;
  };
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
  research: Record<ResearchId, ResearchConfig>;
  policies: Record<LocalPolicyId, LocalPolicyConfig>;
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
  buildSecondsByLevel: (level: number) => number;
  populationCostByLevel: (level: number) => number;
  effectByLevel: (level: number) => BuildingLevelEffect;
}): BuildingLevelCost[] {
  return Array.from({ length: MAX_LEVEL }, (_, idx) => {
    const level = idx + 1;
    const costMult = Math.pow(params.costScale, idx);
    return {
      level,
      resources: {
        ore: Math.round(params.baseCost.ore * costMult),
        stone: Math.round(params.baseCost.stone * costMult),
        iron: Math.round(params.baseCost.iron * costMult),
      },
      buildSeconds: params.buildSecondsByLevel(level),
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
  const lateGrowth = 1.86;
  const earlyBand = Math.min(level - 1, 9);
  const lateBand = Math.max(0, level - 10);
  const earlyValue = earlyBaseSeconds * Math.pow(earlyGrowth, earlyBand);
  const value = lateBand > 0 ? earlyValue * Math.pow(lateGrowth, lateBand) : earlyValue;
  return roundTo5(value * weight);
}

const WAREHOUSE_STORAGE_CAPS: ResourceBundle[] = [
  { ore: 1200, stone: 1000, iron: 700 },
  { ore: 1600, stone: 1300, iron: 900 },
  { ore: 2200, stone: 1800, iron: 1200 },
  { ore: 2800, stone: 2200, iron: 1500 },
  { ore: 3600, stone: 2900, iron: 2000 },
  { ore: 4600, stone: 3700, iron: 2500 },
  { ore: 5900, stone: 4700, iron: 3200 },
  { ore: 7500, stone: 6000, iron: 4100 },
  { ore: 9500, stone: 7600, iron: 5200 },
  { ore: 12000, stone: 9600, iron: 6500 },
  { ore: 15000, stone: 12000, iron: 8100 },
  { ore: 18800, stone: 15000, iron: 10200 },
  { ore: 23500, stone: 18800, iron: 12700 },
  { ore: 29400, stone: 23500, iron: 15900 },
  { ore: 36700, stone: 29400, iron: 19900 },
  { ore: 45800, stone: 36600, iron: 24800 },
  { ore: 57100, stone: 45700, iron: 30900 },
  { ore: 71200, stone: 57000, iron: 38600 },
  { ore: 88800, stone: 71000, iron: 48100 },
  { ore: 110500, stone: 88400, iron: 59700 },
];

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
    baseCap: 90,
  },
  buildings: {
    hq: {
      id: 'hq',
      name: 'HQ',
      maxLevel: MAX_LEVEL,
      unlockAtHq: 1,
      consumesPopulation: true,
      levels: buildLevels({
        baseCost: { ore: 220, stone: 180, iron: 35 },
        costScale: 1.195,
        buildSecondsByLevel: (level) => stagedBuildSeconds(level, 50),
        populationCostByLevel: (level) => populationBand(level, 1, 2, 3),
        effectByLevel: (level) => {
          if (level === 1) return { unlocks: ['mine', 'quarry', 'warehouse', 'housing_complex'] };
          if (level === 2) return { unlocks: ['barracks'] };
          if (level === 3) return { unlocks: ['refinery'] };
          if (level === 4) return { unlocks: ['defensive_wall', 'research_lab'] };
          if (level === 5) return { unlocks: ['watch_tower', 'intelligence_center', 'market'] };
          if (level === 6) return { unlocks: ['combat_forge'] };
          if (level === 8) return { unlocks: ['council_chamber'] };
          if (level === 10) return { unlocks: ['space_dock'] };
          if (level === 12) return { unlocks: ['military_academy', 'armament_factory'] };
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
        populationCostByLevel: (level) => populationBand(level, 1, 2, 2),
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
        populationCostByLevel: (level) => populationBand(level, 1, 2, 2),
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
      levels: buildLevels({
        baseCost: { ore: 125, stone: 105, iron: 35 },
        costScale: 1.165,
        buildSecondsByLevel: (level) => stagedBuildSeconds(level, 45),
        populationCostByLevel: (level) => populationBand(level, 1, 2, 2),
        effectByLevel: (level) => ({ ironPerHour: expProduction(14, 1.17, level) }),
      }),
    },
    warehouse: {
      id: 'warehouse',
      name: 'Warehouse',
      maxLevel: MAX_LEVEL,
      unlockAtHq: 1,
      consumesPopulation: false,
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
      levels: buildLevels({
        baseCost: { ore: 90, stone: 84, iron: 10 },
        costScale: 1.17,
        buildSecondsByLevel: (level) => stagedBuildSeconds(level, 35),
        populationCostByLevel: () => 0,
        effectByLevel: (level) => ({ populationCapBonus: 70 + level * 42 + level * level * 2 }),
      }),
    },
    barracks: {
      id: 'barracks',
      name: 'Barracks',
      maxLevel: MAX_LEVEL,
      unlockAtHq: 2,
      consumesPopulation: true,
      prerequisites: [{ buildingId: 'housing_complex', minLevel: 2 }],
      levels: buildLevels({
        baseCost: { ore: 140, stone: 110, iron: 20 },
        costScale: 1.2,
        buildSecondsByLevel: (level) => stagedBuildSeconds(level, 50),
        populationCostByLevel: (level) => populationBand(level, 1, 2, 2),
        effectByLevel: (level) => ({ trainingSpeedPct: Math.round(level * 1.2 * 10) / 10 }),
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
      levels: buildLevels({
        baseCost: { ore: 240, stone: 205, iron: 80 },
        costScale: 1.21,
        buildSecondsByLevel: (level) => stagedBuildSeconds(level, 65),
        populationCostByLevel: (level) => populationBand(level, 1, 2, 3),
        effectByLevel: (level) => ({ troopCombatPowerPct: Math.round(level * 1.1 * 10) / 10 }),
      }),
    },
    space_dock: {
      id: 'space_dock',
      name: 'Space Dock',
      maxLevel: MAX_LEVEL,
      unlockAtHq: 10,
      consumesPopulation: true,
      prerequisites: [
        { buildingId: 'combat_forge', minLevel: 5 },
        { buildingId: 'refinery', minLevel: 6 },
      ],
      levels: buildLevels({
        baseCost: { ore: 360, stone: 300, iron: 150 },
        costScale: 1.22,
        buildSecondsByLevel: (level) => stagedBuildSeconds(level, 80),
        populationCostByLevel: (level) => populationBand(level, 2, 3, 4),
        effectByLevel: (level) => ({ trainingSpeedPct: Math.round(level * 0.9 * 10) / 10 }),
      }),
    },
    defensive_wall: {
      id: 'defensive_wall',
      name: 'Defensive Wall',
      maxLevel: MAX_LEVEL,
      unlockAtHq: 4,
      consumesPopulation: true,
      levels: buildLevels({
        baseCost: { ore: 175, stone: 265, iron: 70 },
        costScale: 1.185,
        buildSecondsByLevel: (level) => stagedBuildSeconds(level, 52),
        populationCostByLevel: (level) => populationBand(level, 1, 2, 3),
        effectByLevel: (level) => ({
          cityDefensePct: Math.round((4 + level * 1.8) * 10) / 10,
          damageMitigationPct: Math.round((2 + level * 0.8) * 10) / 10,
          siegeResistancePct: Math.round((3 + level * 1.1) * 10) / 10,
        }),
      }),
    },
    watch_tower: {
      id: 'watch_tower',
      name: 'Watch Tower',
      maxLevel: MAX_LEVEL,
      unlockAtHq: 5,
      consumesPopulation: true,
      prerequisites: [{ buildingId: 'defensive_wall', minLevel: 2 }],
      levels: buildLevels({
        baseCost: { ore: 145, stone: 180, iron: 95 },
        costScale: 1.18,
        buildSecondsByLevel: (level) => stagedBuildSeconds(level, 48),
        populationCostByLevel: (level) => populationBand(level, 1, 2, 2),
        effectByLevel: (level) => ({ detectionPct: Math.round((8 + level * 1.7) * 10) / 10, counterIntelPct: Math.round((5 + level * 1.1) * 10) / 10 }),
      }),
    },
    military_academy: {
      id: 'military_academy',
      name: 'Military Academy',
      maxLevel: MAX_LEVEL,
      unlockAtHq: 12,
      consumesPopulation: true,
      prerequisites: [
        { buildingId: 'combat_forge', minLevel: 10 },
        { buildingId: 'research_lab', minLevel: 8 },
        { buildingId: 'council_chamber', minLevel: 4 },
      ],
      levels: buildLevels({
        baseCost: { ore: 305, stone: 270, iron: 165 },
        costScale: 1.205,
        buildSecondsByLevel: (level) => stagedBuildSeconds(level, 70),
        populationCostByLevel: (level) => populationBand(level, 2, 3, 4),
        effectByLevel: (level) => ({
          trainingSpeedPct: Math.round(level * 1.4 * 10) / 10,
          troopCombatPowerPct: Math.round(level * 0.7 * 10) / 10,
        }),
      }),
    },
    armament_factory: {
      id: 'armament_factory',
      name: 'Armament Factory',
      maxLevel: MAX_LEVEL,
      unlockAtHq: 12,
      consumesPopulation: true,
      prerequisites: [
        { buildingId: 'space_dock', minLevel: 8 },
        { buildingId: 'refinery', minLevel: 10 },
        { buildingId: 'market', minLevel: 6 },
      ],
      levels: buildLevels({
        baseCost: { ore: 340, stone: 250, iron: 190 },
        costScale: 1.205,
        buildSecondsByLevel: (level) => stagedBuildSeconds(level, 72),
        populationCostByLevel: (level) => populationBand(level, 2, 3, 4),
        effectByLevel: (level) => ({
          troopUpkeepEfficiencyPct: Math.round(level * 0.8 * 10) / 10,
          trainingSpeedPct: Math.round(level * 0.9 * 10) / 10,
        }),
      }),
    },
    intelligence_center: {
      id: 'intelligence_center',
      name: 'Intelligence Center',
      maxLevel: MAX_LEVEL,
      unlockAtHq: 4,
      consumesPopulation: true,
      prerequisites: [{ buildingId: 'watch_tower', minLevel: 2 }],
      levels: buildLevels({
        baseCost: { ore: 180, stone: 165, iron: 135 },
        costScale: 1.185,
        buildSecondsByLevel: (level) => stagedBuildSeconds(level, 54),
        populationCostByLevel: (level) => populationBand(level, 1, 2, 3),
        effectByLevel: (level) => ({ detectionPct: level * 1.2, counterIntelPct: level * 2.1 }),
      }),
    },
    research_lab: {
      id: 'research_lab',
      name: 'Research Lab',
      maxLevel: MAX_LEVEL,
      unlockAtHq: 4,
      consumesPopulation: true,
      prerequisites: [{ buildingId: 'warehouse', minLevel: 4 }],
      levels: buildLevels({
        baseCost: { ore: 175, stone: 175, iron: 130 },
        costScale: 1.185,
        buildSecondsByLevel: (level) => stagedBuildSeconds(level, 56),
        populationCostByLevel: (level) => populationBand(level, 1, 2, 3),
        effectByLevel: (level) => ({ researchCapacity: level * 3 }),
      }),
    },
    market: {
      id: 'market',
      name: 'Market',
      maxLevel: MAX_LEVEL,
      unlockAtHq: 5,
      consumesPopulation: true,
      prerequisites: [
        { buildingId: 'warehouse', minLevel: 5 },
        { buildingId: 'research_lab', minLevel: 2 },
      ],
      levels: buildLevels({
        baseCost: { ore: 165, stone: 145, iron: 80 },
        costScale: 1.18,
        buildSecondsByLevel: (level) => stagedBuildSeconds(level, 46),
        populationCostByLevel: (level) => populationBand(level, 1, 2, 3),
        effectByLevel: (level) => ({ marketEfficiencyPct: Math.round((7 + level * 1.8) * 10) / 10, buildCostReductionPct: Math.round(level * 0.5 * 10) / 10 }),
      }),
    },
    council_chamber: {
      id: 'council_chamber',
      name: 'Council Chamber',
      maxLevel: MAX_LEVEL,
      unlockAtHq: 8,
      consumesPopulation: true,
      prerequisites: [
        { buildingId: 'research_lab', minLevel: 5 },
        { buildingId: 'market', minLevel: 4 },
      ],
      levels: buildLevels({
        baseCost: { ore: 235, stone: 220, iron: 145 },
        costScale: 1.195,
        buildSecondsByLevel: (level) => stagedBuildSeconds(level, 60),
        populationCostByLevel: (level) => populationBand(level, 1, 2, 3),
        effectByLevel: (level) => ({ cityDefensePct: Math.round(level * 0.7 * 10) / 10, buildSpeedPct: Math.round(level * 0.5 * 10) / 10 }),
      }),
    },
  },
  troops: {
    infantry: {
      id: 'infantry',
      name: 'Infantry',
      category: 'ground',
      requiredBuildingId: 'barracks',
      requiredBuildingLevel: 1,
      cost: { ore: 28, stone: 20, iron: 0 },
      trainingSeconds: 20,
      populationCost: 1,
    },
    shield_guard: {
      id: 'shield_guard',
      name: 'Shield Guard',
      category: 'ground',
      requiredBuildingId: 'barracks',
      requiredBuildingLevel: 5,
      cost: { ore: 58, stone: 50, iron: 12 },
      trainingSeconds: 40,
      populationCost: 2,
    },
    marksman: {
      id: 'marksman',
      name: 'Marksman',
      category: 'ground',
      requiredBuildingId: 'barracks',
      requiredBuildingLevel: 10,
      cost: { ore: 82, stone: 52, iron: 34 },
      trainingSeconds: 50,
      populationCost: 2,
    },
    raider_cavalry: {
      id: 'raider_cavalry',
      name: 'Raider Cavalry',
      category: 'ground',
      requiredBuildingId: 'barracks',
      requiredBuildingLevel: 15,
      cost: { ore: 122, stone: 86, iron: 54 },
      trainingSeconds: 70,
      populationCost: 3,
    },
    assault: {
      id: 'assault',
      name: 'Assault',
      category: 'ground',
      requiredBuildingId: 'combat_forge',
      requiredBuildingLevel: 1,
      cost: { ore: 145, stone: 108, iron: 90 },
      trainingSeconds: 85,
      populationCost: 3,
    },
    breacher: {
      id: 'breacher',
      name: 'Breacher',
      category: 'ground',
      requiredBuildingId: 'combat_forge',
      requiredBuildingLevel: 8,
      cost: { ore: 210, stone: 180, iron: 135 },
      trainingSeconds: 115,
      populationCost: 4,
    },
    interception_sentinel: {
      id: 'interception_sentinel',
      name: 'Interception Sentinel',
      category: 'air',
      requiredBuildingId: 'space_dock',
      requiredBuildingLevel: 1,
      cost: { ore: 178, stone: 132, iron: 130 },
      trainingSeconds: 95,
      populationCost: 3,
    },
    rapid_escort: {
      id: 'rapid_escort',
      name: 'Rapid Escort',
      category: 'air',
      requiredBuildingId: 'space_dock',
      requiredBuildingLevel: 5,
      cost: { ore: 235, stone: 170, iron: 170 },
      trainingSeconds: 120,
      populationCost: 3,
    },
  },
  research: {
    economy_drills: {
      id: 'economy_drills',
      name: 'Economy Drills',
      requiredBuildingLevel: 1,
      cost: { ore: 150, stone: 120, iron: 60 },
      durationSeconds: 90,
      effect: { productionPct: 6 },
    },
    fortified_districts: {
      id: 'fortified_districts',
      name: 'Fortified Districts',
      requiredBuildingLevel: 3,
      cost: { ore: 220, stone: 220, iron: 90 },
      durationSeconds: 120,
      effect: { defensePct: 8 },
    },
    logistics_automation: {
      id: 'logistics_automation',
      name: 'Logistics Automation',
      requiredBuildingLevel: 5,
      cost: { ore: 280, stone: 240, iron: 120 },
      durationSeconds: 150,
      effect: { marketEfficiencyPct: 12 },
    },
    signals_intel: {
      id: 'signals_intel',
      name: 'Signals Intel',
      requiredBuildingLevel: 6,
      cost: { ore: 260, stone: 260, iron: 155 },
      durationSeconds: 165,
      effect: { detectionPct: 15, counterIntelPct: 12 },
    },
    war_protocols: {
      id: 'war_protocols',
      name: 'War Protocols',
      requiredBuildingLevel: 8,
      cost: { ore: 320, stone: 290, iron: 210 },
      durationSeconds: 210,
      effect: { trainingSpeedPct: 10 },
    },
  },
  policies: {
    industrial_push: {
      id: 'industrial_push',
      name: 'Industrial Push',
      description: 'Boosts local production but lowers vigilance.',
      requiredCouncilLevel: 1,
      effect: { productionPct: 10, detectionPct: -5 },
    },
    martial_law: {
      id: 'martial_law',
      name: 'Martial Law',
      description: 'Boosts defense and training operations.',
      requiredCouncilLevel: 3,
      effect: { defensePct: 12, trainingSpeedPct: 8 },
    },
    civic_watch: {
      id: 'civic_watch',
      name: 'Civic Watch',
      description: 'Boosts city surveillance and counter-intel readiness.',
      requiredCouncilLevel: 5,
      effect: { detectionPct: 14 },
    },
  },
};

export const STANDARD_BUILDING_ORDER: EconomyBuildingId[] = [
  'hq',
  'mine',
  'quarry',
  'refinery',
  'warehouse',
  'housing_complex',
  'barracks',
  'combat_forge',
  'space_dock',
  'defensive_wall',
  'watch_tower',
  'military_academy',
  'armament_factory',
  'intelligence_center',
  'research_lab',
  'market',
  'council_chamber',
];

export const BUILDING_ORDER_BY_BRANCH: Record<'economy' | 'military' | 'defense' | 'intelligence' | 'research' | 'logistics' | 'governance', EconomyBuildingId[]> = {
  economy: ['hq', 'mine', 'quarry', 'refinery', 'warehouse', 'housing_complex'],
  military: ['barracks', 'combat_forge', 'space_dock', 'military_academy', 'armament_factory'],
  defense: ['defensive_wall', 'watch_tower'],
  intelligence: ['intelligence_center'],
  research: ['research_lab'],
  logistics: ['market'],
  governance: ['council_chamber'],
};
