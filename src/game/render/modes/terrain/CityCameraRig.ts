import * as THREE from 'three';
import type { CityTerrainViewMode } from '@/game/render/modes/terrain/CityTerrainEngine';
import type { TerrainGeometryConfig } from '@/game/render/modes/terrain/CityTerrainTypes';

export function applyCityCameraRig(
  camera: THREE.PerspectiveCamera,
  mode: CityTerrainViewMode,
  config: TerrainGeometryConfig,
) {
  const presets: Record<CityTerrainViewMode, { fov: number; position: THREE.Vector3; target: THREE.Vector3; near: number; far: number }> = {
    normal: {
      fov: 46,
      position: new THREE.Vector3(0, 92, config.terrainDepth * 0.72),
      target: new THREE.Vector3(0, 8, -config.terrainDepth * 0.12),
      near: 0.5,
      far: 1700,
    },
    build: {
      fov: 42,
      position: new THREE.Vector3(0, 132, config.terrainDepth * 0.62),
      target: new THREE.Vector3(0, 2, config.terrainDepth * 0.03),
      near: 0.5,
      far: 1700,
    },
    flat: {
      fov: 38,
      position: new THREE.Vector3(0, 172, config.terrainDepth * 0.5),
      target: new THREE.Vector3(0, 0, config.terrainDepth * 0.06),
      near: 0.5,
      far: 1800,
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
