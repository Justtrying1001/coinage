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
import { createFrozenTerrainMesh } from '@/game/city/terrain/createFrozenTerrainMesh';

export class CitySceneController {
  readonly renderer: WebGLRenderer;
  readonly camera: PerspectiveCamera;

  private readonly scene: Scene;
  private readonly terrain: Mesh;

  constructor(
    private readonly host: HTMLDivElement,
    seed: number,
  ) {
    this.renderer = new WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.domElement.className = 'render-surface render-surface--city3d';

    this.camera = new PerspectiveCamera(46, 1, 0.1, 320);
    this.camera.position.set(32, 26, 30);
    this.camera.lookAt(new Vector3(0, 2.5, 0));

    this.scene = new Scene();
    this.scene.background = new Color(0x92a8ba);
    this.scene.fog = new Fog(0x9eb2c3, 38, 110);

    this.terrain = createFrozenTerrainMesh(seed);
    this.scene.add(this.terrain);

    const key = new DirectionalLight(0xe6f0ff, 1.2);
    key.position.set(34, 40, 18);
    this.scene.add(key);

    const fill = new DirectionalLight(0xb3d0ef, 0.45);
    fill.position.set(-22, 14, -26);
    this.scene.add(fill);

    const bounce = new DirectionalLight(0x7796b2, 0.25);
    bounce.position.set(0, -12, 18);
    this.scene.add(bounce);
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
  }

  update() {
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
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
