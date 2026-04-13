import {
  CircleGeometry,
  Color,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Quaternion,
  Vector3,
} from 'three';
import type { CityViewModel } from '@/game/city/runtime/cityViewModel';
import type { CityTerrainRuntime } from '@/game/city/scene/CityTerrainRuntime';
import type { CitySlotId } from '@/game/city/data/citySlots';

export interface SlotAnchor {
  id: CitySlotId;
  position: Vector3;
  normal: Vector3;
  rotationY: number;
  interactionProxy: Mesh;
  terraceMesh: Mesh;
}

export class CitySlotAnchors {
  readonly group = new Group();
  readonly anchors = new Map<CitySlotId, SlotAnchor>();

  private readonly interactionPickables: Object3D[] = [];
  private readonly terraceMaterial: MeshStandardMaterial;
  private readonly lockedTerraceMaterial: MeshStandardMaterial;

  constructor(viewModel: CityViewModel, terrain: CityTerrainRuntime, terrainAccent: number) {
    this.terraceMaterial = new MeshStandardMaterial({
      color: new Color(terrainAccent).multiplyScalar(0.86),
      roughness: 0.92,
      metalness: 0.05,
    });
    this.lockedTerraceMaterial = new MeshStandardMaterial({
      color: 0x5c6a75,
      roughness: 0.94,
      metalness: 0.04,
    });

    for (const slot of viewModel.layout.slots) {
      const x = slot.position.x * 1.9;
      const z = slot.position.z * 1.9;
      const y = terrain.sampleHeight(x, z);
      const normal = terrain.sampleNormal(x, z);

      const terrace = new Mesh(new CircleGeometry(2.8 * (slot.scale ?? 1), 24), slot.startsLocked ? this.lockedTerraceMaterial : this.terraceMaterial);
      terrace.position.set(x, y + 0.06, z);
      terrace.setRotationFromQuaternion(new Quaternion().setFromUnitVectors(Object3D.DEFAULT_UP, normal));
      terrace.rotateX(-Math.PI / 2);
      this.group.add(terrace);

      const proxy = new Mesh(new CircleGeometry(2.35 * (slot.scale ?? 1), 18), new MeshStandardMaterial({ visible: false }));
      proxy.position.set(x, y + 0.22, z);
      proxy.setRotationFromQuaternion(new Quaternion().setFromUnitVectors(Object3D.DEFAULT_UP, normal));
      proxy.userData.cityTargetType = 'slot';
      proxy.userData.citySlotId = slot.id;
      this.group.add(proxy);
      this.interactionPickables.push(proxy);

      this.anchors.set(slot.id, {
        id: slot.id,
        position: new Vector3(x, y, z),
        normal,
        rotationY: slot.rotationY,
        interactionProxy: proxy,
        terraceMesh: terrace,
      });
    }
  }

  setSelectedSlot(slotId: CitySlotId | null) {
    for (const [id, anchor] of this.anchors.entries()) {
      const material = anchor.terraceMesh.material as MeshStandardMaterial;
      const selected = slotId != null && slotId === id;
      material.emissive.set(selected ? 0x8fdfff : 0x000000);
      material.emissiveIntensity = selected ? 0.12 : 0;
    }
  }

  dispose() {
    this.group.traverse((object) => {
      const mesh = object as Mesh;
      mesh.geometry?.dispose();
      const material = mesh.material as MeshStandardMaterial | MeshStandardMaterial[] | undefined;
      if (!material) return;
      if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
      else material.dispose();
    });
    this.anchors.clear();
    this.interactionPickables.length = 0;
  }
}
