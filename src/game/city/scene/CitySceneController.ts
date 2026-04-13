import {
  ACESFilmicToneMapping,
  BoxGeometry,
  CircleGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  SRGBColorSpace,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Object3D,
  type Material,
  type BufferGeometry,
  CylinderGeometry,
} from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { CityAssetRegistry } from '@/game/city/assets/CityAssetRegistry';
import { createCityScene } from '@/game/city/scene/createCityScene';
import type { CityInteractionTarget, CityViewModel } from '@/game/city/runtime/cityViewModel';
import { CityRaycaster } from '@/game/city/interaction/CityRaycaster';
import type { CityBiomeContext } from '@/game/city/runtime/CityBiomeContext';
import type { CitySlotId } from '@/game/city/data/citySlots';
import type { CitySurfaceSlice } from '@/game/city/terrain/generateCitySurfaceSlice';

interface CitySlotVisual {
  slot: Mesh;
  apron: Mesh;
  buildingRoot: Group;
}

export class CitySceneController {
  readonly renderer: WebGLRenderer;
  readonly camera: PerspectiveCamera;

  private readonly scene: Scene;
  private readonly cityRoot: Group;
  private readonly terrain: CitySurfaceSlice;
  private readonly raycaster = new CityRaycaster();
  private readonly assets = new CityAssetRegistry();
  private readonly slotVisuals = new Map<string, CitySlotVisual>();
  private readonly composer: EffectComposer;
  private readonly bloom: UnrealBloomPass;

  constructor(
    private readonly host: HTMLDivElement,
    private viewModel: CityViewModel,
    seed: number,
    biomeContext: CityBiomeContext,
  ) {
    this.renderer = new WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = biomeContext.planetGenerationConfig.postfx.exposure;
    this.renderer.domElement.className = 'render-surface render-surface--city3d';

    this.camera = new PerspectiveCamera(42, 1, 0.1, 260);
    this.camera.position.set(22, 16, 26);
    this.camera.lookAt(0, 2.8, -1.5);

    const scaffold = createCityScene(viewModel.cityTheme, seed, biomeContext);
    this.scene = scaffold.scene;
    this.cityRoot = scaffold.cityRoot;
    this.terrain = scaffold.terrain;

    this.composer = new EffectComposer(this.renderer);
    this.bloom = new UnrealBloomPass(new Vector2(1, 1), 0.01, 0.2, 0.9);
    this.bloom.strength = biomeContext.planetGenerationConfig.surfaceMode === 'lava' ? 0.045 : 0.01;
    this.bloom.radius = 0.08;
    this.bloom.threshold = 0.92;

    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
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
    this.composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.composer.setSize(safeWidth, safeHeight);
    this.bloom.setSize(safeWidth, safeHeight);
  }

  update() {
    this.composer.render();
  }

  pickTarget(clientX: number, clientY: number): CityInteractionTarget {
    return this.raycaster.pick(clientX, clientY, this.renderer.domElement, this.camera, this.scene);
  }

  setViewModel(next: CityViewModel) {
    this.viewModel = next;
    this.syncFromViewModel(next);
  }

  destroy() {
    this.composer.dispose();
    this.bloom.dispose();
    this.renderer.dispose();
    this.assets.dispose();
    this.disposeSceneTree(this.scene);
    this.slotVisuals.clear();
    this.renderer.domElement.remove();
  }

