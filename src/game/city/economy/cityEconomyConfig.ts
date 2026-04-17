export type EconomyResource = 'ore' | 'stone' | 'iron';

export type EconomyBuildingId =
  | 'hq'
  | 'mine'
  | 'quarry'
  | 'refinery'
  | 'warehouse'
  | 'housing_complex'
  | 'barracks'
  | 'space_dock'
  | 'defensive_wall'
  | 'watch_tower'
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

import { CITY_BUILDING_LEVEL_TABLES } from './cityBuildingLevelTables';

export const CITY_ECONOMY_CONFIG: CityEconomyConfig = {
  queueSlots: 2,
  premiumQueueEnabled: false,
  holdingMultiplierEnabled: false,
  shardsEnabled: false,
  holdingMultiplier: 1,
  resources: {
    baseStorageCap: { ore: 300, stone: 300, iron: 300 },
    startingStock: { ore: 520, stone: 340, iron: 180 },
  },
  population: {
    baseCap: 0,
  },
  buildings: {
    hq: { id: 'hq', name: 'HQ', maxLevel: CITY_BUILDING_LEVEL_TABLES.hq.length, unlockAtHq: 1, levels: CITY_BUILDING_LEVEL_TABLES.hq },
    mine: { id: 'mine', name: 'Mine', maxLevel: CITY_BUILDING_LEVEL_TABLES.mine.length, unlockAtHq: 1, levels: CITY_BUILDING_LEVEL_TABLES.mine },
    quarry: { id: 'quarry', name: 'Quarry', maxLevel: CITY_BUILDING_LEVEL_TABLES.quarry.length, unlockAtHq: 1, levels: CITY_BUILDING_LEVEL_TABLES.quarry },
    refinery: {
      id: 'refinery',
      name: 'Refinery',
      maxLevel: CITY_BUILDING_LEVEL_TABLES.refinery.length,
      unlockAtHq: 1,
      prerequisites: [{ buildingId: 'mine', minLevel: 1 }],
      levels: CITY_BUILDING_LEVEL_TABLES.refinery,
    },
    warehouse: { id: 'warehouse', name: 'Warehouse', maxLevel: CITY_BUILDING_LEVEL_TABLES.warehouse.length, unlockAtHq: 1, levels: CITY_BUILDING_LEVEL_TABLES.warehouse },
    housing_complex: { id: 'housing_complex', name: 'Housing Complex', maxLevel: CITY_BUILDING_LEVEL_TABLES.housing_complex.length, unlockAtHq: 1, levels: CITY_BUILDING_LEVEL_TABLES.housing_complex },
    barracks: {
      id: 'barracks',
      name: 'Barracks',
      maxLevel: CITY_BUILDING_LEVEL_TABLES.barracks.length,
      unlockAtHq: 2,
      prerequisites: [
        { buildingId: 'refinery', minLevel: 1 },
        { buildingId: 'housing_complex', minLevel: 3 },
        { buildingId: 'mine', minLevel: 1 },
      ],
      levels: CITY_BUILDING_LEVEL_TABLES.barracks,
    },
    space_dock: {
      id: 'space_dock',
      name: 'Space Dock',
      maxLevel: CITY_BUILDING_LEVEL_TABLES.space_dock.length,
      unlockAtHq: 14,
      prerequisites: [
        { buildingId: 'mine', minLevel: 15 },
        { buildingId: 'refinery', minLevel: 10 },
      ],
      levels: CITY_BUILDING_LEVEL_TABLES.space_dock,
    },
    defensive_wall: {
      id: 'defensive_wall',
      name: 'Defensive Wall',
      maxLevel: CITY_BUILDING_LEVEL_TABLES.defensive_wall.length,
      unlockAtHq: 5,
      levels: CITY_BUILDING_LEVEL_TABLES.defensive_wall,
    },
    watch_tower: {
      id: 'watch_tower',
      name: 'Skyguard Tower',
      maxLevel: CITY_BUILDING_LEVEL_TABLES.watch_tower.length,
      unlockAtHq: 12,
      prerequisites: [{ buildingId: 'defensive_wall', minLevel: 15 }],
      levels: CITY_BUILDING_LEVEL_TABLES.watch_tower,
    },
    armament_factory: {
      id: 'armament_factory',
      name: 'Armament Factory',
      maxLevel: CITY_BUILDING_LEVEL_TABLES.armament_factory.length,
      unlockAtHq: 8,
      prerequisites: [
        { buildingId: 'research_lab', minLevel: 10 },
        { buildingId: 'barracks', minLevel: 10 },
      ],
      levels: CITY_BUILDING_LEVEL_TABLES.armament_factory,
    },
    intelligence_center: {
      id: 'intelligence_center',
      name: 'Intelligence Center',
      maxLevel: CITY_BUILDING_LEVEL_TABLES.intelligence_center.length,
      unlockAtHq: 10,
      prerequisites: [
        { buildingId: 'market', minLevel: 4 },
        { buildingId: 'warehouse', minLevel: 7 },
      ],
      levels: CITY_BUILDING_LEVEL_TABLES.intelligence_center,
    },
    research_lab: {
      id: 'research_lab',
      name: 'Research Lab',
      maxLevel: CITY_BUILDING_LEVEL_TABLES.research_lab.length,
      unlockAtHq: 8,
      prerequisites: [
        { buildingId: 'housing_complex', minLevel: 6 },
        { buildingId: 'barracks', minLevel: 5 },
      ],
      levels: CITY_BUILDING_LEVEL_TABLES.research_lab,
    },
    market: {
      id: 'market',
      name: 'Market',
      maxLevel: CITY_BUILDING_LEVEL_TABLES.market.length,
      unlockAtHq: 3,
      prerequisites: [{ buildingId: 'warehouse', minLevel: 5 }],
      levels: CITY_BUILDING_LEVEL_TABLES.market,
    },
    council_chamber: {
      id: 'council_chamber',
      name: 'Council Chamber',
      maxLevel: CITY_BUILDING_LEVEL_TABLES.council_chamber.length,
      unlockAtHq: 15,
      prerequisites: [
        { buildingId: 'market', minLevel: 10 },
        { buildingId: 'research_lab', minLevel: 15 },
      ],
      levels: CITY_BUILDING_LEVEL_TABLES.council_chamber,
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
      requiredBuildingId: 'armament_factory',
      requiredBuildingLevel: 1,
      cost: { ore: 145, stone: 108, iron: 90 },
      trainingSeconds: 85,
      populationCost: 3,
    },
    breacher: {
      id: 'breacher',
      name: 'Breacher',
      category: 'ground',
      requiredBuildingId: 'armament_factory',
      requiredBuildingLevel: 5,
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
  'space_dock',
  'defensive_wall',
  'watch_tower',
  'armament_factory',
  'intelligence_center',
  'research_lab',
  'market',
  'council_chamber',
];

export const BUILDING_ORDER_BY_BRANCH: Record<'economy' | 'military' | 'defense' | 'intelligence' | 'research' | 'logistics' | 'governance', EconomyBuildingId[]> = {
  economy: ['hq', 'mine', 'quarry', 'refinery', 'warehouse', 'housing_complex'],
  military: ['barracks', 'space_dock', 'armament_factory'],
  defense: ['defensive_wall', 'watch_tower'],
  intelligence: ['intelligence_center'],
  research: ['research_lab'],
  logistics: ['market'],
  governance: ['council_chamber'],
};
