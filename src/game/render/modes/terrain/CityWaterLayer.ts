import * as THREE from 'three';
import { CITY_BIOME_SPECS } from '@/game/render/modes/terrain/CityBiomeSpecs';
import type { CityTerrainInput, TerrainGeometryConfig } from '@/game/render/modes/terrain/CityTerrainTypes';

export function createCityFluidLayer(input: CityTerrainInput, config: TerrainGeometryConfig) {
  const spec = CITY_BIOME_SPECS[input.archetype];
  if (spec.waterMode === 'none') return null;

  const geo = new THREE.PlaneGeometry(config.farWidth, config.farDepth, 200, 170);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const alpha = new Float32Array(pos.count);

  for (let i = 0; i < pos.count; i += 1) {
    const nx = pos.getX(i) / config.farWidth;
    const nz = pos.getZ(i) / config.farDepth;
    const coastDistance = nx * input.local.coastDirX + nz * input.local.coastDirZ + input.local.coastBias;

    const wave = Math.sin((nx + input.seed * 0.00009) * 22) * Math.cos((nz - input.seed * 0.00007) * 19) * 0.45;
    const mask = smoothstep(-0.42, spec.waterMode === 'water' ? 0.02 : -0.08, coastDistance);
    const y = wave * (spec.waterMode === 'ice' ? 0.12 : 0.52) + (1 - mask) * 0.8;
    pos.setY(i, y);
    alpha[i] = clamp((1 - mask) * (spec.waterMode === 'lava' ? 0.76 : 0.9), 0, 1);
  }

  geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
  pos.needsUpdate = true;
  geo.computeVertexNormals();

  const color = spec.waterMode === 'lava'
    ? new THREE.Color('#922f16')
    : spec.waterMode === 'ice'
      ? new THREE.Color('#a8cfe0')
      : input.palettes.water.clone();

  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: spec.waterMode === 'lava' ? 0.84 : spec.waterMode === 'ice' ? 0.28 : 0.14,
    metalness: spec.waterMode === 'lava' ? 0.04 : 0.14,
    transparent: true,
    opacity: spec.waterMode === 'lava' ? 0.8 : 0.86,
    emissive: spec.waterMode === 'lava' ? new THREE.Color('#c9532a') : new THREE.Color('#000000'),
    emissiveIntensity: spec.waterMode === 'lava' ? 0.42 : 0,
    depthWrite: false,
  });

  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aAlpha;\nvarying float vAlpha;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvAlpha = aAlpha;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vAlpha;')
      .replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( diffuse, opacity * vAlpha );');
  };

  const mesh = new THREE.Mesh(geo, mat);
  const level = spec.waterMode === 'water' ? -4.9 : spec.waterMode === 'ice' ? -3.5 : -6.6;
  mesh.position.y = level;
  mesh.receiveShadow = false;
  return mesh;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1), 0, 1);
  return t * t * (3 - 2 * t);
}
