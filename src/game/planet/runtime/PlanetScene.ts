import * as THREE from 'three';
import { SeededRng } from '@/game/world/rng';

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
    const rng = new SeededRng(0xdecafbad);
    const starCount = 1800;
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i += 1) {
      const theta = rng.range(0, Math.PI * 2);
      const phi = Math.acos(rng.range(-1, 1));
      const radius = rng.range(8, 18);
      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
      positions[i * 3 + 1] = Math.cos(phi) * radius;
      positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;
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
