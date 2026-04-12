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
} from 'three';
import { CityAssetRegistry } from '@/game/city/assets/CityAssetRegistry';
import { createCityScene } from '@/game/city/scene/createCityScene';
import type { CityInteractionTarget, CityViewModel } from '@/game/city/runtime/cityViewModel';
import { CityRaycaster } from '@/game/city/interaction/CityRaycaster';
import type { CityBiomeContext } from '@/game/city/terrain/CityBiomeContext';

interface CitySlotVisual {
  slot: Mesh;
  ring: Mesh;
  deck: Mesh;
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
  private readonly sampleTerrainHeight: (x: number, z: number) => number;

  constructor(private readonly host: HTMLDivElement, private viewModel: CityViewModel, biomeContext: CityBiomeContext) {
    this.renderer = new WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.domElement.className = 'render-surface render-surface--city3d';

    this.camera = new PerspectiveCamera(38, 1, 0.1, 220);
    this.camera.position.set(24, 19, 22);
    this.camera.lookAt(0, 2.4, 0);

    const scaffold = createCityScene(viewModel.cityTheme, biomeContext);
    this.scene = scaffold.scene;
    this.cityRoot = scaffold.cityRoot;
    this.sampleTerrainHeight = scaffold.sampleTerrainHeight;
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
    const padGeometry = new CylinderGeometry(2.24, 2.42, 0.46, 8);
    const deckGeometry = new CylinderGeometry(1.82, 1.96, 0.38, 8);
    const trimGeometry = new RingGeometry(1.9, 2.3, 8);
    const supportGeometry = new BoxGeometry(0.24, 0.8, 0.24);

    for (const slot of this.viewModel.layout.slots) {
      const terrainY = this.sampleTerrainHeight(slot.position.x, slot.position.z);
      const baseMaterial = new MeshStandardMaterial({
        color: slot.startsLocked ? 0x5b6673 : this.viewModel.cityTheme.padColor,
        roughness: 0.48,
        metalness: 0.36,
      });
      const deckMaterial = new MeshStandardMaterial({
        color: this.viewModel.cityTheme.metalColor,
        roughness: 0.35,
        metalness: 0.68,
      });
      const trimMaterial = new MeshStandardMaterial({
        color: this.viewModel.cityTheme.padTrimColor,
        roughness: 0.3,
        metalness: 0.75,
        emissive: this.viewModel.cityTheme.emissiveAccent,
        emissiveIntensity: 0.08,
      });

      const slotMesh = new Mesh(padGeometry, baseMaterial);
      slotMesh.position.set(slot.position.x, terrainY + 0.14, slot.position.z);
      slotMesh.rotation.y = slot.rotationY;
      slotMesh.scale.setScalar(slot.scale ?? 1);
      slotMesh.userData.cityTargetType = 'slot';
      slotMesh.userData.citySlotId = slot.id;

      const deckMesh = new Mesh(deckGeometry, deckMaterial);
      deckMesh.position.set(slot.position.x, terrainY + 0.44, slot.position.z);
      deckMesh.rotation.y = slot.rotationY;
      deckMesh.scale.setScalar(slot.scale ?? 1);

      const ringMesh = new Mesh(trimGeometry, trimMaterial);
      ringMesh.position.set(slot.position.x, terrainY + 0.65, slot.position.z);
      ringMesh.rotation.set(-Math.PI / 2, slot.rotationY, 0);
      ringMesh.scale.setScalar(slot.scale ?? 1);

      const supports: Mesh[] = [];
      const supportOffsets = [
        new Vector3(1.35, -0.15, 1.35),
        new Vector3(-1.35, -0.15, 1.35),
        new Vector3(1.35, -0.15, -1.35),
        new Vector3(-1.35, -0.15, -1.35),
      ];

      for (const offset of supportOffsets) {
        const support = new Mesh(supportGeometry, deckMaterial);
        const supportGroundY = this.sampleTerrainHeight(slot.position.x + offset.x, slot.position.z + offset.z);
        support.position.set(slot.position.x + offset.x, supportGroundY + 0.36, slot.position.z + offset.z);
        supports.push(support);
        this.cityRoot.add(support);
      }

      const buildingRoot = new Group();
      buildingRoot.position.set(slot.position.x, terrainY + 0.58, slot.position.z);
      buildingRoot.rotation.y = slot.rotationY;

      this.cityRoot.add(slotMesh);
      this.cityRoot.add(deckMesh);
      this.cityRoot.add(ringMesh);
      this.cityRoot.add(buildingRoot);

      this.slotVisuals.set(slot.id, { slot: slotMesh, ring: ringMesh, deck: deckMesh, supports, buildingRoot });
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

    if (isLocked) {
      slotMaterial.color.setHex(0x5a6674);
      deckMaterial.color.setHex(0x4b5865);
      ringMaterial.color.setHex(0x728294);
      ringMaterial.emissiveIntensity = 0;
      return;
    }

    const highlighted = model.selectedTarget.type !== 'none' && model.selectedTarget.slotId === slotId;
    slotMaterial.color.set(highlighted ? model.cityTheme.padTrimColor : model.cityTheme.padColor);
    deckMaterial.color.set(model.cityTheme.metalColor);
    ringMaterial.color.set(highlighted ? model.cityTheme.accentColor : model.cityTheme.padTrimColor);
    ringMaterial.emissive.set(model.cityTheme.emissiveAccent);
    ringMaterial.emissiveIntensity = highlighted ? 0.24 : 0.08;
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
