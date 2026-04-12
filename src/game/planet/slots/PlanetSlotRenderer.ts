import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { PlanetSettlementSlot } from '@/game/planet/slots/types';

const SLOT_INSET = 0.006;

export class PlanetSlotRenderer {
  private readonly root = new THREE.Group();
  private readonly baseMesh: THREE.InstancedMesh;
  private readonly highlightMesh: THREE.Mesh;
  private readonly slots: PlanetSettlementSlot[];

  constructor(slots: PlanetSettlementSlot[]) {
    this.slots = slots;
    this.baseMesh = this.createBaseInstancedMesh(slots);
    this.baseMesh.renderOrder = 6;
    this.root.add(this.baseMesh);

    this.highlightMesh = this.createHighlightMesh();
    this.highlightMesh.visible = false;
    this.highlightMesh.renderOrder = 7;
    this.root.add(this.highlightMesh);
  }

  get object3d() {
    return this.root;
  }

  pick(raycaster: THREE.Raycaster): number | null {
    const hits = raycaster.intersectObject(this.baseMesh, false);
    if (hits.length === 0) return null;
    const instanceId = hits[0].instanceId;
    if (typeof instanceId !== 'number') return null;
    return this.slots[instanceId]?.index ?? null;
  }

  setSelectedIndex(index: number | null) {
    if (index == null || !this.slots[index]) {
      this.highlightMesh.visible = false;
      return;
    }

    const slot = this.slots[index];
    const position = new THREE.Vector3(...slot.position);
    const normal = new THREE.Vector3(...slot.normal).normalize();
    const tangent = new THREE.Vector3(0, 1, 0);
    if (Math.abs(normal.dot(tangent)) > 0.95) tangent.set(1, 0, 0);
    tangent.cross(normal).normalize();
    const bitangent = normal.clone().cross(tangent).normalize();

    const basis = new THREE.Matrix4().makeBasis(tangent, bitangent, normal);
    const translation = new THREE.Matrix4().makeTranslation(
      position.x - normal.x * SLOT_INSET,
      position.y - normal.y * SLOT_INSET,
      position.z - normal.z * SLOT_INSET,
    );

    this.highlightMesh.matrixAutoUpdate = false;
    this.highlightMesh.matrix.copy(translation.multiply(basis));
    this.highlightMesh.visible = true;
  }

  dispose() {
    this.baseMesh.geometry.dispose();
    if (Array.isArray(this.baseMesh.material)) {
      this.baseMesh.material.forEach((material) => material.dispose());
    } else {
      this.baseMesh.material.dispose();
    }

    this.highlightMesh.geometry.dispose();
    if (Array.isArray(this.highlightMesh.material)) {
      this.highlightMesh.material.forEach((material) => material.dispose());
    } else {
      this.highlightMesh.material.dispose();
    }

    this.root.clear();
  }

  private createBaseInstancedMesh(slots: PlanetSettlementSlot[]) {
    const geometry = this.createSlotGeometry();
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#6ca7be'),
      emissive: new THREE.Color('#2b7aa1'),
      emissiveIntensity: 0.18,
      roughness: 0.56,
      metalness: 0.24,
      transparent: true,
      opacity: 0.92,
    });

    const mesh = new THREE.InstancedMesh(geometry, material, slots.length);
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    mesh.frustumCulled = false;

    const matrix = new THREE.Matrix4();
    const scale = new THREE.Matrix4().makeScale(0.028, 0.028, 0.028);

    for (let i = 0; i < slots.length; i += 1) {
      const slot = slots[i];
      const position = new THREE.Vector3(...slot.position);
      const normal = new THREE.Vector3(...slot.normal).normalize();
      const tangent = new THREE.Vector3(0, 1, 0);
      if (Math.abs(normal.dot(tangent)) > 0.95) tangent.set(1, 0, 0);
      tangent.cross(normal).normalize();
      const bitangent = normal.clone().cross(tangent).normalize();

      const basis = new THREE.Matrix4().makeBasis(tangent, bitangent, normal);
      const translation = new THREE.Matrix4().makeTranslation(
        position.x - normal.x * SLOT_INSET,
        position.y - normal.y * SLOT_INSET,
        position.z - normal.z * SLOT_INSET,
      );

      matrix.copy(translation).multiply(basis).multiply(scale);
      mesh.setMatrixAt(i, matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }

  private createSlotGeometry() {
    const outer = new THREE.RingGeometry(0.72, 1, 6);
    const inner = new THREE.CircleGeometry(0.45, 6);
    inner.translate(0, 0, 0.0025);
    const beacon = new THREE.CylinderGeometry(0.05, 0.05, 0.11, 6);
    beacon.rotateX(Math.PI / 2);
    beacon.translate(0, 0, 0.058);

    const pieces = [outer, inner, beacon];
    const merged = BufferGeometryUtils.mergeGeometries(pieces, false);
    pieces.forEach((piece) => piece.dispose());
    if (!merged) {
      throw new Error('Failed to merge slot marker geometry');
    }
    return merged;
  }

  private createHighlightMesh() {
    const geometry = new THREE.TorusGeometry(0.034, 0.0028, 10, 18);
    geometry.rotateX(Math.PI / 2);

    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#b9f1ff'),
      transparent: true,
      opacity: 0.88,
    });

    return new THREE.Mesh(geometry, material);
  }
}
