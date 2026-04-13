import * as THREE from 'three';
import { createSeededNoise3D } from '@/game/planet/generation/noise/seededNoise';
import type { CityLayoutSnapshot } from '@/game/city/layout/cityLayout';
import type { CityBiomeDescriptor } from '@/game/city/biome/cityBiomeDescriptor';

export class CityTerrainRuntime {
  readonly renderer: THREE.WebGLRenderer;

  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(46, 1, 0.1, 120);
  private root: THREE.Group | null = null;
  private elapsed = 0;

  constructor(private readonly host: HTMLDivElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x02060c, 1);
    this.host.appendChild(this.renderer.domElement);

    this.camera.position.set(0, 7.8, 8.6);
    this.camera.lookAt(0, 0.6, 0);

    const hemi = new THREE.HemisphereLight(0xcde9ff, 0x1f2735, 0.96);
    const key = new THREE.DirectionalLight(0xfff0da, 1.15);
    key.position.set(6, 9, 4);
    this.scene.add(hemi, key);
  }

  rebuild(descriptor: CityBiomeDescriptor, snapshot: CityLayoutSnapshot, seed: number) {
    this.root?.removeFromParent();
    this.disposeRoot(this.root);

    const root = new THREE.Group();
    root.add(this.buildPerimeter(descriptor, seed));
    root.add(this.buildTerrain(descriptor, seed));
    root.add(this.buildFoundations(descriptor, snapshot, seed));
    root.add(this.buildAtmospherics(descriptor, seed));

    this.scene.add(root);
    this.root = root;
  }

  resize(width: number, height: number) {
    const w = Math.max(1, Math.floor(width));
    const h = Math.max(1, Math.floor(height));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  update(deltaMs: number) {
    this.elapsed += deltaMs * 0.001;
    if (this.root) {
      this.root.rotation.y = Math.sin(this.elapsed * 0.08) * 0.02;
    }
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    this.disposeRoot(this.root);
    this.root = null;
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private buildPerimeter(descriptor: CityBiomeDescriptor, seed: number) {
    const group = new THREE.Group();
    const rng = createSeededNoise3D(seed ^ 0x52f53b7a);

    const baseColor = new THREE.Color(descriptor.secondaryAccents[0]);
    const midColor = new THREE.Color(descriptor.secondaryAccents[1]);

    const ringGeometry = new THREE.RingGeometry(6.2, 9.8, 128, 3);
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: baseColor.clone().lerp(midColor, 0.45),
      roughness: 0.92,
      metalness: descriptor.minerality * 0.24,
      emissive: descriptor.surfaceMode === 'lava' ? new THREE.Color(0xaa3a18) : new THREE.Color(0x000000),
      emissiveIntensity: descriptor.surfaceMode === 'lava' ? 0.55 : 0,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
    });

    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.88;
    group.add(ring);

    const shardCount = Math.round(18 + descriptor.peripheralDensity * 24);
    const shardGeometry = new THREE.DodecahedronGeometry(0.18, 0);
    const shardMaterial = new THREE.MeshStandardMaterial({
      color: midColor,
      roughness: 0.84,
      metalness: descriptor.minerality * 0.3,
      transparent: true,
      opacity: 0.42,
    });

    const shards = new THREE.InstancedMesh(shardGeometry, shardMaterial, shardCount);
    const matrix = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    for (let i = 0; i < shardCount; i += 1) {
      const t = i / shardCount;
      const angle = t * Math.PI * 2;
      const radius = 6.9 + (rng(Math.cos(angle), Math.sin(angle), t) + 1) * 1.2;
      pos.set(Math.cos(angle) * radius, -0.45 + rng(i, seed, 0.2) * 0.12, Math.sin(angle) * radius);
      quat.setFromEuler(new THREE.Euler(rng(i, 0.3, 0.2) * Math.PI, rng(0.5, i, seed) * Math.PI, 0));
      scale.setScalar(0.75 + (rng(seed, i, t) + 1) * 0.22);
      matrix.compose(pos, quat, scale);
      shards.setMatrixAt(i, matrix);
    }
    group.add(shards);

    return group;
  }

  private buildTerrain(descriptor: CityBiomeDescriptor, seed: number) {
    const noise = createSeededNoise3D(seed ^ 0x91e10dab);
    const geometry = new THREE.CircleGeometry(5.8, 140);
    geometry.rotateX(-Math.PI / 2);

    const positions = geometry.getAttribute('position');
    const colors = new Float32Array(positions.count * 3);

    const lowColor = new THREE.Color(descriptor.dominantGround[0]);
    const midColor = new THREE.Color(descriptor.dominantGround[1]);
    const highColor = new THREE.Color(descriptor.dominantGround[2]);

    for (let i = 0; i < positions.count; i += 1) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const r = Math.hypot(x, z) / 5.8;
      const radialFalloff = Math.pow(1 - Math.min(r, 1), 1.8);

      const ridge = noise(x * 0.34, z * 0.34, descriptor.relief * 3.1) * 0.24;
      const micro = noise(x * 1.8, z * 1.8, descriptor.roughness * 2.1) * 0.06;
      const landformBias = landformHeightBias(descriptor.landform, x, z, r, noise);
      const y = (ridge + micro + landformBias) * radialFalloff;

      positions.setY(i, y);

      const altitude = THREE.MathUtils.clamp((y + 0.3) / 0.75, 0, 1);
      const color = lowColor.clone().lerp(midColor, altitude * 0.75).lerp(highColor, altitude * altitude * 0.56);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.66 + descriptor.roughness * 0.2,
      metalness: descriptor.minerality * 0.25,
      emissive: descriptor.surfaceMode === 'lava' ? new THREE.Color(0x7a2810) : new THREE.Color(0x000000),
      emissiveIntensity: descriptor.surfaceMode === 'lava' ? 0.23 + descriptor.thermal * 0.42 : 0,
    });

    return new THREE.Mesh(geometry, material);
  }

  private buildFoundations(descriptor: CityBiomeDescriptor, snapshot: CityLayoutSnapshot, seed: number) {
    const group = new THREE.Group();
    const rng = createSeededNoise3D(seed ^ 0xbb67ae85);

    const geometry = new THREE.BoxGeometry(0.9, 0.08, 0.62);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(descriptor.secondaryAccents[2]).lerp(new THREE.Color(0xbfd3df), 0.15),
      roughness: 0.54,
      metalness: descriptor.minerality * 0.32,
      transparent: true,
      opacity: 0.87,
    });

    const maxPatches = 74;
    const mesh = new THREE.InstancedMesh(geometry, material, maxPatches);
    const matrix = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    let count = 0;

    for (let y = 1; y < snapshot.grid.height - 1; y += 1) {
      for (let x = 1; x < snapshot.grid.width - 1; x += 1) {
        if (count >= maxPatches) break;
        const key = `${x},${y}`;
        if (snapshot.blocked.has(key) || snapshot.roads.has(key)) continue;
        if (rng(x * 0.42, y * 0.33, descriptor.humidity * 3) > 0.23) continue;

        const nx = ((x / snapshot.grid.width) - 0.5) * 9;
        const nz = ((y / snapshot.grid.height) - 0.5) * 6.3;
        const zoneBoost = snapshot.expansion.has(key) ? 0.8 : 1;

        pos.set(nx, 0.08 + rng(nx, nz, 0.2) * 0.03, nz);
        quat.setFromEuler(new THREE.Euler(0, rng(nx * 0.5, nz * 0.5, 0.7) * 0.18, 0));
        scale.set(0.86 * zoneBoost + (rng(nx, 0.1, nz) + 1) * 0.09, 1, 0.88 * zoneBoost + (rng(nz, 0.1, nx) + 1) * 0.08);
        matrix.compose(pos, quat, scale);
        mesh.setMatrixAt(count, matrix);
        count += 1;
      }
    }

    mesh.count = count;
    group.add(mesh);
    return group;
  }

  private buildAtmospherics(descriptor: CityBiomeDescriptor, seed: number) {
    const group = new THREE.Group();
    const rng = createSeededNoise3D(seed ^ 0xa54ff53a);

    const puffGeometry = new THREE.PlaneGeometry(0.9, 0.42);
    puffGeometry.rotateX(-Math.PI / 2);
    const puffMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(descriptor.secondaryAccents[1]),
      transparent: true,
      opacity: descriptor.surfaceMode === 'lava' ? 0.14 : descriptor.surfaceMode === 'ice' ? 0.1 : 0.09,
      depthWrite: false,
    });

    const puffs = new THREE.InstancedMesh(puffGeometry, puffMaterial, 28);
    const matrix = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    for (let i = 0; i < 28; i += 1) {
      const angle = (i / 28) * Math.PI * 2;
      const radius = 2 + (rng(i, seed, descriptor.peripheralDensity) + 1) * 1.8;
      pos.set(Math.cos(angle) * radius, 0.14 + (rng(seed, i, 0.5) + 1) * 0.06, Math.sin(angle) * radius);
      quat.setFromEuler(new THREE.Euler(0, angle + rng(i, 0.2, 0.1) * 0.2, 0));
      scale.set(0.8 + (rng(i, 0.8, seed) + 1) * 0.5, 1, 0.65 + (rng(seed, 0.4, i) + 1) * 0.4);
      matrix.compose(pos, quat, scale);
      puffs.setMatrixAt(i, matrix);
    }

    group.add(puffs);
    return group;
  }

  private disposeRoot(root: THREE.Group | null) {
    if (!root) return;
    root.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.InstancedMesh) {
        obj.geometry.dispose();
        const material = obj.material;
        if (Array.isArray(material)) material.forEach((m) => m.dispose());
        else material.dispose();
      }
    });
    root.removeFromParent();
  }
}

function landformHeightBias(
  landform: CityBiomeDescriptor['landform'],
  x: number,
  z: number,
  radial: number,
  noise: ReturnType<typeof createSeededNoise3D>,
) {
  if (landform === 'archipelago') {
    return Math.max(0, 0.2 - radial * 0.24) + Math.sin(x * 1.2) * 0.04 + noise(x * 0.7, z * 0.7, 0.5) * 0.07;
  }
  if (landform === 'ice-shelf') {
    return Math.max(0, 0.22 - radial * 0.2) + noise(x * 0.5, z * 0.45, 0.9) * 0.05;
  }
  if (landform === 'caldera') {
    return -Math.max(0, 0.18 - Math.abs(radial - 0.4) * 0.52) + noise(x * 0.8, z * 0.8, 0.4) * 0.08;
  }
  if (landform === 'canopy-clearing') {
    return Math.max(0, 0.17 - radial * 0.28) + noise(x * 1.2, z * 1.2, 0.1) * 0.04;
  }
  return Math.max(0, 0.2 - radial * 0.24) + noise(x * 0.65, z * 0.65, 0.2) * 0.05;
}
