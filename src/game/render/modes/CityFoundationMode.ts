import * as THREE from 'three';
import type { ModeContext, RenderModeController } from '@/game/render/modes/RenderModeController';
import type { SelectedPlanetRef } from '@/game/render/types';
import { CityLayoutStore } from '@/game/city/layout/cityLayout';
import { createCityTerrainInput } from '@/game/render/modes/terrain/CityTerrainInput';
import { buildTerrainGeometry, DEFAULT_TERRAIN_GEOMETRY } from '@/game/render/modes/terrain/CityTerrainPipeline';
import { createCityTerrainMaterial, type CityRenderViewMode } from '@/game/render/modes/terrain/CityTerrainMaterial';
import { createCityFluidLayer } from '@/game/render/modes/terrain/CityWaterLayer';
import { buildCityDecor } from '@/game/render/modes/terrain/CityDecorSystem';
import { applyCityAtmosphere, createCityLighting } from '@/game/render/modes/terrain/CityAtmosphereRig';

const GRID_WIDTH = 20;
const GRID_HEIGHT = 14;

type CityViewMode = CityRenderViewMode;

export class CityFoundationMode implements RenderModeController {
  readonly id = 'city3d' as const;

  private readonly layout = new CityLayoutStore({ width: GRID_WIDTH, height: GRID_HEIGHT });
  private root: HTMLElement | null = null;
  private canvasWrap: HTMLDivElement | null = null;
  private hudMeta: HTMLParagraphElement | null = null;
  private hudBuildInfo: HTMLParagraphElement | null = null;

  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private perspectiveCamera: THREE.PerspectiveCamera | null = null;
  private orthoCamera: THREE.OrthographicCamera | null = null;
  private activeCamera: THREE.Camera | null = null;

  private terrain: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial> | null = null;
  private farField: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial> | null = null;
  private water: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial> | null = null;
  private decorGroup: THREE.Group | null = null;
  private atmosphereGroup: THREE.Group | null = null;

  private viewMode: CityViewMode = 'normal';

  constructor(
    private selectedPlanet: SelectedPlanetRef,
    private readonly context: ModeContext,
  ) {}

  mount() {
    const root = document.createElement('section');
    root.className = 'city-view-root';

    const canvasWrap = document.createElement('div');
    canvasWrap.className = 'city-view-canvas';

    const hud = document.createElement('div');
    hud.className = 'city-view-hud';

    const meta = document.createElement('p');
    meta.className = 'city-view-hud__meta';
    this.hudMeta = meta;

    const buildInfo = document.createElement('p');
    buildInfo.className = 'city-view-hud__meta';
    this.hudBuildInfo = buildInfo;

    const modeWrap = document.createElement('div');
    modeWrap.className = 'city-view-hud__modes';
    modeWrap.append(
      this.createModeButton('Normal', 'normal'),
      this.createModeButton('Build', 'build'),
      this.createModeButton('Flat', 'flat'),
    );

    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'city-view-hud__back';
    back.textContent = 'Back';
    back.addEventListener('click', () => this.context.onRequestMode('planet3d'));

    hud.append(meta, buildInfo, modeWrap, back);
    root.append(canvasWrap, hud);
    this.context.host.appendChild(root);

    this.root = root;
    this.canvasWrap = canvasWrap;

    this.initScene();
    this.rebuildCityTerrain();
  }

  resize(width: number, height: number) {
    if (!this.renderer || !this.perspectiveCamera || !this.orthoCamera) return;
    const safeW = Math.max(width, 1);
    const safeH = Math.max(height, 1);

    this.renderer.setSize(safeW, safeH, false);

    this.perspectiveCamera.aspect = safeW / safeH;
    this.perspectiveCamera.updateProjectionMatrix();

    const aspect = safeW / safeH;
    const orthoHalfHeight = 220;
    const orthoHalfWidth = orthoHalfHeight * aspect;
    this.orthoCamera.left = -orthoHalfWidth;
    this.orthoCamera.right = orthoHalfWidth;
    this.orthoCamera.top = orthoHalfHeight;
    this.orthoCamera.bottom = -orthoHalfHeight;
    this.orthoCamera.updateProjectionMatrix();
  }

  update() {
    if (!this.renderer || !this.scene || !this.activeCamera) return;
    this.renderer.render(this.scene, this.activeCamera);
  }

  setSelectedPlanet(nextPlanet: SelectedPlanetRef) {
    if (nextPlanet.id === this.selectedPlanet.id && nextPlanet.seed === this.selectedPlanet.seed) return;
    this.selectedPlanet = nextPlanet;
    this.rebuildCityTerrain();
  }

  destroy() {
    this.disposeCurrentMeshes();
    this.renderer?.dispose();
    this.root?.remove();

    this.root = null;
    this.canvasWrap = null;
    this.hudMeta = null;
    this.hudBuildInfo = null;
    this.scene = null;
    this.activeCamera = null;
    this.perspectiveCamera = null;
    this.orthoCamera = null;
    this.renderer = null;
  }

