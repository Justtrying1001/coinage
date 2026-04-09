import * as THREE from 'three';

import type { CanonicalPlanet, PlanetFamily } from '@/domain/world/planet-visual.types';

export interface PlanetProxyInstance {
  object: THREE.Mesh;
  dispose: () => void;
}

function toColor(v: [number, number, number]): THREE.Color {
  return new THREE.Color(v[0], v[1], v[2]);
}

function familyMaterialTuning(family: PlanetFamily): {
  roughness: number;
  metalness: number;
  emissiveBoost: number;
  clearcoat: number;
} {
  if (family === 'gas-giant' || family === 'ringed-giant') {
    return { roughness: 0.48, metalness: 0.02, emissiveBoost: 0.08, clearcoat: 0.08 };
  }
  if (family === 'volcanic-infernal') {
    return { roughness: 0.66, metalness: 0.08, emissiveBoost: 0.18, clearcoat: 0.02 };
  }
  if (family === 'ice-frozen') {
    return { roughness: 0.38, metalness: 0.06, emissiveBoost: 0.06, clearcoat: 0.18 };
  }
  return { roughness: 0.56, metalness: 0.05, emissiveBoost: 0.08, clearcoat: 0.06 };
}

export function createPlanetProxyInstance(
  planet: CanonicalPlanet,
  position: { x: number; y: number; z: number },
): PlanetProxyInstance {
  const radius = planet.render.scale.silhouetteProtectedRadius;
  const geometry = new THREE.IcosahedronGeometry(radius, 2);
  const tuning = familyMaterialTuning(planet.identity.family);

  const base = toColor(planet.render.surface.colorMid);
  const accent = toColor(planet.render.surface.accentColor);
  const brightened = base.clone().lerp(accent, 0.26).offsetHSL(0, 0.05, 0.03);

  const material = new THREE.MeshPhysicalMaterial({
    color: brightened,
    emissive: accent.clone().multiplyScalar(tuning.emissiveBoost),
    roughness: tuning.roughness,
    metalness: tuning.metalness,
    clearcoat: tuning.clearcoat,
    clearcoatRoughness: 0.38,
    sheen: 0.2,
    sheenColor: accent,
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
