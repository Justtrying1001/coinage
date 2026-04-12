import * as THREE from 'three';
import { planetProfileFromSeed } from '@/game/world/galaxyGenerator';
import { createPlanetGenerationConfig } from '@/game/planet/presets/archetypes';
import { PlanetGenerator } from '@/game/planet/generation/PlanetGenerator';
import { PlanetPostFx } from '@/game/planet/postfx/PlanetPostFx';
import { PlanetScene } from '@/game/planet/runtime/PlanetScene';
import { PlanetSlotGenerator } from '@/game/planet/slots/PlanetSlotGenerator';
import { PlanetSlotRenderer } from '@/game/planet/slots/PlanetSlotRenderer';
import type { PlanetSettlementSlot } from '@/game/planet/slots/types';

export class PlanetRuntime {
  readonly renderer: THREE.WebGLRenderer;
  private readonly sceneKit = new PlanetScene();
  private readonly generator: PlanetGenerator;
  private readonly slotGenerator = new PlanetSlotGenerator();
  private postFx: PlanetPostFx;
  private planetRoot: THREE.Group | null = null;
  private slots: PlanetSettlementSlot[] = [];
  private slotRenderer: PlanetSlotRenderer | null = null;
  private selectedSlotIndex: number | null = null;
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointerNdc = new THREE.Vector2();

  constructor(private readonly host: HTMLDivElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.domElement.className = 'render-surface render-surface--planet';

    this.host.appendChild(this.renderer.domElement);

    this.generator = new PlanetGenerator(this.renderer);
    this.postFx = new PlanetPostFx(this.renderer, this.sceneKit.scene, this.sceneKit.camera);
  }

  rebuildFromSeed(seed: number) {
    if (this.planetRoot) {
      this.slotRenderer?.dispose();
      this.slotRenderer = null;
      this.slots = [];
      this.selectedSlotIndex = null;
      this.sceneKit.root.remove(this.planetRoot);
      disposeHierarchy(this.planetRoot);
    }

    const profile = planetProfileFromSeed(seed);
    const config = createPlanetGenerationConfig(seed, profile);
    const generated = this.generator.generate(config);

    this.planetRoot = generated.root;
    try {
      this.slots = this.slotGenerator.generate(generated.surfaceGeometry, config);
      this.slotRenderer = new PlanetSlotRenderer(this.slots);
      generated.root.add(this.slotRenderer.object3d);
    } catch (error) {
      this.slots = [];
      this.slotRenderer = null;
      this.selectedSlotIndex = null;
      console.error('[planet-slots] failed to build settlement slots', error);
    }

    this.sceneKit.root.add(generated.root);

    this.postFx.setBloom(config.postfx.bloom);
    this.renderer.toneMappingExposure = config.postfx.exposure;
  }

  resize(width: number, height: number) {
    this.sceneKit.setSize(width, height);
    this.renderer.setSize(Math.max(1, width), Math.max(1, height), false);
    this.postFx.resize(Math.max(1, width), Math.max(1, height));
  }

  update(deltaMs: number) {
    this.sceneKit.update(deltaMs);
    this.postFx.render();
  }

  rotate(deltaYaw: number, deltaPitch: number, camera: THREE.Camera) {
    if (!this.planetRoot) return;
    const qYaw = new THREE.Quaternion().setFromAxisAngle(THREE.Object3D.DEFAULT_UP, deltaYaw);
    const axis = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const qPitch = new THREE.Quaternion().setFromAxisAngle(axis, deltaPitch);
    this.planetRoot.quaternion.premultiply(qYaw);
    this.planetRoot.quaternion.premultiply(qPitch);
  }

  get camera() {
    return this.sceneKit.camera;
  }

  getSlots() {
    return this.slots;
  }

  getSelectedSlot() {
    if (this.selectedSlotIndex == null) return null;
    return this.slots[this.selectedSlotIndex] ?? null;
  }

  setSelectedSlotByIndex(index: number) {
    if (!this.slots[index]) return false;
    this.selectedSlotIndex = index;
    this.slotRenderer?.setSelectedIndex(index);
    return true;
  }

  clearSelectedSlot() {
    this.selectedSlotIndex = null;
    this.slotRenderer?.setSelectedIndex(null);
  }

  pickSlotFromScreen(clientX: number, clientY: number) {
    if (!this.slotRenderer) return null;
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    this.pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointerNdc, this.sceneKit.camera);
    return this.slotRenderer.pick(this.raycaster);
  }

  destroy() {
    this.slotRenderer?.dispose();
    this.slotRenderer = null;
    if (this.planetRoot) disposeHierarchy(this.planetRoot);
    this.slots = [];
    this.selectedSlotIndex = null;
    this.postFx.dispose();
    this.sceneKit.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

function disposeHierarchy(root: THREE.Object3D) {
  const disposedMaterials = new Set<THREE.Material>();
  root.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh;
      mesh.geometry?.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((material) => {
          if (disposedMaterials.has(material)) return;
          disposedMaterials.add(material);
          material.dispose();
        });
      } else if (mesh.material) {
        if (disposedMaterials.has(mesh.material)) return;
        disposedMaterials.add(mesh.material);
        mesh.material.dispose();
      }
    }
  });
}
