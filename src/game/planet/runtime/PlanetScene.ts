import * as THREE from 'three';
import { generateSeededStarfield } from '@/game/render/starfield';

export class PlanetScene {
  readonly scene = new THREE.Scene();
  readonly root = new THREE.Group();
  readonly camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  private stars: THREE.Points | null = null;

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
    const starPoints = generateSeededStarfield(0xdecafbad, 1800, { min: 8, max: 18 });
    const positions = new Float32Array(starPoints.length * 3);

    for (let i = 0; i < starPoints.length; i += 1) {
      const star = starPoints[i];
      positions[i * 3] = star.x;
      positions[i * 3 + 1] = star.y;
      positions[i * 3 + 2] = star.z;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xbfd8ff,
      size: 0.03,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });

    this.stars = new THREE.Points(geometry, material);
    this.scene.add(this.stars);
  }
}
