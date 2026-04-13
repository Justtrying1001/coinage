import {
  ACESFilmicToneMapping,
  Color,
  DirectionalLight,
  Fog,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
  type BufferGeometry,
  type Material,
  type Mesh,
  type Object3D,
} from 'three';
import { PlanetPostFx } from '@/game/planet/postfx/PlanetPostFx';
import { createPlanetSurfaceAdapter } from '@/game/city/terrain/createPlanetSurfaceAdapter';
import type { PlanetArchetype } from '@/game/render/types';

export class CitySceneController {
  readonly renderer: WebGLRenderer;
  readonly camera: PerspectiveCamera;
  readonly archetype: PlanetArchetype;

  private readonly scene: Scene;
  private readonly postFx: PlanetPostFx;

  constructor(
    private readonly host: HTMLDivElement,
    seed: number,
  ) {
    this.renderer = new WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.domElement.className = 'render-surface render-surface--city3d';

    const terrain = createPlanetSurfaceAdapter(seed);
    this.archetype = terrain.profile.archetype;
    this.renderer.toneMappingExposure = terrain.config.postfx.exposure;

    this.camera = new PerspectiveCamera(48, 1, 0.1, 800);
    this.camera.position.set(6, 57, 64);
    this.camera.lookAt(new Vector3(0, 51, 0));

    this.scene = new Scene();
    this.scene.background = gradientColor(terrain.config.depthGradient, 0.72, 0x0f1724);
    this.scene.fog = new Fog(
      gradientColor(terrain.config.depthGradient, 0.9, 0x243546),
      52,
      190,
    );

    this.scene.add(terrain.mesh);

    const key = new DirectionalLight(0xf2f6ff, 1.08 * terrain.profile.lightIntensity);
    key.position.set(58, 76, 24);
    this.scene.add(key);

    const fill = new DirectionalLight(gradientColor(terrain.config.elevationGradient, 0.35, 0x9fb6cb), 0.45);
    fill.position.set(-28, 18, -35);
    this.scene.add(fill);

    const horizon = new DirectionalLight(gradientColor(terrain.config.depthGradient, 0.65, 0x7294b0), 0.26);
    horizon.position.set(0, -10, 58);
    this.scene.add(horizon);

    this.postFx = new PlanetPostFx(this.renderer, this.scene, this.camera);
    this.postFx.setBloom(terrain.config.postfx.bloom);
  }

  mount() {
    this.host.appendChild(this.renderer.domElement);
  }

  resize(width: number, height: number) {
    const safeWidth = Math.max(1, width);
    const safeHeight = Math.max(1, height);
    this.camera.aspect = safeWidth / safeHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(safeWidth, safeHeight, false);
    this.postFx.resize(safeWidth, safeHeight);
  }

  update() {
    this.postFx.render();
  }

  destroy() {
    this.postFx.dispose();
    this.renderer.dispose();
    this.disposeSceneTree(this.scene);
    this.renderer.domElement.remove();
  }

  private disposeSceneTree(root: Object3D) {
    root.traverse((object) => {
      const mesh = object as Mesh;
      const geometry = mesh.geometry as BufferGeometry | undefined;
      if (geometry) geometry.dispose();

      const material = mesh.material as Material | Material[] | undefined;
      if (!material) return;
      if (Array.isArray(material)) {
        material.forEach((entry) => entry.dispose());
      } else {
        material.dispose();
      }
    });
  }
}

function gradientColor(stops: { anchor: number; color: [number, number, number] }[], sample: number, fallback: number) {
  if (stops.length === 0) return new Color(fallback);
  if (stops.length === 1) return new Color(...stops[0].color);
  if (sample <= stops[0].anchor) return new Color(...stops[0].color);

  for (let i = 1; i < stops.length; i += 1) {
    if (sample <= stops[i].anchor) {
      const prev = stops[i - 1];
      const next = stops[i];
      const span = Math.max(0.0001, next.anchor - prev.anchor);
      const t = Math.min(1, Math.max(0, (sample - prev.anchor) / span));
      return new Color(
        prev.color[0] + (next.color[0] - prev.color[0]) * t,
        prev.color[1] + (next.color[1] - prev.color[1]) * t,
        prev.color[2] + (next.color[2] - prev.color[2]) * t,
      );
    }
  }

  const tail = stops[stops.length - 1];
  return new Color(...tail.color);
}
