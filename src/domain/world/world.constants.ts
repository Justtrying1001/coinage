import { DEFAULT_GALAXY_LAYOUT_CONFIG, type GalaxyLayoutConfig } from './generate-galaxy-layout';

export const WORLD_SEED = 'coinage-mvp-seed';

export const GALAXY_LAYOUT_RUNTIME_CONFIG: GalaxyLayoutConfig = {
  ...DEFAULT_GALAXY_LAYOUT_CONFIG,
  planetCount: 500,
  fieldRadius: 360,
  minSpacing: 9.1,
};
