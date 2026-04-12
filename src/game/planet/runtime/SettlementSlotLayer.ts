import * as THREE from 'three';
import type { SettlementSlot } from '@/game/planet/runtime/SettlementSlots';

const BASE_COLOR = new THREE.Color(0x7dd5ff);
const SELECTED_COLOR = new THREE.Color(0xe6fbff);

export class SettlementSlotLayer {
  readonly group = new THREE.Group();
  readonly mesh: THREE.InstancedMesh;

  private selectedIndex: number | null = null;
  private readonly tempMatrix = new THREE.Matrix4();
  private readonly tempQuat = new THREE.Quaternion();
  private readonly tempPos = new THREE.Vector3();
  private readonly tempScale = new THREE.Vector3();

  constructor(private readonly slots: SettlementSlot[]) {
    const geometry = new THREE.RingGeometry(0.018, 0.026, 24);
    const material = new THREE.MeshBasicMaterial({
      color: BASE_COLOR,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
      vertexColors: true,
    });

    this.mesh = new THREE.InstancedMesh(geometry, material, slots.length);
    this.mesh.renderOrder = 6;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    for (let i = 0; i < slots.length; i += 1) {
      const slot = slots[i];
      this.tempPos.copy(slot.position).addScaledVector(slot.normal, -0.0025);
      this.tempQuat.setFromUnitVectors(THREE.Object3D.DEFAULT_UP, slot.normal);
      this.tempScale.setScalar(1);
      this.tempMatrix.compose(this.tempPos, this.tempQuat, this.tempScale);
      this.mesh.setMatrixAt(i, this.tempMatrix);
      this.mesh.setColorAt(i, BASE_COLOR);
    }

    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    this.mesh.instanceMatrix.needsUpdate = true;
    this.group.add(this.mesh);
  }

  getSelectedIndex() {
    return this.selectedIndex;
  }

  setSelectedIndex(nextIndex: number | null) {
    if (nextIndex === this.selectedIndex) return;

    if (this.selectedIndex != null) {
      this.applyInstanceState(this.selectedIndex, false);
    }
    this.selectedIndex = nextIndex;
    if (this.selectedIndex != null) {
      this.applyInstanceState(this.selectedIndex, true);
    }

    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  dispose() {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    this.group.clear();
  }

  private applyInstanceState(index: number, selected: boolean) {
    const slot = this.slots[index];
    if (!slot) return;

    this.tempPos.copy(slot.position).addScaledVector(slot.normal, selected ? -0.0028 : -0.0025);
    this.tempQuat.setFromUnitVectors(THREE.Object3D.DEFAULT_UP, slot.normal);
    this.tempScale.setScalar(selected ? 1.22 : 1);
    this.tempMatrix.compose(this.tempPos, this.tempQuat, this.tempScale);

    this.mesh.setMatrixAt(index, this.tempMatrix);
    this.mesh.setColorAt(index, selected ? SELECTED_COLOR : BASE_COLOR);
  }
}
