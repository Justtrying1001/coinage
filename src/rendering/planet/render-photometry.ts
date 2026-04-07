import * as THREE from 'three';

export const PLANET_LIGHT_DIRECTION = new THREE.Vector3(0.56, 0.35, 0.74).normalize();

export const PLANET_RENDER_PHOTOMETRY = {
  outputColorSpace: THREE.SRGBColorSpace,
  toneMapping: THREE.ACESFilmicToneMapping,
  galaxyExposure: 1.35,
  planetExposure: 1.35,
} as const;
