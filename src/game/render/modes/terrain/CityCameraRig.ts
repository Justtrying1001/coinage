import * as THREE from 'three';
import type { TerrainGeometryConfig } from '@/game/render/modes/terrain/CityTerrainTypes';

export interface CityCameraPreset {
  fov: number;
  near: number;
  far: number;
  position: THREE.Vector3;
  target: THREE.Vector3;
}

export function getCityCameraPreset(
  config: TerrainGeometryConfig,
  focus: { x: number; y?: number; z: number } = { x: 0, y: 3, z: 0 },
): CityCameraPreset {
  const target = new THREE.Vector3(focus.x, focus.y ?? 3, focus.z);
  const distance = Math.max(config.terrainWidth, config.terrainDepth) * 0.58;
  const azimuth = 0.18;
  const polar = 1.05;
  const sinPolar = Math.sin(polar);
  const offset = new THREE.Vector3(
    sinPolar * Math.sin(azimuth),
    Math.cos(polar),
    sinPolar * Math.cos(azimuth),
  ).multiplyScalar(distance);

  return {
    fov: 42,
    position: target.clone().add(offset),
    target,
    near: 0.5,
    far: 2400,
  };
}

export function applyCityCameraRig(
  camera: THREE.PerspectiveCamera,
  config: TerrainGeometryConfig,
  focus?: { x: number; y?: number; z: number },
) {
  const preset = getCityCameraPreset(config, focus);
  camera.fov = preset.fov;
  camera.near = preset.near;
  camera.far = preset.far;
  camera.position.copy(preset.position);
  camera.lookAt(preset.target);
  camera.updateProjectionMatrix();
}
