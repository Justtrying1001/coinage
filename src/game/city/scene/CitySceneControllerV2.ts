import {
  ACESFilmicToneMapping,
  Group,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
  type Material,
  type Mesh,
  type Object3D,
  type BufferGeometry,
} from 'three';
import { CityRaycaster } from '@/game/city/interaction/CityRaycaster';
import type { CityInteractionTarget, CityViewModel } from '@/game/city/runtime/cityViewModel';
import { createCitySiteContext, type CitySiteContext } from '@/game/city/scene/CitySiteContext';
import { CityTerrainRuntime } from '@/game/city/scene/CityTerrainRuntime';
import { CitySlotAnchors } from '@/game/city/scene/CitySlotAnchors';
import { CityStructureRuntime } from '@/game/city/scene/CityStructureRuntime';
import { CityAtmosphereAndPostFx } from '@/game/city/scene/CityAtmosphereAndPostFx';

export class CitySceneControllerV2 {
  readonly renderer: WebGLRenderer;
  readonly camera: PerspectiveCamera;

  private readonly scene = new Scene();
  private readonly cityRoot = new Group();
  private readonly raycaster = new CityRaycaster();

  private readonly context: CitySiteContext;
  private readonly terrain: CityTerrainRuntime;
  private readonly slots: CitySlotAnchors;
  private readonly structures: CityStructureRuntime;
  private readonly atmosphere: CityAtmosphereAndPostFx;

  constructor(
    private readonly host: HTMLDivElement,
    private viewModel: CityViewModel,
    planetSeed: number,
    settlementId: string | null,
  ) {
    this.renderer = new WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.domElement.className = 'render-surface render-surface--city3d';

    this.camera = new PerspectiveCamera(48, 1, 0.1, 260);
    this.camera.position.set(18, 13, 28);
    this.camera.lookAt(0, 2.3, -4);

    this.context = createCitySiteContext(planetSeed, settlementId);

    this.scene.add(this.cityRoot);
    this.terrain = new CityTerrainRuntime(this.context);
    this.cityRoot.add(this.terrain.group);

    this.slots = new CitySlotAnchors(this.viewModel, this.terrain, this.context.biome.terrainHigh);
    this.cityRoot.add(this.slots.group);

    this.structures = new CityStructureRuntime(this.slots, this.context.biome.emissiveAccent);
    this.cityRoot.add(this.structures.group);

    this.atmosphere = new CityAtmosphereAndPostFx(this.renderer, this.scene, this.camera, this.context);
    this.syncFromViewModel(this.viewModel);
  }

  mount() {
    this.host.appendChild(this.renderer.domElement);
  }

  resize(width: number, height: number) {
    const safeWidth = Math.max(1, width);
    const safeHeight = Math.max(1, height);
    this.camera.aspect = safeWidth / safeHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(safeWidth, safeHeight, false);
    this.atmosphere.resize(safeWidth, safeHeight);
  }

  update() {
    this.atmosphere.render();
  }

  pickTarget(clientX: number, clientY: number): CityInteractionTarget {
    return this.raycaster.pick(clientX, clientY, this.renderer.domElement, this.camera, this.scene);
  }

  setViewModel(next: CityViewModel) {
    this.viewModel = next;
    this.syncFromViewModel(next);
  }

  destroy() {
    this.atmosphere.dispose();
    this.structures.dispose();
    this.slots.dispose();
    this.terrain.dispose();
    this.disposeSceneTree(this.scene);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private syncFromViewModel(model: CityViewModel) {
    const selectedSlotId = model.selectedTarget.type === 'none' ? null : model.selectedTarget.slotId;
    this.slots.setSelectedSlot(selectedSlotId);
    this.structures.sync(model);
  }

  private disposeSceneTree(root: Object3D) {
    root.traverse((object) => {
      const mesh = object as Mesh;
      const geometry = mesh.geometry as BufferGeometry | undefined;
      if (geometry) geometry.dispose();

      const material = mesh.material as Material | Material[] | undefined;
      if (!material) return;
      if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
      else material.dispose();
    });
  }
}
