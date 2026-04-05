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
  const warpedPoint = point
    .clone()
    .add(
      new THREE.Vector3(
        fbm(point.clone().multiplyScalar(params.simpleFrequency * 0.5), continentSeed ^ 0x4f1bbcdc, 3) - 0.5,
        fbm(point.clone().multiplyScalar(params.simpleFrequency * 0.48), continentSeed ^ 0x632be59d, 3) - 0.5,
        fbm(point.clone().multiplyScalar(params.simpleFrequency * 0.52), continentSeed ^ 0x9e3779b9, 3) - 0.5,
      ).multiplyScalar(0.08 + params.maskStrength * 0.04),
    )
    .normalize();

  const macroPrimary = fbm(warpedPoint.clone().multiplyScalar(params.simpleFrequency * 0.34), continentSeed, 5);
  const macroSecondary = fbm(warpedPoint.clone().multiplyScalar(params.simpleFrequency * 0.21), continentSeed ^ 0x45d9f3b, 4);
  const macroTertiary = fbm(warpedPoint.clone().multiplyScalar(params.simpleFrequency * 0.12), continentSeed ^ 0x7f4a7c15, 3);
  const continentSignal = macroPrimary * 0.58 + macroSecondary * 0.28 + macroTertiary * 0.14;
  const continentMask = smoothstep(0.38, 0.64, continentSignal);
  const inlandMask = smoothstep(0.52, 0.82, continentSignal);

  const midRelief = fbm(
    warpedPoint.clone().multiplyScalar(params.simpleFrequency * 1.34).addScalar(params.shapeSeed * 0.000041),
    params.shapeSeed,
    6,
  ) * 2 - 1;
  const ridgeRelief = ridgedFbm(
    warpedPoint.clone().multiplyScalar(params.ridgedFrequency * 0.84).addScalar(params.reliefSeed * 0.000037),
    params.reliefSeed,
    6,
  );
  const microRelief = fbm(
    warpedPoint
      .clone()
      .multiplyScalar(params.ridgedFrequency * 2.6)
      .addScalar((params.shapeSeed ^ params.reliefSeed) * 0.000011),
    params.reliefSeed ^ 0x9e3779b9,
    4,
  ) * 2 - 1;
  const mountainMask = smoothstep(0.56, 0.9, ridgeRelief) * inlandMask;

  const oceanFloor = (1 - continentMask) * (0.045 + params.simpleStrength * 0.08);
  const continentBase = continentMask * (0.06 + params.simpleStrength * 0.2);
  const uplands = inlandMask * Math.max(0, continentSignal - 0.48) * params.simpleStrength * 0.14;
  const midLayer =
    Math.max(0, ridgeRelief - 0.44) *
    params.ridgedStrength *
    params.ridgeAttenuation *
    (0.08 + continentMask * 0.25);
  const microLayer = microRelief * params.ridgedStrength * params.detailAttenuation * (0.004 + mountainMask * 0.005);
  const plateau = Math.max(0, midRelief) * inlandMask * 0.05;
  const mountainLift = mountainMask * params.ridgedStrength * params.ridgeAttenuation * 0.1;

  const rawElevation = -oceanFloor + continentBase + uplands + midLayer + microLayer + plateau + mountainLift;
  const normalized = clamp((rawElevation + 0.12) / 0.34, 0, 1);
  const smoothed = smoothstep(
    0.06 + (1 - params.terrainSmoothing) * 0.15,
    0.95 - params.terrainSmoothing * 0.06,
    normalized,
  );
  const centered = (smoothed - 0.5) * 2;
  const upwardCap = params.elevationCap;
  const downwardCap = Math.min(0.12, params.elevationCap * 0.42 + 0.02);
  const amplitude = centered >= 0 ? upwardCap : downwardCap;
  const elevation = centered * amplitude;

  return clamp(elevation, -0.12, params.elevationCap);
}

