import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

import { generatePlanetVisualProfile } from '@/domain/world/generate-planet-visual-profile';
import { createPlanetRenderInstance } from '@/rendering/planet/create-planet-render-instance';

test('renderer disables atmosphere shell by default to avoid halo artifacts', () => {
  const profile = generatePlanetVisualProfile({
    worldSeed: 'coinage-mvp-seed',
    planetSeed: 'appearance-no-atmosphere-default',
  });

  const instance = createPlanetRenderInstance({
    profile: {
      ...profile,
      atmosphere: {
        enabled: true,
        intensity: 0.9,
        thickness: 0.08,
        tintShift: 10,
      },
    },
    x: 0,
    y: 0,
    z: 0,
    options: { lod: 'planet' },
  });

  assert.equal(instance.object.children.length, 1, 'default renderer should only contain surface mesh');
  instance.dispose();
});

test('galaxy renderer keeps neutral non-specular surface material defaults', () => {
  const profile = generatePlanetVisualProfile({
    worldSeed: 'coinage-mvp-seed',
    planetSeed: 'appearance-neutral-material',
  });

  const instance = createPlanetRenderInstance({
    profile,
    x: 0,
    y: 0,
    z: 0,
    options: { lod: 'galaxy' },
  });

  const surface = instance.object.children[0];
  assert.ok(surface instanceof THREE.Mesh, 'surface object should be a mesh');
  assert.ok(surface.material instanceof THREE.MeshStandardMaterial, 'surface material should be MeshStandardMaterial');
  assert.equal(surface.material.roughness, 1);
  assert.equal(surface.material.metalness, 0);
  assert.equal(surface.material.envMapIntensity, 0);

  instance.dispose();
});

test('planet renderer enables richer close-up material response', () => {
  const profile = generatePlanetVisualProfile({
    worldSeed: 'coinage-mvp-seed',
    planetSeed: 'appearance-planet-material-richness',
  });

  const instance = createPlanetRenderInstance({
    profile,
    x: 0,
    y: 0,
    z: 0,
    options: { lod: 'planet' },
  });

  const surface = instance.object.children[0];
  assert.ok(surface instanceof THREE.Mesh, 'surface object should be a mesh');
  assert.ok(surface.material instanceof THREE.MeshStandardMaterial, 'surface material should be MeshStandardMaterial');
  assert.ok(surface.material.roughness < 1, `expected roughness < 1, got ${surface.material.roughness}`);
  assert.ok(surface.material.metalness > 0, `expected metalness > 0, got ${surface.material.metalness}`);
  assert.ok(typeof surface.material.onBeforeCompile === 'function', 'expected custom shader hook for close-up material');
  assert.ok(surface.geometry instanceof THREE.BufferGeometry, 'surface geometry should be BufferGeometry');
  const terrainAttribute = surface.geometry.getAttribute('terrain');
  assert.ok(terrainAttribute, 'expected terrain attribute for close-up shading');
  assert.equal(terrainAttribute.itemSize, 4, 'terrain attribute should expose vec4 packed terrain data');

  instance.dispose();
});
