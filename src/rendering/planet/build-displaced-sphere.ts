import * as THREE from 'three';

import type { PlanetFamily, PlanetSurfaceModel } from '@/domain/world/planet-visual.types';
import { sampleTerrain } from './terrain-noise';
import { tracePlanetPipeline } from './runtime-audit';

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

export function buildDisplacedSphereGeometry(input: DisplacedSphereInput): THREE.SphereGeometry {
  tracePlanetPipeline({
    stage: 'buildDisplacedSphereGeometry',
    family: input.family,
    surfaceModel: input.surfaceModel,
    segments: input.segments,
    reliefAmplitude: input.reliefAmplitude,
    oceanLevel: input.oceanLevel,
  });
  const geometry = new THREE.SphereGeometry(input.radius, input.segments, input.segments);
  const position = geometry.attributes.position;

  const heights = new Float32Array(position.count);
  const landMask = new Float32Array(position.count);
  const mountainMask = new Float32Array(position.count);
  const coastMask = new Float32Array(position.count);
  const oceanDepth = new Float32Array(position.count);
  const continentMask = new Float32Array(position.count);
  const humidityMask = new Float32Array(position.count);
  const temperatureMask = new Float32Array(position.count);
  const erosionMask = new Float32Array(position.count);
  const craterMask = new Float32Array(position.count);
  const thermalMask = new Float32Array(position.count);
  const bandMask = new Float32Array(position.count);

  const displacementScale = input.radius * (input.surfaceModel === 'gaseous' ? 0.06 : 0.34);

  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);

    const invLen = 1 / Math.max(1e-6, Math.sqrt(x * x + y * y + z * z));
    const px = x * invLen;
    const py = y * invLen;
    const pz = z * invLen;

    const terrain = sampleTerrain({
      px,
      py,
      pz,
      seed: input.seed,
      moistureSeed: input.moistureSeed,
      thermalSeed: input.thermalSeed,
      oceanLevel: input.oceanLevel,
      bandingStrength: input.bandingStrength,
      family: input.family,
      surfaceModel: input.surfaceModel,
    });

    const signed = (terrain.height01 - 0.5) * 2;
    const displacedRadius = input.radius + signed * input.reliefAmplitude * displacementScale;

    position.setXYZ(i, px * displacedRadius, py * displacedRadius, pz * displacedRadius);

    heights[i] = terrain.height01;
    landMask[i] = terrain.landMask;
    mountainMask[i] = terrain.mountainMask;
    coastMask[i] = terrain.coastMask;
    oceanDepth[i] = terrain.oceanDepth;
    continentMask[i] = terrain.continentMask;
    humidityMask[i] = terrain.humidityMask;
    temperatureMask[i] = terrain.temperatureMask;
    erosionMask[i] = terrain.erosionMask;
    craterMask[i] = terrain.craterMask;
    thermalMask[i] = terrain.thermalMask;
    bandMask[i] = terrain.bandMask;
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();

  geometry.setAttribute('aHeight', new THREE.BufferAttribute(heights, 1));
  geometry.setAttribute('aLandMask', new THREE.BufferAttribute(landMask, 1));
  geometry.setAttribute('aMountainMask', new THREE.BufferAttribute(mountainMask, 1));
  geometry.setAttribute('aCoastMask', new THREE.BufferAttribute(coastMask, 1));
  geometry.setAttribute('aOceanDepth', new THREE.BufferAttribute(oceanDepth, 1));
  geometry.setAttribute('aContinentMask', new THREE.BufferAttribute(continentMask, 1));
  geometry.setAttribute('aHumidityMask', new THREE.BufferAttribute(humidityMask, 1));
  geometry.setAttribute('aTemperatureMask', new THREE.BufferAttribute(temperatureMask, 1));
  geometry.setAttribute('aErosionMask', new THREE.BufferAttribute(erosionMask, 1));
  geometry.setAttribute('aCraterMask', new THREE.BufferAttribute(craterMask, 1));
  geometry.setAttribute('aThermalMask', new THREE.BufferAttribute(thermalMask, 1));
  geometry.setAttribute('aBandMask', new THREE.BufferAttribute(bandMask, 1));

  return geometry;
}
