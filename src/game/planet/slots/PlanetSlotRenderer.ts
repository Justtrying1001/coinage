import * as THREE from 'three';
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js';
import type { PlanetSettlementSlot, PlanetSlotRenderItem, PlanetSlotRenderState } from '@/game/planet/slots/types';

const BASE_COLOR = new THREE.Color('#75c7f4');

export class PlanetSlotRenderer {
  render(surfaceMesh: THREE.Mesh, slots: PlanetSettlementSlot[]): PlanetSlotRenderState {
    const root = new THREE.Group();
    root.name = 'planet-settlement-slots';

    const items: PlanetSlotRenderItem[] = [];

    for (const slot of slots) {
      const position = new THREE.Vector3(...slot.position);
      const normal = new THREE.Vector3(...slot.normal).normalize();

      const orientation = new THREE.Euler().setFromQuaternion(
        new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal),
      );

      const decalSize = new THREE.Vector3(0.12, 0.12, 0.08);
      const decalGeometry = new DecalGeometry(surfaceMesh, position, orientation, decalSize);
      const decalMaterial = new THREE.MeshStandardMaterial({
        color: BASE_COLOR.clone().multiplyScalar(0.55),
        emissive: BASE_COLOR.clone().multiplyScalar(0.1),
        emissiveIntensity: 0.24,
        roughness: 0.48,
        metalness: 0.7,
        transparent: true,
        opacity: 0.72,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
        depthWrite: false,
      });

      const decalMesh = new THREE.Mesh(decalGeometry, decalMaterial);
      decalMesh.renderOrder = 30;
      decalMesh.userData.slotId = slot.id;
      root.add(decalMesh);

      const beaconGeometry = new THREE.CylinderGeometry(0.004, 0.006, 0.02, 8, 1);
      const beaconMaterial = new THREE.MeshStandardMaterial({
        color: '#9ce5ff',
        emissive: '#8fdcff',
        emissiveIntensity: 0.3,
        roughness: 0.35,
        metalness: 0.75,
      });
      const beaconMesh = new THREE.Mesh(beaconGeometry, beaconMaterial);
      beaconMesh.position.copy(position).addScaledVector(normal, 0.014);
      beaconMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      beaconMesh.userData.slotId = slot.id;
      root.add(beaconMesh);

      const pickGeometry = new THREE.SphereGeometry(0.03, 10, 8);
      const pickMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
      const pickMesh = new THREE.Mesh(pickGeometry, pickMaterial);
      pickMesh.position.copy(position).addScaledVector(normal, 0.012);
      pickMesh.userData.slotId = slot.id;
      root.add(pickMesh);

      items.push({ slot, decalMesh, beaconMesh, pickMesh });
    }

    return { root, items };
  }

  setSelected(state: PlanetSlotRenderState | null, slotId: string | null) {
    if (!state) return;

    for (const item of state.items) {
      const selected = slotId === item.slot.id;
      const decalMaterial = item.decalMesh.material as THREE.MeshStandardMaterial;
      decalMaterial.emissiveIntensity = selected ? 0.66 : 0.24;
      decalMaterial.opacity = selected ? 0.9 : 0.72;

      const beaconMaterial = item.beaconMesh.material as THREE.MeshStandardMaterial;
      beaconMaterial.emissiveIntensity = selected ? 0.8 : 0.3;
      item.beaconMesh.scale.setScalar(selected ? 1.2 : 1);
    }
  }

  dispose(state: PlanetSlotRenderState | null) {
    if (!state) return;
    state.root.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) return;
      const mesh = obj as THREE.Mesh;
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((material) => material.dispose());
      } else {
        mesh.material.dispose();
      }
    });
  }
}
