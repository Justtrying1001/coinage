import {
  ACESFilmicToneMapping,
  BoxGeometry,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  RingGeometry,
  SRGBColorSpace,
  Scene,
  TubeGeometry,
  Vector3,
  WebGLRenderer,
  type Object3D,
  type Material,
  type BufferGeometry,
} from 'three';
import { CityAssetRegistry } from '@/game/city/assets/CityAssetRegistry';
import { createCityScene } from '@/game/city/scene/createCityScene';
import type { CityInteractionTarget, CityViewModel } from '@/game/city/runtime/cityViewModel';
import { CityRaycaster } from '@/game/city/interaction/CityRaycaster';

interface CitySlotVisual {
  slot: Mesh;
  ring: Mesh;
  deck: Mesh;
  supports: Mesh[];
  buildingRoot: Group;
  anchor: Vector3;
}

export class CitySceneController {
  readonly renderer: WebGLRenderer;
  readonly camera: PerspectiveCamera;

  private readonly scene: Scene;
  private readonly cityRoot: Group;
  private readonly terrainHeightAt: (x: number, z: number) => number;
  private readonly raycaster = new CityRaycaster();
  private readonly assets = new CityAssetRegistry();
  private readonly slotVisuals = new Map<string, CitySlotVisual>();

  constructor(private readonly host: HTMLDivElement, private viewModel: CityViewModel, seed: number) {
    this.renderer = new WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.renderer.domElement.className = 'render-surface render-surface--city3d';

    this.camera = new PerspectiveCamera(34, 1, 0.1, 260);
    this.camera.position.set(20, 16, 31);
    this.camera.lookAt(0, 2.2, -2.5);

    const scaffold = createCityScene(viewModel.cityTheme, seed);
    this.scene = scaffold.scene;
    this.cityRoot = scaffold.cityRoot;
    this.terrainHeightAt = scaffold.terrainHeightAt;
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
    const padGeometry = new CylinderGeometry(1.86, 2.18, 0.28, 18);
    const deckGeometry = new CylinderGeometry(1.58, 1.72, 0.22, 16);
    const trimGeometry = new RingGeometry(1.6, 2.25, 28);
    const supportGeometry = new BoxGeometry(0.2, 0.56, 0.2);

    const anchors: Vector3[] = [];

    for (const slot of this.viewModel.layout.slots) {
      const terrainY = this.terrainHeightAt(slot.position.x, slot.position.z);
      const slotY = terrainY + 0.1;

      const baseMaterial = new MeshStandardMaterial({
        color: slot.startsLocked ? 0x5b6673 : this.viewModel.cityTheme.padColor,
        roughness: 0.64,
        metalness: 0.26,
      });
      const deckMaterial = new MeshStandardMaterial({
        color: this.viewModel.cityTheme.metalColor,
        roughness: 0.42,
        metalness: 0.5,
      });
      const trimMaterial = new MeshStandardMaterial({
        color: this.viewModel.cityTheme.padTrimColor,
        roughness: 0.28,
        metalness: 0.74,
        emissive: this.viewModel.cityTheme.emissiveAccent,
        emissiveIntensity: 0.06,
      });

      const slotMesh = new Mesh(padGeometry, baseMaterial);
      slotMesh.position.set(slot.position.x, slotY, slot.position.z);
      slotMesh.rotation.y = slot.rotationY;
      slotMesh.scale.setScalar(slot.scale ?? 1);
      slotMesh.userData.cityTargetType = 'slot';
      slotMesh.userData.citySlotId = slot.id;

      const deckMesh = new Mesh(deckGeometry, deckMaterial);
      deckMesh.position.set(slot.position.x, slotY + 0.2, slot.position.z);
      deckMesh.rotation.y = slot.rotationY;
      deckMesh.scale.setScalar(slot.scale ?? 1);

      const ringMesh = new Mesh(trimGeometry, trimMaterial);
      ringMesh.position.set(slot.position.x, slotY + 0.32, slot.position.z);
      ringMesh.rotation.set(-Math.PI / 2, slot.rotationY, 0);
      ringMesh.scale.setScalar(slot.scale ?? 1.08);

      const supports: Mesh[] = [];
      const supportOffsets = [
        new Vector3(1.12, -0.14, 1.12),
        new Vector3(-1.12, -0.14, 1.12),
        new Vector3(1.12, -0.14, -1.12),
        new Vector3(-1.12, -0.14, -1.12),
      ];

      for (const offset of supportOffsets) {
        const support = new Mesh(supportGeometry, deckMaterial);
        support.position.set(slot.position.x + offset.x, slotY + offset.y, slot.position.z + offset.z);
        supports.push(support);
        this.cityRoot.add(support);
      }

      const buildingRoot = new Group();
      buildingRoot.position.set(slot.position.x, slotY + 0.35, slot.position.z);
      buildingRoot.rotation.y = slot.rotationY;

      this.cityRoot.add(slotMesh);
      this.cityRoot.add(deckMesh);
      this.cityRoot.add(ringMesh);
      this.cityRoot.add(buildingRoot);

      const anchor = new Vector3(slot.position.x, slotY, slot.position.z);
      anchors.push(anchor.clone());

      this.slotVisuals.set(slot.id, {
        slot: slotMesh,
        ring: ringMesh,
        deck: deckMesh,
        supports,
        buildingRoot,
        anchor,
      });
    }

    this.addRoadNetwork(anchors);
  }

  private addRoadNetwork(anchors: Vector3[]) {
    if (anchors.length < 2) return;

    const center = new Vector3();
    for (const anchor of anchors) center.add(anchor);
    center.divideScalar(anchors.length);

    const roadMaterial = new MeshStandardMaterial({
      color: new Color(this.viewModel.cityTheme.groundSecondaryColor).lerp(new Color(this.viewModel.cityTheme.metalColor), 0.44),
      roughness: 0.78,
      metalness: 0.2,
      emissive: this.viewModel.cityTheme.emissiveAccent,
      emissiveIntensity: 0.02,
    });

    for (const anchor of anchors) {
      const midpoint = anchor.clone().lerp(center, 0.45);
      midpoint.y += 0.06;
      const curve = new CatmullRomCurve3([anchor.clone().add(new Vector3(0, 0.04, 0)), midpoint, center.clone().add(new Vector3(0, 0.07, 0))]);
      const road = new Mesh(new TubeGeometry(curve, 22, 0.12, 8, false), roadMaterial);
      this.cityRoot.add(road);
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
      slotMaterial.color.setHex(0x4d5864);
      deckMaterial.color.setHex(0x46515d);
      ringMaterial.color.setHex(0x667383);
      ringMaterial.emissiveIntensity = 0;
      return;
    }

    const highlighted = model.selectedTarget.type !== 'none' && model.selectedTarget.slotId === slotId;
    slotMaterial.color.set(highlighted ? model.cityTheme.padTrimColor : model.cityTheme.padColor);
    deckMaterial.color.set(model.cityTheme.metalColor);
    ringMaterial.color.set(highlighted ? model.cityTheme.accentColor : model.cityTheme.padTrimColor);
    ringMaterial.emissive.set(model.cityTheme.emissiveAccent);
    ringMaterial.emissiveIntensity = highlighted ? 0.22 : 0.06;
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
