import * as THREE from 'three';
import type { ModeContext, RenderModeController } from '@/game/render/modes/RenderModeController';
import type { SelectedPlanetRef } from '@/game/render/types';
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

  private backButton: HTMLButtonElement | null = null;

  private width = 1;

  private height = 1;

  private isDragging = false;

  private pointerId: number | null = null;

  private lastX = 0;

  private lastY = 0;

  private rotationVelocity = new THREE.Vector2(0, 0);

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
    this.mountBackButton();

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
    if (this.planet) {
      if (this.isDragging) {
        this.rotationVelocity.multiplyScalar(0.9);
      } else {
        this.rotationVelocity.multiplyScalar(0.94);
        this.planet.rotation.y += this.rotationVelocity.x;
        this.planet.rotation.x = clamp(this.planet.rotation.x + this.rotationVelocity.y, -0.68, 0.68);
      }

      this.planet.rotation.y += deltaMs * 0.00012;
    }

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
    this.backButton?.remove();
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
      const macroMask = Math.pow(continentNoise, profile.reliefSharpness);
      const ridgeMask = Math.max(0, ridgeNoise - 0.5) * 1.8;
      const craterMask = (0.5 - Math.abs(craterNoise - 0.5)) * 0.12;
      const polarMask = Math.pow(Math.abs(latitude), 1.3);
      const elevation = (macroMask * 0.8 + ridgeMask * 0.35 - craterMask - polarMask * 0.08) * profile.reliefStrength;

      position.setXYZ(i, vx * (1 + elevation), vy * (1 + elevation), vz * (1 + elevation));

      const oceanMask = macroMask < profile.oceanLevel;
      const humidity = normalizedNoise(vx, vz, vy, profile.continentScale * 1.35, seedPhaseB, seedPhaseC);
      const climateShift = (humidity - 0.5) * profile.hueDrift + latitude * -8;
      const hue = oceanMask
        ? wrapHue(profile.baseHue + 190 + climateShift * 0.2 + rng.range(-3, 4))
        : wrapHue(profile.baseHue + climateShift + rng.range(-4, 5));
      const sat = oceanMask ? profile.oceanSaturation + humidity * 6 : profile.landSaturation + humidity * 4;
      const light = oceanMask
        ? profile.oceanLightness + ridgeMask * 12 + latitude * 5
        : profile.landLightness + elevation * 120 + humidity * 8 - polarMask * 7;
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
      emissiveIntensity: 0.04,
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
  }

  private readonly onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    this.pointerId = event.pointerId;
    this.isDragging = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.rotationVelocity.set(0, 0);
  };

  private readonly onPointerMove = (event: PointerEvent) => {
    if (!this.isDragging || this.pointerId !== event.pointerId || !this.planet) return;

    const dx = event.clientX - this.lastX;
    const dy = event.clientY - this.lastY;
    this.lastX = event.clientX;
    this.lastY = event.clientY;

    const nextYaw = dx * 0.0105;
    const nextPitch = dy * 0.0085;
    this.rotationVelocity.set(nextYaw, nextPitch);

    this.planet.rotation.y += nextYaw;
    this.planet.rotation.x = clamp(this.planet.rotation.x + nextPitch, -0.68, 0.68);
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

  private mountBackButton() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'planet-back-button';
    button.textContent = 'Back to Galaxy';
    button.addEventListener('click', () => {
      this.context.onRequestMode('galaxy2d');
    });
    this.context.host.appendChild(button);
    this.backButton = button;
  }
}

function normalizedNoise(a: number, b: number, c: number, scale: number, phaseA: number, phaseB: number) {
  const primary = Math.sin(a * scale + phaseA) * Math.cos(b * scale * 0.75 + phaseB);
  const secondary = Math.sin(c * scale * 1.35 + phaseB * 1.2) * 0.5;
  return clamp(primary * 0.65 + secondary * 0.35 + 0.5, 0, 1);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function wrapHue(value: number) {
  return ((value % 360) + 360) % 360;
}
