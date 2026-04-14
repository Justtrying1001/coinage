import * as THREE from 'three';
import type { CityTerrainInput } from '@/game/render/modes/terrain/CityTerrainTypes';

export function applyCityAtmosphere(scene: THREE.Scene, input: CityTerrainInput) {
  const sky = input.palettes.sky.clone().lerp(new THREE.Color('#7c93ad'), 0.15);
  scene.background = sky;
  scene.fog = new THREE.Fog(input.palettes.fog.clone().lerp(sky, 0.28), 260, 1250);
}

export function createCityLighting(input: CityTerrainInput) {
  const group = new THREE.Group();

  const hemi = new THREE.HemisphereLight(0xe9f3ff, 0x2f312a, 0.86 + input.visual.lightIntensity * 0.09);
  group.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff2d4, 1.04 + input.visual.lightIntensity * 0.15);
  sun.position.set(130, 172, 42);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -360;
  sun.shadow.camera.right = 360;
  sun.shadow.camera.top = 250;
  sun.shadow.camera.bottom = -250;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 540;
  group.add(sun);

  const fill = new THREE.DirectionalLight(0xa9cbff, 0.24 + input.climate.humidity * 0.16);
  fill.position.set(-88, 56, -132);
  group.add(fill);

  const horizon = new THREE.Mesh(
    new THREE.CylinderGeometry(680, 760, 180, 80, 1, true),
    new THREE.MeshBasicMaterial({
      color: input.palettes.fog.clone().lerp(input.palettes.sky, 0.36),
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    }),
  );
  horizon.position.y = 30;
  group.add(horizon);

  return group;
}
