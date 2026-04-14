import * as THREE from 'three';
import type { CityTerrainViewMode } from '@/game/render/modes/terrain/CityTerrainEngine';
import type { TerrainGeometryConfig } from '@/game/render/modes/terrain/CityTerrainTypes';

export interface CityCameraPreset {
  fov: number;
  near: number;
  far: number;
  position: THREE.Vector3;
  target: THREE.Vector3;
}

export function getCityCameraPreset(mode: CityTerrainViewMode, config: TerrainGeometryConfig): CityCameraPreset {
  const presets: Record<CityTerrainViewMode, CityCameraPreset> = {
    normal: {
      fov: 38,
      position: new THREE.Vector3(config.terrainWidth * 0.08, 108, config.terrainDepth * 0.64),
      target: new THREE.Vector3(0, 6, -config.terrainDepth * 0.03),
      near: 0.5,
      far: 2100,
    },
    build: {
      fov: 34,
      position: new THREE.Vector3(config.terrainWidth * 0.06, 124, config.terrainDepth * 0.58),
      target: new THREE.Vector3(0, 2, 0),
      near: 0.5,
      far: 2100,
    },
    flat: {
      fov: 32,
      position: new THREE.Vector3(config.terrainWidth * 0.03, 142, config.terrainDepth * 0.52),
      target: new THREE.Vector3(0, -0.4, 0),
      near: 0.5,
      far: 2200,
    },
  };

  return presets[mode];
}

export function applyCityCameraRig(
  camera: THREE.PerspectiveCamera,
  mode: CityTerrainViewMode,
  config: TerrainGeometryConfig,
) {
  const preset = getCityCameraPreset(mode, config);
  camera.fov = preset.fov;
  camera.near = preset.near;
  camera.far = preset.far;
  camera.position.copy(preset.position);
  camera.lookAt(preset.target);
  camera.updateProjectionMatrix();
}
