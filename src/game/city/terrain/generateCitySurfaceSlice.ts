import { MathUtils, PlaneGeometry, type BufferGeometry } from 'three';
import type { CityTheme } from '@/game/city/themes/cityThemePresets';
import { SeededRng } from '@/game/world/rng';

export interface CityTerrainSlice {
  geometry: BufferGeometry;
  sampleHeightAt: (x: number, z: number) => number;
}

export function generateCitySurfaceSlice(theme: CityTheme, seed: number): CityTerrainSlice {
  const width = 66;
  const depth = 66;
  const segments = 120;
  const geometry = new PlaneGeometry(width, depth, segments, segments);
  const position = geometry.getAttribute('position');
  const rng = new SeededRng(seed ^ 0x95aa6712);

  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const z = position.getY(i);
    position.setZ(i, sampleHeight(x, z, theme, rng));
  }

  geometry.computeVertexNormals();
  geometry.rotateX(-Math.PI / 2);

  return {
    geometry,
    sampleHeightAt: (x: number, z: number) => sampleHeight(x, z, theme),
  };
}

function sampleHeight(x: number, z: number, theme: CityTheme, rng?: SeededRng): number {
  const dist = Math.hypot(x, z);
  const basin = -Math.exp(-((x + 2.8) ** 2 + (z - 4.4) ** 2) / 130) * (0.8 + theme.moisture * 0.9);
  const ridgeA = Math.sin((x * 0.18 + z * 0.09) * (1.6 + theme.reliefSharpness * 0.4)) * 0.75;
  const ridgeB = Math.cos((z * 0.14 - x * 0.06) * (1.5 + theme.reliefSharpness * 0.3)) * 0.62;
  const macro = ridgeA + ridgeB;
  const terrace = Math.floor((macro + 1.4) * (2 + theme.terrainRelief * 0.2)) / (2 + theme.terrainRelief * 0.2);
  const crater = -Math.exp(-((x - 12.3) ** 2 + (z + 9.1) ** 2) / 50) * 0.85;
  const mesa = Math.exp(-((x + 15.2) ** 2 + (z + 10.2) ** 2) / 66) * 0.95;
  const centerLift = Math.exp(-(dist ** 2) / 560) * 1.8;
  const edgeFalloff = -Math.pow(MathUtils.clamp(dist / 34, 0, 1), 2.4) * 3.4;
  const micro = Math.sin((x + z) * (0.42 + theme.reliefSharpness * 0.11)) * 0.08;
  const jitter = rng?.range(-0.035, 0.035) ?? 0;

  return (terrace * 0.75 + basin + crater + mesa + centerLift + edgeFalloff + micro + jitter) * theme.terrainRelief * 0.62;
}
