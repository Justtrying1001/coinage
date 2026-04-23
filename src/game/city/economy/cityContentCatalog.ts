export type ContentPhase = 'mvp' | 'v0' | 'later';
export type DefinitionStatus = 'fully_defined' | 'partially_defined' | 'placeholder_values_needed' | 'unresolved_design_questions';

export type BuildingCategory =
  | 'economy'
  | 'military'
  | 'defense'
  | 'support_logistics'
  | 'research'
  | 'intelligence'
  | 'governance';

export type UnitCategory = 'ground_line' | 'projection' | 'siege' | 'colonization' | 'defensive' | 'logistics';

export interface ContentPrerequisite {
  type: 'building' | 'hq' | 'other';
  targetId: string;
  minLevel?: number;
  note?: string;
}

export interface BuildingCatalogEntry {
  id: string;
  name: string;
  category: BuildingCategory;
  phase: ContentPhase;
  definitionStatus: DefinitionStatus;
  gameplayImplemented: boolean;
  maxLevel: number;
  role: string;
  primarySystems: string[];
  unlock: ContentPrerequisite[];
  levelBandGates?: Array<{
    minTargetLevel: number;
    maxTargetLevel: number;
    prerequisites: ContentPrerequisite[];
  }>;
  valueCompleteness: {
    costs: DefinitionStatus;
    buildTime: DefinitionStatus;
    population: DefinitionStatus;
    effects: DefinitionStatus;
  };
  operationalEffectsByBand?: Array<{
    minLevel: number;
    maxLevel: number;
    effects: string[];
  }>;
  provisionalLevels?: BuildingLevelDraft[];
  notes?: string[];
}

export interface UnitCatalogEntry {
  id: string;
  name: string;
  category: UnitCategory;
  phase: ContentPhase;
  definitionStatus: DefinitionStatus;
  gameplayImplemented: boolean;
  role: string;
  unlock: ContentPrerequisite[];
  valueCompleteness: {
    costs: DefinitionStatus;
    trainingTime: DefinitionStatus;
    population: DefinitionStatus;
    combatStats: DefinitionStatus;
    logisticsStats: DefinitionStatus;
  };
  provisionalProfile?: UnitDraftProfile;
  notes?: string[];
}

export interface BuildingLevelDraft {
  level: number;
  resources: { ore: number; stone: number; iron: number };
  buildSeconds: number;
  populationCost: number;
  effects: string[];
}

export interface UnitDraftProfile {
  resources: { ore: number; stone: number; iron: number };
  trainingSeconds: number;
  populationCost: number;
  attackType: 'kinetic' | 'energy' | 'plasma' | 'none';
  speedTier: 'very_fast' | 'fast' | 'medium' | 'slow' | 'very_slow' | 'extreme_slow';
  logistics?: {
    convoyCapacityPopulation?: number;
    consumedOnArrival?: boolean;
    requiresEscort?: boolean;
  };
  combatProfile?: {
    offense: { kinetic: number; energy: number; plasma: number };
    defense: { kinetic: number; energy: number; plasma: number };
    structureDamage: number;
  };
}

