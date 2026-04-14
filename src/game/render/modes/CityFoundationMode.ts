import * as THREE from 'three';
import type { ModeContext, RenderModeController } from '@/game/render/modes/RenderModeController';
import type { SelectedPlanetRef } from '@/game/render/types';
import { CityLayoutStore } from '@/game/city/layout/cityLayout';
import { createCityTerrainInput } from '@/game/render/modes/terrain/CityTerrainInput';
import { buildCityTerrainEngine, type CityTerrainViewMode } from '@/game/render/modes/terrain/CityTerrainEngine';
import { createCityTerrainMaterial } from '@/game/render/modes/terrain/CityTerrainMaterial';
import { createCityFluidLayer } from '@/game/render/modes/terrain/CityWaterLayer';
import { buildCityDecor } from '@/game/render/modes/terrain/CityDecorSystem';
import { applyCityAtmosphere, createCityLighting } from '@/game/render/modes/terrain/CityAtmosphereRig';
import { applyCityCameraRig, getCityCameraPreset } from '@/game/render/modes/terrain/CityCameraRig';
import { CityOrbitCameraController } from '@/game/render/modes/terrain/CityOrbitCameraController';
import type { TerrainGeometryConfig } from '@/game/render/modes/terrain/CityTerrainTypes';

const GRID_WIDTH = 20;
const GRID_HEIGHT = 14;

type CityCameraMode = 'presentation' | 'free';

const DEFAULT_TERRAIN_GEOMETRY: TerrainGeometryConfig = {
  terrainWidth: 360,
  terrainDepth: 280,
  farWidth: 880,
  farDepth: 760,
  nearSegmentsX: 360,
  nearSegmentsZ: 280,
  farSegmentsX: 170,
  farSegmentsZ: 140,
};

export class CityFoundationMode implements RenderModeController {
  readonly id = 'city3d' as const;

  private readonly layout = new CityLayoutStore({ width: GRID_WIDTH, height: GRID_HEIGHT });
  private root: HTMLElement | null = null;
  private canvasWrap: HTMLDivElement | null = null;
  private hudMeta: HTMLParagraphElement | null = null;
  private cameraToggle: HTMLButtonElement | null = null;

  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private orbitCamera: CityOrbitCameraController | null = null;
  private cityCameraMode: CityCameraMode = 'presentation';

  private terrain: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial> | null = null;
  private farField: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial> | null = null;
  private water: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial> | null = null;
  private decorGroup: THREE.Group | null = null;
  private atmosphereGroup: THREE.Group | null = null;
  private cityViewMode: CityTerrainViewMode = 'normal';
  private currentArchetype = 'terrestrial';

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

    const cameraToggle = document.createElement('button');
    cameraToggle.type = 'button';
    cameraToggle.className = 'city-view-hud__camera';
    cameraToggle.textContent = 'Free Cam';
    cameraToggle.addEventListener('click', () => this.toggleCameraMode());
    this.cameraToggle = cameraToggle;

    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'city-view-hud__back';
    back.textContent = 'Back';
    back.addEventListener('click', () => this.context.onRequestMode('planet3d'));

    hud.append(meta, cameraToggle, back);
    root.append(canvasWrap, hud);
    this.context.host.appendChild(root);

    this.root = root;
    this.canvasWrap = canvasWrap;

