import * as THREE from 'three';
import type { PlanetSlot } from '@/game/planet/slots/types';

const UP = new THREE.Vector3(0, 1, 0);

export function createPlanetSlotMeshes(slots: PlanetSlot[]) {
  const root = new THREE.Group();
  root.name = 'planet-slots';

  if (!slots.length) return root;

  const baseGeometry = new THREE.CylinderGeometry(0.016, 0.02, 0.004, 18, 1, false);
  const rimGeometry = new THREE.TorusGeometry(0.0205, 0.0014, 6, 18);

  const baseMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#1f242d'),
    roughness: 0.88,
    metalness: 0.16,
  });
  const rimMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#323845'),
    roughness: 0.7,
    metalness: 0.24,
  });

  const baseMesh = new THREE.InstancedMesh(baseGeometry, baseMaterial, slots.length);
  const rimMesh = new THREE.InstancedMesh(rimGeometry, rimMaterial, slots.length);
  baseMesh.castShadow = false;
  baseMesh.receiveShadow = false;
  rimMesh.castShadow = false;
  rimMesh.receiveShadow = false;

  const transform = new THREE.Matrix4();
  const rotation = new THREE.Quaternion();
  const rimRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
  const composed = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);
  const offset = new THREE.Vector3();

  for (let i = 0; i < slots.length; i += 1) {
    const slot = slots[i];
    rotation.setFromUnitVectors(UP, slot.normal);
    offset.copy(slot.normal).multiplyScalar(0.0022);

    transform.compose(slot.position.clone().add(offset), rotation, scale);
    baseMesh.setMatrixAt(i, transform);

    composed.copy(rotation).multiply(rimRotation);
    transform.compose(slot.position.clone().add(offset.clone().multiplyScalar(1.18)), composed, scale);
    rimMesh.setMatrixAt(i, transform);
  }

  baseMesh.instanceMatrix.needsUpdate = true;
  rimMesh.instanceMatrix.needsUpdate = true;
  baseMesh.computeBoundingSphere();
  rimMesh.computeBoundingSphere();

  root.add(baseMesh);
  root.add(rimMesh);
  return root;
}
