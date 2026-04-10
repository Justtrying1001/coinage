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

  private atmosphere: THREE.Mesh | null = null;

  private rimLight: THREE.PointLight | null = null;

  private keyLight: THREE.DirectionalLight | null = null;

  private fillLight: THREE.DirectionalLight | null = null;

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
    renderer.toneMappingExposure = 1.06;
    renderer.domElement.className = 'render-surface render-surface--planet';

    this.renderer = renderer;
    this.context.host.appendChild(renderer.domElement);

    this.scene.background = new THREE.Color(0x040811);
    this.scene.add(this.root);

    const ambient = new THREE.AmbientLight(0x9ed4ff, 0.22);
    this.scene.add(ambient);

    this.keyLight = new THREE.DirectionalLight(0xddefff, 1.22);
    this.keyLight.position.set(2.4, 1.9, 1.3);
    this.scene.add(this.keyLight);

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

    if (this.atmosphere) {
      this.atmosphere.geometry.dispose();
      const material = this.atmosphere.material;
      if (material instanceof THREE.Material) material.dispose();
      this.root.remove(this.atmosphere);
      this.atmosphere = null;
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

    if (this.atmosphere) {
      this.atmosphere.geometry.dispose();
      const material = this.atmosphere.material;
      if (material instanceof THREE.Material) material.dispose();
      this.root.remove(this.atmosphere);
      this.atmosphere = null;
    }

    for (const texture of this.generatedTextures) texture.dispose();
    this.generatedTextures = [];

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

    const maps = buildPlanetMaps(profile, planetRef.seed);
    this.generatedTextures = [maps.map, maps.roughnessMap, maps.metalnessMap, maps.bumpMap, maps.emissiveMap];

    const material = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      map: maps.map,
      roughnessMap: maps.roughnessMap,
      metalnessMap: maps.metalnessMap,
      bumpMap: maps.bumpMap,
      bumpScale: profile.reliefStrength * 0.22,
      emissiveMap: maps.emissiveMap,
      roughness: profile.roughness,
      metalness: profile.metalness,
      flatShading: false,
      emissive: new THREE.Color(`hsl(${profile.accentHue}, 45%, ${profile.atmosphereLightness}%)`),
      emissiveIntensity: profile.emissiveIntensity,
      clearcoat: profile.archetype === 'frozen' || profile.archetype === 'mineral' ? 0.28 : 0.08,
      clearcoatRoughness: profile.archetype === 'frozen' ? 0.2 : 0.45,
    });

    this.planet = new THREE.Mesh(geometry, material);
    this.root.add(this.planet);

    this.rimLight?.removeFromParent();
    this.rimLight = new THREE.PointLight(new THREE.Color(`hsl(${profile.accentHue}, 72%, ${profile.atmosphereLightness}%)`), profile.lightIntensity, 14, 2);
    this.rimLight.position.set(-1.8, -1.2, 2.1);
    this.scene.add(this.rimLight);

    this.applyArchetypeLighting(profile);
    this.buildAtmosphere(profile);

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

  private applyArchetypeLighting(profile: PlanetVisualProfile) {
    const style = lightingByArchetype(profile.archetype);
    if (this.keyLight) {
      this.keyLight.color = new THREE.Color(style.keyColor);
      this.keyLight.intensity = style.keyIntensity + profile.lightIntensity * 0.12;
      this.keyLight.position.set(style.keyPosition[0], style.keyPosition[1], style.keyPosition[2]);
    }
    if (this.fillLight) {
      this.fillLight.color = new THREE.Color(style.fillColor);
      this.fillLight.intensity = style.fillIntensity;
      this.fillLight.position.set(style.fillPosition[0], style.fillPosition[1], style.fillPosition[2]);
    }
    if (this.rimLight) {
      this.rimLight.color = new THREE.Color(style.rimColor);
      this.rimLight.intensity = style.rimIntensity + profile.lightIntensity * 0.22;
      this.rimLight.position.set(style.rimPosition[0], style.rimPosition[1], style.rimPosition[2]);
    }
    if (this.renderer) {
      this.renderer.toneMappingExposure = style.exposure;
    }
  }

  private buildAtmosphere(profile: PlanetVisualProfile) {
    const intensity = atmosphereStrength(profile.archetype);
    if (intensity <= 0) return;

    const atmosphereMaterial = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
      uniforms: {
        glowColor: { value: new THREE.Color(`hsl(${profile.accentHue}, 68%, ${profile.atmosphereLightness}%)`) },
        glowStrength: { value: intensity },
        glowFalloff: { value: profile.archetype === 'frozen' ? 2.7 : 2.2 },
      },
      vertexShader: `
        varying vec3 vNormalW;
        varying vec3 vViewDirW;

        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vNormalW = normalize(mat3(modelMatrix) * normal);
          vViewDirW = normalize(cameraPosition - worldPos.xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        uniform float glowStrength;
        uniform float glowFalloff;
        varying vec3 vNormalW;
        varying vec3 vViewDirW;

        void main() {
          float fresnel = pow(1.0 - max(dot(normalize(vNormalW), normalize(vViewDirW)), 0.0), glowFalloff);
          gl_FragColor = vec4(glowColor * fresnel * glowStrength, fresnel * glowStrength);
        }
      `,
    });

    this.atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.04, 48, 48), atmosphereMaterial);
    this.root.add(this.atmosphere);
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

