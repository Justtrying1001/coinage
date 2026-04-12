import {
  AmbientLight,
  Color,
  DirectionalLight,
  Fog,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Scene,
} from 'three';
import type { CityTheme } from '@/game/city/themes/cityThemePresets';

export interface CitySceneScaffold {
  scene: Scene;
  cityRoot: Group;
}

export function createCityScene(theme: CityTheme): CitySceneScaffold {
  const scene = new Scene();
  scene.background = new Color(theme.clearColor);
  scene.fog = new Fog(theme.fogColor, theme.fogNear, theme.fogFar);

  const cityRoot = new Group();
  cityRoot.name = 'city-root';
  scene.add(cityRoot);

  const terrain = new Mesh(
    new PlaneGeometry(58, 58),
    new MeshStandardMaterial({ color: theme.groundColor, roughness: 0.9, metalness: 0.06 }),
  );
  terrain.rotation.x = -Math.PI / 2;
  terrain.position.y = -0.06;
  terrain.receiveShadow = true;
  cityRoot.add(terrain);

  const ambient = new AmbientLight(theme.ambientLightColor, theme.ambientLightIntensity);
  scene.add(ambient);

  const directional = new DirectionalLight(theme.directionalLightColor, theme.directionalLightIntensity);
  directional.position.set(18, 26, 16);
  directional.castShadow = false;
  scene.add(directional);

  return { scene, cityRoot };
}
