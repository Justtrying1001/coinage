import * as THREE from 'three';

export function spherize(pointOnCube: THREE.Vector3) {
  const { x, y, z } = pointOnCube;
  const xSqr = x * x;
  const ySqr = y * y;
  const zSqr = z * z;

  return new THREE.Vector3(
    x * Math.sqrt(1 - ySqr / 2 - zSqr / 2 + (ySqr * zSqr) / 3),
    y * Math.sqrt(1 - zSqr / 2 - xSqr / 2 + (xSqr * zSqr) / 3),
    z * Math.sqrt(1 - xSqr / 2 - ySqr / 2 + (ySqr * xSqr) / 3),
  );
}
