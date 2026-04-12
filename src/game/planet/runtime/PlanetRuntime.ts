import * as THREE from 'three';
import { planetProfileFromSeed } from '@/game/world/galaxyGenerator';
import { createPlanetGenerationConfig } from '@/game/planet/presets/archetypes';
import { PlanetGenerator } from '@/game/planet/generation/PlanetGenerator';
import { PlanetPostFx } from '@/game/planet/postfx/PlanetPostFx';
import { PlanetScene } from '@/game/planet/runtime/PlanetScene';
import type { SettlementSlot } from '@/game/planet/runtime/SettlementSlots';
import { generateSettlementSlots } from '@/game/planet/runtime/SettlementSlots';
import { SettlementSlotLayer } from '@/game/planet/runtime/SettlementSlotLayer';
import { mark, measure, timed } from '@/game/planet/runtime/planetPerf';

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
  private currentSeed: number | null = null;
  private refineTimeoutId: number | null = null;
  private hasRenderedOnce = false;
  private firstRenderPending = false;

  constructor(private readonly host: HTMLDivElement) {
    this.renderer = timed('perf:renderer-creation', () => {
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      renderer.domElement.className = 'render-surface render-surface--planet';
      return renderer;
    });

    this.host.appendChild(this.renderer.domElement);

    this.generator = new PlanetGenerator(this.renderer);
    this.postFx = new PlanetPostFx(this.renderer, this.sceneKit.scene, this.sceneKit.camera);
  }

  rebuildFromSeed(seed: number) {
    mark('perf:rebuildFromSeed:start');
    this.currentSeed = seed;
    this.firstRenderPending = true;
    this.hasRenderedOnce = false;
    if (this.refineTimeoutId != null) {
      window.clearTimeout(this.refineTimeoutId);
      this.refineTimeoutId = null;
    }
    if (this.planetRoot) {
      this.sceneKit.root.remove(this.planetRoot);
      disposeHierarchy(this.planetRoot);
    }

    this.disposeSettlementLayer();

    const profile = planetProfileFromSeed(seed);
    const config = createPlanetGenerationConfig(seed, profile);
    const previewConfig = {
      ...config,
      resolution: Math.max(48, Math.floor(config.resolution * 0.5)),
    };
    const generated = this.generator.generate(previewConfig);

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

    this.postFx.setEnabled(false);
    this.postFx.setBloom(config.postfx.bloom);
    this.renderer.toneMappingExposure = config.postfx.exposure;
    this.prewarmShaders(generated.root);

    this.refineTimeoutId = window.setTimeout(() => {
      if (this.currentSeed !== seed) return;
      const highResGenerated = this.generator.generate(config);
      if (this.planetRoot) {
        this.sceneKit.root.remove(this.planetRoot);
        disposeHierarchy(this.planetRoot);
      }
      this.planetRoot = highResGenerated.root;
      this.sceneKit.root.add(highResGenerated.root);
      this.refineTimeoutId = null;
    }, 0);
    mark('perf:rebuildFromSeed:end');
    measure('perf:rebuildFromSeed', 'perf:rebuildFromSeed:start', 'perf:rebuildFromSeed:end');
  }

  resize(width: number, height: number) {
    this.sceneKit.setSize(width, height);
    this.renderer.setSize(Math.max(1, width), Math.max(1, height), false);
    this.postFx.resize(Math.max(1, width), Math.max(1, height));
  }

  update(deltaMs: number) {
    this.sceneKit.update(deltaMs);
    if (!this.hasRenderedOnce) {
      this.renderer.render(this.sceneKit.scene, this.sceneKit.camera);
      this.hasRenderedOnce = true;
      if (this.firstRenderPending) {
        mark('perf:first-render');
        measure('perf:first-render-latency', 'perf:planet3d-mount:start', 'perf:first-render');
        this.firstRenderPending = false;
      }
      this.postFx.setEnabled(true);
      return;
    }
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

  attachToHost(host: HTMLDivElement) {
    if (this.renderer.domElement.parentElement === host) return;
    host.appendChild(this.renderer.domElement);
  }

  detachFromHost() {
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

  private prewarmShaders(root: THREE.Group) {
    const hasMesh = root.children.some((child) => (child as THREE.Mesh).isMesh);
    if (!hasMesh || typeof this.renderer.compileAsync !== 'function') return;
    this.renderer.compileAsync(this.sceneKit.scene, this.sceneKit.camera).catch(() => {
      // best effort
    });
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