  private createModeButton(label: string, mode: CityViewMode) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'city-view-hud__mode';
    btn.textContent = label;
    btn.addEventListener('click', () => {
      this.viewMode = mode;
      this.syncViewModeState();
    });
    return btn;
  }

  private syncViewModeState() {
    if (!this.root) return;
    const buttons = [...this.root.querySelectorAll<HTMLButtonElement>('.city-view-hud__mode')];
    buttons.forEach((button) => {
      const active = button.textContent?.toLowerCase() === this.viewMode;
      button.classList.toggle('is-active', Boolean(active));
    });

    const setMode = (mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial> | null) => {
      if (!mesh) return;
      const setter = mesh.material.userData?.setViewMode;
      if (typeof setter === 'function') setter(this.viewMode);
      mesh.material.needsUpdate = true;
    };

    setMode(this.terrain);
    setMode(this.farField);

    if (this.decorGroup) this.decorGroup.visible = this.viewMode === 'normal';
    if (this.water) this.water.visible = this.viewMode !== 'flat';
    if (this.scene?.fog instanceof THREE.Fog) {
      if (this.viewMode === 'normal') {
        this.scene.fog.near = 760;
        this.scene.fog.far = 2400;
      } else {
        this.scene.fog.near = 1400;
        this.scene.fog.far = 3600;
      }
    }

    if (!this.perspectiveCamera || !this.orthoCamera) return;

    if (this.viewMode === 'normal') {
      this.activeCamera = this.perspectiveCamera;
      this.perspectiveCamera.position.set(0, 150, 255);
      this.perspectiveCamera.lookAt(0, 8, -95);
    } else if (this.viewMode === 'build') {
      this.activeCamera = this.orthoCamera;
      this.orthoCamera.position.set(0, 260, 170);
      this.orthoCamera.lookAt(0, 0, -90);
    } else {
      this.activeCamera = this.orthoCamera;
      this.orthoCamera.position.set(0, 300, 115);
      this.orthoCamera.lookAt(0, 0, -110);
    }
  }

  private initScene() {
    if (!this.canvasWrap) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.classList.add('render-surface');
    this.canvasWrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const perspectiveCamera = new THREE.PerspectiveCamera(42, 1, 0.1, 3000);
    const orthoCamera = new THREE.OrthographicCamera(-220, 220, 220, -220, 0.1, 3000);

    this.renderer = renderer;
    this.scene = scene;
    this.perspectiveCamera = perspectiveCamera;
    this.orthoCamera = orthoCamera;
    this.activeCamera = perspectiveCamera;
  }

  private disposeCurrentMeshes() {
    const disposable = [this.terrain, this.farField, this.water];
    disposable.forEach((mesh) => {
      if (!mesh || !this.scene) return;
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    });

    if (this.decorGroup && this.scene) {
      this.scene.remove(this.decorGroup);
      this.decorGroup.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((mat) => mat.dispose());
          else obj.material.dispose();
        }
      });
    }

    if (this.atmosphereGroup && this.scene) {
      this.scene.remove(this.atmosphereGroup);
      this.atmosphereGroup.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((mat) => mat.dispose());
          else obj.material.dispose();
        }
      });
    }

    this.terrain = null;
    this.farField = null;
    this.water = null;
    this.decorGroup = null;
    this.atmosphereGroup = null;
  }

  private rebuildCityTerrain() {
    if (!this.scene) return;
    this.disposeCurrentMeshes();

    const snapshot = this.layout.getSnapshot();
    const input = createCityTerrainInput(this.selectedPlanet.seed);

    applyCityAtmosphere(this.scene, input);
    const atmosphereRig = createCityLighting(input);
    this.scene.add(atmosphereRig);
    this.atmosphereGroup = atmosphereRig;

    const built = buildTerrainGeometry(input, { blocked: snapshot.blocked, expansion: snapshot.expansion }, DEFAULT_TERRAIN_GEOMETRY);

    const farField = new THREE.Mesh(built.farGeometry, createCityTerrainMaterial(input, true, this.viewMode));
    farField.position.y = -28;
    farField.receiveShadow = true;
    this.scene.add(farField);
    this.farField = farField;

    const terrain = new THREE.Mesh(built.nearGeometry, createCityTerrainMaterial(input, false, this.viewMode));
    terrain.receiveShadow = true;
    this.scene.add(terrain);
    this.terrain = terrain;

    const fluid = createCityFluidLayer(input, DEFAULT_TERRAIN_GEOMETRY);
    if (fluid) {
      this.scene.add(fluid);
      this.water = fluid;
    }

    const decor = buildCityDecor(input, snapshot, DEFAULT_TERRAIN_GEOMETRY);
    this.scene.add(decor);
    this.decorGroup = decor;

    this.syncHud(input.archetype, built.buildSurface.stableMask, built.buildSurface.buildableMask);
    this.syncViewModeState();
  }

  private syncHud(archetype: string, stableMask: Float32Array, buildableMask: Float32Array) {
    if (!this.hudMeta || !this.hudBuildInfo) return;
    this.hudMeta.textContent = `${this.selectedPlanet.id.toUpperCase()} · ${archetype}`;

    let stable = 0;
    let buildable = 0;
    for (let i = 0; i < stableMask.length; i += 1) {
      if (stableMask[i] > 0.5) stable += 1;
      if (buildableMask[i] > 0.5) buildable += 1;
    }

    const stableRatio = stableMask.length > 0 ? Math.round((stable / stableMask.length) * 100) : 0;
    const buildableRatio = buildableMask.length > 0 ? Math.round((buildable / buildableMask.length) * 100) : 0;
    this.hudBuildInfo.textContent = `Buildable ${buildableRatio}% · Stable ${stableRatio}%`;
  }
}
