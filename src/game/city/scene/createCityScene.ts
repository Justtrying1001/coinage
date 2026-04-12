import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  Scene,
  Vector3,
} from 'three';
import type { CityTheme } from '@/game/city/themes/cityThemePresets';
import { SeededRng } from '@/game/world/rng';

export interface CitySceneScaffold {
  scene: Scene;
  cityRoot: Group;
}

export function createCityScene(theme: CityTheme, seed: number): CitySceneScaffold {
  const scene = new Scene();
  scene.background = new Color(theme.clearColor);
  scene.fog = new Fog(theme.fogColor, theme.fogNear, theme.fogFar);

  const cityRoot = new Group();
  cityRoot.name = 'city-root';
  scene.add(cityRoot);

  const terrain = createTerrainPatch(theme, seed);
  terrain.receiveShadow = true;
  cityRoot.add(terrain);

  const shelf = new Mesh(
    new BoxGeometry(62, 5, 62),
    new MeshStandardMaterial({
      color: theme.groundShadowColor,
      roughness: 0.9,
      metalness: 0.03,
    }),
  );
  shelf.position.y = -2.6;
  cityRoot.add(shelf);

  addIceOutcrops(cityRoot, theme, seed);

  const hemi = new HemisphereLight(0xb7dcff, 0x1a2b3d, 0.48);
  scene.add(hemi);

  const ambient = new AmbientLight(theme.ambientLightColor, theme.ambientLightIntensity);
  scene.add(ambient);

  const keyLight = new DirectionalLight(theme.directionalLightColor, theme.directionalLightIntensity);
  keyLight.position.set(20, 26, 12);
  scene.add(keyLight);

  const rimLight = new DirectionalLight(theme.rimLightColor, theme.rimLightIntensity);
  rimLight.position.set(-24, 10, -20);
  scene.add(rimLight);

  return { scene, cityRoot };
}

function createTerrainPatch(theme: CityTheme, seed: number): Mesh {
  const geometry = new PlaneGeometry(56, 56, 70, 70);
  const rng = new SeededRng(seed ^ 0x8f1734aa);
  const position = geometry.getAttribute('position');

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const z = position.getY(index);

    const radial = Math.min(1, Math.hypot(x, z) / 28);
    const ridge = Math.sin(x * 0.28 + 0.8) * 0.32 + Math.cos(z * 0.31 - 0.6) * 0.26;
    const micro = Math.sin((x + z) * 0.72) * 0.08;
    const terrace = Math.floor((ridge + 0.8) * 2.8) / 2.8;
    const crater = -Math.exp(-((x - 7.5) ** 2 + (z + 6.2) ** 2) / 46) * 0.65;
    const plateau = Math.exp(-((x + 8.8) ** 2 + (z - 7.6) ** 2) / 78) * 0.52;

    const noise = rng.range(-0.03, 0.03);
    const edgeDrop = -Math.pow(radial, 2.3) * 2.2;
    const height = terrace * 0.52 + micro + crater + plateau + edgeDrop + noise;

    position.setZ(index, height);
  }

  geometry.computeVertexNormals();
  geometry.rotateX(-Math.PI / 2);

  const material = new MeshStandardMaterial({
    color: theme.groundColor,
    roughness: 0.88,
    metalness: 0.06,
  });

  return new Mesh(geometry, material);
}

function addIceOutcrops(root: Group, theme: CityTheme, seed: number) {
  const rng = new SeededRng(seed ^ 0x4bd84c11);
  const crystalGeom = new BoxGeometry(0.7, 2.2, 0.7);
  const crystalMat = new MeshStandardMaterial({
    color: new Color(theme.groundColor).lerp(new Color(0xd5ecff), 0.35),
    emissive: new Color(theme.emissiveAccent),
    emissiveIntensity: 0.08,
    roughness: 0.24,
    metalness: 0.18,
  });

  const marker = new Object3D();
  const matrix = new Matrix4();

  for (let i = 0; i < 24; i += 1) {
    const angle = (i / 24) * Math.PI * 2 + rng.range(-0.16, 0.16);
    const radius = rng.range(18, 26);
    marker.position.set(Math.cos(angle) * radius, -0.2, Math.sin(angle) * radius);
    marker.rotation.set(rng.range(-0.2, 0.2), rng.range(0, Math.PI), rng.range(-0.2, 0.2));
    marker.scale.set(rng.range(0.7, 1.35), rng.range(0.6, 1.7), rng.range(0.7, 1.2));
    marker.updateMatrix();
    matrix.copy(marker.matrix);

    const crystal = new Mesh(crystalGeom, crystalMat);
    crystal.applyMatrix4(matrix);
    root.add(crystal);
  }

  const beaconMat = new MeshStandardMaterial({
    color: theme.metalColor,
    roughness: 0.45,
    metalness: 0.65,
    emissive: theme.emissiveAccent,
    emissiveIntensity: 0.2,
  });

  const beaconPositions = [
    new Vector3(-15.5, 0.8, 0),
    new Vector3(15.5, 0.8, 0),
    new Vector3(0, 0.8, -15.5),
    new Vector3(0, 0.8, 15.5),
  ];

  for (const position of beaconPositions) {
    const beacon = new Mesh(new BoxGeometry(0.8, 1.6, 0.8), beaconMat);
    beacon.position.copy(position);
    root.add(beacon);
  }
}
