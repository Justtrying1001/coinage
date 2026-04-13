import * as THREE from 'three';
import type { ModeContext, RenderModeController } from '@/game/render/modes/RenderModeController';
import type { PlanetArchetype, PlanetVisualProfile, SelectedPlanetRef } from '@/game/render/types';
import { CityLayoutStore, tileKey } from '@/game/city/layout/cityLayout';
import { planetProfileFromSeed } from '@/game/world/galaxyGenerator';

const GRID_WIDTH = 20;
const GRID_HEIGHT = 14;
const TERRAIN_WIDTH = 260;
const TERRAIN_DEPTH = 190;
const FAR_FIELD_WIDTH = 560;
const FAR_FIELD_DEPTH = 440;

interface BiomeTerrainProfile {
  low: string;
  high: string;
  cliff: string;
  accent: string;
  fog: string;
  sky: string;
  water?: string;
  waterLevel: number;
  relief: number;
  ruggedness: number;
  edgeDrop: number;
  centerStability: number;
  decor: 'forest' | 'rocks' | 'ice' | 'crystals' | 'deadland';
}

const BIOME_TERRAIN: Record<PlanetArchetype, BiomeTerrainProfile> = {
  oceanic: {
    low: '#c4b07d',
    high: '#6f9a62',
    cliff: '#54615f',
    accent: '#83b28f',
    fog: '#8eb4c3',
    sky: '#6793aa',
    water: '#2f7a98',
    waterLevel: -6.2,
    relief: 12,
    ruggedness: 0.55,
    edgeDrop: 28,
    centerStability: 0.75,
    decor: 'forest',
  },
  frozen: {
    low: '#d3e2eb',
    high: '#f8fcff',
    cliff: '#6d7d8b',
    accent: '#b5deed',
    fog: '#bed2df',
    sky: '#8aa1b0',
    water: '#7fb6ce',
    waterLevel: -5.1,
    relief: 10,
    ruggedness: 0.62,
    edgeDrop: 21,
    centerStability: 0.84,
    decor: 'ice',
  },
  arid: {
    low: '#b38351',
    high: '#e0bc86',
    cliff: '#7b5537',
    accent: '#c89155',
    fog: '#b48f6e',
    sky: '#9f856d',
    waterLevel: -30,
    relief: 11,
    ruggedness: 0.66,
    edgeDrop: 18,
    centerStability: 0.65,
    decor: 'rocks',
  },
  volcanic: {
    low: '#3c3234',
    high: '#655758',
    cliff: '#1d1819',
    accent: '#bc5d32',
    fog: '#665755',
    sky: '#5a4c4a',
    waterLevel: -35,
    relief: 14,
    ruggedness: 0.82,
    edgeDrop: 24,
    centerStability: 0.6,
    decor: 'deadland',
  },
  mineral: {
    low: '#656e79',
    high: '#8e959b',
    cliff: '#4b5058',
    accent: '#8ec4db',
    fog: '#87929d',
    sky: '#76818b',
    waterLevel: -30,
    relief: 12,
    ruggedness: 0.74,
    edgeDrop: 19,
    centerStability: 0.66,
    decor: 'crystals',
  },
  terrestrial: {
    low: '#6f8b5a',
    high: '#a0ba7e',
    cliff: '#64594a',
    accent: '#5f9159',
    fog: '#8aa183',
    sky: '#75956f',
    waterLevel: -24,
    relief: 10,
    ruggedness: 0.56,
    edgeDrop: 16,
    centerStability: 0.78,
    decor: 'forest',
  },
  jungle: {
    low: '#4c7245',
    high: '#809d57',
    cliff: '#4d503d',
    accent: '#40914e',
    fog: '#7ca277',
    sky: '#678d66',
    waterLevel: -23,
    relief: 11,
    ruggedness: 0.59,
    edgeDrop: 17,
    centerStability: 0.72,
    decor: 'forest',
  },
  barren: {
    low: '#6a6059',
    high: '#8f8378',
    cliff: '#4d4741',
    accent: '#948b7f',
    fog: '#7e766e',
    sky: '#6a645f',
    waterLevel: -32,
    relief: 9,
    ruggedness: 0.71,
    edgeDrop: 15,
    centerStability: 0.62,
    decor: 'rocks',
  },
};

