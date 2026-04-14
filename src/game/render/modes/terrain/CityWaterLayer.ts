import * as THREE from 'three';
import { CITY_BIOME_SPECS } from '@/game/render/modes/terrain/CityBiomeSpecs';
import type { CityTerrainInput, TerrainGeometryConfig } from '@/game/render/modes/terrain/CityTerrainTypes';

export function createCityFluidLayer(input: CityTerrainInput, config: TerrainGeometryConfig) {
  const spec = CITY_BIOME_SPECS[input.archetype];
  if (spec.water.mode === 'none') return null;

  const geo = new THREE.PlaneGeometry(config.farWidth * 0.94, config.farDepth * 0.82, 128, 112);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i) / (config.farWidth * 0.47);
    const z = pos.getZ(i) / (config.farDepth * 0.41);
    const backMask = smoothstep(-0.05, 0.48, -z);
    const sideMask = smoothstep(0.15, 1, Math.abs(x));
    const keepOutBuild = 1 - smoothstep(0.06, 0.44, z + 0.16);

    const wave = Math.sin((x + input.seed * 0.00014) * 16) * Math.cos((z - input.seed * 0.00019) * 14);
    const ripple = wave * (spec.water.mode === 'ice' ? 0.05 : 0.34) * backMask;
    const shelf = (1 - sideMask) * spec.water.coastBlend * (1 - keepOutBuild * 0.85);

    pos.setY(i, ripple + shelf);
  }

  pos.needsUpdate = true;
  geo.computeVertexNormals();

  const color = spec.water.mode === 'lava'
    ? new THREE.Color('#8f3116')
    : spec.water.mode === 'ice'
      ? new THREE.Color('#9ec8db')
      : input.palettes.water.clone();

  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: spec.water.mode === 'lava' ? 0.82 : spec.water.mode === 'ice' ? 0.32 : 0.16,
    metalness: spec.water.mode === 'lava' ? 0.05 : 0.15,
    transparent: true,
    opacity: spec.water.mode === 'ice' ? 0.7 : 0.84,
    emissive: spec.water.mode === 'lava' ? new THREE.Color('#c34d2a') : new THREE.Color('#000000'),
    emissiveIntensity: spec.water.mode === 'lava' ? 0.32 : 0,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, spec.water.level, -config.terrainDepth * 0.28);
  mesh.receiveShadow = spec.water.mode !== 'water';
  return mesh;
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0 || 1), 0, 1);
  return t * t * (3 - 2 * t);
}
