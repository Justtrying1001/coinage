import * as THREE from 'three';

import type { PlanetFamily, PlanetSurfaceModel } from '@/domain/world/planet-visual.types';
import { sampleTerrainFields } from './terrain-fields';

export const OCEAN_FAMILIES: ReadonlyArray<PlanetFamily> = ['terrestrial-lush', 'oceanic', 'toxic-alien'];

export interface DisplacedSphereInput {
  radius: number;
  segments: number;
  seed: number;
  moistureSeed: number;
  thermalSeed: number;
  oceanLevel: number;
  reliefAmplitude: number;
  bandingStrength: number;
  family: PlanetFamily;
  surfaceModel: PlanetSurfaceModel;
}

const FACE_DIRS: Array<THREE.Vector3> = [
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(-1, 0, 0),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, -1, 0),
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(0, 0, -1),
];

function buildFaceBasis(localUp: THREE.Vector3): { axisA: THREE.Vector3; axisB: THREE.Vector3 } {
  const axisA = new THREE.Vector3(localUp.y, localUp.z, localUp.x);
  const axisB = new THREE.Vector3().crossVectors(localUp, axisA);
  return { axisA, axisB };
}

function pushTri(indices: number[], a: number, b: number, c: number): void {
  indices.push(a, b, c);
}

export function buildDisplacedSphereGeometry(input: DisplacedSphereInput): THREE.BufferGeometry {
  const resolution = Math.max(16, Math.floor(input.segments / 2));

  const positions: number[] = [];
  const indices: number[] = [];

  const elevation: number[] = [];
  const waterMask: number[] = [];
  const slopeMask: number[] = [];
  const humidity: number[] = [];
  const temperature: number[] = [];
  const thermal: number[] = [];
  const rockMask: number[] = [];
  const sedimentMask: number[] = [];
  const snowMask: number[] = [];
  const lavaMask: number[] = [];

  let vertexOffset = 0;

  for (const localUp of FACE_DIRS) {
    const { axisA, axisB } = buildFaceBasis(localUp);

    for (let y = 0; y < resolution; y += 1) {
      for (let x = 0; x < resolution; x += 1) {
        const px = x / (resolution - 1);
        const py = y / (resolution - 1);

        const pointOnCube = new THREE.Vector3()
          .copy(localUp)
          .addScaledVector(axisA, (px - 0.5) * 2)
          .addScaledVector(axisB, (py - 0.5) * 2);

        const pointOnUnitSphere = pointOnCube.normalize();

        const fields = sampleTerrainFields({
          x: pointOnUnitSphere.x,
          y: pointOnUnitSphere.y,
          z: pointOnUnitSphere.z,
          seed: input.seed,
          moistureSeed: input.moistureSeed,
          thermalSeed: input.thermalSeed,
          oceanLevel: input.oceanLevel,
          family: input.family,
          surfaceModel: input.surfaceModel,
        });

        const maxAmplitude = input.surfaceModel === 'gaseous' ? input.radius * 0.028 : input.radius * 0.18;
        const displacedRadius = input.radius + fields.elevation * maxAmplitude * input.reliefAmplitude;

        positions.push(
          pointOnUnitSphere.x * displacedRadius,
          pointOnUnitSphere.y * displacedRadius,
          pointOnUnitSphere.z * displacedRadius,
        );

        elevation.push(fields.elevation);
        waterMask.push(fields.waterMask);
        slopeMask.push(fields.slope);
        humidity.push(fields.humidity);
        temperature.push(fields.temperature);
        thermal.push(fields.thermal);
        rockMask.push(fields.rockMask);
        sedimentMask.push(fields.sedimentMask);
        snowMask.push(fields.snowMask);
        lavaMask.push(fields.lavaMask);
      }
    }

    for (let y = 0; y < resolution - 1; y += 1) {
      for (let x = 0; x < resolution - 1; x += 1) {
        const i = vertexOffset + x + y * resolution;
        pushTri(indices, i, i + 1, i + resolution + 1);
        pushTri(indices, i, i + resolution + 1, i + resolution);
      }
    }

    vertexOffset += resolution * resolution;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  geometry.setAttribute('aElevation', new THREE.Float32BufferAttribute(elevation, 1));
  geometry.setAttribute('aWaterMask', new THREE.Float32BufferAttribute(waterMask, 1));
  geometry.setAttribute('aSlopeMask', new THREE.Float32BufferAttribute(slopeMask, 1));
  geometry.setAttribute('aHumidityMask', new THREE.Float32BufferAttribute(humidity, 1));
  geometry.setAttribute('aTemperatureMask', new THREE.Float32BufferAttribute(temperature, 1));
  geometry.setAttribute('aThermalMask', new THREE.Float32BufferAttribute(thermal, 1));
  geometry.setAttribute('aRockMask', new THREE.Float32BufferAttribute(rockMask, 1));
  geometry.setAttribute('aSedimentMask', new THREE.Float32BufferAttribute(sedimentMask, 1));
  geometry.setAttribute('aSnowMask', new THREE.Float32BufferAttribute(snowMask, 1));
  geometry.setAttribute('aLavaMask', new THREE.Float32BufferAttribute(lavaMask, 1));

  return geometry;
}
