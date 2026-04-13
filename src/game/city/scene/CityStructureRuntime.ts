import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Quaternion,
  Vector3,
} from 'three';
import type { BuildingType } from '@/game/city/data/cityBuildings';
import type { CityViewModel, PlacedBuilding } from '@/game/city/runtime/cityViewModel';
import type { CitySlotAnchors, SlotAnchor } from '@/game/city/scene/CitySlotAnchors';

export class CityStructureRuntime {
  readonly group = new Group();
  private readonly roots = new Map<string, Group>();

  constructor(private readonly anchors: CitySlotAnchors, private readonly accentColor: number) {}

  sync(model: CityViewModel) {
    for (const slot of model.layout.slots) {
      const anchor = this.anchors.anchors.get(slot.id);
      if (!anchor) continue;

      let root = this.roots.get(slot.id);
      if (!root) {
        root = new Group();
        this.roots.set(slot.id, root);
        this.group.add(root);
      }

      while (root.children.length > 0) {
        disposeObject(root.children[0]);
        root.remove(root.children[0]);
      }

      const placed = model.placedBuildings[slot.id];
      if (!placed) continue;

      const visual = this.createEmbeddedStructure(placed, anchor);
      visual.userData.cityTargetType = 'building';
      visual.userData.citySlotId = slot.id;
      root.add(visual);
    }
  }

  dispose() {
    for (const root of this.roots.values()) {
      while (root.children.length > 0) {
        disposeObject(root.children[0]);
        root.remove(root.children[0]);
      }
      root.removeFromParent();
    }
    this.roots.clear();
  }

  private createEmbeddedStructure(placed: PlacedBuilding, anchor: SlotAnchor): Object3D {
    const root = new Group();
    root.position.copy(anchor.position);

    const terrainAlign = new Quaternion().setFromUnitVectors(Object3D.DEFAULT_UP, anchor.normal);
    root.quaternion.copy(terrainAlign);
    root.rotateY(anchor.rotationY);

    const foundationMat = new MeshStandardMaterial({
      color: 0x4f5c67,
      roughness: 0.95,
      metalness: 0.02,
    });

    const foundation = new Mesh(new CylinderGeometry(2.1, 2.35, 1.2, 18), foundationMat);
    foundation.position.y = 0.2;
    root.add(foundation);

    const cutRing = new Mesh(
      new CylinderGeometry(2.5, 2.8, 0.38, 20, 1, true),
      new MeshStandardMaterial({
        color: 0x3b4752,
        roughness: 0.98,
        metalness: 0.01,
      }),
    );
    cutRing.position.y = -0.24;
    root.add(cutRing);

    const hullMat = new MeshStandardMaterial({
      color: deriveBuildingColor(placed.buildingType),
      roughness: 0.54,
      metalness: 0.24,
      emissive: new Color(this.accentColor),
      emissiveIntensity: 0.04,
    });

    const tower = new Mesh(new CylinderGeometry(0.9, 1.1, 2.6 + placed.level * 0.55, 12), hullMat);
    tower.position.y = 1.95;
    root.add(tower);

    const annex = new Mesh(new BoxGeometry(1.9, 1 + placed.level * 0.2, 1.3), hullMat.clone());
    annex.position.set(0.98, 1.05, -0.42);
    root.add(annex);

    const mast = new Mesh(
      new CylinderGeometry(0.1, 0.12, 1.8 + placed.level * 0.2, 8),
      new MeshStandardMaterial({
        color: 0xbdd9ee,
        roughness: 0.34,
        metalness: 0.66,
        emissive: this.accentColor,
        emissiveIntensity: 0.14,
      }),
    );
    mast.position.set(-0.52, 2.2 + placed.level * 0.3, 0.62);
    root.add(mast);

    root.position.add(new Vector3(0, 0.04, 0));
    return root;
  }
}

function deriveBuildingColor(type: BuildingType): number {
  if (type === 'hq') return 0xcfdde9;
  if (type === 'mine') return 0x8da6b9;
  if (type === 'quarry') return 0xa5adb7;
  if (type === 'refinery') return 0x8ac8d6;
  if (type === 'warehouse') return 0xb5b19e;
  return 0xc6b29a;
}

function disposeObject(object: Object3D) {
  object.traverse((child) => {
    const mesh = child as Mesh;
    mesh.geometry?.dispose();
    const material = mesh.material as MeshStandardMaterial | MeshStandardMaterial[] | undefined;
    if (!material) return;
    if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
    else material.dispose();
  });
}
