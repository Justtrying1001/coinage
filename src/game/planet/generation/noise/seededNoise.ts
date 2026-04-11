import { createNoise3D } from 'simplex-noise';

function lcg(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function createSeededNoise3D(seed: number) {
  return createNoise3D(lcg(seed));
}
