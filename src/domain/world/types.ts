export type SectorControlState = 'neutral' | 'controlled' | 'homeland' | 'contested';

export interface Faction {
  id: string;
  tokenSymbol: string;
  name: string;
  color: string;
  treasury: number;
  influence: number;
}

export interface City {
  id: string;
  name: string;
  owner: string;
  factionId: string;
  slotId: string;
  population: number;
  defense: number;
  morale: number;
  resources: {
    food: number;
    ore: number;
    energy: number;
    credits: number;
  };
  productionQueue: Array<{ id: string; label: string; turnsRemaining: number }>;
}

export interface CitySlot {
  id: string;
  label: string;
  occupiedByCityId: string | null;
  isCapitalSlot: boolean;
  terrain: 'coast' | 'ridge' | 'plains' | 'urban';
}

export interface MapCluster {
  id: string;
  label: string;
  center: { x: number; y: number };
}

export interface WorldSector {
  id: string;
  name: string;
  clusterId: string;
  position: { x: number; y: number };
  controlState: SectorControlState;
  controllingFactionId: string | null;
  homelandFactionId: string | null;
  citySlots: CitySlot[];
  strategicValue: number;
}

export type ViewName = 'map' | 'faction' | 'city';

export interface SelectedViewState {
  view: ViewName;
  selectedSectorId: string | null;
  selectedCityId: string | null;
}

export interface WorldModel {
  sectors: WorldSector[];
  factions: Faction[];
  cities: City[];
  clusters: MapCluster[];
}
