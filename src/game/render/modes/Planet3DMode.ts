import * as THREE from 'three';
import type { ModeContext, RenderModeController } from '@/game/render/modes/RenderModeController';
import type { PlanetVisualProfile, SelectedPlanetRef } from '@/game/render/types';
import { planetProfileFromSeed } from '@/game/world/galaxyGenerator';
import { SeededRng } from '@/game/world/rng';

export class Planet3DMode implements RenderModeController {
  readonly id = 'planet3d' as const;

  private renderer: THREE.WebGLRenderer | null = null;

  private scene = new THREE.Scene();

  private camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);

  private root = new THREE.Group();

  private planet: THREE.Mesh | null = null;

  private generatedTextures: THREE.Texture[] = [];

  private currentMaps: PlanetMaps | null = null;

  private debugViewIndex = 0;

  private inspectPanel: HTMLDivElement | null = null;

  private inspectTitle: HTMLHeadingElement | null = null;

  private inspectSubtitle: HTMLParagraphElement | null = null;

  private inspectTags: HTMLDivElement | null = null;

  private backButton: HTMLButtonElement | null = null;

  private width = 1;

  private height = 1;

  private isDragging = false;

  private pointerId: number | null = null;

  private lastX = 0;

  private lastY = 0;

  private readonly dragYaw = new THREE.Quaternion();

  private readonly dragPitch = new THREE.Quaternion();

  private readonly dragPitchAxis = new THREE.Vector3(1, 0, 0);

  private readonly debugViewModes: Array<keyof PlanetMaps['debugMaps'] | 'beauty'> = [
    'beauty',
    'abyssalDepthMask',
    'trenchMask',
    'iceCapMask',
    'calderaMask',
    'lavaPlainMask',
    'canyonMask',
    'mountainMask',
    'valleyMask',
    'mineralDepositMask',
    'shelfMask',
    'emergentLandMask',
    'volcanoField',
    'mountainChainField',
    'plateauField',
    'trenchField',
    'basinField',
    'riftField',
    'calderaField',
    'compressionRidgeMask',
    'depositMask',
    'upliftField',
    'depressionField',
    'finalSignedRelief',
    'craterField',
    'finalNormal',
  ];

  constructor(
    private selectedPlanet: SelectedPlanetRef,
    private readonly context: ModeContext,
  ) {}

  mount() {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.domElement.className = 'render-surface render-surface--planet';

    this.renderer = renderer;
    this.context.host.appendChild(renderer.domElement);

    this.scene.background = new THREE.Color(0x0a1220);
    this.scene.add(this.root);

    const ambient = new THREE.AmbientLight(0xe0efff, 0.66);
    this.scene.add(ambient);

    const skylight = new THREE.DirectionalLight(0xcfe3ff, 0.68);
    skylight.position.set(2.4, 1.8, 2.2);
    this.scene.add(skylight);
    const wrapFill = new THREE.DirectionalLight(0xaecdf5, 0.24);
    wrapFill.position.set(-2.2, 0.8, -2.4);
    this.scene.add(wrapFill);
    const topFill = new THREE.DirectionalLight(0xb9ddff, 0.2);
    topFill.position.set(0, 3.2, 0.4);
    this.scene.add(topFill);
    const frontFill = new THREE.DirectionalLight(0xe6f2ff, 0.12);
    frontFill.position.set(0.2, 0.3, 3);
    this.scene.add(frontFill);

    this.camera.position.set(0, 0, 2.6);
    this.scene.add(this.camera);

    this.rebuildPlanet(this.selectedPlanet);
    this.mountInspectPanel();

    renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
    window.addEventListener('keydown', this.onKeyDown);
  }

  resize(width: number, height: number) {
    this.width = Math.max(width, 1);
    this.height = Math.max(height, 1);

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer?.setSize(this.width, this.height, false);
  }

  update(deltaMs: number) {
    void deltaMs;

    this.renderer?.render(this.scene, this.camera);
  }

  setSelectedPlanet(nextPlanet: SelectedPlanetRef) {
    if (nextPlanet.id === this.selectedPlanet.id && nextPlanet.seed === this.selectedPlanet.seed) {
      return;
    }

    this.selectedPlanet = nextPlanet;
    this.rebuildPlanet(nextPlanet);
  }

  destroy() {
    this.renderer?.domElement.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
    window.removeEventListener('keydown', this.onKeyDown);

    if (this.planet) {
      this.planet.geometry.dispose();
      const material = this.planet.material;
      if (material instanceof THREE.Material) material.dispose();
      this.root.remove(this.planet);
      this.planet = null;
    }

    for (const texture of this.generatedTextures) texture.dispose();
    this.generatedTextures = [];
    this.currentMaps = null;

    this.renderer?.dispose();
    this.renderer?.domElement.remove();
    this.renderer = null;

    this.inspectPanel?.remove();
    this.inspectPanel = null;
    this.inspectTitle = null;
    this.inspectSubtitle = null;
    this.inspectTags = null;
    this.backButton = null;

    this.scene.clear();
  }

  private rebuildPlanet(planetRef: SelectedPlanetRef) {
    if (this.planet) {
      this.planet.geometry.dispose();
      const material = this.planet.material;
      if (material instanceof THREE.Material) material.dispose();
      this.root.remove(this.planet);
      this.planet = null;
    }

    for (const texture of this.generatedTextures) texture.dispose();
    this.generatedTextures = [];
    this.currentMaps = null;

    const profile = planetProfileFromSeed(planetRef.seed);
    const geometry = new THREE.SphereGeometry(1, 196, 128);
    geometry.computeVertexNormals();

    const maps = buildPlanetMaps(profile, planetRef.seed);
    this.generatedTextures = [
      maps.map,
      maps.roughnessMap,
      maps.metalnessMap,
      maps.normalMap,
      maps.emissiveMap,
      ...Object.values(maps.debugMaps),
    ];
    this.currentMaps = maps;

    applyPlanetReliefToGeometry(geometry, maps.terrainModel, profile, planetRef.seed);

    const material = new THREE.MeshStandardMaterial({
      map: maps.map,
      roughnessMap: maps.roughnessMap,
      metalnessMap: maps.metalnessMap,
      normalMap: maps.normalMap,
      normalScale: new THREE.Vector2(0.34, 0.34),
      emissiveMap: maps.emissiveMap,
      roughness: 1,
      metalness: 1,
      flatShading: false,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.72,
    });

    this.planet = new THREE.Mesh(geometry, material);
    this.root.add(this.planet);
    this.applyDebugView();

    this.updateInspectIdentity(planetRef, profile);
  }

  private readonly onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    this.pointerId = event.pointerId;
    this.isDragging = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
  };

  private readonly onPointerMove = (event: PointerEvent) => {
    if (!this.isDragging || this.pointerId !== event.pointerId || !this.planet) return;

    const dx = event.clientX - this.lastX;
    const dy = event.clientY - this.lastY;
    this.lastX = event.clientX;
    this.lastY = event.clientY;

    const yaw = dx * 0.0088;
    const pitch = dy * 0.0088;

    this.dragYaw.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, yaw);
    this.dragPitchAxis.set(1, 0, 0).applyQuaternion(this.camera.quaternion);
    this.dragPitch.setFromAxisAngle(this.dragPitchAxis, pitch);

    this.root.quaternion.premultiply(this.dragYaw);
    this.root.quaternion.premultiply(this.dragPitch);
  };

  private readonly onPointerUp = (event: PointerEvent) => {
    if (event.pointerId !== this.pointerId) return;
    this.pointerId = null;
    this.isDragging = false;
  };

  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      this.context.onRequestMode('galaxy2d');
      return;
    }
    if (event.key.toLowerCase() === 'h') {
      this.debugViewIndex = (this.debugViewIndex + 1) % this.debugViewModes.length;
      this.applyDebugView();
    }
  };

  private applyDebugView() {
    if (!this.planet || !this.currentMaps) return;
    const material = this.planet.material;
    if (!(material instanceof THREE.MeshStandardMaterial)) return;
    const mode = this.debugViewModes[this.debugViewIndex];
    if (mode === 'beauty') {
      material.map = this.currentMaps.map;
    } else {
      material.map = this.currentMaps.debugMaps[mode];
    }
    material.needsUpdate = true;
  }

  private mountInspectPanel() {
    const panel = document.createElement('div');
    panel.className = 'planet-inspect-panel';

    const title = document.createElement('h2');
    title.className = 'planet-inspect-title';

    const subtitle = document.createElement('p');
    subtitle.className = 'planet-inspect-subtitle';

    const tags = document.createElement('div');
    tags.className = 'planet-inspect-tags';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'planet-back-button';
    button.textContent = 'Back to Galaxy';
    button.addEventListener('click', () => {
      this.context.onRequestMode('galaxy2d');
    });

    panel.appendChild(title);
    panel.appendChild(subtitle);
    panel.appendChild(tags);
    panel.appendChild(button);

    this.context.host.appendChild(panel);
    this.inspectPanel = panel;
    this.inspectTitle = title;
    this.inspectSubtitle = subtitle;
    this.inspectTags = tags;
    this.backButton = button;

    const profile = planetProfileFromSeed(this.selectedPlanet.seed);
    this.updateInspectIdentity(this.selectedPlanet, profile);
  }

  private updateInspectIdentity(planetRef: SelectedPlanetRef, profile: PlanetVisualProfile) {
    if (!this.inspectTitle || !this.inspectSubtitle || !this.inspectTags) return;

    this.inspectTitle.textContent = `Planet ${planetRef.id.toUpperCase()}`;
    this.inspectSubtitle.textContent = `${toDisplayArchetype(profile.archetype)} world · Seed ${planetRef.seed.toString(16).toUpperCase().padStart(8, '0')}`;

    const tags = derivePlanetTags(planetRef.seed, profile);
    this.inspectTags.innerHTML = '';

    for (const tag of tags) {
      const chip = document.createElement('span');
      chip.className = 'planet-inspect-tag';
      chip.textContent = tag;
      this.inspectTags.appendChild(chip);
    }
  }

}

function derivePlanetTags(seed: number, profile: PlanetVisualProfile): string[] {
  const rng = new SeededRng(seed ^ 0x9e3779b9);

  const candidates: Array<{ label: string; score: number }> = [
    { label: profile.archetype, score: 1.25 },
    { label: 'high-relief', score: normalize(profile.reliefStrength, 0.12, 0.23) + normalize(profile.ridgeWeight, 0.2, 0.6) * 0.4 },
    { label: 'rifted crust', score: normalize(profile.craterWeight, 0.14, 0.36) + normalize(profile.reliefSharpness, 1.2, 2.3) * 0.35 },
    { label: 'metallic sheen', score: normalize(profile.metalness, 0.06, 0.28) + normalize(0.78 - profile.roughness, 0, 0.45) * 0.22 },
    { label: 'deep basins', score: normalize(profile.oceanLevel, 0.45, 0.82) + normalize(0.1 - profile.macroBias, -0.2, 0.1) * 0.3 },
    { label: 'dry plateaus', score: normalize(0.3 - profile.oceanLevel, 0.02, 0.3) + normalize(profile.macroBias, 0.12, 0.44) * 0.25 },
    { label: 'volatile mantle', score: normalize(profile.emissiveIntensity, 0.03, 0.12) + normalize(profile.lightIntensity, 1.2, 1.95) * 0.24 },
    { label: 'polar stress', score: normalize(profile.polarWeight, 0.14, 0.44) + normalize(profile.atmosphereLightness, 72, 88) * 0.2 },
  ];

  const picked = candidates
    .map((candidate) => ({
      ...candidate,
      score: candidate.score + rng.range(0, 0.06),
    }))
    .sort((a, b) => b.score - a.score)
    .filter((candidate) => candidate.score > 0.16)
    .slice(0, 3)
    .map((candidate) => candidate.label);

  if (picked.length >= 2) return picked.slice(0, 3);
  if (picked.length === 1) return [picked[0], 'charted'];
  return ['charted', 'stable'];
}

