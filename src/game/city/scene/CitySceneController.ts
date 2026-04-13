import {
  ACESFilmicToneMapping,
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  SRGBColorSpace,
  Scene,
  Vector3,
  WebGLRenderer,
  type Object3D,
  type Material,
  type BufferGeometry,
  CylinderGeometry,
  RingGeometry,
  CircleGeometry,
} from 'three';
import { CityAssetRegistry } from '@/game/city/assets/CityAssetRegistry';
import { createCityScene } from '@/game/city/scene/createCityScene';
import type { CityInteractionTarget, CityViewModel } from '@/game/city/runtime/cityViewModel';
import { CityRaycaster } from '@/game/city/interaction/CityRaycaster';

interface CitySlotVisual {
  foundation: Mesh;
  ring: Mesh;
  marker: Mesh;
  pylons: Mesh[];
  buildingRoot: Group;
}

export class CitySceneController {
  readonly renderer: WebGLRenderer;
  readonly camera: PerspectiveCamera;

  private readonly scene: Scene;
  private readonly cityRoot: Group;
  private readonly sampleGroundHeight: (x: number, z: number) => number;
  private readonly raycaster = new CityRaycaster();
  private readonly assets = new CityAssetRegistry();
  private readonly slotVisuals = new Map<string, CitySlotVisual>();

  constructor(private readonly host: HTMLDivElement, private viewModel: CityViewModel, seed: number) {
    this.renderer = new WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.06;
    this.renderer.domElement.className = 'render-surface render-surface--city3d';

    this.camera = new PerspectiveCamera(44, 1, 0.1, 260);
    this.camera.position.set(-19, 17, 28);
    this.camera.lookAt(0, 3.5, 0);

    const scaffold = createCityScene(viewModel.cityTheme, seed);
    this.scene = scaffold.scene;
    this.cityRoot = scaffold.cityRoot;
    this.sampleGroundHeight = scaffold.sampleGroundHeight;
  }

  mount() {
    this.host.appendChild(this.renderer.domElement);
    this.buildStaticScene();
    this.syncFromViewModel(this.viewModel);
  }

  resize(width: number, height: number) {
    const safeWidth = Math.max(1, width);
    const safeHeight = Math.max(1, height);
    this.camera.aspect = safeWidth / safeHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(safeWidth, safeHeight, false);
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
    const baseGeometry = new CylinderGeometry(2.35, 2.7, 0.56, 18);
    const ringGeometry = new RingGeometry(1.9, 2.35, 24);
    const markerGeometry = new CircleGeometry(1.24, 20);
    const pylonGeometry = new BoxGeometry(0.2, 0.9, 0.2);

    for (const slot of this.viewModel.layout.slots) {
      const y = this.sampleGroundHeight(slot.position.x, slot.position.z);
      const scale = slot.scale ?? 1;

      const baseMaterial = new MeshStandardMaterial({
        color: slot.startsLocked ? 0x5f6068 : this.viewModel.cityTheme.padColor,
        roughness: 0.64,
        metalness: 0.21,
      });
      const ringMaterial = new MeshStandardMaterial({
        color: this.viewModel.cityTheme.structureTrimColor,
        roughness: 0.2,
        metalness: 0.72,
        emissive: this.viewModel.cityTheme.padGlow,
        emissiveIntensity: 0.08,
      });
      const markerMaterial = new MeshStandardMaterial({
        color: this.viewModel.cityTheme.structureBaseColor,
        roughness: 0.42,
        metalness: 0.46,
      });

      const foundation = new Mesh(baseGeometry, baseMaterial);
      foundation.position.set(slot.position.x, y + 0.2, slot.position.z);
      foundation.rotation.y = slot.rotationY;
      foundation.scale.setScalar(scale);
      foundation.userData.cityTargetType = 'slot';
      foundation.userData.citySlotId = slot.id;

      const ring = new Mesh(ringGeometry, ringMaterial);
      ring.position.set(slot.position.x, y + 0.49, slot.position.z);
      ring.rotation.set(-Math.PI / 2, slot.rotationY, 0);
      ring.scale.setScalar(scale);

      const marker = new Mesh(markerGeometry, markerMaterial);
      marker.position.set(slot.position.x, y + 0.5, slot.position.z);
      marker.rotation.set(-Math.PI / 2, slot.rotationY, 0);
      marker.scale.setScalar(scale * 0.85);

      const pylons: Mesh[] = [];
      const supportOffsets = [
        new Vector3(1.55, -0.2, 1.55),
        new Vector3(-1.55, -0.2, 1.55),
        new Vector3(1.55, -0.2, -1.55),
        new Vector3(-1.55, -0.2, -1.55),
      ];
      for (const offset of supportOffsets) {
        const pylon = new Mesh(pylonGeometry, markerMaterial);
        pylon.position.set(slot.position.x + offset.x * scale, y + offset.y, slot.position.z + offset.z * scale);
        pylons.push(pylon);
        this.cityRoot.add(pylon);
      }

      const buildingRoot = new Group();
      buildingRoot.position.set(slot.position.x, y + 0.58, slot.position.z);
      buildingRoot.rotation.y = slot.rotationY;

      this.cityRoot.add(foundation, ring, marker, buildingRoot);
      this.slotVisuals.set(slot.id, { foundation, ring, marker, pylons, buildingRoot });
    }
  }

  private syncFromViewModel(model: CityViewModel) {
    for (const slot of model.layout.slots) {
      const visuals = this.slotVisuals.get(slot.id);
      if (!visuals) continue;

      this.applySlotColor(visuals, model, slot.id, slot.startsLocked === true);

      while (visuals.buildingRoot.children.length > 0) {
        visuals.buildingRoot.remove(visuals.buildingRoot.children[0]);
      }

      const placed = model.placedBuildings[slot.id];
      if (!placed) continue;

      const buildingVisual = this.assets.createBuildingVisual(placed.buildingType, placed.level, model.cityTheme);
      buildingVisual.userData.cityTargetType = 'building';
      buildingVisual.userData.citySlotId = slot.id;
      visuals.buildingRoot.add(buildingVisual);
    }
  }

  private applySlotColor(visuals: CitySlotVisual, model: CityViewModel, slotId: string, isLocked: boolean) {
    const baseMaterial = visuals.foundation.material as MeshStandardMaterial;
    const ringMaterial = visuals.ring.material as MeshStandardMaterial;
    const markerMaterial = visuals.marker.material as MeshStandardMaterial;

    if (isLocked) {
      baseMaterial.color.setHex(0x585f6a);
      markerMaterial.color.setHex(0x4f5664);
      ringMaterial.color.setHex(0x6f7480);
      ringMaterial.emissiveIntensity = 0;
      return;
    }

    const highlighted = model.selectedTarget.type !== 'none' && model.selectedTarget.slotId === slotId;
    baseMaterial.color.set(highlighted ? model.cityTheme.structureTrimColor : model.cityTheme.padColor);
    markerMaterial.color.set(model.cityTheme.structureBaseColor);
    ringMaterial.color.set(highlighted ? model.cityTheme.padGlow : model.cityTheme.structureTrimColor);
    ringMaterial.emissive.set(model.cityTheme.padGlow);
    ringMaterial.emissiveIntensity = highlighted ? 0.28 : 0.09;
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
