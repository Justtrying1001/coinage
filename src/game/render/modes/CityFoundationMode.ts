import * as THREE from 'three';
import type { ModeContext, RenderModeController } from '@/game/render/modes/RenderModeController';
import type { SelectedPlanetRef } from '@/game/render/types';
import { CityLayoutStore } from '@/game/city/layout/cityLayout';
import { createCityTerrainInput } from '@/game/render/modes/terrain/CityTerrainInput';

const GRID_WIDTH = 20;
const GRID_HEIGHT = 14;
const PAD_WIDTH = 520;
const PAD_DEPTH = 360;

type CityViewMode = 'normal' | 'build' | 'flat';

interface StageMeshes {
  buildPad: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
  backgroundRelief: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
  waterBackdrop: THREE.Mesh<THREE.PlaneGeometry, THREE.Material> | null;
  coastRim: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial> | null;
  gridLines: THREE.LineSegments;
  cellOverlay: THREE.Group;
}

export class CityFoundationMode implements RenderModeController {
  readonly id = 'city3d' as const;

  private readonly layout = new CityLayoutStore({ width: GRID_WIDTH, height: GRID_HEIGHT });
  private root: HTMLElement | null = null;
  private canvasWrap: HTMLDivElement | null = null;
  private hudMeta: HTMLParagraphElement | null = null;

  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private perspectiveCamera: THREE.PerspectiveCamera | null = null;
  private orthoCamera: THREE.OrthographicCamera | null = null;
  private activeCamera: THREE.Camera | null = null;

  private stage: StageMeshes | null = null;
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

    hud.append(meta, modeWrap, back);
    root.append(canvasWrap, hud);
    this.context.host.appendChild(root);

    this.root = root;
    this.canvasWrap = canvasWrap;

    this.initScene();
    this.rebuildCityScene();
  }

  resize(width: number, height: number) {
    if (!this.renderer || !this.perspectiveCamera || !this.orthoCamera) return;
    const safeW = Math.max(width, 1);
    const safeH = Math.max(height, 1);

    this.renderer.setSize(safeW, safeH, false);

    this.perspectiveCamera.aspect = safeW / safeH;
    this.perspectiveCamera.updateProjectionMatrix();

    const aspect = safeW / safeH;
    const orthoHalfHeight = 240;
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
    this.rebuildCityScene();
  }

  destroy() {
    this.disposeStage();
    this.renderer?.dispose();
    this.root?.remove();

    this.root = null;
    this.canvasWrap = null;
    this.hudMeta = null;
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
    if (!this.root || !this.stage || !this.scene || !this.perspectiveCamera || !this.orthoCamera) return;

    const buttons = [...this.root.querySelectorAll<HTMLButtonElement>('.city-view-hud__mode')];
    buttons.forEach((button) => button.classList.toggle('is-active', button.textContent?.toLowerCase() === this.viewMode));

    const isUtility = this.viewMode !== 'normal';

    this.stage.gridLines.visible = isUtility;
    this.stage.cellOverlay.visible = isUtility;

    if (this.stage.waterBackdrop) this.stage.waterBackdrop.visible = this.viewMode === 'normal' || this.viewMode === 'build';
    if (this.stage.coastRim) this.stage.coastRim.visible = this.viewMode === 'normal' || this.viewMode === 'build';

    this.stage.backgroundRelief.visible = this.viewMode !== 'flat';

    if (this.viewMode === 'normal') {
      this.activeCamera = this.perspectiveCamera;
      this.perspectiveCamera.position.set(0, 132, 260);
      this.perspectiveCamera.lookAt(0, 6, -70);
      this.stage.buildPad.material.color.set('#687868');
      this.stage.buildPad.material.roughness = 0.88;
      this.scene.fog = null;
    } else if (this.viewMode === 'build') {
      this.activeCamera = this.orthoCamera;
      this.orthoCamera.position.set(0, 260, 180);
      this.orthoCamera.lookAt(0, 0, -70);
      this.stage.buildPad.material.color.set('#657061');
      this.stage.buildPad.material.roughness = 0.92;
      this.scene.fog = null;
    } else {
      this.activeCamera = this.orthoCamera;
      this.orthoCamera.position.set(0, 300, 120);
      this.orthoCamera.lookAt(0, 0, -90);
      this.stage.buildPad.material.color.set('#5b6658');
      this.stage.buildPad.material.roughness = 0.96;
      this.scene.fog = null;
    }

    this.stage.buildPad.material.needsUpdate = true;
  }

  private initScene() {
    if (!this.canvasWrap) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.classList.add('render-surface');
    this.canvasWrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const perspectiveCamera = new THREE.PerspectiveCamera(40, 1, 0.1, 3500);
    const orthoCamera = new THREE.OrthographicCamera(-220, 220, 220, -220, 0.1, 3500);

    this.renderer = renderer;
    this.scene = scene;
    this.perspectiveCamera = perspectiveCamera;
    this.orthoCamera = orthoCamera;
    this.activeCamera = perspectiveCamera;
  }

  private rebuildCityScene() {
    if (!this.scene) return;
    this.disposeStage();

    const input = createCityTerrainInput(this.selectedPlanet.seed);
    this.scene.background = input.palettes.sky.clone().lerp(new THREE.Color('#9aaac0'), 0.28);
    this.scene.fog = null;

    const lights = createSimpleLighting(input);
    this.scene.add(lights);

    const snapshot = this.layout.getSnapshot();
    const stage = createStageMeshes(input, snapshot.blocked, snapshot.expansion);
    this.stage = stage;

    this.scene.add(stage.buildPad);
    this.scene.add(stage.backgroundRelief);
    if (stage.waterBackdrop) this.scene.add(stage.waterBackdrop);
    if (stage.coastRim) this.scene.add(stage.coastRim);
    this.scene.add(stage.gridLines);
    this.scene.add(stage.cellOverlay);

    if (this.hudMeta) {
      this.hudMeta.textContent = `${this.selectedPlanet.id.toUpperCase()} · ${input.archetype}`;
    }

    this.syncViewModeState();
  }

  private disposeStage() {
    if (!this.stage || !this.scene) {
      this.stage = null;
      return;
    }
    const scene = this.scene;

    const disposeMesh = (mesh: THREE.Mesh | null) => {
      if (!mesh) return;
      scene.remove(mesh);
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
      else mesh.material.dispose();
    };

    disposeMesh(this.stage.buildPad);
    disposeMesh(this.stage.backgroundRelief);
    disposeMesh(this.stage.waterBackdrop);
    disposeMesh(this.stage.coastRim);

    scene.remove(this.stage.gridLines);
    this.stage.gridLines.geometry.dispose();
    (this.stage.gridLines.material as THREE.Material).dispose();

    scene.remove(this.stage.cellOverlay);
    this.stage.cellOverlay.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });

    scene.children
      .filter((obj) => obj.name === 'city-lighting')
      .forEach((obj) => {
        scene.remove(obj);
      });

    this.stage = null;
  }
}

