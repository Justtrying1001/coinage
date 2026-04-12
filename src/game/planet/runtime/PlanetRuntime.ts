import * as THREE from 'three';
import { planetProfileFromSeed } from '@/game/world/galaxyGenerator';
import { createPlanetGenerationConfig } from '@/game/planet/presets/archetypes';
import { PlanetGenerator } from '@/game/planet/generation/PlanetGenerator';
import { PlanetPostFx } from '@/game/planet/postfx/PlanetPostFx';
import { PlanetScene } from '@/game/planet/runtime/PlanetScene';
import type { SettlementSlot } from '@/game/planet/runtime/SettlementSlots';
import { generateSettlementSlots } from '@/game/planet/runtime/SettlementSlots';
import { SettlementSlotLayer } from '@/game/planet/runtime/SettlementSlotLayer';

interface SettlementSnapshot {
  total: number;
  occupied: number;
  available: number;
  selected: SettlementSlot | null;
}

export class PlanetRuntime {
  readonly renderer: THREE.WebGLRenderer;
  private readonly sceneKit = new PlanetScene();
  private readonly generator: PlanetGenerator;
  private postFx: PlanetPostFx;
  private planetRoot: THREE.Group | null = null;
  private settlementSlots: SettlementSlot[] = [];
  private settlementLayer: SettlementSlotLayer | null = null;
  private selectedSlotIndex: number | null = null;
  private readonly raycaster = new THREE.Raycaster();
  private readonly ndc = new THREE.Vector2();
  private readonly pointerPixel = new THREE.Vector2();
  private onSettlementSelectionChanged: ((snapshot: SettlementSnapshot) => void) | null = null;

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
      this.sceneKit.root.remove(this.planetRoot);
      disposeHierarchy(this.planetRoot);
    }

    this.disposeSettlementLayer();

    const profile = planetProfileFromSeed(seed);
    const config = createPlanetGenerationConfig(seed, profile);
    const generated = this.generator.generate(config);

    this.planetRoot = generated.root;
    this.sceneKit.root.add(generated.root);

    try {
      this.settlementSlots = generateSettlementSlots(generated.surfaceGeometry, config);
      this.settlementLayer = new SettlementSlotLayer(this.settlementSlots);
      generated.root.add(this.settlementLayer.group);
    } catch (error) {
      console.error('[planet-settlements] failed to generate settlement slots', error);
      this.settlementSlots = [];
      this.settlementLayer = null;
    }

    this.selectedSlotIndex = null;
    this.emitSettlementSelection();

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

  pickSettlementSlot(clientX: number, clientY: number) {
    if (!this.settlementLayer) return null;
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    this.pointerPixel.set(clientX - rect.left, clientY - rect.top);
    if (this.pointerPixel.x < 0 || this.pointerPixel.y < 0 || this.pointerPixel.x > rect.width || this.pointerPixel.y > rect.height) {
      return null;
    }

    this.ndc.set((this.pointerPixel.x / rect.width) * 2 - 1, -(this.pointerPixel.y / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.ndc, this.sceneKit.camera);
    const hits = this.raycaster.intersectObject(this.settlementLayer.mesh, false);
    const instanceId = hits[0]?.instanceId;
    if (instanceId == null) return null;
    return this.settlementSlots[instanceId] ?? null;
  }

  setSelectedSettlement(slotId: string | null) {
    const nextIndex = slotId == null ? null : this.settlementSlots.findIndex((slot) => slot.id === slotId);
    const normalized = nextIndex != null && nextIndex >= 0 ? nextIndex : null;
    this.selectedSlotIndex = normalized;
    this.settlementLayer?.setSelectedIndex(normalized);
    this.emitSettlementSelection();
  }

  getSettlementSnapshot(): SettlementSnapshot {
    const total = this.settlementSlots.length;
    const occupied = 0;
    const available = total;
    const selected = this.selectedSlotIndex == null ? null : (this.settlementSlots[this.selectedSlotIndex] ?? null);

    return {
      total,
      occupied,
      available,
      selected,
    };
  }

  setSettlementSelectionListener(listener: ((snapshot: SettlementSnapshot) => void) | null) {
    this.onSettlementSelectionChanged = listener;
  }

  get camera() {
    return this.sceneKit.camera;
  }

  destroy() {
    if (this.planetRoot) disposeHierarchy(this.planetRoot);
    this.disposeSettlementLayer();
    this.postFx.dispose();
    this.sceneKit.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private emitSettlementSelection() {
    this.onSettlementSelectionChanged?.(this.getSettlementSnapshot());
  }

  private disposeSettlementLayer() {
    this.settlementLayer?.group.removeFromParent();
    this.settlementLayer?.dispose();
    this.settlementLayer = null;
    this.settlementSlots = [];
    this.selectedSlotIndex = null;
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
