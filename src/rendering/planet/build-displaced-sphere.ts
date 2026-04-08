import * as THREE from 'three';

import type { PlanetFamily, PlanetSurfaceModel } from '@/domain/world/planet-visual.types';
import { sampleTerrain } from './terrain-noise';

export const OCEAN_FAMILIES: ReadonlyArray<string> = ['terrestrial-lush', 'oceanic', 'toxic-alien'];

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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function buildDisplacedSphereGeometry(input: DisplacedSphereInput): THREE.SphereGeometry {
  if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined' && (window as { __COINAGE_PIPELINE_TRACE?: boolean }).__COINAGE_PIPELINE_TRACE) {
    console.info('[PlanetPipelineTrace]', {
      stage: 'buildDisplacedSphereGeometry',
      family: input.family,
      surfaceModel: input.surfaceModel,
      segments: input.segments,
      reliefAmplitude: input.reliefAmplitude,
      oceanLevel: input.oceanLevel,
    });
  }
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
  const macroRelief = new Float32Array(position.count);
  const midRelief = new Float32Array(position.count);
  const microRelief = new Float32Array(position.count);
  const silhouetteMask = new Float32Array(position.count);
  const fractureMask = new Float32Array(position.count);

  const baseDisplacementScale = input.radius * (input.surfaceModel === 'gaseous' ? 0.03 : 0.22);
  const macroScale = baseDisplacementScale * (input.surfaceModel === 'gaseous' ? 0.5 : 0.82);
  const midScale = baseDisplacementScale * (input.surfaceModel === 'gaseous' ? 0.3 : 0.24);
  const microScale = baseDisplacementScale * (input.surfaceModel === 'gaseous' ? 0.2 : 0.05);

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

    const hasOceanFamily = OCEAN_FAMILIES.includes(input.family);

    const macroComponent = terrain.macroRelief * macroScale;
    const midComponent = terrain.midRelief * midScale;
    const microComponent = terrain.microRelief * microScale;

    const silhouetteGain = 0.84 + terrain.silhouetteMask * 0.72;
    const combinedRelief = (macroComponent + midComponent * 0.92 + microComponent * 0.38) * silhouetteGain;

    const amplitudeControl = input.reliefAmplitude * (input.surfaceModel === 'gaseous' ? 0.9 : 1.0);
    const unclampedDisplacement = combinedRelief * amplitudeControl;
    const clampedDisplacement = clamp(
      unclampedDisplacement,
      -input.radius * (input.surfaceModel === 'gaseous' ? 0.016 : 0.09),
      input.radius * (input.surfaceModel === 'gaseous' ? 0.018 : 0.12),
    );

    let displacedRadius: number;
    if (hasOceanFamily && terrain.landMask < 0.5) {
      const basinSink = terrain.basinMask * input.radius * 0.0028;
      displacedRadius = input.radius * 0.998 - basinSink;
    } else {
      displacedRadius = input.radius + clampedDisplacement;
    }

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
    macroRelief[i] = terrain.macroRelief;
    midRelief[i] = terrain.midRelief;
    microRelief[i] = terrain.microRelief;
    silhouetteMask[i] = terrain.silhouetteMask;
    fractureMask[i] = terrain.fractureMask;
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
  geometry.setAttribute('aMacroRelief', new THREE.BufferAttribute(macroRelief, 1));
  geometry.setAttribute('aMidRelief', new THREE.BufferAttribute(midRelief, 1));
  geometry.setAttribute('aMicroRelief', new THREE.BufferAttribute(microRelief, 1));
  geometry.setAttribute('aSilhouetteMask', new THREE.BufferAttribute(silhouetteMask, 1));
  geometry.setAttribute('aFractureMask', new THREE.BufferAttribute(fractureMask, 1));

  return geometry;
}
