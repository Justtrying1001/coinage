import * as THREE from 'three';
import { planetProfileFromSeed } from '@/game/world/galaxyGenerator';
import { createPlanetGenerationConfig } from '@/game/planet/presets/archetypes';
import { PlanetGenerator } from '@/game/planet/generation/PlanetGenerator';
import { PlanetPostFx } from '@/game/planet/postfx/PlanetPostFx';
import { PlanetScene } from '@/game/planet/runtime/PlanetScene';
import { PlanetSlotGenerator } from '@/game/planet/slots/PlanetSlotGenerator';
import { PlanetSlotRenderer } from '@/game/planet/slots/PlanetSlotRenderer';
import { applyDemoSlotOccupancy } from '@/game/planet/slots/slotDemoOccupancy';
import type { PlanetCitySlot } from '@/game/planet/slots/types';

export class PlanetRuntime {
  readonly renderer: THREE.WebGLRenderer;
  private readonly sceneKit = new PlanetScene();
  private readonly generator: PlanetGenerator;
  private readonly slotGenerator = new PlanetSlotGenerator();
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointerNdc = new THREE.Vector2();
  private postFx: PlanetPostFx;
  private planetRoot: THREE.Group | null = null;
  private slotRenderer: PlanetSlotRenderer | null = null;

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
    this.slotRenderer?.dispose();
    this.slotRenderer = null;

    const profile = planetProfileFromSeed(seed);
    const config = createPlanetGenerationConfig(seed, profile);
    const generated = this.generator.generate(config);

    const generatedSlots = this.slotGenerator.generate(generated.surfaceGeometry, {
      seed,
      archetype: config.archetype,
      blendDepth: config.blendDepth,
      seaLevel: config.seaLevel,
    });
    const occupiedSlots = applyDemoSlotOccupancy(generatedSlots, seed, config.archetype);
    this.slotRenderer = new PlanetSlotRenderer(occupiedSlots);
    generated.root.add(this.slotRenderer.group);

    this.planetRoot = generated.root;
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

  getSlots() {
    return this.slotRenderer?.getSlots() ?? [];
  }

  getSelectedSlot(): PlanetCitySlot | null {
    return this.slotRenderer?.getSelectedSlot() ?? null;
  }

  setSelectedSlotByIndex(slotIndex: number) {
    this.slotRenderer?.setSelectedSlotByIndex(slotIndex);
  }

  clearSelectedSlot() {
    this.slotRenderer?.clearSelection();
  }

  pickSlotFromScreen(clientX: number, clientY: number): number | null {
    if (!this.slotRenderer) return null;
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return null;

    this.pointerNdc.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );

    this.raycaster.setFromCamera(this.pointerNdc, this.sceneKit.camera);
    const hits = this.slotRenderer.raycast(this.raycaster);
    if (hits.length === 0) return null;
    return this.slotRenderer.pickSlotFromIntersection(hits[0]);
  }

  get camera() {
    return this.sceneKit.camera;
  }

  destroy() {
    this.slotRenderer?.dispose();
    this.slotRenderer = null;
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