export class CityFoundationMode implements RenderModeController {
  readonly id = 'city3d' as const;

  private readonly layout = new CityLayoutStore({ width: GRID_WIDTH, height: GRID_HEIGHT });
  private root: HTMLElement | null = null;
  private canvasWrap: HTMLDivElement | null = null;
  private hudMeta: HTMLParagraphElement | null = null;

  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;

  private terrain: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial> | null = null;
  private farField: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial> | null = null;
  private water: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial> | null = null;
  private decorGroup: THREE.Group | null = null;

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

    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'city-view-hud__back';
    back.textContent = 'Back';
    back.addEventListener('click', () => this.context.onRequestMode('planet3d'));

    hud.append(meta, back);
    root.append(canvasWrap, hud);
    this.context.host.appendChild(root);

    this.root = root;
    this.canvasWrap = canvasWrap;

    this.initScene();
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
    this.renderer.render(this.scene, this.camera);
  }

  setSelectedPlanet(nextPlanet: SelectedPlanetRef) {
    if (nextPlanet.id === this.selectedPlanet.id && nextPlanet.seed === this.selectedPlanet.seed) return;
    this.selectedPlanet = nextPlanet;
    this.rebuildCityTerrain();
    this.syncHud();
  }

  destroy() {
    this.disposeCurrentMeshes();
    this.renderer?.dispose();
    this.root?.remove();

    this.root = null;
    this.canvasWrap = null;
    this.hudMeta = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
  }

  private initScene() {
    if (!this.canvasWrap) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.classList.add('render-surface');
    this.canvasWrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 900);
    camera.position.set(0, 126, 148);
    camera.lookAt(0, 4, 6);

    const hemi = new THREE.HemisphereLight(0xe7f1ff, 0x2f3123, 0.88);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff2d7, 1.1);
    sun.position.set(90, 130, 35);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -190;
    sun.shadow.camera.right = 190;
    sun.shadow.camera.top = 190;
    sun.shadow.camera.bottom = -190;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0xb7d5ff, 0.25);
    fill.position.set(-50, 38, -90);
    scene.add(fill);

    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
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

    this.terrain = null;
    this.farField = null;
    this.water = null;
    this.decorGroup = null;
  }

  private rebuildCityTerrain() {
    if (!this.scene) return;
    this.disposeCurrentMeshes();

    const visual = planetProfileFromSeed(this.selectedPlanet.seed);
    const biome = BIOME_TERRAIN[visual.archetype];
    const snapshot = this.layout.getSnapshot();

    this.scene.fog = new THREE.Fog(new THREE.Color(biome.fog), 140, 460);
    this.scene.background = new THREE.Color(biome.sky);

    const farGeo = new THREE.PlaneGeometry(FAR_FIELD_WIDTH, FAR_FIELD_DEPTH, 120, 96);
    farGeo.rotateX(-Math.PI / 2);
    applyTerrainHeights(farGeo, this.selectedPlanet.seed ^ 0x44bb11, visual, biome, snapshot, true);
    farGeo.computeVertexNormals();

    const farMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(biome.low),
      roughness: 0.98,
      metalness: 0.03,
      vertexColors: true,
    });
    tintTerrain(farGeo, visual, biome, true);

    const farField = new THREE.Mesh(farGeo, farMat);
    farField.position.y = -3.8;
    farField.receiveShadow = true;
    this.scene.add(farField);
    this.farField = farField;

    const terrainGeo = new THREE.PlaneGeometry(TERRAIN_WIDTH, TERRAIN_DEPTH, 260, 190);
    terrainGeo.rotateX(-Math.PI / 2);
    applyTerrainHeights(terrainGeo, this.selectedPlanet.seed, visual, biome, snapshot, false);
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(biome.low),
      roughness: 0.95,
      metalness: visual.metalness * 0.2,
      vertexColors: true,
    });
    tintTerrain(terrainGeo, visual, biome, false);

    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.receiveShadow = true;
    this.scene.add(terrain);
    this.terrain = terrain;

    if (biome.water) {
      const water = new THREE.Mesh(
        new THREE.PlaneGeometry(FAR_FIELD_WIDTH * 0.98, FAR_FIELD_DEPTH * 0.95, 1, 1),
        new THREE.MeshStandardMaterial({
          color: biome.water,
          roughness: 0.23,
          metalness: 0.08,
          transparent: true,
          opacity: visual.archetype === 'frozen' ? 0.65 : 0.88,
        }),
      );
      water.rotation.x = -Math.PI / 2;
      water.position.y = biome.waterLevel;
      this.scene.add(water);
      this.water = water;
    }

    const decor = buildDecorGroup(this.selectedPlanet.seed, visual, biome, snapshot);
    this.scene.add(decor);
    this.decorGroup = decor;
  }

  private syncHud() {
    if (!this.hudMeta) return;
    const profile = planetProfileFromSeed(this.selectedPlanet.seed);
    this.hudMeta.textContent = `${this.selectedPlanet.id.toUpperCase()} · ${profile.archetype}`;
  }
}

