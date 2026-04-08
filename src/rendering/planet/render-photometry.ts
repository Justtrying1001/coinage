import * as THREE from 'three';

export const PLANET_RENDER_PHOTOMETRY = {
  outputColorSpace: THREE.SRGBColorSpace,
  toneMapping: THREE.ACESFilmicToneMapping,
  galaxyExposure: 1.72,
  planetExposure: 1.74,
} as const;
