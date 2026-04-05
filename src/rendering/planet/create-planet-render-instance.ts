import * as THREE from 'three';

import { mapProfileToProceduralUniforms } from './map-profile-to-procedural-uniforms';
import { ATMOSPHERE_FRAGMENT_SHADER, ATMOSPHERE_VERTEX_SHADER } from './shaders/atmosphere-shaders';
import { createCubeSphereTerrain } from './terrain/cube-sphere';
import type { PlanetRenderInput, PlanetRenderInstance } from './types';

export function createPlanetRenderInstance({ profile, x, y, z }: PlanetRenderInput): PlanetRenderInstance {
  const params = mapProfileToProceduralUniforms(profile);

  const group = new THREE.Group();
  group.position.set(x, y, z);

  const geometry = createCubeSphereTerrain(params);

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: params.roughness,
    metalness: params.metalness,
  });

  const planetMesh = new THREE.Mesh(geometry, material);
  group.add(planetMesh);

  let atmosphereGeometry: THREE.BufferGeometry | null = null;
  let atmosphereMaterial: THREE.ShaderMaterial | null = null;

  if (params.atmosphereEnabled && params.atmosphereIntensity > 0.01) {
    atmosphereGeometry = new THREE.SphereGeometry(params.radius * (1 + params.atmosphereThickness * 1.8), 28, 28);

    atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: ATMOSPHERE_VERTEX_SHADER,
      fragmentShader: ATMOSPHERE_FRAGMENT_SHADER,
      uniforms: {
        uAtmosphereColor: { value: new THREE.Color(...params.atmosphereColor) },
        uIntensity: { value: Math.min(1, params.atmosphereIntensity * 0.7 + 0.14) },
      },
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
    });

    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    group.add(atmosphereMesh);
  }

  return {
    object: group,
    dispose: () => {
      geometry.dispose();
      material.dispose();
      atmosphereGeometry?.dispose();
      atmosphereMaterial?.dispose();
    },
  };
}
