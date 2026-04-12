import * as THREE from 'three';
import type { PlanetSettlementSlot } from '@/game/planet/slots/types';

export class PlanetSlotRenderer {
  readonly root = new THREE.Group();

  private ringMesh: THREE.InstancedMesh | null = null;
  private diskMesh: THREE.InstancedMesh | null = null;
  private beaconMesh: THREE.InstancedMesh | null = null;
  private selectionHalo: THREE.Mesh;
  private slots: PlanetSettlementSlot[] = [];
  private selectedIndex: number | null = null;

  private readonly up = new THREE.Vector3(0, 1, 0);
  private readonly mat = new THREE.Matrix4();
  private readonly pos = new THREE.Vector3();
  private readonly normal = new THREE.Vector3();
  private readonly quat = new THREE.Quaternion();
  private readonly scale = new THREE.Vector3(1, 1, 1);

  constructor() {
    const haloGeometry = new THREE.RingGeometry(0.028, 0.034, 36);
    haloGeometry.rotateX(-Math.PI / 2);
    const haloMaterial = new THREE.MeshStandardMaterial({
      color: 0x95deff,
      emissive: 0x6ad8ff,
      emissiveIntensity: 0.58,
      transparent: true,
      opacity: 0.82,
      roughness: 0.28,
      metalness: 0.52,
      depthWrite: false,
    });
    this.selectionHalo = new THREE.Mesh(haloGeometry, haloMaterial);
    this.selectionHalo.visible = false;
    this.root.add(this.selectionHalo);
  }

  setSlots(slots: PlanetSettlementSlot[]) {
    this.disposeInstanced();
    this.slots = slots;
    this.selectedIndex = null;
    this.selectionHalo.visible = false;

    if (slots.length === 0) return;

    const ringGeometry = new THREE.TorusGeometry(0.024, 0.0023, 8, 32);
    ringGeometry.rotateX(Math.PI / 2);
    const diskGeometry = new THREE.CylinderGeometry(0.016, 0.016, 0.0014, 24);
    const beaconGeometry = new THREE.CylinderGeometry(0.0016, 0.0016, 0.012, 8);

    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0x8eb8cb,
      emissive: 0x4fb9e5,
      emissiveIntensity: 0.22,
      roughness: 0.34,
      metalness: 0.72,
    });
    const diskMaterial = new THREE.MeshStandardMaterial({
      color: 0x3e5364,
      emissive: 0x213949,
      emissiveIntensity: 0.1,
      roughness: 0.62,
      metalness: 0.42,
      transparent: true,
      opacity: 0.94,
    });
    const beaconMaterial = new THREE.MeshStandardMaterial({
      color: 0xa4cbde,
      emissive: 0x79e0ff,
      emissiveIntensity: 0.32,
      roughness: 0.24,
      metalness: 0.8,
    });

    this.ringMesh = new THREE.InstancedMesh(ringGeometry, ringMaterial, slots.length);
    this.diskMesh = new THREE.InstancedMesh(diskGeometry, diskMaterial, slots.length);
    this.beaconMesh = new THREE.InstancedMesh(beaconGeometry, beaconMaterial, slots.length);

    this.ringMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.ringMesh.userData.slotMarker = true;

    for (let i = 0; i < slots.length; i += 1) {
      const slot = slots[i];
      this.placeInstance(i, slot, this.ringMesh, 0.005);
      this.placeInstance(i, slot, this.diskMesh, 0.0036);
      this.placeInstance(i, slot, this.beaconMesh, 0.0105);
    }

    this.ringMesh.instanceMatrix.needsUpdate = true;
    this.diskMesh.instanceMatrix.needsUpdate = true;
    this.beaconMesh.instanceMatrix.needsUpdate = true;

    this.root.add(this.diskMesh);
    this.root.add(this.ringMesh);
    this.root.add(this.beaconMesh);
  }

  pick(intersection: THREE.Intersection<THREE.Object3D<THREE.Object3DEventMap>>) {
    if (!this.ringMesh || intersection.object !== this.ringMesh) return null;
    const instanceId = intersection.instanceId;
    if (typeof instanceId !== 'number') return null;
    return this.setSelectedIndex(instanceId);
  }

  setSelectedIndex(next: number | null) {
    if (next === null || next < 0 || next >= this.slots.length) {
      this.selectedIndex = null;
      this.selectionHalo.visible = false;
      return null;
    }

    this.selectedIndex = next;
    const slot = this.slots[next];
    this.normal.fromArray(slot.normal).normalize();
    this.pos.fromArray(slot.position).addScaledVector(this.normal, 0.012);
    this.quat.setFromUnitVectors(this.up, this.normal);
    this.selectionHalo.position.copy(this.pos);
    this.selectionHalo.quaternion.copy(this.quat);
    this.selectionHalo.visible = true;
    return slot;
  }

  clearSelection() {
    this.setSelectedIndex(null);
  }

  getSelectedSlot() {
    if (this.selectedIndex === null) return null;
    return this.slots[this.selectedIndex] ?? null;
  }

  getSlots() {
    return this.slots;
  }

  dispose() {
    this.disposeInstanced();
    this.selectionHalo.geometry.dispose();
    (this.selectionHalo.material as THREE.Material).dispose();
    this.root.remove(this.selectionHalo);
  }

  private placeInstance(index: number, slot: PlanetSettlementSlot, mesh: THREE.InstancedMesh, lift: number) {
    this.pos.fromArray(slot.position);
    this.normal.fromArray(slot.normal).normalize();
    this.pos.addScaledVector(this.normal, lift);
    this.quat.setFromUnitVectors(this.up, this.normal);
    this.mat.compose(this.pos, this.quat, this.scale);
    mesh.setMatrixAt(index, this.mat);
  }

  private disposeInstanced() {
    const meshes = [this.ringMesh, this.diskMesh, this.beaconMesh];
    for (const mesh of meshes) {
      if (!mesh) continue;
      this.root.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    this.ringMesh = null;
    this.diskMesh = null;
    this.beaconMesh = null;
  }
}
