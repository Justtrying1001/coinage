import * as THREE from 'three';
import { planetProfileFromSeed } from '@/game/world/galaxyGenerator';
import { createPlanetGenerationConfig } from '@/game/planet/presets/archetypes';
import { PlanetGenerator } from '@/game/planet/generation/PlanetGenerator';
import { PlanetPostFx } from '@/game/planet/postfx/PlanetPostFx';
import { PlanetScene } from '@/game/planet/runtime/PlanetScene';
import type { SettlementSlot } from '@/game/planet/runtime/SettlementSlots';
import { generateSettlementSlots } from '@/game/planet/runtime/SettlementSlots';
import { SettlementSlotLayer } from '@/game/planet/runtime/SettlementSlotLayer';
import { perfLog, perfMark, perfMeasure } from '@/game/perf/perfMarks';

interface SettlementSnapshot {
  total: number;
  occupied: number;
  available: number;
  selected: SettlementSlot | null;
}

export class PlanetRuntime {
  private static readonly settlementCache = new Map<number, SettlementSlot[]>();

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
  private needsRender = true;
  private interactionUntil = 0;
  private idleElapsed = 0;
  private firstFramePending = false;

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

  async rebuildFromSeed(seed: number) {
    perfMark('planet.rebuild.start');
    if (this.planetRoot) {
      this.sceneKit.root.remove(this.planetRoot);
      disposeHierarchy(this.planetRoot);
    }

    this.disposeSettlementLayer();
    this.needsRender = true;
    this.firstFramePending = true;

    const profile = planetProfileFromSeed(seed);
    const fullConfig = createPlanetGenerationConfig(seed, profile);
    const previewConfig = {
      ...fullConfig,
      resolution: Math.min(88, fullConfig.resolution),
    };

    perfMark('planet.preview.start');
    const preview = await this.generator.generateAsync(previewConfig, { preview: true });
    perfMark('planet.preview.end');
    perfMeasure('planet.preview.total', 'planet.preview.start', 'planet.preview.end');

    this.planetRoot = preview.root;
    this.sceneKit.root.add(preview.root);
    this.postFx.setBloom({ strength: 0, radius: 0, threshold: 1 });
    this.renderer.toneMappingExposure = fullConfig.postfx.exposure;
    this.markInteractive();

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });

    perfMark('planet.full.start');
    const generated = await this.generator.generateAsync(fullConfig);
    perfMark('planet.full.end');
    perfMeasure('planet.full.total', 'planet.full.start', 'planet.full.end');

    this.sceneKit.root.remove(preview.root);
    disposeHierarchy(preview.root);
    this.planetRoot = generated.root;
    this.sceneKit.root.add(generated.root);

    try {
      const cached = PlanetRuntime.settlementCache.get(seed);
      this.settlementSlots = cached ?? generateSettlementSlots(generated.surfaceGeometry, fullConfig);
      if (!cached) {
        PlanetRuntime.settlementCache.set(seed, this.settlementSlots);
      }
      this.settlementLayer = new SettlementSlotLayer(this.settlementSlots);
      generated.root.add(this.settlementLayer.group);
    } catch (error) {
      console.error('[planet-settlements] failed to generate settlement slots', error);
      this.settlementSlots = [];
      this.settlementLayer = null;
    }

    this.selectedSlotIndex = null;
    this.emitSettlementSelection();

    this.postFx.setBloom(fullConfig.postfx.bloom);
    this.renderer.toneMappingExposure = fullConfig.postfx.exposure;
    this.markInteractive();
    perfMark('planet.rebuild.end');
    perfMeasure('planet.rebuild.total', 'planet.rebuild.start', 'planet.rebuild.end');
    perfLog('planet.rebuild.complete', { seed, resolution: fullConfig.resolution });
  }

  resize(width: number, height: number) {
    this.sceneKit.setSize(width, height);
    this.renderer.setSize(Math.max(1, width), Math.max(1, height), false);
    this.postFx.resize(Math.max(1, width), Math.max(1, height));
    this.markInteractive();
  }

  update(deltaMs: number) {
    this.sceneKit.update(deltaMs);
    const now = performance.now();
    this.idleElapsed += deltaMs;
    const shouldRender = this.needsRender || now < this.interactionUntil || this.idleElapsed > 1000;
    if (!shouldRender) return;
    this.idleElapsed = 0;
    this.needsRender = false;
    this.postFx.render();
    if (this.firstFramePending) {
      this.firstFramePending = false;
      perfMark('planet.first-frame');
      perfMeasure('planet.mount.to.first-frame', 'planet.mount.start', 'planet.first-frame');
    }
  }

  rotate(deltaYaw: number, deltaPitch: number, camera: THREE.Camera) {
    if (!this.planetRoot) return;
    const qYaw = new THREE.Quaternion().setFromAxisAngle(THREE.Object3D.DEFAULT_UP, deltaYaw);
    const axis = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const qPitch = new THREE.Quaternion().setFromAxisAngle(axis, deltaPitch);
    this.planetRoot.quaternion.premultiply(qYaw);
    this.planetRoot.quaternion.premultiply(qPitch);
    this.markInteractive();
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
    const hits = this.raycaster.intersectObjects(this.settlementLayer.pickables, true);
    const hitObject = hits[0]?.object;
    if (!hitObject) return null;

    const slotIndex = this.settlementLayer.getSlotIndexFromObject(hitObject);
    if (slotIndex == null) return null;
    return this.settlementSlots[slotIndex] ?? null;
  }

  setSelectedSettlement(slotId: string | null) {
    const nextIndex = slotId == null ? null : this.settlementSlots.findIndex((slot) => slot.id === slotId);
    const normalized = nextIndex != null && nextIndex >= 0 ? nextIndex : null;
    this.selectedSlotIndex = normalized;
    this.settlementLayer?.setSelectedIndex(normalized);
    this.emitSettlementSelection();
    this.markInteractive();
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

  private markInteractive() {
    this.needsRender = true;
    this.interactionUntil = performance.now() + 350;
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
