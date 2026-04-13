import * as THREE from 'three';
import type { ModeContext, RenderModeController } from '@/game/render/modes/RenderModeController';
import type { PlanetArchetype, PlanetVisualProfile, SelectedPlanetRef } from '@/game/render/types';
import { CityLayoutStore, tileKey } from '@/game/city/layout/cityLayout';
import { planetProfileFromSeed } from '@/game/world/galaxyGenerator';
import { SeededRng } from '@/game/world/rng';

const GRID_WIDTH = 20;
const GRID_HEIGHT = 14;
const TERRAIN_WIDTH = 140;
const TERRAIN_DEPTH = 98;

interface BiomeStyle {
  terrainLow: string;
  terrainHigh: string;
  cliff: string;
  accent: string;
  fog: string;
  water?: string;
  decor: 'forest' | 'rocks' | 'ice' | 'crystals' | 'deadland';
}

const BIOME_STYLES: Record<PlanetArchetype, BiomeStyle> = {
  oceanic: {
    terrainLow: '#cfbf88', terrainHigh: '#5f8f63', cliff: '#5f6862', accent: '#7eb89a', fog: '#9bbfca', water: '#3f8caf', decor: 'forest',
  },
  frozen: {
    terrainLow: '#c5d5df', terrainHigh: '#f1f8ff', cliff: '#7c8792', accent: '#a9d7e9', fog: '#c2d7e4', water: '#8dc5dc', decor: 'ice',
  },
  arid: {
    terrainLow: '#b98b5e', terrainHigh: '#dfbc84', cliff: '#7f5a3c', accent: '#c98a4f', fog: '#b99270', decor: 'rocks',
  },
  volcanic: {
    terrainLow: '#3d3435', terrainHigh: '#655959', cliff: '#1e1a1a', accent: '#b75a36', fog: '#6d5a55', decor: 'deadland',
  },
  mineral: {
    terrainLow: '#616974', terrainHigh: '#8b9298', cliff: '#4a4f59', accent: '#8ec2d9', fog: '#89949f', decor: 'crystals',
  },
  terrestrial: {
    terrainLow: '#6e8a59', terrainHigh: '#9cb57c', cliff: '#635949', accent: '#5d8a53', fog: '#8ca184', decor: 'forest',
  },
  jungle: {
    terrainLow: '#4f7547', terrainHigh: '#7f9a58', cliff: '#4e4f3d', accent: '#3f8f4f', fog: '#7da178', decor: 'forest',
  },
  barren: {
    terrainLow: '#696058', terrainHigh: '#8c8177', cliff: '#4f4842', accent: '#948a7f', fog: '#7d756d', decor: 'rocks',
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

    const title = document.createElement('p');
    title.className = 'city-view-hud__title';
    title.textContent = 'City View';

    const meta = document.createElement('p');
    meta.className = 'city-view-hud__meta';
    this.hudMeta = meta;

    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'city-view-hud__back';
    back.textContent = 'Back to Planet';
    back.addEventListener('click', () => this.context.onRequestMode('planet3d'));

    hud.append(title, meta, back);
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
    this.terrain?.geometry.dispose();
    this.terrain?.material.dispose();
    this.water?.geometry.dispose();
    this.water?.material.dispose();
    this.decorGroup?.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach((mat) => mat.dispose());
        else obj.material.dispose();
      }
    });

    this.renderer?.dispose();
    this.root?.remove();

    this.root = null;
    this.canvasWrap = null;
    this.hudMeta = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.terrain = null;
    this.water = null;
    this.decorGroup = null;
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

    const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 520);
    camera.position.set(72, 76, 72);
    camera.lookAt(0, 0, 0);

    const hemi = new THREE.HemisphereLight(0xe8f2ff, 0x29311f, 0.85);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff3d4, 1.05);
    sun.position.set(65, 94, 28);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -120;
    sun.shadow.camera.right = 120;
    sun.shadow.camera.top = 120;
    sun.shadow.camera.bottom = -120;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0xb8d8ff, 0.28);
    fill.position.set(-40, 25, -55);
    scene.add(fill);

    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
  }

  private rebuildCityTerrain() {
    if (!this.scene) return;

    if (this.terrain) {
      this.scene.remove(this.terrain);
      this.terrain.geometry.dispose();
      this.terrain.material.dispose();
      this.terrain = null;
    }
    if (this.water) {
      this.scene.remove(this.water);
      this.water.geometry.dispose();
      this.water.material.dispose();
      this.water = null;
    }
    if (this.decorGroup) {
      this.scene.remove(this.decorGroup);
      this.decorGroup.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((mat) => mat.dispose());
          else obj.material.dispose();
        }
      });
      this.decorGroup = null;
    }

    const profile = planetProfileFromSeed(this.selectedPlanet.seed);
    const style = BIOME_STYLES[profile.archetype];

    this.scene.fog = new THREE.Fog(new THREE.Color(style.fog), 92, 220);
    this.scene.background = new THREE.Color(style.fog).multiplyScalar(0.56);

    const terrainGeo = new THREE.PlaneGeometry(TERRAIN_WIDTH, TERRAIN_DEPTH, 190, 132);
    terrainGeo.rotateX(-Math.PI / 2);
    applyTerrainHeights(terrainGeo, this.selectedPlanet.seed, profile, this.layout.getSnapshot());
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(style.terrainLow),
      roughness: 0.96,
      metalness: profile.metalness * 0.35,
      flatShading: false,
      vertexColors: true,
    });

    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.castShadow = false;
    terrain.receiveShadow = true;

    tintTerrain(terrainGeo, style, profile);

    this.scene.add(terrain);
    this.terrain = terrain;

    if (style.water) {
      const water = new THREE.Mesh(
        new THREE.PlaneGeometry(TERRAIN_WIDTH * 0.7, TERRAIN_DEPTH * 0.65, 1, 1),
        new THREE.MeshStandardMaterial({
          color: style.water,
          roughness: 0.2,
          metalness: 0.05,
          transparent: true,
          opacity: 0.86,
        }),
      );
      water.rotation.x = -Math.PI / 2;
      water.position.set(-18, -1.2, 12);
      water.receiveShadow = true;
      this.scene.add(water);
      this.water = water;
    }

    const decor = buildDecorGroup(this.selectedPlanet.seed, style, profile);
    this.scene.add(decor);
    this.decorGroup = decor;
  }

  private syncHud() {
    if (!this.hudMeta) return;
    const profile = planetProfileFromSeed(this.selectedPlanet.seed);
    this.hudMeta.textContent = `${this.selectedPlanet.id.toUpperCase()} · ${profile.archetype.toUpperCase()} · terrain-first city slice`;
  }
}

