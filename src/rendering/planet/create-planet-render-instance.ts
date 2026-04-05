import * as THREE from 'three';

import { mapProfileToProceduralUniforms } from './map-profile-to-procedural-uniforms';
import { ATMOSPHERE_FRAGMENT_SHADER, ATMOSPHERE_VERTEX_SHADER } from './shaders/atmosphere-shaders';
import { PLANET_FRAGMENT_SHADER, PLANET_VERTEX_SHADER } from './shaders/planet-shaders';
import type { PlanetRenderInput, PlanetRenderInstance } from './types';

const SHARED_GEOMETRY = new THREE.IcosahedronGeometry(1, 4);
const SHARED_ATMOSPHERE_GEOMETRY = new THREE.SphereGeometry(1, 28, 28);

export function createPlanetRenderInstance({ profile, x, y, z }: PlanetRenderInput): PlanetRenderInstance {
  const procedural = mapProfileToProceduralUniforms(profile);

  const group = new THREE.Group();
  group.position.set(x, y, z);

  const planetMaterial = new THREE.ShaderMaterial({
    vertexShader: PLANET_VERTEX_SHADER,
    fragmentShader: PLANET_FRAGMENT_SHADER,
    uniforms: {
      uBaseColor: { value: new THREE.Color(...procedural.baseColor) },
      uAccentColor: { value: new THREE.Color(...procedural.accentColor) },
      uSeedA: { value: procedural.seedA },
      uSeedB: { value: procedural.seedB },
      uRadius: { value: procedural.radius },
      uWobbleFrequency: { value: procedural.wobbleFrequency },
      uWobbleAmplitude: { value: procedural.wobbleAmplitude },
      uRidgeWarp: { value: procedural.ridgeWarp },
      uMacroStrength: { value: procedural.macroStrength },
      uMicroStrength: { value: procedural.microStrength },
      uRoughness: { value: procedural.roughness },
      uCraterDensity: { value: procedural.craterDensity },
    },
  });

  const planetMesh = new THREE.Mesh(SHARED_GEOMETRY, planetMaterial);
  group.add(planetMesh);

  let atmosphereMaterial: THREE.ShaderMaterial | null = null;
  if (procedural.atmosphereEnabled && procedural.atmosphereIntensity > 0.01) {
    atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: ATMOSPHERE_VERTEX_SHADER,
      fragmentShader: ATMOSPHERE_FRAGMENT_SHADER,
      uniforms: {
        uAtmosphereColor: { value: new THREE.Color(...procedural.atmosphereColor) },
        uIntensity: { value: Math.min(0.95, procedural.atmosphereIntensity * 0.66 + 0.12) },
      },
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
    });

    const atmosphereMesh = new THREE.Mesh(SHARED_ATMOSPHERE_GEOMETRY, atmosphereMaterial);
    atmosphereMesh.scale.setScalar(1 + Math.max(0.03, procedural.atmosphereThickness * 2.3));
    group.add(atmosphereMesh);
  }

  return {
    object: group,
    dispose: () => {
      planetMaterial.dispose();
      atmosphereMaterial?.dispose();
    },
  };
}
