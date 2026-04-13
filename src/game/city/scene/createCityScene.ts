import {
  AdditiveBlending,
  AmbientLight,
  BoxGeometry,
  BufferAttribute,
  CircleGeometry,
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
  RingGeometry,
  Scene,
  Vector3,
} from 'three';
import type { CityTheme } from '@/game/city/themes/cityThemePresets';
import { SeededRng } from '@/game/world/rng';

export interface CitySceneScaffold {
  scene: Scene;
  cityRoot: Group;
  terrainHeightAt: (x: number, z: number) => number;
}

const TERRAIN_RADIUS = 30;

export function createCityScene(theme: CityTheme, seed: number): CitySceneScaffold {
  const scene = new Scene();
  scene.background = new Color(theme.clearColor);
  scene.fog = new Fog(theme.fogColor, theme.fogNear, theme.fogFar);

  const cityRoot = new Group();
  cityRoot.name = 'city-root';
  scene.add(cityRoot);

  const backdrop = createBackdrop(theme, seed);
  scene.add(backdrop);

  const terrain = createTerrainPatch(theme, seed);
  terrain.receiveShadow = true;
  cityRoot.add(terrain);

  addTerrainRim(cityRoot, theme);
  addBiomeSetDressing(cityRoot, theme, seed);

  const hemi = new HemisphereLight(new Color(theme.hazeColor), new Color(theme.groundShadowColor), 0.5 + theme.atmosphereDensity * 0.2);
  scene.add(hemi);

  const ambient = new AmbientLight(theme.ambientLightColor, theme.ambientLightIntensity);
  scene.add(ambient);

  const keyLight = new DirectionalLight(theme.directionalLightColor, theme.directionalLightIntensity);
  keyLight.position.set(24, 30, 8);
  scene.add(keyLight);

  const rimLight = new DirectionalLight(theme.rimLightColor, theme.rimLightIntensity);
  rimLight.position.set(-30, 12, -24);
  scene.add(rimLight);

  return { scene, cityRoot, terrainHeightAt: (x, z) => sampleTerrainHeight(theme, seed, x, z) };
}

function createBackdrop(theme: CityTheme, seed: number): Group {
  const group = new Group();
  const rng = new SeededRng(seed ^ 0xaaa231fe);

  const sky = new Mesh(
    new CircleGeometry(95, 64),
    new MeshStandardMaterial({
      color: theme.horizonColor,
      emissive: theme.hazeColor,
      emissiveIntensity: 0.17,
      roughness: 1,
      metalness: 0,
      fog: false,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
    }),
  );
  sky.position.set(0, 32, -78);
  group.add(sky);

  for (let i = 0; i < 6; i += 1) {
    const ridge = new Mesh(
      new PlaneGeometry(42 + i * 8, 8 + i * 2.2, 1, 1),
      new MeshStandardMaterial({
        color: new Color(theme.groundSecondaryColor).lerp(new Color(theme.horizonColor), 0.35 + i * 0.08),
        roughness: 1,
        metalness: 0,
        emissive: theme.hazeColor,
        emissiveIntensity: 0.02 + i * 0.01,
        transparent: true,
        opacity: 0.28 + i * 0.08,
        depthWrite: false,
        fog: false,
      }),
    );
    ridge.position.set(rng.range(-18, 18), 6 + i * 2.8, -56 - i * 9.5);
    group.add(ridge);
  }

  const atmosphere = new Mesh(
    new RingGeometry(37, 64, 64),
    new MeshStandardMaterial({
      color: theme.hazeColor,
      emissive: theme.hazeColor,
      emissiveIntensity: 0.12,
      roughness: 1,
      metalness: 0,
      transparent: true,
      opacity: 0.06 + theme.atmosphereDensity * 0.08,
      blending: AdditiveBlending,
      depthWrite: false,
      fog: false,
    }),
  );
  atmosphere.rotation.x = -Math.PI / 2;
  atmosphere.position.set(0, 0.45, 0);
  group.add(atmosphere);

  return group;
}

