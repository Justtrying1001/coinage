import * as THREE from 'three';
import { SeededStarBackground } from '@/game/render/SeededStarBackground';

export class PlanetScene {
  readonly scene = new THREE.Scene();
  readonly root = new THREE.Group();
  readonly camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  private stars: THREE.Points | null = null;
  private readonly starBackground = new SeededStarBackground({
    seed: 0xdecafbad,
    count: 1800,
    radiusRange: { min: 8, max: 18 },
  });

  constructor() {
    this.scene.background = new THREE.Color(0x02050d);
    this.camera.position.set(0, 0, 2.65);
    this.scene.add(this.camera);
    this.scene.add(this.root);
    this.createStarfield();
  }

  setSize(width: number, height: number) {
    this.camera.aspect = Math.max(1, width) / Math.max(1, height);
    this.camera.updateProjectionMatrix();
  }

  update(deltaMs: number) {
    if (this.stars) this.stars.rotation.y += deltaMs * 0.00001;
  }

  dispose() {
    if (this.stars) {
      this.scene.remove(this.stars);
      this.stars.geometry.dispose();
      (this.stars.material as THREE.Material).dispose();
      this.stars = null;
    }
    this.scene.clear();
  }

  private createStarfield() {
    this.stars = this.starBackground.createThreePoints();
    this.scene.add(this.stars);
  }
}
