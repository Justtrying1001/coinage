import * as THREE from 'three';
import type { CityTerrainInput, TerrainGeometryConfig } from '@/game/render/modes/terrain/CityTerrainTypes';
import type { CityLayoutSnapshot } from '@/game/city/layout/cityLayout';

export function buildCityDecor(
  _input: CityTerrainInput,
  _layout: Pick<CityLayoutSnapshot, 'blocked' | 'expansion'>,
  _config: TerrainGeometryConfig,
) {
  void _input;
  void _layout;
  void _config;
  // Deliberately empty in normal City View until production-grade assets are integrated.
  // This removes low-poly placeholder props from the runtime view.
  return new THREE.Group();
}