    this.initScene();
    window.addEventListener('keydown', this.onKeyModeCycle);
    this.rebuildCityTerrain();
    this.syncHud();
  }

  resize(width: number, height: number) {
    if (!this.renderer || !this.camera) return;
    const safeW = Math.max(width, 1);
    const safeH = Math.max(height, 1);
    this.renderer.setSize(safeW, safeH, false);
    this.camera.aspect = safeW / safeH;
    this.camera.updateProjectionMatrix();
  }

  update() {
    if (!this.renderer || !this.scene || !this.camera) return;
    this.orbitCamera?.update();
    this.renderer.render(this.scene, this.camera);
  }

  setSelectedPlanet(nextPlanet: SelectedPlanetRef) {
    if (nextPlanet.id === this.selectedPlanet.id && nextPlanet.seed === this.selectedPlanet.seed) return;
    this.selectedPlanet = nextPlanet;
    this.rebuildCityTerrain();
  }

  destroy() {
    this.disposeCurrentMeshes();
    this.orbitCamera?.dispose();
    this.renderer?.dispose();
    window.removeEventListener('keydown', this.onKeyModeCycle);
    this.root?.remove();

    this.root = null;
    this.canvasWrap = null;
    this.hudMeta = null;
    this.cameraToggle = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.orbitCamera = null;
  }

  private initScene() {
    if (!this.canvasWrap) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.classList.add('render-surface');
    this.canvasWrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(44, 1, 0.5, 1800);
    applyCityCameraRig(camera, this.cityViewMode, DEFAULT_TERRAIN_GEOMETRY);

    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    this.orbitCamera = new CityOrbitCameraController(camera, renderer.domElement, {
      minDistance: 110,
      maxDistance: 620,
      minPolar: 0.34,
      maxPolar: 1.46,
      maxPan: DEFAULT_TERRAIN_GEOMETRY.terrainWidth * 0.26,
    });
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
    this.currentArchetype = input.archetype;

    applyCityAtmosphere(this.scene, input);
    const atmosphereRig = createCityLighting(input);
    this.scene.add(atmosphereRig);
    this.atmosphereGroup = atmosphereRig;

    const built = buildCityTerrainEngine(input, DEFAULT_TERRAIN_GEOMETRY, this.cityViewMode);

    const farMat = createCityTerrainMaterial(input, true, built.materialMode);
    const farField = new THREE.Mesh(built.farGeometry, farMat);
    farField.receiveShadow = true;
    this.scene.add(farField);
    this.farField = farField;

    const terrainMat = createCityTerrainMaterial(input, false, built.materialMode);
    const terrain = new THREE.Mesh(built.nearGeometry, terrainMat);
    terrain.receiveShadow = true;
    this.scene.add(terrain);
    this.terrain = terrain;

    if (this.camera) {
      const preset = getCityCameraPreset(this.cityViewMode, DEFAULT_TERRAIN_GEOMETRY);
      applyCityCameraRig(this.camera, this.cityViewMode, DEFAULT_TERRAIN_GEOMETRY);
      this.orbitCamera?.setFromPreset(preset);
    }

    const fluid = createCityFluidLayer(input, DEFAULT_TERRAIN_GEOMETRY);
    if (fluid) {
      this.scene.add(fluid);
      this.water = fluid;
    }

    const decor = buildCityDecor(input, snapshot, DEFAULT_TERRAIN_GEOMETRY, terrain);
    this.scene.add(decor);
    this.decorGroup = decor;

    this.syncHud(input.archetype);
  }

  private syncHud(archetype?: string) {
    if (this.hudMeta) {
      const biome = archetype ?? this.currentArchetype;
      this.hudMeta.textContent = `${this.selectedPlanet.id.toUpperCase()} · ${biome} · ${this.cityViewMode} · ${this.cityCameraMode}`;
    }
    if (this.cameraToggle) {
      this.cameraToggle.textContent = this.cityCameraMode === 'free' ? 'Present Cam' : 'Free Cam';
    }
  }

  private toggleCameraMode() {
    this.cityCameraMode = this.cityCameraMode === 'presentation' ? 'free' : 'presentation';
    if (this.orbitCamera) this.orbitCamera.enabled = this.cityCameraMode === 'free';
    if (this.cityCameraMode === 'presentation' && this.camera) {
      applyCityCameraRig(this.camera, this.cityViewMode, DEFAULT_TERRAIN_GEOMETRY);
    }
    this.syncHud();
  }

  private readonly onKeyModeCycle = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if (key === 'c') {
      this.toggleCameraMode();
      return;
    }
    if (key !== 'm') return;
    const nextMode: Record<CityTerrainViewMode, CityTerrainViewMode> = {
      normal: 'build',
      build: 'flat',
      flat: 'normal',
    };
    this.cityViewMode = nextMode[this.cityViewMode];
    this.rebuildCityTerrain();
  };
}
