import {
  ACESFilmicToneMapping,
  BoxGeometry,
  Color,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  RingGeometry,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
  type BufferGeometry,
  type Material,
  type Object3D,
} from 'three';
import { CityAssetRegistry } from '@/game/city/assets/CityAssetRegistry';
import { createCityScene } from '@/game/city/scene/createCityScene';
import { CityRaycaster } from '@/game/city/interaction/CityRaycaster';
import type { CityInteractionTarget, CityViewModel } from '@/game/city/runtime/cityViewModel';

interface CitySlotVisual {
  slot: Mesh;
  ring: Mesh;
  deck: Mesh;
  apron: Mesh;
  supports: Mesh[];
  buildingRoot: Group;
}

export class CitySceneController {
  readonly renderer: WebGLRenderer;
  readonly camera: PerspectiveCamera;

  private readonly scene: Scene;
  private readonly cityRoot: Group;
  private readonly raycaster = new CityRaycaster();
  private readonly assets = new CityAssetRegistry();
  private readonly slotVisuals = new Map<string, CitySlotVisual>();

  constructor(private readonly host: HTMLDivElement, private viewModel: CityViewModel, seed: number) {
    this.renderer = new WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.domElement.className = 'render-surface render-surface--city3d';

    this.camera = new PerspectiveCamera(42, 1, 0.1, 220);
    this.camera.position.set(viewModel.cityTheme.cameraDistance, viewModel.cityTheme.cameraHeight, viewModel.cityTheme.cameraDistance * 0.72);
    this.camera.lookAt(0, viewModel.cityTheme.cameraLookAtY, 0);

    const scaffold = createCityScene(viewModel.cityTheme, seed);
    this.scene = scaffold.scene;
    this.cityRoot = scaffold.cityRoot;
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
    const padGeometry = new CylinderGeometry(2.36, 2.72, 0.55, 10);
    const deckGeometry = new CylinderGeometry(1.75, 1.92, 0.44, 10);
    const apronGeometry = new CylinderGeometry(2.92, 3.28, 0.32, 10);
    const trimGeometry = new RingGeometry(1.92, 2.45, 10);
    const supportGeometry = new BoxGeometry(0.26, 1.05, 0.26);

    for (const slot of this.viewModel.layout.slots) {
      const slotColor = slot.startsLocked
        ? new Color(0x596675)
        : new Color(this.viewModel.cityTheme.padColor).lerp(new Color(this.viewModel.cityTheme.foundationColor), 0.42);

      const baseMaterial = new MeshStandardMaterial({
        color: slotColor,
        roughness: 0.58,
        metalness: 0.24,
      });
      const deckMaterial = new MeshStandardMaterial({
        color: this.viewModel.cityTheme.metalColor,
        roughness: 0.3,
        metalness: 0.76,
      });
      const apronMaterial = new MeshStandardMaterial({
        color: this.viewModel.cityTheme.foundationColor,
        roughness: 0.75,
        metalness: 0.14,
      });
      const trimMaterial = new MeshStandardMaterial({
        color: this.viewModel.cityTheme.padTrimColor,
        roughness: 0.24,
        metalness: 0.84,
        emissive: this.viewModel.cityTheme.emissiveAccent,
        emissiveIntensity: 0.08,
      });

      const slotMesh = new Mesh(padGeometry, baseMaterial);
      slotMesh.position.set(slot.position.x, slot.position.y + 0.1, slot.position.z);
      slotMesh.rotation.y = slot.rotationY;
      slotMesh.scale.setScalar(slot.scale ?? 1);
      slotMesh.userData.cityTargetType = 'slot';
      slotMesh.userData.citySlotId = slot.id;

      const deckMesh = new Mesh(deckGeometry, deckMaterial);
      deckMesh.position.set(slot.position.x, slot.position.y + 0.5, slot.position.z);
      deckMesh.rotation.y = slot.rotationY;
      deckMesh.scale.setScalar(slot.scale ?? 1);

      const apronMesh = new Mesh(apronGeometry, apronMaterial);
      apronMesh.position.set(slot.position.x, slot.position.y - 0.08, slot.position.z);
      apronMesh.rotation.y = slot.rotationY;
      apronMesh.scale.setScalar(slot.scale ?? 1);

      const ringMesh = new Mesh(trimGeometry, trimMaterial);
      ringMesh.position.set(slot.position.x, slot.position.y + 0.74, slot.position.z);
      ringMesh.rotation.set(-Math.PI / 2, slot.rotationY, 0);
      ringMesh.scale.setScalar(slot.scale ?? 1);

      const supports: Mesh[] = [];
      const supportOffsets = [
        new Vector3(1.56, -0.42, 1.56),
        new Vector3(-1.56, -0.42, 1.56),
        new Vector3(1.56, -0.42, -1.56),
        new Vector3(-1.56, -0.42, -1.56),
      ];

      for (const offset of supportOffsets) {
        const support = new Mesh(supportGeometry, deckMaterial);
        support.position.set(slot.position.x + offset.x, slot.position.y + offset.y, slot.position.z + offset.z);
        supports.push(support);
        this.cityRoot.add(support);
      }

      const buildingRoot = new Group();
      buildingRoot.position.set(slot.position.x, slot.position.y + 0.62, slot.position.z);
      buildingRoot.rotation.y = slot.rotationY;

      this.cityRoot.add(apronMesh);
      this.cityRoot.add(slotMesh);
      this.cityRoot.add(deckMesh);
      this.cityRoot.add(ringMesh);
      this.cityRoot.add(buildingRoot);

      this.slotVisuals.set(slot.id, {
        slot: slotMesh,
        ring: ringMesh,
        deck: deckMesh,
        apron: apronMesh,
        supports,
        buildingRoot,
      });
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
    const slotMaterial = visuals.slot.material as MeshStandardMaterial;
    const deckMaterial = visuals.deck.material as MeshStandardMaterial;
    const ringMaterial = visuals.ring.material as MeshStandardMaterial;
    const apronMaterial = visuals.apron.material as MeshStandardMaterial;

    if (isLocked) {
      slotMaterial.color.setHex(0x5a6674);
      deckMaterial.color.setHex(0x4b5865);
      apronMaterial.color.setHex(0x495566);
      ringMaterial.color.setHex(0x728294);
      ringMaterial.emissiveIntensity = 0;
      return;
    }

    const highlighted = model.selectedTarget.type !== 'none' && model.selectedTarget.slotId === slotId;
    slotMaterial.color.set(highlighted ? model.cityTheme.padTrimColor : model.cityTheme.padColor);
    deckMaterial.color.set(model.cityTheme.metalColor);
    apronMaterial.color.set(model.cityTheme.foundationColor);
    ringMaterial.color.set(highlighted ? model.cityTheme.accentColor : model.cityTheme.padTrimColor);
    ringMaterial.emissive.set(model.cityTheme.emissiveAccent);
    ringMaterial.emissiveIntensity = highlighted ? 0.28 : 0.08;
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
