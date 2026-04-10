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

  private rimLight: THREE.PointLight | null = null;

  private fillLight: THREE.DirectionalLight | null = null;

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
    renderer.domElement.className = 'render-surface render-surface--planet';

    this.renderer = renderer;
    this.context.host.appendChild(renderer.domElement);

    this.scene.background = new THREE.Color(0x040811);
    this.scene.add(this.root);

    const ambient = new THREE.AmbientLight(0x9ed4ff, 0.22);
    this.scene.add(ambient);

    const key = new THREE.DirectionalLight(0xddefff, 1.22);
    key.position.set(2.4, 1.9, 1.3);
    this.scene.add(key);

    this.fillLight = new THREE.DirectionalLight(0x7ab6f2, 0.38);
    this.fillLight.position.set(-2.2, -0.7, -1.8);
    this.scene.add(this.fillLight);

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

    const profile = planetProfileFromSeed(planetRef.seed);
    const rng = new SeededRng(planetRef.seed ^ 0x45d9f3b);
    const seedPhaseA = rng.range(0.2, Math.PI * 2.2);
    const seedPhaseB = rng.range(0.2, Math.PI * 1.7);
    const seedPhaseC = rng.range(0.2, Math.PI * 2.8);
    const seedPhaseD = rng.range(0.2, Math.PI * 1.3);

    const geometry = new THREE.IcosahedronGeometry(1, 5);
    const position = geometry.attributes.position;
    const colors: number[] = [];

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

      const oceanMask = macroMask < profile.oceanLevel;
      const humidity = normalizedNoise(vx, vz, vy, profile.continentScale * 1.35, seedPhaseB, seedPhaseC) * profile.humidityStrength;
      const secondaryPattern = normalizedNoise(vx + vy, vy - vz, vz + vx, profile.ridgeScale * 0.72, seedPhaseC, seedPhaseA);
      const climateShift = (humidity - 0.5) * profile.hueDrift + latitude * -8;
      const hue = oceanMask
        ? wrapHue(profile.baseHue + 190 + climateShift * 0.2 + secondaryPattern * 6 + rng.range(-3, 4))
        : wrapHue(profile.baseHue + climateShift + secondaryPattern * 10 + rng.range(-4, 5));
      const sat = oceanMask
        ? profile.oceanSaturation + humidity * 8 + secondaryPattern * 4
        : profile.landSaturation + humidity * 6 + secondaryPattern * 7;
      const light = oceanMask
        ? profile.oceanLightness + ridgeMask * 8 + latitude * 5 + secondaryPattern * 5
        : profile.landLightness + elevation * 120 + humidity * 6 + secondaryPattern * 10 - polarMask * 7;
      const color = new THREE.Color(`hsl(${Math.round(hue)}, ${Math.round(sat)}%, ${Math.round(light)}%)`);

      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: profile.roughness,
      metalness: profile.metalness,
      flatShading: false,
      emissive: new THREE.Color(`hsl(${profile.accentHue}, 45%, ${profile.atmosphereLightness}%)`),
      emissiveIntensity: profile.emissiveIntensity,
    });

    this.planet = new THREE.Mesh(geometry, material);
    this.root.add(this.planet);

    this.rimLight?.removeFromParent();
    this.rimLight = new THREE.PointLight(new THREE.Color(`hsl(${profile.accentHue}, 72%, ${profile.atmosphereLightness}%)`), profile.lightIntensity, 14, 2);
    this.rimLight.position.set(-1.8, -1.2, 2.1);
    this.scene.add(this.rimLight);

    if (this.fillLight) {
      this.fillLight.color = new THREE.Color(`hsl(${profile.accentHue}, 52%, 62%)`);
      this.fillLight.intensity = 0.3 + profile.lightIntensity * 0.11;
    }

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

    this.planet.quaternion.premultiply(this.dragYaw);
    this.planet.quaternion.premultiply(this.dragPitch);
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