function roundTo5(value: number) {
  return Math.max(5, Math.round(value / 5) * 5);
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

function populationBand(level: number, early: number, mid: number, late: number) {
  if (level <= 5) return early;
  if (level <= 12) return mid;
  return late;
}

function buildProvisionalLevels(params: {
  baseCost: { ore: number; stone: number; iron: number };
  costScale: number;
  baseSeconds: number;
  populationCostByLevel: (level: number) => number;
  effectByLevel: (level: number) => string[];
}): BuildingLevelDraft[] {
  return Array.from({ length: 20 }, (_, idx) => {
    const level = idx + 1;
    const mult = Math.pow(params.costScale, idx);
    return {
      level,
      resources: {
        ore: Math.round(params.baseCost.ore * mult),
        stone: Math.round(params.baseCost.stone * mult),
        iron: Math.round(params.baseCost.iron * mult),
      },
      buildSeconds: stagedBuildSeconds(level, params.baseSeconds),
      populationCost: params.populationCostByLevel(level),
      effects: params.effectByLevel(level),
    };
  });
}

export const FULL_BUILDING_CATALOG: BuildingCatalogEntry[] = [
  {
    id: 'hq',
    name: 'HQ',
    category: 'economy',
    phase: 'mvp',
    definitionStatus: 'fully_defined',
    gameplayImplemented: true,
    maxLevel: 20,
    role: 'Progression spine and unlock hub for city systems.',
    primarySystems: ['progression', 'unlock_tree'],
    unlock: [],
    valueCompleteness: {
      costs: 'fully_defined',
      buildTime: 'fully_defined',
      population: 'fully_defined',
      effects: 'partially_defined',
    },
    notes: ['Unlock milestones fully defined for current active subset.'],
  },
  {
    id: 'mine',
    name: 'Mine',
    category: 'economy',
    phase: 'mvp',
    definitionStatus: 'fully_defined',
    gameplayImplemented: true,
    maxLevel: 25,
    role: 'Ore passive production.',
    primarySystems: ['economy', 'claim_on_access'],
    unlock: [{ type: 'hq', targetId: 'hq', minLevel: 1 }],
    levelBandGates: [
      {
        minTargetLevel: 6,
        maxTargetLevel: 10,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 4 },
          { type: 'building', targetId: 'quarry', minLevel: 5 },
        ],
      },
      {
        minTargetLevel: 11,
        maxTargetLevel: 15,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 8 },
          { type: 'building', targetId: 'warehouse', minLevel: 6 },
        ],
      },
      {
        minTargetLevel: 16,
        maxTargetLevel: 20,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 12 },
          { type: 'building', targetId: 'refinery', minLevel: 8 },
        ],
      },
    ],
    valueCompleteness: {
      costs: 'fully_defined',
      buildTime: 'fully_defined',
      population: 'fully_defined',
      effects: 'fully_defined',
    },
  },
  {
    id: 'quarry',
    name: 'Quarry',
    category: 'economy',
    phase: 'mvp',
    definitionStatus: 'fully_defined',
    gameplayImplemented: true,
    maxLevel: 25,
    role: 'Stone passive production.',
    primarySystems: ['economy', 'claim_on_access'],
    unlock: [{ type: 'hq', targetId: 'hq', minLevel: 1 }],
    levelBandGates: [
      {
        minTargetLevel: 6,
        maxTargetLevel: 10,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 4 },
          { type: 'building', targetId: 'mine', minLevel: 5 },
        ],
      },
      {
        minTargetLevel: 11,
        maxTargetLevel: 15,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 8 },
          { type: 'building', targetId: 'warehouse', minLevel: 6 },
        ],
      },
      {
        minTargetLevel: 16,
        maxTargetLevel: 20,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 12 },
          { type: 'building', targetId: 'refinery', minLevel: 8 },
        ],
      },
    ],
    valueCompleteness: {
      costs: 'fully_defined',
      buildTime: 'fully_defined',
      population: 'fully_defined',
      effects: 'fully_defined',
    },
  },
  {
    id: 'refinery',
    name: 'Refinery',
    category: 'economy',
    phase: 'mvp',
    definitionStatus: 'fully_defined',
    gameplayImplemented: true,
    maxLevel: 25,
    role: 'Iron passive production and military-economy maturity gate.',
    primarySystems: ['economy', 'military_economy_gate'],
    unlock: [
      { type: 'hq', targetId: 'hq', minLevel: 3 },
      { type: 'building', targetId: 'mine', minLevel: 4 },
      { type: 'building', targetId: 'quarry', minLevel: 4 },
    ],
    levelBandGates: [
      {
        minTargetLevel: 6,
        maxTargetLevel: 10,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 6 },
          { type: 'building', targetId: 'warehouse', minLevel: 5 },
        ],
      },
      {
        minTargetLevel: 11,
        maxTargetLevel: 15,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 10 },
          { type: 'building', targetId: 'mine', minLevel: 10 },
          { type: 'building', targetId: 'quarry', minLevel: 10 },
        ],
      },
      {
        minTargetLevel: 16,
        maxTargetLevel: 20,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 14 },
          { type: 'building', targetId: 'warehouse', minLevel: 12 },
          { type: 'building', targetId: 'housing_complex', minLevel: 10 },
        ],
      },
    ],
    valueCompleteness: {
      costs: 'fully_defined',
      buildTime: 'fully_defined',
      population: 'fully_defined',
      effects: 'fully_defined',
    },
  },
  {
    id: 'warehouse',
    name: 'Warehouse',
    category: 'support_logistics',
    phase: 'mvp',
    definitionStatus: 'fully_defined',
    gameplayImplemented: true,
    maxLevel: 25,
    role: 'Absolute storage cap expansion.',
    primarySystems: ['economy', 'storage_caps'],
    unlock: [{ type: 'hq', targetId: 'hq', minLevel: 1 }],
    levelBandGates: [
      { minTargetLevel: 6, maxTargetLevel: 10, prerequisites: [{ type: 'hq', targetId: 'hq', minLevel: 5 }] },
      {
        minTargetLevel: 11,
        maxTargetLevel: 15,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 9 },
          { type: 'building', targetId: 'housing_complex', minLevel: 5 },
        ],
      },
      {
        minTargetLevel: 16,
        maxTargetLevel: 20,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 13 },
          { type: 'building', targetId: 'refinery', minLevel: 8 },
        ],
      },
    ],
    valueCompleteness: {
      costs: 'fully_defined',
      buildTime: 'fully_defined',
      population: 'fully_defined',
      effects: 'fully_defined',
    },
  },
  {
    id: 'housing_complex',
    name: 'Housing Complex',
    category: 'support_logistics',
    phase: 'mvp',
    definitionStatus: 'fully_defined',
    gameplayImplemented: true,
    maxLevel: 25,
    role: 'Population cap growth backbone.',
    primarySystems: ['population', 'city_specialization'],
    unlock: [{ type: 'hq', targetId: 'hq', minLevel: 1 }],
    levelBandGates: [
      {
        minTargetLevel: 6,
        maxTargetLevel: 10,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 4 },
          { type: 'building', targetId: 'quarry', minLevel: 4 },
        ],
      },
      {
        minTargetLevel: 11,
        maxTargetLevel: 15,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 8 },
          { type: 'building', targetId: 'warehouse', minLevel: 6 },
        ],
      },
      {
        minTargetLevel: 16,
        maxTargetLevel: 20,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 12 },
          { type: 'building', targetId: 'refinery', minLevel: 7 },
        ],
      },
    ],
    valueCompleteness: {
      costs: 'fully_defined',
      buildTime: 'fully_defined',
      population: 'fully_defined',
      effects: 'fully_defined',
    },
  },
  {
    id: 'barracks',
    name: 'Barracks',
    category: 'military',
    phase: 'v0',
    definitionStatus: 'fully_defined',
    gameplayImplemented: true,
    maxLevel: 25,
    role: 'Base ground unit unlock and military progression entry.',
    primarySystems: ['military_unlocks', 'training'],
    unlock: [
      { type: 'hq', targetId: 'hq', minLevel: 2 },
      { type: 'building', targetId: 'housing_complex', minLevel: 2 },
    ],
    levelBandGates: [
      {
        minTargetLevel: 6,
        maxTargetLevel: 10,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 6 },
          { type: 'building', targetId: 'mine', minLevel: 6 },
        ],
      },
      {
        minTargetLevel: 11,
        maxTargetLevel: 15,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 10 },
          { type: 'building', targetId: 'quarry', minLevel: 8 },
        ],
      },
      {
        minTargetLevel: 16,
        maxTargetLevel: 20,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 14 },
          { type: 'building', targetId: 'housing_complex', minLevel: 12 },
        ],
      },
    ],
    valueCompleteness: {
      costs: 'fully_defined',
      buildTime: 'fully_defined',
      population: 'fully_defined',
      effects: 'partially_defined',
    },
    operationalEffectsByBand: [
      { minLevel: 1, maxLevel: 5, effects: ['Ground-line training speed +2% per level (provisional)'] },
      { minLevel: 6, maxLevel: 10, effects: ['Ground recruitment batch cap +1 every 2 levels (provisional)'] },
      { minLevel: 11, maxLevel: 15, effects: ['Barracks queue latency reduction +1.5% per level (provisional)'] },
      { minLevel: 16, maxLevel: 20, effects: ['Line infantry/rail marksman upkeep efficiency +1% per level (provisional)'] },
    ],
  },
  {
    id: 'combat_forge',
    name: 'Combat Forge',
    category: 'military',
    phase: 'v0',
    definitionStatus: 'fully_defined',
    gameplayImplemented: true,
    maxLevel: 25,
    role: 'Advanced ground unit unlock branch.',
    primarySystems: ['military_unlocks', 'training'],
    unlock: [
      { type: 'hq', targetId: 'hq', minLevel: 6 },
      { type: 'building', targetId: 'barracks', minLevel: 8 },
      { type: 'building', targetId: 'refinery', minLevel: 5 },
    ],
    levelBandGates: [
      {
        minTargetLevel: 6,
        maxTargetLevel: 10,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 10 },
          { type: 'building', targetId: 'warehouse', minLevel: 8 },
        ],
      },
      {
        minTargetLevel: 11,
        maxTargetLevel: 15,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 13 },
          { type: 'building', targetId: 'barracks', minLevel: 12 },
        ],
      },
      {
        minTargetLevel: 16,
        maxTargetLevel: 20,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 16 },
          { type: 'building', targetId: 'housing_complex', minLevel: 14 },
        ],
      },
    ],
    valueCompleteness: {
      costs: 'fully_defined',
      buildTime: 'fully_defined',
      population: 'fully_defined',
      effects: 'partially_defined',
    },
    operationalEffectsByBand: [
      { minLevel: 1, maxLevel: 5, effects: ['Advanced ground unit training speed +2.5% per level (provisional)'] },
      { minLevel: 6, maxLevel: 10, effects: ['Assault/Breacher iron cost reduction +1% per level (provisional)'] },
      { minLevel: 11, maxLevel: 15, effects: ['Ground siege damage multiplier +1.5% per level (provisional)'] },
      { minLevel: 16, maxLevel: 20, effects: ['Forge doctrine slot cap +1 every 2 levels (provisional)'] },
    ],
  },
  {
    id: 'space_dock',
    name: 'Space Dock',
    category: 'military',
    phase: 'v0',
    definitionStatus: 'fully_defined',
    gameplayImplemented: true,
    maxLevel: 25,
    role: 'Projection/air unit unlock and siege-colonization transport branch.',
    primarySystems: ['military_unlocks', 'projection'],
    unlock: [
      { type: 'hq', targetId: 'hq', minLevel: 10 },
      { type: 'building', targetId: 'combat_forge', minLevel: 5 },
      { type: 'building', targetId: 'refinery', minLevel: 6 },
    ],
    levelBandGates: [
      {
        minTargetLevel: 6,
        maxTargetLevel: 10,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 13 },
          { type: 'building', targetId: 'warehouse', minLevel: 10 },
        ],
      },
      {
        minTargetLevel: 11,
        maxTargetLevel: 15,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 16 },
          { type: 'building', targetId: 'combat_forge', minLevel: 10 },
        ],
      },
      {
        minTargetLevel: 16,
        maxTargetLevel: 20,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 18 },
          { type: 'building', targetId: 'housing_complex', minLevel: 14 },
        ],
      },
    ],
    valueCompleteness: {
      costs: 'fully_defined',
      buildTime: 'fully_defined',
      population: 'fully_defined',
      effects: 'partially_defined',
    },
    operationalEffectsByBand: [
      { minLevel: 1, maxLevel: 5, effects: ['Projection-screen unit training speed +2% per level (provisional)'] },
      { minLevel: 6, maxLevel: 10, effects: ['Projection convoy capacity +1 pop every 2 levels (provisional)'] },
      { minLevel: 11, maxLevel: 15, effects: ['Inter-sector launch cooldown reduction +1.5% per level (provisional)'] },
      { minLevel: 16, maxLevel: 20, effects: ['Convoy durability bonus +2% per level (provisional)'] },
    ],
  },
  {
    id: 'defensive_wall',
    name: 'Defensive Wall',
    category: 'defense',
    phase: 'later',
    definitionStatus: 'partially_defined',
    gameplayImplemented: false,
    maxLevel: 25,
    role: 'City-defense wall bonus applied only to barracks-ground units during city defense.',
    primarySystems: ['defense', 'combat_phase_2'],
    unlock: [
      { type: 'hq', targetId: 'hq', minLevel: 5 },
      { type: 'building', targetId: 'barracks', minLevel: 3 },
    ],
    levelBandGates: [
      {
        minTargetLevel: 6,
        maxTargetLevel: 10,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 8 },
          { type: 'building', targetId: 'warehouse', minLevel: 7 },
        ],
      },
      {
        minTargetLevel: 11,
        maxTargetLevel: 15,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 12 },
          { type: 'building', targetId: 'skyshield_battery', minLevel: 6 },
        ],
      },
      {
        minTargetLevel: 16,
        maxTargetLevel: 20,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 16 },
          { type: 'building', targetId: 'housing_complex', minLevel: 14 },
        ],
      },
    ],
    valueCompleteness: {
      costs: 'partially_defined',
      buildTime: 'partially_defined',
      population: 'partially_defined',
      effects: 'partially_defined',
    },
    operationalEffectsByBand: [
      { minLevel: 1, maxLevel: 5, effects: ['Global city defense multiplier +3.0% per level', 'Defender structure durability +1.0% per level'] },
      { minLevel: 6, maxLevel: 10, effects: ['Siege damage mitigation +1.6% per level', 'Emergency militia muster speed +1.0% per level'] },
      { minLevel: 11, maxLevel: 15, effects: ['Defender morale floor +0.9% per level', 'Wall breach recovery rate +1.2% per level'] },
      { minLevel: 16, maxLevel: 20, effects: ['Final defense phase resilience +1.9% per level', 'Assault convoy unloading disruption +1.5% per level'] },
    ],
    provisionalLevels: buildProvisionalLevels({
      baseCost: { ore: 175, stone: 265, iron: 70 },
      costScale: 1.185,
      baseSeconds: 52,
      populationCostByLevel: (level) => populationBand(level, 1, 2, 3),
      effectByLevel: (level) => [`City defense bonus +${Math.round(5 + level * 1.9)}%`, 'Applies to all defending units during local defense phase'],
    }),
    notes: [
      'Referenced in micro combat doc as a global defense bonus source.',
      'Balanced as early defensive anchor; ties into storage pressure to avoid free turtling.',
    ],
  },
  {
    id: 'skyshield_battery',
    name: 'Skyshield Battery',
    category: 'defense',
    phase: 'later',
    definitionStatus: 'partially_defined',
    gameplayImplemented: false,
    maxLevel: 20,
    role: 'City-defense tower bonus applied only to space_dock air/spatial units during city defense.',
    primarySystems: ['defense', 'anti_air_defense'],
    unlock: [
      { type: 'hq', targetId: 'hq', minLevel: 12 },
      { type: 'building', targetId: 'space_dock', minLevel: 3 },
    ],
    levelBandGates: [
      {
        minTargetLevel: 6,
        maxTargetLevel: 10,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 8 },
          { type: 'building', targetId: 'defensive_wall', minLevel: 4 },
        ],
      },
      {
        minTargetLevel: 11,
        maxTargetLevel: 15,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 12 },
          { type: 'building', targetId: 'intelligence_center', minLevel: 5 },
        ],
      },
      {
        minTargetLevel: 16,
        maxTargetLevel: 20,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 16 },
          { type: 'building', targetId: 'defensive_wall', minLevel: 12 },
        ],
      },
    ],
    valueCompleteness: {
      costs: 'partially_defined',
      buildTime: 'partially_defined',
      population: 'partially_defined',
      effects: 'partially_defined',
    },
    operationalEffectsByBand: [
      { minLevel: 1, maxLevel: 5, effects: ['Air wall defense +~2.2% per level', 'Air wall base defense +~3.3 per level'] },
      { minLevel: 6, maxLevel: 10, effects: ['Space dock fleet defensive hardening progression', 'No effect in offensive context'] },
      { minLevel: 11, maxLevel: 15, effects: ['City-defense-only bonus for air/spatial defenders', 'No impact on barracks units'] },
      { minLevel: 16, maxLevel: 20, effects: ['High-tier anti-air defense scaling in city defense', 'No global city-defense blanket bonus'] },
    ],
    provisionalLevels: buildProvisionalLevels({
      baseCost: { ore: 145, stone: 180, iron: 95 },
      costScale: 1.18,
      baseSeconds: 48,
      populationCostByLevel: (level) => populationBand(level, 1, 2, 2),
      effectByLevel: (level) => [
        `Anti-air shield strength +${Math.round(6 + level * 2.0)}%`,
        `Flying hostile interception +${Math.round(4 + level * 1.4)}%`,
      ],
    }),
  },
  {
    id: 'military_academy',
    name: 'Military Academy',
    category: 'military',
    phase: 'later',
    definitionStatus: 'partially_defined',
    gameplayImplemented: false,
    maxLevel: 25,
    role: 'Late military specialization and doctrine building.',
    primarySystems: ['military_specialization', 'research_bridge'],
    unlock: [
      { type: 'hq', targetId: 'hq', minLevel: 12 },
      { type: 'building', targetId: 'combat_forge', minLevel: 10 },
      { type: 'building', targetId: 'research_lab', minLevel: 8 },
      { type: 'building', targetId: 'council_chamber', minLevel: 4 },
    ],
    levelBandGates: [
      {
        minTargetLevel: 6,
        maxTargetLevel: 10,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 14 },
          { type: 'building', targetId: 'armament_factory', minLevel: 4 },
        ],
      },
      {
        minTargetLevel: 11,
        maxTargetLevel: 15,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 16 },
          { type: 'building', targetId: 'combat_forge', minLevel: 14 },
        ],
      },
      {
        minTargetLevel: 16,
        maxTargetLevel: 20,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 18 },
          { type: 'building', targetId: 'council_chamber', minLevel: 10 },
        ],
      },
    ],
    valueCompleteness: {
      costs: 'partially_defined',
      buildTime: 'partially_defined',
      population: 'partially_defined',
      effects: 'partially_defined',
    },
    operationalEffectsByBand: [
      { minLevel: 1, maxLevel: 5, effects: ['Ground unit training speed +2.4% per level', 'Unlocks doctrine slot at level 4'] },
      { minLevel: 6, maxLevel: 10, effects: ['Ground and siege training speed +1.8% per level', 'Doctrine slot +1 at level 8'] },
      { minLevel: 11, maxLevel: 15, effects: ['Formation cohesion bonus +1.2% per level', 'Doctrine slot +1 at level 12'] },
      { minLevel: 16, maxLevel: 20, effects: ['High-command cycle speed +1.5% per level', 'Doctrine slot +1 at level 16 and 20'] },
    ],
    provisionalLevels: buildProvisionalLevels({
      baseCost: { ore: 305, stone: 270, iron: 165 },
      costScale: 1.205,
      baseSeconds: 70,
      populationCostByLevel: (level) => populationBand(level, 2, 3, 4),
      effectByLevel: (level) => [
        `Ground unit training time -${Math.round(3 + level * 0.75)}%`,
        `Doctrine slot capacity +${Math.floor(level / 4)}`,
      ],
    }),
    notes: ['Operational level effects are now structured provisionally; doctrine-capacity mechanics still require product arbitration.'],
  },
  {
    id: 'armament_factory',
    name: 'Armament Factory',
    category: 'military',
    phase: 'mvp',
    definitionStatus: 'fully_defined',
    gameplayImplemented: true,
    maxLevel: 35,
    role: 'Improves offensive and defensive power for ground and air units.',
    primarySystems: ['military_stats'],
    unlock: [
      { type: 'hq', targetId: 'hq', minLevel: 8 },
      { type: 'building', targetId: 'research_lab', minLevel: 10 },
      { type: 'building', targetId: 'barracks', minLevel: 10 },
    ],
    valueCompleteness: {
      costs: 'fully_defined',
      buildTime: 'fully_defined',
      population: 'fully_defined',
      effects: 'fully_defined',
    },
    operationalEffectsByBand: [
      { minLevel: 1, maxLevel: 30, effects: ['Cycle: L1 Ground ATK, L2 Ground DEF, L3 Air ATK, L4 Air DEF, L5 Ground ATK+DEF, L6 Air ATK+DEF'] },
      { minLevel: 31, maxLevel: 34, effects: ['L31 Ground ATK, L32 Ground DEF, L33 Air ATK, L34 Air DEF'] },
      { minLevel: 35, maxLevel: 35, effects: ['Final all-units tier: Ground ATK + Ground DEF + Air ATK + Air DEF'] },
    ],
    notes: [
      'No training-speed role in runtime: Barracks and Space Dock keep branch-specific training throughput.',
      'No upkeep/training/research role: only ground and air attack-defense bonuses.',
    ],
  },
  {
    id: 'intelligence_center',
    name: 'Intelligence Center',
    category: 'intelligence',
    phase: 'later',
    definitionStatus: 'partially_defined',
    gameplayImplemented: false,
    maxLevel: 25,
    role: 'Spy vault and mission unlock progression.',
    primarySystems: ['espionage', 'spy_vault', 'counter_intel'],
    unlock: [
      { type: 'hq', targetId: 'hq', minLevel: 4 },
      { type: 'building', targetId: 'skyshield_battery', minLevel: 2 },
    ],
    levelBandGates: [
      {
        minTargetLevel: 6,
        maxTargetLevel: 10,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 8 },
          { type: 'building', targetId: 'skyshield_battery', minLevel: 4 },
        ],
      },
      {
        minTargetLevel: 11,
        maxTargetLevel: 15,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 12 },
          { type: 'building', targetId: 'research_lab', minLevel: 8 },
        ],
      },
      {
        minTargetLevel: 16,
        maxTargetLevel: 20,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 16 },
          { type: 'building', targetId: 'council_chamber', minLevel: 10 },
        ],
      },
    ],
    valueCompleteness: {
      costs: 'partially_defined',
      buildTime: 'partially_defined',
      population: 'partially_defined',
      effects: 'partially_defined',
    },
    operationalEffectsByBand: [
      { minLevel: 1, maxLevel: 5, effects: ['Spy-vault resilience +3.0% per level', 'Counter-intel sweep strength +1.8% per level'] },
      { minLevel: 6, maxLevel: 10, effects: ['Mission detection resistance +2.0% per level', 'Mission depth unlock at levels 5/10'] },
      { minLevel: 11, maxLevel: 15, effects: ['Sabotage operation reliability +1.5% per level', 'Intel report granularity +1.0% per level'] },
      { minLevel: 16, maxLevel: 20, effects: ['Ghost-op stealth depth +1.7% per level', 'Counter-espionage cooldown -1.3% per level'] },
    ],
    provisionalLevels: buildProvisionalLevels({
      baseCost: { ore: 180, stone: 165, iron: 135 },
      costScale: 1.185,
      baseSeconds: 54,
      populationCostByLevel: (level) => populationBand(level, 1, 2, 3),
      effectByLevel: (level) => {
        const missionTiers = ['L1: Recon', 'L5: Infiltration', 'L10: Surveillance', 'L15: Sabotage', 'L20: Ghost Ops'].filter((tier) =>
          tier.startsWith(`L${level}:`),
        );
        return [`Spy-vault resilience +${Math.round(8 + level * 2.1)}%`, ...missionTiers];
      },
    }),
    notes: ['Mission tiers are defined in docs at levels 1/5/10/15/20 and now mapped into provisional level effects.'],
  },
  {
    id: 'research_lab',
    name: 'Research Lab',
    category: 'research',
    phase: 'later',
    definitionStatus: 'partially_defined',
    gameplayImplemented: false,
    maxLevel: 25,
    role: 'Research Capacity contribution and tech branch progression.',
    primarySystems: ['research', 'research_capacity'],
    unlock: [
      { type: 'hq', targetId: 'hq', minLevel: 4 },
      { type: 'building', targetId: 'warehouse', minLevel: 4 },
    ],
    levelBandGates: [
      {
        minTargetLevel: 6,
        maxTargetLevel: 10,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 8 },
          { type: 'building', targetId: 'warehouse', minLevel: 6 },
        ],
      },
      {
        minTargetLevel: 11,
        maxTargetLevel: 15,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 12 },
          { type: 'building', targetId: 'market', minLevel: 6 },
        ],
      },
      {
        minTargetLevel: 16,
        maxTargetLevel: 20,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 16 },
          { type: 'building', targetId: 'military_academy', minLevel: 10 },
        ],
      },
    ],
    valueCompleteness: {
      costs: 'partially_defined',
      buildTime: 'partially_defined',
      population: 'partially_defined',
      effects: 'partially_defined',
    },
    operationalEffectsByBand: [
      { minLevel: 1, maxLevel: 5, effects: ['Research Capacity +3 per level', 'Active research prep time -1.0% per level'] },
      { minLevel: 6, maxLevel: 10, effects: ['Tech branch unlock depth progression', 'Research cycle efficiency +1.3% per level'] },
      { minLevel: 11, maxLevel: 15, effects: ['Cross-branch prerequisite relief +1.0% per level', 'Research queue turnover +1.2% per level'] },
      { minLevel: 16, maxLevel: 20, effects: ['Late strategic research throughput +1.6% per level', 'Global doctrine sync +1.0% per level'] },
    ],
    provisionalLevels: buildProvisionalLevels({
      baseCost: { ore: 175, stone: 175, iron: 130 },
      costScale: 1.185,
      baseSeconds: 56,
      populationCostByLevel: (level) => populationBand(level, 1, 2, 3),
      effectByLevel: (level) => [
        `Research Capacity +${level * 3} (aligns with micro formula)`,
        'One active research at a time (city rule)',
      ],
    }),
    notes: ['RC formula exists in docs and now has a provisional level table aligned to +3 RC per level.'],
  },
  {
    id: 'market',
    name: 'Market',
    category: 'support_logistics',
    phase: 'later',
    definitionStatus: 'partially_defined',
    gameplayImplemented: false,
    maxLevel: 25,
    role: 'Inter-city trading and resource logistics throughput.',
    primarySystems: ['trading', 'logistics'],
    unlock: [
      { type: 'hq', targetId: 'hq', minLevel: 5 },
      { type: 'building', targetId: 'warehouse', minLevel: 5 },
      { type: 'building', targetId: 'research_lab', minLevel: 2 },
    ],
    levelBandGates: [
      {
        minTargetLevel: 6,
        maxTargetLevel: 10,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 9 },
          { type: 'building', targetId: 'warehouse', minLevel: 8 },
        ],
      },
      {
        minTargetLevel: 11,
        maxTargetLevel: 15,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 13 },
          { type: 'building', targetId: 'intelligence_center', minLevel: 6 },
        ],
      },
      {
        minTargetLevel: 16,
        maxTargetLevel: 20,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 16 },
          { type: 'building', targetId: 'council_chamber', minLevel: 8 },
        ],
      },
    ],
    valueCompleteness: {
      costs: 'partially_defined',
      buildTime: 'partially_defined',
      population: 'partially_defined',
      effects: 'partially_defined',
    },
    operationalEffectsByBand: [
      { minLevel: 1, maxLevel: 5, effects: ['Trade convoy throughput +3.5% per level', 'Resource transit safety +1.4% per level'] },
      { minLevel: 6, maxLevel: 10, effects: ['Internal transfer tax -1.2% per level', 'Market order refresh speed +1.5% per level'] },
      { minLevel: 11, maxLevel: 15, effects: ['Route-slot growth +1 every 2 levels', 'Long-range convoy reliability +1.2% per level'] },
      { minLevel: 16, maxLevel: 20, effects: ['Late logistics friction reduction -1.5% per level', 'Bulk transfer cooldown -1.4% per level'] },
    ],
    provisionalLevels: buildProvisionalLevels({
      baseCost: { ore: 165, stone: 145, iron: 80 },
      costScale: 1.18,
      baseSeconds: 46,
      populationCostByLevel: (level) => populationBand(level, 1, 2, 3),
      effectByLevel: (level) => [
        `Trade convoy throughput +${Math.round(8 + level * 2.1)}%`,
        `Internal transfer tax -${Math.round(1 + level * 0.55)}%`,
      ],
    }),
  },
  {
    id: 'council_chamber',
    name: 'Council Chamber',
    category: 'governance',
    phase: 'later',
    definitionStatus: 'partially_defined',
    gameplayImplemented: false,
    maxLevel: 25,
    role: 'Local governance/governor authority interface into faction governance.',
    primarySystems: ['governance', 'faction_politics'],
    unlock: [
      { type: 'hq', targetId: 'hq', minLevel: 8 },
      { type: 'building', targetId: 'research_lab', minLevel: 5 },
      { type: 'building', targetId: 'market', minLevel: 4 },
    ],
    levelBandGates: [
      {
        minTargetLevel: 6,
        maxTargetLevel: 10,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 11 },
          { type: 'building', targetId: 'research_lab', minLevel: 5 },
        ],
      },
      {
        minTargetLevel: 11,
        maxTargetLevel: 15,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 14 },
          { type: 'building', targetId: 'market', minLevel: 8 },
        ],
      },
      {
        minTargetLevel: 16,
        maxTargetLevel: 20,
        prerequisites: [
          { type: 'hq', targetId: 'hq', minLevel: 18 },
          { type: 'building', targetId: 'intelligence_center', minLevel: 12 },
        ],
      },
    ],
    valueCompleteness: {
      costs: 'partially_defined',
      buildTime: 'partially_defined',
      population: 'partially_defined',
      effects: 'partially_defined',
    },
    operationalEffectsByBand: [
      { minLevel: 1, maxLevel: 5, effects: ['Local governance influence +2.2% per level', 'City policy duration +1.0% per level'] },
      { minLevel: 6, maxLevel: 10, effects: ['Council vote-weight +1.8% per level', 'Policy slot +1 at levels 7 and 10'] },
      { minLevel: 11, maxLevel: 15, effects: ['Collective mobilization prep-time -1.4% per level', 'Alliance aid request throughput +1.3% per level'] },
      { minLevel: 16, maxLevel: 20, effects: ['Late-war governance coordination +1.9% per level', 'Emergency decree cooldown -1.5% per level'] },
    ],
    provisionalLevels: buildProvisionalLevels({
      baseCost: { ore: 235, stone: 220, iron: 145 },
      costScale: 1.195,
      baseSeconds: 60,
      populationCostByLevel: (level) => populationBand(level, 1, 2, 3),
      effectByLevel: (level) => [
        `Faction governance vote weight +${Math.round(level * 1.1)}%`,
        `Collective mobilization prep time -${Math.round(1 + level * 0.5)}%`,
      ],
    }),
    notes: ['Governance effects are provisional and require macro-system product arbitration.'],
  },
];

