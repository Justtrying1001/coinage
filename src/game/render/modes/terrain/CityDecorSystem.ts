import * as THREE from 'three';
import { CITY_BIOME_SPECS } from '@/game/render/modes/terrain/CityBiomeSpecs';
import type { CityTerrainInput, TerrainGeometryConfig } from '@/game/render/modes/terrain/CityTerrainTypes';
import type { CityLayoutSnapshot } from '@/game/city/layout/cityLayout';
import { sampleTerrain } from '@/game/render/modes/terrain/CityTerrainPipeline';

const GRID_WIDTH = 20;
const GRID_HEIGHT = 14;

export function buildCityDecor(
  input: CityTerrainInput,
  layout: Pick<CityLayoutSnapshot, 'blocked' | 'expansion'>,
  config: TerrainGeometryConfig,
) {
  const spec = CITY_BIOME_SPECS[input.archetype];
  const rng = mulberry32(input.seed ^ 0xee45aa91);
  const group = new THREE.Group();

  const landmarkCount = Math.floor(12 * spec.decorDensity);
  const mediumCount = Math.floor(130 * spec.decorDensity);
  const clutterCount = Math.floor(260 * spec.decorDensity);

  addInstancedLayer(group, createDecorGeometry(spec.decorType, 'landmark', rng), pickColor(spec.decorType, rng), landmarkCount, 1.8, 3.2, rng, input, layout, config);
  addInstancedLayer(group, createDecorGeometry(spec.decorType, 'medium', rng), pickColor(spec.decorType, rng), mediumCount, 0.9, 1.8, rng, input, layout, config);
  addInstancedLayer(group, createDecorGeometry(spec.decorType, 'clutter', rng), pickColor(spec.decorType, rng), clutterCount, 0.28, 0.78, rng, input, layout, config);

  return group;
}

function addInstancedLayer(
  group: THREE.Group,
  geometry: THREE.BufferGeometry,
  color: THREE.Color,
  maxCount: number,
  minScale: number,
  maxScale: number,
  rng: () => number,
  input: CityTerrainInput,
  layout: Pick<CityLayoutSnapshot, 'blocked' | 'expansion'>,
  config: TerrainGeometryConfig,
) {
  const instances: Array<{ x: number; z: number; y: number; s: number; r: number }> = [];
  for (let i = 0; i < maxCount; i += 1) {
    const ring = lerp(0.28, 1.06, rng());
    const angle = rng() * Math.PI * 2;
    const x = Math.cos(angle) * ring * (config.terrainWidth * 0.52);
    const z = Math.sin(angle) * ring * (config.terrainDepth * 0.52);

    if (isBuildCore(x, z, layout, config)) continue;
    const sample = sampleTerrain(input, layout, x, z, config, false);
    if (sample.masks.cliff > 0.84) continue;

    instances.push({
      x,
      z,
      y: sample.height + 0.12,
      s: lerp(minScale, maxScale, rng()),
      r: rng() * Math.PI * 2,
    });
  }

  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.88,
    metalness: input.archetype === 'mineral' ? 0.3 : input.archetype === 'volcanic' ? 0.14 : 0.05,
  });
  const mesh = new THREE.InstancedMesh(geometry, mat, instances.length);
  const dummy = new THREE.Object3D();
  instances.forEach((item, idx) => {
    dummy.position.set(item.x, item.y, item.z);
    dummy.rotation.set(0, item.r, 0);
    dummy.scale.setScalar(item.s);
    dummy.updateMatrix();
    mesh.setMatrixAt(idx, dummy.matrix);
  });
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.instanceMatrix.needsUpdate = true;
  group.add(mesh);
}

function createDecorGeometry(type: string, layer: 'landmark' | 'medium' | 'clutter', rng: () => number) {
  const scale = layer === 'landmark' ? 1.6 : layer === 'medium' ? 1 : 0.58;
  if (type === 'coastal') return new THREE.CylinderGeometry(0.25 * scale, 0.7 * scale, 1.8 * scale, 7);
  if (type === 'frozen') return new THREE.ConeGeometry(0.46 * scale, 2.2 * scale, 5);
  if (type === 'arid') return new THREE.DodecahedronGeometry(0.7 * scale, 0);
  if (type === 'volcanic') return new THREE.CylinderGeometry(0.4 * scale, 0.55 * scale, 2.6 * scale, 6);
  if (type === 'mineral') return new THREE.OctahedronGeometry(0.62 * scale, 0);
  if (type === 'jungle') return rng() > 0.55
    ? new THREE.ConeGeometry(0.66 * scale, 2.6 * scale, 7)
    : new THREE.CylinderGeometry(0.22 * scale, 0.34 * scale, 1.5 * scale, 6);
  if (type === 'temperate') return rng() > 0.4
    ? new THREE.ConeGeometry(0.52 * scale, 2.1 * scale, 7)
    : new THREE.CylinderGeometry(0.2 * scale, 0.3 * scale, 1.2 * scale, 6);
  return new THREE.DodecahedronGeometry(0.44 * scale, 0);
}

function pickColor(type: string, rng: () => number) {
  if (type === 'coastal') return new THREE.Color('#5f7d6c').lerp(new THREE.Color('#7d9c8b'), rng());
  if (type === 'frozen') return new THREE.Color('#b9d8e8').lerp(new THREE.Color('#dfeff8'), rng());
  if (type === 'arid') return new THREE.Color('#8f6a3d').lerp(new THREE.Color('#b08a57'), rng());
  if (type === 'volcanic') return new THREE.Color('#3f3330').lerp(new THREE.Color('#704237'), rng());
  if (type === 'mineral') return new THREE.Color('#68808a').lerp(new THREE.Color('#8db2c2'), rng());
  if (type === 'jungle') return new THREE.Color('#2e5e34').lerp(new THREE.Color('#3f7f46'), rng());
  if (type === 'temperate') return new THREE.Color('#4f6f3f').lerp(new THREE.Color('#6e8f57'), rng());
  return new THREE.Color('#6f675f').lerp(new THREE.Color('#8a8076'), rng());
}

function isBuildCore(
  x: number,
  z: number,
  layout: Pick<CityLayoutSnapshot, 'blocked' | 'expansion'>,
  config: TerrainGeometryConfig,
) {
  const nx = Math.abs(x / config.terrainWidth);
  const nz = Math.abs(z / config.terrainDepth);
  if (Math.max(nx, nz) > 0.35) return false;

  const tx = Math.floor(((x + config.terrainWidth * 0.5) / config.terrainWidth) * GRID_WIDTH);
  const ty = Math.floor(((z + config.terrainDepth * 0.5) / config.terrainDepth) * GRID_HEIGHT);
  if (tx < 0 || ty < 0 || tx >= GRID_WIDTH || ty >= GRID_HEIGHT) return true;
  const key = `${tx},${ty}`;
  return !layout.blocked.has(key) && !layout.expansion.has(key);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
