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
    'macroHeight',
    'regionalHeight',
    'detailHeight',
    'displacementInfluence',
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

    const ambient = new THREE.AmbientLight(0xe0efff, 0.96);
    this.scene.add(ambient);

    const skylight = new THREE.DirectionalLight(0xcfe3ff, 0.46);
    skylight.position.set(2.4, 1.8, 2.2);
    this.scene.add(skylight);
    const wrapFill = new THREE.DirectionalLight(0xaecdf5, 0.38);
    wrapFill.position.set(-2.2, 0.8, -2.4);
    this.scene.add(wrapFill);
    const topFill = new THREE.DirectionalLight(0xb9ddff, 0.28);
    topFill.position.set(0, 3.2, 0.4);
    this.scene.add(topFill);
    const frontFill = new THREE.DirectionalLight(0xe6f2ff, 0.18);
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
      maps.debugMaps.macroHeight,
      maps.debugMaps.regionalHeight,
      maps.debugMaps.detailHeight,
      maps.debugMaps.displacementInfluence,
      maps.debugMaps.finalNormal,
    ];
    this.currentMaps = maps;

    applyPlanetReliefToGeometry(geometry, maps.displacementField, maps.width, maps.height, profile, planetRef.seed);

    const material = new THREE.MeshStandardMaterial({
      map: maps.map,
      roughnessMap: maps.roughnessMap,
      metalnessMap: maps.metalnessMap,
      normalMap: maps.normalMap,
      normalScale: new THREE.Vector2(0.42, 0.42),
      emissiveMap: maps.emissiveMap,
      roughness: clamp(profile.roughness + 0.22, 0.48, 0.95),
      metalness: clamp(profile.metalness * 0.1, 0, 0.06),
      flatShading: false,
      emissive: new THREE.Color(`hsl(${profile.accentHue}, 45%, ${profile.atmosphereLightness}%)`),
      emissiveIntensity: profile.emissiveIntensity * 0.16,
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
  width: number;
  height: number;
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  metalnessMap: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  emissiveMap: THREE.CanvasTexture;
  displacementField: Float32Array;
  debugMaps: {
    macroHeight: THREE.CanvasTexture;
    regionalHeight: THREE.CanvasTexture;
    detailHeight: THREE.CanvasTexture;
    displacementInfluence: THREE.CanvasTexture;
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

  const macroHeight = createFieldTexture(derivedFields.tectonicHeight, width, height);
  const regionalHeight = createFieldTexture(derivedFields.regionalHeight, width, height);
  const detailHeight = createFieldTexture(derivedFields.detailHeight, width, height);
  const displacementInfluence = createFieldTexture(derivedFields.displacementField, width, height);

  return {
    width,
    height,
    map,
    roughnessMap,
    metalnessMap,
    normalMap,
    emissiveMap,
    displacementField: derivedFields.displacementField,
    debugMaps: {
      macroHeight,
      regionalHeight,
      detailHeight,
      displacementInfluence,
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
  tectonicHeight: Float32Array;
  regionalHeight: Float32Array;
  detailHeight: Float32Array;
  displacementField: Float32Array;
} {
  const width = colorCanvas.width;
  const height = colorCanvas.height;
  const colorCtx = colorCanvas.getContext('2d');
  const roughCtx = roughCanvas.getContext('2d');
  const metalCtx = metalCanvas.getContext('2d');
  const normalCtx = normalCanvas.getContext('2d');
  const emissiveCtx = emissiveCanvas.getContext('2d');
  if (!colorCtx || !roughCtx || !metalCtx || !normalCtx || !emissiveCtx) {
    return {
      tectonicHeight: new Float32Array(width * height),
      regionalHeight: new Float32Array(width * height),
      detailHeight: new Float32Array(width * height),
      displacementField: new Float32Array(width * height),
    };
  }

  const colorData = colorCtx.createImageData(width, height);
  const roughData = roughCtx.createImageData(width, height);
  const metalData = metalCtx.createImageData(width, height);
  const normalData = normalCtx.createImageData(width, height);
  const emissiveData = emissiveCtx.createImageData(width, height);
  const heightField = new Float32Array(width * height);
  const tectonicField = new Float32Array(width * height);
  const regionalField = new Float32Array(width * height);
  const detailField = new Float32Array(width * height);
  const displacementField = new Float32Array(width * height);

  const signature = archetypeSignature(profile.archetype);
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

      const seaLevel = clamp(profile.oceanLevel + signature.seaLevelShift, 0.2, 0.82);
      const massField = clamp(primaryMass * 0.72 + plateMass * 0.28 + signature.coverageBias, 0, 1);
      const landMask = smoothstep(seaLevel - 0.035, seaLevel + 0.035, massField);
      const waterMask = 1 - landMask;
      const shorelineDistance = Math.abs(massField - seaLevel);
      const coastMask = (1 - smoothstep(signature.coastWidth, signature.coastWidth + 0.11, shorelineDistance + (coastlineNoise - 0.5) * 0.05));
      const shelfMask = smoothstep(seaLevel - signature.shelfWidth, seaLevel - 0.01, massField) * waterMask;
      const regionMask = smoothstep(0.43, 0.72, regionNoise + plateMass * 0.14) * landMask;
      let accentMask = smoothstep(0.61, 0.89, accentNoise + regionMask * 0.18) * landMask;
      let fractureMask = smoothstep(0.74, 0.96, fractureNoise + plateMass * 0.2) * signature.fractureStrength;
      const polarMask = smoothstep(0.56, 0.95, Math.abs(ny) + (1 - primaryMass) * 0.18);
      let frostMask = polarMask * signature.frostStrength;

      switch (profile.archetype) {
        case 'oceanic':
          accentMask *= smoothstep(0.24, 0.74, 1 - Math.abs(ny));
          fractureMask *= 0.2;
          break;
        case 'frozen':
          frostMask = clamp(frostMask + smoothstep(0.45, 0.8, 1 - massField) * 0.35 + shelfMask * 0.32, 0, 1);
          fractureMask = clamp(fractureMask * 0.6 + smoothstep(0.82, 0.96, fractureNoise) * 0.34, 0, 1);
          break;
        case 'volcanic':
          fractureMask = clamp(fractureMask + smoothstep(0.7, 0.94, Math.abs(Math.sin((nx * 2.1 + nz * 2.3 + phaseC) * 3.2 + plateMass * 2.8))) * 0.45, 0, 1);
          accentMask *= 0.62;
          break;
        case 'arid':
          accentMask = clamp(accentMask + smoothstep(0.32, 0.8, 1 - regionNoise) * landMask * 0.3, 0, 1);
          fractureMask *= 0.28;
          break;
        case 'mineral':
          accentMask = clamp(accentMask + smoothstep(0.75, 0.96, fractureNoise + primaryMass * 0.2) * 0.48, 0, 1);
          break;
        case 'fractured':
          fractureMask = clamp(fractureMask + smoothstep(0.62, 0.9, Math.abs(Math.sin((nx + nz + phaseC) * 10.6 + plateMass * 2.2))) * 0.56, 0, 1);
          break;
        case 'barren':
        default:
          accentMask *= 0.46;
          fractureMask *= 0.34;
          break;
      }

      const hue = wrapHue(
        profile.baseHue
        + signature.waterHueShift * waterMask
        + signature.landHueShift * landMask
        + (regionMask - 0.5) * signature.regionHueShift
        + (accentMask - 0.25) * signature.accentHueShift
        + (fractureMask - 0.2) * signature.fractureHueShift,
      );
      const sat = clamp(
        profile.oceanSaturation * waterMask
        + profile.landSaturation * landMask
        + (regionMask - 0.5) * signature.regionSatShift
        + accentMask * signature.accentSatBoost
        + fractureMask * signature.fractureSatShift
        - frostMask * 18,
        10,
        86,
      );
      const lightness = clamp(
        profile.oceanLightness * waterMask
        + profile.landLightness * landMask
        + coastMask * signature.coastLightBoost
        + shelfMask * signature.shelfLightBoost
        + (regionMask - 0.5) * signature.regionLightShift
        + accentMask * signature.accentLightShift
        + fractureMask * signature.fractureLightShift
        + frostMask * 18
        - Math.abs(ny) * signature.polarDarkening,
        16,
        90,
      );

      const rgb = hslToRgb(hue / 360, sat / 100, lightness / 100);
      const deepWaterTint = hslToRgb(wrapHue(profile.baseHue + signature.waterHueShift - 12) / 360, clamp((profile.oceanSaturation + 6) / 100, 0, 1), clamp((profile.oceanLightness - 14) / 100, 0, 1));
      const shelfTint = hslToRgb(wrapHue(profile.baseHue + signature.waterHueShift + 8) / 360, clamp((profile.oceanSaturation + 3) / 100, 0, 1), clamp((profile.oceanLightness + 8) / 100, 0, 1));
      const coastTint = hslToRgb(wrapHue(profile.baseHue + signature.landHueShift + 4) / 360, clamp((profile.landSaturation - 8) / 100, 0, 1), clamp((profile.landLightness + 12) / 100, 0, 1));
      const regionTint = hslToRgb(wrapHue(profile.baseHue + signature.landHueShift + signature.regionHueShift * 0.55) / 360, clamp((profile.landSaturation + 4) / 100, 0, 1), clamp((profile.landLightness + 2) / 100, 0, 1));
      const accentTint = hslToRgb(wrapHue(profile.baseHue + signature.landHueShift + signature.accentHueShift) / 360, clamp((profile.landSaturation + 8) / 100, 0, 1), clamp((profile.landLightness - 2) / 100, 0, 1));
      const fractureTint = hslToRgb(wrapHue(profile.baseHue + signature.fractureHueShift) / 360, clamp((profile.landSaturation + 10) / 100, 0, 1), clamp((profile.landLightness - 8) / 100, 0, 1));
      const frostTint = hslToRgb(wrapHue(profile.baseHue - 22) / 360, 0.2, 0.88);

      const layered = blendRgb(
        rgb,
        deepWaterTint,
        waterMask * smoothstep(seaLevel - 0.25, seaLevel + 0.01, seaLevel - massField) * 0.55,
        shelfTint,
        shelfMask * 0.54,
        coastTint,
        coastMask * 0.42,
        regionTint,
        regionMask * 0.34,
        accentTint,
        accentMask * signature.accentColorBlend,
        fractureTint,
        fractureMask * signature.fractureColorBlend,
        frostTint,
        frostMask,
      );
      const finalColor = layered;
      const i = (y * width + x) * 4;
      colorData.data[i] = finalColor[0];
      colorData.data[i + 1] = finalColor[1];
      colorData.data[i + 2] = finalColor[2];
      colorData.data[i + 3] = 255;

      const roughness = clamp(
        profile.roughness
        + waterMask * signature.roughWaterShift
        + landMask * signature.roughLandShift
        + regionMask * 0.05
        + accentMask * signature.roughAccentShift
        + fractureMask * signature.roughFractureShift
        - shelfMask * 0.05
        - frostMask * 0.08
        + (1 - coastlineNoise) * 0.03,
        0.42,
        0.96,
      );
      const roughValue = Math.round(roughness * 255);
      roughData.data[i] = roughValue;
      roughData.data[i + 1] = roughValue;
      roughData.data[i + 2] = roughValue;
      roughData.data[i + 3] = 255;

      const metal = clamp(
        profile.metalness * 0.12
        + signature.metalBase
        + accentMask * signature.metalAccentBoost
        + fractureMask * signature.metalFractureBoost
        - waterMask * 0.06,
        0,
        0.22,
      );
      const metalValue = Math.round(metal * 255);
      metalData.data[i] = metalValue;
      metalData.data[i + 1] = metalValue;
      metalData.data[i + 2] = metalValue;
      metalData.data[i + 3] = 255;

      let tectonicHeight = clamp(primaryMass * 0.72 + plateMass * 0.28 + (landMask - waterMask) * 0.08, 0, 1);
      let regionalHeight = clamp(
        landMask * (regionMask * 0.48 + accentMask * 0.2 + coastMask * 0.14)
        + waterMask * (shelfMask * 0.2 - smoothstep(0.28, 0.7, seaLevel - massField) * 0.18)
        + fractureMask * 0.22,
        0,
        1,
      );
      let detailHeight = clamp(micro * 0.68 + accentMask * 0.12 + fractureMask * 0.2, 0, 1);

      switch (profile.archetype) {
        case 'oceanic':
          tectonicHeight = clamp(tectonicHeight - waterMask * 0.08, 0, 1);
          regionalHeight = clamp(regionalHeight + shelfMask * 0.2 - waterMask * smoothstep(0.32, 0.84, seaLevel - massField) * 0.2, 0, 1);
          break;
        case 'frozen':
          regionalHeight = clamp(regionalHeight + frostMask * 0.26 + shelfMask * 0.12, 0, 1);
          detailHeight = clamp(detailHeight + fractureMask * 0.12, 0, 1);
          break;
        case 'volcanic':
          tectonicHeight = clamp(tectonicHeight + accentMask * 0.14, 0, 1);
          regionalHeight = clamp(regionalHeight + fractureMask * 0.24, 0, 1);
          break;
        case 'arid':
          regionalHeight = clamp(regionalHeight + accentMask * 0.16 - waterMask * 0.12, 0, 1);
          detailHeight = clamp(detailHeight + smoothstep(0.58, 0.9, accentNoise) * 0.14, 0, 1);
          break;
        case 'barren':
          regionalHeight = clamp(regionalHeight + smoothstep(0.64, 0.92, fractureNoise) * 0.18, 0, 1);
          break;
        case 'mineral':
          regionalHeight = clamp(regionalHeight + accentMask * 0.18 + fractureMask * 0.12, 0, 1);
          detailHeight = clamp(detailHeight + accentMask * 0.12, 0, 1);
          break;
        case 'fractured':
          tectonicHeight = clamp(tectonicHeight + fractureMask * 0.1, 0, 1);
          regionalHeight = clamp(regionalHeight + fractureMask * 0.28, 0, 1);
          break;
        default:
          break;
      }

      const displacementInfluence = clamp(tectonicHeight * 0.84 + regionalHeight * 0.16, 0, 1);
      const heightValue = clamp(
        tectonicHeight * 0.62
        + regionalHeight * 0.28
        + detailHeight * 0.1
        + signature.heightBias,
        0.16,
        0.88,
      );
      const fieldIndex = y * width + x;
      tectonicField[fieldIndex] = tectonicHeight;
      regionalField[fieldIndex] = regionalHeight;
      detailField[fieldIndex] = detailHeight;
      displacementField[fieldIndex] = displacementInfluence;
      heightField[fieldIndex] = heightValue;

      const emissiveMask = clamp(fractureMask * signature.emissiveFromFracture + accentMask * signature.emissiveFromAccent + signature.emissiveBase, 0, 0.2);
      const eHue = wrapHue(profile.accentHue + signature.emissiveHueShift);
      const eRgb = hslToRgb(eHue / 360, clamp(0.55 + signature.emissiveSaturationBoost, 0, 1), clamp(0.2 + emissiveMask * 0.7, 0, 1));
      emissiveData.data[i] = Math.round(eRgb[0] * emissiveMask);
      emissiveData.data[i + 1] = Math.round(eRgb[1] * emissiveMask);
      emissiveData.data[i + 2] = Math.round(eRgb[2] * emissiveMask);
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
      const sx = (hR - hL) * 0.62;
      const sy = (hU - hD) * 0.62;
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

  return {
    tectonicHeight: tectonicField,
    regionalHeight: regionalField,
    detailHeight: detailField,
    displacementField,
  };
}

interface ArchetypeSignature {
  coverageBias: number;
  seaLevelShift: number;
  coastWidth: number;
  shelfWidth: number;
  fractureStrength: number;
  frostStrength: number;
  fractureHueShift: number;
  regionHueShift: number;
  accentHueShift: number;
  landHueShift: number;
  waterHueShift: number;
  regionSatShift: number;
  accentSatBoost: number;
  fractureSatShift: number;
  regionLightShift: number;
  accentLightShift: number;
  fractureLightShift: number;
  coastLightBoost: number;
  shelfLightBoost: number;
  polarDarkening: number;
  roughWaterShift: number;
  roughLandShift: number;
  roughAccentShift: number;
  roughFractureShift: number;
  metalBase: number;
  metalAccentBoost: number;
  metalFractureBoost: number;
  accentColorBlend: number;
  fractureColorBlend: number;
  heightBias: number;
  emissiveBase: number;
  emissiveFromFracture: number;
  emissiveFromAccent: number;
  emissiveHueShift: number;
  emissiveSaturationBoost: number;
}

function archetypeSignature(archetype: PlanetVisualProfile['archetype']): ArchetypeSignature {
  switch (archetype) {
    case 'volcanic':
      return { coverageBias: 0.23, seaLevelShift: 0.22, coastWidth: 0.06, shelfWidth: 0.08, fractureStrength: 1, frostStrength: 0.06, fractureHueShift: 18, regionHueShift: 8, accentHueShift: 14, landHueShift: 14, waterHueShift: 8, regionSatShift: -4, accentSatBoost: 8, fractureSatShift: 12, regionLightShift: -8, accentLightShift: -6, fractureLightShift: -10, coastLightBoost: 4, shelfLightBoost: 2, polarDarkening: 6, roughWaterShift: 0.06, roughLandShift: 0.12, roughAccentShift: 0.05, roughFractureShift: 0.1, metalBase: 0.02, metalAccentBoost: 0.03, metalFractureBoost: 0.05, accentColorBlend: 0.34, fractureColorBlend: 0.44, heightBias: 0.03, emissiveBase: 0.01, emissiveFromFracture: 0.18, emissiveFromAccent: 0.04, emissiveHueShift: -8, emissiveSaturationBoost: 0.3 };
    case 'frozen':
      return { coverageBias: -0.08, seaLevelShift: 0.08, coastWidth: 0.05, shelfWidth: 0.14, fractureStrength: 0.72, frostStrength: 0.84, fractureHueShift: -8, regionHueShift: -10, accentHueShift: -6, landHueShift: -22, waterHueShift: -14, regionSatShift: -14, accentSatBoost: -8, fractureSatShift: -10, regionLightShift: 8, accentLightShift: 6, fractureLightShift: 2, coastLightBoost: 5, shelfLightBoost: 8, polarDarkening: -10, roughWaterShift: -0.14, roughLandShift: -0.08, roughAccentShift: -0.04, roughFractureShift: 0.03, metalBase: 0.01, metalAccentBoost: 0.01, metalFractureBoost: 0.02, accentColorBlend: 0.3, fractureColorBlend: 0.22, heightBias: -0.02, emissiveBase: 0, emissiveFromFracture: 0.02, emissiveFromAccent: 0, emissiveHueShift: -20, emissiveSaturationBoost: 0.04 };
    case 'arid':
      return { coverageBias: 0.12, seaLevelShift: 0.16, coastWidth: 0.07, shelfWidth: 0.09, fractureStrength: 0.45, frostStrength: 0.04, fractureHueShift: 8, regionHueShift: 10, accentHueShift: 16, landHueShift: 10, waterHueShift: 2, regionSatShift: -6, accentSatBoost: 4, fractureSatShift: 5, regionLightShift: 5, accentLightShift: 3, fractureLightShift: -3, coastLightBoost: 4, shelfLightBoost: 2, polarDarkening: 6, roughWaterShift: 0.02, roughLandShift: 0.14, roughAccentShift: 0.06, roughFractureShift: 0.04, metalBase: 0, metalAccentBoost: 0.01, metalFractureBoost: 0.02, accentColorBlend: 0.36, fractureColorBlend: 0.18, heightBias: 0.025, emissiveBase: 0, emissiveFromFracture: 0.01, emissiveFromAccent: 0, emissiveHueShift: 8, emissiveSaturationBoost: 0.02 };
    case 'mineral':
      return { coverageBias: 0.06, seaLevelShift: 0.1, coastWidth: 0.06, shelfWidth: 0.08, fractureStrength: 0.78, frostStrength: 0.14, fractureHueShift: 16, regionHueShift: 8, accentHueShift: 22, landHueShift: 8, waterHueShift: 4, regionSatShift: 5, accentSatBoost: 14, fractureSatShift: 8, regionLightShift: -2, accentLightShift: 2, fractureLightShift: -5, coastLightBoost: 2, shelfLightBoost: 1, polarDarkening: 8, roughWaterShift: 0.04, roughLandShift: 0, roughAccentShift: -0.06, roughFractureShift: -0.04, metalBase: 0.1, metalAccentBoost: 0.08, metalFractureBoost: 0.06, accentColorBlend: 0.4, fractureColorBlend: 0.3, heightBias: 0.02, emissiveBase: 0, emissiveFromFracture: 0.04, emissiveFromAccent: 0.02, emissiveHueShift: 18, emissiveSaturationBoost: 0.1 };
    case 'oceanic':
      return { coverageBias: -0.2, seaLevelShift: -0.08, coastWidth: 0.04, shelfWidth: 0.16, fractureStrength: 0.3, frostStrength: 0.2, fractureHueShift: -6, regionHueShift: -10, accentHueShift: -20, landHueShift: -8, waterHueShift: -26, regionSatShift: 8, accentSatBoost: 6, fractureSatShift: -4, regionLightShift: 7, accentLightShift: 2, fractureLightShift: -2, coastLightBoost: 8, shelfLightBoost: 10, polarDarkening: -6, roughWaterShift: -0.22, roughLandShift: -0.06, roughAccentShift: 0.02, roughFractureShift: 0.02, metalBase: -0.02, metalAccentBoost: 0.01, metalFractureBoost: 0.01, accentColorBlend: 0.3, fractureColorBlend: 0.12, heightBias: -0.025, emissiveBase: 0, emissiveFromFracture: 0, emissiveFromAccent: 0, emissiveHueShift: -26, emissiveSaturationBoost: 0.03 };
    case 'fractured':
      return { coverageBias: 0.2, seaLevelShift: 0.22, coastWidth: 0.08, shelfWidth: 0.07, fractureStrength: 1, frostStrength: 0.06, fractureHueShift: 22, regionHueShift: 14, accentHueShift: 12, landHueShift: 14, waterHueShift: 4, regionSatShift: 4, accentSatBoost: 10, fractureSatShift: 10, regionLightShift: -6, accentLightShift: -2, fractureLightShift: -10, coastLightBoost: 3, shelfLightBoost: 1, polarDarkening: 10, roughWaterShift: 0.08, roughLandShift: 0.12, roughAccentShift: 0.08, roughFractureShift: 0.12, metalBase: 0.02, metalAccentBoost: 0.03, metalFractureBoost: 0.08, accentColorBlend: 0.34, fractureColorBlend: 0.44, heightBias: 0.03, emissiveBase: 0.005, emissiveFromFracture: 0.1, emissiveFromAccent: 0.03, emissiveHueShift: 22, emissiveSaturationBoost: 0.14 };
    case 'barren':
    default:
      return { coverageBias: 0.11, seaLevelShift: 0.18, coastWidth: 0.08, shelfWidth: 0.08, fractureStrength: 0.48, frostStrength: 0.12, fractureHueShift: 4, regionHueShift: 4, accentHueShift: 6, landHueShift: 4, waterHueShift: 0, regionSatShift: -6, accentSatBoost: -2, fractureSatShift: 2, regionLightShift: -4, accentLightShift: -2, fractureLightShift: -4, coastLightBoost: 3, shelfLightBoost: 2, polarDarkening: 9, roughWaterShift: 0.05, roughLandShift: 0.09, roughAccentShift: 0.04, roughFractureShift: 0.06, metalBase: 0.01, metalAccentBoost: 0.01, metalFractureBoost: 0.02, accentColorBlend: 0.22, fractureColorBlend: 0.2, heightBias: 0.02, emissiveBase: 0, emissiveFromFracture: 0, emissiveFromAccent: 0, emissiveHueShift: 0, emissiveSaturationBoost: 0 };
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

function applyPlanetReliefToGeometry(
  geometry: THREE.SphereGeometry,
  displacementField: Float32Array,
  width: number,
  height: number,
  profile: PlanetVisualProfile,
  seed: number,
) {
  const positions = geometry.attributes.position;
  const vertex = new THREE.Vector3();
  const rng = new SeededRng(seed ^ 0xa24baed4);
  const displacementScale = clamp(profile.reliefStrength * 0.16 + rng.range(0.006, 0.014), 0.014, 0.038);
  for (let i = 0; i < positions.count; i += 1) {
    vertex.set(positions.getX(i), positions.getY(i), positions.getZ(i));
    const normal = vertex.clone().normalize();
    const u = 0.5 + Math.atan2(normal.z, normal.x) / (Math.PI * 2);
    const v = 0.5 - Math.asin(clamp(normal.y, -1, 1)) / Math.PI;
    const displacement = sampleFieldBilinear(displacementField, width, height, u, v);
    const radius = 1 + (displacement - 0.5) * displacementScale;
    positions.setXYZ(i, normal.x * radius, normal.y * radius, normal.z * radius);
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
}

function sampleFieldBilinear(field: Float32Array, width: number, height: number, u: number, v: number) {
  const x = ((u % 1) + 1) % 1 * (width - 1);
  const y = clamp(v, 0, 1) * (height - 1);
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = (x0 + 1) % width;
  const y1 = Math.min(y0 + 1, height - 1);
  const tx = x - x0;
  const ty = y - y0;
  const i00 = field[y0 * width + x0];
  const i10 = field[y0 * width + x1];
  const i01 = field[y1 * width + x0];
  const i11 = field[y1 * width + x1];
  return lerp(lerp(i00, i10, tx), lerp(i01, i11, tx), ty);
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

function blendRgb(base: [number, number, number], ...layers: Array<[number, number, number] | number>): [number, number, number] {
  let outR = base[0];
  let outG = base[1];
  let outB = base[2];
  for (let i = 0; i < layers.length; i += 2) {
    const color = layers[i] as [number, number, number];
    const alpha = clamp(layers[i + 1] as number, 0, 1);
    outR = Math.round(lerp(outR, color[0], alpha));
    outG = Math.round(lerp(outG, color[1], alpha));
    outB = Math.round(lerp(outB, color[2], alpha));
  }
  return [outR, outG, outB];
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
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