export const DEFERRED_BUILDING_CATALOG: BuildingCatalogEntry[] = [
  {
    id: 'training_grounds',
    name: 'Training Grounds',
    category: 'support_logistics',
    phase: 'later',
    definitionStatus: 'partially_defined',
    gameplayImplemented: false,
    maxLevel: 1,
    role: 'Deferred prestige modifier: +10% population cap.',
    primarySystems: ['deferred', 'prestige', 'population'],
    unlock: [{ type: 'other', targetId: 'prestige_unlock', note: 'Deferred from active balance scope.' }],
    valueCompleteness: {
      costs: 'unresolved_design_questions',
      buildTime: 'unresolved_design_questions',
      population: 'fully_defined',
      effects: 'partially_defined',
    },
  },
  {
    id: 'shard_vault',
    name: 'Shard Vault',
    category: 'support_logistics',
    phase: 'later',
    definitionStatus: 'partially_defined',
    gameplayImplemented: false,
    maxLevel: 25,
    role: 'Deferred premium shard branch (reintegrate after core balance stabilization).',
    primarySystems: ['deferred', 'premium', 'shards'],
    unlock: [{ type: 'other', targetId: 'premium_branch', note: 'Deferred from active balance scope.' }],
    valueCompleteness: {
      costs: 'unresolved_design_questions',
      buildTime: 'unresolved_design_questions',
      population: 'unresolved_design_questions',
      effects: 'partially_defined',
    },
  },
];