function createSimpleLighting(input: ReturnType<typeof createCityTerrainInput>) {
  const group = new THREE.Group();
  group.name = 'city-lighting';

  const hemi = new THREE.HemisphereLight(0xe7f1ff, 0x354030, 1.1);
  const sun = new THREE.DirectionalLight(0xfff0d2, 1.05 + input.visual.lightIntensity * 0.08);
  sun.position.set(120, 180, 80);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -420;
  sun.shadow.camera.right = 420;
  sun.shadow.camera.top = 300;
  sun.shadow.camera.bottom = -280;

  group.add(hemi, sun);
  return group;
}

function createStageMeshes(
  input: ReturnType<typeof createCityTerrainInput>,
  blocked: Set<string>,
  expansion: Set<string>,
): StageMeshes {
  const padGeo = new THREE.PlaneGeometry(PAD_WIDTH, PAD_DEPTH, 40, 28);
  padGeo.rotateX(-Math.PI / 2);
  const padPos = padGeo.attributes.position;
  for (let i = 0; i < padPos.count; i += 1) {
    const x = padPos.getX(i);
    const z = padPos.getZ(i);
    const slope = -z * 0.006;
    const micro = Math.sin(x * 0.028) * Math.cos(z * 0.024) * 0.08;
    padPos.setY(i, slope + micro);
  }
  padPos.needsUpdate = true;
  padGeo.computeVertexNormals();

  const padMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#687868'), roughness: 0.88, metalness: 0.04 });
  const buildPad = new THREE.Mesh(padGeo, padMat);
  buildPad.position.z = 80;
  buildPad.receiveShadow = true;

  const reliefGeo = new THREE.PlaneGeometry(1600, 920, 120, 60);
  reliefGeo.rotateX(-Math.PI / 2);
  const reliefPos = reliefGeo.attributes.position;
  const biomeLift = input.archetype === 'volcanic' ? 34 : input.archetype === 'frozen' ? 28 : input.archetype === 'arid' ? 30 : 24;
  for (let i = 0; i < reliefPos.count; i += 1) {
    const x = reliefPos.getX(i);
    const z = reliefPos.getZ(i);
    const nz = (z / 920) + 0.5;
    const ridgeBand = smoothstep(0.22, 1, 1 - nz);
    const ridges = Math.sin(x * 0.018 + input.seed * 0.0001) * Math.cos(z * 0.021 - input.seed * 0.00009);
    const macro = Math.sin((x + z) * 0.006) * 0.5 + Math.cos((x - z) * 0.004) * 0.5;
    const y = ridgeBand * (biomeLift + ridges * 16 + macro * 14);
    reliefPos.setY(i, y);
  }
  reliefPos.needsUpdate = true;
  reliefGeo.computeVertexNormals();

  const reliefColor = input.palettes.cliff.clone().lerp(input.palettes.high, 0.35);
  const reliefMat = new THREE.MeshStandardMaterial({ color: reliefColor, roughness: 0.86, metalness: 0.05 });
  const backgroundRelief = new THREE.Mesh(reliefGeo, reliefMat);
  backgroundRelief.position.z = -330;
  backgroundRelief.position.y = -12;
  backgroundRelief.receiveShadow = true;

  const gridLines = createGridLines(PAD_WIDTH, PAD_DEPTH, GRID_WIDTH, GRID_HEIGHT);
  gridLines.position.set(0, 1.4, 80);
  gridLines.visible = false;

  const cellOverlay = createCellOverlay(blocked, expansion);
  cellOverlay.position.set(0, 1.45, 80);
  cellOverlay.visible = false;

  const waterAndCoast = createWaterAndCoastMeshes(input);

  return {
    buildPad,
    backgroundRelief,
    waterBackdrop: waterAndCoast.water,
    coastRim: waterAndCoast.coast,
    gridLines,
    cellOverlay,
  };
}

