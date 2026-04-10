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
    const geometry = new THREE.SphereGeometry(1, 196, 128);
    geometry.computeVertexNormals();

    const maps = buildPlanetMaps(profile, planetRef.seed);
    this.generatedTextures = [maps.map, maps.roughnessMap, maps.metalnessMap, maps.normalMap, maps.emissiveMap];

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
  normalMap: THREE.CanvasTexture;
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
  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = width;
  normalCanvas.height = height;
  const emissiveCanvas = document.createElement('canvas');
  emissiveCanvas.width = width;
  emissiveCanvas.height = height;

  paintPlanetTextures(profile, seed, colorCanvas, roughCanvas, metalCanvas, normalCanvas, emissiveCanvas);

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

  return { map, roughnessMap, metalnessMap, normalMap, emissiveMap };
}

function paintPlanetTextures(
  profile: PlanetVisualProfile,
  seed: number,
  colorCanvas: HTMLCanvasElement,
  roughCanvas: HTMLCanvasElement,
  metalCanvas: HTMLCanvasElement,
  normalCanvas: HTMLCanvasElement,
  emissiveCanvas: HTMLCanvasElement,
) {
  const width = colorCanvas.width;
  const height = colorCanvas.height;
  const colorCtx = colorCanvas.getContext('2d');
  const roughCtx = roughCanvas.getContext('2d');
  const metalCtx = metalCanvas.getContext('2d');
  const normalCtx = normalCanvas.getContext('2d');
  const emissiveCtx = emissiveCanvas.getContext('2d');
  if (!colorCtx || !roughCtx || !metalCtx || !normalCtx || !emissiveCtx) return;

  const colorData = colorCtx.createImageData(width, height);
  const roughData = roughCtx.createImageData(width, height);
  const metalData = metalCtx.createImageData(width, height);
  const normalData = normalCtx.createImageData(width, height);
  const emissiveData = emissiveCtx.createImageData(width, height);
  const heightField = new Float32Array(width * height);

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

      const macro = fbm3(nx * profile.continentScale * 0.78, ny * profile.continentScale * 0.78, nz * profile.continentScale * 0.78, seed + 17, 4);
      const medium = fbm3(nx * profile.ridgeScale * 0.09, ny * profile.ridgeScale * 0.09, nz * profile.ridgeScale * 0.09, seed + 313, 3);
      const micro = fbm3(nx * 12.2, ny * 12.2, nz * 12.2, seed + 997, 2);

      const bands = Math.sin((ny + phaseA) * signature.bandFrequency + medium * 1.15 + phaseB) * 0.5 + 0.5;
      const plateNoise = fbm3(nx * 1.35 + phaseA, ny * 1.35, nz * 1.35 + phaseC, seed + 1229, 3);
      const regionNoise = fbm3(nx * 2.35 + phaseA, ny * 2.35, nz * 2.35 + phaseC, seed + 7919, 3);
      const regionMaskA = smoothstep(0.3, 0.65, regionNoise);
      const regionMaskB = smoothstep(0.52, 0.88, macro + medium * 0.2);
      const continentalField = clamp(macro * 0.66 + medium * 0.2 + bands * 0.06 + plateNoise * 0.08 + signature.coverageBias, 0, 1);
      const waterMask = smoothstep(profile.oceanLevel - 0.05, profile.oceanLevel + 0.06, continentalField);
      const landMask = 1 - waterMask;
      const coastalMask = 1 - Math.abs(waterMask - 0.5) * 2;
      const continentCore = smoothstep(profile.oceanLevel + 0.06, profile.oceanLevel + 0.2, continentalField) * landMask;
      const basinMask = smoothstep(0.08, 0.38, 1 - continentalField) * waterMask;
      const shelfMask = smoothstep(0.25, 0.55, continentalField) * waterMask;
      const frostMask = smoothstep(0.36, 0.85, Math.abs(ny) + (1 - medium) * 0.18);
      const equatorialMask = 1 - smoothstep(0.22, 0.7, Math.abs(ny));
      const lushMask = continentCore * smoothstep(0.42, 0.78, regionNoise) * equatorialMask;
      const aridMask = continentCore * smoothstep(0.38, 0.76, 1 - regionNoise) * smoothstep(0.18, 0.62, Math.abs(ny));
      const fracturedBelt = smoothstep(0.68, 0.93, Math.abs(Math.sin((nx * 2.1 + nz * 2.3 + phaseC) * 3.2 + medium * 2.4)));
      const fracture = Math.abs(Math.sin((nx + nz + phaseC) * signature.fractureFrequency + medium * 1.8));

      const hue = wrapHue(
        profile.baseHue
        + signature.waterHueShift * waterMask
        + signature.landHueShift * landMask
        + (regionMaskA - 0.5) * signature.regionHueShiftA
        + (regionMaskB - 0.5) * signature.regionHueShiftB
        + (bands - 0.5) * signature.hueVariance
        + (fracture - 0.5) * signature.fractureHueShift * 0.42,
      );
      const sat = clamp(
        profile.oceanSaturation * waterMask
        + profile.landSaturation * landMask
        + (regionMaskA - 0.5) * signature.regionSatShiftA
        + (regionMaskB - 0.5) * signature.regionSatShiftB
        + (medium - 0.5) * 8
        + signature.saturationOffset,
        14,
        84,
      );
      const lightness = clamp(
        profile.oceanLightness * waterMask
        + profile.landLightness * landMask
        + (regionMaskA - 0.5) * signature.regionLightShiftA
        + (regionMaskB - 0.5) * signature.regionLightShiftB
        + (macro - 0.5) * signature.macroLightness
        + coastalMask * signature.coastLift
        - Math.abs(ny) * signature.polarDarkening,
        18,
        86,
      );

      const rgb = hslToRgb(hue / 360, sat / 100, lightness / 100);
      const deepWaterTint = hslToRgb(wrapHue(profile.baseHue + signature.waterHueShift - 14) / 360, clamp((profile.oceanSaturation + 8) / 100, 0, 1), clamp((profile.oceanLightness - 14) / 100, 0, 1));
      const shelfTint = hslToRgb(wrapHue(profile.baseHue + signature.waterHueShift + 5) / 360, clamp((profile.oceanSaturation + 4) / 100, 0, 1), clamp((profile.oceanLightness + 10) / 100, 0, 1));
      const coastTint = hslToRgb(wrapHue(profile.baseHue + signature.landHueShift + 2) / 360, clamp((profile.landSaturation - 10) / 100, 0, 1), clamp((profile.landLightness + 12) / 100, 0, 1));
      const lushTint = hslToRgb(wrapHue(profile.baseHue + signature.landHueShift - 24) / 360, clamp((profile.landSaturation + 8) / 100, 0, 1), clamp((profile.landLightness - 4) / 100, 0, 1));
      const dryTint = hslToRgb(wrapHue(profile.baseHue + signature.landHueShift + 14) / 360, clamp((profile.landSaturation - 6) / 100, 0, 1), clamp((profile.landLightness + 3) / 100, 0, 1));
      const frostTint = hslToRgb(wrapHue(profile.baseHue - 18) / 360, 0.2, 0.86);

      const layered = blendRgb(
        rgb,
        deepWaterTint,
        basinMask * 0.55,
        shelfTint,
        shelfMask * 0.52,
        coastTint,
        coastalMask * 0.38,
        lushTint,
        lushMask * 0.36,
        dryTint,
        aridMask * 0.33,
        frostTint,
        frostMask * signature.frostStrength,
      );

      const archetypeAccent = archetypeSurfaceAccent(profile.archetype, seed, nx, ny, nz, macro, medium, fracture, fracturedBelt);
      const finalColor = blendRgb(
        layered,
        archetypeAccent.color,
        archetypeAccent.mask * archetypeAccent.strength,
      );
      const i = (y * width + x) * 4;
      colorData.data[i] = finalColor[0];
      colorData.data[i + 1] = finalColor[1];
      colorData.data[i + 2] = finalColor[2];
      colorData.data[i + 3] = 255;

      const roughness = clamp(
        profile.roughness
        + signature.waterSmoothness * waterMask
        + signature.landRoughBoost * landMask
        + (1 - medium) * 0.05
        + regionMaskB * 0.03
        - shelfMask * 0.03
        + aridMask * 0.05
        + fracturedBelt * 0.04,
        0.38,
        0.97,
      );
      const roughValue = Math.round(roughness * 255);
      roughData.data[i] = roughValue;
      roughData.data[i + 1] = roughValue;
      roughData.data[i + 2] = roughValue;
      roughData.data[i + 3] = 255;

      const metal = clamp(profile.metalness * 0.18 + signature.metalBias + (fracture > 0.92 ? signature.metalVeinBoost : 0) + archetypeAccent.metalBoost, 0, 0.24);
      const metalValue = Math.round(metal * 255);
      metalData.data[i] = metalValue;
      metalData.data[i + 1] = metalValue;
      metalData.data[i + 2] = metalValue;
      metalData.data[i + 3] = 255;

      const heightValue = clamp(
        landMask * (0.46 + macro * 0.26 + medium * 0.2 + regionMaskA * 0.05)
        + waterMask * (0.34 + macro * 0.07 + medium * 0.04)
        + micro * 0.03
        + coastalMask * 0.03
        + fracturedBelt * 0.025
        + signature.bumpBias
        - waterMask * signature.oceanBasinFlatten,
        0.15,
        0.88,
      );
      heightField[y * width + x] = heightValue;

      const emissiveMask = clamp(signature.emissiveBase + (fracture > signature.emissiveThreshold ? (fracture - signature.emissiveThreshold) * signature.emissiveGain : 0) + archetypeAccent.emissiveBoost, 0, 0.22);
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
      const sx = (hR - hL) * 0.95;
      const sy = (hU - hD) * 0.95;
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
}

