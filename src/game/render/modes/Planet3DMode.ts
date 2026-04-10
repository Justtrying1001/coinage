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

    this.scene.background = new THREE.Color(0x040811);
    this.scene.add(this.root);

    const ambient = new THREE.AmbientLight(0x9ed4ff, 0.34);
    this.scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0xdaf0ff, 0x425564, 0.72);
    this.scene.add(hemi);
    const reliefKey = new THREE.DirectionalLight(0xffffff, 0.45);
    reliefKey.position.set(2.2, 1.4, 2.6);
    this.scene.add(reliefKey);

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

    const profile = planetProfileFromSeed(planetRef.seed);
    const rng = new SeededRng(planetRef.seed ^ 0x45d9f3b);
    const seedPhaseA = rng.range(0.2, Math.PI * 2.2);
    const seedPhaseB = rng.range(0.2, Math.PI * 1.7);
    const seedPhaseC = rng.range(0.2, Math.PI * 2.8);
    const seedPhaseD = rng.range(0.2, Math.PI * 1.3);

    const geometry = new THREE.IcosahedronGeometry(1, 6);
    const position = geometry.attributes.position;

    for (let i = 0; i < position.count; i += 1) {
      const vx = position.getX(i);
      const vy = position.getY(i);
      const vz = position.getZ(i);

      const latitude = Math.asin(clamp(vy, -1, 1)) / (Math.PI * 0.5);
      const continentNoise = normalizedNoise(vx, vy, vz, profile.continentScale, seedPhaseA, seedPhaseB);
      const ridgeNoise = normalizedNoise(vz, vx, vy, profile.ridgeScale, seedPhaseC, seedPhaseD);
      const craterNoise = normalizedNoise(vy, vz, vx, profile.craterScale, seedPhaseD, seedPhaseA);
      const macroMask = clamp(Math.pow(continentNoise, profile.reliefSharpness) + profile.macroBias, 0, 1);
      const ridgeMask = Math.max(0, ridgeNoise - 0.5) * 1.8 * profile.ridgeWeight;
      const craterMask = (0.5 - Math.abs(craterNoise - 0.5)) * profile.craterWeight;
      const polarMask = Math.pow(Math.abs(latitude), 1.3);
      const elevation = (macroMask * 0.78 + ridgeMask - craterMask - polarMask * profile.polarWeight) * profile.reliefStrength;

      position.setXYZ(i, vx * (1 + elevation), vy * (1 + elevation), vz * (1 + elevation));
    }

    geometry.deleteAttribute('normal');
    geometry.computeVertexNormals();
    geometry.normalizeNormals();

    const maps = buildPlanetMaps(profile, planetRef.seed);
    this.generatedTextures = [maps.map, maps.roughnessMap, maps.metalnessMap, maps.bumpMap, maps.emissiveMap];

    const material = new THREE.MeshStandardMaterial({
      map: maps.map,
      roughnessMap: maps.roughnessMap,
      metalnessMap: maps.metalnessMap,
      bumpMap: maps.bumpMap,
      bumpScale: 0.02 + profile.reliefStrength * 0.035,
      emissiveMap: maps.emissiveMap,
      roughness: clamp(profile.roughness + 0.14, 0.38, 0.92),
      metalness: clamp(profile.metalness * 0.45, 0, 0.16),
      flatShading: false,
      emissive: new THREE.Color(`hsl(${profile.accentHue}, 45%, ${profile.atmosphereLightness}%)`),
      emissiveIntensity: profile.emissiveIntensity * 0.45,
    });

    this.planet = new THREE.Mesh(geometry, material);
    this.root.add(this.planet);

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
    }
  };

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
    { label: 'fractured crust', score: normalize(profile.craterWeight, 0.14, 0.36) + normalize(profile.reliefSharpness, 1.2, 2.3) * 0.35 },
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

