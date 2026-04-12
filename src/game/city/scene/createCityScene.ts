import {
  AmbientLight,
  BackSide,
  BufferAttribute,
  BoxGeometry,
  Color,
  DirectionalLight,
  Fog,
  Group,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  Vector3,
} from 'three';
import type { CityTheme } from '@/game/city/themes/cityThemePresets';
import { SeededRng } from '@/game/world/rng';

export interface CitySceneScaffold {
  scene: Scene;
  cityRoot: Group;
  sampleHeight: (x: number, z: number) => number;
}

export function createCityScene(theme: CityTheme, seed: number): CitySceneScaffold {
  const scene = new Scene();
  scene.background = new Color(theme.clearColor);
  scene.fog = new Fog(theme.fogColor, theme.fogNear, theme.fogFar);

  const cityRoot = new Group();
  cityRoot.name = 'city-root';
  scene.add(cityRoot);

  const terrain = createTerrainPatch(theme, seed);
  cityRoot.add(terrain.mesh);
  addBackgroundBowl(scene, theme);
  addFramingCliffs(cityRoot, terrain.sampleHeight, theme, seed);
  addIceOutcrops(cityRoot, theme, seed, terrain.sampleHeight);

  const ambient = new AmbientLight(theme.ambientLightColor, theme.ambientLightIntensity);
  scene.add(ambient);

  const keyLight = new DirectionalLight(theme.directionalLightColor, theme.directionalLightIntensity);
  keyLight.position.set(18, 25, 14);
  scene.add(keyLight);

  const rimLight = new DirectionalLight(theme.rimLightColor, theme.rimLightIntensity);
  rimLight.position.set(-23, 12, -18);
  scene.add(rimLight);

  return { scene, cityRoot, sampleHeight: terrain.sampleHeight };
}

function createTerrainPatch(theme: CityTheme, seed: number): { mesh: Mesh; sampleHeight: (x: number, z: number) => number } {
  const geometry = new PlaneGeometry(68, 68, 88, 88);

  const sampleHeight = (x: number, z: number) => {
    const radial = Math.min(1, Math.hypot(x, z) / 33);
    const continental = Math.sin(x * 0.16 + 0.8) * 0.95 + Math.cos(z * 0.14 - 0.4) * 0.8;
    const ridges = Math.sin((x + z) * 0.54) * 0.24 + Math.cos((x - z) * 0.44) * 0.18;
    const colonyShelf = Math.exp(-((x - 0.6) ** 2 + (z + 1.4) ** 2) / 150) * 1.48;
    const craterBowl = -Math.exp(-((x + 12.5) ** 2 + (z - 10.2) ** 2) / 58) * 1.2;
    const trench = -Math.exp(-((x - 9.4) ** 2 + (z + 8.6) ** 2) / 74) * 0.9;
    const edgeDrop = -Math.pow(radial, 2.45) * 4.5;

    return continental * 0.52 + ridges + colonyShelf + craterBowl + trench + edgeDrop;
  };

  const position = geometry.getAttribute('position');
  const rng = new SeededRng(seed ^ 0x8f1734aa);
  const color = new Color();
  const colors = new Float32Array(position.count * 3);

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const z = position.getY(index);
    const height = sampleHeight(x, z) + rng.range(-0.04, 0.04);
    position.setZ(index, height);

    const heightN = Math.min(1, Math.max(0, (height + 4.6) / 6.6));
    const gradient = new Color(theme.terrainLowColor).lerp(new Color(theme.terrainMidColor), Math.min(1, heightN * 1.1));
    gradient.lerp(new Color(theme.terrainHighColor), Math.max(0, (heightN - 0.55) * 1.9));
    const roughMix = Math.abs(Math.sin(x * 0.7 + z * 0.9)) * 0.08;
    color.copy(gradient).lerp(new Color(theme.terrainRockColor), roughMix);
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }

  geometry.setAttribute('color', new BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  geometry.rotateX(-Math.PI / 2);

  const material = new MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.78,
    metalness: 0.14,
    emissive: theme.terrainSpecularColor,
    emissiveIntensity: 0.03,
  });

  const mesh = new Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.position.y = -0.95;
  return { mesh, sampleHeight };
}