function applyTerrainHeights(
  geometry: THREE.PlaneGeometry,
  seed: number,
  visual: PlanetVisualProfile,
  biome: BiomeTerrainProfile,
  snapshot: ReturnType<CityLayoutStore['getSnapshot']>,
  farField: boolean,
) {
  const pos = geometry.attributes.position;

  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const h = sampleTerrainHeight(x, z, seed, visual, biome, snapshot, farField);
    pos.setY(i, h);
  }

  pos.needsUpdate = true;
}

function sampleTerrainHeight(
  x: number,
  z: number,
  seed: number,
  visual: PlanetVisualProfile,
  biome: BiomeTerrainProfile,
  snapshot: ReturnType<CityLayoutStore['getSnapshot']>,
  farField: boolean,
) {
  const nx = x / TERRAIN_WIDTH;
  const nz = z / TERRAIN_DEPTH;
  const radial = Math.max(Math.abs(nx) * 0.96, Math.abs(nz) * 1.06);

  const macro = fbm2(nx * visual.continentScale * 2.6, nz * visual.continentScale * 2.6, seed, 5);
  const ridges = ridgeNoise(nx * visual.ridgeScale * 0.5, nz * visual.ridgeScale * 0.5, seed ^ 0x15ab11cd);
  const micro = fbm2(nx * 8.5, nz * 8.5, seed ^ 0xba11, 3);

  let height = (macro * 0.7 + ridges * biome.ruggedness + micro * 0.26) * biome.relief;

  const buildableHint = buildableWeight(x, z, snapshot);
  const cityShelf = smoothstep(0.12, 0.82, buildableHint);
  const stable = Math.round(height / 0.65) * 0.65;
  height = height * (1 - cityShelf * biome.centerStability) + stable * cityShelf * biome.centerStability;

  const rim = smoothstep(0.52, 1.08, radial);
  height -= rim * biome.edgeDrop;

  if (visual.archetype === 'oceanic') {
    const coastMask = smoothstep(1.06, 0.28, radial + fbm2(nx * 3.5, nz * 3.5, seed ^ 0x99, 2) * 0.14);
    const lagoon = smoothstep(0.23, 0.64, 1 - radial) * 2.5;
    height = height * coastMask + lagoon;
    height -= (1 - coastMask) * 9;
  }

  if (visual.archetype === 'frozen') {
    const shelf = smoothstep(1.02, 0.34, radial + fbm2(nx * 2.2, nz * 2.2, seed ^ 0xff22, 2) * 0.08);
    const cracked = fbm2(nx * 14, nz * 14, seed ^ 0x1199dd, 2);
    const fracture = smoothstep(0.42, 0.78, Math.abs(cracked)) * 1.7;
    height = height * shelf - (1 - shelf) * 6.5 - fracture;
  }

  if (visual.archetype === 'volcanic') {
    const lavaRidge = smoothstep(0.55, 0.9, ridges);
    height += lavaRidge * 3.4;
  }

  if (farField) {
    height *= 0.55;
    height -= 4;
  }

  return height;
}

