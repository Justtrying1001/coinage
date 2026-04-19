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
  | 'citizen_militia'
  | 'infantry'
  | 'phalanx_lancer'
  | 'marksman'
  | 'assault'
  | 'shield_guard'
  | 'raider_cavalry'
  | 'breacher'
  | 'assault_convoy'
  | 'swift_carrier'
  | 'interception_sentinel'
  | 'ember_drifter'
  | 'rapid_escort'
  | 'bulwark_trireme'
  | 'colonization_convoy';

export type TroopCategory = 'militia' | 'ground' | 'naval';
export type TroopAttackType = 'blunt' | 'sharp' | 'distance' | 'naval' | 'none';

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
  requiredResearch?: ResearchId | null;
  cost: ResourceBundle;
  favorCost: number;
  trainingSeconds: number;
  populationCost: number;
  attack: number;
  attackType: TroopAttackType;
  defenseBlunt: number;
  defenseSharp: number;
  defenseDistance: number;
  speed: number;
  booty: number;
  transportCapacity: number;
  notes?: string;
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
  construction: {
    worldSpeed: number;
    referenceSenateLevel: number;
  };
  troopResearchEnforcementEnabled: boolean;
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
  construction: {
    worldSpeed: 1,
    referenceSenateLevel: 15,
  },
  troopResearchEnforcementEnabled: false,
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
    citizen_militia: {
      id: 'citizen_militia',
      name: 'Citizen Militia',
      category: 'militia',
      requiredBuildingId: 'barracks',
      requiredBuildingLevel: 0,
      requiredResearch: null,
      cost: { ore: 0, stone: 0, iron: 0 },
      favorCost: 0,
      trainingSeconds: 0,
      populationCost: 0,
      attack: 0,
      attackType: 'none',
      defenseBlunt: 6,
      defenseSharp: 8,
      defenseDistance: 4,
      speed: 0,
      booty: 0,
      transportCapacity: 0,
      notes: 'Emergency call-up defenders; not recruitable through standard queues.',
    },
    infantry: {
      id: 'infantry',
      name: 'Infantry',
      category: 'ground',
      requiredBuildingId: 'barracks',
      requiredBuildingLevel: 1,
      requiredResearch: null,
      cost: { ore: 95, stone: 0, iron: 85 },
      favorCost: 0,
      trainingSeconds: 1080,
      populationCost: 1,
      attack: 5,
      attackType: 'blunt',
      defenseBlunt: 14,
      defenseSharp: 8,
      defenseDistance: 30,
      speed: 8,
      booty: 16,
      transportCapacity: 0,
      notes: 'Frontline defensive infantry anchor.',
    },
    phalanx_lancer: {
      id: 'phalanx_lancer',
      name: 'Phalanx Lancer',
      category: 'ground',
      requiredBuildingId: 'barracks',
      requiredBuildingLevel: 1,
      requiredResearch: 'fortified_districts',
      cost: { ore: 0, stone: 75, iron: 150 },
      favorCost: 0,
      trainingSeconds: 1316,
      populationCost: 1,
      attack: 16,
      attackType: 'sharp',
      defenseBlunt: 18,
      defenseSharp: 12,
      defenseDistance: 7,
      speed: 6,
      booty: 8,
      transportCapacity: 0,
      notes: 'Anti-blunt spear line.',
    },
    marksman: {
      id: 'marksman',
      name: 'Marksman',
      category: 'ground',
      requiredBuildingId: 'barracks',
      requiredBuildingLevel: 1,
      requiredResearch: 'economy_drills',
      cost: { ore: 55, stone: 100, iron: 40 },
      favorCost: 0,
      trainingSeconds: 1144,
      populationCost: 1,
      attack: 23,
      attackType: 'distance',
      defenseBlunt: 7,
      defenseSharp: 8,
      defenseDistance: 2,
      speed: 14,
      booty: 8,
      transportCapacity: 0,
      notes: 'Ranged glass-cannon damage dealer.',
    },
    assault: {
      id: 'assault',
      name: 'Assault',
      category: 'ground',
      requiredBuildingId: 'barracks',
      requiredBuildingLevel: 1,
      requiredResearch: 'fortified_districts',
      cost: { ore: 120, stone: 0, iron: 75 },
      favorCost: 0,
      trainingSeconds: 1087,
      populationCost: 1,
      attack: 8,
      attackType: 'distance',
      defenseBlunt: 7,
      defenseSharp: 25,
      defenseDistance: 13,
      speed: 12,
      booty: 24,
      transportCapacity: 0,
      notes: 'Ranged anti-sharp / utility profile.',
    },
    shield_guard: {
      id: 'shield_guard',
      name: 'Shield Guard',
      category: 'ground',
      requiredBuildingId: 'barracks',
      requiredBuildingLevel: 15,
      requiredResearch: 'war_protocols',
      cost: { ore: 200, stone: 440, iron: 320 },
      favorCost: 0,
      trainingSeconds: 4710,
      populationCost: 4,
      attack: 56,
      attackType: 'sharp',
      defenseBlunt: 76,
      defenseSharp: 16,
      defenseDistance: 56,
      speed: 18,
      booty: 64,
      transportCapacity: 0,
      notes: 'Elite heavy ground unit.',
    },
    raider_cavalry: {
      id: 'raider_cavalry',
      name: 'Raider Cavalry',
      category: 'ground',
      requiredBuildingId: 'barracks',
      requiredBuildingLevel: 10,
      requiredResearch: 'logistics_automation',
      cost: { ore: 240, stone: 120, iron: 360 },
      favorCost: 0,
      trainingSeconds: 3835,
      populationCost: 3,
      attack: 60,
      attackType: 'blunt',
      defenseBlunt: 18,
      defenseSharp: 1,
      defenseDistance: 24,
      speed: 22,
      booty: 72,
      transportCapacity: 0,
      notes: 'Fast raider cavalry for burst and loot.',
    },
    breacher: {
      id: 'breacher',
      name: 'Breacher',
      category: 'ground',
      requiredBuildingId: 'barracks',
      requiredBuildingLevel: 5,
      requiredResearch: 'war_protocols',
      cost: { ore: 700, stone: 700, iron: 700 },
      favorCost: 0,
      trainingSeconds: 17662,
      populationCost: 15,
      attack: 100,
      attackType: 'distance',
      defenseBlunt: 30,
      defenseSharp: 30,
      defenseDistance: 30,
      speed: 2,
      booty: 400,
      transportCapacity: 0,
      notes: 'Slow siege platform with high structure pressure.',
    },
    assault_convoy: {
      id: 'assault_convoy',
      name: 'Assault Convoy',
      category: 'naval',
      requiredBuildingId: 'space_dock',
      requiredBuildingLevel: 1,
      requiredResearch: null,
      cost: { ore: 500, stone: 500, iron: 400 },
      favorCost: 0,
      trainingSeconds: 9600,
      populationCost: 7,
      attack: 0,
      attackType: 'none',
      defenseBlunt: 0,
      defenseSharp: 0,
      defenseDistance: 0,
      speed: 8,
      booty: 0,
      transportCapacity: 26,
      notes: 'Standard transport ship.',
    },
    swift_carrier: {
      id: 'swift_carrier',
      name: 'Swift Carrier',
      category: 'naval',
      requiredBuildingId: 'space_dock',
      requiredBuildingLevel: 1,
      requiredResearch: 'logistics_automation',
      cost: { ore: 800, stone: 0, iron: 400 },
      favorCost: 0,
      trainingSeconds: 7500,
      populationCost: 5,
      attack: 0,
      attackType: 'none',
      defenseBlunt: 0,
      defenseSharp: 0,
      defenseDistance: 0,
      speed: 15,
      booty: 0,
      transportCapacity: 10,
      notes: 'Fast transport ship.',
    },
    interception_sentinel: {
      id: 'interception_sentinel',
      name: 'Interception Sentinel',
      category: 'naval',
      requiredBuildingId: 'space_dock',
      requiredBuildingLevel: 1,
      requiredResearch: 'signals_intel',
      cost: { ore: 800, stone: 700, iron: 180 },
      favorCost: 0,
      trainingSeconds: 9900,
      populationCost: 8,
      attack: 24,
      attackType: 'naval',
      defenseBlunt: 0,
      defenseSharp: 0,
      defenseDistance: 0,
      speed: 15,
      booty: 0,
      transportCapacity: 0,
      notes: 'Defensive interceptor ship.',
    },
    ember_drifter: {
      id: 'ember_drifter',
      name: 'Ember Drifter',
      category: 'naval',
      requiredBuildingId: 'space_dock',
      requiredBuildingLevel: 1,
      requiredResearch: 'signals_intel',
      cost: { ore: 500, stone: 750, iron: 150 },
      favorCost: 0,
      trainingSeconds: 6000,
      populationCost: 8,
      attack: 0,
      attackType: 'naval',
      defenseBlunt: 0,
      defenseSharp: 0,
      defenseDistance: 0,
      speed: 5,
      booty: 0,
      transportCapacity: 0,
      notes: 'Assumed explosive interceptor archetype equivalent to sacrificial anti-ship role.',
    },
    rapid_escort: {
      id: 'rapid_escort',
      name: 'Rapid Escort',
      category: 'naval',
      requiredBuildingId: 'space_dock',
      requiredBuildingLevel: 1,
      requiredResearch: 'logistics_automation',
      cost: { ore: 1300, stone: 300, iron: 800 },
      favorCost: 0,
      trainingSeconds: 14500,
      populationCost: 10,
      attack: 200,
      attackType: 'naval',
      defenseBlunt: 0,
      defenseSharp: 0,
      defenseDistance: 0,
      speed: 13,
      booty: 60,
      transportCapacity: 0,
      notes: 'Offensive naval ship.',
    },
    bulwark_trireme: {
      id: 'bulwark_trireme',
      name: 'Bulwark Trireme',
      category: 'naval',
      requiredBuildingId: 'space_dock',
      requiredBuildingLevel: 10,
      requiredResearch: 'war_protocols',
      cost: { ore: 2000, stone: 1300, iron: 1300 },
      favorCost: 0,
      trainingSeconds: 29200,
      populationCost: 16,
      attack: 250,
      attackType: 'naval',
      defenseBlunt: 0,
      defenseSharp: 0,
      defenseDistance: 0,
      speed: 15,
      booty: 0,
      transportCapacity: 0,
      notes: 'Heavy naval ship.',
    },
    colonization_convoy: {
      id: 'colonization_convoy',
      name: 'Colonization Convoy',
      category: 'naval',
      requiredBuildingId: 'space_dock',
      requiredBuildingLevel: 10,
      requiredResearch: 'war_protocols',
      cost: { ore: 10000, stone: 10000, iron: 10000 },
      favorCost: 0,
      trainingSeconds: 42300,
      populationCost: 170,
      attack: 0,
      attackType: 'none',
      defenseBlunt: 0,
      defenseSharp: 0,
      defenseDistance: 0,
      speed: 3,
      booty: 0,
      transportCapacity: 0,
      notes: 'Colonization ship; consumed on successful city foundation/conquest.',
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
