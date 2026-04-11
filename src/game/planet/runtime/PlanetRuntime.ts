import * as THREE from 'three';
import { planetProfileFromSeed } from '@/game/world/galaxyGenerator';
import { createPlanetGenerationConfig } from '@/game/planet/presets/archetypes';
import { PlanetGenerator } from '@/game/planet/generation/PlanetGenerator';
import { PlanetPostFx } from '@/game/planet/postfx/PlanetPostFx';
import { PlanetScene } from '@/game/planet/runtime/PlanetScene';
import type { PlanetDebugMode } from '@/game/planet/materials/PlanetMaterial';
import { setPlanetMaterialDebugMode } from '@/game/planet/materials/PlanetMaterial';

const DEBUG_MODES: PlanetDebugMode[] = ['final', 'normals', 'elevation', 'slope', 'breakup', 'vegetation', 'upland', 'peak', 'coast'];

export class PlanetRuntime {
  readonly renderer: THREE.WebGLRenderer;
  private readonly sceneKit = new PlanetScene();
  private readonly generator: PlanetGenerator;
  private postFx: PlanetPostFx;
  private planetRoot: THREE.Group | null = null;
  private planetMesh: THREE.Mesh | null = null;
  private planetSurfaceMaterial: THREE.Material | null = null;
  private readonly normalDebugMaterial = new THREE.MeshNormalMaterial();
  private debugMode: PlanetDebugMode = 'final';

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

    const profile = planetProfileFromSeed(seed);
    const config = createPlanetGenerationConfig(seed, profile);
    const generated = this.generator.generate(config);

    this.planetRoot = generated.root;
    this.planetMesh = generated.root.children.find((child): child is THREE.Mesh => (child as THREE.Mesh).isMesh) ?? null;
    this.planetSurfaceMaterial = this.planetMesh
      ? (Array.isArray(this.planetMesh.material) ? this.planetMesh.material[0] ?? null : this.planetMesh.material)
      : null;
    this.sceneKit.root.add(generated.root);
    this.applyDebugMode();

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

  cycleDebugMode() {
    const index = DEBUG_MODES.indexOf(this.debugMode);
    const next = DEBUG_MODES[(index + 1) % DEBUG_MODES.length];
    this.setDebugMode(next);
  }

  setDebugMode(mode: PlanetDebugMode) {
    this.debugMode = mode;
    this.applyDebugMode();
  }

  getDebugMode() {
    return this.debugMode;
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

  destroy() {
    if (this.planetRoot) disposeHierarchy(this.planetRoot);
    this.normalDebugMaterial.dispose();
    this.postFx.dispose();
    this.sceneKit.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private applyDebugMode() {
    if (!this.planetMesh || !this.planetSurfaceMaterial) return;
    if (this.debugMode === 'normals') {
      this.planetMesh.material = this.normalDebugMaterial;
      return;
    }
    this.planetMesh.material = this.planetSurfaceMaterial;
    setPlanetMaterialDebugMode(this.planetSurfaceMaterial, this.debugMode);
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
