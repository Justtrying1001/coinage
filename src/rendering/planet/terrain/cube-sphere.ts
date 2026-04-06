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

interface ContinentDescriptor {
  center: THREE.Vector3;
  radius: number;
  warpScale: number;
  warpSeed: number;
  mountainArcAxis: THREE.Vector3;
}

interface TerrainSynthesisContext {
  continents: ContinentDescriptor[];
  climateDriftAxis: THREE.Vector3;
}

function seededUnit(seed: number): THREE.Vector3 {
  const a = ((Math.imul(seed ^ 0x9e3779b9, 1664525) + 1013904223) >>> 0) / 0xffffffff;
  const b = ((Math.imul(seed ^ 0x7f4a7c15, 22695477) + 1) >>> 0) / 0xffffffff;
  const theta = a * Math.PI * 2;
  const z = b * 2 - 1;
  const radial = Math.sqrt(Math.max(0.000001, 1 - z * z));
  return new THREE.Vector3(Math.cos(theta) * radial, z, Math.sin(theta) * radial).normalize();
}

function createTerrainSynthesisContext(params: ProceduralPlanetUniforms): TerrainSynthesisContext {
  const baseSeed = params.shapeSeed ^ params.reliefSeed ^ 0x51f2b3d;
  const continentCount = Math.max(2, Math.min(6, 2 + Math.floor(params.minLandRatio * 4.5)));
  const continents = Array.from({ length: continentCount }, (_, index) => {
    const center = seededUnit(baseSeed + index * 0x45d9f3b);
    const mountainArcAxis = seededUnit(baseSeed ^ ((index + 1) * 0x7f4a7c15));
    const radius = clamp(0.24 + params.continentDrift * 0.18 + index * 0.011, 0.22, 0.48);
    return {
      center,
      radius,
      warpScale: 2.2 + (index % 3) * 0.7 + params.continentDrift * 1.1,
      warpSeed: baseSeed ^ ((index + 3) * 0x632be59d),
      mountainArcAxis,
    };
  });
  const climateDriftAxis = seededUnit(baseSeed ^ 0x632be59d);

  return {
    continents,
    climateDriftAxis,
  };
}

interface ContinentFieldSample {
  signedLand: number;
  inlandness: number;
  coastProximity: number;
  mountainPotential: number;
}

