import * as THREE from 'three';
import { CITY_BIOME_SPECS } from '@/game/render/modes/terrain/CityBiomeSpecs';
import type { CityTerrainInput, TerrainGeometryConfig } from '@/game/render/modes/terrain/CityTerrainTypes';

export function createCityFluidLayer(input: CityTerrainInput, config: TerrainGeometryConfig) {
  const spec = CITY_BIOME_SPECS[input.archetype];
  if (spec.water.mode === 'none') return null;

  const geo = new THREE.PlaneGeometry(config.farWidth * 0.98, config.farDepth * 0.96, 140, 120);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i) / config.farWidth;
    const z = pos.getZ(i) / config.farDepth;
    const ripple = Math.sin((x + input.seed * 0.0001) * 24) * Math.cos((z - input.seed * 0.00013) * 22) * 0.35;
    const shelf = smoothstep(0.2, 0.78, 1 - Math.max(Math.abs(x) * 1.04, Math.abs(z) * 1.02));
    const y = ripple * (spec.water.mode === 'ice' ? 0.08 : 0.38) + shelf * spec.water.coastBlend;
    pos.setY(i, y);
  }

  pos.needsUpdate = true;
  geo.computeVertexNormals();

  const color = spec.water.mode === 'lava'
    ? new THREE.Color('#8e2b12')
    : spec.water.mode === 'ice'
      ? new THREE.Color('#9dc5d8')
      : input.palettes.water.clone();

  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: spec.water.mode === 'lava' ? 0.84 : spec.water.mode === 'ice' ? 0.26 : 0.18,
    metalness: spec.water.mode === 'lava' ? 0.04 : 0.12,
    transparent: true,
    opacity: spec.water.mode === 'ice' ? 0.72 : 0.86,
    emissive: spec.water.mode === 'lava' ? new THREE.Color('#b64624') : new THREE.Color('#000000'),
    emissiveIntensity: spec.water.mode === 'lava' ? 0.38 : 0,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = spec.water.level;
  mesh.receiveShadow = spec.water.mode !== 'water';
  return mesh;
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0 || 1), 0, 1);
  return t * t * (3 - 2 * t);
}
