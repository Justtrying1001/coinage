import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  Mesh,
  MeshStandardMaterial,
  Vector3,
} from 'three';
import { SeededRng } from '@/game/world/rng';
import type { CitySiteContext } from '@/game/city/scene/CitySiteContext';

const TERRAIN_SIZE = 84;
const TERRAIN_SEGMENTS = 140;

export class CityTerrainRuntime {
  readonly group = new Group();
  readonly terrainMesh: Mesh;

  private readonly heights: Float32Array;
  private readonly resolution = TERRAIN_SEGMENTS + 1;
  private readonly cellSize = TERRAIN_SIZE / TERRAIN_SEGMENTS;
  private readonly material: MeshStandardMaterial;

  constructor(private readonly context: CitySiteContext) {
    const geometry = new BufferGeometry();
    const vertexCount = this.resolution * this.resolution;
    const positions = new Float32Array(vertexCount * 3);
    this.heights = new Float32Array(vertexCount);

    const half = TERRAIN_SIZE / 2;
    const rng = new SeededRng(context.siteSeed ^ 0xa511e9b3);

    for (let zi = 0; zi < this.resolution; zi += 1) {
      for (let xi = 0; xi < this.resolution; xi += 1) {
        const i = zi * this.resolution + xi;
        const x = (xi / TERRAIN_SEGMENTS) * TERRAIN_SIZE - half;
        const z = (zi / TERRAIN_SEGMENTS) * TERRAIN_SIZE - half;
        const y = this.computeHeight(x, z, rng);

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        this.heights[i] = y;
      }
    }

    const indices: number[] = [];
    for (let zi = 0; zi < TERRAIN_SEGMENTS; zi += 1) {
      for (let xi = 0; xi < TERRAIN_SEGMENTS; xi += 1) {
        const a = zi * this.resolution + xi;
        const b = a + 1;
        const c = a + this.resolution;
        const d = c + 1;

        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    this.paintVertexColors(geometry);

    this.material = new MeshStandardMaterial({
      color: context.biome.terrainMid,
      roughness: 0.92,
      metalness: 0.04,
      vertexColors: true,
    });

    this.terrainMesh = new Mesh(geometry, this.material);
    this.terrainMesh.receiveShadow = true;
    this.terrainMesh.castShadow = false;
    this.group.add(this.terrainMesh);

    const horizonRing = new Mesh(
      new BufferGeometry().copy(geometry),
      new MeshStandardMaterial({
        color: context.biome.rock,
        roughness: 0.98,
        metalness: 0.02,
        transparent: true,
        opacity: 0.22,
      }),
    );
    horizonRing.scale.setScalar(1.24);
    horizonRing.position.y = -5.6;
    this.group.add(horizonRing);
  }

  sampleHeight(x: number, z: number): number {
    const half = TERRAIN_SIZE / 2;
    const localX = x + half;
    const localZ = z + half;

    const fx = clamp(localX / this.cellSize, 0, TERRAIN_SEGMENTS - 0.001);
    const fz = clamp(localZ / this.cellSize, 0, TERRAIN_SEGMENTS - 0.001);

    const x0 = Math.floor(fx);
    const z0 = Math.floor(fz);
    const x1 = x0 + 1;
    const z1 = z0 + 1;
    const tx = fx - x0;
    const tz = fz - z0;

    const h00 = this.heights[z0 * this.resolution + x0];
    const h10 = this.heights[z0 * this.resolution + x1];
    const h01 = this.heights[z1 * this.resolution + x0];
    const h11 = this.heights[z1 * this.resolution + x1];

    const h0 = h00 + (h10 - h00) * tx;
    const h1 = h01 + (h11 - h01) * tx;
    return h0 + (h1 - h0) * tz;
  }

  sampleNormal(x: number, z: number): Vector3 {
    const eps = this.cellSize * 0.8;
    const hL = this.sampleHeight(x - eps, z);
    const hR = this.sampleHeight(x + eps, z);
    const hD = this.sampleHeight(x, z - eps);
    const hU = this.sampleHeight(x, z + eps);

    const normal = new Vector3(hL - hR, eps * 2, hD - hU);
    return normal.normalize();
  }

  dispose() {
    this.group.traverse((object) => {
      const mesh = object as Mesh;
      mesh.geometry?.dispose();
      const material = mesh.material as MeshStandardMaterial | MeshStandardMaterial[] | undefined;
      if (!material) return;
      if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
      else material.dispose();
    });
  }

  private computeHeight(x: number, z: number, rng: SeededRng): number {
    const profile = this.context.planetProfile;
    const radial = Math.hypot(x, z) / (TERRAIN_SIZE * 0.5);
    const macro = Math.sin((x * 0.08 + this.context.siteSeed * 0.00002) * profile.continentScale) * 0.9;
    const ridges = Math.abs(Math.sin((x * 0.16 + z * 0.14) * profile.ridgeScale * 0.12)) * profile.ridgeWeight * 4.4;
    const basins = -Math.cos((x * 0.06 - z * 0.07) * (2 + profile.craterScale * 0.08)) * profile.craterWeight * 2.6;
    const drift = Math.sin((x + z) * 0.24) * 0.4 + Math.cos((x - z) * 0.19) * 0.35;
    const polarShelf = Math.cos(z * 0.04) * profile.polarWeight * 1.6;
    const edgeDrop = -Math.pow(Math.max(0, radial - 0.72), 2.1) * 24;
    const noise = rng.range(-0.08, 0.08);

    return macro * profile.reliefStrength * 8 + ridges + basins + drift + polarShelf + edgeDrop + noise;
  }

  private paintVertexColors(geometry: BufferGeometry) {
    const colors = new Float32Array(this.resolution * this.resolution * 3);
    const low = new Color(this.context.biome.terrainLow);
    const mid = new Color(this.context.biome.terrainMid);
    const high = new Color(this.context.biome.terrainHigh);

    for (let i = 0; i < this.heights.length; i += 1) {
      const h = this.heights[i];
      const t = clamp((h + 7) / 15, 0, 1);
      const c = t < 0.55 ? low.clone().lerp(mid, t / 0.55) : mid.clone().lerp(high, (t - 0.55) / 0.45);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geometry.setAttribute('color', new BufferAttribute(colors, 3));
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