function sampleContinentField(
  point: THREE.Vector3,
  params: ProceduralPlanetUniforms,
  context: TerrainSynthesisContext,
): ContinentFieldSample {
  let bestInfluence = 0;
  let secondInfluence = 0;
  let bestMountainPotential = 0;

  for (let i = 0; i < context.continents.length; i += 1) {
    const continent = context.continents[i]!;
    const angularDistance = Math.acos(clamp(point.dot(continent.center), -1, 1)) / Math.PI;
    const warp = (fbm(
      point.clone().multiplyScalar(continent.warpScale).add(continent.center.clone().multiplyScalar(0.55)),
      continent.warpSeed,
      3,
    ) - 0.5) * 0.11;
    const effectiveRadius = clamp(continent.radius + warp + params.continentDrift * 0.05, 0.18, 0.54);
    const influence = 1 - smoothstep(effectiveRadius * 0.68, effectiveRadius, angularDistance);
    if (influence > bestInfluence) {
      secondInfluence = bestInfluence;
      bestInfluence = influence;
    } else if (influence > secondInfluence) {
      secondInfluence = influence;
    }

    const rim = smoothstep(effectiveRadius * 0.52, effectiveRadius * 0.94, angularDistance);
    const arc = Math.abs(point.dot(continent.mountainArcAxis));
    const mountainPotential = influence * rim * smoothstep(0.2, 0.78, arc);
    if (mountainPotential > bestMountainPotential) {
      bestMountainPotential = mountainPotential;
    }
  }

  const signedLand = bestInfluence - (0.34 + (1 - params.minLandRatio) * 0.22);
  const inlandness = clamp(smoothstep(0.04, 0.55, signedLand), 0, 1);
  const coastProximity = clamp(1 - smoothstep(0.02, 0.28, Math.abs(signedLand)), 0, 1);

  return {
    signedLand,
    inlandness,
    coastProximity,
    mountainPotential: clamp(bestMountainPotential + (bestInfluence - secondInfluence) * 0.24, 0, 1),
  };
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

function computeElevation(
  point: THREE.Vector3,
  params: ProceduralPlanetUniforms,
  context: TerrainSynthesisContext,
): number {
  const continent = sampleContinentField(point, params, context);
  const inlandness = continent.inlandness;
  const coastProximity = continent.coastProximity;
  const oceanFactor = clamp(-continent.signedLand * 1.8, 0, 1);
  const hillBand = smoothstep(0.2, 0.58, inlandness) * (1 - continent.mountainPotential * 0.65);
  const mountainBand = smoothstep(0.28, 0.88, continent.mountainPotential) * smoothstep(0.16, 0.82, inlandness);
  const basinMask = smoothstep(0.3, 0.78, inlandness) * (1 - mountainBand) * (1 - coastProximity * 0.7);

  const macroWarp = (fbm(point.clone().multiplyScalar(params.simpleFrequency * 0.55), params.shapeSeed ^ 0x45d9f3b, 3) - 0.5) * 0.02;
  const plainDetail = (fbm(point.clone().multiplyScalar(params.simpleFrequency * 1.2), params.shapeSeed ^ 0x3ab2471d, 3) - 0.5) * 0.008;
  const hillDetail = (fbm(point.clone().multiplyScalar(params.simpleFrequency * 2.0), params.shapeSeed ^ 0x6c8e9cf5, 3) - 0.5) * 0.016;
  const ridgeDetail = (ridgedFbm(point.clone().multiplyScalar(params.ridgedFrequency * 1.06), params.reliefSeed ^ 0x5a6d39ef, 4) - 0.5) * 0.05;
  const microDetail = (fbm(point.clone().multiplyScalar(params.ridgedFrequency * 2.8), params.reliefSeed ^ 0x9e3779b9, 2) - 0.5) * 0.004;
  const coastBreakup = (fbm(point.clone().multiplyScalar(params.simpleFrequency * 2.5), params.shapeSeed ^ 0x2d2816fe, 2) - 0.5) * 0.012;
  const basinNoise = (fbm(point.clone().multiplyScalar(params.simpleFrequency * 1.5), params.shapeSeed ^ 0x51f2b3d, 3) - 0.5) * 0.018;
  const climateDrift = point.dot(context.climateDriftAxis) * 0.5 + 0.5;

  const oceanDepth =
    oceanFactor *
    (0.06 + params.trenchDepth * 0.08 + (1 - coastProximity) * 0.04 + (1 - climateDrift) * 0.01);
  const coastShelf =
    coastProximity *
    (0.012 + params.coastShelfScale * 0.02 + coastBreakup * 0.3);
  const plainsLift =
    inlandness *
    (0.03 + plainDetail + (1 - hillBand) * 0.016);
  const hillsLift =
    hillBand *
    (0.018 + hillDetail + params.simpleStrength * 0.02);
  const mountainLift =
    mountainBand *
    (0.036 + ridgeDetail * (0.85 + params.ridgeBias * 0.3) + params.ridgedStrength * 0.03);
  const basinCut =
    basinMask *
    (0.012 + basinNoise + params.basinBias * 0.016);

  const rawElevation =
    -oceanDepth +
    coastShelf +
    plainsLift +
    hillsLift +
    mountainLift -
    basinCut +
    macroWarp +
    microDetail;

  const upwardCap = params.elevationCap;
  const downwardCap = Math.min(0.14, params.elevationCap * 0.36 + 0.018 + params.trenchDepth * 0.06);
  const elevation = rawElevation >= 0
    ? smoothstep(0, 1, clamp(rawElevation / Math.max(0.0001, upwardCap), 0, 1)) * upwardCap
    : -smoothstep(0, 1, clamp((-rawElevation) / Math.max(0.0001, downwardCap), 0, 1)) * downwardCap;

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
  const { indices, positions, colors, terrain, terrainAux, terrainGeo, terrainRegion } = generateCubeSphereTerrainBuffers(params);
  return createCubeSphereGeometryFromBuffers(params, { indices, positions, colors, terrain, terrainAux, terrainGeo, terrainRegion });
}

export function createCubeSphereGeometryFromBuffers(
  params: ProceduralPlanetUniforms,
  buffers: GeneratedCubeSphereTerrainBuffers,
): THREE.BufferGeometry {
  const { indices, positions, colors, terrain, terrainAux, terrainGeo, terrainRegion } = buffers;
  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('terrain', new THREE.BufferAttribute(terrain, 4));
  geometry.setAttribute('terrainAux', new THREE.BufferAttribute(terrainAux, 4));
  geometry.setAttribute('terrainGeo', new THREE.BufferAttribute(terrainGeo, 4));
  geometry.setAttribute('terrainRegion', new THREE.BufferAttribute(terrainRegion, 4));
  geometry.computeVertexNormals();
  applyMicroNormalDetail(geometry, params);

  return geometry;
}

export interface GeneratedCubeSphereTerrainBuffers {
  indices: Uint32Array;
  positions: Float32Array;
  colors: Float32Array;
  terrain: Float32Array;
  terrainAux: Float32Array;
  terrainGeo: Float32Array;
  terrainRegion: Float32Array;
}

/**
 * Pure terrain-data generation step intended for eventual off-main-thread workerization.
 * This function performs no WebGL or scene graph work and returns transferable typed arrays.
 */
export function generateCubeSphereTerrainBuffers(
  params: ProceduralPlanetUniforms,
): GeneratedCubeSphereTerrainBuffers {
  const resolution = params.meshResolution;
  const vertices: number[] = [];
  const colors: number[] = [];
  const terrain: number[] = [];
  const terrainAux: number[] = [];
  const terrainGeo: number[] = [];
  const terrainRegion: number[] = [];
  const indices: number[] = [];
  const elevations: number[] = [];
  const synthesisContext = createTerrainSynthesisContext(params);

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
        const elevation = computeElevation(pointOnSphere, params, synthesisContext);
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
    const faceOffset = faceIndex * resolution * resolution;
    for (let y = 0; y < resolution; y += 1) {
      for (let x = 0; x < resolution; x += 1) {
        const center = faceOffset + x + y * resolution;
        const left = faceOffset + Math.max(0, x - 1) + y * resolution;
        const right = faceOffset + Math.min(resolution - 1, x + 1) + y * resolution;
        const down = faceOffset + x + Math.max(0, y - 1) * resolution;
        const up = faceOffset + x + Math.min(resolution - 1, y + 1) * resolution;

        const dx = elevations[right]! - elevations[left]!;
        const dy = elevations[up]! - elevations[down]!;
        const geometricGradient = Math.sqrt(dx * dx + dy * dy) * resolution * 0.84;
        const point = new THREE.Vector3(
          vertices[center * 3]!,
          vertices[center * 3 + 1]!,
          vertices[center * 3 + 2]!,
        ).normalize();
        const seamStableRidgeProbe = Math.abs(
          ridgedFbm(
            point.clone().multiplyScalar(params.ridgedFrequency * 0.66),
            params.reliefSeed ^ 0x4f1bbcdc,
            3,
          ) - 0.5,
        ) * 2;
        slopeByVertex[center] = clamp(
          geometricGradient * (0.76 + params.ridgeBias * 0.22) + seamStableRidgeProbe * 0.18,
          0,
          1,
        );
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
    const continentField = sampleContinentField(point, params, synthesisContext);
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
    const signedCoastDistance = coastDistanceNorm;
    const inlandness = normalized > effectiveOceanLevel
      ? clamp(smoothstep(0.02, 0.96, coastDistanceNorm * (0.74 + params.inlandTransitionSharpness * 0.74)), 0, 1)
      : 0;
    const oceanDepth = normalized <= effectiveOceanLevel
      ? clamp((effectiveOceanLevel - normalized) / Math.max(0.01, effectiveOceanLevel), 0, 1)
      : 0;
    const shelfSignal = normalized <= effectiveOceanLevel
      ? clamp(
        smoothstep(0.03, 0.9, shelfWaterBand + shallowBand * 0.32) *
          (1 - oceanDepth * (0.64 - params.coastShelfScale * 0.24)),
        0,
        1,
      )
      : clamp(shorelineBand * (0.42 + params.coastShelfScale * 0.38), 0, 1);
    const ruggednessMultiscale = clamp(
      slopeSignal * (0.56 + params.ridgeBias * 0.2) +
      mountainBand * 0.26 +
      Math.abs(microBiome - 0.5) * 0.26 +
      Math.max(0, highlandBand - lowPlainsBand) * 0.18,
      0,
      1,
    );
    const ridgeStrength = clamp(
      ruggednessMultiscale * (0.42 + params.ridgeBias * 0.34) +
      highlandBand * 0.22 +
      mountainBand * 0.18 +
      Math.max(0, biomeSignal - 0.52) * 0.1,
      0,
      1,
    );
    const basinLikelihood = clamp(
      (1 - ruggednessMultiscale * (0.78 + params.basinBias * 0.08)) *
      (lowPlainsBand * 0.56 + fertileTransitionBand * 0.3 + shelfSignal * 0.12) *
      (0.38 + params.basinBias * 0.56),
      0,
      1,
    );
    const curvatureApprox = clamp(0.5 + (highlandBand - lowPlainsBand) * 0.5 + (ridgeStrength - basinLikelihood) * 0.28, 0, 1);
    const plateauSignal = clamp(highlandBand * (1 - ruggednessMultiscale * 0.92) * (1 - mountainBand * 0.85), 0, 1);
    const constructibilitySignal = clamp(
      (flatlandMask * 0.52 + basinLikelihood * 0.3 + plateauSignal * 0.18) *
      (1 - ruggednessMultiscale * (0.56 + params.constructibilityBias * 0.12)) *
      (0.5 + params.constructibilityBias * 0.58),
      0,
      1,
    );
    const wetnessProxy = clamp(
      (normalized <= effectiveOceanLevel
        ? 1 - oceanDepth * 0.82
        : shelfSignal * 0.52 + basinLikelihood * 0.26 + (1 - inlandness) * 0.22) *
      (0.78 + (1 - params.biomeHarshness) * 0.26),
      0,
      1,
    );
    const erosionProxy = clamp(
      ruggednessMultiscale * 0.44 +
      Math.abs(curvatureApprox - 0.5) * 0.34 +
      (1 - wetnessProxy) * 0.14 +
      continentField.coastProximity * 0.18,
      0,
      1,
    );
    const regionClassNorm =
      normalized <= effectiveOceanLevel
        ? 0
        : shorelineBand > 0.46
          ? 0.25
          : mountainBand > 0.55
            ? 1
            : highlandBand > 0.42
              ? 0.75
              : 0.5;

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
      ruggednessMultiscale,
    );
    terrainAux.push(
      signedCoastDistance,
      inlandness,
      oceanDepth,
      shelfSignal,
    );
    terrainGeo.push(
      ridgeStrength,
      basinLikelihood,
      curvatureApprox,
      constructibilitySignal,
    );
    terrainRegion.push(
      regionClassNorm,
      plateauSignal,
      wetnessProxy,
      erosionProxy,
    );
  }

  return {
    indices: new Uint32Array(indices),
    positions: new Float32Array(vertices),
    colors: new Float32Array(colors),
    terrain: new Float32Array(terrain),
    terrainAux: new Float32Array(terrainAux),
    terrainGeo: new Float32Array(terrainGeo),
    terrainRegion: new Float32Array(terrainRegion),
  };
}