function applyTerrainHeights(
  geometry: THREE.PlaneGeometry,
  seed: number,
  profile: PlanetVisualProfile,
  snapshot: ReturnType<CityLayoutStore['getSnapshot']>,
) {
  const pos = geometry.attributes.position;
  const rng = new SeededRng(seed ^ 0x5f2e1a9b);

  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const nx = x / TERRAIN_WIDTH;
    const nz = z / TERRAIN_DEPTH;

    const macro = fbm2(nx * profile.continentScale * 3.2, nz * profile.continentScale * 3.2, seed, 4);
    const ridges = ridgeNoise(nx * profile.ridgeScale * 0.44, nz * profile.ridgeScale * 0.44, seed ^ 0x12ab34cd);
    const cracks = fbm2(nx * profile.craterScale * 0.6, nz * profile.craterScale * 0.6, seed ^ 0xa93fd411, 3);

    const edge = smoothstep(1, 0.35, Math.max(Math.abs(nx) * 1.14, Math.abs(nz) * 1.18));
    const biomeLift = profile.reliefStrength * 20;

    let y = (macro * 0.65 + ridges * profile.ridgeWeight * 0.8 - cracks * profile.craterWeight * 0.45 + profile.macroBias * 0.75) * biomeLift;
    y += edge * 6.2 - (1 - edge) * 12;

    const tile = worldToTile(x, z);
    if (tile && isBuildableTile(tile.x, tile.y, snapshot)) {
      const centerWeight = smoothstep(0, 1, 1 - Math.max(Math.abs(nx) * 1.18, Math.abs(nz) * 1.3));
      const terrace = Math.round(y / 0.45) * 0.45;
      y = y * (1 - centerWeight * 0.55) + terrace * centerWeight * 0.55;
    }

    if (profile.archetype === 'oceanic') y -= 2.2;
    if (profile.archetype === 'frozen') y -= 0.4;
    if (profile.archetype === 'volcanic') y += Math.max(0, ridges - 0.4) * 4.5;

    y += (rng.next() - 0.5) * 0.1;
    pos.setY(i, y);
  }

  pos.needsUpdate = true;
}

