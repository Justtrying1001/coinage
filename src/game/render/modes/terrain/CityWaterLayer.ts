import * as THREE from 'three';
import { CITY_BIOME_SPECS } from '@/game/render/modes/terrain/CityBiomeSpecs';
import type { CityTerrainInput, TerrainGeometryConfig } from '@/game/render/modes/terrain/CityTerrainTypes';

export function createCityFluidLayer(input: CityTerrainInput, config: TerrainGeometryConfig) {
  const spec = CITY_BIOME_SPECS[input.archetype];
  if (spec.water.mode === 'none') return null;

  const geo = new THREE.PlaneGeometry(config.farWidth * 0.98, config.farDepth * 0.9, 150, 124);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i) / (config.farWidth * 0.49);
    const z = pos.getZ(i) / (config.farDepth * 0.45);

    const horizonMask = smoothstep(-0.55, 0.45, -z);
    const sideFalloff = 1 - smoothstep(0.18, 1.02, Math.abs(x));
    const buildClearance = smoothstep(-0.2, 0.2, -z);

    const wave = Math.sin((x + input.seed * 0.00014) * 14) * Math.cos((z - input.seed * 0.00019) * 12);
    const ripple = wave * (spec.water.mode === 'ice' ? 0.045 : 0.28) * horizonMask;
    const shelf = sideFalloff * spec.water.coastBlend * buildClearance;

    pos.setY(i, ripple + shelf);
  }

  pos.needsUpdate = true;
  geo.computeVertexNormals();

  const color = spec.water.mode === 'lava'
    ? new THREE.Color('#8f3116')
    : spec.water.mode === 'ice'
      ? new THREE.Color('#9ec8db')
      : input.palettes.water.clone().lerp(new THREE.Color('#5f8fb8'), 0.16);

  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: spec.water.mode === 'lava' ? 0.82 : spec.water.mode === 'ice' ? 0.34 : 0.18,
    metalness: spec.water.mode === 'lava' ? 0.05 : 0.18,
    transparent: true,
    opacity: spec.water.mode === 'ice' ? 0.68 : 0.82,
    emissive: spec.water.mode === 'lava' ? new THREE.Color('#c34d2a') : new THREE.Color('#000000'),
    emissiveIntensity: spec.water.mode === 'lava' ? 0.34 : 0,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, spec.water.level, -config.terrainDepth * 0.24);
  mesh.receiveShadow = spec.water.mode !== 'water';
  return mesh;
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0 || 1), 0, 1);
  return t * t * (3 - 2 * t);
}
