import {
  AmbientLight,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  Scene,
  Vector2,
  WebGLRenderer,
} from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import type { Camera } from 'three';
import type { CitySiteContext } from '@/game/city/scene/CitySiteContext';

export class CityAtmosphereAndPostFx {
  private readonly composer: EffectComposer;
  private readonly bloom: UnrealBloomPass;

  constructor(renderer: WebGLRenderer, scene: Scene, camera: Camera, context: CitySiteContext) {
    scene.background = new Color(context.biome.sky);
    scene.fog = new Fog(context.biome.fog, 22, 118);

    const hemi = new HemisphereLight(context.biome.haze, context.biome.rock, 0.58);
    scene.add(hemi);

    const ambient = new AmbientLight(0xb9d4ea, 0.66);
    scene.add(ambient);

    const key = new DirectionalLight(0xe6f5ff, 1.2);
    key.position.set(16, 22, 18);
    scene.add(key);

    const bounce = new DirectionalLight(0x8ab8da, 0.45);
    bounce.position.set(-24, 14, -10);
    scene.add(bounce);

    this.composer = new EffectComposer(renderer);
    this.bloom = new UnrealBloomPass(new Vector2(1, 1), 0.11, 0.18, 0.9);
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

  dispose() {
    this.composer.dispose();
    this.bloom.dispose();
  }
}
