import * as THREE from 'three';
import { CITY_BIOME_SPECS } from '@/game/render/modes/terrain/CityBiomeSpecs';
import type { CityTerrainInput, TerrainGeometryConfig } from '@/game/render/modes/terrain/CityTerrainTypes';

export function createCityFluidLayer(input: CityTerrainInput, config: TerrainGeometryConfig) {
  const spec = CITY_BIOME_SPECS[input.archetype];
  if (spec.water.mode === 'none') return null;

  const geo = new THREE.PlaneGeometry(config.farWidth * 0.94, config.farDepth * 0.92, 140, 120);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i) / (config.farWidth * 0.47);
    const z = pos.getZ(i) / (config.farDepth * 0.46);

    const radial = 1 - smoothstep(0.2, 1.15, Math.sqrt(x * x + z * z));
    const shorelineBias = smoothstep(-0.75, -0.05, z);

    const wave = Math.sin((x + input.seed * 0.00014) * 12) * Math.cos((z - input.seed * 0.00019) * 10);
    const ripple = wave * (spec.water.mode === 'ice' ? 0.035 : 0.22) * shorelineBias;
    const shelf = radial * shorelineBias * spec.water.coastBlend * 0.7;

    pos.setY(i, ripple + shelf);
  }

  pos.needsUpdate = true;
  geo.computeVertexNormals();

  const color = spec.water.mode === 'lava'
    ? new THREE.Color('#983217')
    : spec.water.mode === 'ice'
      ? new THREE.Color('#a7cedf')
      : input.palettes.water.clone().lerp(new THREE.Color('#5e8cae'), 0.2);

  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: spec.water.mode === 'lava' ? 0.78 : spec.water.mode === 'ice' ? 0.4 : 0.16,
    metalness: spec.water.mode === 'lava' ? 0.08 : 0.2,
    transparent: true,
    opacity: spec.water.mode === 'ice' ? 0.62 : 0.76,
    emissive: spec.water.mode === 'lava' ? new THREE.Color('#c34d2a') : new THREE.Color('#000000'),
    emissiveIntensity: spec.water.mode === 'lava' ? 0.42 : 0,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, spec.water.level, 0);
  mesh.receiveShadow = spec.water.mode !== 'water';
  return mesh;
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0 || 1), 0, 1);
  return t * t * (3 - 2 * t);
}
