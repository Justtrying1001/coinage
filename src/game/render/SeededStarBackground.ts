import * as THREE from 'three';
import { generateSeededStarfield, type StarPoint } from '@/game/render/starfield';

export interface StarBackgroundConfig {
  seed: number;
  count: number;
  radiusRange: { min: number; max: number };
}

export class SeededStarBackground {
  private readonly stars: StarPoint[];

  constructor(config: StarBackgroundConfig) {
    this.stars = generateSeededStarfield(config.seed, config.count, config.radiusRange);
  }

  createThreePoints() {
    const positions = new Float32Array(this.stars.length * 3);
    for (let i = 0; i < this.stars.length; i += 1) {
      const star = this.stars[i];
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

    return new THREE.Points(geometry, material);
  }

  renderToWorld2D(
    ctx: CanvasRenderingContext2D,
    worldWidth: number,
    worldHeight: number,
  ) {
    for (const star of this.stars) {
      const x = normalize(star.x, -18, 18) * worldWidth;
      const y = normalize(star.y, -18, 18) * worldHeight;
      ctx.fillStyle = `rgba(191, 216, 255, ${0.08 + star.intensity * 0.15})`;
      ctx.beginPath();
      ctx.arc(x, y, 0.45 + star.size * 0.75, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function normalize(value: number, min: number, max: number) {
  if (max <= min) return 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}
