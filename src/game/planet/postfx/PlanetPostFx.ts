import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const ColorGradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uContrast: { value: 1 },
    uSaturation: { value: 1 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uContrast;
    uniform float uSaturation;
    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float luma = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
      vec3 saturated = mix(vec3(luma), color.rgb, uSaturation);
      vec3 contrasted = (saturated - 0.5) * uContrast + 0.5;
      gl_FragColor = vec4(clamp(contrasted, 0.0, 1.0), color.a);
    }
  `,
};

export class PlanetPostFx {
  private readonly composer: EffectComposer;
  private readonly bloom: UnrealBloomPass;
  private readonly colorGrade: ShaderPass;

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
    this.composer = new EffectComposer(renderer);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.01, 0.1, 0.9);
    this.colorGrade = new ShaderPass(ColorGradeShader);

    this.composer.addPass(new RenderPass(scene, camera));
    this.composer.addPass(this.bloom);
    this.composer.addPass(this.colorGrade);
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
    this.bloom.strength = settings.strength;
    this.bloom.radius = settings.radius;
    this.bloom.threshold = settings.threshold;
    this.bloom.enabled = settings.strength > 0.0001;
  }

  setColorGrade(settings: { contrast: number; saturation: number }) {
    this.colorGrade.uniforms.uContrast.value = settings.contrast;
    this.colorGrade.uniforms.uSaturation.value = settings.saturation;
  }

  dispose() {
    this.composer.dispose();
    this.bloom.dispose();
  }
}