function toDisplayArchetype(archetype: PlanetVisualProfile['archetype']) {
  return `${archetype.charAt(0).toUpperCase()}${archetype.slice(1)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalize(value: number, min: number, max: number) {
  if (max <= min) return 0;
  return clamp((value - min) / (max - min), 0, 1);
}

const SEMANTIC_MASK_NAMES = [
  'abyssalDepthMask',
  'trenchMask',
  'basinDepthMask',
  'openOceanMask',
  'shelfMask',
  'shallowWaterMask',
  'coastMask',
  'emergentLandMask',
  'rockyIslandMask',
  'deepFrozenBasinMask',
  'iceCapMask',
  'iceSheetMask',
  'iceShelfMask',
  'compressionRidgeMask',
  'crevasseMask',
  'frozenHighlandMask',
  'exposedRockMask',
  'volcanicConeMask',
  'calderaMask',
  'lavaPlainMask',
  'fissureMask',
  'collapseBasinMask',
  'ashFieldMask',
  'cooledRockMask',
  'plateauTopMask',
  'mesaMask',
  'escarpmentMask',
  'dryPlainMask',
  'canyonMask',
  'dryBasinMask',
  'exposedBedrockMask',
  'impactCraterMask',
  'degradedBasinMask',
  'wornHighlandMask',
  'scarpMask',
  'dustPlainMask',
  'hardRidgeMask',
  'depositSeamMask',
  'fractureCavityMask',
  'rockySystemMask',
  'mineralDepositMask',
  'exposedMetallicPatchMask',
  'oceanMask',
  'continentMask',
  'lowlandMask',
  'uplandMask',
  'mountainMask',
  'plateauMask',
  'inlandBasinMask',
  'valleyMask',
  'forestOrVegetatedMask',
  'dryInteriorMask',
  'snowOrPolarMask',
] as const;

type SemanticMaskName = (typeof SEMANTIC_MASK_NAMES)[number];
type SemanticTerrainMaskSet = Record<SemanticMaskName, number>;

interface PlanetMaps {
  width: number;
  height: number;
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  metalnessMap: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  emissiveMap: THREE.CanvasTexture;
  displacementField: Float32Array;
  terrainModel: TerrainModel;
  debugMaps: Record<SemanticMaskName, THREE.CanvasTexture> & {
    volcanoField: THREE.CanvasTexture;
    mountainChainField: THREE.CanvasTexture;
    craterField: THREE.CanvasTexture;
    trenchField: THREE.CanvasTexture;
    basinField: THREE.CanvasTexture;
    riftField: THREE.CanvasTexture;
    plateauField: THREE.CanvasTexture;
    calderaField: THREE.CanvasTexture;
    iceCapMask: THREE.CanvasTexture;
    compressionRidgeMask: THREE.CanvasTexture;
    depositMask: THREE.CanvasTexture;
    emergentLandMask: THREE.CanvasTexture;
    shelfMask: THREE.CanvasTexture;
    upliftField: THREE.CanvasTexture;
    depressionField: THREE.CanvasTexture;
    finalSignedRelief: THREE.CanvasTexture;
    finalNormal: THREE.CanvasTexture;
  };
}

function buildPlanetMaps(profile: PlanetVisualProfile, seed: number): PlanetMaps {
  const width = 512;
  const height = 256;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = width;
  colorCanvas.height = height;
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = width;
  roughCanvas.height = height;
  const metalCanvas = document.createElement('canvas');
  metalCanvas.width = width;
  metalCanvas.height = height;
  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = width;
  normalCanvas.height = height;
  const emissiveCanvas = document.createElement('canvas');
  emissiveCanvas.width = width;
  emissiveCanvas.height = height;

  const derivedFields = paintPlanetTextures(profile, seed, colorCanvas, roughCanvas, metalCanvas, normalCanvas, emissiveCanvas);

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  map.anisotropy = 4;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.ClampToEdgeWrapping;
  roughnessMap.anisotropy = 2;

  const metalnessMap = new THREE.CanvasTexture(metalCanvas);
  metalnessMap.wrapS = THREE.RepeatWrapping;
  metalnessMap.wrapT = THREE.ClampToEdgeWrapping;
  metalnessMap.anisotropy = 2;

  const normalMap = new THREE.CanvasTexture(normalCanvas);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.ClampToEdgeWrapping;
  normalMap.anisotropy = 4;

  const emissiveMap = new THREE.CanvasTexture(emissiveCanvas);
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  emissiveMap.wrapS = THREE.RepeatWrapping;
  emissiveMap.wrapT = THREE.ClampToEdgeWrapping;
  emissiveMap.anisotropy = 2;

  const volcanoField = createFieldTexture(derivedFields.volcanoField, width, height);
  const mountainChainField = createFieldTexture(derivedFields.mountainChainField, width, height);
  const craterField = createFieldTexture(derivedFields.craterField, width, height);
  const trenchField = createFieldTexture(derivedFields.trenchField, width, height);
  const basinField = createFieldTexture(derivedFields.basinField, width, height);
  const riftField = createFieldTexture(derivedFields.riftField, width, height);
  const plateauField = createFieldTexture(derivedFields.plateauField, width, height);
  const calderaField = createFieldTexture(derivedFields.calderaField, width, height);
  const iceCapMask = createFieldTexture(derivedFields.iceCapMask, width, height);
  const compressionRidgeMask = createFieldTexture(derivedFields.compressionRidgeMask, width, height);
  const depositMask = createFieldTexture(derivedFields.depositMask, width, height);
  const emergentLandMask = createFieldTexture(derivedFields.emergentLandMask, width, height);
  const shelfMask = createFieldTexture(derivedFields.shelfMask, width, height);
  const upliftField = createFieldTexture(derivedFields.upliftField, width, height);
  const depressionField = createFieldTexture(derivedFields.depressionField, width, height);
  const finalSignedRelief = createSignedFieldTexture(derivedFields.displacementField, width, height);
  const semanticDebugMaps = Object.fromEntries(
    SEMANTIC_MASK_NAMES.map((name) => [name, createFieldTexture(derivedFields.semanticMasks[name], width, height)]),
  ) as Record<SemanticMaskName, THREE.CanvasTexture>;

  return {
    width,
    height,
    map,
    roughnessMap,
    metalnessMap,
    normalMap,
    emissiveMap,
    terrainModel: derivedFields.terrainModel,
    displacementField: derivedFields.displacementField,
    debugMaps: {
      ...semanticDebugMaps,
      volcanoField,
      mountainChainField,
      craterField,
      trenchField,
      basinField,
      riftField,
      plateauField,
      calderaField,
      iceCapMask,
      compressionRidgeMask,
      depositMask,
      emergentLandMask,
      shelfMask,
      upliftField,
      depressionField,
      finalSignedRelief,
      finalNormal: normalMap,
    },
  };
}

function paintPlanetTextures(
  profile: PlanetVisualProfile,
  seed: number,
  colorCanvas: HTMLCanvasElement,
  roughCanvas: HTMLCanvasElement,
  metalCanvas: HTMLCanvasElement,
  normalCanvas: HTMLCanvasElement,
  emissiveCanvas: HTMLCanvasElement,
): {
  terrainModel: TerrainModel;
  volcanoField: Float32Array;
  mountainChainField: Float32Array;
  craterField: Float32Array;
  trenchField: Float32Array;
  basinField: Float32Array;
  riftField: Float32Array;
  plateauField: Float32Array;
  calderaField: Float32Array;
  iceCapMask: Float32Array;
  compressionRidgeMask: Float32Array;
  depositMask: Float32Array;
  emergentLandMask: Float32Array;
  shelfMask: Float32Array;
  upliftField: Float32Array;
  depressionField: Float32Array;
  displacementField: Float32Array;
  semanticMasks: Record<SemanticMaskName, Float32Array>;
} {
  const width = colorCanvas.width;
  const height = colorCanvas.height;
  const colorCtx = colorCanvas.getContext('2d');
  const roughCtx = roughCanvas.getContext('2d');
  const metalCtx = metalCanvas.getContext('2d');
  const normalCtx = normalCanvas.getContext('2d');
  const emissiveCtx = emissiveCanvas.getContext('2d');
  if (!colorCtx || !roughCtx || !metalCtx || !normalCtx || !emissiveCtx) {
    const emptyModel = createTerrainModel(profile, seed);
    return {
      terrainModel: emptyModel,
      volcanoField: new Float32Array(width * height),
      mountainChainField: new Float32Array(width * height),
      craterField: new Float32Array(width * height),
      trenchField: new Float32Array(width * height),
      basinField: new Float32Array(width * height),
      riftField: new Float32Array(width * height),
      plateauField: new Float32Array(width * height),
      calderaField: new Float32Array(width * height),
      iceCapMask: new Float32Array(width * height),
      compressionRidgeMask: new Float32Array(width * height),
      depositMask: new Float32Array(width * height),
      emergentLandMask: new Float32Array(width * height),
      shelfMask: new Float32Array(width * height),
      upliftField: new Float32Array(width * height),
      depressionField: new Float32Array(width * height),
      displacementField: new Float32Array(width * height),
      semanticMasks: createSemanticMaskFields(width * height),
    };
  }

  const colorData = colorCtx.createImageData(width, height);
  const roughData = roughCtx.createImageData(width, height);
  const metalData = metalCtx.createImageData(width, height);
  const normalData = normalCtx.createImageData(width, height);
  const emissiveData = emissiveCtx.createImageData(width, height);
  const heightField = new Float32Array(width * height);
  const volcanoField = new Float32Array(width * height);
  const mountainChainField = new Float32Array(width * height);
  const craterField = new Float32Array(width * height);
  const trenchField = new Float32Array(width * height);
  const basinField = new Float32Array(width * height);
  const riftField = new Float32Array(width * height);
  const plateauField = new Float32Array(width * height);
  const calderaField = new Float32Array(width * height);
  const iceCapMask = new Float32Array(width * height);
  const compressionRidgeMask = new Float32Array(width * height);
  const depositMask = new Float32Array(width * height);
  const emergentLandMask = new Float32Array(width * height);
  const shelfMaskField = new Float32Array(width * height);
  const regionMaskField = new Float32Array(width * height);
  const valleyMaskField = new Float32Array(width * height);
  const accentMaskField = new Float32Array(width * height);
  const fractureMaskField = new Float32Array(width * height);
  const frostMaskField = new Float32Array(width * height);
  const microField = new Float32Array(width * height);
  const upliftField = new Float32Array(width * height);
  const depressionField = new Float32Array(width * height);
  const displacementField = new Float32Array(width * height);
  const semanticMasks = createSemanticMaskFields(width * height);

  const signature = archetypeSignature(profile.archetype);
  const terrainModel = createTerrainModel(profile, seed);
  const rng = new SeededRng(seed ^ 0x6a09e667);
  const phaseA = rng.range(0.12, Math.PI * 1.3);
  const phaseB = rng.range(0.2, Math.PI * 1.8);
  const phaseC = rng.range(0.3, Math.PI * 2.2);

  for (let y = 0; y < height; y += 1) {
    const v = y / (height - 1);
    const latitude = (v - 0.5) * Math.PI;

    for (let x = 0; x < width; x += 1) {
      const u = x / width;
      const longitude = (u - 0.5) * Math.PI * 2;
      const nx = Math.cos(latitude) * Math.cos(longitude);
      const ny = Math.sin(latitude);
      const nz = Math.cos(latitude) * Math.sin(longitude);

      const primaryMass = fbm3(nx * profile.continentScale * 0.62, ny * profile.continentScale * 0.62, nz * profile.continentScale * 0.62, seed + 17, 4);
      const plateMass = fbm3(nx * 1.12 + phaseA, ny * 1.12, nz * 1.12 + phaseB, seed + 1229, 3);
      const coastlineNoise = fbm3(nx * 3.15 + phaseA, ny * 3.15, nz * 3.15 + phaseC, seed + 313, 3);
      const regionNoise = fbm3(nx * 2.2 + phaseB, ny * 2.2, nz * 2.2 + phaseA, seed + 7919, 3);
      const accentNoise = fbm3(nx * 4.9 + phaseC, ny * 4.9, nz * 4.9 + phaseB, seed ^ 0x6d2b79f5, 3);
      const fractureNoise = fbm3(nx * 5.2 + phaseA, ny * 5.2, nz * 5.2 + phaseC, seed ^ 0x45d9f3b, 3);
      const micro = fbm3(nx * 12.2, ny * 12.2, nz * 12.2, seed + 997, 2);
      const terrain = evaluateTerrainSample(nx, ny, nz, terrainModel);
      const canyonNoise = fbm3(nx * 6.4 + phaseA * 0.6, ny * 6.4 - phaseB * 0.4, nz * 6.4 + phaseC * 0.2, seed ^ 0xc2b2ae35, 3);

      // Stage 1: world masks from terrain/noise sampling.
      const seaLevel = clamp(profile.oceanLevel + signature.seaLevelShift, 0.2, 0.82);
      const massField = clamp(primaryMass * 0.72 + plateMass * 0.28 + signature.coverageBias, 0, 1);
      const landMask = smoothstep(seaLevel - 0.035, seaLevel + 0.035, massField);
      const waterMask = 1 - landMask;
      const shorelineDistance = Math.abs(massField - seaLevel);
      const coastMask = (1 - smoothstep(signature.coastWidth, signature.coastWidth + 0.11, shorelineDistance + (coastlineNoise - 0.5) * 0.05));
      const shelfMask = smoothstep(seaLevel - signature.shelfWidth, seaLevel - 0.01, massField) * waterMask;
      const worldMasks: WorldSurfaceMasks = {
        seaLevel,
        massField,
        landMask,
        waterMask,
        coastMask,
        shelfMask,
      };

      // Stage 2: archetype-aware terrain signals used for semantic classification.
      const regionMask = smoothstep(0.43, 0.72, regionNoise + plateMass * 0.14) * landMask;
      let accentMask = smoothstep(0.61, 0.89, accentNoise + regionMask * 0.18) * landMask;
      let fractureMask = smoothstep(0.74, 0.96, fractureNoise + plateMass * 0.2) * signature.fractureStrength;
      const polarMask = smoothstep(0.56, 0.95, Math.abs(ny) + (1 - primaryMass) * 0.18);
      let frostMask = polarMask * signature.frostStrength;
      const mountainChainMask = terrain.mountainChainField;
      const plateauMask = terrain.plateauField;
      const valleyMask = smoothstep(0.63, 0.94, canyonNoise + (1 - plateauMask) * 0.2) * landMask;
      let craterMask = terrain.craterField;
      let trenchMask = terrain.trenchField;
      let basinMask = terrain.basinField;
      let riftMask = terrain.riftField;
      const erosionField = clamp((1 - canyonNoise) * 0.54 + (1 - accentNoise) * 0.46, 0, 1);

      switch (profile.archetype) {
        case 'oceanic':
          accentMask *= smoothstep(0.24, 0.74, 1 - Math.abs(ny));
          fractureMask *= 0.2;
          trenchMask = clamp(trenchMask + waterMask * 0.4, 0, 1);
          basinMask = clamp(basinMask + waterMask * 0.36, 0, 1);
          craterMask *= 0.3;
          break;
        case 'frozen':
          frostMask = clamp(frostMask + smoothstep(0.45, 0.8, 1 - massField) * 0.35 + shelfMask * 0.32, 0, 1);
          fractureMask = clamp(fractureMask * 0.6 + smoothstep(0.82, 0.96, fractureNoise) * 0.34, 0, 1);
          riftMask = clamp(riftMask + smoothstep(0.64, 0.9, fractureNoise + polarMask * 0.18) * 0.35, 0, 1);
          break;
        case 'volcanic':
          fractureMask = clamp(fractureMask + smoothstep(0.7, 0.94, Math.abs(Math.sin((nx * 2.1 + nz * 2.3 + phaseC) * 3.2 + plateMass * 2.8))) * 0.45, 0, 1);
          accentMask *= 0.62;
          basinMask = clamp(basinMask + smoothstep(0.66, 0.94, fractureNoise + accentNoise * 0.2) * 0.28, 0, 1);
          craterMask = clamp(craterMask + smoothstep(0.68, 0.9, accentNoise + fractureNoise * 0.3) * 0.22, 0, 1);
          break;
        case 'arid':
          accentMask = clamp(accentMask + smoothstep(0.32, 0.8, 1 - regionNoise) * landMask * 0.3, 0, 1);
          fractureMask *= 0.28;
          basinMask = clamp(basinMask + valleyMask * 0.24, 0, 1);
          trenchMask *= 0.64;
          break;
        case 'mineral':
          accentMask = clamp(accentMask + smoothstep(0.75, 0.96, fractureNoise + primaryMass * 0.2) * 0.48, 0, 1);
          riftMask = clamp(riftMask + smoothstep(0.7, 0.94, fractureNoise + accentNoise * 0.2) * 0.4, 0, 1);
          break;
        case 'terrestrial':
          trenchMask *= 0.55;
          craterMask *= 0.4;
          basinMask = clamp(basinMask + smoothstep(0.6, 0.9, valleyMask + coastlineNoise * 0.2) * 0.2, 0, 1);
          riftMask = clamp(riftMask + smoothstep(0.74, 0.93, fractureNoise + plateMass * 0.16) * 0.22, 0, 1);
          break;
        case 'barren':
        default:
          accentMask *= 0.46;
          fractureMask *= 0.34;
          craterMask = clamp(craterMask + smoothstep(0.68, 0.92, terrain.basinField + fractureNoise * 0.2) * 0.28, 0, 1);
          break;
      }

      // Stage 3: canonical semantic surface classification.
      const semanticSample = deriveSemanticTerrainMasks(profile.archetype, {
        landMask: worldMasks.landMask,
        waterMask: worldMasks.waterMask,
        massField: worldMasks.massField,
        seaLevel: worldMasks.seaLevel,
        coastMask: worldMasks.coastMask,
        shelfMask: worldMasks.shelfMask,
        regionMask,
        valleyMask,
        accentMask,
        fractureMask,
        frostMask,
        polarMask,
        mountainChainMask,
        plateauMask,
        basinMask,
        trenchMask,
        riftMask,
        craterMask,
        terrain,
      });
      const i = (y * width + x) * 4;

      const canonicalLandMask = clamp(
        Math.max(worldMasks.landMask, semanticSample.continentMask, semanticSample.emergentLandMask),
        0,
        1,
      );
      const canonicalWaterMask = clamp(
        Math.max(worldMasks.waterMask, semanticSample.oceanMask, semanticSample.openOceanMask, semanticSample.abyssalDepthMask),
        0,
        1,
      );
      const canonicalShelfMask = clamp(Math.max(worldMasks.shelfMask, semanticSample.shelfMask), 0, 1);

      const baseUplift = clamp(terrain.upliftField + canonicalLandMask * regionMask * 0.16 + canonicalWaterMask * canonicalShelfMask * 0.14 + micro * 0.07, 0, 1);
      const baseDepression = clamp(terrain.depressionField + valleyMask * 0.16 + (1 - canonicalLandMask) * terrain.trenchField * 0.14, 0, 1);

      let uplift = baseUplift;
      let depression = baseDepression;
      switch (profile.archetype) {
        case 'volcanic':
          uplift = clamp(uplift + accentMask * 0.28 + fractureMask * 0.18 + mountainChainMask * 0.1, 0, 1);
          depression = clamp(depression + basinMask * 0.16 + craterMask * 0.14 + riftMask * 0.08, 0, 1);
          break;
        case 'oceanic':
          uplift = clamp(uplift * 0.72 + canonicalShelfMask * 0.2 + mountainChainMask * 0.08, 0, 1);
          depression = clamp(depression + trenchMask * 0.28 + basinMask * 0.22 + (1 - massField) * 0.12, 0, 1);
          break;
        case 'frozen':
          uplift = clamp(uplift + frostMask * 0.26 + mountainChainMask * 0.12, 0, 1);
          depression = clamp(depression + riftMask * 0.22 + basinMask * 0.12 + valleyMask * 0.1, 0, 1);
          break;
        case 'arid':
          uplift = clamp(uplift + plateauMask * 0.22 + accentMask * 0.14, 0, 1);
          depression = clamp(depression + valleyMask * 0.26 + basinMask * 0.2 + trenchMask * 0.08, 0, 1);
          break;
        case 'barren':
          uplift = clamp(uplift + mountainChainMask * 0.16 + fractureMask * 0.08, 0, 1);
          depression = clamp(depression + craterMask * 0.3 + basinMask * 0.2, 0, 1);
          break;
        case 'mineral':
          uplift = clamp(uplift + fractureMask * 0.2 + accentMask * 0.2 + mountainChainMask * 0.1, 0, 1);
          depression = clamp(depression + riftMask * 0.24 + trenchMask * 0.12 + basinMask * 0.14, 0, 1);
          break;
        case 'terrestrial':
          uplift = clamp(uplift + mountainChainMask * 0.26 + plateauMask * 0.22 + canonicalLandMask * 0.08, 0, 1);
          depression = clamp(depression + valleyMask * 0.28 + basinMask * 0.24 + riftMask * 0.16 + craterMask * 0.06, 0, 1);
          break;
        default:
          break;
      }

      const erosionMod = (erosionField - 0.5) * 0.09;
      const signedRelief = clamp((uplift - depression) + terrain.finalSignedRelief * 0.6 + erosionMod + signature.heightBias * 0.45, -1, 1);
      const heightValue = clamp(0.5 + signedRelief * 0.5, 0, 1);
      const fieldIndex = y * width + x;
      volcanoField[fieldIndex] = terrain.volcanoField;
      mountainChainField[fieldIndex] = mountainChainMask;
      craterField[fieldIndex] = craterMask;
      trenchField[fieldIndex] = trenchMask;
      basinField[fieldIndex] = basinMask;
      riftField[fieldIndex] = riftMask;
      plateauField[fieldIndex] = plateauMask;
      calderaField[fieldIndex] = terrain.calderaField;
      iceCapMask[fieldIndex] = frostMask;
      compressionRidgeMask[fieldIndex] = terrain.compressionRidgeField;
      depositMask[fieldIndex] = profile.archetype === 'mineral' ? accentMask : 0;
      emergentLandMask[fieldIndex] = canonicalLandMask;
      shelfMaskField[fieldIndex] = canonicalShelfMask;
      regionMaskField[fieldIndex] = regionMask;
      valleyMaskField[fieldIndex] = valleyMask;
      accentMaskField[fieldIndex] = accentMask;
      fractureMaskField[fieldIndex] = fractureMask;
      frostMaskField[fieldIndex] = frostMask;
      microField[fieldIndex] = micro;
      upliftField[fieldIndex] = uplift;
      depressionField[fieldIndex] = depression;
      displacementField[fieldIndex] = signedRelief;
      heightField[fieldIndex] = heightValue;
      for (const name of SEMANTIC_MASK_NAMES) {
        semanticMasks[name][fieldIndex] = semanticSample[name];
      }
      emissiveData.data[i] = 0;
      emissiveData.data[i + 1] = 0;
      emissiveData.data[i + 2] = 0;
      emissiveData.data[i + 3] = 255;
    }
  }

  applySemanticSpatialCoherence(profile.archetype, semanticMasks, width, height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const fieldIndex = y * width + x;
      const semanticSample = getSemanticMaskSample(semanticMasks, fieldIndex);
      const semanticShading = colorizeTerrainFromSemantics(profile.archetype, {
        semanticMasks: semanticSample,
        worldMasks: {
          seaLevel: clamp(profile.oceanLevel + signature.seaLevelShift, 0.2, 0.82),
          massField: 0,
          landMask: emergentLandMask[fieldIndex],
          waterMask: 1 - emergentLandMask[fieldIndex],
          coastMask: semanticSample.coastMask,
          shelfMask: semanticSample.shelfMask,
        },
        regionMask: regionMaskField[fieldIndex],
        valleyMask: valleyMaskField[fieldIndex],
        accentMask: accentMaskField[fieldIndex],
        fractureMask: fractureMaskField[fieldIndex],
        frostMask: frostMaskField[fieldIndex],
        micro: microField[fieldIndex],
        erosionField: 0,
        terrain: {
          volcanoField: volcanoField[fieldIndex],
          calderaField: calderaField[fieldIndex],
          mountainChainField: mountainChainField[fieldIndex],
          plateauField: plateauField[fieldIndex],
          basinField: basinField[fieldIndex],
          trenchField: trenchField[fieldIndex],
          riftField: riftField[fieldIndex],
          craterField: craterField[fieldIndex],
          iceShelfField: 0,
          compressionRidgeField: compressionRidgeMask[fieldIndex],
          upliftField: upliftField[fieldIndex],
          depressionField: depressionField[fieldIndex],
          finalSignedRelief: displacementField[fieldIndex],
        },
      });

      const i = (y * width + x) * 4;
      const finalColor = semanticShading.albedo;
      colorData.data[i] = finalColor[0];
      colorData.data[i + 1] = finalColor[1];
      colorData.data[i + 2] = finalColor[2];
      colorData.data[i + 3] = 255;

      const roughValue = Math.round(semanticShading.roughness * 255);
      roughData.data[i] = roughValue;
      roughData.data[i + 1] = roughValue;
      roughData.data[i + 2] = roughValue;
      roughData.data[i + 3] = 255;

      const metalValue = Math.round(semanticShading.metalness * 255);
      metalData.data[i] = metalValue;
      metalData.data[i + 1] = metalValue;
      metalData.data[i + 2] = metalValue;
      metalData.data[i + 3] = 255;

      const eRgb = semanticShading.emissive;
      emissiveData.data[i] = eRgb[0];
      emissiveData.data[i + 1] = eRgb[1];
      emissiveData.data[i + 2] = eRgb[2];
      emissiveData.data[i + 3] = 255;
    }
  }

  for (let y = 0; y < height; y += 1) {
    const yPrev = y > 0 ? y - 1 : y;
    const yNext = y < height - 1 ? y + 1 : y;
    for (let x = 0; x < width; x += 1) {
      const xPrev = x > 0 ? x - 1 : width - 1;
      const xNext = x < width - 1 ? x + 1 : 0;
      const hL = heightField[y * width + xPrev];
      const hR = heightField[y * width + xNext];
      const hD = heightField[yPrev * width + x];
      const hU = heightField[yNext * width + x];
      const sx = (hR - hL) * 1.08;
      const sy = (hU - hD) * 1.08;
      const nz = 1;
      const nxN = -sx;
      const nyN = -sy;
      const invLen = 1 / Math.hypot(nxN, nyN, nz);
      const nxOut = nxN * invLen;
      const nyOut = nyN * invLen;
      const nzOut = nz * invLen;
      const i = (y * width + x) * 4;
      normalData.data[i] = Math.round((nxOut * 0.5 + 0.5) * 255);
      normalData.data[i + 1] = Math.round((nyOut * 0.5 + 0.5) * 255);
      normalData.data[i + 2] = Math.round((nzOut * 0.5 + 0.5) * 255);
      normalData.data[i + 3] = 255;
    }
  }

  colorCtx.putImageData(colorData, 0, 0);
  roughCtx.putImageData(roughData, 0, 0);
  metalCtx.putImageData(metalData, 0, 0);
  normalCtx.putImageData(normalData, 0, 0);
  emissiveCtx.putImageData(emissiveData, 0, 0);

  const displacementStats = getFieldMinMax(displacementField);
  for (let i = 0; i < displacementField.length; i += 1) {
    const normalizedDisplacement = normalize(displacementField[i], displacementStats.min, displacementStats.max);
    const centered = normalizedDisplacement * 2 - 1;
    displacementField[i] = clamp(centered * 0.42, -0.42, 0.42);
  }

  return {
    terrainModel,
    volcanoField,
    mountainChainField,
    craterField,
    trenchField,
    basinField,
    riftField,
    plateauField,
    calderaField,
    iceCapMask,
    compressionRidgeMask,
    depositMask,
    emergentLandMask,
    shelfMask: shelfMaskField,
    upliftField,
    depressionField,
    displacementField,
    semanticMasks,
  };
}

interface ArchetypeSignature {
  coverageBias: number;
  seaLevelShift: number;
  coastWidth: number;
  shelfWidth: number;
  fractureStrength: number;
  frostStrength: number;
  heightBias: number;
}

interface RadialFeature {
  x: number;
  y: number;
  z: number;
  radius: number;
  amplitude: number;
}

interface LocalizedChainFeature {
  cx: number;
  cy: number;
  cz: number;
  tx: number;
  ty: number;
  tz: number;
  span: number;
  width: number;
  amplitude: number;
}

interface SegmentedTrenchFeature {
  cx: number;
  cy: number;
  cz: number;
  tx: number;
  ty: number;
  tz: number;
  segmentLength: number;
  segmentCount: number;
  width: number;
  amplitude: number;
  jaggedness: number;
}

interface RiftPathFeature {
  nodes: Array<{ x: number; y: number; z: number }>;
  width: number;
  amplitude: number;
}

interface MarginFeature {
  cx: number;
  cy: number;
  cz: number;
  nx: number;
  ny: number;
  nz: number;
  span: number;
  width: number;
  amplitude: number;
}

interface CorridorFeature {
  cx: number;
  cy: number;
  cz: number;
  tx: number;
  ty: number;
  tz: number;
  length: number;
  width: number;
  amplitude: number;
}

interface OceanicTerrainModel {
  archetype: 'oceanic';
  abyssalBasins: RadialFeature[];
  trenches: SegmentedTrenchFeature[];
  shelves: MarginFeature[];
  margins: MarginFeature[];
  islandArcs: LocalizedChainFeature[];
  emergentMasses: RadialFeature[];
}

interface FrozenTerrainModel {
  archetype: 'frozen';
  iceCaps: RadialFeature[];
  iceSheets: RadialFeature[];
  iceShelves: MarginFeature[];
  compressionRidges: LocalizedChainFeature[];
  crevasses: RiftPathFeature[];
  frozenBasins: RadialFeature[];
}

interface VolcanicTerrainModel {
  archetype: 'volcanic';
  volcanoClusters: RadialFeature[];
  calderas: RadialFeature[];
  lavaPlateaus: RadialFeature[];
  fissures: RiftPathFeature[];
  collapseBasins: RadialFeature[];
}

interface AridTerrainModel {
  archetype: 'arid';
  plateaus: RadialFeature[];
  mesas: RadialFeature[];
  escarpments: LocalizedChainFeature[];
  dryBasins: RadialFeature[];
  canyons: CorridorFeature[];
}

interface BarrenTerrainModel {
  archetype: 'barren';
  wornHighlands: LocalizedChainFeature[];
  impactCraters: RadialFeature[];
  degradedBasins: RadialFeature[];
  scarps: CorridorFeature[];
}

interface MineralTerrainModel {
  archetype: 'mineral';
  hardRidges: LocalizedChainFeature[];
  depositSeams: RiftPathFeature[];
  fractureCavities: RadialFeature[];
  rockySystems: RadialFeature[];
}

interface TerrestrialTerrainModel {
  archetype: 'terrestrial';
  continents: RadialFeature[];
  mountainChains: LocalizedChainFeature[];
  plateaus: RadialFeature[];
  lowlands: RadialFeature[];
  inlandBasins: RadialFeature[];
  valleys: CorridorFeature[];
  limitedRifts: RiftPathFeature[];
  limitedCraters: RadialFeature[];
}

type TerrainModel =
  | OceanicTerrainModel
  | FrozenTerrainModel
  | VolcanicTerrainModel
  | AridTerrainModel
  | BarrenTerrainModel
  | MineralTerrainModel
  | TerrestrialTerrainModel;

interface TerrainSample {
  volcanoField: number;
  calderaField: number;
  mountainChainField: number;
  plateauField: number;
  basinField: number;
  trenchField: number;
  riftField: number;
  craterField: number;
  iceShelfField: number;
  compressionRidgeField: number;
  upliftField: number;
  depressionField: number;
  finalSignedRelief: number;
}

interface SemanticMaskDeriveInput {
  landMask: number;
  waterMask: number;
  massField: number;
  seaLevel: number;
  coastMask: number;
  shelfMask: number;
  regionMask: number;
  valleyMask: number;
  accentMask: number;
  fractureMask: number;
  frostMask: number;
  polarMask: number;
  mountainChainMask: number;
  plateauMask: number;
  basinMask: number;
  trenchMask: number;
  riftMask: number;
  craterMask: number;
  terrain: TerrainSample;
}

interface WorldSurfaceMasks {
  seaLevel: number;
  massField: number;
  landMask: number;
  waterMask: number;
  coastMask: number;
  shelfMask: number;
}

interface SemanticColorizeInput {
  semanticMasks: SemanticTerrainMaskSet;
  worldMasks: WorldSurfaceMasks;
  regionMask: number;
  valleyMask: number;
  accentMask: number;
  fractureMask: number;
  frostMask: number;
  micro: number;
  erosionField: number;
  terrain: TerrainSample;
}

interface SemanticColorMaterialSample {
  albedo: [number, number, number];
  roughness: number;
  metalness: number;
  emissive: [number, number, number];
}

function createSemanticMaskFields(length: number): Record<SemanticMaskName, Float32Array> {
  return Object.fromEntries(SEMANTIC_MASK_NAMES.map((name) => [name, new Float32Array(length)])) as Record<SemanticMaskName, Float32Array>;
}

function createEmptySemanticMaskSet(): SemanticTerrainMaskSet {
  return Object.fromEntries(SEMANTIC_MASK_NAMES.map((name) => [name, 0])) as SemanticTerrainMaskSet;
}

function getSemanticMaskSample(semanticMasks: Record<SemanticMaskName, Float32Array>, index: number): SemanticTerrainMaskSet {
  const sample = createEmptySemanticMaskSet();
  for (const name of SEMANTIC_MASK_NAMES) {
    sample[name] = semanticMasks[name][index];
  }
  return sample;
}

function applySemanticSpatialCoherence(
  archetype: PlanetVisualProfile['archetype'],
  semanticMasks: Record<SemanticMaskName, Float32Array>,
  width: number,
  height: number,
) {
  const reinforced = createSemanticMaskFields(width * height);
  for (const name of SEMANTIC_MASK_NAMES) {
    const src = semanticMasks[name];
    const dst = reinforced[name];
    for (let y = 0; y < height; y += 1) {
      const yPrev = y > 0 ? y - 1 : y;
      const yNext = y < height - 1 ? y + 1 : y;
      for (let x = 0; x < width; x += 1) {
        const xPrev = x > 0 ? x - 1 : width - 1;
        const xNext = x < width - 1 ? x + 1 : 0;
        const index = y * width + x;
        const n0 = yPrev * width + xPrev;
        const n1 = yPrev * width + x;
        const n2 = yPrev * width + xNext;
        const n3 = y * width + xPrev;
        const n4 = y * width + xNext;
        const n5 = yNext * width + xPrev;
        const n6 = yNext * width + x;
        const n7 = yNext * width + xNext;
        const neighborhood = (src[n0] + src[n1] + src[n2] + src[n3] + src[n4] + src[n5] + src[n6] + src[n7]) / 8;
        dst[index] = clamp(src[index] * 0.62 + neighborhood * 0.38, 0, 1);
      }
    }
  }

  const primaryFamilies: Partial<Record<PlanetVisualProfile['archetype'], SemanticMaskName[]>> = {
    oceanic: ['abyssalDepthMask', 'openOceanMask', 'shelfMask', 'coastMask', 'emergentLandMask'],
    terrestrial: ['oceanMask', 'shelfMask', 'coastMask', 'lowlandMask', 'uplandMask', 'mountainMask', 'plateauMask'],
    frozen: ['iceCapMask', 'iceSheetMask', 'iceShelfMask', 'exposedRockMask'],
    volcanic: ['calderaMask', 'volcanicConeMask', 'lavaPlainMask', 'collapseBasinMask', 'ashFieldMask', 'cooledRockMask'],
    arid: ['plateauTopMask', 'mesaMask', 'escarpmentMask', 'dryPlainMask', 'dryBasinMask'],
    mineral: ['hardRidgeMask', 'fractureCavityMask', 'rockySystemMask', 'mineralDepositMask'],
    barren: ['dustPlainMask', 'wornHighlandMask', 'degradedBasinMask', 'scarpMask'],
  };

  const activeFamily = primaryFamilies[archetype] ?? [];
  for (let index = 0; index < width * height; index += 1) {
    for (const name of activeFamily) {
      semanticMasks[name][index] = reinforced[name][index];
    }
  }

  for (let y = 0; y < height; y += 1) {
    const yPrev = y > 0 ? y - 1 : y;
    const yNext = y < height - 1 ? y + 1 : y;
    for (let x = 0; x < width; x += 1) {
      const xPrev = x > 0 ? x - 1 : width - 1;
      const xNext = x < width - 1 ? x + 1 : 0;
      const index = y * width + x;

      const coastAdjacency = Math.max(
        semanticMasks.coastMask[yPrev * width + x],
        semanticMasks.coastMask[yNext * width + x],
        semanticMasks.coastMask[y * width + xPrev],
        semanticMasks.coastMask[y * width + xNext],
      );
      const shelfAdjacency = Math.max(
        semanticMasks.shelfMask[yPrev * width + x],
        semanticMasks.shelfMask[yNext * width + x],
        semanticMasks.shelfMask[y * width + xPrev],
        semanticMasks.shelfMask[y * width + xNext],
      );
      const mountainAdjacency = Math.max(
        semanticMasks.mountainMask[yPrev * width + x],
        semanticMasks.mountainMask[yNext * width + x],
        semanticMasks.mountainMask[y * width + xPrev],
        semanticMasks.mountainMask[y * width + xNext],
      );

      if (archetype === 'oceanic') {
        semanticMasks.abyssalDepthMask[index] = clamp(semanticMasks.abyssalDepthMask[index] * (1 - semanticMasks.shelfMask[index] * 0.75), 0, 1);
        semanticMasks.openOceanMask[index] = clamp(semanticMasks.openOceanMask[index] * (1 - semanticMasks.coastMask[index] * 0.8), 0, 1);
        semanticMasks.shelfMask[index] = clamp(semanticMasks.shelfMask[index] * (0.56 + coastAdjacency * 0.44), 0, 1);
        semanticMasks.emergentLandMask[index] = clamp(
          semanticMasks.emergentLandMask[index] * (0.42 + (coastAdjacency + shelfAdjacency) * 0.58),
          0,
          1,
        );
        semanticMasks.rockyIslandMask[index] = clamp(
          semanticMasks.rockyIslandMask[index] * (0.3 + semanticMasks.emergentLandMask[index] * 0.7),
          0,
          1,
        );
      } else if (archetype === 'terrestrial') {
        semanticMasks.shelfMask[index] = clamp(semanticMasks.shelfMask[index] * (0.52 + coastAdjacency * 0.48), 0, 1);
        semanticMasks.coastMask[index] = clamp(semanticMasks.coastMask[index] * (0.44 + (semanticMasks.shelfMask[index] + semanticMasks.lowlandMask[index]) * 0.56), 0, 1);
        semanticMasks.lowlandMask[index] = clamp(semanticMasks.lowlandMask[index] * (1 - semanticMasks.oceanMask[index] * 0.8), 0, 1);
        semanticMasks.uplandMask[index] = clamp(semanticMasks.uplandMask[index] * (0.48 + semanticMasks.lowlandMask[index] * 0.28 + mountainAdjacency * 0.24), 0, 1);
        semanticMasks.mountainMask[index] = clamp(semanticMasks.mountainMask[index] * (0.56 + semanticMasks.uplandMask[index] * 0.44), 0, 1);
        semanticMasks.plateauMask[index] = clamp(semanticMasks.plateauMask[index] * (0.48 + semanticMasks.uplandMask[index] * 0.52), 0, 1);
        semanticMasks.valleyMask[index] = clamp(semanticMasks.valleyMask[index] * (0.2 + semanticMasks.lowlandMask[index] * 0.4 + semanticMasks.inlandBasinMask[index] * 0.4), 0, 1);
        semanticMasks.inlandBasinMask[index] = clamp(semanticMasks.inlandBasinMask[index] * (1 - semanticMasks.coastMask[index] * 0.72), 0, 1);
      } else if (archetype === 'frozen') {
        semanticMasks.iceShelfMask[index] = clamp(semanticMasks.iceShelfMask[index] * (0.52 + coastAdjacency * 0.48), 0, 1);
        semanticMasks.iceSheetMask[index] = clamp(semanticMasks.iceSheetMask[index] * (0.56 + semanticMasks.iceCapMask[index] * 0.44), 0, 1);
        semanticMasks.exposedRockMask[index] = clamp(
          semanticMasks.exposedRockMask[index] * (0.35 + (semanticMasks.frozenHighlandMask[index] + (1 - semanticMasks.iceCapMask[index])) * 0.65),
          0,
          1,
        );
        semanticMasks.crevasseMask[index] = clamp(semanticMasks.crevasseMask[index] * (0.48 + semanticMasks.iceSheetMask[index] * 0.52), 0, 1);
      } else if (archetype === 'volcanic') {
        const volcanicCore = Math.max(semanticMasks.volcanicConeMask[index], semanticMasks.calderaMask[index]);
        semanticMasks.lavaPlainMask[index] = clamp(semanticMasks.lavaPlainMask[index] * (0.38 + volcanicCore * 0.62), 0, 1);
        semanticMasks.fissureMask[index] = clamp(semanticMasks.fissureMask[index] * (0.34 + volcanicCore * 0.66), 0, 1);
        semanticMasks.ashFieldMask[index] = clamp(semanticMasks.ashFieldMask[index] * (0.36 + semanticMasks.lavaPlainMask[index] * 0.64), 0, 1);
        semanticMasks.cooledRockMask[index] = clamp(semanticMasks.cooledRockMask[index] * (0.42 + semanticMasks.ashFieldMask[index] * 0.58), 0, 1);
      } else if (archetype === 'arid') {
        const highArid = Math.max(semanticMasks.plateauTopMask[index], semanticMasks.escarpmentMask[index]);
        semanticMasks.mesaMask[index] = clamp(semanticMasks.mesaMask[index] * (0.34 + highArid * 0.66), 0, 1);
        semanticMasks.canyonMask[index] = clamp(semanticMasks.canyonMask[index] * (0.26 + (semanticMasks.escarpmentMask[index] + semanticMasks.dryBasinMask[index]) * 0.74), 0, 1);
        semanticMasks.dryPlainMask[index] = clamp(semanticMasks.dryPlainMask[index] * (1 - semanticMasks.plateauTopMask[index] * 0.62), 0, 1);
      } else if (archetype === 'mineral') {
        const ridgeFrame = Math.max(semanticMasks.hardRidgeMask[index], semanticMasks.rockySystemMask[index]);
        semanticMasks.depositSeamMask[index] = clamp(semanticMasks.depositSeamMask[index] * (0.26 + ridgeFrame * 0.74), 0, 1);
        semanticMasks.mineralDepositMask[index] = clamp(semanticMasks.mineralDepositMask[index] * (0.32 + semanticMasks.depositSeamMask[index] * 0.68), 0, 1);
        semanticMasks.exposedMetallicPatchMask[index] = clamp(
          semanticMasks.exposedMetallicPatchMask[index] * (0.24 + semanticMasks.mineralDepositMask[index] * 0.76),
          0,
          1,
        );
        semanticMasks.fractureCavityMask[index] = clamp(semanticMasks.fractureCavityMask[index] * (0.32 + semanticMasks.depositSeamMask[index] * 0.68), 0, 1);
      } else {
        const barrenFrame = Math.max(semanticMasks.degradedBasinMask[index], semanticMasks.scarpMask[index]);
        semanticMasks.impactCraterMask[index] = clamp(semanticMasks.impactCraterMask[index] * (0.42 + barrenFrame * 0.58), 0, 1);
        semanticMasks.dustPlainMask[index] = clamp(semanticMasks.dustPlainMask[index] * (1 - semanticMasks.wornHighlandMask[index] * 0.58), 0, 1);
      }
    }
  }

  for (let index = 0; index < width * height; index += 1) {
    normalizeExclusiveFamily(semanticMasks, index, ['abyssalDepthMask', 'openOceanMask', 'shelfMask', 'coastMask', 'emergentLandMask']);
    normalizeExclusiveFamily(semanticMasks, index, ['oceanMask', 'shelfMask', 'coastMask', 'continentMask']);
    normalizeExclusiveFamily(semanticMasks, index, ['lowlandMask', 'uplandMask', 'mountainMask', 'plateauMask']);
    normalizeExclusiveFamily(semanticMasks, index, ['iceCapMask', 'exposedRockMask']);
  }
}

function normalizeExclusiveFamily(
  semanticMasks: Record<SemanticMaskName, Float32Array>,
  index: number,
  family: SemanticMaskName[],
) {
  let maxName = family[0];
  let maxValue = semanticMasks[maxName][index];
  for (let i = 1; i < family.length; i += 1) {
    const name = family[i];
    const value = semanticMasks[name][index];
    if (value > maxValue) {
      maxValue = value;
      maxName = name;
    }
  }
  if (maxValue <= 0.0001) {
    return;
  }
  for (const name of family) {
    semanticMasks[name][index] = name === maxName ? clamp(maxValue, 0, 1) : clamp(semanticMasks[name][index] * 0.18, 0, 1);
  }
}

function deriveSemanticTerrainMasks(
  archetype: PlanetVisualProfile['archetype'],
  input: SemanticMaskDeriveInput,
): SemanticTerrainMaskSet {
  const masks = createEmptySemanticMaskSet();

  switch (archetype) {
    case 'oceanic': {
      masks.abyssalDepthMask = clamp(input.waterMask * smoothstep(0.09, 0.32, input.seaLevel - input.massField), 0, 1);
      masks.trenchMask = clamp(input.waterMask * (input.trenchMask * 0.86 + input.terrain.trenchField * 0.14), 0, 1);
      masks.basinDepthMask = clamp(input.waterMask * input.basinMask * 0.92, 0, 1);
      masks.openOceanMask = clamp(input.waterMask * (1 - input.shelfMask) * (1 - input.coastMask), 0, 1);
      masks.shelfMask = clamp(input.shelfMask * input.waterMask, 0, 1);
      masks.shallowWaterMask = clamp(input.waterMask * (input.shelfMask * 0.72 + input.coastMask * 0.28), 0, 1);
      masks.coastMask = clamp(input.coastMask, 0, 1);
      masks.emergentLandMask = clamp(input.landMask, 0, 1);
      masks.rockyIslandMask = clamp(input.landMask * input.terrain.plateauField * (1 - input.regionMask), 0, 1);
      break;
    }
    case 'frozen': {
      masks.deepFrozenBasinMask = clamp(input.basinMask * input.frostMask * (1 - input.landMask * 0.4), 0, 1);
      masks.iceCapMask = clamp(input.frostMask * smoothstep(0.68, 0.96, Math.abs(input.polarMask * 2 - 1)), 0, 1);
      masks.iceSheetMask = clamp(input.frostMask * input.terrain.plateauField, 0, 1);
      masks.iceShelfMask = clamp(input.frostMask * input.terrain.iceShelfField, 0, 1);
      masks.compressionRidgeMask = clamp(input.terrain.compressionRidgeField, 0, 1);
      masks.crevasseMask = clamp(input.riftMask * input.frostMask, 0, 1);
      masks.frozenHighlandMask = clamp(input.mountainChainMask * input.frostMask, 0, 1);
      masks.exposedRockMask = clamp(input.landMask * (1 - input.frostMask) * (input.mountainChainMask * 0.62 + input.fractureMask * 0.38), 0, 1);
      break;
    }
    case 'volcanic': {
      masks.volcanicConeMask = clamp(input.terrain.volcanoField, 0, 1);
      masks.calderaMask = clamp(input.terrain.calderaField, 0, 1);
      masks.lavaPlainMask = clamp(input.plateauMask * (0.68 + input.fractureMask * 0.22), 0, 1);
      masks.fissureMask = clamp(input.riftMask * (0.72 + input.fractureMask * 0.2), 0, 1);
      masks.collapseBasinMask = clamp(input.basinMask * (0.7 + input.riftMask * 0.2), 0, 1);
      masks.ashFieldMask = clamp(input.accentMask * (1 - input.coastMask) * (1 - input.shelfMask), 0, 1);
      masks.cooledRockMask = clamp((1 - input.waterMask) * (1 - input.terrain.volcanoField * 0.5) * (input.regionMask * 0.48 + input.plateauMask * 0.32), 0, 1);
      break;
    }
    case 'arid': {
      masks.plateauTopMask = clamp(input.plateauMask, 0, 1);
      masks.mesaMask = clamp(input.plateauMask * (1 - input.regionMask * 0.55), 0, 1);
      masks.escarpmentMask = clamp(input.mountainChainMask, 0, 1);
      masks.dryPlainMask = clamp(input.landMask * (1 - input.plateauMask) * (1 - input.valleyMask), 0, 1);
      masks.canyonMask = clamp(input.valleyMask * (input.riftMask * 0.6 + 0.4), 0, 1);
      masks.dryBasinMask = clamp(input.basinMask, 0, 1);
      masks.exposedBedrockMask = clamp(input.landMask * input.fractureMask * (1 - input.coastMask), 0, 1);
      break;
    }
    case 'barren': {
      masks.impactCraterMask = clamp(input.craterMask, 0, 1);
      masks.degradedBasinMask = clamp(input.basinMask, 0, 1);
      masks.wornHighlandMask = clamp(input.mountainChainMask, 0, 1);
      masks.scarpMask = clamp(input.riftMask, 0, 1);
      masks.dustPlainMask = clamp(input.landMask * (1 - input.mountainChainMask) * (1 - input.craterMask) * (1 - input.plateauMask * 0.5), 0, 1);
      masks.exposedRockMask = clamp(input.landMask * (input.mountainChainMask * 0.4 + input.fractureMask * 0.6), 0, 1);
      break;
    }
    case 'mineral': {
      masks.hardRidgeMask = clamp(input.mountainChainMask, 0, 1);
      masks.depositSeamMask = clamp(input.terrain.compressionRidgeField, 0, 1);
      masks.fractureCavityMask = clamp(input.basinMask * (0.72 + input.riftMask * 0.2), 0, 1);
      masks.rockySystemMask = clamp(input.plateauMask, 0, 1);
      masks.mineralDepositMask = clamp(input.accentMask * (0.7 + input.fractureMask * 0.2), 0, 1);
      masks.exposedMetallicPatchMask = clamp(masks.mineralDepositMask * smoothstep(0.78, 0.96, input.accentMask + input.fractureMask * 0.2), 0, 1);
      break;
    }
    case 'terrestrial': {
      masks.oceanMask = clamp(input.waterMask * (1 - input.shelfMask), 0, 1);
      masks.shelfMask = clamp(input.shelfMask * input.waterMask, 0, 1);
      masks.coastMask = clamp(input.coastMask, 0, 1);
      masks.continentMask = clamp(input.landMask, 0, 1);
      masks.lowlandMask = clamp(input.landMask * (1 - input.mountainChainMask) * (1 - input.plateauMask * 0.6), 0, 1);
      masks.uplandMask = clamp(input.landMask * input.regionMask * (1 - input.mountainChainMask * 0.6), 0, 1);
      masks.mountainMask = clamp(input.mountainChainMask, 0, 1);
      masks.plateauMask = clamp(input.plateauMask, 0, 1);
      masks.inlandBasinMask = clamp(input.basinMask * input.landMask, 0, 1);
      masks.valleyMask = clamp(input.valleyMask, 0, 1);
      masks.dryInteriorMask = clamp(input.landMask * (1 - input.coastMask) * (1 - input.shelfMask) * (1 - input.frostMask) * (0.42 + input.accentMask * 0.42), 0, 1);
      masks.forestOrVegetatedMask = clamp(input.landMask * input.regionMask * (1 - masks.dryInteriorMask * 0.8), 0, 1);
      masks.snowOrPolarMask = clamp(input.frostMask * (0.8 + input.polarMask * 0.2), 0, 1);
      break;
    }
    default:
      break;
  }

  return masks;
}

function colorizeTerrainFromSemantics(
  archetype: PlanetVisualProfile['archetype'],
  input: SemanticColorizeInput,
): SemanticColorMaterialSample {
  switch (archetype) {
    case 'oceanic':
      return colorizeOceanicTerrain(input);
    case 'frozen':
      return colorizeFrozenTerrain(input);
    case 'volcanic':
      return colorizeVolcanicTerrain(input);
    case 'arid':
      return colorizeAridTerrain(input);
    case 'mineral':
      return colorizeMineralTerrain(input);
    case 'terrestrial':
      return colorizeTerrestrialTerrain(input);
    case 'barren':
    default:
      return colorizeBarrenTerrain(input);
  }
}

function colorizeOceanicTerrain(input: SemanticColorizeInput): SemanticColorMaterialSample {
  const m = input.semanticMasks;
  return resolveSemanticSurfaceClass({
    primaryClasses: [
      { key: 'trench', weight: m.trenchMask, albedo: [2, 8, 16], roughness: 0.78, metalness: 0, emissive: [0, 0, 0] },
      { key: 'abyssal', weight: m.abyssalDepthMask, albedo: [5, 16, 30], roughness: 0.76, metalness: 0, emissive: [0, 0, 0] },
      { key: 'openOcean', weight: m.openOceanMask + m.basinDepthMask * 0.4, albedo: [24, 66, 112], roughness: 0.74, metalness: 0, emissive: [0, 0, 0] },
      { key: 'shelf', weight: m.shelfMask + m.shallowWaterMask * 0.8, albedo: [66, 142, 164], roughness: 0.69, metalness: 0, emissive: [0, 0, 0] },
      { key: 'coast', weight: m.coastMask, albedo: [207, 196, 168], roughness: 0.9, metalness: 0, emissive: [0, 0, 0] },
      { key: 'emergent', weight: m.emergentLandMask, albedo: [92, 114, 76], roughness: 0.95, metalness: 0.01, emissive: [0, 0, 0] },
    ],
    overlays: [
      { key: 'rockyIslandOverlay', weight: m.rockyIslandMask, albedo: [82, 92, 102], roughness: 0.96, metalness: 0.02, emissive: [0, 0, 0], influence: 0.45 },
    ],
    fallback: { albedo: [12, 30, 56], roughness: 0.78, metalness: 0, emissive: [0, 0, 0] },
    microVariance: input.micro * 0.03,
  });
}

function colorizeFrozenTerrain(input: SemanticColorizeInput): SemanticColorMaterialSample {
  const m = input.semanticMasks;
  return resolveSemanticSurfaceClass({
    primaryClasses: [
      { key: 'deepFrozenBasin', weight: m.deepFrozenBasinMask, albedo: [72, 92, 112], roughness: 0.88, metalness: 0, emissive: [0, 0, 0] },
      { key: 'iceSheet', weight: m.iceSheetMask, albedo: [198, 214, 224], roughness: 0.86, metalness: 0, emissive: [0, 0, 0] },
      { key: 'iceCap', weight: m.iceCapMask, albedo: [232, 242, 248], roughness: 0.82, metalness: 0, emissive: [0, 0, 0] },
      { key: 'iceShelf', weight: m.iceShelfMask, albedo: [186, 222, 228], roughness: 0.8, metalness: 0, emissive: [0, 0, 0] },
      { key: 'frozenHighland', weight: m.frozenHighlandMask, albedo: [212, 226, 236], roughness: 0.9, metalness: 0, emissive: [0, 0, 0] },
      { key: 'exposedRock', weight: m.exposedRockMask, albedo: [114, 118, 122], roughness: 0.97, metalness: 0.01, emissive: [0, 0, 0] },
    ],
    overlays: [
      { key: 'compressionRidgeOverlay', weight: m.compressionRidgeMask, albedo: [242, 248, 252], roughness: 0.92, metalness: 0, emissive: [0, 0, 0], influence: 0.34 },
      { key: 'crevasseOverlay', weight: m.crevasseMask, albedo: [70, 86, 104], roughness: 0.98, metalness: 0, emissive: [0, 0, 0], influence: 0.3 },
    ],
    fallback: { albedo: [114, 130, 142], roughness: 0.9, metalness: 0, emissive: [0, 0, 0] },
    microVariance: input.micro * 0.02,
  });
}

function colorizeVolcanicTerrain(input: SemanticColorizeInput): SemanticColorMaterialSample {
  const m = input.semanticMasks;
  const fissureGlow = clamp(m.fissureMask * (0.18 + input.fractureMask * 0.14), 0, 0.24);
  const emissiveFissure: [number, number, number] = [
    Math.round(255 * fissureGlow),
    Math.round(88 * fissureGlow),
    Math.round(26 * fissureGlow),
  ];
  return resolveSemanticSurfaceClass({
    primaryClasses: [
      { key: 'caldera', weight: m.calderaMask, albedo: [22, 20, 18], roughness: 0.92, metalness: 0.01, emissive: [0, 0, 0] },
      { key: 'volcanicCone', weight: m.volcanicConeMask, albedo: [34, 34, 36], roughness: 0.94, metalness: 0.01, emissive: [0, 0, 0] },
      { key: 'lavaPlain', weight: m.lavaPlainMask, albedo: [54, 42, 40], roughness: 0.84, metalness: 0.01, emissive: [0, 0, 0] },
      { key: 'collapseBasin', weight: m.collapseBasinMask, albedo: [30, 28, 30], roughness: 0.95, metalness: 0.01, emissive: [0, 0, 0] },
      { key: 'cooledRock', weight: m.cooledRockMask, albedo: [72, 70, 68], roughness: 0.9, metalness: 0.01, emissive: [0, 0, 0] },
      { key: 'ashField', weight: m.ashFieldMask, albedo: [98, 92, 88], roughness: 0.98, metalness: 0, emissive: [0, 0, 0] },
    ],
    overlays: [
      { key: 'fissureThermalOverlay', weight: m.fissureMask, albedo: [74, 56, 44], roughness: 0.78, metalness: 0.01, emissive: emissiveFissure, influence: 0.5 },
    ],
    fallback: { albedo: [58, 54, 50], roughness: 0.9, metalness: 0.01, emissive: [0, 0, 0] },
    microVariance: input.micro * 0.03,
  });
}

function colorizeAridTerrain(input: SemanticColorizeInput): SemanticColorMaterialSample {
  const m = input.semanticMasks;
  return resolveSemanticSurfaceClass({
    primaryClasses: [
      { key: 'plateauTop', weight: m.plateauTopMask, albedo: [202, 176, 122], roughness: 0.87, metalness: 0, emissive: [0, 0, 0] },
      { key: 'mesa', weight: m.mesaMask, albedo: [184, 128, 78], roughness: 0.9, metalness: 0, emissive: [0, 0, 0] },
      { key: 'escarpment', weight: m.escarpmentMask, albedo: [142, 110, 86], roughness: 0.95, metalness: 0, emissive: [0, 0, 0] },
      { key: 'dryPlain', weight: m.dryPlainMask, albedo: [150, 126, 96], roughness: 0.92, metalness: 0, emissive: [0, 0, 0] },
      { key: 'dryBasin', weight: m.dryBasinMask, albedo: [132, 112, 92], roughness: 0.94, metalness: 0, emissive: [0, 0, 0] },
    ],
    overlays: [
      { key: 'canyonOverlay', weight: m.canyonMask, albedo: [104, 72, 48], roughness: 0.97, metalness: 0, emissive: [0, 0, 0], influence: 0.38 },
      { key: 'bedrockOverlay', weight: m.exposedBedrockMask, albedo: [118, 102, 90], roughness: 0.98, metalness: 0.01, emissive: [0, 0, 0], influence: 0.34 },
    ],
    fallback: { albedo: [168, 142, 104], roughness: 0.92, metalness: 0, emissive: [0, 0, 0] },
    microVariance: input.micro * 0.03,
  });
}

function colorizeBarrenTerrain(input: SemanticColorizeInput): SemanticColorMaterialSample {
  const m = input.semanticMasks;
  return resolveSemanticSurfaceClass({
    primaryClasses: [
      { key: 'dustPlain', weight: m.dustPlainMask, albedo: [148, 136, 120], roughness: 0.94, metalness: 0, emissive: [0, 0, 0] },
      { key: 'wornHighland', weight: m.wornHighlandMask, albedo: [130, 126, 120], roughness: 0.95, metalness: 0, emissive: [0, 0, 0] },
      { key: 'degradedBasin', weight: m.degradedBasinMask, albedo: [108, 98, 90], roughness: 0.96, metalness: 0, emissive: [0, 0, 0] },
      { key: 'scarp', weight: m.scarpMask, albedo: [164, 154, 138], roughness: 0.91, metalness: 0, emissive: [0, 0, 0] },
    ],
    overlays: [
      { key: 'impactCraterOverlay', weight: m.impactCraterMask, albedo: [86, 78, 70], roughness: 0.98, metalness: 0, emissive: [0, 0, 0], influence: 0.45 },
      { key: 'exposedRockOverlay', weight: m.exposedRockMask, albedo: [120, 114, 108], roughness: 0.97, metalness: 0.01, emissive: [0, 0, 0], influence: 0.32 },
    ],
    fallback: { albedo: [122, 114, 104], roughness: 0.95, metalness: 0, emissive: [0, 0, 0] },
    microVariance: input.micro * 0.03,
  });
}

function colorizeMineralTerrain(input: SemanticColorizeInput): SemanticColorMaterialSample {
  const m = input.semanticMasks;
  return resolveSemanticSurfaceClass({
    primaryClasses: [
      { key: 'hardRidge', weight: m.hardRidgeMask, albedo: [112, 118, 124], roughness: 0.9, metalness: 0.06, emissive: [0, 0, 0] },
      { key: 'fractureCavity', weight: m.fractureCavityMask, albedo: [54, 58, 62], roughness: 0.95, metalness: 0.08, emissive: [0, 0, 0] },
      { key: 'rockySystem', weight: m.rockySystemMask, albedo: [88, 90, 92], roughness: 0.92, metalness: 0.08, emissive: [0, 0, 0] },
      { key: 'mineralDeposit', weight: m.mineralDepositMask, albedo: [96, 138, 156], roughness: 0.72, metalness: 0.24, emissive: [0, 0, 0] },
    ],
    overlays: [
      { key: 'depositSeamOverlay', weight: m.depositSeamMask, albedo: [92, 130, 146], roughness: 0.76, metalness: 0.22, emissive: [0, 0, 0], influence: 0.42 },
      { key: 'metallicPatchOverlay', weight: m.exposedMetallicPatchMask, albedo: [156, 168, 176], roughness: 0.6, metalness: 0.34, emissive: [0, 0, 0], influence: 0.56 },
    ],
    fallback: { albedo: [92, 98, 104], roughness: 0.9, metalness: 0.08, emissive: [0, 0, 0] },
    microVariance: input.micro * 0.03,
  });
}

function colorizeTerrestrialTerrain(input: SemanticColorizeInput): SemanticColorMaterialSample {
  const m = input.semanticMasks;
  return resolveSemanticSurfaceClass({
    primaryClasses: [
      { key: 'ocean', weight: m.oceanMask, albedo: [16, 46, 90], roughness: 0.76, metalness: 0, emissive: [0, 0, 0] },
      { key: 'shelf', weight: m.shelfMask, albedo: [66, 138, 156], roughness: 0.72, metalness: 0, emissive: [0, 0, 0] },
      { key: 'coast', weight: m.coastMask, albedo: [210, 198, 164], roughness: 0.89, metalness: 0, emissive: [0, 0, 0] },
      { key: 'lowland', weight: m.lowlandMask + m.continentMask * 0.26, albedo: [80, 130, 76], roughness: 0.9, metalness: 0, emissive: [0, 0, 0] },
      { key: 'upland', weight: m.uplandMask, albedo: [112, 126, 88], roughness: 0.92, metalness: 0, emissive: [0, 0, 0] },
      { key: 'mountain', weight: m.mountainMask, albedo: [112, 116, 124], roughness: 0.97, metalness: 0.01, emissive: [0, 0, 0] },
      { key: 'plateau', weight: m.plateauMask, albedo: [142, 124, 98], roughness: 0.95, metalness: 0, emissive: [0, 0, 0] },
      { key: 'basin', weight: m.inlandBasinMask, albedo: [92, 98, 74], roughness: 0.94, metalness: 0, emissive: [0, 0, 0] },
    ],
    overlays: [
      { key: 'valleyOverlay', weight: m.valleyMask, albedo: [74, 106, 66], roughness: 0.93, metalness: 0, emissive: [0, 0, 0], influence: 0.26 },
      { key: 'vegetationOverlay', weight: m.forestOrVegetatedMask, albedo: [64, 126, 64], roughness: 0.88, metalness: 0, emissive: [0, 0, 0], influence: 0.42 },
      { key: 'dryInteriorOverlay', weight: m.dryInteriorMask, albedo: [164, 142, 96], roughness: 0.94, metalness: 0, emissive: [0, 0, 0], influence: 0.34 },
      { key: 'snowOverlay', weight: m.snowOrPolarMask, albedo: [232, 238, 242], roughness: 0.96, metalness: 0, emissive: [0, 0, 0], influence: 0.48 },
    ],
    fallback: { albedo: [86, 112, 82], roughness: 0.9, metalness: 0, emissive: [0, 0, 0] },
    microVariance: input.micro * 0.03,
  });
}

interface SemanticClassDefinition {
  key: string;
  weight: number;
  albedo: [number, number, number];
  roughness: number;
  metalness: number;
  emissive: [number, number, number];
  influence?: number;
}

interface SemanticSurfaceResolverInput {
  primaryClasses: SemanticClassDefinition[];
  overlays: SemanticClassDefinition[];
  fallback: Omit<SemanticClassDefinition, 'key' | 'weight' | 'influence'>;
  microVariance: number;
}

function resolveSemanticSurfaceClass(input: SemanticSurfaceResolverInput): SemanticColorMaterialSample {
  const primaries = input.primaryClasses
    .map((entry) => ({ ...entry, weight: clamp(entry.weight, 0, 1) }))
    .sort((a, b) => b.weight - a.weight || a.key.localeCompare(b.key));

  const dominant = primaries[0];
  const secondary = primaries[1];
  const base = dominant && dominant.weight > 0.001 ? dominant : { ...input.fallback, key: 'fallback', weight: 1 };

  let albedo: [number, number, number] = [...base.albedo];
  let roughness = base.roughness;
  let metalness = base.metalness;
  let emissive: [number, number, number] = [...base.emissive];

  if (secondary && dominant) {
    const secondaryBlend = clamp((secondary.weight / (dominant.weight + secondary.weight + 1e-5)) * 0.32, 0, 0.32);
    albedo = blendRgb(albedo, secondary.albedo, secondaryBlend);
    roughness = lerp(roughness, secondary.roughness, secondaryBlend);
    metalness = lerp(metalness, secondary.metalness, secondaryBlend);
    emissive = blendRgb(emissive, secondary.emissive, secondaryBlend);
  }

  const overlays = input.overlays
    .map((entry) => ({
      ...entry,
      weight: clamp(entry.weight, 0, 1),
      influence: clamp(entry.influence ?? 0.35, 0, 0.65),
    }))
    .map((entry) => ({ ...entry, resolvedAlpha: clamp(entry.weight * entry.influence, 0, entry.influence) }))
    .filter((entry) => entry.resolvedAlpha > 0.02)
    .sort((a, b) => b.resolvedAlpha - a.resolvedAlpha || a.key.localeCompare(b.key))
    .slice(0, 2);

  for (const overlay of overlays) {
    albedo = blendRgb(albedo, overlay.albedo, overlay.resolvedAlpha);
    roughness = lerp(roughness, overlay.roughness, overlay.resolvedAlpha);
    metalness = lerp(metalness, overlay.metalness, overlay.resolvedAlpha);
    emissive = blendRgb(emissive, overlay.emissive, overlay.resolvedAlpha);
  }

  return {
    albedo: roundRgb(albedo),
    roughness: clamp(roughness + input.microVariance, 0.55, 0.99),
    metalness: clamp(metalness, 0, 0.4),
    emissive: roundRgb(emissive),
  };
}

function blendRgb(a: [number, number, number], b: [number, number, number], alpha: number): [number, number, number] {
  return [
    lerp(a[0], b[0], alpha),
    lerp(a[1], b[1], alpha),
    lerp(a[2], b[2], alpha),
  ];
}

function roundRgb(color: [number, number, number]): [number, number, number] {
  return [
    Math.round(clamp(color[0], 0, 255)),
    Math.round(clamp(color[1], 0, 255)),
    Math.round(clamp(color[2], 0, 255)),
  ];
}

function archetypeSignature(archetype: PlanetVisualProfile['archetype']): ArchetypeSignature {
  switch (archetype) {
    case 'volcanic':
      return { coverageBias: 0.23, seaLevelShift: 0.22, coastWidth: 0.06, shelfWidth: 0.08, fractureStrength: 1, frostStrength: 0.06, heightBias: 0.03 };
    case 'frozen':
      return { coverageBias: -0.08, seaLevelShift: 0.08, coastWidth: 0.05, shelfWidth: 0.14, fractureStrength: 0.72, frostStrength: 0.84, heightBias: -0.02 };
    case 'arid':
      return { coverageBias: 0.12, seaLevelShift: 0.16, coastWidth: 0.07, shelfWidth: 0.09, fractureStrength: 0.45, frostStrength: 0.04, heightBias: 0.025 };
    case 'mineral':
      return { coverageBias: 0.06, seaLevelShift: 0.1, coastWidth: 0.06, shelfWidth: 0.08, fractureStrength: 0.78, frostStrength: 0.14, heightBias: 0.02 };
    case 'oceanic':
      return { coverageBias: -0.2, seaLevelShift: -0.08, coastWidth: 0.04, shelfWidth: 0.16, fractureStrength: 0.3, frostStrength: 0.2, heightBias: -0.025 };
    case 'terrestrial':
      return { coverageBias: -0.04, seaLevelShift: 0.02, coastWidth: 0.055, shelfWidth: 0.13, fractureStrength: 0.48, frostStrength: 0.18, heightBias: 0.01 };
    case 'barren':
    default:
      return { coverageBias: 0.11, seaLevelShift: 0.18, coastWidth: 0.08, shelfWidth: 0.08, fractureStrength: 0.48, frostStrength: 0.12, heightBias: 0.02 };
  }
}

function createFieldTexture(field: Float32Array, width: number, height: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }
  const img = ctx.createImageData(width, height);
  for (let i = 0; i < field.length; i += 1) {
    const v = Math.round(clamp(field[i], 0, 1) * 255);
    const k = i * 4;
    img.data[k] = v;
    img.data[k + 1] = v;
    img.data[k + 2] = v;
    img.data[k + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 2;
  return texture;
}

function createSignedFieldTexture(field: Float32Array, width: number, height: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }
  const img = ctx.createImageData(width, height);
  for (let i = 0; i < field.length; i += 1) {
    const v = Math.round(clamp(0.5 + field[i] * 0.5, 0, 1) * 255);
    const k = i * 4;
    img.data[k] = v;
    img.data[k + 1] = v;
    img.data[k + 2] = v;
    img.data[k + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 2;
  return texture;
}

function createTerrainModel(profile: PlanetVisualProfile, seed: number): TerrainModel {
  const rng = new SeededRng(seed ^ 0x7f4a7c15);
  switch (profile.archetype) {
    case 'oceanic':
      return generateOceanicTerrain(rng);
    case 'frozen':
      return generateFrozenTerrain(rng);
    case 'volcanic':
      return generateVolcanicTerrain(rng);
    case 'arid':
      return generateAridTerrain(rng);
    case 'mineral':
      return generateMineralTerrain(rng);
    case 'terrestrial':
      return generateTerrestrialTerrain(rng);
    case 'barren':
    default:
      return generateBarrenTerrain(rng);
  }
}

function generateOceanicTerrain(rng: SeededRng): OceanicTerrainModel {
  return {
    archetype: 'oceanic',
    abyssalBasins: createClusteredRadialFeatures(rng, 3, 4, 0.16, 0.4, 0.24, 0.54),
    trenches: createSegmentedTrenches(rng, 7, 0.06, 0.14, 4, 8, 0.02, 0.05, 0.24, 0.58),
    shelves: createMarginFeatures(rng, 8, 0.1, 0.24, 0.16, 0.36),
    margins: createMarginFeatures(rng, 8, 0.08, 0.18, 0.12, 0.28),
    islandArcs: createLocalizedChainFeatures(rng, 4, 0.08, 0.18, 0.03, 0.08, 0.08, 0.2),
    emergentMasses: createRadialFeatures(rng, 3, 0.08, 0.18, 0.08, 0.22),
  };
}

function generateFrozenTerrain(rng: SeededRng): FrozenTerrainModel {
  return {
    archetype: 'frozen',
    iceCaps: createRadialFeatures(rng, 3, 0.2, 0.38, 0.16, 0.36),
    iceSheets: createClusteredRadialFeatures(rng, 4, 3, 0.18, 0.34, 0.14, 0.3),
    iceShelves: createMarginFeatures(rng, 10, 0.09, 0.23, 0.18, 0.42),
    compressionRidges: createLocalizedChainFeatures(rng, 10, 0.07, 0.16, 0.02, 0.055, 0.18, 0.38),
    crevasses: createRiftPathFeatures(rng, 8, 3, 6, 0.018, 0.045, 0.16, 0.34),
    frozenBasins: createClusteredRadialFeatures(rng, 3, 3, 0.16, 0.3, 0.16, 0.32),
  };
}

function generateVolcanicTerrain(rng: SeededRng): VolcanicTerrainModel {
  return {
    archetype: 'volcanic',
    volcanoClusters: createClusteredRadialFeatures(rng, 4, 4, 0.07, 0.18, 0.32, 0.74),
    calderas: createRadialFeatures(rng, 9, 0.08, 0.17, 0.22, 0.48),
    lavaPlateaus: createClusteredRadialFeatures(rng, 3, 3, 0.16, 0.28, 0.16, 0.36),
    fissures: createRiftPathFeatures(rng, 10, 4, 8, 0.02, 0.055, 0.22, 0.46),
    collapseBasins: createClusteredRadialFeatures(rng, 3, 2, 0.13, 0.24, 0.14, 0.28),
  };
}

function generateAridTerrain(rng: SeededRng): AridTerrainModel {
  return {
    archetype: 'arid',
    plateaus: createClusteredRadialFeatures(rng, 3, 3, 0.2, 0.34, 0.22, 0.44),
    mesas: createClusteredRadialFeatures(rng, 4, 3, 0.08, 0.18, 0.14, 0.34),
    escarpments: createLocalizedChainFeatures(rng, 8, 0.09, 0.2, 0.03, 0.08, 0.16, 0.32),
    dryBasins: createClusteredRadialFeatures(rng, 4, 3, 0.14, 0.28, 0.2, 0.42),
    canyons: createCorridorFeatures(rng, 8, 0.08, 0.2, 0.02, 0.05, 0.18, 0.38),
  };
}

function generateBarrenTerrain(rng: SeededRng): BarrenTerrainModel {
  return {
    archetype: 'barren',
    wornHighlands: createLocalizedChainFeatures(rng, 6, 0.08, 0.18, 0.03, 0.09, 0.1, 0.24),
    impactCraters: createClusteredRadialFeatures(rng, 6, 3, 0.04, 0.13, 0.16, 0.44),
    degradedBasins: createClusteredRadialFeatures(rng, 4, 2, 0.16, 0.3, 0.14, 0.32),
    scarps: createCorridorFeatures(rng, 6, 0.08, 0.16, 0.02, 0.05, 0.12, 0.26),
  };
}

function generateMineralTerrain(rng: SeededRng): MineralTerrainModel {
  return {
    archetype: 'mineral',
    hardRidges: createLocalizedChainFeatures(rng, 10, 0.08, 0.18, 0.025, 0.07, 0.22, 0.44),
    depositSeams: createRiftPathFeatures(rng, 10, 5, 9, 0.016, 0.04, 0.18, 0.42),
    fractureCavities: createClusteredRadialFeatures(rng, 4, 2, 0.08, 0.2, 0.14, 0.34),
    rockySystems: createClusteredRadialFeatures(rng, 4, 3, 0.12, 0.24, 0.14, 0.3),
  };
}

function generateTerrestrialTerrain(rng: SeededRng): TerrestrialTerrainModel {
  return {
    archetype: 'terrestrial',
    continents: createClusteredRadialFeatures(rng, 3, 2, 0.24, 0.42, 0.22, 0.42),
    mountainChains: createLocalizedChainFeatures(rng, 11, 0.1, 0.22, 0.03, 0.08, 0.2, 0.46),
    plateaus: createClusteredRadialFeatures(rng, 4, 2, 0.16, 0.32, 0.16, 0.34),
    lowlands: createClusteredRadialFeatures(rng, 4, 2, 0.16, 0.3, 0.14, 0.28),
    inlandBasins: createClusteredRadialFeatures(rng, 4, 2, 0.14, 0.3, 0.16, 0.34),
    valleys: createCorridorFeatures(rng, 8, 0.1, 0.24, 0.02, 0.055, 0.14, 0.3),
    limitedRifts: createRiftPathFeatures(rng, 4, 3, 5, 0.02, 0.045, 0.1, 0.24),
    limitedCraters: createRadialFeatures(rng, 3, 0.05, 0.1, 0.1, 0.2),
  };
}

function createRadialFeatures(rng: SeededRng, count: number, minRadius: number, maxRadius: number, minAmp: number, maxAmp: number): RadialFeature[] {
  const out: RadialFeature[] = [];
  for (let i = 0; i < count; i += 1) {
    const z = rng.range(-1, 1);
    const theta = rng.range(0, Math.PI * 2);
    const r = Math.sqrt(Math.max(0, 1 - z * z));
    out.push({
      x: Math.cos(theta) * r,
      y: z,
      z: Math.sin(theta) * r,
      radius: rng.range(minRadius, maxRadius),
      amplitude: rng.range(minAmp, maxAmp),
    });
  }
  return out;
}

function createClusteredRadialFeatures(
  rng: SeededRng,
  clusterCount: number,
  perCluster: number,
  minRadius: number,
  maxRadius: number,
  minAmp: number,
  maxAmp: number,
): RadialFeature[] {
  const out: RadialFeature[] = [];
  for (let c = 0; c < clusterCount; c += 1) {
    const center = randomUnitVector(rng);
    for (let i = 0; i < perCluster; i += 1) {
      const offset = jitterUnitVector(rng, center, rng.range(0.04, 0.22));
      out.push({
        x: offset.x,
        y: offset.y,
        z: offset.z,
        radius: rng.range(minRadius, maxRadius),
        amplitude: rng.range(minAmp, maxAmp),
      });
    }
  }
  return out;
}

function createLocalizedChainFeatures(
  rng: SeededRng,
  count: number,
  minSpan: number,
  maxSpan: number,
  minWidth: number,
  maxWidth: number,
  minAmp: number,
  maxAmp: number,
): LocalizedChainFeature[] {
  const out: LocalizedChainFeature[] = [];
  for (let i = 0; i < count; i += 1) {
    const center = randomUnitVector(rng);
    const tangent = randomTangent(rng, center);
    out.push({
      cx: center.x,
      cy: center.y,
      cz: center.z,
      tx: tangent.x,
      ty: tangent.y,
      tz: tangent.z,
      span: rng.range(minSpan, maxSpan),
      width: rng.range(minWidth, maxWidth),
      amplitude: rng.range(minAmp, maxAmp),
    });
  }
  return out;
}

function createSegmentedTrenches(
  rng: SeededRng,
  count: number,
  minSegmentLength: number,
  maxSegmentLength: number,
  minSegments: number,
  maxSegments: number,
  minWidth: number,
  maxWidth: number,
  minAmp: number,
  maxAmp: number,
): SegmentedTrenchFeature[] {
  const out: SegmentedTrenchFeature[] = [];
  for (let i = 0; i < count; i += 1) {
    const center = randomUnitVector(rng);
    const tangent = randomTangent(rng, center);
    out.push({
      cx: center.x,
      cy: center.y,
      cz: center.z,
      tx: tangent.x,
      ty: tangent.y,
      tz: tangent.z,
      segmentLength: rng.range(minSegmentLength, maxSegmentLength),
      segmentCount: Math.round(rng.range(minSegments, maxSegments)),
      width: rng.range(minWidth, maxWidth),
      amplitude: rng.range(minAmp, maxAmp),
      jaggedness: rng.range(0.15, 0.45),
    });
  }
  return out;
}

function createRiftPathFeatures(
  rng: SeededRng,
  count: number,
  minNodes: number,
  maxNodes: number,
  minWidth: number,
  maxWidth: number,
  minAmp: number,
  maxAmp: number,
): RiftPathFeature[] {
  const out: RiftPathFeature[] = [];
  for (let i = 0; i < count; i += 1) {
    const nodeCount = Math.max(2, Math.round(rng.range(minNodes, maxNodes)));
    const center = randomUnitVector(rng);
    let cursor = center;
    const nodes: Array<{ x: number; y: number; z: number }> = [cursor];
    for (let n = 1; n < nodeCount; n += 1) {
      cursor = jitterUnitVector(rng, cursor, rng.range(0.07, 0.18));
      nodes.push(cursor);
    }
    out.push({
      nodes,
      width: rng.range(minWidth, maxWidth),
      amplitude: rng.range(minAmp, maxAmp),
    });
  }
  return out;
}

function createMarginFeatures(
  rng: SeededRng,
  count: number,
  minSpan: number,
  maxSpan: number,
  minAmp: number,
  maxAmp: number,
): MarginFeature[] {
  const out: MarginFeature[] = [];
  for (let i = 0; i < count; i += 1) {
    const center = randomUnitVector(rng);
    const normal = jitterUnitVector(rng, center, rng.range(0.14, 0.34));
    out.push({
      cx: center.x,
      cy: center.y,
      cz: center.z,
      nx: normal.x,
      ny: normal.y,
      nz: normal.z,
      span: rng.range(minSpan, maxSpan),
      width: rng.range(0.02, 0.08),
      amplitude: rng.range(minAmp, maxAmp),
    });
  }
  return out;
}

function createCorridorFeatures(
  rng: SeededRng,
  count: number,
  minLength: number,
  maxLength: number,
  minWidth: number,
  maxWidth: number,
  minAmp: number,
  maxAmp: number,
): CorridorFeature[] {
  const out: CorridorFeature[] = [];
  for (let i = 0; i < count; i += 1) {
    const center = randomUnitVector(rng);
    const tangent = randomTangent(rng, center);
    out.push({
      cx: center.x,
      cy: center.y,
      cz: center.z,
      tx: tangent.x,
      ty: tangent.y,
      tz: tangent.z,
      length: rng.range(minLength, maxLength),
      width: rng.range(minWidth, maxWidth),
      amplitude: rng.range(minAmp, maxAmp),
    });
  }
  return out;
}

function evaluateTerrainSample(nx: number, ny: number, nz: number, model: TerrainModel): TerrainSample {
  let volcanoField = 0;
  let calderaField = 0;
  let mountainChainField = 0;
  let plateauField = 0;
  let basinField = 0;
  let trenchField = 0;
  let riftField = 0;
  let craterField = 0;
  let iceShelfField = 0;
  let compressionRidgeField = 0;
  let uplift = 0;
  let depression = 0;

  switch (model.archetype) {
    case 'oceanic': {
      basinField = sampleRadialFeatures(nx, ny, nz, model.abyssalBasins);
      trenchField = sampleSegmentedTrenches(nx, ny, nz, model.trenches);
      const shelfField = sampleMarginFeatures(nx, ny, nz, model.shelves, true);
      const marginField = sampleMarginFeatures(nx, ny, nz, model.margins, false);
      mountainChainField = sampleLocalizedChains(nx, ny, nz, model.islandArcs);
      plateauField = sampleRadialFeatures(nx, ny, nz, model.emergentMasses);
      uplift = mountainChainField * 0.22 + plateauField * 0.12 + shelfField * 0.12 + marginField * 0.08;
      depression = basinField * 0.44 + trenchField * 0.4;
      break;
    }
    case 'frozen':
      plateauField = sampleRadialFeatures(nx, ny, nz, model.iceSheets);
      basinField = sampleRadialFeatures(nx, ny, nz, model.frozenBasins);
      craterField = sampleRingDepressions(nx, ny, nz, model.iceCaps);
      iceShelfField = sampleMarginFeatures(nx, ny, nz, model.iceShelves, true);
      compressionRidgeField = sampleLocalizedChains(nx, ny, nz, model.compressionRidges);
      riftField = sampleRiftPaths(nx, ny, nz, model.crevasses);
      uplift = iceShelfField * 0.34 + compressionRidgeField * 0.34 + plateauField * 0.16;
      depression = basinField * 0.3 + riftField * 0.26 + craterField * 0.08;
      break;
    case 'volcanic':
      volcanoField = sampleRadialFeatures(nx, ny, nz, model.volcanoClusters);
      calderaField = sampleRingDepressions(nx, ny, nz, model.calderas);
      plateauField = sampleRadialFeatures(nx, ny, nz, model.lavaPlateaus);
      riftField = sampleRiftPaths(nx, ny, nz, model.fissures);
      basinField = sampleRadialFeatures(nx, ny, nz, model.collapseBasins);
      uplift = volcanoField * 0.52 + plateauField * 0.28 + riftField * 0.08;
      depression = calderaField * 0.46 + collapseBasinMask(basinField, riftField) * 0.26 + riftField * 0.18;
      break;
    case 'arid':
      plateauField = sampleRadialFeatures(nx, ny, nz, model.plateaus);
      mountainChainField = sampleLocalizedChains(nx, ny, nz, model.escarpments);
      const mesaField = sampleRadialFeatures(nx, ny, nz, model.mesas);
      basinField = sampleRadialFeatures(nx, ny, nz, model.dryBasins);
      riftField = sampleCorridors(nx, ny, nz, model.canyons);
      uplift = plateauField * 0.3 + mesaField * 0.2 + mountainChainField * 0.2;
      depression = basinField * 0.34 + canyonMask(riftField, mountainChainField) * 0.28 + riftField * 0.14;
      break;
    case 'mineral':
      mountainChainField = sampleLocalizedChains(nx, ny, nz, model.hardRidges);
      compressionRidgeField = sampleRiftPaths(nx, ny, nz, model.depositSeams);
      basinField = sampleRadialFeatures(nx, ny, nz, model.fractureCavities);
      plateauField = sampleRadialFeatures(nx, ny, nz, model.rockySystems);
      riftField = compressionRidgeField;
      uplift = mountainChainField * 0.34 + plateauField * 0.2 + depositUpliftMask(compressionRidgeField, mountainChainField) * 0.26;
      depression = basinField * 0.28 + riftField * 0.32;
      break;
    case 'terrestrial':
      mountainChainField = sampleLocalizedChains(nx, ny, nz, model.mountainChains);
      plateauField = sampleRadialFeatures(nx, ny, nz, model.plateaus);
      const continentField = sampleRadialFeatures(nx, ny, nz, model.continents);
      basinField = sampleRadialFeatures(nx, ny, nz, model.inlandBasins);
      const lowlandField = sampleRadialFeatures(nx, ny, nz, model.lowlands);
      riftField = sampleRiftPaths(nx, ny, nz, model.limitedRifts);
      craterField = sampleRingDepressions(nx, ny, nz, model.limitedCraters);
      const valleyField = sampleCorridors(nx, ny, nz, model.valleys);
      uplift = mountainChainField * 0.34 + plateauField * 0.24 + continentField * 0.18;
      depression = basinField * 0.26 + lowlandField * 0.14 + valleyMaskField(valleyField, basinField) * 0.24 + riftField * 0.18 + craterField * 0.05;
      break;
    case 'barren':
    default:
      mountainChainField = sampleLocalizedChains(nx, ny, nz, model.wornHighlands);
      craterField = sampleRingDepressions(nx, ny, nz, model.impactCraters);
      basinField = sampleRadialFeatures(nx, ny, nz, model.degradedBasins);
      riftField = sampleCorridors(nx, ny, nz, model.scarps);
      uplift = mountainChainField * 0.24 + riftField * 0.1;
      depression = craterField * 0.44 + basinField * 0.28 + riftField * 0.12;
      break;
  }

  uplift = clamp(uplift, 0, 1);
  depression = clamp(depression, 0, 1);
  const finalSignedRelief = clamp(uplift - depression, -1, 1);

  return { volcanoField, calderaField, mountainChainField, plateauField, basinField, trenchField, riftField, craterField, iceShelfField, compressionRidgeField, upliftField: uplift, depressionField: depression, finalSignedRelief };
}

function collapseBasinMask(basin: number, rift: number) {
  return clamp(basin * 0.65 + rift * 0.35, 0, 1);
}

function canyonMask(rift: number, mountain: number) {
  return clamp(rift * 0.52 + (1 - mountain) * 0.18, 0, 1);
}

function depositUpliftMask(rift: number, volcanic: number) {
  return clamp(rift * 0.55 + volcanic * 0.25, 0, 1);
}

function valleyMaskField(mountain: number, basin: number) {
  return clamp((1 - mountain) * 0.35 + basin * 0.45, 0, 1);
}

function sampleRadialFeatures(nx: number, ny: number, nz: number, features: RadialFeature[]) {
  let sum = 0;
  for (let i = 0; i < features.length; i += 1) {
    const feature = features[i];
    const dot = clamp(nx * feature.x + ny * feature.y + nz * feature.z, -1, 1);
    const d = Math.acos(dot);
    const g = Math.exp(-((d / feature.radius) ** 2));
    sum += g * feature.amplitude;
  }
  return clamp(sum, 0, 1);
}

function sampleRingDepressions(nx: number, ny: number, nz: number, features: RadialFeature[]) {
  let sum = 0;
  for (let i = 0; i < features.length; i += 1) {
    const feature = features[i];
    const dot = clamp(nx * feature.x + ny * feature.y + nz * feature.z, -1, 1);
    const d = Math.acos(dot);
    const ring = Math.abs(d - feature.radius * 0.62);
    const g = Math.exp(-((ring / (feature.radius * 0.38)) ** 2));
    const core = Math.exp(-((d / (feature.radius * 0.8)) ** 2));
    sum += clamp((g * 0.55 + core * 0.45) * feature.amplitude, 0, 1);
  }
  return clamp(sum, 0, 1);
}

function sampleLocalizedChains(nx: number, ny: number, nz: number, features: LocalizedChainFeature[]) {
  let sum = 0;
  for (let i = 0; i < features.length; i += 1) {
    const feature = features[i];
    const dotToCenter = clamp(nx * feature.cx + ny * feature.cy + nz * feature.cz, -1, 1);
    const along = nx * feature.tx + ny * feature.ty + nz * feature.tz;
    const across = Math.acos(dotToCenter);
    const longitudinal = Math.exp(-((Math.abs(along) / feature.span) ** 2));
    const lateral = Math.exp(-((across / feature.width) ** 2));
    const g = longitudinal * lateral;
    sum += g * feature.amplitude;
  }
  return clamp(sum, 0, 1);
}

function sampleSegmentedTrenches(nx: number, ny: number, nz: number, features: SegmentedTrenchFeature[]) {
  let sum = 0;
  for (let i = 0; i < features.length; i += 1) {
    const feature = features[i];
    let trench = 0;
    for (let s = 0; s < feature.segmentCount; s += 1) {
      const offset = (s - (feature.segmentCount - 1) * 0.5) * feature.segmentLength;
      const wobble = Math.sin(offset * 11.7 + s * 2.1) * feature.jaggedness;
      const sx = feature.cx + feature.tx * (offset + wobble * 0.3);
      const sy = feature.cy + feature.ty * (offset - wobble * 0.25);
      const sz = feature.cz + feature.tz * (offset + wobble * 0.2);
      const sr = Math.hypot(sx, sy, sz) || 1;
      const ux = sx / sr;
      const uy = sy / sr;
      const uz = sz / sr;
      const dot = clamp(nx * ux + ny * uy + nz * uz, -1, 1);
      const d = Math.acos(dot);
      trench = Math.max(trench, Math.exp(-((d / feature.width) ** 2)));
    }
    sum += trench * feature.amplitude;
  }
  return clamp(sum, 0, 1);
}

function sampleRiftPaths(nx: number, ny: number, nz: number, features: RiftPathFeature[]) {
  let sum = 0;
  for (let i = 0; i < features.length; i += 1) {
    const feature = features[i];
    let path = 0;
    for (let n = 1; n < feature.nodes.length; n += 1) {
      const a = feature.nodes[n - 1];
      const b = feature.nodes[n];
      const mx = (a.x + b.x) * 0.5;
      const my = (a.y + b.y) * 0.5;
      const mz = (a.z + b.z) * 0.5;
      const mr = Math.hypot(mx, my, mz) || 1;
      const ux = mx / mr;
      const uy = my / mr;
      const uz = mz / mr;
      const dot = clamp(nx * ux + ny * uy + nz * uz, -1, 1);
      const d = Math.acos(dot);
      path = Math.max(path, Math.exp(-((d / feature.width) ** 2)));
    }
    sum += path * feature.amplitude;
  }
  return clamp(sum, 0, 1);
}

function sampleMarginFeatures(nx: number, ny: number, nz: number, features: MarginFeature[], polarWeighted: boolean) {
  let sum = 0;
  for (let i = 0; i < features.length; i += 1) {
    const feature = features[i];
    const dotCenter = clamp(nx * feature.cx + ny * feature.cy + nz * feature.cz, -1, 1);
    const angular = Math.acos(dotCenter);
    const alongNormal = Math.abs(nx * feature.nx + ny * feature.ny + nz * feature.nz);
    const marginBand = Math.exp(-((Math.abs(angular - feature.span) / feature.width) ** 2));
    const confinement = Math.exp(-((alongNormal / 0.4) ** 2));
    const polar = polarWeighted ? smoothstep(0.45, 0.97, Math.abs(ny)) : 1;
    sum += marginBand * confinement * polar * feature.amplitude;
  }
  return clamp(sum, 0, 1);
}

function sampleCorridors(nx: number, ny: number, nz: number, features: CorridorFeature[]) {
  let sum = 0;
  for (let i = 0; i < features.length; i += 1) {
    const feature = features[i];
    const dotCenter = clamp(nx * feature.cx + ny * feature.cy + nz * feature.cz, -1, 1);
    const radial = Math.acos(dotCenter);
    const along = Math.abs(nx * feature.tx + ny * feature.ty + nz * feature.tz);
    const lengthMask = Math.exp(-((along / feature.length) ** 2));
    const widthMask = Math.exp(-((radial / feature.width) ** 2));
    sum += lengthMask * widthMask * feature.amplitude;
  }
  return clamp(sum, 0, 1);
}

function randomUnitVector(rng: SeededRng) {
  const z = rng.range(-1, 1);
  const theta = rng.range(0, Math.PI * 2);
  const r = Math.sqrt(Math.max(0, 1 - z * z));
  return { x: Math.cos(theta) * r, y: z, z: Math.sin(theta) * r };
}

function randomTangent(rng: SeededRng, center: { x: number; y: number; z: number }) {
  const probe = randomUnitVector(rng);
  const dot = center.x * probe.x + center.y * probe.y + center.z * probe.z;
  const tx = probe.x - center.x * dot;
  const ty = probe.y - center.y * dot;
  const tz = probe.z - center.z * dot;
  const m = Math.hypot(tx, ty, tz) || 1;
  return { x: tx / m, y: ty / m, z: tz / m };
}

function jitterUnitVector(rng: SeededRng, base: { x: number; y: number; z: number }, strength: number) {
  const tangent = randomTangent(rng, base);
  const angle = rng.range(-Math.PI, Math.PI);
  const offset = {
    x: tangent.x * Math.cos(angle) * strength,
    y: tangent.y * Math.sin(angle) * strength,
    z: tangent.z * Math.cos(angle * 0.7) * strength,
  };
  const x = base.x + offset.x;
  const y = base.y + offset.y;
  const z = base.z + offset.z;
  const m = Math.hypot(x, y, z) || 1;
  return { x: x / m, y: y / m, z: z / m };
}

function applyPlanetReliefToGeometry(
  geometry: THREE.SphereGeometry,
  terrainModel: TerrainModel,
  profile: PlanetVisualProfile,
  seed: number,
) {
  const positions = geometry.attributes.position;
  const vertex = new THREE.Vector3();
  const rng = new SeededRng(seed ^ 0xa24baed4);
  const baseScale = profile.reliefStrength * 0.22 + rng.range(0.008, 0.018);
  const displacementScale = clamp(baseScale, 0.016, 0.045);
  for (let i = 0; i < positions.count; i += 1) {
    vertex.set(positions.getX(i), positions.getY(i), positions.getZ(i));
    const normal = vertex.clone().normalize();
    const terrain = evaluateTerrainSample(normal.x, normal.y, normal.z, terrainModel);
    const signed = terrain.finalSignedRelief;
    const curved = Math.sign(signed) * Math.pow(Math.abs(signed), 0.9);
    const radius = 1 + curved * displacementScale;
    positions.setXYZ(i, normal.x * radius, normal.y * radius, normal.z * radius);
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
}

function getFieldMinMax(field: Float32Array) {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < field.length; i += 1) {
    const value = field[i];
    if (value < min) min = value;
    if (value > max) max = value;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 1 };
  return { min, max };
}

function fbm3(x: number, y: number, z: number, seed: number, octaves: number) {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let totalAmp = 0;
  for (let i = 0; i < octaves; i += 1) {
    value += valueNoise3(x * frequency, y * frequency, z * frequency, seed + i * 131) * amplitude;
    totalAmp += amplitude;
    frequency *= 2.03;
    amplitude *= 0.52;
  }
  return totalAmp > 0 ? value / totalAmp : 0;
}

function valueNoise3(x: number, y: number, z: number, seed: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;

  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const w = fz * fz * (3 - 2 * fz);

  const n000 = hash3(ix, iy, iz, seed);
  const n100 = hash3(ix + 1, iy, iz, seed);
  const n010 = hash3(ix, iy + 1, iz, seed);
  const n110 = hash3(ix + 1, iy + 1, iz, seed);
  const n001 = hash3(ix, iy, iz + 1, seed);
  const n101 = hash3(ix + 1, iy, iz + 1, seed);
  const n011 = hash3(ix, iy + 1, iz + 1, seed);
  const n111 = hash3(ix + 1, iy + 1, iz + 1, seed);

  const nx00 = lerp(n000, n100, u);
  const nx10 = lerp(n010, n110, u);
  const nx01 = lerp(n001, n101, u);
  const nx11 = lerp(n011, n111, u);
  const nxy0 = lerp(nx00, nx10, v);
  const nxy1 = lerp(nx01, nx11, v);
  return lerp(nxy0, nxy1, w);
}

function hash3(x: number, y: number, z: number, seed: number) {
  const s = Math.sin((x * 127.1 + y * 311.7 + z * 74.7 + seed * 0.013) * 43758.5453123);
  return s - Math.floor(s);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}
