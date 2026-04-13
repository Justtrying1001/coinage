import * as THREE from 'three';
import type { CityTerrainInput } from '@/game/render/modes/terrain/CityTerrainTypes';

export function applyCityAtmosphere(scene: THREE.Scene, input: CityTerrainInput) {
  scene.background = input.palettes.sky.clone();
  scene.fog = new THREE.Fog(input.palettes.fog.clone(), 120, 520);
}

export function createCityLighting(input: CityTerrainInput) {
  const group = new THREE.Group();

  const hemi = new THREE.HemisphereLight(0xe6f0ff, 0x2c2f22, 0.9 + input.visual.lightIntensity * 0.08);
  group.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff2d7, 1.18 + input.visual.lightIntensity * 0.12);
  sun.position.set(90, 136, 38);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -220;
  sun.shadow.camera.right = 220;
  sun.shadow.camera.top = 220;
  sun.shadow.camera.bottom = -220;
  group.add(sun);

  const fill = new THREE.DirectionalLight(0xb7d5ff, 0.32 + input.climate.humidity * 0.2);
  fill.position.set(-58, 42, -94);
  group.add(fill);

  const horizon = new THREE.Mesh(
    new THREE.CylinderGeometry(390, 440, 96, 72, 1, true),
    new THREE.MeshBasicMaterial({
      color: input.palettes.fog.clone().lerp(input.palettes.sky, 0.35),
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.58,
    }),
  );
  horizon.position.y = 10;
  group.add(horizon);

  return group;
}
