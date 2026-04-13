import * as THREE from 'three';
import type { CityTerrainInput, TerrainGeometryConfig } from '@/game/render/modes/terrain/CityTerrainTypes';
import type { CityLayoutSnapshot } from '@/game/city/layout/cityLayout';
import { sampleTerrain } from '@/game/render/modes/terrain/CityTerrainPipeline';

const EMPTY_LAYOUT = { blocked: new Set<string>(), expansion: new Set<string>() };

export function buildCityDecor(
  input: CityTerrainInput,
  _layout: Pick<CityLayoutSnapshot, 'blocked' | 'expansion'>,
  config: TerrainGeometryConfig,
) {
  const group = new THREE.Group();
  const seed = input.seed ^ 0x44aa;

  const scatterCount = input.archetype === 'terrestrial' || input.archetype === 'jungle' ? 220 : 140;
  const props = createBiomeProps(input);

  for (const prop of props) {
    const mesh = new THREE.InstancedMesh(prop.geometry, prop.material, scatterCount);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let placed = 0;

    for (let i = 0; i < scatterCount * 2 && placed < scatterCount; i += 1) {
      const rx = hash(seed + i * 33) * 2 - 1;
      const rz = hash(seed + i * 77) * 2 - 1;

      const ring = 0.35 + hash(seed + i * 91) * 0.6;
      const x = rx * config.farWidth * ring * 0.48;
      const z = rz * config.farDepth * ring * 0.48;

      const s = sampleTerrain(input, EMPTY_LAYOUT, x, z, config, true);
      if (s.masks.shoreline < prop.minShoreline || s.masks.cliff > prop.maxCliff || s.masks.vegetationSuitability < prop.minVegetation) continue;

      dummy.position.set(x, s.height + prop.heightOffset, z);
      dummy.rotation.y = hash(seed + i * 101) * Math.PI * 2;
      const scale = prop.scaleMin + hash(seed + i * 211) * (prop.scaleMax - prop.scaleMin);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(placed, dummy.matrix);
      placed += 1;
    }

    mesh.count = placed;
    group.add(mesh);
  }

  return group;
}

interface BiomeProp {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  minShoreline: number;
  maxCliff: number;
  minVegetation: number;
  heightOffset: number;
  scaleMin: number;
  scaleMax: number;
}

function createBiomeProps(input: CityTerrainInput): BiomeProp[] {
  const rockMaterial = new THREE.MeshStandardMaterial({
    color: input.palettes.cliff.clone().lerp(input.palettes.low, 0.35),
    roughness: 0.9,
    metalness: 0.05 + input.climate.minerality * 0.18,
  });

  const vegetationMaterial = new THREE.MeshStandardMaterial({
    color: input.palettes.accent.clone().lerp(input.palettes.low, 0.32),
    roughness: 0.74,
    metalness: 0.03,
  });

  const iceMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#d9ecf7'),
    roughness: 0.36,
    metalness: 0.08,
  });

  if (input.archetype === 'frozen') {
    return [{
      geometry: new THREE.ConeGeometry(1.1, 4.4, 6),
      material: iceMaterial,
      minShoreline: 0.25,
      maxCliff: 0.94,
      minVegetation: 0,
      heightOffset: 0.2,
      scaleMin: 0.9,
      scaleMax: 2.1,
    }];
  }

  if (input.archetype === 'oceanic') {
    return [{
      geometry: new THREE.CylinderGeometry(0.5, 0.8, 5.6, 5),
      material: vegetationMaterial,
      minShoreline: 0.4,
      maxCliff: 0.7,
      minVegetation: 0.24,
      heightOffset: 0,
      scaleMin: 0.8,
      scaleMax: 1.6,
    }];
  }

  if (input.archetype === 'volcanic') {
    return [{
      geometry: new THREE.DodecahedronGeometry(1.4, 0),
      material: rockMaterial,
      minShoreline: 0.1,
      maxCliff: 0.96,
      minVegetation: 0,
      heightOffset: 0.3,
      scaleMin: 1.0,
      scaleMax: 2.4,
    }];
  }

  return [{
    geometry: new THREE.DodecahedronGeometry(1.2, 0),
    material: rockMaterial,
    minShoreline: 0.2,
    maxCliff: 0.9,
    minVegetation: 0,
    heightOffset: 0.25,
    scaleMin: 0.9,
    scaleMax: 2,
  }];
}

function hash(value: number) {
  const x = Math.sin(value * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}
