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

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / Math.max(0.0001, edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function faceAxes(localUp: THREE.Vector3): { axisA: THREE.Vector3; axisB: THREE.Vector3 } {
  const axisA = new THREE.Vector3(localUp.y, localUp.z, localUp.x);
  const axisB = new THREE.Vector3().crossVectors(localUp, axisA);
  return { axisA, axisB };
}

function computeElevation(point: THREE.Vector3, params: ProceduralPlanetUniforms): number {
  const continentSeed = params.shapeSeed ^ (params.reliefSeed << 1);
  const continent = fbm(point.clone().multiplyScalar(params.simpleFrequency * 0.52), continentSeed, 3);
  const continentMask = smoothstep(0.4, 0.62, continent);
  const oceanBasin = smoothstep(0.14, 0.44, 1 - continent);

  const macro = fbm(
    point.clone().multiplyScalar(params.simpleFrequency * 1.15).addScalar(params.shapeSeed * 0.000041),
    params.shapeSeed,
    4,
  ) * 2 - 1;
  const ridged = ridgedFbm(
    point.clone().multiplyScalar(params.ridgedFrequency * 0.74).addScalar(params.reliefSeed * 0.000037),
    params.reliefSeed,
    4,
  );
  const detail = fbm(point.clone().multiplyScalar(params.ridgedFrequency * 1.22), params.reliefSeed ^ 0x9e3779b9, 2) * 2 - 1;

  const plateauShape = continentMask * 3.1 + macro * 1.15;
  const plateau = clamp(Math.tanh(plateauShape * 0.45) * 0.13 - 0.06, -0.12, 0.16);

  const rawElevation =
    -oceanBasin * (0.07 + params.simpleStrength * 0.16) +
    continentMask * (0.08 + params.simpleStrength * 0.3) +
    macro * params.simpleStrength * 0.14 +
    Math.max(0, ridged - 0.42) * params.ridgedStrength * params.ridgeAttenuation * (0.12 + continentMask * 0.3) +
    detail * params.ridgedStrength * params.detailAttenuation * 0.022 +
    plateau;

  const normalized = clamp((rawElevation + 0.26) / 0.72, 0, 1);
  const smoothed = smoothstep(
    0.08 + (1 - params.terrainSmoothing) * 0.18,
    0.93 - params.terrainSmoothing * 0.08,
    normalized,
  );
  const centered = (smoothed - 0.5) * 2;
  const upwardCap = params.elevationCap;
  const downwardCap = Math.min(0.24, params.elevationCap * 0.75 + 0.03);
  const amplitude = centered >= 0 ? upwardCap : downwardCap;
  const elevation = centered * amplitude;

  return clamp(elevation, -0.24, params.elevationCap);
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

  for (let i = 0; i < elevations.length; i += 1) {
    const elevation = elevations[i];
    const normalized = (elevation - minElevation) / elevationSpan;
    const vx = vertices[i * 3];
    const vy = vertices[i * 3 + 1];
    const vz = vertices[i * 3 + 2];
    const latitude = Math.abs(new THREE.Vector3(vx, vy, vz).normalize().y);

    const color = new THREE.Color();
    const coastalBand = smoothstep(params.oceanLevel - 0.02, params.oceanLevel + 0.05, normalized);
    const mountainBand = smoothstep(params.mountainLevel - 0.04, params.mountainLevel + 0.06, normalized);
    const iceCap = smoothstep(0.72, 0.94, latitude) * smoothstep(params.oceanLevel + 0.1, 0.98, normalized);

    if (normalized <= params.oceanLevel) {
      const t = clamp(normalized / Math.max(0.01, params.oceanLevel), 0, 1);
      color.setRGB(
        lerp(params.baseColor[0], params.shallowWaterColor[0], t),
        lerp(params.baseColor[1], params.shallowWaterColor[1], t),
        lerp(params.baseColor[2], params.shallowWaterColor[2], t),
      );
    } else if (normalized <= params.mountainLevel) {
      const baseT = clamp(
        (normalized - params.oceanLevel) / Math.max(0.01, params.mountainLevel - params.oceanLevel),
        0,
        1,
      );
      const t = clamp(baseT * 0.82 + coastalBand * 0.18, 0, 1);
      color.setRGB(
        lerp(params.landColor[0], params.mountainColor[0], t),
        lerp(params.landColor[1], params.mountainColor[1], t),
        lerp(params.landColor[2], params.mountainColor[2], t),
      );
    } else {
      const t = clamp((normalized - params.mountainLevel) / Math.max(0.01, 1 - params.mountainLevel), 0, 1);
      color.setRGB(
        lerp(params.mountainColor[0], params.iceColor[0], t),
        lerp(params.mountainColor[1], params.iceColor[1], t),
        lerp(params.mountainColor[2], params.iceColor[2], t),
      );
    }

    if (mountainBand > 0.01) {
      color.setRGB(
        lerp(color.r, params.mountainColor[0], mountainBand * 0.2),
        lerp(color.g, params.mountainColor[1], mountainBand * 0.2),
        lerp(color.b, params.mountainColor[2], mountainBand * 0.2),
      );
    }

    if (iceCap > 0.01) {
      color.setRGB(
        lerp(color.r, params.iceColor[0], iceCap * 0.9),
        lerp(color.g, params.iceColor[1], iceCap * 0.9),
        lerp(color.b, params.iceColor[2], iceCap * 0.9),
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
