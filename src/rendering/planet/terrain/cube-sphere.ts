import * as THREE from 'three';

import type { ProceduralPlanetUniforms } from '../types';

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

function hash3(x: number, y: number, z: number, seed: number): number {
  let h = seed ^ (x * 374761393) ^ (y * 668265263) ^ (z * 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 0xffffffff;
}

function valueNoise3(point: THREE.Vector3, seed: number): number {
  const ix = Math.floor(point.x);
  const iy = Math.floor(point.y);
  const iz = Math.floor(point.z);

  const fx = point.x - ix;
  const fy = point.y - iy;
  const fz = point.z - iz;

  const sx = smoothstep(0, 1, fx);
  const sy = smoothstep(0, 1, fy);
  const sz = smoothstep(0, 1, fz);

  const n000 = hash3(ix, iy, iz, seed);
  const n100 = hash3(ix + 1, iy, iz, seed);
  const n010 = hash3(ix, iy + 1, iz, seed);
  const n110 = hash3(ix + 1, iy + 1, iz, seed);
  const n001 = hash3(ix, iy, iz + 1, seed);
  const n101 = hash3(ix + 1, iy, iz + 1, seed);
  const n011 = hash3(ix, iy + 1, iz + 1, seed);
  const n111 = hash3(ix + 1, iy + 1, iz + 1, seed);

  const nx00 = n000 + (n100 - n000) * sx;
  const nx10 = n010 + (n110 - n010) * sx;
  const nx01 = n001 + (n101 - n001) * sx;
  const nx11 = n011 + (n111 - n011) * sx;

  const nxy0 = nx00 + (nx10 - nx00) * sy;
  const nxy1 = nx01 + (nx11 - nx01) * sy;

  return nxy0 + (nxy1 - nxy0) * sz;
}

function fbm(point: THREE.Vector3, seed: number, octaves = 5): number {
  let frequency = 1;
  let amplitude = 0.5;
  let value = 0;

  for (let i = 0; i < octaves; i += 1) {
    value += valueNoise3(point.clone().multiplyScalar(frequency), seed + i * 97) * amplitude;
    frequency *= 2.02;
    amplitude *= 0.5;
  }

  return value;
}

function ridgedFbm(point: THREE.Vector3, seed: number, octaves = 5): number {
  let frequency = 1;
  let amplitude = 0.5;
  let value = 0;
  let weight = 1;

  for (let i = 0; i < octaves; i += 1) {
    let n = valueNoise3(point.clone().multiplyScalar(frequency), seed + i * 131);
    n = 1 - Math.abs(n * 2 - 1);
    n *= n;
    n *= weight;
    weight = Math.max(0, Math.min(1, n * 1.8));

    value += n * amplitude;
    frequency *= 2.12;
    amplitude *= 0.5;
  }

  return value;
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
  const continentMask = smoothstep(
    params.continentThreshold - params.continentSharpness,
    params.continentThreshold + params.continentSharpness,
    continentSignal,
  );
  const inlandMask = smoothstep(
    params.continentThreshold + params.continentSharpness * 0.7,
    Math.min(0.95, params.continentThreshold + 0.33 + params.continentSharpness),
    continentSignal,
  );

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

  const oceanFloor = (1 - continentMask) * (0.045 + params.simpleStrength * 0.08 + trenchSignal * params.trenchDepth * 0.18);
  const continentBase = continentMask * (0.06 + params.simpleStrength * 0.2);
  const uplands = inlandMask * Math.max(0, continentSignal - 0.48) * params.simpleStrength * (0.14 + params.continentDrift * 0.07);
  const midLayer =
    Math.max(0, ridgeRelief - 0.44) *
    params.ridgedStrength *
    params.ridgeAttenuation *
    (0.08 + continentMask * 0.25);
  const microLayer = microRelief * params.ridgedStrength * params.detailAttenuation * (0.004 + mountainMask * 0.005);
  const plateau = Math.max(0, midRelief) * inlandMask * (0.04 + params.continentDrift * 0.04);
  const mountainLift = mountainMask * params.ridgedStrength * params.ridgeAttenuation * 0.1;
  const fragmentedIslands = driftedFragmentation * (1 - inlandMask) * params.simpleStrength * params.continentDrift * 0.09;
  const craterDepth = craterMask * params.craterStrength * (0.02 + params.terrainSmoothing * 0.02);
  const tectonicBand = Math.sin((warpedPoint.y + warpedPoint.x * 0.35) * (params.bandingFrequency * 1.7)) * 0.5 + 0.5;
  const thermalUplift =
    params.thermalActivity *
    Math.max(0, tectonicBand - 0.55) *
    (0.015 + params.ridgedStrength * 0.025) *
    inlandMask;

  const rawElevation =
    -oceanFloor +
    continentBase +
    uplands +
    midLayer +
    microLayer +
    plateau +
    mountainLift +
    fragmentedIslands -
    craterDepth +
    thermalUplift;
  const normalized = clamp((rawElevation + 0.12) / 0.34, 0, 1);
  const smoothed = smoothstep(
    0.06 + (1 - params.terrainSmoothing) * 0.15,
    0.95 - params.terrainSmoothing * 0.06,
    normalized,
  );
  const centered = (smoothed - 0.5) * 2;
  const upwardCap = params.elevationCap;
  const downwardCap = Math.min(0.16, params.elevationCap * 0.42 + 0.02 + params.trenchDepth * 0.07);
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
  const { indices, positions, colors } = generateCubeSphereTerrainBuffers(params);
  return createCubeSphereGeometryFromBuffers(params, { indices, positions, colors });
}

export function createCubeSphereGeometryFromBuffers(
  params: ProceduralPlanetUniforms,
  buffers: GeneratedCubeSphereTerrainBuffers,
): THREE.BufferGeometry {
  const { indices, positions, colors } = buffers;
  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  applyMicroNormalDetail(geometry, params);

  return geometry;
}

export interface GeneratedCubeSphereTerrainBuffers {
  indices: Uint32Array;
  positions: Float32Array;
  colors: Float32Array;
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
  const normalizedElevations = elevations.map((elevation) => (elevation - minElevation) / elevationSpan);
  const sortedElevations = [...normalizedElevations].sort((a, b) => a - b);
  const maxOceanCoverage = clamp(1 - params.minLandRatio, 0.22, 0.62);
  const oceanQuantileIndex = Math.floor((sortedElevations.length - 1) * maxOceanCoverage);
  const oceanQuantileCap = sortedElevations[Math.max(0, Math.min(sortedElevations.length - 1, oceanQuantileIndex))] - 0.002;
  const effectiveOceanLevel = clamp(Math.min(params.oceanLevel, params.mountainLevel - 0.18, oceanQuantileCap), 0.03, 0.62);
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
    const rawLatBand =
      (Math.sin((latitude + point.x * 0.25 + point.z * 0.2) * Math.PI * params.bandingFrequency) * 0.5 + 0.5) *
      params.bandingStrength;
    const bandingPermitted =
      params.surfaceCategory === 'abyssal' ||
      params.surfaceCategory === 'toxic' ||
      params.surfaceCategory === 'ice';
    const latBand = bandingPermitted && params.bandingStrength >= 0.03 ? rawLatBand : 0;

    const deepOceanBand = smoothstep(0, effectiveOceanLevel * 0.6, normalized);
    const shallowBand = smoothstep(effectiveOceanLevel * 0.68, effectiveOceanLevel + 0.02, normalized);
    const coastalBand = smoothstep(effectiveOceanLevel - 0.015, effectiveOceanLevel + 0.04, normalized);
    const plainsBand = smoothstep(effectiveOceanLevel + 0.01, params.mountainLevel - 0.22, normalized);
    const highlandBand = smoothstep(params.mountainLevel - 0.2, params.mountainLevel - 0.03, normalized);
    const mountainBand = smoothstep(params.mountainLevel - 0.03, params.mountainLevel + 0.08, normalized);
    const iceCap =
      smoothstep(0.72, 0.96, latitude) *
      smoothstep(effectiveOceanLevel + 0.08, 0.98, normalized) *
      (0.75 + biomeSignal * 0.25);

    if (normalized <= effectiveOceanLevel) {
      const t = clamp(normalized / Math.max(0.01, effectiveOceanLevel), 0, 1);
      const depthTint = clamp(1 - deepOceanBand * 0.22, 0.75, 1);
      color.setRGB(
        lerp(params.baseColor[0], params.shallowWaterColor[0], shallowBand * t) * depthTint,
        lerp(params.baseColor[1], params.shallowWaterColor[1], shallowBand * t) * depthTint,
        lerp(params.baseColor[2], params.shallowWaterColor[2], shallowBand * t) * depthTint,
      );
    } else if (normalized <= params.mountainLevel) {
      const baseT = clamp(
        (normalized - effectiveOceanLevel) / Math.max(0.01, params.mountainLevel - effectiveOceanLevel),
        0,
        1,
      );
      const lushVariation = (biomeSignal - 0.5) * (0.14 - params.biomeHarshness * 0.08);
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

    if (latBand > 0.02) {
      const bandTint = params.surfaceCategory === 'toxic' || params.surfaceCategory === 'abyssal'
        ? new THREE.Color(0.78, 0.9, 0.74)
        : params.surfaceCategory === 'ice'
          ? new THREE.Color(0.9, 0.94, 0.96)
          : new THREE.Color(0.9, 0.86, 0.78);
      color.lerp(bandTint, latBand * 0.12);
    }

    if (params.biomeHarshness > 0.4) {
      const harshness = params.biomeHarshness - 0.4;
      const gray = color.r * 0.299 + color.g * 0.587 + color.b * 0.114;
      color.setRGB(
        lerp(color.r, gray, harshness * 0.14),
        lerp(color.g, gray, harshness * 0.12),
        lerp(color.b, gray, harshness * 0.1),
      );
    }

    if (mountainBand > 0.01) {
      color.setRGB(
        lerp(color.r, params.mountainColor[0], mountainBand * categoryColorConfig.mountainBoost),
        lerp(color.g, params.mountainColor[1], mountainBand * categoryColorConfig.mountainBoost),
        lerp(color.b, params.mountainColor[2], mountainBand * categoryColorConfig.mountainBoost),
      );
    }

    const thermalPermitted = params.surfaceCategory === 'volcanic' || params.surfaceCategory === 'toxic' || params.surfaceCategory === 'abyssal';
    if (thermalPermitted && params.thermalActivity > 0.08) {
      const thermalSignal = clamp((microBiome - 0.58) * 2.5 + (mountainBand + highlandBand) * 0.4, 0, 1);
      const thermalMask = thermalSignal * Math.min(0.7, params.thermalActivity) * (0.35 + params.craterStrength * 0.2);
      color.setRGB(
        lerp(color.r, Math.min(1, color.r + 0.14), thermalMask * 0.2),
        lerp(color.g, color.g * 0.94, thermalMask * 0.12),
        lerp(color.b, color.b * 0.86, thermalMask * 0.16),
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
      const contrast = Math.min(1.5, params.colorContrast) - 1;
      color.setRGB(
        clamp(luminance + (color.r - luminance) * (1 + contrast), 0, 1),
        clamp(luminance + (color.g - luminance) * (1 + contrast), 0, 1),
        clamp(luminance + (color.b - luminance) * (1 + contrast), 0, 1),
      );
    }

    colors.push(color.r, color.g, color.b);
  }

  return {
    indices: new Uint32Array(indices),
    positions: new Float32Array(vertices),
    colors: new Float32Array(colors),
  };
}