function tintTerrain(geometry: THREE.PlaneGeometry, style: BiomeStyle, profile: PlanetVisualProfile) {
  const pos = geometry.attributes.position;
  const low = new THREE.Color(style.terrainLow);
  const high = new THREE.Color(style.terrainHigh);
  const cliff = new THREE.Color(style.cliff);
  const accent = new THREE.Color(style.accent);

  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i += 1) {
    const y = pos.getY(i);
    const x = pos.getX(i) / TERRAIN_WIDTH;
    const z = pos.getZ(i) / TERRAIN_DEPTH;

    const slopeHint = Math.abs(fbm2(x * 7.2, z * 7.2, 0x7f3d119a, 2));
    const h = smoothstep(-6, 9, y);

    const base = low.clone().lerp(high, h);
    const cliffMix = smoothstep(0.5, 0.9, slopeHint + profile.reliefSharpness * 0.12);
    base.lerp(cliff, cliffMix * 0.5);

    if (profile.archetype === 'volcanic') {
      const heat = smoothstep(0.45, 0.92, fbm2(x * 11, z * 11, 0x91723, 3));
      base.lerp(accent, heat * 0.32);
    }
    if (profile.archetype === 'jungle' || profile.archetype === 'terrestrial') {
      const lush = smoothstep(0.4, 0.8, fbm2(x * 9.5, z * 9.5, 0x101011, 3));
      base.lerp(accent, lush * 0.28 * profile.humidityStrength);
    }
    if (profile.archetype === 'frozen') {
      const frost = smoothstep(-1.8, 8, y);
      base.lerp(new THREE.Color('#f6fcff'), frost * 0.26);
    }

    colors[i * 3] = base.r;
    colors[i * 3 + 1] = base.g;
    colors[i * 3 + 2] = base.b;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

function buildDecorGroup(seed: number, style: BiomeStyle, profile: PlanetVisualProfile) {
  const group = new THREE.Group();
  const rng = new SeededRng(seed ^ 0xee45aa91);

  const count = style.decor === 'forest' ? 180 : style.decor === 'rocks' ? 120 : 90;
  for (let i = 0; i < count; i += 1) {
    const ring = rng.range(0.7, 1);
    const angle = rng.range(0, Math.PI * 2);
    const x = Math.cos(angle) * ring * (TERRAIN_WIDTH * 0.52);
    const z = Math.sin(angle) * ring * (TERRAIN_DEPTH * 0.52);

    if (Math.abs(x) < TERRAIN_WIDTH * 0.24 && Math.abs(z) < TERRAIN_DEPTH * 0.24) continue;

    const geo = pickDecorGeometry(style.decor, rng);
    const color = pickDecorColor(style, profile, rng);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: style.decor === 'crystals' ? 0.28 : 0.04 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, rng.range(0.2, 3.8), z);
    mesh.rotation.y = rng.range(0, Math.PI * 2);
    const scale = rng.range(0.8, 1.7);
    mesh.scale.setScalar(scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  return group;
}

function pickDecorGeometry(type: BiomeStyle['decor'], rng: SeededRng) {
  if (type === 'forest') {
    if (rng.next() > 0.5) return new THREE.ConeGeometry(rng.range(0.35, 0.75), rng.range(1.6, 3.2), 7);
    return new THREE.CylinderGeometry(rng.range(0.14, 0.25), rng.range(0.15, 0.3), rng.range(1.2, 2), 6);
  }
  if (type === 'ice') return new THREE.CylinderGeometry(rng.range(0.15, 0.45), rng.range(0.2, 0.5), rng.range(1, 3.2), 5);
  if (type === 'crystals') return new THREE.OctahedronGeometry(rng.range(0.26, 0.7), 0);
  return new THREE.DodecahedronGeometry(rng.range(0.24, 0.68), 0);
}

function pickDecorColor(style: BiomeStyle, profile: PlanetVisualProfile, rng: SeededRng) {
  const primary = new THREE.Color(style.accent);
  const secondary = new THREE.Color(style.cliff);
  const mixed = primary.lerp(secondary, rng.range(0.2, 0.7));
  if (profile.archetype === 'frozen') mixed.lerp(new THREE.Color('#eaf7ff'), 0.35);
  if (profile.archetype === 'volcanic') mixed.lerp(new THREE.Color('#9a3f29'), 0.4);
  return mixed;
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

  const sx = smooth( fract(x));
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
