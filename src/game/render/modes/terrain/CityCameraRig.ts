import * as THREE from 'three';
import type { CityTerrainViewMode } from '@/game/render/modes/terrain/CityTerrainEngine';
import type { TerrainGeometryConfig } from '@/game/render/modes/terrain/CityTerrainTypes';

export function applyCityCameraRig(
  camera: THREE.PerspectiveCamera,
  mode: CityTerrainViewMode,
  config: TerrainGeometryConfig,
) {
  const lateral = config.terrainWidth * 0.14;
  const presets: Record<CityTerrainViewMode, { fov: number; position: THREE.Vector3; target: THREE.Vector3; near: number; far: number }> = {
    normal: {
      fov: 43,
      position: new THREE.Vector3(lateral, 88, config.terrainDepth * 0.74),
      target: new THREE.Vector3(0, 7, -config.terrainDepth * 0.08),
      near: 0.5,
      far: 1800,
    },
    build: {
      fov: 40,
      position: new THREE.Vector3(lateral * 0.68, 118, config.terrainDepth * 0.63),
      target: new THREE.Vector3(0, 1.5, config.terrainDepth * 0.02),
      near: 0.5,
      far: 1800,
    },
    flat: {
      fov: 36,
      position: new THREE.Vector3(lateral * 0.35, 152, config.terrainDepth * 0.54),
      target: new THREE.Vector3(0, -0.5, config.terrainDepth * 0.05),
      near: 0.5,
      far: 1900,
    },
  };

  const preset = presets[mode];
  camera.fov = preset.fov;
  camera.near = preset.near;
  camera.far = preset.far;
  camera.position.copy(preset.position);
  camera.lookAt(preset.target);
  camera.updateProjectionMatrix();
}
