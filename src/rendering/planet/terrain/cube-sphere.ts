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
  const macroPrimary = fbm(point.clone().multiplyScalar(params.simpleFrequency * 0.36), continentSeed, 5);
  const macroSecondary = fbm(point.clone().multiplyScalar(params.simpleFrequency * 0.22), continentSeed ^ 0x45d9f3b, 4);
  const continentSignal = macroPrimary * 0.72 + macroSecondary * 0.28;
  const continentMask = smoothstep(0.42, 0.62, continentSignal);
  const inlandMask = smoothstep(0.56, 0.84, continentSignal);

  const midRelief = fbm(
    point.clone().multiplyScalar(params.simpleFrequency * 1.26).addScalar(params.shapeSeed * 0.000041),
    params.shapeSeed,
    5,
  ) * 2 - 1;
  const ridgeRelief = ridgedFbm(
    point.clone().multiplyScalar(params.ridgedFrequency * 0.82).addScalar(params.reliefSeed * 0.000037),
    params.reliefSeed,
    5,
  );
  const microRelief = fbm(
    point.clone().multiplyScalar(params.ridgedFrequency * 2.35).addScalar((params.shapeSeed ^ params.reliefSeed) * 0.000011),
    params.reliefSeed ^ 0x9e3779b9,
    3,
  ) * 2 - 1;

  const oceanFloor = -smoothstep(0.14, 0.52, 1 - continentSignal) * (0.055 + params.simpleStrength * 0.09);
  const continentBase = continentMask * (0.052 + params.simpleStrength * 0.17);
  const uplands = inlandMask * Math.max(0, ridgeRelief - 0.28) * params.ridgedStrength * params.ridgeAttenuation * 0.2;
  const midLayer = midRelief * params.simpleStrength * (0.028 + inlandMask * 0.038);
  const microLayer = microRelief * params.ridgedStrength * params.detailAttenuation * (0.006 + inlandMask * 0.008);

  const rawElevation = oceanFloor + continentBase + uplands + midLayer + microLayer;
  const normalized = clamp((rawElevation + 0.16) / 0.42, 0, 1);
  const smoothed = smoothstep(
    0.08 + (1 - params.terrainSmoothing) * 0.18,
    0.93 - params.terrainSmoothing * 0.08,
    normalized,
  );
  const centered = (smoothed - 0.5) * 2;
  const upwardCap = Math.min(params.elevationCap * 0.78 + 0.018, 0.22);
  const downwardCap = Math.min(0.1, params.elevationCap * 0.42 + 0.015);
  const amplitude = centered >= 0 ? upwardCap : downwardCap;
  const elevation = centered * amplitude;

  return clamp(elevation, -0.1, 0.22);
}

function applyMicroNormalDetail(geometry: THREE.BufferGeometry, params: ProceduralPlanetUniforms): void {
  const positionAttr = geometry.getAttribute('position');
  const normalAttr = geometry.getAttribute('normal');

  if (!(positionAttr instanceof THREE.BufferAttribute) || !(normalAttr instanceof THREE.BufferAttribute)) {
    return;
  }

  const baseAxis = new THREE.Vector3(0, 1, 0);
  const point = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const bitangent = new THREE.Vector3();
  const perturbed = new THREE.Vector3();
  const blend = clamp(0.07 + params.detailAttenuation * 0.18, 0.07, 0.2);

  for (let i = 0; i < normalAttr.count; i += 1) {
    point.set(positionAttr.getX(i), positionAttr.getY(i), positionAttr.getZ(i)).normalize();
    normal.set(normalAttr.getX(i), normalAttr.getY(i), normalAttr.getZ(i)).normalize();

    tangent.crossVectors(baseAxis, point);
    if (tangent.lengthSq() < 0.00001) {
      tangent.set(1, 0, 0);
    } else {
      tangent.normalize();
    }
    bitangent.crossVectors(point, tangent).normalize();

    const microA = fbm(point.clone().multiplyScalar(params.ridgedFrequency * 3.8), params.reliefSeed ^ 0x5bd1e995, 2) * 2 - 1;
    const microB = fbm(point.clone().multiplyScalar(params.ridgedFrequency * 5.6), params.shapeSeed ^ 0x27d4eb2d, 2) * 2 - 1;
    const slope = (microA * 0.64 + microB * 0.36) * blend;
    const twist = (microB - microA) * (blend * 0.42);

    perturbed
      .copy(normal)
      .addScaledVector(tangent, slope)
      .addScaledVector(bitangent, twist)
      .normalize();

    normalAttr.setXYZ(i, perturbed.x, perturbed.y, perturbed.z);
  }

  normalAttr.needsUpdate = true;
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
    const beachBand = smoothstep(params.oceanLevel - 0.018, params.oceanLevel + 0.022, normalized);
    const shorelineBand = smoothstep(params.oceanLevel - 0.01, params.oceanLevel + 0.012, normalized)
      - smoothstep(params.oceanLevel + 0.012, params.oceanLevel + 0.034, normalized);
    const highlandMask = smoothstep(params.mountainLevel - 0.12, params.mountainLevel - 0.02, normalized);
    const mountainMask = smoothstep(params.mountainLevel - 0.02, params.mountainLevel + 0.08, normalized);
    const iceCap = smoothstep(0.74, 0.95, latitude) * smoothstep(params.mountainLevel - 0.04, 1, normalized);

    const oceanDepthT = clamp(normalized / Math.max(0.01, params.oceanLevel + 0.01), 0, 1);
    const lowLandT = clamp((normalized - params.oceanLevel) / Math.max(0.02, params.mountainLevel - params.oceanLevel), 0, 1);
    const deepWater = new THREE.Color().setRGB(params.baseColor[0], params.baseColor[1], params.baseColor[2]);
    const shallowWater = new THREE.Color().setRGB(params.shallowWaterColor[0], params.shallowWaterColor[1], params.shallowWaterColor[2]);
    const plains = new THREE.Color().setRGB(
      lerp(params.landColor[0], params.mountainColor[0], 0.18),
      lerp(params.landColor[1], params.mountainColor[1], 0.12),
      lerp(params.landColor[2], params.mountainColor[2], 0.08),
    );

    color.copy(deepWater).lerp(shallowWater, clamp(oceanDepthT * 1.06, 0, 1));
    color.lerp(plains, beachBand);
    color.lerp(
      new THREE.Color(params.landColor[0], params.landColor[1], params.landColor[2]),
      smoothstep(params.oceanLevel + 0.01, params.oceanLevel + 0.1, normalized),
    );
    color.lerp(
      new THREE.Color(params.mountainColor[0], params.mountainColor[1], params.mountainColor[2]),
      clamp(highlandMask * 0.7 + mountainMask * 0.6, 0, 1),
    );
    color.lerp(
      new THREE.Color(params.iceColor[0], params.iceColor[1], params.iceColor[2]),
      clamp(iceCap * 0.92 + mountainMask * 0.08, 0, 1),
    );

    const coastAccent = shorelineBand * (0.05 + lowLandT * 0.03);
    color.setRGB(
      clamp(color.r + coastAccent * 0.65, 0, 1),
      clamp(color.g + coastAccent * 0.54, 0, 1),
      clamp(color.b + coastAccent * 0.44, 0, 1),
    );

    colors.push(color.r, color.g, color.b);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  applyMicroNormalDetail(geometry, params);

  return geometry;
}
