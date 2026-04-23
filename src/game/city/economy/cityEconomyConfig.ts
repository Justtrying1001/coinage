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
  | 'skyshield_battery'
  | 'armament_factory'
  | 'intelligence_center'
  | 'research_lab'
  | 'market'
  | 'council_chamber';

export type TroopId =
  | 'citizen_militia'
  | 'line_infantry'
  | 'phalanx_lanceguard'
  | 'rail_marksman'
  | 'assault_legionnaire'
  | 'aegis_shieldguard'
  | 'raider_hoverbike'
  | 'siege_breacher'
  | 'assault_dropship'
  | 'swift_carrier'
  | 'interceptor_sentinel'
  | 'ember_drifter'
  | 'rapid_escort'
  | 'bulwark_trireme'
  | 'colonization_arkship';

export type TroopCategory = 'militia' | 'ground' | 'naval';
export type TroopAttackType = 'blunt' | 'sharp' | 'distance' | 'naval' | 'none';

export type ResearchId =
  | 'slinger'
  | 'archer'
  | 'city_guard'
  | 'hoplite'
  | 'diplomacy'
  | 'meteorology'
  | 'espionage'
  | 'booty'
  | 'ceramics'
  | 'villagers_loyalty'
  | 'horseman'
  | 'architecture'
  | 'trainer'
  | 'colony_ship'
  | 'bireme'
  | 'crane'
  | 'shipwright'
  | 'chariot'
  | 'light_ship'
  | 'conscription'
  | 'fire_ship'
  | 'catapult'
  | 'cryptography'
  | 'democracy'
  | 'light_transport_ships'
  | 'plow'
  | 'bunks'
  | 'trireme'
  | 'phalanx'
  | 'breakthrough'
  | 'mathematics'
  | 'ram'
  | 'cartography'
  | 'conquest'
  | 'stone_hail'
  | 'temple_looting'
  | 'divine_selection'
  | 'battle_experience'
  | 'strong_wine'
  | 'set_sail';

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
  groundAttackPct?: number;
  groundDefensePct?: number;
  airAttackPct?: number;
  airDefensePct?: number;
  cityDefensePct?: number;
  groundWallDefensePct?: number;
  groundWallBaseDefense?: number;
  airWallDefensePct?: number;
  airWallBaseDefense?: number;
  antiAirDefensePct?: number;
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
  navalAttack?: number;
  navalDefense?: number;
  defenseBlunt: number;
  defenseSharp: number;
  defenseDistance: number;
  speed: number;
  transportCapacity: number;
  notes?: string;
}