function createGridLines(width: number, depth: number, cols: number, rows: number) {
  const points: number[] = [];
  const x0 = -width / 2;
  const z0 = -depth / 2;
  const dx = width / cols;
  const dz = depth / rows;

  for (let c = 0; c <= cols; c += 1) {
    const x = x0 + c * dx;
    points.push(x, 0, z0, x, 0, z0 + depth);
  }
  for (let r = 0; r <= rows; r += 1) {
    const z = z0 + r * dz;
    points.push(x0, 0, z, x0 + width, 0, z);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  const mat = new THREE.LineBasicMaterial({ color: new THREE.Color('#dfe9ef'), transparent: true, opacity: 0.7 });
  return new THREE.LineSegments(geo, mat);
}

function createCellOverlay(blocked: Set<string>, expansion: Set<string>) {
  const group = new THREE.Group();
  const cellW = PAD_WIDTH / GRID_WIDTH;
  const cellD = PAD_DEPTH / GRID_HEIGHT;
  const x0 = -PAD_WIDTH / 2 + cellW / 2;
  const z0 = -PAD_DEPTH / 2 + cellD / 2;

  for (let y = 0; y < GRID_HEIGHT; y += 1) {
    for (let x = 0; x < GRID_WIDTH; x += 1) {
      const key = `${x},${y}`;
      let color: THREE.Color | null = null;
      let opacity = 0.22;

      if (blocked.has(key)) {
        color = new THREE.Color('#b3473b');
        opacity = 0.52;
      } else if (expansion.has(key)) {
        color = new THREE.Color('#b08a3a');
        opacity = 0.42;
      } else {
        color = new THREE.Color('#3f7b4b');
      }

      const tile = new THREE.Mesh(
        new THREE.PlaneGeometry(cellW * 0.94, cellD * 0.94),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity }),
      );
      tile.rotateX(-Math.PI / 2);
      tile.position.set(x0 + x * cellW, 0, z0 + y * cellD);
      group.add(tile);
    }
  }

  return group;
}

function createWaterAndCoastMeshes(input: ReturnType<typeof createCityTerrainInput>) {
  if (input.archetype !== 'oceanic' && input.archetype !== 'frozen') {
    return { water: null, coast: null };
  }

  const isFrozen = input.archetype === 'frozen';

  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(1700, 980, 1, 1),
    new THREE.MeshBasicMaterial({
      color: isFrozen ? new THREE.Color('#a9ccd8') : new THREE.Color('#3f78a0'),
      transparent: true,
      opacity: isFrozen ? 0.88 : 0.92,
    }),
  );
  water.rotateX(-Math.PI / 2);
  water.position.set(0, -20, -530);

  const coast = new THREE.Mesh(
    new THREE.BoxGeometry(PAD_WIDTH + 160, 28, 90),
    new THREE.MeshStandardMaterial({
      color: isFrozen ? new THREE.Color('#c7dae2') : new THREE.Color('#6c6a5f'),
      roughness: 0.86,
      metalness: 0.05,
    }),
  );
  coast.position.set(0, -6, -120);
  coast.receiveShadow = true;

  return { water, coast };
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0 || 1)));
  return t * t * (3 - 2 * t);
}
