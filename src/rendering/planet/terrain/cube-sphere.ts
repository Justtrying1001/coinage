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

function smoothLerp(a: number, b: number, t: number): number {
  const s = smoothstep(0, 1, t);
  return lerp(a, b, s);
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / Math.max(0.0001, edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function quantile(sortedValues: number[], ratio: number): number {
  if (sortedValues.length === 0) {
    return 0;
  }
  const clamped = clamp(ratio, 0, 1);
  const index = Math.floor((sortedValues.length - 1) * clamped);
  return sortedValues[Math.max(0, Math.min(sortedValues.length - 1, index))]!;
}

export interface TerrainHydrologyResolution {
  effectiveOceanLevel: number;
  mountainLevel: number;
  visualLandRatio: number;
  strictLandRatio: number;
}

export function resolveTerrainHydrology(
  normalizedElevations: number[],
  params: ProceduralPlanetUniforms,
): TerrainHydrologyResolution {
  const sortedElevations = [...normalizedElevations].sort((a, b) => a - b);
  const targetLandRatio = clamp(params.minLandRatio, 0.42, 0.9);
  const maxOceanCoverage = clamp(1 - targetLandRatio, 0.12, 0.56);
  const visualLandBuffer = 0.035;

  const oceanQuantileCap = quantile(sortedElevations, maxOceanCoverage) - 0.002;
  const strictLandQuantileCap = quantile(sortedElevations, clamp(1 - (targetLandRatio + visualLandBuffer), 0.06, 0.52)) - 0.003;
  const maxAllowedOcean = Math.min(
    params.mountainLevel - 0.19,
    oceanQuantileCap,
    strictLandQuantileCap,
  );
  let effectiveOceanLevel = clamp(Math.min(params.oceanLevel, maxAllowedOcean), 0.005, 0.58);
  let strictLandCount = 0;
  let visualLandCount = 0;
  const total = Math.max(1, normalizedElevations.length);
  const recomputeCoverage = () => {
    strictLandCount = 0;
    visualLandCount = 0;
    for (const normalized of normalizedElevations) {
      if (normalized > effectiveOceanLevel) {
        strictLandCount += 1;
      }
      if (normalized > effectiveOceanLevel + visualLandBuffer) {
        visualLandCount += 1;
      }
    }
  };

  recomputeCoverage();
  for (let pass = 0; pass < 6 && strictLandCount / total + 0.002 < targetLandRatio; pass += 1) {
    const tightenedOceanCoverage = clamp(1 - targetLandRatio - (pass + 1) * 0.02, 0.06, 0.5);
    const tightenedQuantileCap = quantile(sortedElevations, tightenedOceanCoverage) - (0.006 + pass * 0.002);
    effectiveOceanLevel = clamp(Math.min(effectiveOceanLevel, tightenedQuantileCap), 0.005, 0.58);
    recomputeCoverage();
  }
  if (strictLandCount / total + 0.001 < targetLandRatio) {
    const strictTargetCap = quantile(sortedElevations, clamp(1 - targetLandRatio, 0.04, 0.5)) - 0.005;
    effectiveOceanLevel = clamp(Math.min(effectiveOceanLevel, strictTargetCap), 0.005, 0.58);
    recomputeCoverage();
  }

  const mountainLevel = clamp(Math.max(params.mountainLevel, effectiveOceanLevel + 0.17), 0.58, 0.94);
  return {
    effectiveOceanLevel,
    mountainLevel,
    strictLandRatio: strictLandCount / total,
    visualLandRatio: visualLandCount / total,
  };
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
  const continentSigned =
    (continentSignal - params.continentThreshold) / Math.max(0.06, params.continentSharpness * 1.9);
  const continentMaskBase = smoothstep(-1.25, 1.25, continentSigned);
  const tectonicPlateSignal = macroSecondary * 0.55 + macroTertiary * 0.45;
  const tectonicBackbone = smoothstep(
    params.continentThreshold - 0.16,
    params.continentThreshold + 0.14,
    tectonicPlateSignal,
  );
  const continentMask = clamp(
    continentMaskBase * (0.78 + params.maskStrength * 0.08) +
      tectonicBackbone * (0.24 + (1 - params.continentDrift) * 0.18),
    0,
    1,
  );
  const inlandMask = smoothstep(
    0.18,
    1.35,
    continentSigned + (tectonicBackbone - 0.5) * 0.65,
  );
  const continentalGradient = smoothstep(-0.7, 0.95, continentSigned);
  const shorelineProximity = 1 - smoothstep(0.06, 0.88, Math.abs(continentSigned));
  const coastBreakupSignal = fbm(
    warpedPoint.clone().multiplyScalar(params.simpleFrequency * (2.2 + params.continentDrift * 1.2)),
    continentSeed ^ 0x3f6a2c17,
    3,
  );
  const coastNoise = (coastBreakupSignal - 0.5) * (0.06 + params.continentDrift * 0.07) * (0.3 + shorelineProximity * 0.7);

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
  const mesoRidgeSignal = ridgedFbm(
    warpedPoint.clone().multiplyScalar(params.ridgedFrequency * (0.54 + params.continentDrift * 0.22)),
    params.reliefSeed ^ 0x5a6d39ef,
    5,
  );
  const mesoHillSignal = fbm(
    warpedPoint.clone().multiplyScalar(params.simpleFrequency * (0.96 + params.continentDrift * 0.45)),
    params.shapeSeed ^ 0x3ab2471d,
    4,
  ) * 2 - 1;
  const craterNoise = ridgedFbm(
    warpedPoint.clone().multiplyScalar(params.ridgedFrequency * (1.3 + params.craterStrength * 0.8)),
    params.reliefSeed ^ 0x2d2816fe,
    4,
  );
  const craterMask = smoothstep(0.7 - params.craterStrength * 0.18, 0.95, craterNoise) * (0.55 + inlandMask * 0.45);

  const trenchSignal = fbm(
    warpedPoint.clone().multiplyScalar(params.simpleFrequency * (1.16 + params.continentDrift * 0.8)).addScalar(params.shapeSeed * 0.000019),
    params.shapeSeed ^ 0x51f2b3d,
    4,
  );
  const archipelagoSignal = fbm(
    warpedPoint.clone().multiplyScalar(params.simpleFrequency * (0.86 + params.continentDrift * 0.9)).addScalar(params.reliefSeed * 0.000023),
    params.reliefSeed ^ 0x7ac4f39,
    3,
  );
  const driftedFragmentation = smoothstep(0.58 - params.continentDrift * 0.2, 0.82, archipelagoSignal);
  const landDemand = clamp((params.minLandRatio - 0.5) * 1.8, 0, 0.62);

  const oceanFloor =
    (1 - continentalGradient) *
    (0.042 + params.simpleStrength * (0.072 - landDemand * 0.03) + trenchSignal * params.trenchDepth * (0.16 - landDemand * 0.045));
  const continentBase =
    continentalGradient *
    (0.058 + params.simpleStrength * (0.2 + landDemand * 0.15) + coastNoise * 0.7 + shorelineProximity * 0.015);
  const uplands =
    inlandMask *
    Math.max(0, continentSignal - (0.48 - landDemand * 0.08)) *
    params.simpleStrength *
    (0.14 + params.continentDrift * 0.07 + landDemand * 0.05);
  const lowHills =
    inlandMask *
    Math.max(0, mesoHillSignal + 0.18) *
    params.simpleStrength *
    (0.042 + (1 - params.terrainSmoothing) * 0.045);
  const basinPlains =
    inlandMask *
    (1 - mountainMask) *
    (1 - smoothstep(0.2, 0.86, Math.abs(mesoHillSignal))) *
    params.simpleStrength *
    (0.015 + params.terrainSmoothing * 0.03);
  const mesoRidges =
    Math.max(0, mesoRidgeSignal - 0.34) *
    params.ridgedStrength *
    (0.045 + params.ridgeAttenuation * 0.08) *
    (0.4 + inlandMask * 0.6);
  const plateauSteps =
    smoothstep(0.46, 0.84, mesoRidgeSignal) *
    inlandMask *
    params.simpleStrength *
    (0.016 + params.continentDrift * 0.03);
  const midLayer =
    Math.max(0, ridgeRelief - 0.44) *
    params.ridgedStrength *
    params.ridgeAttenuation *
    (0.08 + continentMask * 0.25);
  const microLayer = microRelief * params.ridgedStrength * params.detailAttenuation * (0.004 + mountainMask * 0.005);
  const plateau = Math.max(0, midRelief) * inlandMask * (0.04 + params.continentDrift * 0.04);
  const mountainLift = mountainMask * params.ridgedStrength * params.ridgeAttenuation * 0.1;
  const fragmentedIslands =
    driftedFragmentation *
    (1 - inlandMask) *
    params.simpleStrength *
    params.continentDrift *
    (0.09 + landDemand * 0.08);
  const shorelineShelf =
    Math.max(0, shorelineProximity) *
    (0.014 + params.trenchDepth * 0.046 + coastNoise * 0.32) *
    (0.45 + (1 - inlandMask) * 0.55);
  const craterDepth = craterMask * params.craterStrength * (0.014 + params.terrainSmoothing * 0.014);
  const tectonicBand = Math.sin((warpedPoint.y + warpedPoint.x * 0.35) * (params.bandingFrequency * 1.7)) * 0.5 + 0.5;
  const thermalUplift =
    params.thermalActivity *
    Math.max(0, tectonicBand - 0.55) *
    (0.015 + params.ridgedStrength * 0.025) *
    inlandMask;
  const hydrologyLift = (0.024 + landDemand * 0.09) * (0.42 + continentalGradient * 0.58);

  const rawElevation =
    -oceanFloor +
    continentBase +
    uplands +
    lowHills -
    basinPlains +
    mesoRidges +
    plateauSteps +
    midLayer +
    microLayer +
    plateau +
    mountainLift +
    fragmentedIslands +
    hydrologyLift -
    shorelineShelf -
    craterDepth +
    thermalUplift;
  const normalized = clamp((rawElevation + 0.125) / 0.345, 0, 1);
  const smoothed = smoothstep(
    0.06 + (1 - params.terrainSmoothing) * 0.15,
    0.95 - params.terrainSmoothing * 0.06,
    normalized,
  );
  const centered = (smoothed - 0.5) * 2;
  const upwardCap = params.elevationCap;
  const downwardCap = Math.min(0.14, params.elevationCap * 0.36 + 0.018 + params.trenchDepth * 0.06);
  const amplitude = centered >= 0 ? upwardCap : downwardCap;
  const elevation = centered * amplitude;

  const oceanFloorClamp = -Math.max(0.16, params.elevationCap * 0.72);
  return clamp(elevation, oceanFloorClamp, params.elevationCap);
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
  const { indices, positions, colors, terrain } = generateCubeSphereTerrainBuffers(params);
  return createCubeSphereGeometryFromBuffers(params, { indices, positions, colors, terrain });
}

export function createCubeSphereGeometryFromBuffers(
  params: ProceduralPlanetUniforms,
  buffers: GeneratedCubeSphereTerrainBuffers,
): THREE.BufferGeometry {
  const { indices, positions, colors, terrain } = buffers;
  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('terrain', new THREE.BufferAttribute(terrain, 4));
  geometry.computeVertexNormals();
  applyMicroNormalDetail(geometry, params);

  return geometry;
}

export interface GeneratedCubeSphereTerrainBuffers {
  indices: Uint32Array;
  positions: Float32Array;
  colors: Float32Array;
  terrain: Float32Array;
}

/**
 * Pure terrain-data generation step intended for eventual off-main-thread workerization.
 * This function performs no WebGL or scene graph work and returns transferable typed arrays.
 */
export function generateCubeSphereTerrainBuffers(
  params: ProceduralPlanetUniforms,
): GeneratedCubeSphereTerrainBuffers {
  const resolution = params.meshResolution;
  const faceVertexCount = resolution * resolution;
  const vertices: number[] = [];
  const colors: number[] = [];
  const terrain: number[] = [];
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

  const slopeByVertex: number[] = new Array(elevations.length).fill(0);
  for (let faceIndex = 0; faceIndex < FACE_DIRECTIONS.length; faceIndex += 1) {
    const faceOffset = faceIndex * faceVertexCount;
    for (let y = 0; y < resolution; y += 1) {
      for (let x = 0; x < resolution; x += 1) {
        const center = faceOffset + x + y * resolution;
        const left = faceOffset + Math.max(0, x - 1) + y * resolution;
        const right = faceOffset + Math.min(resolution - 1, x + 1) + y * resolution;
        const down = faceOffset + x + Math.max(0, y - 1) * resolution;
        const up = faceOffset + x + Math.min(resolution - 1, y + 1) * resolution;

        const dx = elevations[right]! - elevations[left]!;
        const dy = elevations[up]! - elevations[down]!;
        const gradient = Math.sqrt(dx * dx + dy * dy) * resolution * 0.9;
        slopeByVertex[center] = clamp(gradient, 0, 1);
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
  const normalizedElevations = elevations.map((elevation) => (elevation - minElevation) / elevationSpan);
  const {
    effectiveOceanLevel,
    mountainLevel,
  } = resolveTerrainHydrology(normalizedElevations, params);
  const categoryColorConfig = {
    ocean: { coastBoost: 0.24, mountainBoost: 0.16, iceBoost: 0.45, landToMountain: 0.42 },
    desert: { coastBoost: 0.05, mountainBoost: 0.2, iceBoost: 0.18, landToMountain: 0.6 },
    ice: { coastBoost: 0.06, mountainBoost: 0.18, iceBoost: 0.96, landToMountain: 0.46 },
    volcanic: { coastBoost: 0.03, mountainBoost: 0.32, iceBoost: 0.12, landToMountain: 0.7 },
    lush: { coastBoost: 0.2, mountainBoost: 0.16, iceBoost: 0.34, landToMountain: 0.48 },
    mineral: { coastBoost: 0.08, mountainBoost: 0.26, iceBoost: 0.24, landToMountain: 0.63 },
    barren: { coastBoost: 0.04, mountainBoost: 0.27, iceBoost: 0.2, landToMountain: 0.68 },
    toxic: { coastBoost: 0.12, mountainBoost: 0.2, iceBoost: 0.22, landToMountain: 0.52 },
    abyssal: { coastBoost: 0.02, mountainBoost: 0.24, iceBoost: 0.3, landToMountain: 0.6 },
  }[params.surfaceCategory];

  for (let i = 0; i < elevations.length; i += 1) {
    const elevation = elevations[i];
    const normalized = normalizedElevations[i];
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
    const latBand =
      (Math.sin((latitude + point.x * 0.25 + point.z * 0.2) * Math.PI * params.bandingFrequency) * 0.5 + 0.5) *
      params.bandingStrength;
    const optionalBandMask = smoothstep(effectiveOceanLevel + 0.02, 1, normalized);
    const softenedLatBand = latBand * optionalBandMask;

    const terrainEdge = normalized - effectiveOceanLevel;
    const coastDistanceNorm = clamp(terrainEdge / 0.11, -1, 1);
    const deepOceanBand = smoothstep(0, effectiveOceanLevel * 0.44, normalized);
    const shelfWaterBand = smoothstep(effectiveOceanLevel * 0.4, effectiveOceanLevel - 0.012, normalized);
    const shallowBand = smoothstep(effectiveOceanLevel * 0.66, effectiveOceanLevel + 0.03, normalized);
    const coastalBand = smoothstep(-0.72, 0.72, coastDistanceNorm);
    const shorelineBand = (1 - smoothstep(0.05, 0.95, Math.abs(coastDistanceNorm))) * (1 - deepOceanBand * 0.42);
    const lowPlainsBand = smoothstep(effectiveOceanLevel + 0.018, mountainLevel - 0.32, normalized) * (1 - smoothstep(mountainLevel - 0.3, mountainLevel - 0.19, normalized));
    const midPlainsBand = smoothstep(effectiveOceanLevel + 0.08, mountainLevel - 0.2, normalized) * (1 - smoothstep(mountainLevel - 0.17, mountainLevel - 0.08, normalized));
    const fertileTransitionBand = midPlainsBand * (0.6 + biomeSignal * 0.4);
    const plainsBand = clamp(lowPlainsBand + midPlainsBand * 0.8, 0, 1);
    const highlandBand = smoothstep(mountainLevel - 0.2, mountainLevel - 0.03, normalized);
    const mountainBand = smoothstep(mountainLevel - 0.03, mountainLevel + 0.08, normalized);
    const geometricSlope = slopeByVertex[i] ?? 0;
    const flatlandMask = clamp((1 - geometricSlope * 1.35) * (lowPlainsBand * 0.8 + fertileTransitionBand * 0.55), 0, 1);
    const slopeSignal = clamp(
      geometricSlope * 0.64 +
      Math.abs(highlandBand - plainsBand) * 0.42 +
      mountainBand * 0.44 +
      Math.abs(microBiome - 0.5) * 0.14,
      0,
      1,
    );
    const iceCap =
      smoothstep(0.72, 0.96, latitude) *
      smoothstep(effectiveOceanLevel + 0.08, 0.98, normalized) *
      (0.75 + biomeSignal * 0.25);

    if (normalized <= effectiveOceanLevel) {
      const t = clamp(normalized / Math.max(0.01, effectiveOceanLevel), 0, 1);
      const depthTint = clamp(0.78 - deepOceanBand * 0.18 + shelfWaterBand * 0.1, 0.72, 1);
      color.setRGB(
        smoothLerp(params.baseColor[0], params.shallowWaterColor[0], shallowBand * t) * depthTint,
        smoothLerp(params.baseColor[1], params.shallowWaterColor[1], shallowBand * t) * depthTint,
        smoothLerp(params.baseColor[2], params.shallowWaterColor[2], shallowBand * t) * depthTint,
      );
    } else if (normalized <= mountainLevel) {
      const baseT = clamp(
        (normalized - effectiveOceanLevel) / Math.max(0.01, mountainLevel - effectiveOceanLevel),
        0,
        1,
      );
      const lushVariation = (biomeSignal - 0.5) * (0.14 - params.biomeHarshness * 0.08);
      const t = clamp(baseT * categoryColorConfig.landToMountain + highlandBand * 0.24, 0, 1);
      color.setRGB(
        clamp(
          smoothLerp(params.landColor[0], params.mountainColor[0], t) +
          lushVariation * (lowPlainsBand * 0.9 + fertileTransitionBand * 0.5) -
          shorelineBand * 0.035 - flatlandMask * 0.016,
          0,
          1,
        ),
        clamp(
          smoothLerp(params.landColor[1], params.mountainColor[1], t) +
          lushVariation * (lowPlainsBand * 1.15 + fertileTransitionBand * 0.8) +
          fertileTransitionBand * 0.05 + flatlandMask * 0.04,
          0,
          1,
        ),
        clamp(
          smoothLerp(params.landColor[2], params.mountainColor[2], t) -
          lushVariation * (lowPlainsBand * 0.75 + fertileTransitionBand * 0.55) +
          shorelineBand * 0.02 - flatlandMask * 0.012,
          0,
          1,
        ),
      );
    } else {
      const t = clamp((normalized - mountainLevel) / Math.max(0.01, 1 - mountainLevel), 0, 1);
      color.setRGB(
        smoothLerp(params.mountainColor[0], params.iceColor[0], t),
        smoothLerp(params.mountainColor[1], params.iceColor[1], t),
        smoothLerp(params.mountainColor[2], params.iceColor[2], t),
      );
    }

    if (coastalBand > 0.02) {
      color.setRGB(
        lerp(color.r, params.shallowWaterColor[0], coastalBand * categoryColorConfig.coastBoost * 1.18),
        lerp(color.g, params.shallowWaterColor[1], coastalBand * categoryColorConfig.coastBoost * 1.18),
        lerp(color.b, params.shallowWaterColor[2], coastalBand * categoryColorConfig.coastBoost * 1.18),
      );
    }

    if (shorelineBand > 0.01 && normalized > effectiveOceanLevel) {
      color.setRGB(
        lerp(color.r, params.shallowWaterColor[0] + 0.03, shorelineBand * 0.16),
        lerp(color.g, params.shallowWaterColor[1] + 0.03, shorelineBand * 0.16),
        lerp(color.b, params.shallowWaterColor[2] + 0.02, shorelineBand * 0.14),
      );
    }

    if (softenedLatBand > 0.02) {
      const bandTint = params.surfaceCategory === 'toxic' || params.surfaceCategory === 'abyssal'
        ? new THREE.Color(0.72, 1, 0.82)
        : params.surfaceCategory === 'ice'
          ? new THREE.Color(0.86, 0.94, 1)
          : new THREE.Color(0.96, 0.9, 0.78);
      color.lerp(bandTint, softenedLatBand * 0.14);
    }

    if (params.biomeHarshness > 0.4) {
      const harshness = params.biomeHarshness - 0.4;
      const gray = color.r * 0.299 + color.g * 0.587 + color.b * 0.114;
      color.setRGB(
        lerp(color.r, gray, harshness * 0.24),
        lerp(color.g, gray, harshness * 0.2),
        lerp(color.b, gray, harshness * 0.16),
      );
    }

    if (mountainBand > 0.01) {
      color.setRGB(
        lerp(color.r, params.mountainColor[0], mountainBand * categoryColorConfig.mountainBoost),
        lerp(color.g, params.mountainColor[1], mountainBand * categoryColorConfig.mountainBoost),
        lerp(color.b, params.mountainColor[2], mountainBand * categoryColorConfig.mountainBoost),
      );
    }

    if (params.thermalActivity > 0.08 && normalized > effectiveOceanLevel + 0.02) {
      const thermalSignal = clamp((microBiome - 0.58) * 2.5 + (mountainBand + highlandBand) * 0.4, 0, 1);
      const thermalMask = thermalSignal * params.thermalActivity * (0.35 + params.craterStrength * 0.2);
      color.setRGB(
        lerp(color.r, Math.min(1, color.r + 0.22), thermalMask * 0.28),
        lerp(color.g, color.g * 0.95, thermalMask * 0.16),
        lerp(color.b, color.b * 0.8, thermalMask * 0.22),
      );
    }

    if (iceCap > 0.01) {
      color.setRGB(
        lerp(color.r, params.iceColor[0], iceCap * categoryColorConfig.iceBoost),
        lerp(color.g, params.iceColor[1], iceCap * categoryColorConfig.iceBoost),
        lerp(color.b, params.iceColor[2], iceCap * categoryColorConfig.iceBoost),
      );
    }

    if (params.colorContrast > 1.01) {
      const luminance = color.r * 0.299 + color.g * 0.587 + color.b * 0.114;
      const contrast = Math.min(1.38, params.colorContrast) - 1;
      color.setRGB(
        clamp(luminance + (color.r - luminance) * (1 + contrast), 0, 1),
        clamp(luminance + (color.g - luminance) * (1 + contrast), 0, 1),
        clamp(luminance + (color.b - luminance) * (1 + contrast), 0, 1),
      );
    }

    const floor = normalized <= effectiveOceanLevel ? 0.02 : 0.05;
    color.setRGB(
      clamp(color.r, floor, 1),
      clamp(color.g, floor, 1),
      clamp(color.b, floor, 1),
    );

    colors.push(color.r, color.g, color.b);
    terrain.push(
      normalized,
      clamp(coastalBand * 0.68 + shorelineBand * 0.9 + shelfWaterBand * 0.34, 0, 1),
      clamp(fertileTransitionBand * 0.56 + biomeSignal * 0.28 + flatlandMask * 0.16, 0, 1),
      clamp(slopeSignal * 0.68 + highlandBand * 0.24 + mountainBand * 0.2, 0, 1),
    );
  }

  return {
    indices: new Uint32Array(indices),
    positions: new Float32Array(vertices),
    colors: new Float32Array(colors),
    terrain: new Float32Array(terrain),
  };
}