interface ArchetypeSignature {
  coverageBias: number;
  bandFrequency: number;
  fractureFrequency: number;
  hueVariance: number;
  fractureHueShift: number;
  regionHueShiftA: number;
  regionHueShiftB: number;
  landHueShift: number;
  waterHueShift: number;
  saturationOffset: number;
  regionSatShiftA: number;
  regionSatShiftB: number;
  macroLightness: number;
  regionLightShiftA: number;
  regionLightShiftB: number;
  coastLift: number;
  frostStrength: number;
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
      return { coverageBias: 0.26, bandFrequency: 5.8, fractureFrequency: 12.8, hueVariance: 14, fractureHueShift: 14, regionHueShiftA: 12, regionHueShiftB: 8, landHueShift: 12, waterHueShift: 5, saturationOffset: 10, regionSatShiftA: 8, regionSatShiftB: -4, macroLightness: 14, regionLightShiftA: -6, regionLightShiftB: 8, coastLift: 3, frostStrength: 0.12, polarDarkening: 4, waterSmoothness: -0.06, landRoughBoost: 0.1, metalBias: 0.03, metalVeinBoost: 0.08, bumpBias: 0.12, oceanBasinFlatten: 0.02, emissiveBase: 0.03, emissiveThreshold: 0.86, emissiveGain: 1.05, emissiveHueShift: -10, emissiveSaturationBoost: 0.28 };
    case 'frozen':
      return { coverageBias: -0.1, bandFrequency: 10.8, fractureFrequency: 8.8, hueVariance: 9, fractureHueShift: -6, regionHueShiftA: -10, regionHueShiftB: 6, landHueShift: -24, waterHueShift: -10, saturationOffset: -12, regionSatShiftA: -10, regionSatShiftB: 4, macroLightness: 18, regionLightShiftA: 9, regionLightShiftB: -4, coastLift: 4, frostStrength: 0.72, polarDarkening: -12, waterSmoothness: -0.22, landRoughBoost: -0.12, metalBias: 0.01, metalVeinBoost: 0.03, bumpBias: -0.06, oceanBasinFlatten: 0.12, emissiveBase: 0.0, emissiveThreshold: 0.95, emissiveGain: 0.18, emissiveHueShift: -22, emissiveSaturationBoost: 0.03 };
    case 'arid':
      return { coverageBias: 0.14, bandFrequency: 3.6, fractureFrequency: 6.6, hueVariance: 8, fractureHueShift: 4, regionHueShiftA: 8, regionHueShiftB: -4, landHueShift: 10, waterHueShift: 0, saturationOffset: -6, regionSatShiftA: -4, regionSatShiftB: 6, macroLightness: 12, regionLightShiftA: 5, regionLightShiftB: -5, coastLift: 4, frostStrength: 0.08, polarDarkening: 5, waterSmoothness: -0.05, landRoughBoost: 0.13, metalBias: -0.02, metalVeinBoost: 0.03, bumpBias: 0.09, oceanBasinFlatten: 0.15, emissiveBase: 0.0, emissiveThreshold: 0.97, emissiveGain: 0.12, emissiveHueShift: 6, emissiveSaturationBoost: 0.03 };
    case 'mineral':
      return { coverageBias: 0.08, bandFrequency: 6.2, fractureFrequency: 10.8, hueVariance: 10, fractureHueShift: 10, regionHueShiftA: 10, regionHueShiftB: 8, landHueShift: 6, waterHueShift: 0, saturationOffset: -14, regionSatShiftA: -8, regionSatShiftB: 10, macroLightness: 11, regionLightShiftA: -4, regionLightShiftB: 5, coastLift: 2, frostStrength: 0.2, polarDarkening: 6, waterSmoothness: -0.04, landRoughBoost: -0.02, metalBias: 0.22, metalVeinBoost: 0.16, bumpBias: 0.05, oceanBasinFlatten: 0.06, emissiveBase: 0.0, emissiveThreshold: 0.9, emissiveGain: 0.24, emissiveHueShift: 18, emissiveSaturationBoost: 0.08 };
    case 'oceanic':
      return { coverageBias: -0.2, bandFrequency: 4.6, fractureFrequency: 7.2, hueVariance: 12, fractureHueShift: -10, regionHueShiftA: -12, regionHueShiftB: 4, landHueShift: -6, waterHueShift: -28, saturationOffset: 8, regionSatShiftA: 8, regionSatShiftB: -5, macroLightness: 14, regionLightShiftA: 8, regionLightShiftB: -3, coastLift: 6, frostStrength: 0.22, polarDarkening: -7, waterSmoothness: -0.26, landRoughBoost: -0.06, metalBias: -0.04, metalVeinBoost: 0.01, bumpBias: -0.05, oceanBasinFlatten: 0.2, emissiveBase: 0.0, emissiveThreshold: 0.97, emissiveGain: 0.1, emissiveHueShift: -28, emissiveSaturationBoost: 0.04 };
    case 'fractured':
      return { coverageBias: 0.2, bandFrequency: 8.8, fractureFrequency: 14.6, hueVariance: 18, fractureHueShift: 18, regionHueShiftA: 16, regionHueShiftB: -10, landHueShift: 16, waterHueShift: 6, saturationOffset: 0, regionSatShiftA: 10, regionSatShiftB: -8, macroLightness: 9, regionLightShiftA: -8, regionLightShiftB: 6, coastLift: 2, frostStrength: 0.1, polarDarkening: 8, waterSmoothness: -0.06, landRoughBoost: 0.12, metalBias: 0.03, metalVeinBoost: 0.12, bumpBias: 0.14, oceanBasinFlatten: 0.03, emissiveBase: 0.01, emissiveThreshold: 0.82, emissiveGain: 0.62, emissiveHueShift: 20, emissiveSaturationBoost: 0.12 };
    case 'barren':
    default:
      return { coverageBias: 0.12, bandFrequency: 3.2, fractureFrequency: 5.6, hueVariance: 4, fractureHueShift: 0, regionHueShiftA: 4, regionHueShiftB: -2, landHueShift: 2, waterHueShift: 0, saturationOffset: -18, regionSatShiftA: -6, regionSatShiftB: 2, macroLightness: 8, regionLightShiftA: -3, regionLightShiftB: 3, coastLift: 2, frostStrength: 0.14, polarDarkening: 8, waterSmoothness: -0.02, landRoughBoost: 0.08, metalBias: 0.0, metalVeinBoost: 0.01, bumpBias: 0.05, oceanBasinFlatten: 0.06, emissiveBase: 0.0, emissiveThreshold: 0.98, emissiveGain: 0.08, emissiveHueShift: 0, emissiveSaturationBoost: 0.0 };
  }
}

