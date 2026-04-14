export type RenderMode = 'galaxy2d' | 'planet3d' | 'city3d';

export type PlanetSeed = number;
export type PlanetArchetype = 'arid' | 'frozen' | 'volcanic' | 'mineral' | 'terrestrial' | 'oceanic' | 'barren' | 'jungle';

export interface SelectedPlanetRef {
  id: string;
  seed: PlanetSeed;
}

export interface PlanetVisualProfile {
  archetype: PlanetArchetype;
  oceanLevel: number;
  roughness: number;
  metalness: number;
  reliefStrength: number;
  reliefSharpness: number;
  continentScale: number;
  ridgeScale: number;
  craterScale: number;
  lightIntensity: number;
  atmosphereLightness: number;
  macroBias: number;
  ridgeWeight: number;
  craterWeight: number;
  polarWeight: number;
  humidityStrength: number;
  emissiveIntensity: number;
}

export interface GalaxyNode {
  id: string;
  name: string;
  x: number;
  y: number;
  radius: number;
  seed: PlanetSeed;
  populationBand: 'sparse' | 'settled' | 'dense';
}

export interface GalaxyData {
  seed: number;
  width: number;
  height: number;
  nodes: GalaxyNode[];
}
