import * as THREE from 'three';

export const PLANET_RENDER_PHOTOMETRY = {
  outputColorSpace: THREE.SRGBColorSpace,
  toneMapping: THREE.ACESFilmicToneMapping,
  galaxyExposure: 1.08,
  planetExposure: 1.36,
} as const;
