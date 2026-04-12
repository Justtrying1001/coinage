import {
  Group,
  Mesh,
  MeshStandardMaterial,
  OrthographicCamera,
  RingGeometry,
  Scene,
  Vector3,
  WebGLRenderer,
  type Object3D,
  type Material,
  type BufferGeometry,
  CylinderGeometry,
} from 'three';
import { CityAssetRegistry } from '@/game/city/assets/CityAssetRegistry';
import { createCityScene } from '@/game/city/scene/createCityScene';
import type { CityInteractionTarget, CityViewModel } from '@/game/city/runtime/cityViewModel';
import { CityRaycaster } from '@/game/city/interaction/CityRaycaster';

interface CitySlotVisual {
  slot: Mesh;
  ring: Mesh;
  buildingRoot: Group;
}

export class CitySceneController {
  readonly renderer: WebGLRenderer;
  readonly camera: OrthographicCamera;

  private readonly scene: Scene;
  private readonly cityRoot: Group;
  private readonly raycaster = new CityRaycaster();
  private readonly assets = new CityAssetRegistry();
  private readonly slotVisuals = new Map<string, CitySlotVisual>();
  private width = 1;
  private height = 1;

  constructor(private readonly host: HTMLDivElement, private viewModel: CityViewModel) {
    this.renderer = new WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.domElement.className = 'render-surface render-surface--city3d';

    this.camera = new OrthographicCamera(-18, 18, 12, -12, 0.1, 200);
    this.camera.position.set(22, 26, 22);
    this.camera.lookAt(0, 0, 0);

    const scaffold = createCityScene(viewModel.cityTheme);
    this.scene = scaffold.scene;
    this.cityRoot = scaffold.cityRoot;
  }

  mount() {
    this.host.appendChild(this.renderer.domElement);
    this.buildStaticScene();
    this.syncFromViewModel(this.viewModel);
  }

  resize(width: number, height: number) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    const aspect = this.width / this.height;
    const halfHeight = 14;
    this.camera.left = -halfHeight * aspect;
    this.camera.right = halfHeight * aspect;
    this.camera.top = halfHeight;
    this.camera.bottom = -halfHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height, false);
  }

  update() {
    this.renderer.render(this.scene, this.camera);
  }

  pickTarget(clientX: number, clientY: number): CityInteractionTarget {
    return this.raycaster.pick(clientX, clientY, this.renderer.domElement, this.camera, this.scene);
  }

  setViewModel(next: CityViewModel) {
    this.viewModel = next;
    this.syncFromViewModel(next);
  }

  destroy() {
    this.renderer.dispose();
    this.assets.dispose();
    this.disposeSceneTree(this.scene);
    this.slotVisuals.clear();
    this.renderer.domElement.remove();
  }

  private buildStaticScene() {
    const slotGeometry = new CylinderGeometry(1.9, 2.2, 0.3, 28);
    const ringGeometry = new RingGeometry(2.22, 2.75, 34);

    for (const slot of this.viewModel.layout.slots) {
      const slotMaterial = new MeshStandardMaterial({
        color: slot.startsLocked ? 0x5a6574 : this.viewModel.cityTheme.padColor,
        roughness: 0.7,
        metalness: 0.18,
      });
      const ringMaterial = new MeshStandardMaterial({
        color: slot.startsLocked ? 0x495361 : this.viewModel.cityTheme.padEdgeColor,
        roughness: 0.36,
        metalness: 0.26,
      });

      const slotMesh = new Mesh(slotGeometry, slotMaterial);
      slotMesh.position.set(slot.position.x, slot.position.y + 0.16, slot.position.z);
      slotMesh.rotation.y = slot.rotationY;
      slotMesh.scale.setScalar(slot.scale ?? 1);
      slotMesh.userData.cityTargetType = 'slot';
      slotMesh.userData.citySlotId = slot.id;

      const ringMesh = new Mesh(ringGeometry, ringMaterial);
      ringMesh.position.set(slot.position.x, slot.position.y + 0.34, slot.position.z);
      ringMesh.rotation.set(-Math.PI / 2, slot.rotationY, 0);

      const buildingRoot = new Group();
      buildingRoot.position.set(slot.position.x, slot.position.y + 0.25, slot.position.z);
      buildingRoot.rotation.y = slot.rotationY;

      this.cityRoot.add(slotMesh);
      this.cityRoot.add(ringMesh);
      this.cityRoot.add(buildingRoot);

      this.slotVisuals.set(slot.id, { slot: slotMesh, ring: ringMesh, buildingRoot });
    }

    const frostPropGeometry = new CylinderGeometry(0.28, 0.45, 0.9, 6);
    const frostMaterial = new MeshStandardMaterial({ color: 0xb8dbf8, roughness: 0.42, metalness: 0.1 });
    const propPositions = [
      new Vector3(-13.5, 0.42, -8.8),
      new Vector3(-13.2, 0.42, -6.9),
      new Vector3(12.9, 0.42, 9.6),
      new Vector3(10.4, 0.42, 11.8),
      new Vector3(2.2, 0.42, -13.2),
    ];

    for (const position of propPositions) {
      const prop = new Mesh(frostPropGeometry, frostMaterial);
      prop.position.copy(position);
      this.cityRoot.add(prop);
    }
  }

  private syncFromViewModel(model: CityViewModel) {
    for (const slot of model.layout.slots) {
      const visuals = this.slotVisuals.get(slot.id);
      if (!visuals) continue;

      this.applyRingColor(visuals.ring, model, slot.id, slot.startsLocked === true);

      while (visuals.buildingRoot.children.length > 0) {
        const child = visuals.buildingRoot.children[0];
        visuals.buildingRoot.remove(child);
      }

      const placed = model.placedBuildings[slot.id];
      if (!placed) continue;

      const buildingVisual = this.assets.createBuildingVisual(placed.buildingType, placed.level);
      buildingVisual.userData.cityTargetType = 'building';
      buildingVisual.userData.citySlotId = slot.id;
      visuals.buildingRoot.add(buildingVisual);
    }
  }

  private applyRingColor(ring: Mesh, model: CityViewModel, slotId: string, isLocked: boolean) {
    const material = ring.material as MeshStandardMaterial;
    if (isLocked) {
      material.color.setHex(0x475666);
      return;
    }

    if (model.selectedTarget.type !== 'none' && model.selectedTarget.slotId === slotId) {
      material.color.set(model.cityTheme.accentColor);
      return;
    }

    material.color.set(model.cityTheme.padEdgeColor);
  }

  private disposeSceneTree(root: Object3D) {
    root.traverse((object) => {
      const mesh = object as Mesh;
      const geometry = mesh.geometry as BufferGeometry | undefined;
      if (geometry) geometry.dispose();

      const material = mesh.material as Material | Material[] | undefined;
      if (!material) return;
      if (Array.isArray(material)) {
        material.forEach((entry) => entry.dispose());
      } else {
        material.dispose();
      }
    });
  }
}
