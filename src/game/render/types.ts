export type RenderMode = 'galaxy2d' | 'planet3d';

export type PlanetSeed = number;

export interface SelectedPlanetRef {
  id: string;
  seed: PlanetSeed;
}

export interface PlanetVisualProfile {
  baseHue: number;
  accentHue: number;
  oceanLevel: number;
  roughness: number;
  reliefStrength: number;
  lightIntensity: number;
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
