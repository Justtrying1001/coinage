const LEGACY_GPU_SEED_MODULO = 100000;

export function toLegacyGpuSeed(seed: number) {
  return ((seed % LEGACY_GPU_SEED_MODULO) + LEGACY_GPU_SEED_MODULO) % LEGACY_GPU_SEED_MODULO;
}

export function isLegacyGpuSeedDegenerate(seed: number) {
  return (toLegacyGpuSeed(seed) + 1) % 17 === 0;
}

export function buildGpuNoiseOffsets(seed: number, filterCount: number) {
  const offsets: [number, number, number][] = [];
  for (let i = 0; i < filterCount; i += 1) {
    const seedBase = seed * 0.0001 + i * 17.173;
    offsets.push([
      fract(Math.sin(seedBase * 12.9898) * 43758.5453) * 97,
      fract(Math.sin(seedBase * 78.233) * 12741.371) * 97,
      fract(Math.sin(seedBase * 39.425) * 31987.117) * 97,
    ]);
  }
  return offsets;
}

function fract(value: number) {
  return value - Math.floor(value);
}
