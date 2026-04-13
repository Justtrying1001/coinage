import type { BuildSurfaceSnapshot } from '@/game/render/modes/terrain/CityTerrainTypes';

export function summarizeBuildSurface(snapshot: BuildSurfaceSnapshot) {
  let stable = 0;
  for (let i = 0; i < snapshot.stableMask.length; i += 1) {
    if (snapshot.stableMask[i] > 0.55) stable += 1;
  }
  return {
    stableVertices: stable,
    totalVertices: snapshot.stableMask.length,
    stableRatio: snapshot.stableMask.length > 0 ? stable / snapshot.stableMask.length : 0,
  };
}
