import * as THREE from 'three';

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function jitterFromSeed(seed: number) {
  const x = Math.sin((seed >>> 0) * 12.9898 + 78.233) * 43758.5453123;
  return x - Math.floor(x);
}

export function generateSphericalFibonacciDirections(count: number, seed: number): THREE.Vector3[] {
  if (count <= 0) return [];

  const directions: THREE.Vector3[] = [];
  const offset = jitterFromSeed(seed) * count;

  for (let i = 0; i < count; i += 1) {
    const index = i + offset;
    const t = (index + 0.5) / count;
    const y = 1 - (2 * t);
    const radial = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = GOLDEN_ANGLE * index;

    directions.push(new THREE.Vector3(Math.cos(theta) * radial, y, Math.sin(theta) * radial).normalize());
  }

  return directions;
}
