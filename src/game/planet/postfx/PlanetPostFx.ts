import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const BLOOM_CLARITY_SCALE = 0.35;

export class PlanetPostFx {
  private readonly composer: EffectComposer;
  private readonly bloom: UnrealBloomPass;

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
    this.composer = new EffectComposer(renderer);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.01, 0.08, 0.85);

    this.composer.addPass(new RenderPass(scene, camera));
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
  }

  render() {
    this.composer.render();
  }

  resize(width: number, height: number) {
    this.composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.composer.setSize(width, height);
    this.bloom.setSize(width, height);
  }

  setBloom(settings: { strength: number; radius: number; threshold: number }) {
    this.bloom.strength = settings.strength * BLOOM_CLARITY_SCALE;
    this.bloom.radius = Math.min(settings.radius, 0.12);
    this.bloom.threshold = Math.max(settings.threshold, 0.8);
    this.bloom.enabled = this.bloom.strength > 0.001;
  }

  dispose() {
    this.composer.dispose();
    this.bloom.dispose();
  }
}
