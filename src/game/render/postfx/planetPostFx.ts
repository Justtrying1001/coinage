import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export interface PlanetPostFxController {
  render: () => void;
  resize: (width: number, height: number) => void;
  dispose: () => void;
  setBloom: (settings: { strength: number; radius: number; threshold: number }) => void;
}

export function createPlanetPostFx(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
): PlanetPostFxController {
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.2, 0.5, 0.0);
  const outputPass = new OutputPass();

  composer.addPass(renderPass);
  composer.addPass(bloom);
  composer.addPass(outputPass);

  return {
    render: () => composer.render(),
    resize: (width: number, height: number) => {
      composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      composer.setSize(width, height);
      bloom.setSize(width, height);
    },
    dispose: () => {
      composer.dispose();
      bloom.dispose();
    },
    setBloom: ({ strength, radius, threshold }) => {
      bloom.strength = strength;
      bloom.radius = radius;
      bloom.threshold = threshold;
    },
  };
}
