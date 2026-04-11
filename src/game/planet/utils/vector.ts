import * as THREE from 'three';

export type Vector3Tuple = [number, number, number];

export const VECTOR_UP = new THREE.Vector3(0, 1, 0);
export const VECTOR_DOWN = new THREE.Vector3(0, -1, 0);
export const VECTOR_LEFT = new THREE.Vector3(-1, 0, 0);
export const VECTOR_RIGHT = new THREE.Vector3(1, 0, 0);
export const VECTOR_FRONT = new THREE.Vector3(0, 0, 1);
export const VECTOR_BACK = new THREE.Vector3(0, 0, -1);

export const FACE_DIRECTIONS = [VECTOR_UP, VECTOR_DOWN, VECTOR_LEFT, VECTOR_RIGHT, VECTOR_FRONT, VECTOR_BACK];

export function tupleToVector3(tuple: Vector3Tuple) {
  return new THREE.Vector3(tuple[0], tuple[1], tuple[2]);
}
