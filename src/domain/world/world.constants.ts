import { DEFAULT_GALAXY_LAYOUT_CONFIG, type GalaxyLayoutConfig } from './generate-galaxy-layout';

export const WORLD_SEED = 'coinage-mvp-seed';

export const GALAXY_LAYOUT_RUNTIME_CONFIG: GalaxyLayoutConfig = {
  ...DEFAULT_GALAXY_LAYOUT_CONFIG,
  planetCount: 158,
  fieldRadius: 88,
  minSpacing: 4.4,
};
