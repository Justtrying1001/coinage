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
  notes?: string[];
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
    maxLevel: 20,
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
    maxLevel: 20,
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
    maxLevel: 20,
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
    maxLevel: 20,
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
    maxLevel: 20,
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
    maxLevel: 20,
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
  },
  {
    id: 'combat_forge',
    name: 'Combat Forge',
    category: 'military',
    phase: 'v0',
    definitionStatus: 'fully_defined',
    gameplayImplemented: true,
    maxLevel: 20,
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
  },
  {
    id: 'space_dock',
    name: 'Space Dock',
    category: 'military',
    phase: 'v0',
    definitionStatus: 'fully_defined',
    gameplayImplemented: true,
    maxLevel: 20,
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
  },
  {
    id: 'defensive_wall',
    name: 'Defensive Wall',
    category: 'defense',
    phase: 'later',
    definitionStatus: 'partially_defined',
    gameplayImplemented: false,
    maxLevel: 20,
    role: 'Global city defense multiplier during local defense phase.',
    primarySystems: ['defense', 'combat_phase_2'],
    unlock: [{ type: 'hq', targetId: 'hq', minLevel: 4 }],
    valueCompleteness: {
      costs: 'placeholder_values_needed',
      buildTime: 'placeholder_values_needed',
      population: 'placeholder_values_needed',
      effects: 'partially_defined',
    },
    notes: ['Referenced in micro combat doc as a global defense bonus source.'],
  },
  {
    id: 'watch_tower',
    name: 'Watch Tower',
    category: 'defense',
    phase: 'later',
    definitionStatus: 'partially_defined',
    gameplayImplemented: false,
    maxLevel: 20,
    role: 'Defensive/scouting support for incoming military visibility and local resilience.',
    primarySystems: ['defense', 'intel_support'],
    unlock: [{ type: 'hq', targetId: 'hq', minLevel: 5 }],
    valueCompleteness: {
      costs: 'placeholder_values_needed',
      buildTime: 'placeholder_values_needed',
      population: 'placeholder_values_needed',
      effects: 'unresolved_design_questions',
    },
  },
  {
    id: 'military_academy',
    name: 'Military Academy',
    category: 'military',
    phase: 'later',
    definitionStatus: 'partially_defined',
    gameplayImplemented: false,
    maxLevel: 20,
    role: 'Late military specialization and doctrine building.',
    primarySystems: ['military_specialization', 'research_bridge'],
    unlock: [{ type: 'hq', targetId: 'hq', minLevel: 12 }],
    valueCompleteness: {
      costs: 'placeholder_values_needed',
      buildTime: 'placeholder_values_needed',
      population: 'placeholder_values_needed',
      effects: 'unresolved_design_questions',
    },
  },
  {
    id: 'armament_factory',
    name: 'Armament Factory',
    category: 'military',
    phase: 'later',
    definitionStatus: 'partially_defined',
    gameplayImplemented: false,
    maxLevel: 20,
    role: 'Military production optimization / war-economy support building.',
    primarySystems: ['military_economy', 'training_efficiency'],
    unlock: [{ type: 'hq', targetId: 'hq', minLevel: 12 }],
    valueCompleteness: {
      costs: 'placeholder_values_needed',
      buildTime: 'placeholder_values_needed',
      population: 'placeholder_values_needed',
      effects: 'unresolved_design_questions',
    },
  },
  {
    id: 'intelligence_center',
    name: 'Intelligence Center',
    category: 'intelligence',
    phase: 'later',
    definitionStatus: 'partially_defined',
    gameplayImplemented: false,
    maxLevel: 20,
    role: 'Spy vault and mission unlock progression.',
    primarySystems: ['espionage', 'spy_vault', 'counter_intel'],
    unlock: [{ type: 'hq', targetId: 'hq', minLevel: 4 }],
    valueCompleteness: {
      costs: 'placeholder_values_needed',
      buildTime: 'placeholder_values_needed',
      population: 'placeholder_values_needed',
      effects: 'partially_defined',
    },
    notes: ['Mission tiers are defined in docs at levels 1/5/10/15/20.'],
  },
  {
    id: 'research_lab',
    name: 'Research Lab',
    category: 'research',
    phase: 'later',
    definitionStatus: 'partially_defined',
    gameplayImplemented: false,
    maxLevel: 20,
    role: 'Research Capacity contribution and tech branch progression.',
    primarySystems: ['research', 'research_capacity'],
    unlock: [{ type: 'hq', targetId: 'hq', minLevel: 4 }],
    valueCompleteness: {
      costs: 'placeholder_values_needed',
      buildTime: 'placeholder_values_needed',
      population: 'placeholder_values_needed',
      effects: 'partially_defined',
    },
    notes: ['RC formula exists, but per-level lab table remains unspecified.'],
  },
  {
    id: 'market',
    name: 'Market',
    category: 'support_logistics',
    phase: 'later',
    definitionStatus: 'partially_defined',
    gameplayImplemented: false,
    maxLevel: 20,
    role: 'Inter-city trading and resource logistics throughput.',
    primarySystems: ['trading', 'logistics'],
    unlock: [{ type: 'hq', targetId: 'hq', minLevel: 5 }],
    valueCompleteness: {
      costs: 'placeholder_values_needed',
      buildTime: 'placeholder_values_needed',
      population: 'placeholder_values_needed',
      effects: 'unresolved_design_questions',
    },
  },
  {
    id: 'council_chamber',
    name: 'Council Chamber',
    category: 'governance',
    phase: 'later',
    definitionStatus: 'partially_defined',
    gameplayImplemented: false,
    maxLevel: 20,
    role: 'Local governance/governor authority interface into faction governance.',
    primarySystems: ['governance', 'faction_politics'],
    unlock: [{ type: 'hq', targetId: 'hq', minLevel: 8 }],
    valueCompleteness: {
      costs: 'placeholder_values_needed',
      buildTime: 'placeholder_values_needed',
      population: 'placeholder_values_needed',
      effects: 'unresolved_design_questions',
    },
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
    maxLevel: 20,
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
    id: 'infantry',
    name: 'Infantry',
    category: 'ground_line',
    phase: 'v0',
    definitionStatus: 'fully_defined',
    gameplayImplemented: true,
    role: 'Base line infantry.',
    unlock: [{ type: 'building', targetId: 'barracks', minLevel: 1 }],
    valueCompleteness: {
      costs: 'fully_defined',
      trainingTime: 'fully_defined',
      population: 'fully_defined',
      combatStats: 'partially_defined',
      logisticsStats: 'partially_defined',
    },
  },
  {
    id: 'shield_guard',
    name: 'Shield Guard',
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
  },
  {
    id: 'marksman',
    name: 'Marksman',
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
  },
  {
    id: 'raider_cavalry',
    name: 'Raider Cavalry',
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
  },
  {
    id: 'assault',
    name: 'Assault',
    category: 'ground_line',
    phase: 'v0',
    definitionStatus: 'fully_defined',
    gameplayImplemented: true,
    role: 'Advanced assault line unit.',
    unlock: [{ type: 'building', targetId: 'combat_forge', minLevel: 1 }],
    valueCompleteness: {
      costs: 'fully_defined',
      trainingTime: 'fully_defined',
      population: 'fully_defined',
      combatStats: 'partially_defined',
      logisticsStats: 'partially_defined',
    },
  },
  {
    id: 'breacher',
    name: 'Breacher',
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
  },
  {
    id: 'interception_sentinel',
    name: 'Interception Sentinel',
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
  },
  {
    id: 'rapid_escort',
    name: 'Rapid Escort',
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
  },
  {
    id: 'assault_convoy',
    name: 'Assault Convoy',
    category: 'projection',
    phase: 'later',
    definitionStatus: 'partially_defined',
    gameplayImplemented: false,
    role: 'Required transport to project assault troops inter-sector.',
    unlock: [{ type: 'building', targetId: 'space_dock', minLevel: 10 }],
    valueCompleteness: {
      costs: 'placeholder_values_needed',
      trainingTime: 'placeholder_values_needed',
      population: 'partially_defined',
      combatStats: 'partially_defined',
      logisticsStats: 'partially_defined',
    },
    notes: ['Capacity 10 pop defined in docs; numeric cost/time pending.'],
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
      costs: 'placeholder_values_needed',
      trainingTime: 'placeholder_values_needed',
      population: 'partially_defined',
      combatStats: 'partially_defined',
      logisticsStats: 'partially_defined',
    },
  },
  {
    id: 'colonization_convoy',
    name: 'Colonization Convoy',
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
      costs: 'placeholder_values_needed',
      trainingTime: 'placeholder_values_needed',
      population: 'partially_defined',
      combatStats: 'partially_defined',
      logisticsStats: 'partially_defined',
    },
    notes: ['Escort mandatory and consumed on successful colonization.'],
  },
];

export const BUILDING_CATALOG_BY_PHASE: Record<ContentPhase, string[]> = {
  mvp: FULL_BUILDING_CATALOG.filter((entry) => entry.phase === 'mvp').map((entry) => entry.id),
  v0: FULL_BUILDING_CATALOG.filter((entry) => entry.phase === 'v0').map((entry) => entry.id),
  later: FULL_BUILDING_CATALOG.filter((entry) => entry.phase === 'later').map((entry) => entry.id),
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
