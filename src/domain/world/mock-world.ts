import type { City, Faction, MapCluster, WorldModel, WorldSector } from './types';

const factions: Faction[] = [
  {
    id: 'fx-atlas',
    tokenSymbol: 'ATL',
    name: 'Atlas Combine',
    color: '#38bdf8',
    treasury: 824000,
    influence: 67,
  },
  {
    id: 'fx-helios',
    tokenSymbol: 'HEL',
    name: 'Helios Syndicate',
    color: '#f59e0b',
    treasury: 609000,
    influence: 58,
  },
  {
    id: 'fx-nyx',
    tokenSymbol: 'NYX',
    name: 'Nyx Accord',
    color: '#a78bfa',
    treasury: 490000,
    influence: 49,
  },
];

const clusters: MapCluster[] = [
  { id: 'cl-west', label: 'West Reach', center: { x: -320, y: -160 } },
  { id: 'cl-core', label: 'Core Expanse', center: { x: 20, y: -20 } },
  { id: 'cl-east', label: 'East Frontier', center: { x: 360, y: 150 } },
];

const sectors: WorldSector[] = [
  {
    id: 'sec-01',
    name: 'Aster Basin',
    clusterId: 'cl-west',
    position: { x: -410, y: -220 },
    controlState: 'homeland',
    controllingFactionId: 'fx-atlas',
    homelandFactionId: 'fx-atlas',
    strategicValue: 84,
    citySlots: [
      { id: 'slot-01a', label: 'Harbor Rim', occupiedByCityId: 'city-aurora', isCapitalSlot: true, terrain: 'coast' },
      { id: 'slot-01b', label: 'North Ward', occupiedByCityId: null, isCapitalSlot: false, terrain: 'plains' },
      { id: 'slot-01c', label: 'Iron Steps', occupiedByCityId: null, isCapitalSlot: false, terrain: 'ridge' },
    ],
  },
  {
    id: 'sec-02',
    name: 'Caligo Strait',
    clusterId: 'cl-west',
    position: { x: -250, y: -120 },
    controlState: 'controlled',
    controllingFactionId: 'fx-atlas',
    homelandFactionId: null,
    strategicValue: 61,
    citySlots: [
      { id: 'slot-02a', label: 'Fog Quay', occupiedByCityId: 'city-bastion', isCapitalSlot: false, terrain: 'coast' },
      { id: 'slot-02b', label: 'Salt Reach', occupiedByCityId: null, isCapitalSlot: false, terrain: 'plains' },
    ],
  },
  {
    id: 'sec-03',
    name: 'Titan Fold',
    clusterId: 'cl-core',
    position: { x: -40, y: -40 },
    controlState: 'neutral',
    controllingFactionId: null,
    homelandFactionId: null,
    strategicValue: 72,
    citySlots: [
      { id: 'slot-03a', label: 'Fold Gate', occupiedByCityId: null, isCapitalSlot: false, terrain: 'urban' },
      { id: 'slot-03b', label: 'Ember Terrace', occupiedByCityId: null, isCapitalSlot: false, terrain: 'plains' },
    ],
  },
  {
    id: 'sec-04',
    name: 'Khepri Delta',
    clusterId: 'cl-core',
    position: { x: 110, y: 80 },
    controlState: 'contested',
    controllingFactionId: 'fx-helios',
    homelandFactionId: null,
    strategicValue: 90,
    citySlots: [
      { id: 'slot-04a', label: 'Delta Crown', occupiedByCityId: 'city-solace', isCapitalSlot: false, terrain: 'coast' },
      { id: 'slot-04b', label: 'Canal Spine', occupiedByCityId: null, isCapitalSlot: false, terrain: 'urban' },
      { id: 'slot-04c', label: 'Rift Farms', occupiedByCityId: null, isCapitalSlot: false, terrain: 'plains' },
    ],
  },
  {
    id: 'sec-05',
    name: 'Solaris Verge',
    clusterId: 'cl-east',
    position: { x: 290, y: 120 },
    controlState: 'homeland',
    controllingFactionId: 'fx-helios',
    homelandFactionId: 'fx-helios',
    strategicValue: 87,
    citySlots: [
      { id: 'slot-05a', label: 'Sunforge', occupiedByCityId: 'city-zenith', isCapitalSlot: true, terrain: 'urban' },
      { id: 'slot-05b', label: 'Radiant Docks', occupiedByCityId: null, isCapitalSlot: false, terrain: 'coast' },
    ],
  },
  {
    id: 'sec-06',
    name: 'Umbral Keys',
    clusterId: 'cl-east',
    position: { x: 460, y: 200 },
    controlState: 'controlled',
    controllingFactionId: 'fx-nyx',
    homelandFactionId: null,
    strategicValue: 55,
    citySlots: [
      { id: 'slot-06a', label: 'Obsidian Pier', occupiedByCityId: 'city-noctis', isCapitalSlot: false, terrain: 'coast' },
      { id: 'slot-06b', label: 'Cipher Ridge', occupiedByCityId: null, isCapitalSlot: false, terrain: 'ridge' },
    ],
  },
];

const cities: City[] = [
  {
    id: 'city-aurora',
    name: 'Aurora Prime',
    owner: 'Player One',
    factionId: 'fx-atlas',
    slotId: 'slot-01a',
    population: 14200,
    defense: 71,
    morale: 82,
    resources: { food: 4100, ore: 3580, energy: 4790, credits: 2200 },
    productionQueue: [
      { id: 'q1', label: 'Drone Barracks II', turnsRemaining: 3 },
      { id: 'q2', label: 'Ore Refinery Upgrade', turnsRemaining: 6 },
    ],
  },
  {
    id: 'city-bastion',
    name: 'Bastion Tide',
    owner: 'Atlas Regent',
    factionId: 'fx-atlas',
    slotId: 'slot-02a',
    population: 8600,
    defense: 62,
    morale: 75,
    resources: { food: 1900, ore: 2500, energy: 1700, credits: 980 },
    productionQueue: [{ id: 'q3', label: 'Wall Hardening', turnsRemaining: 2 }],
  },
  {
    id: 'city-solace',
    name: 'Solace Port',
    owner: 'Helios Consul',
    factionId: 'fx-helios',
    slotId: 'slot-04a',
    population: 9700,
    defense: 54,
    morale: 64,
    resources: { food: 2100, ore: 1880, energy: 2600, credits: 1150 },
    productionQueue: [{ id: 'q4', label: 'Militia Muster', turnsRemaining: 1 }],
  },
  {
    id: 'city-zenith',
    name: 'Zenith Capital',
    owner: 'Player Two',
    factionId: 'fx-helios',
    slotId: 'slot-05a',
    population: 13100,
    defense: 69,
    morale: 79,
    resources: { food: 3800, ore: 3200, energy: 4900, credits: 3050 },
    productionQueue: [{ id: 'q5', label: 'Academy Research', turnsRemaining: 4 }],
  },
  {
    id: 'city-noctis',
    name: 'Noctis Hold',
    owner: 'Player Three',
    factionId: 'fx-nyx',
    slotId: 'slot-06a',
    population: 7900,
    defense: 57,
    morale: 73,
    resources: { food: 1500, ore: 2100, energy: 3200, credits: 840 },
    productionQueue: [{ id: 'q6', label: 'Scout Corvettes', turnsRemaining: 5 }],
  },
];

export function getMockWorldModel(): WorldModel {
  return {
    sectors,
    factions,
    cities,
    clusters,
  };
}