export const FULL_UNIT_CATALOG: UnitCatalogEntry[] = [
  {
    id: 'line_infantry',
    name: 'Frontline Trooper',
    category: 'ground_line',
    phase: 'v0',
    definitionStatus: 'fully_defined',
    gameplayImplemented: true,
    role: 'Base line infantry unit.',
    unlock: [{ type: 'building', targetId: 'barracks', minLevel: 1 }],
    valueCompleteness: {
      costs: 'fully_defined',
      trainingTime: 'fully_defined',
      population: 'fully_defined',
      combatStats: 'partially_defined',
      logisticsStats: 'partially_defined',
    },
    provisionalProfile: {
      resources: { ore: 28, stone: 20, iron: 0 },
      trainingSeconds: 20,
      populationCost: 1,
      attackType: 'kinetic',
      speedTier: 'medium',
      combatProfile: {
        offense: { kinetic: 18, energy: 8, plasma: 6 },
        defense: { kinetic: 14, energy: 11, plasma: 9 },
        structureDamage: 4,
      },
    },
  },
  {
    id: 'aegis_shieldguard',
    name: 'Aegis Walker',
    category: 'ground_line',
    phase: 'v0',
    definitionStatus: 'fully_defined',
    gameplayImplemented: true,
    role: 'Defensive ground anchor line.',
    unlock: [{ type: 'building', targetId: 'barracks', minLevel: 5 }],
    valueCompleteness: {
      costs: 'fully_defined',
      trainingTime: 'fully_defined',
      population: 'fully_defined',
      combatStats: 'partially_defined',
      logisticsStats: 'partially_defined',
    },
    provisionalProfile: {
      resources: { ore: 58, stone: 50, iron: 12 },
      trainingSeconds: 40,
      populationCost: 2,
      attackType: 'kinetic',
      speedTier: 'slow',
      combatProfile: {
        offense: { kinetic: 14, energy: 7, plasma: 5 },
        defense: { kinetic: 24, energy: 18, plasma: 16 },
        structureDamage: 3,
      },
    },
  },
  {
    id: 'rail_marksman',
    name: 'Railgun Skirmisher',
    category: 'ground_line',
    phase: 'v0',
    definitionStatus: 'fully_defined',
    gameplayImplemented: true,
    role: 'Ranged plasma line unit.',
    unlock: [{ type: 'building', targetId: 'barracks', minLevel: 10 }],
    valueCompleteness: {
      costs: 'fully_defined',
      trainingTime: 'fully_defined',
      population: 'fully_defined',
      combatStats: 'partially_defined',
      logisticsStats: 'partially_defined',
    },
    provisionalProfile: {
      resources: { ore: 82, stone: 52, iron: 34 },
      trainingSeconds: 50,
      populationCost: 2,
      attackType: 'plasma',
      speedTier: 'medium',
      combatProfile: {
        offense: { kinetic: 7, energy: 10, plasma: 24 },
        defense: { kinetic: 9, energy: 11, plasma: 14 },
        structureDamage: 5,
      },
    },
  },
  {
    id: 'raider_hoverbike',
    name: 'Raider Interceptor',
    category: 'ground_line',
    phase: 'v0',
    definitionStatus: 'fully_defined',
    gameplayImplemented: true,
    role: 'Fast raid-focused ground unit.',
    unlock: [{ type: 'building', targetId: 'barracks', minLevel: 15 }],
    valueCompleteness: {
      costs: 'fully_defined',
      trainingTime: 'fully_defined',
      population: 'fully_defined',
      combatStats: 'partially_defined',
      logisticsStats: 'partially_defined',
    },
    provisionalProfile: {
      resources: { ore: 122, stone: 86, iron: 54 },
      trainingSeconds: 70,
      populationCost: 3,
      attackType: 'kinetic',
      speedTier: 'very_fast',
      combatProfile: {
        offense: { kinetic: 28, energy: 11, plasma: 9 },
        defense: { kinetic: 12, energy: 10, plasma: 8 },
        structureDamage: 6,
      },
    },
  },
  {
    id: 'assault_legionnaire',
    name: 'Assault Ranger',
    category: 'ground_line',
    phase: 'v0',
    definitionStatus: 'fully_defined',
    gameplayImplemented: true,
    role: 'Advanced assault_legionnaire line unit.',
    unlock: [{ type: 'building', targetId: 'combat_forge', minLevel: 1 }],
    valueCompleteness: {
      costs: 'fully_defined',
      trainingTime: 'fully_defined',
      population: 'fully_defined',
      combatStats: 'partially_defined',
      logisticsStats: 'partially_defined',
    },
    provisionalProfile: {
      resources: { ore: 145, stone: 108, iron: 90 },
      trainingSeconds: 85,
      populationCost: 3,
      attackType: 'energy',
      speedTier: 'medium',
      combatProfile: {
        offense: { kinetic: 10, energy: 30, plasma: 12 },
        defense: { kinetic: 14, energy: 13, plasma: 10 },
        structureDamage: 8,
      },
    },
  },
  {
    id: 'siege_breacher',
    name: 'Siege Artillery',
    category: 'ground_line',
    phase: 'v0',
    definitionStatus: 'fully_defined',
    gameplayImplemented: true,
    role: 'Heavy breakthrough / anti-structure pressure line unit.',
    unlock: [{ type: 'building', targetId: 'combat_forge', minLevel: 8 }],
    valueCompleteness: {
      costs: 'fully_defined',
      trainingTime: 'fully_defined',
      population: 'fully_defined',
      combatStats: 'partially_defined',
      logisticsStats: 'partially_defined',
    },
    provisionalProfile: {
      resources: { ore: 210, stone: 180, iron: 135 },
      trainingSeconds: 115,
      populationCost: 4,
      attackType: 'kinetic',
      speedTier: 'very_slow',
      combatProfile: {
        offense: { kinetic: 34, energy: 10, plasma: 8 },
        defense: { kinetic: 18, energy: 14, plasma: 12 },
        structureDamage: 16,
      },
    },
  },
  {
    id: 'interceptor_sentinel',
    name: 'Sentinel Interceptor',
    category: 'projection',
    phase: 'v0',
    definitionStatus: 'fully_defined',
    gameplayImplemented: true,
    role: 'Projection screen interception unit.',
    unlock: [{ type: 'building', targetId: 'space_dock', minLevel: 1 }],
    valueCompleteness: {
      costs: 'fully_defined',
      trainingTime: 'fully_defined',
      population: 'fully_defined',
      combatStats: 'partially_defined',
      logisticsStats: 'partially_defined',
    },
    provisionalProfile: {
      resources: { ore: 178, stone: 132, iron: 130 },
      trainingSeconds: 95,
      populationCost: 3,
      attackType: 'energy',
      speedTier: 'very_fast',
      combatProfile: {
        offense: { kinetic: 8, energy: 26, plasma: 14 },
        defense: { kinetic: 13, energy: 18, plasma: 15 },
        structureDamage: 4,
      },
    },
  },
  {
    id: 'rapid_escort',
    name: 'Vanguard Corvette',
    category: 'projection',
    phase: 'v0',
    definitionStatus: 'fully_defined',
    gameplayImplemented: true,
    role: 'Escort unit for inter-sector projection groups.',
    unlock: [{ type: 'building', targetId: 'space_dock', minLevel: 5 }],
    valueCompleteness: {
      costs: 'fully_defined',
      trainingTime: 'fully_defined',
      population: 'fully_defined',
      combatStats: 'partially_defined',
      logisticsStats: 'partially_defined',
    },
    provisionalProfile: {
      resources: { ore: 235, stone: 170, iron: 170 },
      trainingSeconds: 120,
      populationCost: 3,
      attackType: 'plasma',
      speedTier: 'fast',
      combatProfile: {
        offense: { kinetic: 9, energy: 16, plasma: 28 },
        defense: { kinetic: 12, energy: 14, plasma: 16 },
        structureDamage: 5,
      },
    },
  },
  {
    id: 'assault_dropship',
    name: 'Strike Dropship',
    category: 'projection',
    phase: 'later',
    definitionStatus: 'partially_defined',
    gameplayImplemented: false,
    role: 'Required transport to project assault_legionnaire troops inter-sector.',
    unlock: [{ type: 'building', targetId: 'space_dock', minLevel: 10 }],
    valueCompleteness: {
      costs: 'partially_defined',
      trainingTime: 'partially_defined',
      population: 'partially_defined',
      combatStats: 'partially_defined',
      logisticsStats: 'partially_defined',
    },
    provisionalProfile: {
      resources: { ore: 300, stone: 235, iron: 210 },
      trainingSeconds: 170,
      populationCost: 7,
      attackType: 'none',
      speedTier: 'slow',
      logistics: {
        convoyCapacityPopulation: 12,
        requiresEscort: true,
      },
      combatProfile: {
        offense: { kinetic: 0, energy: 0, plasma: 0 },
        defense: { kinetic: 8, energy: 10, plasma: 8 },
        structureDamage: 0,
      },
    },
    notes: ['Capacity 10 pop is doc-confirmed; cost/time are now provisional pending product arbitration.'],
  },
  {
    id: 'siege_runner',
    name: 'Siege Runner',
    category: 'siege',
    phase: 'later',
    definitionStatus: 'partially_defined',
    gameplayImplemented: false,
    role: 'Mobile anti-structure siege line requiring escort.',
    unlock: [{ type: 'building', targetId: 'space_dock', minLevel: 15 }],
    valueCompleteness: {
      costs: 'partially_defined',
      trainingTime: 'partially_defined',
      population: 'partially_defined',
      combatStats: 'partially_defined',
      logisticsStats: 'partially_defined',
    },
    provisionalProfile: {
      resources: { ore: 330, stone: 275, iron: 240 },
      trainingSeconds: 205,
      populationCost: 6,
      attackType: 'kinetic',
      speedTier: 'very_slow',
      logistics: {
        requiresEscort: true,
      },
      combatProfile: {
        offense: { kinetic: 32, energy: 9, plasma: 7 },
        defense: { kinetic: 10, energy: 8, plasma: 9 },
        structureDamage: 22,
      },
    },
    notes: ['Anti-structure role is defined; structure-damage coefficients still require combat-model arbitration.'],
  },
  {
    id: 'colonization_arkship',
    name: 'Colony Ark',
    category: 'colonization',
    phase: 'later',
    definitionStatus: 'partially_defined',
    gameplayImplemented: false,
    role: 'Territorial capture unit consumed on colonization arrival.',
    unlock: [
      { type: 'building', targetId: 'space_dock', minLevel: 20 },
      { type: 'hq', targetId: 'hq', minLevel: 10 },
    ],
    valueCompleteness: {
      costs: 'partially_defined',
      trainingTime: 'partially_defined',
      population: 'partially_defined',
      combatStats: 'partially_defined',
      logisticsStats: 'partially_defined',
    },
    provisionalProfile: {
      resources: { ore: 520, stone: 420, iron: 360 },
      trainingSeconds: 300,
      populationCost: 12,
      attackType: 'none',
      speedTier: 'extreme_slow',
      logistics: {
        consumedOnArrival: true,
        requiresEscort: true,
      },
      combatProfile: {
        offense: { kinetic: 0, energy: 0, plasma: 0 },
        defense: { kinetic: 6, energy: 8, plasma: 6 },
        structureDamage: 0,
      },
    },
    notes: ['Escort mandatory and consumed on successful colonization.'],
  },
];