export interface ResearchConfig {
  id: ResearchId;
  name: string;
  requiredBuildingLevel: number;
  researchPointsCost: number;
  cost: ResourceBundle;
  effect: {
    productionPct?: number;
    trainingSpeedPct?: number;
    buildSpeedPct?: number;
    defensePct?: number;
    antiAirDefensePct?: number;
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
    antiAirDefensePct?: number;
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
  troopResearchEnforcementEnabled: true,
  premiumQueueEnabled: false,
  holdingMultiplierEnabled: false,
  shardsEnabled: false,
  holdingMultiplier: 1,
  resources: {
    baseStorageCap: { ore: 300, stone: 300, iron: 300 },
    startingStock: { ore: 300, stone: 300, iron: 180 },
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
      prerequisites: [{ buildingId: 'barracks', minLevel: 3 }],
      levels: CITY_BUILDING_LEVEL_TABLES.defensive_wall,
    },
    skyshield_battery: {
      id: 'skyshield_battery',
      name: 'Skyshield Battery',
      maxLevel: CITY_BUILDING_LEVEL_TABLES.skyshield_battery.length,
      unlockAtHq: 12,
      prerequisites: [{ buildingId: 'space_dock', minLevel: 3 }],
      levels: CITY_BUILDING_LEVEL_TABLES.skyshield_battery,
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
      requiredBuildingId: 'housing_complex',
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
      transportCapacity: 0,
      notes: 'Emergency call-up defenders; not recruitable through standard queues.',
    },
    line_infantry: {
      id: 'line_infantry',
      name: 'Frontline Trooper',
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
      transportCapacity: 16,
      notes: 'Frontline defensive line infantry anchor.',
    },
    phalanx_lanceguard: {
      id: 'phalanx_lanceguard',
      name: 'Bulwark Trooper',
      category: 'ground',
      requiredBuildingId: 'barracks',
      requiredBuildingLevel: 1,
      requiredResearch: 'hoplite',
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
      transportCapacity: 8,
      notes: 'Anti-blunt spear line.',
    },
    rail_marksman: {
      id: 'rail_marksman',
      name: 'Railgun Skirmisher',
      category: 'ground',
      requiredBuildingId: 'barracks',
      requiredBuildingLevel: 1,
      requiredResearch: 'slinger',
      cost: { ore: 55, stone: 0, iron: 40 },
      favorCost: 0,
      trainingSeconds: 1144,
      populationCost: 1,
      attack: 23,
      attackType: 'distance',
      defenseBlunt: 7,
      defenseSharp: 8,
      defenseDistance: 2,
      speed: 14,
      transportCapacity: 8,
      notes: 'Ranged glass-cannon damage dealer.',
    },
    assault_legionnaire: {
      id: 'assault_legionnaire',
      name: 'Assault Ranger',
      category: 'ground',
      requiredBuildingId: 'barracks',
      requiredBuildingLevel: 1,
      requiredResearch: 'archer',
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
      transportCapacity: 24,
      notes: 'Ranged anti-sharp / utility profile.',
    },
    aegis_shieldguard: {
      id: 'aegis_shieldguard',
      name: 'Aegis Walker',
      category: 'ground',
      requiredBuildingId: 'barracks',
      requiredBuildingLevel: 1,
      requiredResearch: 'chariot',
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
      transportCapacity: 64,
      notes: 'Elite heavy ground unit.',
    },
    raider_hoverbike: {
      id: 'raider_hoverbike',
      name: 'Raider Interceptor',
      category: 'ground',
      requiredBuildingId: 'barracks',
      requiredBuildingLevel: 10,
      requiredResearch: 'horseman',
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
      transportCapacity: 72,
      notes: 'Fast raider hoverbike for burst and loot.',
    },
    siege_breacher: {
      id: 'siege_breacher',
      name: 'Siege Artillery',
      category: 'ground',
      requiredBuildingId: 'barracks',
      requiredBuildingLevel: 5,
      requiredResearch: 'catapult',
      cost: { ore: 700, stone: 700, iron: 700 },
      favorCost: 0,
      trainingSeconds: 12600,
      populationCost: 15,
      attack: 100,
      attackType: 'distance',
      defenseBlunt: 30,
      defenseSharp: 30,
      defenseDistance: 30,
      speed: 2,
      transportCapacity: 400,
      notes: 'Slow siege platform with high structure pressure.',
    },
    assault_dropship: {
      id: 'assault_dropship',
      name: 'Strike Dropship',
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
      navalAttack: 0,
      navalDefense: 0,
      defenseBlunt: 0,
      defenseSharp: 0,
      defenseDistance: 0,
      speed: 8,
      transportCapacity: 26,
      notes: 'Standard transport ship.',
    },
    swift_carrier: {
      id: 'swift_carrier',
      name: 'Rapid Carrier',
      category: 'naval',
      requiredBuildingId: 'space_dock',
      requiredBuildingLevel: 1,
      requiredResearch: 'light_transport_ships',
      cost: { ore: 800, stone: 0, iron: 400 },
      favorCost: 0,
      trainingSeconds: 7200,
      populationCost: 5,
      attack: 0,
      attackType: 'none',
      navalAttack: 0,
      navalDefense: 0,
      defenseBlunt: 0,
      defenseSharp: 0,
      defenseDistance: 0,
      speed: 15,
      transportCapacity: 10,
      notes: 'Fast transport ship.',
    },
    interceptor_sentinel: {
      id: 'interceptor_sentinel',
      name: 'Sentinel Interceptor',
      category: 'naval',
      requiredBuildingId: 'space_dock',
      requiredBuildingLevel: 1,
      requiredResearch: 'bireme',
      cost: { ore: 800, stone: 700, iron: 180 },
      favorCost: 0,
      trainingSeconds: 9900,
      populationCost: 8,
      attack: 24,
      attackType: 'naval',
      navalAttack: 24,
      navalDefense: 160,
      defenseBlunt: 0,
      defenseSharp: 0,
      defenseDistance: 0,
      speed: 15,
      transportCapacity: 0,
      notes: 'Defensive interceptor ship.',
    },
    ember_drifter: {
      id: 'ember_drifter',
      name: 'Ember Frigate',
      category: 'naval',
      requiredBuildingId: 'space_dock',
      requiredBuildingLevel: 1,
      requiredResearch: 'fire_ship',
      cost: { ore: 500, stone: 750, iron: 150 },
      favorCost: 0,
      trainingSeconds: 4000,
      populationCost: 8,
      attack: 0,
      attackType: 'naval',
      navalAttack: 0,
      navalDefense: 0,
      defenseBlunt: 0,
      defenseSharp: 0,
      defenseDistance: 0,
      speed: 5,
      transportCapacity: 0,
      notes: 'Special defensive fire-ship role: each ship destroys one eligible enemy ship, then is destroyed.',
    },
    rapid_escort: {
      id: 'rapid_escort',
      name: 'Vanguard Corvette',
      category: 'naval',
      requiredBuildingId: 'space_dock',
      requiredBuildingLevel: 1,
      requiredResearch: 'light_ship',
      cost: { ore: 1300, stone: 300, iron: 800 },
      favorCost: 0,
      trainingSeconds: 14400,
      populationCost: 10,
      attack: 200,
      attackType: 'naval',
      navalAttack: 200,
      navalDefense: 60,
      defenseBlunt: 0,
      defenseSharp: 0,
      defenseDistance: 0,
      speed: 13,
      transportCapacity: 60,
      notes: 'Offensive naval ship.',
    },
    bulwark_trireme: {
      id: 'bulwark_trireme',
      name: 'Bulwark Cruiser',
      category: 'naval',
      requiredBuildingId: 'space_dock',
      requiredBuildingLevel: 1,
      requiredResearch: 'trireme',
      cost: { ore: 2000, stone: 1300, iron: 1300 },
      favorCost: 0,
      trainingSeconds: 14400,
      populationCost: 16,
      attack: 250,
      attackType: 'naval',
      navalAttack: 250,
      navalDefense: 250,
      defenseBlunt: 0,
      defenseSharp: 0,
      defenseDistance: 0,
      speed: 15,
      transportCapacity: 0,
      notes: 'Heavy naval ship.',
    },
    colonization_arkship: {
      id: 'colonization_arkship',
      name: 'Colony Ark',
      category: 'naval',
      requiredBuildingId: 'space_dock',
      requiredBuildingLevel: 10,
      requiredResearch: 'colony_ship',
      cost: { ore: 10000, stone: 10000, iron: 10000 },
      favorCost: 0,
      trainingSeconds: 57535,
      populationCost: 170,
      attack: 0,
      attackType: 'none',
      navalAttack: 0,
      navalDefense: 300,
      defenseBlunt: 0,
      defenseSharp: 0,
      defenseDistance: 0,
      speed: 3,
      transportCapacity: 0,
      notes: 'Colonization ship; consumed on successful city foundation/conquest and constrained by conquest travel rules.',
    },
  },
  research: {
    slinger: { id: 'slinger', name: 'Slinger Drill', requiredBuildingLevel: 1, researchPointsCost: 4, cost: { ore: 300, stone: 500, iron: 200 }, effect: {} },
    archer: { id: 'archer', name: 'Archer Doctrine', requiredBuildingLevel: 1, researchPointsCost: 8, cost: { ore: 550, stone: 100, iron: 400 }, effect: {} },
    city_guard: { id: 'city_guard', name: 'City Guard', requiredBuildingLevel: 1, researchPointsCost: 3, cost: { ore: 400, stone: 300, iron: 300 }, effect: { defensePct: 5 } },
    hoplite: { id: 'hoplite', name: 'Hoplite Formation', requiredBuildingLevel: 4, researchPointsCost: 8, cost: { ore: 600, stone: 200, iron: 850 }, effect: {} },
    diplomacy: { id: 'diplomacy', name: 'Diplomacy', requiredBuildingLevel: 4, researchPointsCost: 3, cost: { ore: 100, stone: 400, iron: 200 }, effect: { productionPct: 15 } },
    meteorology: { id: 'meteorology', name: 'Meteorology', requiredBuildingLevel: 4, researchPointsCost: 4, cost: { ore: 2500, stone: 1700, iron: 6500 }, effect: { trainingSpeedPct: 10 } },
    espionage: { id: 'espionage', name: 'Espionage', requiredBuildingLevel: 7, researchPointsCost: 3, cost: { ore: 900, stone: 900, iron: 1100 }, effect: { detectionPct: 20, counterIntelPct: 20 } },
    booty: { id: 'booty', name: 'Booty Routing', requiredBuildingLevel: 7, researchPointsCost: 3, cost: { ore: 1200, stone: 1200, iron: 1200 }, effect: { marketEfficiencyPct: 8 } },
    ceramics: { id: 'ceramics', name: 'Ceramics Stockpiles', requiredBuildingLevel: 7, researchPointsCost: 4, cost: { ore: 700, stone: 1500, iron: 900 }, effect: {} },
    villagers_loyalty: { id: 'villagers_loyalty', name: "Villager's Loyalty", requiredBuildingLevel: 7, researchPointsCost: 6, cost: { ore: 1300, stone: 1300, iron: 1300 }, effect: { productionPct: 15 } },
    horseman: { id: 'horseman', name: 'Horseman Tactics', requiredBuildingLevel: 10, researchPointsCost: 8, cost: { ore: 1400, stone: 700, iron: 1800 }, effect: {} },
    architecture: { id: 'architecture', name: 'Architecture', requiredBuildingLevel: 10, researchPointsCost: 6, cost: { ore: 1900, stone: 2100, iron: 1300 }, effect: {} },
    trainer: { id: 'trainer', name: 'Trainer Corps', requiredBuildingLevel: 10, researchPointsCost: 4, cost: { ore: 800, stone: 1300, iron: 1600 }, effect: { trainingSpeedPct: 10 } },
    colony_ship: { id: 'colony_ship', name: 'Colony Convoy Doctrine', requiredBuildingLevel: 13, researchPointsCost: 0, cost: { ore: 7500, stone: 7500, iron: 9500 }, effect: {} },
    bireme: { id: 'bireme', name: 'Bireme Hulls', requiredBuildingLevel: 13, researchPointsCost: 8, cost: { ore: 2800, stone: 1300, iron: 2200 }, effect: {} },
    crane: { id: 'crane', name: 'Crane Logistics', requiredBuildingLevel: 13, researchPointsCost: 4, cost: { ore: 3000, stone: 1800, iron: 1400 }, effect: { buildSpeedPct: 10 } },
    shipwright: { id: 'shipwright', name: 'Shipwright Training', requiredBuildingLevel: 13, researchPointsCost: 6, cost: { ore: 5000, stone: 2000, iron: 1900 }, effect: { trainingSpeedPct: 10 } },
    chariot: { id: 'chariot', name: 'Chariot Platform', requiredBuildingLevel: 16, researchPointsCost: 8, cost: { ore: 3700, stone: 1900, iron: 2800 }, effect: {} },
    light_ship: { id: 'light_ship', name: 'Light Ship Doctrine', requiredBuildingLevel: 16, researchPointsCost: 8, cost: { ore: 4400, stone: 2000, iron: 2400 }, effect: {} },
    conscription: { id: 'conscription', name: 'Conscription', requiredBuildingLevel: 16, researchPointsCost: 4, cost: { ore: 3800, stone: 4200, iron: 6000 }, effect: {} },
    fire_ship: { id: 'fire_ship', name: 'Fire Ship Arsenal', requiredBuildingLevel: 19, researchPointsCost: 8, cost: { ore: 5300, stone: 2600, iron: 2700 }, effect: {} },
    catapult: { id: 'catapult', name: 'Catapult Siege', requiredBuildingLevel: 19, researchPointsCost: 8, cost: { ore: 5500, stone: 2900, iron: 3600 }, effect: {} },
    cryptography: { id: 'cryptography', name: 'Cryptography', requiredBuildingLevel: 19, researchPointsCost: 6, cost: { ore: 2500, stone: 3000, iron: 5100 }, effect: { counterIntelPct: 10 } },
    democracy: { id: 'democracy', name: 'Democracy', requiredBuildingLevel: 19, researchPointsCost: 6, cost: { ore: 3100, stone: 3100, iron: 4100 }, effect: { defensePct: 10 } },
    light_transport_ships: { id: 'light_transport_ships', name: 'Light Transport Ships', requiredBuildingLevel: 22, researchPointsCost: 8, cost: { ore: 6500, stone: 2800, iron: 3200 }, effect: {} },
    plow: { id: 'plow', name: 'Plow', requiredBuildingLevel: 22, researchPointsCost: 4, cost: { ore: 3000, stone: 3300, iron: 2100 }, effect: {} },
    bunks: { id: 'bunks', name: 'Bunks', requiredBuildingLevel: 22, researchPointsCost: 6, cost: { ore: 8900, stone: 5200, iron: 7800 }, effect: {} },
    trireme: { id: 'trireme', name: 'Trireme Blueprint', requiredBuildingLevel: 25, researchPointsCost: 8, cost: { ore: 6500, stone: 3800, iron: 4700 }, effect: {} },
    phalanx: { id: 'phalanx', name: 'Phalanx', requiredBuildingLevel: 25, researchPointsCost: 9, cost: { ore: 4000, stone: 4000, iron: 15000 }, effect: { defensePct: 10 } },
    breakthrough: { id: 'breakthrough', name: 'Breakthrough', requiredBuildingLevel: 25, researchPointsCost: 6, cost: { ore: 8000, stone: 8000, iron: 9000 }, effect: {} },
    mathematics: { id: 'mathematics', name: 'Mathematics', requiredBuildingLevel: 25, researchPointsCost: 6, cost: { ore: 7100, stone: 4400, iron: 8600 }, effect: {} },
    ram: { id: 'ram', name: 'Ram', requiredBuildingLevel: 28, researchPointsCost: 10, cost: { ore: 7900, stone: 9200, iron: 14000 }, effect: {} },
    cartography: { id: 'cartography', name: 'Cartography', requiredBuildingLevel: 28, researchPointsCost: 8, cost: { ore: 10000, stone: 6700, iron: 12500 }, effect: {} },
    conquest: { id: 'conquest', name: 'Conquest', requiredBuildingLevel: 28, researchPointsCost: 0, cost: { ore: 12000, stone: 12000, iron: 16000 }, effect: {} },
    stone_hail: { id: 'stone_hail', name: 'Stone Hail', requiredBuildingLevel: 31, researchPointsCost: 4, cost: { ore: 8500, stone: 5900, iron: 6600 }, effect: {} },
    temple_looting: { id: 'temple_looting', name: 'Temple Looting', requiredBuildingLevel: 31, researchPointsCost: 6, cost: { ore: 9200, stone: 5300, iron: 10000 }, effect: {} },
    divine_selection: { id: 'divine_selection', name: 'Divine Selection', requiredBuildingLevel: 31, researchPointsCost: 10, cost: { ore: 10000, stone: 8000, iron: 12000 }, effect: {} },
    battle_experience: { id: 'battle_experience', name: 'Battle Experience', requiredBuildingLevel: 34, researchPointsCost: 6, cost: { ore: 9800, stone: 11400, iron: 14200 }, effect: {} },
    strong_wine: { id: 'strong_wine', name: 'Strong Wine', requiredBuildingLevel: 34, researchPointsCost: 4, cost: { ore: 8000, stone: 6500, iron: 11000 }, effect: {} },
    set_sail: { id: 'set_sail', name: 'Set Sail', requiredBuildingLevel: 34, researchPointsCost: 8, cost: { ore: 13000, stone: 9700, iron: 15500 }, effect: {} },
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
  'skyshield_battery',
  'armament_factory',
  'intelligence_center',
  'research_lab',
  'market',
  'council_chamber',
];

export const BUILDING_ORDER_BY_BRANCH: Record<'economy' | 'military' | 'defense' | 'intelligence' | 'research' | 'logistics' | 'governance', EconomyBuildingId[]> = {
  economy: ['hq', 'mine', 'quarry', 'refinery', 'warehouse', 'housing_complex'],
  military: ['barracks', 'space_dock', 'armament_factory'],
  defense: ['defensive_wall', 'skyshield_battery'],
  intelligence: ['intelligence_center'],
  research: ['research_lab'],
  logistics: ['market'],
  governance: ['council_chamber'],
};