function addBackgroundBowl(scene: Scene, theme: CityTheme) {
  const dome = new Mesh(
    new SphereGeometry(120, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.52),
    new MeshStandardMaterial({
      color: theme.skyBottomColor,
      roughness: 1,
      metalness: 0,
      emissive: theme.skyTopColor,
      emissiveIntensity: 0.22,
      side: BackSide,
      fog: false,
    }),
  );
  dome.position.y = -24;
  scene.add(dome);
}

function addFramingCliffs(root: Group, sampleHeight: (x: number, z: number) => number, theme: CityTheme, seed: number) {
  const rng = new SeededRng(seed ^ 0x4d22ad31);
  const cliffMaterial = new MeshStandardMaterial({
    color: theme.terrainRockColor,
    roughness: 0.82,
    metalness: 0.08,
    emissive: theme.horizonGlowColor,
    emissiveIntensity: 0.03,
  });

  for (let i = 0; i < 28; i += 1) {
    const angle = (i / 28) * Math.PI * 2 + rng.range(-0.09, 0.09);
    const radius = rng.range(25, 31);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const cliff = new Mesh(new BoxGeometry(rng.range(2.2, 4.8), rng.range(2.6, 6.4), rng.range(1.8, 4.2)), cliffMaterial);
    cliff.position.set(x, sampleHeight(x, z) - 0.2, z);
    cliff.rotation.set(rng.range(-0.08, 0.08), angle + Math.PI * 0.5, rng.range(-0.1, 0.1));
    root.add(cliff);
  }
}

function addIceOutcrops(root: Group, theme: CityTheme, seed: number, sampleHeight: (x: number, z: number) => number) {
  const rng = new SeededRng(seed ^ 0x4bd84c11);
  const crystalGeom = new BoxGeometry(0.7, 2.2, 0.7);
  const crystalMat = new MeshStandardMaterial({
    color: new Color(theme.terrainHighColor).lerp(new Color(0xffffff), 0.26),
    emissive: new Color(theme.emissiveAccent),
    emissiveIntensity: 0.1,
    roughness: 0.2,
    metalness: 0.16,
  });

  const marker = new Object3D();
  const matrix = new Matrix4();

  for (let i = 0; i < 30; i += 1) {
    const angle = (i / 30) * Math.PI * 2 + rng.range(-0.16, 0.16);
    const radius = rng.range(14, 30);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    marker.position.set(x, sampleHeight(x, z) + rng.range(-0.2, 0.25), z);
    marker.rotation.set(rng.range(-0.2, 0.2), rng.range(0, Math.PI), rng.range(-0.2, 0.2));
    marker.scale.set(rng.range(0.7, 1.45), rng.range(0.6, 1.8), rng.range(0.7, 1.25));
    marker.updateMatrix();
    matrix.copy(marker.matrix);

    const crystal = new Mesh(crystalGeom, crystalMat);
    crystal.applyMatrix4(matrix);
    root.add(crystal);
  }

  const beaconMat = new MeshStandardMaterial({
    color: theme.foundationColor,
    roughness: 0.52,
    metalness: 0.52,
    emissive: theme.emissiveAccent,
    emissiveIntensity: 0.16,
  });

  const beaconPositions = [
    new Vector3(-15.5, 0.8, 0),
    new Vector3(15.5, 0.8, 0),
    new Vector3(0, 0.8, -15.5),
    new Vector3(0, 0.8, 15.5),
  ];

  for (const position of beaconPositions) {
    const y = sampleHeight(position.x, position.z) + 1.1;
    const beacon = new Mesh(new BoxGeometry(0.8, 1.6, 0.8), beaconMat);
    beacon.position.set(position.x, y, position.z);
    root.add(beacon);
  }
}