  private buildStaticScene() {
    const foundationGeometry = new CylinderGeometry(2.45, 2.8, 0.28, 20);
    const apronGeometry = new CircleGeometry(3.2, 26);

    for (const slot of this.viewModel.layout.slots) {
      const terrainHeight = this.terrain.sampleHeight(slot.position.x, slot.position.z);
      const groundNormal = this.terrain.sampleNormal(slot.position.x, slot.position.z);
      const scale = slot.scale ?? 1;

      const foundationMaterial = new MeshStandardMaterial({
        color: slot.startsLocked ? 0x4f5a67 : this.viewModel.cityTheme.padColor,
        roughness: 0.84,
        metalness: 0.12,
      });
      const apronMaterial = new MeshStandardMaterial({
        color: this.viewModel.cityTheme.groundShadowColor,
        roughness: 0.96,
        metalness: 0.03,
        emissive: this.viewModel.cityTheme.emissiveAccent,
        emissiveIntensity: 0.035,
      });

      const foundation = new Mesh(foundationGeometry, foundationMaterial);
      foundation.position.set(slot.position.x, terrainHeight + 0.16, slot.position.z);
      foundation.scale.setScalar(scale);
      foundation.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), groundNormal);
      foundation.userData.cityTargetType = 'slot';
      foundation.userData.citySlotId = slot.id;

      const apron = new Mesh(apronGeometry, apronMaterial);
      apron.position.set(slot.position.x, terrainHeight + 0.05, slot.position.z);
      apron.rotation.x = -Math.PI / 2;
      apron.scale.setScalar(scale * 1.03);

      const buildingRoot = new Group();
      buildingRoot.position.set(slot.position.x, terrainHeight + 0.28, slot.position.z);
      buildingRoot.rotation.y = slot.rotationY;

      this.cityRoot.add(apron);
      this.cityRoot.add(foundation);
      this.cityRoot.add(buildingRoot);
      this.slotVisuals.set(slot.id, { slot: foundation, apron, buildingRoot });
    }

    this.buildRoadNetwork();
  }

  private buildRoadNetwork() {
    const roadMaterial = new MeshStandardMaterial({
      color: this.viewModel.cityTheme.metalColor,
      roughness: 0.65,
      metalness: 0.24,
      emissive: this.viewModel.cityTheme.emissiveAccent,
      emissiveIntensity: 0.04,
    });

    const slotMap = new Map(this.viewModel.layout.slots.map((slot) => [slot.id, slot] as const));
    const roads: Array<[CitySlotId, CitySlotId]> = [
      ['slot-hq-core', 'slot-econ-west'],
      ['slot-hq-core', 'slot-econ-east'],
      ['slot-hq-core', 'slot-utility-north'],
      ['slot-hq-core', 'slot-utility-south'],
      ['slot-econ-west', 'slot-mixed-northwest'],
      ['slot-econ-east', 'slot-mixed-southeast'],
    ];

    for (const [fromId, toId] of roads) {
      const from = slotMap.get(fromId);
      const to = slotMap.get(toId);
      if (!from || !to) continue;

      const fromHeight = this.terrain.sampleHeight(from.position.x, from.position.z) + 0.07;
      const toHeight = this.terrain.sampleHeight(to.position.x, to.position.z) + 0.07;
      const delta = new Vector3(to.position.x - from.position.x, toHeight - fromHeight, to.position.z - from.position.z);
      const length = Math.max(0.1, delta.length());

      const road = new Mesh(new BoxGeometry(length, 0.06, 0.7), roadMaterial);
      road.position.set((from.position.x + to.position.x) * 0.5, (fromHeight + toHeight) * 0.5, (from.position.z + to.position.z) * 0.5);
      road.lookAt(to.position.x, toHeight, to.position.z);
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
    const apronMaterial = visuals.apron.material as MeshStandardMaterial;

    if (isLocked) {
      slotMaterial.color.setHex(0x5a6674);
      apronMaterial.color.setHex(0x3f4954);
      apronMaterial.emissiveIntensity = 0.01;
      return;
    }

    const highlighted = model.selectedTarget.type !== 'none' && model.selectedTarget.slotId === slotId;
    slotMaterial.color.set(highlighted ? model.cityTheme.padTrimColor : model.cityTheme.padColor);
    apronMaterial.color.set(highlighted ? model.cityTheme.padTrimColor : model.cityTheme.groundShadowColor);
    apronMaterial.emissive.set(model.cityTheme.emissiveAccent);
    apronMaterial.emissiveIntensity = highlighted ? 0.14 : 0.04;
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
