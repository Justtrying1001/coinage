import {
  AmbientLight,
  Color,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  Mesh,
  Scene,
} from 'three';
import type { CityTheme } from '@/game/city/themes/cityThemePresets';
import type { CityBiomeContext } from '@/game/city/terrain/CityBiomeContext';
import { createCityTerrainMaterial } from '@/game/city/terrain/cityTerrainMaterial';
import { generateCitySurfaceSlice } from '@/game/city/terrain/generateCitySurfaceSlice';

export interface CitySceneScaffold {
  scene: Scene;
  cityRoot: Group;
  sampleTerrainHeight: (x: number, z: number) => number;
}

export function createCityScene(theme: CityTheme, biomeContext: CityBiomeContext): CitySceneScaffold {
  const scene = new Scene();
  scene.background = new Color(theme.clearColor);
  scene.fog = new Fog(theme.fogColor, theme.fogNear, theme.fogFar);

  const cityRoot = new Group();
  cityRoot.name = 'city-root';
  scene.add(cityRoot);

  const surfaceSlice = generateCitySurfaceSlice(biomeContext);
  const terrainMaterial = createCityTerrainMaterial(biomeContext, surfaceSlice.minElevation, surfaceSlice.maxElevation);
  const terrain = new Mesh(surfaceSlice.geometry, terrainMaterial);
  terrain.receiveShadow = true;
  cityRoot.add(terrain);

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

  return { scene, cityRoot, sampleTerrainHeight: surfaceSlice.sampleHeight };
}
