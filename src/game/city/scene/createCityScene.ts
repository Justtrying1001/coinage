import {
  AmbientLight,
  BackSide,
  Color,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
} from 'three';
import type { CityTheme } from '@/game/city/themes/cityThemePresets';
import { SeededRng } from '@/game/world/rng';
import { createCityTerrainMaterial } from '@/game/city/terrain/cityTerrainMaterial';
import { generateCitySurfaceSlice } from '@/game/city/terrain/generateCitySurfaceSlice';

export interface CitySceneScaffold {
  scene: Scene;
  cityRoot: Group;
  sampleGroundHeight: (x: number, z: number) => number;
}

export function createCityScene(theme: CityTheme, seed: number): CitySceneScaffold {
  const scene = new Scene();
  scene.background = new Color(theme.clearColor);
  scene.fog = new Fog(theme.fogColor, theme.fogNear, theme.fogFar);

  const cityRoot = new Group();
  cityRoot.name = 'city-root';
  scene.add(cityRoot);

  const sky = createSkyDome(theme);
  scene.add(sky);

  const terrainSlice = generateCitySurfaceSlice(theme, seed);
  const terrain = new Mesh(terrainSlice.geometry, createCityTerrainMaterial(theme));
  terrain.receiveShadow = true;
  cityRoot.add(terrain);

  addHorizonLayers(scene, theme, seed);
  addBiomeScatter(cityRoot, theme, seed, terrainSlice.sampleHeightAt);

  const hemi = new HemisphereLight(theme.horizonColor, theme.fogColor, 0.46 + theme.haze * 0.34);
  scene.add(hemi);
  scene.add(new AmbientLight(theme.ambientColor, theme.ambientIntensity));

  const keyLight = new DirectionalLight(theme.keyLightColor, theme.keyLightIntensity);
  keyLight.position.set(26, 28, 8);
  scene.add(keyLight);

  const rimLight = new DirectionalLight(theme.rimLightColor, theme.rimLightIntensity);
  rimLight.position.set(-22, 14, -26);
  scene.add(rimLight);

  return { scene, cityRoot, sampleGroundHeight: terrainSlice.sampleHeightAt };
}

function createSkyDome(theme: CityTheme): Mesh {
  const material = new ShaderMaterial({
    side: BackSide,
    uniforms: {
      uZenith: { value: new Color(theme.zenithColor) },
      uHorizon: { value: new Color(theme.horizonColor) },
      uFog: { value: new Color(theme.fogColor) },
    },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform vec3 uZenith;
      uniform vec3 uHorizon;
      uniform vec3 uFog;
      varying vec3 vDir;
      void main() {
        float y = clamp(vDir.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 grad = mix(uHorizon, uZenith, smoothstep(0.1, 1.0, y));
        grad = mix(grad, uFog, smoothstep(0.0, 0.25, y) * 0.4);
        gl_FragColor = vec4(grad, 1.0);
      }
    `,
    depthWrite: false,
  });

  return new Mesh(new SphereGeometry(180, 32, 24), material);
}

function addHorizonLayers(scene: Scene, theme: CityTheme, seed: number) {
  const rng = new SeededRng(seed ^ 0x6f9d211c);
  const silhouetteMat = new MeshBasicMaterial({ color: new Color(theme.terrainMidColor).multiplyScalar(0.55), transparent: true, opacity: 0.85 });

  for (let i = 0; i < 8; i += 1) {
    const mesh = new Mesh(new PlaneGeometry(32 + rng.range(-6, 8), 10 + rng.range(-2, 3), 1, 1), silhouetteMat.clone());
    mesh.position.set(-44 + i * 12 + rng.range(-2, 2), 5 + rng.range(-2, 2), -46 - rng.range(0, 14));
    mesh.rotation.y = rng.range(-0.18, 0.18);
    scene.add(mesh);
  }
}

function addBiomeScatter(root: Group, theme: CityTheme, seed: number, heightAt: (x: number, z: number) => number) {
  const rng = new SeededRng(seed ^ 0x7712ad4c);
  const scatterMat = new MeshBasicMaterial({ color: theme.floraColor, transparent: true, opacity: 0.72 });

  for (let i = 0; i < 36; i += 1) {
    const x = rng.range(-31, 31);
    const z = rng.range(-31, 31);
    if (Math.hypot(x, z) < 11) continue;
    const y = heightAt(x, z);
    const card = new Mesh(new PlaneGeometry(rng.range(0.7, 1.5), rng.range(1.8, 3.8)), scatterMat);
    card.position.set(x, y + card.scale.y * 0.45, z);
    card.rotation.y = rng.range(0, Math.PI);
    root.add(card);
  }
}
