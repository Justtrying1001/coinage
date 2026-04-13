import {
  AmbientLight,
  BackSide,
  BoxGeometry,
  Color,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Scene,
  SphereGeometry,
  Vector3,
} from 'three';
import type { CityTheme } from '@/game/city/themes/cityThemePresets';
import type { CityBiomeContext } from '@/game/city/runtime/CityBiomeContext';
import { SeededRng } from '@/game/world/rng';
import { createCityTerrainMaterial } from '@/game/city/terrain/createCityTerrainMaterial';
import { generateCitySurfaceSlice, type CitySurfaceSlice } from '@/game/city/terrain/generateCitySurfaceSlice';

export interface CitySceneScaffold {
  scene: Scene;
  cityRoot: Group;
  terrain: CitySurfaceSlice;
}

export function createCityScene(theme: CityTheme, seed: number, biomeContext: CityBiomeContext): CitySceneScaffold {
  const scene = new Scene();
  scene.background = new Color(theme.clearColor);
  scene.fog = new Fog(theme.fogColor, theme.fogNear, theme.fogFar);

  const cityRoot = new Group();
  cityRoot.name = 'city-root';
  scene.add(cityRoot);

  const terrain = generateCitySurfaceSlice(biomeContext);
  const terrainMesh = new Mesh(terrain.geometry, createCityTerrainMaterial(biomeContext));
  terrainMesh.receiveShadow = true;
  cityRoot.add(terrainMesh);

  addDistantRelief(scene, theme, biomeContext);
  addBiomeSetDressing(cityRoot, theme, seed, biomeContext, terrain);

  const hemi = new HemisphereLight(0xb7dcff, 0x1a2b3d, 0.52);
  scene.add(hemi);

  const ambient = new AmbientLight(theme.ambientLightColor, theme.ambientLightIntensity);
  scene.add(ambient);

  const keyLight = new DirectionalLight(theme.directionalLightColor, theme.directionalLightIntensity);
  keyLight.position.set(18, 26, 10);
  scene.add(keyLight);

  const rimLight = new DirectionalLight(theme.rimLightColor, theme.rimLightIntensity);
  rimLight.position.set(-20, 12, -24);
  scene.add(rimLight);

  return { scene, cityRoot, terrain };
}

function addDistantRelief(scene: Scene, theme: CityTheme, context: CityBiomeContext) {
  const hazeColor = new Color(theme.fogColor).lerp(new Color(theme.clearColor), 0.25);
  const haze = new Mesh(
    new SphereGeometry(140, 24, 18),
    new MeshBasicMaterial({ color: hazeColor, side: BackSide, transparent: true, opacity: 0.34 }),
  );
  haze.position.y = 30;
  scene.add(haze);

  const ridgeColor = new Color(theme.groundShadowColor)
    .lerp(new Color().fromArray(context.planetGenerationConfig.elevationGradient[context.planetGenerationConfig.elevationGradient.length - 1]?.color ?? [0.6, 0.6, 0.6]), 0.2)
    .multiplyScalar(0.8);

  for (let i = 0; i < 12; i += 1) {
    const ridge = new Mesh(
      new BoxGeometry(18, 5 + i * 0.45, 4),
      new MeshStandardMaterial({ color: ridgeColor, roughness: 0.94, metalness: 0.05 }),
    );
    const angle = (i / 12) * Math.PI * 2;
    ridge.position.set(Math.cos(angle) * 44, -1.5, Math.sin(angle) * 38);
    ridge.rotation.y = -angle + Math.PI * 0.5;
    scene.add(ridge);
  }
}

function addBiomeSetDressing(root: Group, theme: CityTheme, seed: number, context: CityBiomeContext, terrain: CitySurfaceSlice) {
  const rng = new SeededRng(seed ^ 0x4bd84c11);
  const mode = context.planetGenerationConfig.surfaceMode;
  const rockColor = new Color(theme.groundShadowColor).lerp(new Color(theme.groundColor), 0.3);
  const geom = new BoxGeometry(0.9, 1.8, 0.9);

  for (let i = 0; i < 42; i += 1) {
    const angle = rng.range(0, Math.PI * 2);
    const radius = rng.range(14, 30);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = terrain.sampleHeight(x, z);

    const outcrop = new Mesh(
      geom,
      new MeshStandardMaterial({
        color: rockColor,
        roughness: 0.5,
        metalness: mode === 'lava' ? 0.25 : 0.12,
        emissive: mode === 'lava' ? new Color(theme.emissiveAccent) : new Color(0x000000),
        emissiveIntensity: mode === 'lava' ? 0.13 : 0,
      }),
    );
    outcrop.position.set(x, y + 0.4, z);
    outcrop.scale.set(rng.range(0.8, 2), rng.range(0.6, 2.8), rng.range(0.8, 1.9));
    root.add(outcrop);
  }

  const conduitMat = new MeshStandardMaterial({
    color: theme.metalColor,
    roughness: 0.4,
    metalness: 0.72,
    emissive: theme.emissiveAccent,
    emissiveIntensity: 0.09,
  });

  const conduitPositions = [
    new Vector3(-9, terrain.sampleHeight(-9, -11) + 0.22, -11),
    new Vector3(10.5, terrain.sampleHeight(10.5, -8) + 0.22, -8),
    new Vector3(-12, terrain.sampleHeight(-12, 9) + 0.22, 9),
  ];

  for (const position of conduitPositions) {
    const conduit = new Mesh(new BoxGeometry(7.5, 0.22, 0.22), conduitMat);
    conduit.position.copy(position);
    conduit.rotation.y = rng.range(-0.8, 0.8);
    root.add(conduit);
  }
}
