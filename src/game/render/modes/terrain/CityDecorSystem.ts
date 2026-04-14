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
    secondaryMask: transitionMask,
    density: input.archetype === 'volcanic' ? 0.04 : 0.03,
    rng,
    scale: [1.4, 5.2],
    clusterSeed: input.seed ^ 0x9e3779b9,
    geometry: new THREE.DodecahedronGeometry(1, 0),
    material: new THREE.MeshStandardMaterial({ color: input.palettes.cliff.clone().lerp(decorColor, 0.2), roughness: 0.9, metalness: 0.05 }),
  });
  group.add(rock);

  if (input.archetype !== 'volcanic' && input.archetype !== 'barren') {
    const flora = createScatterLayer({
      source: position,
      exclusionMask: buildMask,
      primaryMask: transitionMask,
      density: input.archetype === 'jungle' ? 0.065 : 0.04,
      rng,
      scale: [1.2, 3.4],
      clusterSeed: input.seed ^ 0x85ebca6b,
      geometry: new THREE.ConeGeometry(0.85, 2.8, 6),
      material: new THREE.MeshStandardMaterial({ color: input.palettes.accent.clone().lerp(input.palettes.low, 0.4), roughness: 0.82, metalness: 0.02 }),
      yOffset: 0.6,
    });
    group.add(flora);
  }

  const distantSilhouette = createDistantSilhouette(input, config);
  group.add(distantSilhouette);

  group.position.z = -config.terrainDepth * 0.015;
  return group;
}

function createScatterLayer(params: {
  source: THREE.BufferAttribute | THREE.InterleavedBufferAttribute;
  exclusionMask: THREE.BufferAttribute | THREE.InterleavedBufferAttribute;
  primaryMask: THREE.BufferAttribute | THREE.InterleavedBufferAttribute;
  density: number;
  secondaryMask?: THREE.BufferAttribute | THREE.InterleavedBufferAttribute;
  rng: () => number;
  scale: [number, number];
  clusterSeed: number;
  geometry: THREE.BufferGeometry;
  material: THREE.MeshStandardMaterial;
  yOffset?: number;
}) {
  const candidates: number[] = [];

  for (let i = 0; i < params.source.count; i += 1) {
    const excluded = params.exclusionMask.getX(i);
    const priority = params.primaryMask.getX(i);
    const secondary = params.secondaryMask ? params.secondaryMask.getX(i) : 0;
    if (excluded > 0.24 || priority + secondary * 0.4 < 0.2) continue;

    const x = params.source.getX(i);
    const z = params.source.getZ(i);
    const cluster = clusterFactor(x, z, params.clusterSeed);
    const chance = params.density * (priority * 0.7 + secondary * 0.42) * cluster;
    if (params.rng() > chance) continue;

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
    scale.set(s, s * THREE.MathUtils.lerp(0.8, 1.35, params.rng()), s);
    matrix.compose(pos, quat, scale);
    mesh.setMatrixAt(i, matrix);
  }

  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

function createDistantSilhouette(input: CityTerrainInput, config: TerrainGeometryConfig) {
  const geo = new THREE.RingGeometry(config.terrainWidth * 0.52, config.farWidth * 0.42, 96, 4);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({
    color: input.palettes.cliff.clone().lerp(input.palettes.fog, 0.5),
    roughness: 0.96,
    metalness: 0.01,
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = input.archetype === 'frozen' ? -0.2 : -0.4;
  mesh.receiveShadow = false;
  mesh.castShadow = false;
  return mesh;
}

function clusterFactor(x: number, z: number, seed: number) {
  const s1 = Math.sin((x + seed * 0.0013) * 0.026) * Math.cos((z - seed * 0.0017) * 0.021);
  const s2 = Math.cos((x - seed * 0.0009) * 0.012 + (z + seed * 0.0004) * 0.017);
  const n = (s1 * 0.65 + s2 * 0.35) * 0.5 + 0.5;
  return THREE.MathUtils.smoothstep(n, 0.38, 0.92);
}

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}
