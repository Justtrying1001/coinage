import type { PlanetRenderInput, PlanetRenderInstance } from './types';
import { createPlanetDetailRenderInstance } from './planet-detail-renderer';
import { createPlanetGalaxyRenderInstance } from './planet-galaxy-renderer';
export { updatePlanetLayerAnimation } from './update-planet-layer-animation';

/**
 * Shared dispatcher kept for compatibility.
 * Galaxy map code should call `createPlanetGalaxyRenderInstance` directly.
 */
export function createPlanetRenderInstance(input: PlanetRenderInput): PlanetRenderInstance {
  return input.options.viewMode === 'galaxy'
    ? createPlanetGalaxyRenderInstance(input)
    : createPlanetDetailRenderInstance(input);
}
