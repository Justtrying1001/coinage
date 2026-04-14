import * as THREE from 'three';
import type { CityTerrainInput } from '@/game/render/modes/terrain/CityTerrainTypes';

export function applyCityAtmosphere(scene: THREE.Scene, input: CityTerrainInput) {
  const sky = input.palettes.sky.clone().lerp(new THREE.Color('#7f93aa'), 0.08);
  scene.background = sky;
  scene.fog = new THREE.Fog(input.palettes.fog.clone().lerp(sky, 0.28), 260, 1500);
}

export function createCityLighting(input: CityTerrainInput) {
  const group = new THREE.Group();

  const hemi = new THREE.HemisphereLight(0xeaf4ff, 0x2a302a, 0.92 + input.visual.lightIntensity * 0.14);
  group.add(hemi);

  const sun = new THREE.DirectionalLight(0xffefcf, 1.24 + input.visual.lightIntensity * 0.16);
  sun.position.set(130, 190, 80);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -420;
  sun.shadow.camera.right = 420;
  sun.shadow.camera.top = 280;
  sun.shadow.camera.bottom = -280;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 720;
  group.add(sun);

  const fill = new THREE.DirectionalLight(0x9ec5ff, 0.36 + input.climate.humidity * 0.2);
  fill.position.set(-140, 86, -120);
  group.add(fill);

  const ambient = new THREE.AmbientLight(input.palettes.fog.clone().lerp(input.palettes.sky, 0.42), 0.22);
  group.add(ambient);

  const horizon = new THREE.Mesh(
    new THREE.CylinderGeometry(900, 980, 280, 96, 1, true),
    new THREE.MeshBasicMaterial({
      color: input.palettes.fog.clone().lerp(input.palettes.sky, 0.5),
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      fog: false,
    }),
  );
  horizon.position.y = 56;
  group.add(horizon);

  const skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(1180, 32, 22),
    new THREE.MeshBasicMaterial({
      color: skyDomeTint(input),
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      fog: false,
    }),
  );
  skyDome.position.y = 150;
  group.add(skyDome);

  return group;
}

function skyDomeTint(input: CityTerrainInput) {
  return input.palettes.sky.clone().lerp(input.palettes.fog, 0.34).lerp(new THREE.Color('#9eb2c2'), 0.14);
}