function createTerrainPatch(theme: CityTheme, seed: number): Mesh {
  const geometry = new PlaneGeometry(62, 62, 130, 130);
  const position = geometry.getAttribute('position');
  const color = new Float32Array(position.count * 3);

  const high = new Color(theme.groundColor).lerp(new Color(0xffffff), 0.1);
  const mid = new Color(theme.groundSecondaryColor);
  const low = new Color(theme.groundShadowColor);
  const tint = new Color(theme.floraColor);

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const z = position.getY(index);
    const height = sampleTerrainHeight(theme, seed, x, z);
    position.setZ(index, height);

    const lift = Math.max(0, Math.min(1, (height + 2) / 3.8));
    const biomeMix = Math.max(0, Math.min(1, 0.5 + Math.sin((x - z) * 0.06) * 0.2));
    const current = low.clone().lerp(mid, lift).lerp(high, Math.pow(lift, 1.4)).lerp(tint, biomeMix * 0.13);

    color[index * 3] = current.r;
    color[index * 3 + 1] = current.g;
    color[index * 3 + 2] = current.b;
  }

  geometry.setAttribute('color', new BufferAttribute(color, 3));
  geometry.computeVertexNormals();
  geometry.rotateX(-Math.PI / 2);

  const material = new MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.9,
    metalness: 0.05,
  });

  return new Mesh(geometry, material);
}

function sampleTerrainHeight(theme: CityTheme, seed: number, x: number, z: number): number {
  const radial = Math.min(1, Math.hypot(x, z) / TERRAIN_RADIUS);
  const biomePhase = ((seed >>> 5) & 0xff) * 0.012;

  const macro =
    Math.sin((x + biomePhase) * 0.15) * 0.7 +
    Math.cos((z - biomePhase * 1.6) * 0.13) * 0.56 +
    Math.sin((x - z) * 0.075) * 0.46;
  const ridges = Math.sin((x * 0.5 + z * 0.3 + biomePhase) * 0.68) * 0.25;
  const basin = -Math.exp(-((x + 2.8) ** 2 + (z - 1.4) ** 2) / 160) * (0.48 + theme.atmosphereDensity * 0.18);
  const shelf = Math.exp(-((x - 10.8) ** 2 + (z + 7.2) ** 2) / 180) * 0.42;

  const edgeDrop = -Math.pow(radial, 2.4) * 3.2;
  return (macro * 0.68 + ridges + basin + shelf) * theme.reliefAmplitude + edgeDrop;
}

function addTerrainRim(root: Group, theme: CityTheme) {
  const shelf = new Mesh(
    new BoxGeometry(70, 8, 70),
    new MeshStandardMaterial({
      color: theme.groundShadowColor,
      roughness: 0.92,
      metalness: 0.02,
    }),
  );
  shelf.position.y = -6.2;
  root.add(shelf);
}

function addBiomeSetDressing(root: Group, theme: CityTheme, seed: number) {
  const rng = new SeededRng(seed ^ 0x4bd84c11);
  const crystalGeom = new BoxGeometry(0.7, 2.1, 0.7);
  const crystalMat = new MeshStandardMaterial({
    color: new Color(theme.groundSecondaryColor).lerp(new Color(theme.hazeColor), 0.4),
    emissive: new Color(theme.emissiveAccent),
    emissiveIntensity: 0.05 + theme.atmosphereDensity * 0.08,
    roughness: 0.3,
    metalness: 0.15,
  });

  const marker = new Object3D();
  const matrix = new Matrix4();

  for (let i = 0; i < 28; i += 1) {
    const angle = (i / 28) * Math.PI * 2 + rng.range(-0.18, 0.18);
    const radius = rng.range(18, 29);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = sampleTerrainHeight(theme, seed, x, z);

    marker.position.set(x, y + 0.4, z);
    marker.rotation.set(rng.range(-0.25, 0.25), rng.range(0, Math.PI), rng.range(-0.2, 0.2));
    marker.scale.set(rng.range(0.6, 1.35), rng.range(0.5, 1.7), rng.range(0.7, 1.25));
    marker.updateMatrix();
    matrix.copy(marker.matrix);

    const crystal = new Mesh(crystalGeom, crystalMat);
    crystal.applyMatrix4(matrix);
    root.add(crystal);
  }

  const beaconMat = new MeshStandardMaterial({
    color: theme.metalColor,
    roughness: 0.42,
    metalness: 0.62,
    emissive: theme.emissiveAccent,
    emissiveIntensity: 0.18,
  });

  const beaconPositions = [
    new Vector3(-16, 0, 0),
    new Vector3(16, 0, 0),
    new Vector3(0, 0, -16),
    new Vector3(0, 0, 16),
  ];

  for (const position of beaconPositions) {
    const beacon = new Mesh(new BoxGeometry(0.7, 1.8, 0.7), beaconMat);
    beacon.position.set(position.x, sampleTerrainHeight(theme, seed, position.x, position.z) + 1.2, position.z);
    root.add(beacon);
  }
}
