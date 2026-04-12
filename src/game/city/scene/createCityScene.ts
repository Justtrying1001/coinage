import {
  AmbientLight,
  BackSide,
  BoxGeometry,
  BufferAttribute,
  CircleGeometry,
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
}

export function createCityScene(theme: CityTheme, seed: number): CitySceneScaffold {
  const scene = new Scene();
  scene.background = new Color(theme.clearColor);
  scene.fog = new Fog(theme.fogColor, theme.fogNear, theme.fogFar);

  const cityRoot = new Group();
  cityRoot.name = 'city-root';
  scene.add(cityRoot);

  addAtmosphereBackdrop(scene, theme);

  const terrain = createTerrainPatch(theme, seed);
  terrain.receiveShadow = true;
  cityRoot.add(terrain);

  const underShelf = new Mesh(
    new BoxGeometry(64, 7.2, 64),
    new MeshStandardMaterial({
      color: theme.terrainShadowColor,
      roughness: 0.95,
      metalness: 0.02,
    }),
  );
  underShelf.position.y = -4.2;
  cityRoot.add(underShelf);

  addPerimeterRidges(cityRoot, theme, seed);
  addIceOutcrops(cityRoot, theme, seed);

  const hemi = new AmbientLight(theme.ambientLightColor, theme.ambientLightIntensity);
  scene.add(hemi);

  const keyLight = new DirectionalLight(theme.directionalLightColor, theme.directionalLightIntensity);
  keyLight.position.set(26, 24, 13);
  scene.add(keyLight);

  const fillLight = new DirectionalLight(theme.rimLightColor, theme.rimLightIntensity);
  fillLight.position.set(-20, 9, -24);
  scene.add(fillLight);

  return { scene, cityRoot };
}

function addAtmosphereBackdrop(scene: Scene, theme: CityTheme) {
  const skyDome = new Mesh(
    new SphereGeometry(140, 36, 24),
    new MeshStandardMaterial({
      color: theme.horizonColor,
      roughness: 1,
      metalness: 0,
      emissive: theme.clearColor,
      emissiveIntensity: 0.2,
      side: BackSide,
      fog: false,
    }),
  );
  skyDome.position.set(0, 44, 0);
  scene.add(skyDome);

  const horizonPlate = new Mesh(
    new CircleGeometry(120, 64),
    new MeshStandardMaterial({
      color: theme.horizonColor,
      roughness: 1,
      metalness: 0,
      transparent: true,
      opacity: 0.55,
      fog: false,
    }),
  );
  horizonPlate.rotation.x = -Math.PI / 2;
  horizonPlate.position.y = -0.9;
  scene.add(horizonPlate);
}

function createTerrainPatch(theme: CityTheme, seed: number): Mesh {
  const geometry = new PlaneGeometry(58, 58, 90, 90);
  const rng = new SeededRng(seed ^ 0x8f1734aa);
  const position = geometry.getAttribute('position');
  const colors = new Float32Array(position.count * 3);
  const low = new Color(theme.terrainLowColor);
  const mid = new Color(theme.terrainMidColor);
  const high = new Color(theme.terrainHighColor);

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const z = position.getY(index);

    const radial = Math.min(1, Math.hypot(x, z) / 28);
    const ridge = Math.sin(x * 0.21 + 1.1) * 0.55 + Math.cos(z * 0.24 - 0.7) * 0.4;
    const drift = Math.sin((x * 0.6 + z * 0.44) + 1.7) * 0.2;
    const shelfBlend = Math.exp(-((x + 9.8) ** 2 + (z - 6.8) ** 2) / 120) * 0.88;
    const basin = -Math.exp(-((x - 7.1) ** 2 + (z + 8.4) ** 2) / 60) * 0.72;
    const windCarve = Math.sin(z * 0.52 + x * 0.08) * 0.17;
    const edgeDrop = -Math.pow(radial, 2.5) * 3.2;
    const noise = rng.range(-0.05, 0.05);
    const height = ridge * 0.6 + drift + shelfBlend + basin + windCarve + edgeDrop + noise;

    position.setZ(index, height);

    const elevation01 = Math.max(0, Math.min(1, (height + 4.8) / 7.4));
    const tint = low.clone().lerp(mid, Math.min(1, elevation01 * 1.2)).lerp(high, Math.pow(elevation01, 2.4));
    tint.offsetHSL(0, rng.range(-0.01, 0.01), rng.range(-0.04, 0.04));
    colors[index * 3] = tint.r;
    colors[index * 3 + 1] = tint.g;
    colors[index * 3 + 2] = tint.b;
  }

  geometry.setAttribute('color', new BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  geometry.rotateX(-Math.PI / 2);

  const material = new MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.84,
    metalness: 0.08,
    emissive: theme.terrainSpecularColor,
    emissiveIntensity: 0.03,
  });

  return new Mesh(geometry, material);
}

