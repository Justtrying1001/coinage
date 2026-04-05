import * as THREE from 'three';

import type { ProceduralPlanetUniforms } from '../types';
import { fbm, ridgedFbm } from './noise';

const FACE_DIRECTIONS = [
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, -1, 0),
  new THREE.Vector3(-1, 0, 0),
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(0, 0, -1),
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function faceAxes(localUp: THREE.Vector3): { axisA: THREE.Vector3; axisB: THREE.Vector3 } {
  const axisA = new THREE.Vector3(localUp.y, localUp.z, localUp.x);
  const axisB = new THREE.Vector3().crossVectors(localUp, axisA);
  return { axisA, axisB };
}

function computeElevation(point: THREE.Vector3, params: ProceduralPlanetUniforms): number {
  const simplePoint = point.clone().multiplyScalar(params.simpleFrequency).addScalar(params.shapeSeed * 0.000041);
  const ridgedPoint = point.clone().multiplyScalar(params.ridgedFrequency).addScalar(params.reliefSeed * 0.000037);

  const simple = fbm(simplePoint, params.shapeSeed, 5) * 2 - 1;
  const ridged = ridgedFbm(ridgedPoint, params.reliefSeed, 5);

  const maskBase = fbm(point.clone().multiplyScalar(params.simpleFrequency * 0.7), params.shapeSeed ^ params.reliefSeed, 3);
  const mask = clamp((maskBase - 0.38) * 2.1, 0, 1);

  const elevation =
    simple * params.simpleStrength * 0.35 +
    Math.max(0, ridged - 0.26) * params.ridgedStrength * (0.25 + mask * params.maskStrength);

  return clamp(elevation, -0.24, 0.55);
}

export function createCubeSphereTerrain(params: ProceduralPlanetUniforms): THREE.BufferGeometry {
  const resolution = params.meshResolution;
  const vertices: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const elevations: number[] = [];

  for (let faceIndex = 0; faceIndex < FACE_DIRECTIONS.length; faceIndex += 1) {
    const localUp = FACE_DIRECTIONS[faceIndex];
    const { axisA, axisB } = faceAxes(localUp);
    const vertexOffset = vertices.length / 3;

    for (let y = 0; y < resolution; y += 1) {
      for (let x = 0; x < resolution; x += 1) {
        const px = x / (resolution - 1);
        const py = y / (resolution - 1);

        const pointOnCube = new THREE.Vector3()
          .copy(localUp)
          .addScaledVector(axisA, (px - 0.5) * 2)
          .addScaledVector(axisB, (py - 0.5) * 2);

        const pointOnSphere = pointOnCube.normalize();
        const elevation = computeElevation(pointOnSphere, params);
        const radius = params.radius * (1 + elevation);
        const displaced = pointOnSphere.clone().multiplyScalar(radius);

        vertices.push(displaced.x, displaced.y, displaced.z);
        elevations.push(elevation);
      }
    }

    for (let y = 0; y < resolution - 1; y += 1) {
      for (let x = 0; x < resolution - 1; x += 1) {
        const i = vertexOffset + x + y * resolution;
        indices.push(i, i + 1, i + resolution + 1);
        indices.push(i, i + resolution + 1, i + resolution);
      }
    }
  }

  let minElevation = Number.POSITIVE_INFINITY;
  let maxElevation = Number.NEGATIVE_INFINITY;
  for (const elevation of elevations) {
    minElevation = Math.min(minElevation, elevation);
    maxElevation = Math.max(maxElevation, elevation);
  }

  const elevationSpan = Math.max(0.0001, maxElevation - minElevation);

  for (const elevation of elevations) {
    const normalized = (elevation - minElevation) / elevationSpan;

    const color = new THREE.Color();

    if (normalized <= params.oceanLevel) {
      const t = clamp(normalized / Math.max(0.01, params.oceanLevel), 0, 1);
      color.setRGB(
        params.baseColor[0] + (params.shallowWaterColor[0] - params.baseColor[0]) * t,
        params.baseColor[1] + (params.shallowWaterColor[1] - params.baseColor[1]) * t,
        params.baseColor[2] + (params.shallowWaterColor[2] - params.baseColor[2]) * t,
      );
    } else if (normalized <= params.mountainLevel) {
      const t = clamp(
        (normalized - params.oceanLevel) / Math.max(0.01, params.mountainLevel - params.oceanLevel),
        0,
        1,
      );
      color.setRGB(
        params.landColor[0] + (params.mountainColor[0] - params.landColor[0]) * t,
        params.landColor[1] + (params.mountainColor[1] - params.landColor[1]) * t,
        params.landColor[2] + (params.mountainColor[2] - params.landColor[2]) * t,
      );
    } else {
      const t = clamp((normalized - params.mountainLevel) / Math.max(0.01, 1 - params.mountainLevel), 0, 1);
      color.setRGB(
        params.mountainColor[0] + (params.iceColor[0] - params.mountainColor[0]) * t,
        params.mountainColor[1] + (params.iceColor[1] - params.mountainColor[1]) * t,
        params.mountainColor[2] + (params.iceColor[2] - params.mountainColor[2]) * t,
      );
    }

    colors.push(color.r, color.g, color.b);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  return geometry;
}
