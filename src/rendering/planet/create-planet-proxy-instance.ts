import * as THREE from 'three';

import type { CanonicalPlanet } from '@/domain/world/planet-visual.types';

export interface PlanetProxyInstance {
  object: THREE.Mesh;
  dispose: () => void;
}

function toColor(v: [number, number, number]): THREE.Color {
  return new THREE.Color(v[0], v[1], v[2]);
}

export function createPlanetProxyInstance(
  planet: CanonicalPlanet,
  position: { x: number; y: number; z: number },
): PlanetProxyInstance {
  const radius = planet.render.scale.silhouetteProtectedRadius;
  const geometry = new THREE.SphereGeometry(radius, 20, 20);
  const material = new THREE.MeshStandardMaterial({
    color: toColor(planet.render.surface.colorMid),
    emissive: toColor(planet.render.surface.colorDeep).multiplyScalar(0.08),
    roughness: 0.72,
    metalness: 0.05,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(position.x, position.y, position.z);
  mesh.name = 'planet-proxy';
  mesh.userData.rotationSpeed = planet.render.surfaceModel === 'gaseous' ? 0.006 : 0.01;
  mesh.userData.planetId = planet.identity.planetId;

  return {
    object: mesh,
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };
}