function applyMicroNormalDetail(geometry: THREE.BufferGeometry, params: ProceduralPlanetUniforms): void {
  const normal = geometry.getAttribute('normal');
  const position = geometry.getAttribute('position');
  if (!normal || !position) return;

  const sample = new THREE.Vector3();
  for (let i = 0; i < normal.count; i += 1) {
    sample.fromBufferAttribute(position, i).normalize();
    const grain = fbm(
      sample.clone().multiplyScalar(params.ridgedFrequency * 3.1).addScalar(params.reliefSeed * 0.000013),
      params.reliefSeed ^ 0x7f4a7c15,
      2,
    );
    const jitter = (grain - 0.5) * params.detailAttenuation * 0.018;
    normal.setXYZ(i, normal.getX(i) + jitter, normal.getY(i) + jitter * 0.7, normal.getZ(i) + jitter);
  }

  normal.needsUpdate = true;
  geometry.normalizeNormals();
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
  const categoryColorConfig = {
    ocean: { coastBoost: 0.22, mountainBoost: 0.16, iceBoost: 0.45, landToMountain: 0.45 },
    desert: { coastBoost: 0.06, mountainBoost: 0.2, iceBoost: 0.2, landToMountain: 0.58 },
    ice: { coastBoost: 0.08, mountainBoost: 0.2, iceBoost: 0.96, landToMountain: 0.48 },
    volcanic: { coastBoost: 0.04, mountainBoost: 0.28, iceBoost: 0.14, landToMountain: 0.66 },
    lush: { coastBoost: 0.18, mountainBoost: 0.18, iceBoost: 0.38, landToMountain: 0.5 },
    mineral: { coastBoost: 0.08, mountainBoost: 0.24, iceBoost: 0.25, landToMountain: 0.62 },
  }[params.surfaceCategory];

  for (let i = 0; i < elevations.length; i += 1) {
    const elevation = elevations[i];
    const normalized = (elevation - minElevation) / elevationSpan;
    const vx = vertices[i * 3];
    const vy = vertices[i * 3 + 1];
    const vz = vertices[i * 3 + 2];
    const latitude = Math.abs(new THREE.Vector3(vx, vy, vz).normalize().y);

    const color = new THREE.Color();
    const point = new THREE.Vector3(vx, vy, vz).normalize();
    const macroBiome = fbm(
      point.clone().multiplyScalar(params.simpleFrequency * 0.7).addScalar(params.shapeSeed * 0.000021),
      params.shapeSeed ^ 0x6c8e9cf5,
      4,
    );
    const microBiome = fbm(
      point.clone().multiplyScalar(params.ridgedFrequency * 1.15).addScalar(params.reliefSeed * 0.000014),
      params.reliefSeed ^ 0x2c1b3c6d,
      3,
    );
    const biomeSignal = clamp(macroBiome * 0.72 + microBiome * 0.28, 0, 1);

    const deepOceanBand = smoothstep(0, params.oceanLevel * 0.6, normalized);
    const shallowBand = smoothstep(params.oceanLevel * 0.68, params.oceanLevel + 0.02, normalized);
    const coastalBand = smoothstep(params.oceanLevel - 0.015, params.oceanLevel + 0.04, normalized);
    const plainsBand = smoothstep(params.oceanLevel + 0.01, params.mountainLevel - 0.22, normalized);
    const highlandBand = smoothstep(params.mountainLevel - 0.2, params.mountainLevel - 0.03, normalized);
    const mountainBand = smoothstep(params.mountainLevel - 0.03, params.mountainLevel + 0.08, normalized);
    const iceCap =
      smoothstep(0.72, 0.96, latitude) *
      smoothstep(params.oceanLevel + 0.08, 0.98, normalized) *
      (0.75 + biomeSignal * 0.25);

    if (normalized <= params.oceanLevel) {
      const t = clamp(normalized / Math.max(0.01, params.oceanLevel), 0, 1);
      const depthTint = clamp(1 - deepOceanBand * 0.22, 0.75, 1);
      color.setRGB(
        lerp(params.baseColor[0], params.shallowWaterColor[0], shallowBand * t) * depthTint,
        lerp(params.baseColor[1], params.shallowWaterColor[1], shallowBand * t) * depthTint,
        lerp(params.baseColor[2], params.shallowWaterColor[2], shallowBand * t) * depthTint,
      );
    } else if (normalized <= params.mountainLevel) {
      const baseT = clamp(
        (normalized - params.oceanLevel) / Math.max(0.01, params.mountainLevel - params.oceanLevel),
        0,
        1,
      );
      const lushVariation = (biomeSignal - 0.5) * 0.12;
      const t = clamp(baseT * categoryColorConfig.landToMountain + highlandBand * 0.24, 0, 1);
      color.setRGB(
        clamp(lerp(params.landColor[0], params.mountainColor[0], t) + lushVariation * plainsBand, 0, 1),
        clamp(lerp(params.landColor[1], params.mountainColor[1], t) + lushVariation * plainsBand * 1.2, 0, 1),
        clamp(lerp(params.landColor[2], params.mountainColor[2], t) - lushVariation * plainsBand * 0.8, 0, 1),
      );
    } else {
      const t = clamp((normalized - params.mountainLevel) / Math.max(0.01, 1 - params.mountainLevel), 0, 1);
      color.setRGB(
        lerp(params.mountainColor[0], params.iceColor[0], t),
        lerp(params.mountainColor[1], params.iceColor[1], t),
        lerp(params.mountainColor[2], params.iceColor[2], t),
      );
    }

    if (coastalBand > 0.02) {
      color.setRGB(
        lerp(color.r, params.shallowWaterColor[0], coastalBand * categoryColorConfig.coastBoost * 1.15),
        lerp(color.g, params.shallowWaterColor[1], coastalBand * categoryColorConfig.coastBoost * 1.15),
        lerp(color.b, params.shallowWaterColor[2], coastalBand * categoryColorConfig.coastBoost * 1.15),
      );
    }

    if (mountainBand > 0.01) {
      color.setRGB(
        lerp(color.r, params.mountainColor[0], mountainBand * categoryColorConfig.mountainBoost),
        lerp(color.g, params.mountainColor[1], mountainBand * categoryColorConfig.mountainBoost),
        lerp(color.b, params.mountainColor[2], mountainBand * categoryColorConfig.mountainBoost),
      );
    }

    if (iceCap > 0.01) {
      color.setRGB(
        lerp(color.r, params.iceColor[0], iceCap * categoryColorConfig.iceBoost),
        lerp(color.g, params.iceColor[1], iceCap * categoryColorConfig.iceBoost),
        lerp(color.b, params.iceColor[2], iceCap * categoryColorConfig.iceBoost),
      );
    }

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
