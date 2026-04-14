import * as THREE from 'three';
import type { CityTerrainInput } from '@/game/render/modes/terrain/CityTerrainTypes';

export function applyCityAtmosphere(scene: THREE.Scene, input: CityTerrainInput) {
  const sky = input.palettes.sky.clone().lerp(new THREE.Color('#7a8ea6'), 0.12);
  scene.background = sky;
  scene.fog = new THREE.Fog(input.palettes.fog.clone().lerp(sky, 0.22), 340, 1600);
}

export function createCityLighting(input: CityTerrainInput) {
  const group = new THREE.Group();

  const hemi = new THREE.HemisphereLight(0xecf5ff, 0x2d312a, 0.82 + input.visual.lightIntensity * 0.1);
  group.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff1d8, 1.12 + input.visual.lightIntensity * 0.14);
  sun.position.set(124, 180, 56);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -380;
  sun.shadow.camera.right = 380;
  sun.shadow.camera.top = 260;
  sun.shadow.camera.bottom = -260;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 620;
  group.add(sun);

  const fill = new THREE.DirectionalLight(0xa9cbff, 0.3 + input.climate.humidity * 0.18);
  fill.position.set(-92, 64, -136);
  group.add(fill);

  const horizon = new THREE.Mesh(
    new THREE.CylinderGeometry(720, 780, 210, 80, 1, true),
    new THREE.MeshBasicMaterial({
      color: input.palettes.fog.clone().lerp(input.palettes.sky, 0.45),
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
    }),
  );
  horizon.position.y = 34;
  group.add(horizon);

  const skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(980, 28, 20),
    new THREE.MeshBasicMaterial({
      color: skyDomeTint(input),
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    }),
  );
  skyDome.position.y = 120;
  group.add(skyDome);

  return group;
}

function skyDomeTint(input: CityTerrainInput) {
  return input.palettes.sky.clone().lerp(input.palettes.fog, 0.38).lerp(new THREE.Color('#98adbf'), 0.12);
}
