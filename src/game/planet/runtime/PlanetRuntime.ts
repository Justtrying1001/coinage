import * as THREE from 'three';
import { planetProfileFromSeed } from '@/game/world/galaxyGenerator';
import { createPlanetGenerationConfig } from '@/game/planet/presets/archetypes';
import { PlanetGenerator } from '@/game/planet/generation/PlanetGenerator';
import { PlanetPostFx } from '@/game/planet/postfx/PlanetPostFx';
import { PlanetScene } from '@/game/planet/runtime/PlanetScene';
import { PlanetSlotGenerator } from '@/game/planet/slots/PlanetSlotGenerator';
import { PlanetSlotRenderer } from '@/game/planet/slots/PlanetSlotRenderer';
import type { PlanetSettlementSlot, PlanetSlotRenderState } from '@/game/planet/slots/types';

export class PlanetRuntime {
  readonly renderer: THREE.WebGLRenderer;
  private readonly sceneKit = new PlanetScene();
  private readonly generator: PlanetGenerator;
  private postFx: PlanetPostFx;
  private planetRoot: THREE.Group | null = null;
  private slots: PlanetSettlementSlot[] = [];
  private slotState: PlanetSlotRenderState | null = null;
  private readonly slotGenerator = new PlanetSlotGenerator();
  private readonly slotRenderer = new PlanetSlotRenderer();

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
      this.slotRenderer.dispose(this.slotState);
      this.slotState = null;
      this.slots = [];
      this.sceneKit.root.remove(this.planetRoot);
      disposeHierarchy(this.planetRoot);
    }

    const profile = planetProfileFromSeed(seed);
    const config = createPlanetGenerationConfig(seed, profile);
    const generated = this.generator.generate(config);

    this.planetRoot = generated.root;
    this.sceneKit.root.add(generated.root);

    try {
      this.slots = this.slotGenerator.generate(config, generated.surfaceMesh);
      this.slotState = this.slotRenderer.render(generated.surfaceMesh, this.slots);
      generated.root.add(this.slotState.root);
    } catch (error) {
      this.slots = [];
      this.slotState = null;
      console.error('[planet-slots] generation failed; continuing without settlement slots', error);
    }

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

  getSettlementSlots() {
    return this.slots;
  }

  pickSettlementSlot(screenX: number, screenY: number, viewportWidth: number, viewportHeight: number) {
    if (!this.slotState || viewportWidth <= 0 || viewportHeight <= 0) return null;
    const mouse = new THREE.Vector2((screenX / viewportWidth) * 2 - 1, -(screenY / viewportHeight) * 2 + 1);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.sceneKit.camera);
    const pickables = this.slotState.items.flatMap((item) => [item.pickMesh, item.decalMesh, item.beaconMesh]);
    const hit = raycaster.intersectObjects(pickables, false)[0];
    const slotId = (hit?.object.userData.slotId as string | undefined) ?? null;
    return this.slots.find((slot) => slot.id === slotId) ?? null;
  }

  setSelectedSettlementSlot(slotId: string | null) {
    this.slotRenderer.setSelected(this.slotState, slotId);
  }

  destroy() {
    this.slotRenderer.dispose(this.slotState);
    if (this.planetRoot) disposeHierarchy(this.planetRoot);
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