function addPerimeterRidges(root: Group, theme: CityTheme, seed: number) {
  const rng = new SeededRng(seed ^ 0x1cf2519b);
  const ridgeGeom = new BoxGeometry(6.2, 3.4, 2.8);
  const ridgeMat = new MeshStandardMaterial({
    color: theme.terrainLowColor,
    roughness: 0.9,
    metalness: 0.04,
  });

  for (let i = 0; i < 16; i += 1) {
    const angle = (i / 16) * Math.PI * 2 + rng.range(-0.18, 0.18);
    const radius = rng.range(22, 29);
    const ridge = new Mesh(ridgeGeom, ridgeMat);
    ridge.position.set(Math.cos(angle) * radius, rng.range(-0.3, 1.6), Math.sin(angle) * radius);
    ridge.rotation.set(rng.range(-0.08, 0.08), angle + rng.range(-0.5, 0.5), rng.range(-0.2, 0.2));
    ridge.scale.set(rng.range(0.8, 1.8), rng.range(0.55, 1.4), rng.range(0.8, 1.6));
    root.add(ridge);
  }
}

function addIceOutcrops(root: Group, theme: CityTheme, seed: number) {
  const rng = new SeededRng(seed ^ 0x4bd84c11);
  const crystalGeom = new BoxGeometry(0.8, 2.2, 0.7);
  const crystalMat = new MeshStandardMaterial({
    color: new Color(theme.terrainMidColor).lerp(new Color(theme.terrainHighColor), 0.45),
    emissive: new Color(theme.emissiveAccent),
    emissiveIntensity: 0.06,
    roughness: 0.2,
    metalness: 0.24,
  });

  const marker = new Object3D();
  const matrix = new Matrix4();

  for (let i = 0; i < 18; i += 1) {
    const angle = (i / 18) * Math.PI * 2 + rng.range(-0.2, 0.2);
    const radius = rng.range(16, 25.5);
    marker.position.set(Math.cos(angle) * radius, -0.2, Math.sin(angle) * radius);
    marker.rotation.set(rng.range(-0.26, 0.26), rng.range(0, Math.PI), rng.range(-0.18, 0.18));
    marker.scale.set(rng.range(0.8, 1.6), rng.range(0.6, 1.9), rng.range(0.7, 1.3));
    marker.updateMatrix();
    matrix.copy(marker.matrix);

    const crystal = new Mesh(crystalGeom, crystalMat);
    crystal.applyMatrix4(matrix);
    root.add(crystal);
  }

  const beaconMat = new MeshStandardMaterial({
    color: theme.metalColor,
    roughness: 0.34,
    metalness: 0.72,
    emissive: theme.emissiveAccent,
    emissiveIntensity: 0.22,
  });

  const beaconPositions = [
    new Vector3(-15.2, 0.8, 0),
    new Vector3(15.2, 0.8, 0),
    new Vector3(0, 0.8, -15.2),
    new Vector3(0, 0.8, 15.2),
  ];

  for (const position of beaconPositions) {
    const beacon = new Mesh(new BoxGeometry(0.8, 1.8, 0.8), beaconMat);
    beacon.position.copy(position);
    root.add(beacon);
  }
}
