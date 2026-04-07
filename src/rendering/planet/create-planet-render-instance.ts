import * as THREE from 'three';

import type { PlanetRenderInput, PlanetRenderInstance } from './types';
import { createPlanetDetailRenderInstance } from './planet-detail-renderer';
import { createPlanetGalaxyRenderInstance } from './planet-galaxy-renderer';

export function updatePlanetLayerAnimation(object: THREE.Object3D, deltaSeconds: number, freezeRotation = false): void {
  if (freezeRotation) return;
  object.traverse((node) => {
    const speed = typeof node.userData.rotationSpeed === 'number' ? node.userData.rotationSpeed : 0;
    if (speed !== 0 && node instanceof THREE.Object3D) {
      node.rotation.y += speed * deltaSeconds;
    }
  });
}

export function createPlanetRenderInstance(input: PlanetRenderInput): PlanetRenderInstance {
  return input.options.viewMode === 'galaxy'
    ? createPlanetGalaxyRenderInstance(input)
    : createPlanetDetailRenderInstance(input);
}
