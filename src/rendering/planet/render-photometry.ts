import * as THREE from 'three';

export const PLANET_RENDER_PHOTOMETRY = {
  outputColorSpace: THREE.SRGBColorSpace,
  toneMapping: THREE.ACESFilmicToneMapping,
  galaxyExposure: 1.82,
  planetExposure: 1.92,
} as const;
