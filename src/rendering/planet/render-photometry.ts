import * as THREE from 'three';

export const PLANET_RENDER_PHOTOMETRY = {
  outputColorSpace: THREE.SRGBColorSpace,
  toneMapping: THREE.NeutralToneMapping,
  galaxyExposure: 1.0,
  planetExposure: 1.0,
} as const;
