import * as THREE from 'three';

export const PLANET_RENDER_PHOTOMETRY = {
  outputColorSpace: THREE.SRGBColorSpace,
  toneMapping: THREE.ACESFilmicToneMapping,
  galaxyExposure: 1.45,
  planetExposure: 1.55,
} as const;
