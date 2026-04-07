import * as THREE from 'three';

import { sampleTerrain } from './terrain-noise';

export interface DisplacedSphereInput {
  radius: number;
  segments: number;
  seed: number;
  reliefAmplitude: number;
  bandingStrength: number;
}

export function buildDisplacedSphereGeometry(input: DisplacedSphereInput): THREE.SphereGeometry {
  const geometry = new THREE.SphereGeometry(input.radius, input.segments, input.segments);
  const position = geometry.attributes.position;

  const heights = new Float32Array(position.count);
  const landMask = new Float32Array(position.count);
  const mountainMask = new Float32Array(position.count);
  const coastMask = new Float32Array(position.count);
  const oceanDepth = new Float32Array(position.count);
  const continentMask = new Float32Array(position.count);

  const displacementScale = input.radius * 0.38;

  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);

    const invLen = 1 / Math.max(1e-6, Math.sqrt(x * x + y * y + z * z));
    const px = x * invLen;
    const py = y * invLen;
    const pz = z * invLen;

    const terrain = sampleTerrain(px, py, pz, input.seed, input.bandingStrength);
    const signed = (terrain.height01 - 0.5) * 2;
    const displacedRadius = input.radius + signed * input.reliefAmplitude * displacementScale;

    position.setXYZ(i, px * displacedRadius, py * displacedRadius, pz * displacedRadius);

    heights[i] = terrain.height01;
    landMask[i] = terrain.landMask;
    mountainMask[i] = terrain.mountainMask;
    coastMask[i] = terrain.coastMask;
    oceanDepth[i] = terrain.oceanDepth;
    continentMask[i] = terrain.continentMask;
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();

  geometry.setAttribute('aHeight', new THREE.BufferAttribute(heights, 1));
  geometry.setAttribute('aLandMask', new THREE.BufferAttribute(landMask, 1));
  geometry.setAttribute('aMountainMask', new THREE.BufferAttribute(mountainMask, 1));
  geometry.setAttribute('aCoastMask', new THREE.BufferAttribute(coastMask, 1));
  geometry.setAttribute('aOceanDepth', new THREE.BufferAttribute(oceanDepth, 1));
  geometry.setAttribute('aContinentMask', new THREE.BufferAttribute(continentMask, 1));

  return geometry;
}
