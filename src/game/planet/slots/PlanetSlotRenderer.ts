import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { PlanetCitySlot } from '@/game/planet/slots/types';

const SELECTED_EMPTY_COLOR = new THREE.Color('#66d6ff');
const EMPTY_COLOR = new THREE.Color('#2f7ea8');
const OCCUPIED_COLOR = new THREE.Color('#71f7d0');
const SELECTED_OCCUPIED_COLOR = new THREE.Color('#d5fff2');

export class PlanetSlotRenderer {
  readonly group = new THREE.Group();

  private readonly emptyMesh: THREE.InstancedMesh;
  private readonly occupiedMesh: THREE.InstancedMesh;
  private readonly highlightMesh: THREE.Mesh;
  private readonly slots: PlanetCitySlot[];
  private readonly emptySlotIndexes: number[] = [];
  private readonly occupiedSlotIndexes: number[] = [];
  private selectedSlotIndex: number | null = null;

  constructor(slots: PlanetCitySlot[]) {
    this.slots = slots;
    this.group.name = 'planet-slots';

    const emptyGeometry = new THREE.CylinderGeometry(0.035, 0.035, 0.012, 18, 1, true);
    const emptyMaterial = new THREE.MeshStandardMaterial({
      color: EMPTY_COLOR,
      emissive: 0x0b3048,
      emissiveIntensity: 0.45,
      roughness: 0.42,
      metalness: 0.22,
      transparent: true,
      opacity: 0.92,
      depthWrite: true,
    });

    const occupiedGeometry = createOccupiedSlotGeometry();
    const occupiedMaterial = new THREE.MeshStandardMaterial({
      color: OCCUPIED_COLOR,
      emissive: 0x0a5846,
      emissiveIntensity: 0.38,
      roughness: 0.34,
      metalness: 0.3,
    });

    const emptySlots = slots.filter((slot) => slot.state === 'empty');
    const occupiedSlots = slots.filter((slot) => slot.state === 'occupied');

    this.emptyMesh = new THREE.InstancedMesh(emptyGeometry, emptyMaterial, emptySlots.length);
    this.emptyMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.emptyMesh.name = 'planet-slots-empty';
    this.group.add(this.emptyMesh);

    this.occupiedMesh = new THREE.InstancedMesh(occupiedGeometry, occupiedMaterial, occupiedSlots.length);
    this.occupiedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.occupiedMesh.name = 'planet-slots-occupied';
    this.group.add(this.occupiedMesh);

    this.highlightMesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.055, 0.0055, 12, 32),
      new THREE.MeshBasicMaterial({ color: 0x8eeaff, transparent: true, opacity: 0.95 }),
    );
    this.highlightMesh.visible = false;
    this.group.add(this.highlightMesh);

    this.rebuildInstances();
  }

  getSlots() {
    return this.slots;
  }

  getSelectedSlot() {
    if (this.selectedSlotIndex === null) return null;
    return this.slots[this.selectedSlotIndex] ?? null;
  }

  setSelectedSlotByIndex(slotIndex: number | null) {
    if (slotIndex !== null && (slotIndex < 0 || slotIndex >= this.slots.length)) return;
    this.selectedSlotIndex = slotIndex;
    this.updateSelectionVisuals();
  }

  clearSelection() {
    this.selectedSlotIndex = null;
    this.updateSelectionVisuals();
  }

  pickSlotFromIntersection(intersection: THREE.Intersection<THREE.Object3D<THREE.Object3DEventMap>>) {
    const instanceId = intersection.instanceId;
    if (typeof instanceId !== 'number') return null;

    if (intersection.object === this.emptyMesh) {
      return this.emptySlotIndexes[instanceId] ?? null;
    }

    if (intersection.object === this.occupiedMesh) {
      return this.occupiedSlotIndexes[instanceId] ?? null;
    }

    return null;
  }

  raycast(raycaster: THREE.Raycaster) {
    return raycaster.intersectObjects([this.emptyMesh, this.occupiedMesh], false);
  }

  dispose() {
    this.emptyMesh.geometry.dispose();
    (this.emptyMesh.material as THREE.Material).dispose();
    this.occupiedMesh.geometry.dispose();
    (this.occupiedMesh.material as THREE.Material).dispose();
    this.highlightMesh.geometry.dispose();
    (this.highlightMesh.material as THREE.Material).dispose();
  }

  private rebuildInstances() {
    const up = new THREE.Vector3(0, 1, 0);
    const position = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);
    const matrix = new THREE.Matrix4();
    const offsetNormal = new THREE.Vector3();

    let emptyIndex = 0;
    let occupiedIndex = 0;

    for (let i = 0; i < this.slots.length; i += 1) {
      const slot = this.slots[i];
      position.fromArray(slot.position);
      normal.fromArray(slot.normal).normalize();
      offsetNormal.copy(normal);
      position.addScaledVector(offsetNormal, 0.008);
      quaternion.setFromUnitVectors(up, normal);

      const yaw = hash01(0x8d41fa1f, slot.index) * Math.PI * 2;
      const yawQuat = new THREE.Quaternion().setFromAxisAngle(normal, yaw);
      quaternion.multiply(yawQuat);

      matrix.compose(position, quaternion, scale);

      if (slot.state === 'occupied') {
        this.occupiedMesh.setMatrixAt(occupiedIndex, matrix);
        this.occupiedMesh.setColorAt(occupiedIndex, OCCUPIED_COLOR);
        this.occupiedSlotIndexes[occupiedIndex] = i;
        occupiedIndex += 1;
      } else {
        this.emptyMesh.setMatrixAt(emptyIndex, matrix);
        this.emptyMesh.setColorAt(emptyIndex, EMPTY_COLOR);
        this.emptySlotIndexes[emptyIndex] = i;
        emptyIndex += 1;
      }
    }

    this.emptyMesh.instanceMatrix.needsUpdate = true;
    this.occupiedMesh.instanceMatrix.needsUpdate = true;
    if (this.emptyMesh.instanceColor) this.emptyMesh.instanceColor.needsUpdate = true;
    if (this.occupiedMesh.instanceColor) this.occupiedMesh.instanceColor.needsUpdate = true;

    this.updateSelectionVisuals();
  }

  private updateSelectionVisuals() {
    for (let i = 0; i < this.emptySlotIndexes.length; i += 1) {
      const slotIndex = this.emptySlotIndexes[i];
      const isSelected = this.selectedSlotIndex === slotIndex;
      this.emptyMesh.setColorAt(i, isSelected ? SELECTED_EMPTY_COLOR : EMPTY_COLOR);
    }

    for (let i = 0; i < this.occupiedSlotIndexes.length; i += 1) {
      const slotIndex = this.occupiedSlotIndexes[i];
      const isSelected = this.selectedSlotIndex === slotIndex;
      this.occupiedMesh.setColorAt(i, isSelected ? SELECTED_OCCUPIED_COLOR : OCCUPIED_COLOR);
    }

    if (this.emptyMesh.instanceColor) this.emptyMesh.instanceColor.needsUpdate = true;
    if (this.occupiedMesh.instanceColor) this.occupiedMesh.instanceColor.needsUpdate = true;

    if (this.selectedSlotIndex === null) {
      this.highlightMesh.visible = false;
      return;
    }

    const selected = this.slots[this.selectedSlotIndex];
    if (!selected) {
      this.highlightMesh.visible = false;
      return;
    }

    const position = new THREE.Vector3().fromArray(selected.position);
    const normal = new THREE.Vector3().fromArray(selected.normal).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const rotation = new THREE.Quaternion().setFromUnitVectors(up, normal);
    this.highlightMesh.position.copy(position.addScaledVector(normal, 0.015));
    this.highlightMesh.quaternion.copy(rotation);
    this.highlightMesh.visible = true;
  }
}

function createOccupiedSlotGeometry() {
  const parts = [
    new THREE.CylinderGeometry(0.026, 0.03, 0.02, 8),
    new THREE.BoxGeometry(0.022, 0.026, 0.022),
    new THREE.BoxGeometry(0.014, 0.032, 0.014),
    new THREE.CylinderGeometry(0.005, 0.005, 0.018, 6),
  ];

  parts[1].translate(0.012, 0.019, 0);
  parts[2].translate(-0.012, 0.022, 0.008);
  parts[3].translate(0, 0.025, -0.012);

  const merged = BufferGeometryUtils.mergeGeometries(parts, true);
  if (!merged) {
    parts.forEach((part) => part.dispose());
    return new THREE.BoxGeometry(0.03, 0.03, 0.03);
  }

  merged.computeVertexNormals();
  parts.forEach((part) => part.dispose());
  return merged;
}

function hash01(seed: number, index: number) {
  const mixed = Math.imul((seed ^ (index * 0x9e3779b9)) >>> 0, 3266489917) >>> 0;
  return mixed / 0xffffffff;
}
