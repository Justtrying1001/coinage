import * as THREE from 'three';
import type { CityTerrainInput, TerrainGeometryConfig } from '@/game/render/modes/terrain/CityTerrainTypes';
import type { CityLayoutSnapshot } from '@/game/city/layout/cityLayout';

export function buildCityDecor(
  input: CityTerrainInput,
  _layout: Pick<CityLayoutSnapshot, 'blocked' | 'expansion'>,
  config: TerrainGeometryConfig,
  nearTerrain?: THREE.Mesh,
) {
  const group = new THREE.Group();
  if (!nearTerrain) return group;

  const position = nearTerrain.geometry.getAttribute('position');
  const buildMask = nearTerrain.geometry.getAttribute('aBuildMask');
  const transitionMask = nearTerrain.geometry.getAttribute('aTransitionMask');
  const backgroundMask = nearTerrain.geometry.getAttribute('aBackgroundMask');

  if (!position || !buildMask || !transitionMask || !backgroundMask) return group;

  const rng = seededRandom(input.seed ^ 0x5f3759df);
  const decorColor = input.palettes.accent.clone().multiplyScalar(0.72);

  const rock = createScatterLayer({
    source: position,
    exclusionMask: buildMask,
    primaryMask: backgroundMask,
    density: input.archetype === 'volcanic' ? 0.032 : 0.022,
    rng,
    scale: [1.2, 4.4],
    geometry: new THREE.DodecahedronGeometry(1, 0),
    material: new THREE.MeshStandardMaterial({ color: input.palettes.cliff.clone().lerp(decorColor, 0.2), roughness: 0.9, metalness: 0.05 }),
  });
  group.add(rock);

  if (input.archetype !== 'volcanic' && input.archetype !== 'barren') {
    const flora = createScatterLayer({
      source: position,
      exclusionMask: buildMask,
      primaryMask: transitionMask,
      density: input.archetype === 'jungle' ? 0.065 : 0.035,
      rng,
      scale: [1.1, 2.8],
      geometry: new THREE.ConeGeometry(0.8, 2.6, 6),
      material: new THREE.MeshStandardMaterial({ color: input.palettes.accent.clone().lerp(input.palettes.low, 0.45), roughness: 0.86, metalness: 0.02 }),
      yOffset: 0.6,
    });
    group.add(flora);
  }

  group.position.z = -config.terrainDepth * 0.02;
  return group;
}

function createScatterLayer(params: {
  source: THREE.BufferAttribute | THREE.InterleavedBufferAttribute;
  exclusionMask: THREE.BufferAttribute | THREE.InterleavedBufferAttribute;
  primaryMask: THREE.BufferAttribute | THREE.InterleavedBufferAttribute;
  density: number;
  rng: () => number;
  scale: [number, number];
  geometry: THREE.BufferGeometry;
  material: THREE.MeshStandardMaterial;
  yOffset?: number;
}) {
  const candidates: number[] = [];

  for (let i = 0; i < params.source.count; i += 1) {
    const excluded = params.exclusionMask.getX(i);
    const priority = params.primaryMask.getX(i);
    if (excluded > 0.22 || priority < 0.32) continue;
    if (params.rng() > params.density * priority) continue;
    candidates.push(i);
  }

  const mesh = new THREE.InstancedMesh(params.geometry, params.material, candidates.length);
  mesh.castShadow = false;
  mesh.receiveShadow = true;

  const matrix = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const scale = new THREE.Vector3();

  for (let i = 0; i < candidates.length; i += 1) {
    const idx = candidates[i];
    const x = params.source.getX(idx);
    const y = params.source.getY(idx) + (params.yOffset ?? 0);
    const z = params.source.getZ(idx);

    pos.set(x, y, z);
    quat.setFromEuler(new THREE.Euler(0, params.rng() * Math.PI * 2, 0));
    const s = THREE.MathUtils.lerp(params.scale[0], params.scale[1], params.rng());
    scale.set(s, s * THREE.MathUtils.lerp(0.8, 1.3, params.rng()), s);
    matrix.compose(pos, quat, scale);
    mesh.setMatrixAt(i, matrix);
  }

  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}