function tintTerrain(geometry: THREE.PlaneGeometry, visual: PlanetVisualProfile, biome: BiomeTerrainProfile, farField: boolean) {
  const pos = geometry.attributes.position;
  const low = new THREE.Color(biome.low);
  const high = new THREE.Color(biome.high);
  const cliff = new THREE.Color(biome.cliff);
  const accent = new THREE.Color(biome.accent);

  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i += 1) {
    const y = pos.getY(i);
    const x = pos.getX(i) / TERRAIN_WIDTH;
    const z = pos.getZ(i) / TERRAIN_DEPTH;

    const blend = smoothstep(-9, 10, y);
    const slope = smoothstep(0.2, 0.9, Math.abs(fbm2(x * 7.4, z * 7.4, 0x7711af, 2)) + visual.reliefSharpness * 0.15);

    const color = low.clone().lerp(high, blend);
    color.lerp(cliff, slope * 0.42);

    if (visual.archetype === 'oceanic') {
      const beach = smoothstep(-7.2, -3.3, y);
      color.lerp(new THREE.Color('#dbc995'), beach * 0.6);
    }

    if (visual.archetype === 'frozen') {
      const ice = smoothstep(-6.4, 5.5, y);
      color.lerp(new THREE.Color('#f3fbff'), ice * 0.35);
      const blueIce = smoothstep(-7.5, -4.4, y);
      color.lerp(new THREE.Color('#99cfe2'), blueIce * 0.32);
    }

    if (visual.archetype === 'jungle' || visual.archetype === 'terrestrial') {
      const lush = smoothstep(0.38, 0.86, fbm2(x * 9.5, z * 9.5, 0x55aa11, 3));
      color.lerp(accent, lush * 0.27);
    }

    if (visual.archetype === 'volcanic') {
      const heat = smoothstep(0.45, 0.88, fbm2(x * 12.4, z * 12.4, 0x9112, 3));
      color.lerp(accent, heat * 0.36);
    }

    if (visual.archetype === 'mineral') {
      const veins = smoothstep(0.5, 0.9, fbm2(x * 11, z * 11, 0x88cc, 3));
      color.lerp(accent, veins * 0.25);
    }

    if (farField) color.lerp(new THREE.Color(biome.fog), 0.34);

    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

function buildDecorGroup(
  seed: number,
  visual: PlanetVisualProfile,
  biome: BiomeTerrainProfile,
  snapshot: ReturnType<CityLayoutStore['getSnapshot']>,
) {
  const group = new THREE.Group();
  const rng = mulberry32(seed ^ 0xee45aa91);

  const count = biome.decor === 'forest' ? 140 : biome.decor === 'rocks' ? 100 : 90;
  for (let i = 0; i < count; i += 1) {
    const ring = lerp(0.56, 1.04, rng());
    const angle = rng() * Math.PI * 2;
    const x = Math.cos(angle) * ring * (TERRAIN_WIDTH * 0.55);
    const z = Math.sin(angle) * ring * (TERRAIN_DEPTH * 0.55);

    if (buildableWeight(x, z, snapshot) > 0.72) continue;

    const geo = pickDecorGeometry(biome.decor, rng);
    const mat = new THREE.MeshStandardMaterial({
      color: pickDecorColor(biome, visual, rng),
      roughness: 0.92,
      metalness: biome.decor === 'crystals' ? 0.34 : 0.06,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, sampleTerrainHeight(x, z, seed, visual, biome, snapshot, false) + 0.2, z);
    mesh.rotation.y = rng() * Math.PI * 2;
    mesh.scale.setScalar(lerp(0.72, 1.72, rng()));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  return group;
}

function pickDecorGeometry(type: BiomeTerrainProfile['decor'], rng: () => number) {
  if (type === 'forest') {
    if (rng() > 0.5) return new THREE.ConeGeometry(lerp(0.5, 1, rng()), lerp(2, 3.8, rng()), 7);
    return new THREE.CylinderGeometry(lerp(0.18, 0.38, rng()), lerp(0.2, 0.44, rng()), lerp(1.2, 2.4, rng()), 6);
  }
  if (type === 'ice') return new THREE.CylinderGeometry(lerp(0.2, 0.5, rng()), lerp(0.3, 0.7, rng()), lerp(1.2, 3.4, rng()), 5);
  if (type === 'crystals') return new THREE.OctahedronGeometry(lerp(0.28, 0.8, rng()), 0);
  return new THREE.DodecahedronGeometry(lerp(0.3, 0.8, rng()), 0);
}

function pickDecorColor(biome: BiomeTerrainProfile, visual: PlanetVisualProfile, rng: () => number) {
  const primary = new THREE.Color(biome.accent);
  const secondary = new THREE.Color(biome.cliff);
  const mixed = primary.lerp(secondary, lerp(0.2, 0.7, rng()));
  if (visual.archetype === 'frozen') mixed.lerp(new THREE.Color('#f2fbff'), 0.4);
  if (visual.archetype === 'volcanic') mixed.lerp(new THREE.Color('#a0442d'), 0.45);
  return mixed;
}

function buildableWeight(x: number, z: number, snapshot: ReturnType<CityLayoutStore['getSnapshot']>) {
  const nx = x / TERRAIN_WIDTH;
  const nz = z / TERRAIN_DEPTH;
  const centerMask = smoothstep(1.1, 0.12, Math.max(Math.abs(nx), Math.abs(nz)));
  const tile = worldToTile(x, z);
  if (!tile) return centerMask * 0.35;
  const buildable = isBuildableTile(tile.x, tile.y, snapshot) ? 1 : 0.12;
  return centerMask * buildable;
}

function isBuildableTile(x: number, y: number, snapshot: ReturnType<CityLayoutStore['getSnapshot']>) {
  const key = tileKey(x, y);
  return !snapshot.blocked.has(key) && !snapshot.expansion.has(key);
}

function worldToTile(x: number, z: number) {
  const tx = Math.floor(((x + TERRAIN_WIDTH * 0.5) / TERRAIN_WIDTH) * GRID_WIDTH);
  const ty = Math.floor(((z + TERRAIN_DEPTH * 0.5) / TERRAIN_DEPTH) * GRID_HEIGHT);
  if (tx < 0 || ty < 0 || tx >= GRID_WIDTH || ty >= GRID_HEIGHT) return null;
  return { x: tx, y: ty };
}

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function ridgeNoise(x: number, y: number, seed: number) {
  return 1 - Math.abs(fbm2(x, y, seed, 4));
}

function fbm2(x: number, y: number, seed: number, octaves: number) {
  let amplitude = 0.5;
  let frequency = 1;
  let value = 0;
  for (let i = 0; i < octaves; i += 1) {
    value += amplitude * valueNoise2(x * frequency, y * frequency, seed + i * 31);
    amplitude *= 0.5;
    frequency *= 2;
  }
  return value;
}

function valueNoise2(x: number, y: number, seed: number) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = x0 + 1;
  const y1 = y0 + 1;

  const sx = smooth(fract(x));
  const sy = smooth(fract(y));

  const n00 = hash2(x0, y0, seed);
  const n10 = hash2(x1, y0, seed);
  const n01 = hash2(x0, y1, seed);
  const n11 = hash2(x1, y1, seed);

  const nx0 = lerp(n00, n10, sx);
  const nx1 = lerp(n01, n11, sx);
  return lerp(nx0, nx1, sy) * 2 - 1;
}

function hash2(x: number, y: number, seed: number) {
  let n = x * 374761393 + y * 668265263 + seed * 69069;
  n = (n ^ (n >> 13)) * 1274126177;
  n ^= n >> 16;
  return ((n >>> 0) & 0xffffffff) / 0xffffffff;
}

function fract(value: number) {
  return value - Math.floor(value);
}

function smooth(t: number) {
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1), 0, 1);
  return t * t * (3 - 2 * t);
}