export const MVP_MICRO_STANDARD_BUILDING_IDS = [
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
] as const;

export const BUILDING_CATALOG_BY_PHASE: Record<ContentPhase, string[]> = {
  mvp: [...MVP_MICRO_STANDARD_BUILDING_IDS],
  v0: [],
  later: FULL_BUILDING_CATALOG.filter((entry) => !MVP_MICRO_STANDARD_BUILDING_IDS.includes(entry.id as (typeof MVP_MICRO_STANDARD_BUILDING_IDS)[number])).map(
    (entry) => entry.id,
  ),
};

export const UNIT_CATALOG_BY_PHASE: Record<ContentPhase, string[]> = {
  mvp: FULL_UNIT_CATALOG.filter((entry) => entry.phase === 'mvp').map((entry) => entry.id),
  v0: FULL_UNIT_CATALOG.filter((entry) => entry.phase === 'v0').map((entry) => entry.id),
  later: FULL_UNIT_CATALOG.filter((entry) => entry.phase === 'later').map((entry) => entry.id),
};

export function getContentCatalogCompletenessSummary() {
  const building = {
    fullyDefined: FULL_BUILDING_CATALOG.filter((entry) => entry.definitionStatus === 'fully_defined').length,
    partiallyDefined: FULL_BUILDING_CATALOG.filter((entry) => entry.definitionStatus === 'partially_defined').length,
    placeholderValuesNeeded: FULL_BUILDING_CATALOG.filter((entry) => entry.definitionStatus === 'placeholder_values_needed').length,
    unresolvedDesignQuestions: FULL_BUILDING_CATALOG.filter((entry) => entry.definitionStatus === 'unresolved_design_questions').length,
  };

  const units = {
    fullyDefined: FULL_UNIT_CATALOG.filter((entry) => entry.definitionStatus === 'fully_defined').length,
    partiallyDefined: FULL_UNIT_CATALOG.filter((entry) => entry.definitionStatus === 'partially_defined').length,
    placeholderValuesNeeded: FULL_UNIT_CATALOG.filter((entry) => entry.definitionStatus === 'placeholder_values_needed').length,
    unresolvedDesignQuestions: FULL_UNIT_CATALOG.filter((entry) => entry.definitionStatus === 'unresolved_design_questions').length,
  };

  return { building, units };
}