function normalizedNoise(a: number, b: number, c: number, scale: number, phaseA: number, phaseB: number) {
  const primary = Math.sin(a * scale + phaseA) * Math.cos(b * scale * 0.75 + phaseB);
  const secondary = Math.sin(c * scale * 1.35 + phaseB * 1.2) * 0.5;
  return clamp(primary * 0.65 + secondary * 0.35 + 0.5, 0, 1);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalize(value: number, min: number, max: number) {
  if (max <= min) return 0;
  return clamp((value - min) / (max - min), 0, 1);
}

function wrapHue(value: number) {
  return ((value % 360) + 360) % 360;
}

interface PlanetMaps {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  metalnessMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  emissiveMap: THREE.CanvasTexture;
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
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const emissiveCanvas = document.createElement('canvas');
  emissiveCanvas.width = width;
  emissiveCanvas.height = height;

  paintPlanetTextures(profile, seed, colorCanvas, roughCanvas, metalCanvas, bumpCanvas, emissiveCanvas);

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

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.ClampToEdgeWrapping;
  bumpMap.anisotropy = 2;

  const emissiveMap = new THREE.CanvasTexture(emissiveCanvas);
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  emissiveMap.wrapS = THREE.RepeatWrapping;
  emissiveMap.wrapT = THREE.ClampToEdgeWrapping;
  emissiveMap.anisotropy = 2;

  return { map, roughnessMap, metalnessMap, bumpMap, emissiveMap };
}

function paintPlanetTextures(
  profile: PlanetVisualProfile,
  seed: number,
  colorCanvas: HTMLCanvasElement,
  roughCanvas: HTMLCanvasElement,
  metalCanvas: HTMLCanvasElement,
  bumpCanvas: HTMLCanvasElement,
  emissiveCanvas: HTMLCanvasElement,
) {
  const width = colorCanvas.width;
  const height = colorCanvas.height;
  const colorCtx = colorCanvas.getContext('2d');
  const roughCtx = roughCanvas.getContext('2d');
  const metalCtx = metalCanvas.getContext('2d');
  const bumpCtx = bumpCanvas.getContext('2d');
  const emissiveCtx = emissiveCanvas.getContext('2d');
  if (!colorCtx || !roughCtx || !metalCtx || !bumpCtx || !emissiveCtx) return;

  const colorData = colorCtx.createImageData(width, height);
  const roughData = roughCtx.createImageData(width, height);
  const metalData = metalCtx.createImageData(width, height);
  const bumpData = bumpCtx.createImageData(width, height);
  const emissiveData = emissiveCtx.createImageData(width, height);

  const signature = archetypeSignature(profile.archetype);
  const rng = new SeededRng(seed ^ 0x6a09e667);
  const phaseA = rng.range(0.2, Math.PI * 1.9);
  const phaseB = rng.range(0.2, Math.PI * 2.4);
  const phaseC = rng.range(0.2, Math.PI * 2.7);

  for (let y = 0; y < height; y += 1) {
    const v = y / (height - 1);
    const latitude = (v - 0.5) * Math.PI;

    for (let x = 0; x < width; x += 1) {
      const u = x / width;
      const longitude = (u - 0.5) * Math.PI * 2;
      const nx = Math.cos(latitude) * Math.cos(longitude);
      const ny = Math.sin(latitude);
      const nz = Math.cos(latitude) * Math.sin(longitude);

      const macro = fbm3(nx * profile.continentScale, ny * profile.continentScale, nz * profile.continentScale, seed + 17, 4);
      const medium = fbm3(nx * profile.ridgeScale * 0.16, ny * profile.ridgeScale * 0.16, nz * profile.ridgeScale * 0.16, seed + 313, 2);
      const micro = fbm3(nx * 10.4, ny * 10.4, nz * 10.4, seed + 997, 2);

      const bands = Math.sin((ny + phaseA) * signature.bandFrequency + medium * 1.4 + phaseB) * 0.5 + 0.5;
      const fracture = Math.abs(Math.sin((nx + nz + phaseC) * signature.fractureFrequency + medium * 2.1));
      const basin = clamp(Math.pow(1 - Math.abs(macro - 0.5) * 2, 1.6) * 0.82 + medium * 0.18, 0, 1);
      const coverage = clamp(macro * 0.8 + medium * 0.12 + bands * 0.08 + signature.coverageBias, 0, 1);
      const ocean = coverage < profile.oceanLevel;

      const hue = wrapHue(
        profile.baseHue
        + (ocean ? signature.waterHueShift : signature.landHueShift)
        + (bands - 0.5) * signature.hueVariance
        + (fracture - 0.5) * signature.fractureHueShift,
      );
      const sat = clamp((ocean ? profile.oceanSaturation : profile.landSaturation) + (medium - 0.5) * 12 + signature.saturationOffset, 12, 86);
      const lightness = clamp(
        (ocean ? profile.oceanLightness : profile.landLightness)
        + (macro - 0.5) * signature.macroLightness
        + (basin - 0.5) * signature.basinLightness
        - Math.abs(ny) * signature.polarDarkening,
        16,
        82,
      );

      const rgb = hslToRgb(hue / 360, sat / 100, lightness / 100);
      const i = (y * width + x) * 4;
      colorData.data[i] = rgb[0];
      colorData.data[i + 1] = rgb[1];
      colorData.data[i + 2] = rgb[2];
      colorData.data[i + 3] = 255;

      const roughness = clamp(profile.roughness + (ocean ? signature.waterSmoothness : signature.landRoughBoost) + (1 - medium) * 0.08, 0.2, 0.95);
      const roughValue = Math.round(roughness * 255);
      roughData.data[i] = roughValue;
      roughData.data[i + 1] = roughValue;
      roughData.data[i + 2] = roughValue;
      roughData.data[i + 3] = 255;

      const metal = clamp(profile.metalness + signature.metalBias + (fracture > 0.88 ? signature.metalVeinBoost : 0), 0, 0.78);
      const metalValue = Math.round(metal * 255);
      metalData.data[i] = metalValue;
      metalData.data[i + 1] = metalValue;
      metalData.data[i + 2] = metalValue;
      metalData.data[i + 3] = 255;

      const bump = clamp(macro * 0.62 + medium * 0.28 + micro * 0.1 + signature.bumpBias - (ocean ? signature.oceanBasinFlatten : 0), 0.08, 0.92);
      const bumpValue = Math.round(bump * 255);
      bumpData.data[i] = bumpValue;
      bumpData.data[i + 1] = bumpValue;
      bumpData.data[i + 2] = bumpValue;
      bumpData.data[i + 3] = 255;

      const emissiveMask = clamp(signature.emissiveBase + (fracture > signature.emissiveThreshold ? (fracture - signature.emissiveThreshold) * signature.emissiveGain : 0), 0, 0.58);
      const eHue = wrapHue(profile.accentHue + signature.emissiveHueShift);
      const eRgb = hslToRgb(eHue / 360, clamp(0.55 + signature.emissiveSaturationBoost, 0, 1), clamp(0.2 + emissiveMask * 0.7, 0, 1));
      emissiveData.data[i] = Math.round(eRgb[0] * emissiveMask);
      emissiveData.data[i + 1] = Math.round(eRgb[1] * emissiveMask);
      emissiveData.data[i + 2] = Math.round(eRgb[2] * emissiveMask);
      emissiveData.data[i + 3] = 255;
    }
  }

  colorCtx.putImageData(colorData, 0, 0);
  roughCtx.putImageData(roughData, 0, 0);
  metalCtx.putImageData(metalData, 0, 0);
  bumpCtx.putImageData(bumpData, 0, 0);
  emissiveCtx.putImageData(emissiveData, 0, 0);
}

interface ArchetypeSignature {
  coverageBias: number;
  bandFrequency: number;
  fractureFrequency: number;
  hueVariance: number;
  fractureHueShift: number;
  landHueShift: number;
  waterHueShift: number;
  saturationOffset: number;
  macroLightness: number;
  basinLightness: number;
  polarDarkening: number;
  waterSmoothness: number;
  landRoughBoost: number;
  metalBias: number;
  metalVeinBoost: number;
  bumpBias: number;
  oceanBasinFlatten: number;
  emissiveBase: number;
  emissiveThreshold: number;
  emissiveGain: number;
  emissiveHueShift: number;
  emissiveSaturationBoost: number;
}

function archetypeSignature(archetype: PlanetVisualProfile['archetype']): ArchetypeSignature {
  switch (archetype) {
    case 'volcanic':
      return { coverageBias: 0.26, bandFrequency: 5.8, fractureFrequency: 12.8, hueVariance: 14, fractureHueShift: 14, landHueShift: 12, waterHueShift: 5, saturationOffset: 10, macroLightness: 14, basinLightness: -12, polarDarkening: 4, waterSmoothness: -0.06, landRoughBoost: 0.1, metalBias: 0.03, metalVeinBoost: 0.08, bumpBias: 0.12, oceanBasinFlatten: 0.02, emissiveBase: 0.03, emissiveThreshold: 0.86, emissiveGain: 1.05, emissiveHueShift: -10, emissiveSaturationBoost: 0.28 };
    case 'frozen':
      return { coverageBias: -0.1, bandFrequency: 10.8, fractureFrequency: 8.8, hueVariance: 9, fractureHueShift: -6, landHueShift: -24, waterHueShift: -10, saturationOffset: -12, macroLightness: 18, basinLightness: 10, polarDarkening: -12, waterSmoothness: -0.22, landRoughBoost: -0.12, metalBias: 0.01, metalVeinBoost: 0.03, bumpBias: -0.06, oceanBasinFlatten: 0.12, emissiveBase: 0.0, emissiveThreshold: 0.95, emissiveGain: 0.18, emissiveHueShift: -22, emissiveSaturationBoost: 0.03 };
    case 'arid':
      return { coverageBias: 0.14, bandFrequency: 3.6, fractureFrequency: 6.6, hueVariance: 8, fractureHueShift: 4, landHueShift: 10, waterHueShift: 0, saturationOffset: -6, macroLightness: 12, basinLightness: -6, polarDarkening: 5, waterSmoothness: -0.05, landRoughBoost: 0.13, metalBias: -0.02, metalVeinBoost: 0.03, bumpBias: 0.09, oceanBasinFlatten: 0.15, emissiveBase: 0.0, emissiveThreshold: 0.97, emissiveGain: 0.12, emissiveHueShift: 6, emissiveSaturationBoost: 0.03 };
    case 'mineral':
      return { coverageBias: 0.08, bandFrequency: 6.2, fractureFrequency: 10.8, hueVariance: 10, fractureHueShift: 10, landHueShift: 6, waterHueShift: 0, saturationOffset: -14, macroLightness: 11, basinLightness: 4, polarDarkening: 6, waterSmoothness: -0.04, landRoughBoost: -0.02, metalBias: 0.22, metalVeinBoost: 0.16, bumpBias: 0.05, oceanBasinFlatten: 0.06, emissiveBase: 0.0, emissiveThreshold: 0.9, emissiveGain: 0.24, emissiveHueShift: 18, emissiveSaturationBoost: 0.08 };
    case 'oceanic':
      return { coverageBias: -0.2, bandFrequency: 4.6, fractureFrequency: 7.2, hueVariance: 12, fractureHueShift: -10, landHueShift: -6, waterHueShift: -28, saturationOffset: 8, macroLightness: 14, basinLightness: 14, polarDarkening: -7, waterSmoothness: -0.26, landRoughBoost: -0.06, metalBias: -0.04, metalVeinBoost: 0.01, bumpBias: -0.05, oceanBasinFlatten: 0.2, emissiveBase: 0.0, emissiveThreshold: 0.97, emissiveGain: 0.1, emissiveHueShift: -28, emissiveSaturationBoost: 0.04 };
    case 'fractured':
      return { coverageBias: 0.2, bandFrequency: 8.8, fractureFrequency: 14.6, hueVariance: 18, fractureHueShift: 18, landHueShift: 16, waterHueShift: 6, saturationOffset: 0, macroLightness: 9, basinLightness: -10, polarDarkening: 8, waterSmoothness: -0.06, landRoughBoost: 0.12, metalBias: 0.03, metalVeinBoost: 0.12, bumpBias: 0.14, oceanBasinFlatten: 0.03, emissiveBase: 0.01, emissiveThreshold: 0.82, emissiveGain: 0.62, emissiveHueShift: 20, emissiveSaturationBoost: 0.12 };
    case 'barren':
    default:
      return { coverageBias: 0.12, bandFrequency: 3.2, fractureFrequency: 5.6, hueVariance: 4, fractureHueShift: 0, landHueShift: 2, waterHueShift: 0, saturationOffset: -18, macroLightness: 8, basinLightness: -4, polarDarkening: 8, waterSmoothness: -0.02, landRoughBoost: 0.08, metalBias: 0.0, metalVeinBoost: 0.01, bumpBias: 0.05, oceanBasinFlatten: 0.06, emissiveBase: 0.0, emissiveThreshold: 0.98, emissiveGain: 0.08, emissiveHueShift: 0, emissiveSaturationBoost: 0.0 };
  }
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

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const gray = Math.round(l * 255);
    return [gray, gray, gray];
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let next = t;
    if (next < 0) next += 1;
    if (next > 1) next -= 1;
    if (next < 1 / 6) return p + (q - p) * 6 * next;
    if (next < 1 / 2) return q;
    if (next < 2 / 3) return p + (q - p) * (2 / 3 - next) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = hue2rgb(p, q, h + 1 / 3);
  const g = hue2rgb(p, q, h);
  const b = hue2rgb(p, q, h - 1 / 3);

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