interface ArchetypeLightingProfile {
  keyColor: string;
  fillColor: string;
  rimColor: string;
  keyIntensity: number;
  fillIntensity: number;
  rimIntensity: number;
  keyPosition: [number, number, number];
  fillPosition: [number, number, number];
  rimPosition: [number, number, number];
  exposure: number;
}

function lightingByArchetype(archetype: PlanetVisualProfile['archetype']): ArchetypeLightingProfile {
  switch (archetype) {
    case 'volcanic':
      return {
        keyColor: '#ffd9b3',
        fillColor: '#864737',
        rimColor: '#ff7c42',
        keyIntensity: 1.38,
        fillIntensity: 0.24,
        rimIntensity: 1.52,
        keyPosition: [2.8, 1.5, 1.2],
        fillPosition: [-1.6, -1.2, -1.8],
        rimPosition: [-1.9, -1.0, 2.3],
        exposure: 1.1,
      };
    case 'frozen':
      return {
        keyColor: '#d7ebff',
        fillColor: '#7db7f7',
        rimColor: '#b6f1ff',
        keyIntensity: 1.24,
        fillIntensity: 0.34,
        rimIntensity: 1.2,
        keyPosition: [2.2, 2.1, 1.1],
        fillPosition: [-2.3, -0.7, -1.9],
        rimPosition: [-1.7, -1.0, 2.0],
        exposure: 1.05,
      };
    case 'mineral':
      return {
        keyColor: '#ffe5c8',
        fillColor: '#9ba8ba',
        rimColor: '#ffd5a4',
        keyIntensity: 1.32,
        fillIntensity: 0.29,
        rimIntensity: 1.28,
        keyPosition: [2.5, 1.9, 1.4],
        fillPosition: [-2.4, -0.8, -1.6],
        rimPosition: [-1.8, -1.2, 2.15],
        exposure: 1.04,
      };
    case 'oceanic':
      return {
        keyColor: '#c7e9ff',
        fillColor: '#4d86bc',
        rimColor: '#77ddff',
        keyIntensity: 1.2,
        fillIntensity: 0.37,
        rimIntensity: 1.18,
        keyPosition: [2.1, 2.0, 1.3],
        fillPosition: [-2.2, -0.5, -1.7],
        rimPosition: [-1.6, -1.2, 2.0],
        exposure: 1.08,
      };
    case 'arid':
      return {
        keyColor: '#ffe4b7',
        fillColor: '#9c7a53',
        rimColor: '#ffbe83',
        keyIntensity: 1.28,
        fillIntensity: 0.25,
        rimIntensity: 1.16,
        keyPosition: [2.7, 1.6, 1.2],
        fillPosition: [-2.0, -1.0, -1.8],
        rimPosition: [-1.75, -1.15, 2.0],
        exposure: 1.02,
      };
    case 'fractured':
      return {
        keyColor: '#ebd6ff',
        fillColor: '#6d5fa1',
        rimColor: '#d3a8ff',
        keyIntensity: 1.31,
        fillIntensity: 0.24,
        rimIntensity: 1.32,
        keyPosition: [2.6, 1.8, 1.4],
        fillPosition: [-2.1, -0.9, -1.9],
        rimPosition: [-1.9, -1.15, 2.2],
        exposure: 1.03,
      };
    case 'barren':
    default:
      return {
        keyColor: '#f1e2cc',
        fillColor: '#7f8794',
        rimColor: '#d9cab8',
        keyIntensity: 1.18,
        fillIntensity: 0.2,
        rimIntensity: 1.02,
        keyPosition: [2.4, 1.8, 1.2],
        fillPosition: [-2.4, -0.9, -1.8],
        rimPosition: [-1.7, -1.2, 2.0],
        exposure: 1.0,
      };
  }
}

