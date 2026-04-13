import * as THREE from 'three';
import { CITY_BIOME_SPECS } from '@/game/render/modes/terrain/CityBiomeSpecs';
import type { CityTerrainInput, TerrainGeometryConfig } from '@/game/render/modes/terrain/CityTerrainTypes';

export function createCityFluidLayer(input: CityTerrainInput, config: TerrainGeometryConfig) {
  const spec = CITY_BIOME_SPECS[input.archetype];
  if (spec.waterMode === 'none') return null;

  const geo = new THREE.PlaneGeometry(config.farWidth * 0.98, config.farDepth * 0.96, 140, 120);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i) / config.farWidth;
    const z = pos.getZ(i) / config.farDepth;
    const ripple = Math.sin((x + input.seed * 0.0001) * 24) * Math.cos((z - input.seed * 0.00013) * 22) * 0.35;
    const shelf = smoothstep(0.24, 0.8, 1 - Math.max(Math.abs(x) * 1.06, Math.abs(z) * 1.02));
    const y = ripple * (spec.waterMode === 'ice' ? 0.12 : 0.45) + shelf * 0.2;
    pos.setY(i, y);
  }

  pos.needsUpdate = true;
  geo.computeVertexNormals();

  const color = spec.waterMode === 'lava'
    ? new THREE.Color('#8e2b12')
    : spec.waterMode === 'ice'
      ? new THREE.Color('#9dc5d8')
      : input.palettes.water.clone();

  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: spec.waterMode === 'lava' ? 0.84 : spec.waterMode === 'ice' ? 0.26 : 0.18,
    metalness: spec.waterMode === 'lava' ? 0.04 : 0.12,
    transparent: true,
    opacity: spec.waterMode === 'ice' ? 0.72 : 0.86,
    emissive: spec.waterMode === 'lava' ? new THREE.Color('#b64624') : new THREE.Color('#000000'),
    emissiveIntensity: spec.waterMode === 'lava' ? 0.38 : 0,
  });

  const mesh = new THREE.Mesh(geo, mat);
  const level = spec.waterMode === 'water' ? -5.4 : spec.waterMode === 'ice' ? -3.9 : -7.4;
  mesh.position.y = level;
  mesh.receiveShadow = spec.waterMode !== 'water';
  return mesh;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1), 0, 1);
  return t * t * (3 - 2 * t);
}