interface ArchetypeAccent {
  color: [number, number, number];
  mask: number;
  strength: number;
  metalBoost: number;
  emissiveBoost: number;
}

function archetypeSurfaceAccent(
  archetype: PlanetVisualProfile['archetype'],
  seed: number,
  nx: number,
  ny: number,
  nz: number,
  macro: number,
  medium: number,
  fracture: number,
  fracturedBelt: number,
): ArchetypeAccent {
  const accentNoise = fbm3(nx * 4.2, ny * 4.2, nz * 4.2, seed ^ 0x6d2b79f5, 3);
  switch (archetype) {
    case 'oceanic':
      return { color: [108, 160, 120], mask: smoothstep(0.54, 0.86, accentNoise) * smoothstep(0.34, 0.76, 1 - Math.abs(ny)), strength: 0.26, metalBoost: 0, emissiveBoost: 0 };
    case 'frozen':
      return { color: [205, 226, 244], mask: smoothstep(0.34, 0.88, Math.abs(ny) + (1 - medium) * 0.28), strength: 0.44, metalBoost: 0.005, emissiveBoost: 0 };
    case 'volcanic':
      return { color: [156, 62, 42], mask: smoothstep(0.78, 0.96, fracture) * (0.5 + fracturedBelt * 0.5), strength: 0.38, metalBoost: 0.02, emissiveBoost: 0.04 };
    case 'arid':
      return { color: [201, 157, 106], mask: smoothstep(0.42, 0.84, accentNoise) * smoothstep(0.16, 0.74, Math.abs(ny)), strength: 0.3, metalBoost: 0, emissiveBoost: 0 };
    case 'mineral':
      return { color: [136, 152, 196], mask: smoothstep(0.74, 0.95, fracture + macro * 0.2), strength: 0.34, metalBoost: 0.05, emissiveBoost: 0.02 };
    case 'fractured':
      return { color: [168, 96, 84], mask: smoothstep(0.62, 0.94, fracturedBelt + fracture * 0.2), strength: 0.45, metalBoost: 0.03, emissiveBoost: 0.06 };
    case 'barren':
    default:
      return { color: [148, 129, 109], mask: smoothstep(0.58, 0.9, accentNoise + (1 - medium) * 0.2), strength: 0.22, metalBoost: 0.01, emissiveBoost: 0 };
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