function atmosphereStrength(archetype: PlanetVisualProfile['archetype']) {
  switch (archetype) {
    case 'oceanic': return 0.42;
    case 'frozen': return 0.36;
    case 'volcanic': return 0.28;
    case 'arid': return 0.24;
    case 'fractured': return 0.22;
    case 'mineral': return 0.18;
    case 'barren':
    default:
      return 0.1;
  }
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
      const medium = fbm3(nx * profile.ridgeScale * 0.2, ny * profile.ridgeScale * 0.2, nz * profile.ridgeScale * 0.2, seed + 313, 3);
      const micro = fbm3(nx * 18.5, ny * 18.5, nz * 18.5, seed + 997, 2);

      const bands = Math.sin((ny + phaseA) * signature.bandFrequency + medium * 2.4 + phaseB) * 0.5 + 0.5;
      const fracture = Math.abs(Math.sin((nx + nz + phaseC) * signature.fractureFrequency + micro * 5.0));
      const basin = clamp(Math.pow(1 - Math.abs(macro - 0.5) * 2, 1.5) * 0.7 + medium * 0.3, 0, 1);
      const coverage = clamp(macro * 0.7 + medium * 0.2 + bands * 0.1 + signature.coverageBias, 0, 1);
      const ocean = coverage < profile.oceanLevel;

      const hue = wrapHue(
        profile.baseHue
        + (ocean ? signature.waterHueShift : signature.landHueShift)
        + (bands - 0.5) * signature.hueVariance
        + (fracture - 0.5) * signature.fractureHueShift,
      );
      const sat = clamp((ocean ? profile.oceanSaturation : profile.landSaturation) + (medium - 0.5) * 18 + signature.saturationOffset, 8, 92);
      const lightness = clamp(
        (ocean ? profile.oceanLightness : profile.landLightness)
        + (macro - 0.5) * signature.macroLightness
        + (basin - 0.5) * signature.basinLightness
        - Math.abs(ny) * signature.polarDarkening,
        8,
        92,
      );

      const rgb = hslToRgb(hue / 360, sat / 100, lightness / 100);
      const i = (y * width + x) * 4;
      colorData.data[i] = rgb[0];
      colorData.data[i + 1] = rgb[1];
      colorData.data[i + 2] = rgb[2];
      colorData.data[i + 3] = 255;

      const roughness = clamp(profile.roughness + (ocean ? signature.waterSmoothness : signature.landRoughBoost) + (1 - micro) * 0.12, 0.08, 0.98);
      const roughValue = Math.round(roughness * 255);
      roughData.data[i] = roughValue;
      roughData.data[i + 1] = roughValue;
      roughData.data[i + 2] = roughValue;
      roughData.data[i + 3] = 255;

      const metal = clamp(profile.metalness + signature.metalBias + (fracture > 0.82 ? signature.metalVeinBoost : 0), 0, 1);
      const metalValue = Math.round(metal * 255);
      metalData.data[i] = metalValue;
      metalData.data[i + 1] = metalValue;
      metalData.data[i + 2] = metalValue;
      metalData.data[i + 3] = 255;

      const bump = clamp(macro * 0.46 + medium * 0.38 + micro * 0.16 + signature.bumpBias - (ocean ? signature.oceanBasinFlatten : 0), 0, 1);
      const bumpValue = Math.round(bump * 255);
      bumpData.data[i] = bumpValue;
      bumpData.data[i + 1] = bumpValue;
      bumpData.data[i + 2] = bumpValue;
      bumpData.data[i + 3] = 255;

      const emissiveMask = clamp(signature.emissiveBase + (fracture > signature.emissiveThreshold ? (fracture - signature.emissiveThreshold) * signature.emissiveGain : 0), 0, 1);
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
      return { coverageBias: 0.22, bandFrequency: 6.3, fractureFrequency: 14.8, hueVariance: 22, fractureHueShift: 12, landHueShift: 10, waterHueShift: 5, saturationOffset: 8, macroLightness: 18, basinLightness: -10, polarDarkening: 8, waterSmoothness: -0.1, landRoughBoost: 0.08, metalBias: 0.04, metalVeinBoost: 0.15, bumpBias: 0.12, oceanBasinFlatten: 0.02, emissiveBase: 0.03, emissiveThreshold: 0.82, emissiveGain: 1.35, emissiveHueShift: -8, emissiveSaturationBoost: 0.35 };
    case 'frozen':
      return { coverageBias: -0.05, bandFrequency: 8.4, fractureFrequency: 11.2, hueVariance: 16, fractureHueShift: -10, landHueShift: -18, waterHueShift: -6, saturationOffset: -6, macroLightness: 24, basinLightness: 12, polarDarkening: -7, waterSmoothness: -0.2, landRoughBoost: -0.08, metalBias: 0.02, metalVeinBoost: 0.05, bumpBias: -0.04, oceanBasinFlatten: 0.06, emissiveBase: 0.0, emissiveThreshold: 0.92, emissiveGain: 0.25, emissiveHueShift: -25, emissiveSaturationBoost: 0.05 };
    case 'arid':
      return { coverageBias: 0.12, bandFrequency: 4.8, fractureFrequency: 8.6, hueVariance: 12, fractureHueShift: 6, landHueShift: 8, waterHueShift: 0, saturationOffset: -3, macroLightness: 15, basinLightness: -5, polarDarkening: 4, waterSmoothness: -0.06, landRoughBoost: 0.11, metalBias: -0.01, metalVeinBoost: 0.04, bumpBias: 0.08, oceanBasinFlatten: 0.12, emissiveBase: 0.0, emissiveThreshold: 0.95, emissiveGain: 0.18, emissiveHueShift: 6, emissiveSaturationBoost: 0.06 };
    case 'mineral':
      return { coverageBias: 0.08, bandFrequency: 7.2, fractureFrequency: 12.6, hueVariance: 14, fractureHueShift: 8, landHueShift: 5, waterHueShift: 0, saturationOffset: -8, macroLightness: 12, basinLightness: 6, polarDarkening: 6, waterSmoothness: -0.05, landRoughBoost: -0.03, metalBias: 0.18, metalVeinBoost: 0.22, bumpBias: 0.05, oceanBasinFlatten: 0.04, emissiveBase: 0.01, emissiveThreshold: 0.88, emissiveGain: 0.32, emissiveHueShift: 18, emissiveSaturationBoost: 0.12 };
    case 'oceanic':
      return { coverageBias: -0.16, bandFrequency: 5.4, fractureFrequency: 9.2, hueVariance: 20, fractureHueShift: -12, landHueShift: -4, waterHueShift: -24, saturationOffset: 5, macroLightness: 16, basinLightness: 16, polarDarkening: -3, waterSmoothness: -0.24, landRoughBoost: -0.04, metalBias: -0.03, metalVeinBoost: 0.01, bumpBias: -0.02, oceanBasinFlatten: 0.16, emissiveBase: 0.0, emissiveThreshold: 0.95, emissiveGain: 0.16, emissiveHueShift: -30, emissiveSaturationBoost: 0.06 };
    case 'fractured':
      return { coverageBias: 0.16, bandFrequency: 9.6, fractureFrequency: 17.5, hueVariance: 26, fractureHueShift: 24, landHueShift: 18, waterHueShift: 6, saturationOffset: 3, macroLightness: 10, basinLightness: -12, polarDarkening: 9, waterSmoothness: -0.08, landRoughBoost: 0.14, metalBias: 0.04, metalVeinBoost: 0.18, bumpBias: 0.15, oceanBasinFlatten: 0.03, emissiveBase: 0.015, emissiveThreshold: 0.78, emissiveGain: 0.9, emissiveHueShift: 22, emissiveSaturationBoost: 0.18 };
    case 'barren':
    default:
      return { coverageBias: 0.1, bandFrequency: 4.2, fractureFrequency: 7.5, hueVariance: 8, fractureHueShift: 0, landHueShift: 4, waterHueShift: 0, saturationOffset: -12, macroLightness: 9, basinLightness: -4, polarDarkening: 7, waterSmoothness: -0.03, landRoughBoost: 0.08, metalBias: 0.01, metalVeinBoost: 0.03, bumpBias: 0.06, oceanBasinFlatten: 0.05, emissiveBase: 0.0, emissiveThreshold: 0.97, emissiveGain: 0.1, emissiveHueShift: 0, emissiveSaturationBoost: 0.02 };
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
