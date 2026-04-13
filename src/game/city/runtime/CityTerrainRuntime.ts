import * as THREE from 'three';
import { createSeededNoise3D } from '@/game/planet/generation/noise/seededNoise';
import type { CityLayoutSnapshot } from '@/game/city/layout/cityLayout';
import type { CityBiomeDescriptor } from '@/game/city/biome/cityBiomeDescriptor';

const TERRAIN_WIDTH = 18;
const TERRAIN_DEPTH = 12;
const TERRAIN_SEG_X = 240;
const TERRAIN_SEG_Z = 160;

export class CityTerrainRuntime {
  readonly renderer: THREE.WebGLRenderer;

  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(50, 1, 0.1, 160);
  private root: THREE.Group | null = null;
  private elapsed = 0;

  constructor(private readonly host: HTMLDivElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.04;
    this.renderer.setClearColor(0x04080e, 1);
    this.host.appendChild(this.renderer.domElement);

    this.camera.position.set(0, 7.4, 8.8);
    this.camera.lookAt(0, 0.2, 0);

    const hemi = new THREE.HemisphereLight(0xd9ecff, 0x293244, 0.96);
    const key = new THREE.DirectionalLight(0xfff1dd, 1.1);
    key.position.set(9, 11, 6);
    const fill = new THREE.DirectionalLight(0x84b4de, 0.34);
    fill.position.set(-7, 5, -8);

    this.scene.add(hemi, key, fill);
  }

  rebuild(descriptor: CityBiomeDescriptor, snapshot: CityLayoutSnapshot, seed: number) {
    this.disposeRoot(this.root);

    const root = new THREE.Group();
    const noise = createSeededNoise3D(seed ^ 0x42f0e1eb);

    const terrain = this.buildTerrainMesh(descriptor, seed, noise);
    root.add(this.buildPerimeterShell(descriptor, seed));
    root.add(terrain);
    root.add(this.buildStabilizedTerraces(descriptor, snapshot, seed, noise));
    root.add(this.buildSetDressing(descriptor, seed, noise));

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
      this.root.rotation.y = Math.sin(this.elapsed * 0.09) * 0.015;
    }
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    this.disposeRoot(this.root);
    this.root = null;
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private buildTerrainMesh(descriptor: CityBiomeDescriptor, seed: number, noise: ReturnType<typeof createSeededNoise3D>) {
    const geometry = new THREE.PlaneGeometry(TERRAIN_WIDTH, TERRAIN_DEPTH, TERRAIN_SEG_X, TERRAIN_SEG_Z);
    geometry.rotateX(-Math.PI / 2);

    const positions = geometry.getAttribute('position');
    const heightAttr = new Float32Array(positions.count);

    let minHeight = Number.POSITIVE_INFINITY;
    let maxHeight = Number.NEGATIVE_INFINITY;

    for (let i = 0; i < positions.count; i += 1) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const y = evaluateTerrainHeight(x, z, descriptor, noise);
      positions.setY(i, y);
      minHeight = Math.min(minHeight, y);
      maxHeight = Math.max(maxHeight, y);
    }

    for (let i = 0; i < positions.count; i += 1) {
      const y = positions.getY(i);
      heightAttr[i] = normalize(y, minHeight, maxHeight);
    }

    geometry.setAttribute('aHeight', new THREE.BufferAttribute(heightAttr, 1));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(descriptor.dominantGround[1]),
      roughness: 0.62 + descriptor.roughness * 0.22,
      metalness: 0.05 + descriptor.minerality * 0.28,
      emissive: descriptor.surfaceMode === 'lava' ? new THREE.Color(0x5e1b0d) : new THREE.Color(0x000000),
      emissiveIntensity: descriptor.surfaceMode === 'lava' ? 0.18 + descriptor.thermal * 0.24 : 0,
    });

    patchTerrainShader(material, descriptor, seed);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = false;
    return mesh;
  }

  private buildPerimeterShell(descriptor: CityBiomeDescriptor, seed: number) {
    const group = new THREE.Group();
    const shellGeometry = new THREE.PlaneGeometry(34, 24, 1, 1);
    shellGeometry.rotateX(-Math.PI / 2);

    const c0 = new THREE.Color(descriptor.secondaryAccents[0]);
    const c1 = new THREE.Color(descriptor.secondaryAccents[1]);
    const color = c0.lerp(c1, 0.4);

    const shellMaterial = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.9,
      metalness: descriptor.minerality * 0.18,
      emissive: descriptor.surfaceMode === 'lava' ? new THREE.Color(0x702812) : new THREE.Color(0x000000),
      emissiveIntensity: descriptor.surfaceMode === 'lava' ? 0.3 : 0,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
    });

    const shell = new THREE.Mesh(shellGeometry, shellMaterial);
    shell.position.y = -1.02;
    group.add(shell);

    const rng = createSeededNoise3D(seed ^ 0x94d049bb);
    const shardCount = Math.round(20 + descriptor.peripheralDensity * 38);

    const shardGeometry = descriptor.surfaceMode === 'ice'
      ? new THREE.ConeGeometry(0.12, 0.42, 5)
      : descriptor.surfaceMode === 'lava'
        ? new THREE.DodecahedronGeometry(0.18, 0)
        : new THREE.IcosahedronGeometry(0.14, 0);

    const shardMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(descriptor.secondaryAccents[2]),
      roughness: 0.78,
      metalness: descriptor.minerality * 0.33,
      transparent: true,
      opacity: 0.58,
    });

    const mesh = new THREE.InstancedMesh(shardGeometry, shardMaterial, shardCount);
    const matrix = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    for (let i = 0; i < shardCount; i += 1) {
      const t = i / shardCount;
      const angle = t * Math.PI * 2;
      const radius = 9.8 + (rng(Math.cos(angle), Math.sin(angle), t) + 1) * 3.2;
      pos.set(Math.cos(angle) * radius, -0.72 + rng(i, seed, 0.3) * 0.18, Math.sin(angle) * radius);
      quat.setFromEuler(new THREE.Euler(rng(i, 0.3, 0.2) * 0.6, rng(0.5, i, seed) * Math.PI, 0));
      scale.setScalar(0.55 + (rng(seed, i, t) + 1) * 0.26);
      matrix.compose(pos, quat, scale);
      mesh.setMatrixAt(i, matrix);
    }
    group.add(mesh);

    return group;
  }

  private buildStabilizedTerraces(
    descriptor: CityBiomeDescriptor,
    snapshot: CityLayoutSnapshot,
    seed: number,
    noise: ReturnType<typeof createSeededNoise3D>,
  ) {
    const group = new THREE.Group();

    const geometry = new THREE.BoxGeometry(0.84, 0.06, 0.56);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(descriptor.secondaryAccents[2]).lerp(new THREE.Color(0xc8d9e3), 0.1),
      roughness: 0.5,
      metalness: descriptor.minerality * 0.3,
      transparent: true,
      opacity: 0.82,
    });

    const maxPatches = 92;
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

        const nx = ((x / snapshot.grid.width) - 0.5) * (TERRAIN_WIDTH * 0.72);
        const nz = ((y / snapshot.grid.height) - 0.5) * (TERRAIN_DEPTH * 0.72);

        if (Math.hypot(nx / 7.5, nz / 4.8) > 1) continue;
        if (noise(nx * 0.32, nz * 0.32, seed * 0.00001) > 0.1) continue;

        const zoneBoost = snapshot.expansion.has(key) ? 0.82 : 1;
        const baseY = evaluateTerrainHeight(nx, nz, descriptor, noise);

        pos.set(nx, baseY + 0.035, nz);
        quat.setFromEuler(new THREE.Euler(0, noise(nx * 0.2, nz * 0.2, 0.8) * 0.26, 0));
        scale.set(
          0.88 * zoneBoost + (noise(nx, 0.3, nz) + 1) * 0.08,
          1,
          0.9 * zoneBoost + (noise(nz, 0.2, nx) + 1) * 0.08,
        );

        matrix.compose(pos, quat, scale);
        mesh.setMatrixAt(count, matrix);
        count += 1;
      }
    }

    mesh.count = count;
    group.add(mesh);
    return group;
  }

  private buildSetDressing(descriptor: CityBiomeDescriptor, seed: number, noise: ReturnType<typeof createSeededNoise3D>) {
    const group = new THREE.Group();
    const count = Math.round(44 + descriptor.peripheralDensity * 56);

    const geometry = selectBiomeDecoratorGeometry(descriptor);
    const material = new THREE.MeshStandardMaterial({
      color: selectBiomeDecoratorColor(descriptor),
      roughness: 0.78,
      metalness: descriptor.minerality * 0.34,
      emissive: descriptor.surfaceMode === 'lava' ? new THREE.Color(0x6b2412) : new THREE.Color(0x000000),
      emissiveIntensity: descriptor.surfaceMode === 'lava' ? 0.18 : 0,
    });

    const mesh = new THREE.InstancedMesh(geometry, material, count);
    const matrix = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2 + noise(i, seed, 0.3) * 0.2;
      const radius = 4.5 + (noise(i * 0.2, seed, descriptor.humidity) + 1) * 3.6;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = evaluateTerrainHeight(x, z, descriptor, noise);

      pos.set(x, y + 0.06, z);
      quat.setFromEuler(new THREE.Euler(noise(i, 0.2, seed) * 0.2, noise(0.2, i, seed) * Math.PI, 0));
      scale.setScalar(0.46 + (noise(seed, i, 0.8) + 1) * 0.27);
      matrix.compose(pos, quat, scale);
      mesh.setMatrixAt(i, matrix);
    }

    group.add(mesh);
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

function patchTerrainShader(material: THREE.MeshStandardMaterial, descriptor: CityBiomeDescriptor, seed: number) {
  const low = new THREE.Color(descriptor.dominantGround[0]);
  const mid = new THREE.Color(descriptor.dominantGround[1]);
  const high = new THREE.Color(descriptor.dominantGround[2]);
  const accent = new THREE.Color(descriptor.secondaryAccents[2]);

  material.onBeforeCompile = (shader) => {
    shader.uniforms['uBiomeLow'] = { value: low };
    shader.uniforms['uBiomeMid'] = { value: mid };
    shader.uniforms['uBiomeHigh'] = { value: high };
    shader.uniforms['uBiomeAccent'] = { value: accent };
    shader.uniforms['uHumidity'] = { value: descriptor.humidity };
    shader.uniforms['uDryness'] = { value: descriptor.dryness };
    shader.uniforms['uFrost'] = { value: descriptor.frost };
    shader.uniforms['uThermal'] = { value: descriptor.thermal };
    shader.uniforms['uMinerality'] = { value: descriptor.minerality };
    shader.uniforms['uSeedPhase'] = { value: ((seed % 1009) / 1009) * Math.PI * 2 };

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aHeight;\nvarying float vHeight;\nvarying vec3 vWorldPos;\nvarying vec3 vWorldNormal;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvHeight = aHeight;')
      .replace(
        '#include <worldpos_vertex>',
        '#include <worldpos_vertex>\nvWorldPos = worldPosition.xyz;\nvWorldNormal = normalize(mat3(modelMatrix) * objectNormal);',
      );

    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
varying float vHeight;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
uniform vec3 uBiomeLow;
uniform vec3 uBiomeMid;
uniform vec3 uBiomeHigh;
uniform vec3 uBiomeAccent;
uniform float uHumidity;
uniform float uDryness;
uniform float uFrost;
uniform float uThermal;
uniform float uMinerality;
uniform float uSeedPhase;`)
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        float slope = 1.0 - clamp(dot(normalize(vWorldNormal), vec3(0.0, 1.0, 0.0)), 0.0, 1.0);
        float heightBlend = smoothstep(0.08, 0.92, vHeight);
        float wetPocket = smoothstep(0.16, 0.56, 1.0 - vHeight) * uHumidity;
        float dryRidge = smoothstep(0.35, 0.92, vHeight + slope * 0.3) * uDryness;
        float coldCap = smoothstep(0.5, 1.0, vHeight + slope * 0.2) * uFrost;
        float thermalVein = smoothstep(0.45, 0.95, slope + sin(vWorldPos.x * 1.4 + vWorldPos.z * 1.7 + uSeedPhase) * 0.25) * uThermal;
        vec3 baseCol = mix(uBiomeLow, uBiomeMid, heightBlend);
        baseCol = mix(baseCol, uBiomeHigh, smoothstep(0.58, 1.0, heightBlend + slope * 0.15));
        baseCol = mix(baseCol, uBiomeAccent, thermalVein * 0.42 + uMinerality * slope * 0.25);
        baseCol = mix(baseCol, uBiomeLow * 0.82, wetPocket * 0.35);
        baseCol = mix(baseCol, vec3(0.82, 0.9, 0.98), coldCap * 0.42);
        baseCol = mix(baseCol, vec3(0.18, 0.15, 0.14), dryRidge * 0.28);
        diffuseColor.rgb *= baseCol;`,
      );
  };

  material.needsUpdate = true;
}

function selectBiomeDecoratorGeometry(descriptor: CityBiomeDescriptor) {
  if (descriptor.archetype === 'jungle') return new THREE.ConeGeometry(0.16, 0.44, 6);
  if (descriptor.archetype === 'frozen') return new THREE.ConeGeometry(0.14, 0.56, 5);
  if (descriptor.archetype === 'volcanic') return new THREE.DodecahedronGeometry(0.2, 0);
  if (descriptor.archetype === 'mineral') return new THREE.OctahedronGeometry(0.2, 0);
  if (descriptor.archetype === 'oceanic') return new THREE.IcosahedronGeometry(0.14, 0);
  if (descriptor.archetype === 'arid') return new THREE.BoxGeometry(0.24, 0.22, 0.18);
  if (descriptor.archetype === 'barren') return new THREE.BoxGeometry(0.22, 0.19, 0.16);
  return new THREE.IcosahedronGeometry(0.16, 0);
}

function selectBiomeDecoratorColor(descriptor: CityBiomeDescriptor) {
  if (descriptor.archetype === 'jungle') return new THREE.Color(0x3f6945);
  if (descriptor.archetype === 'frozen') return new THREE.Color(0x98c3df);
  if (descriptor.archetype === 'volcanic') return new THREE.Color(0x5d2c25);
  if (descriptor.archetype === 'mineral') return new THREE.Color(0x8a8697);
  if (descriptor.archetype === 'oceanic') return new THREE.Color(0x4f7f8f);
  if (descriptor.archetype === 'arid') return new THREE.Color(0x8c6a44);
  if (descriptor.archetype === 'barren') return new THREE.Color(0x6f6258);
  return new THREE.Color(0x52705d);
}

function evaluateTerrainHeight(
  x: number,
  z: number,
  descriptor: CityBiomeDescriptor,
  noise: ReturnType<typeof createSeededNoise3D>,
) {
  const nx = x / (TERRAIN_WIDTH * 0.5);
  const nz = z / (TERRAIN_DEPTH * 0.5);
  const radial = Math.hypot(nx, nz);
  const edgeFade = THREE.MathUtils.clamp(1 - Math.pow(radial, 1.9), 0, 1);

  const macro = noise(nx * 1.2, nz * 1.2, descriptor.relief * 2.3) * (0.42 + descriptor.relief * 0.28);
  const micro = noise(nx * 5.4, nz * 5.4, descriptor.roughness * 3.2) * (0.11 + descriptor.roughness * 0.08);
  const landform = landformHeightBias(descriptor.landform, nx, nz, radial, noise);

  const shelf = descriptor.archetype === 'oceanic' ? -Math.max(0, radial - 0.74) * 1.1 : 0;
  const volcanicBowl = descriptor.archetype === 'volcanic' ? -Math.max(0, 0.28 - radial) * 0.35 : 0;

  return (macro + micro + landform + shelf + volcanicBowl) * edgeFade;
}

function landformHeightBias(
  landform: CityBiomeDescriptor['landform'],
  x: number,
  z: number,
  radial: number,
  noise: ReturnType<typeof createSeededNoise3D>,
) {
  if (landform === 'archipelago') {
    return Math.max(0, 0.22 - radial * 0.3) + noise(x * 2.2, z * 2.2, 0.6) * 0.11;
  }
  if (landform === 'ice-shelf') {
    return Math.max(0, 0.18 - radial * 0.22) + noise(x * 1.4, z * 1.2, 0.8) * 0.09;
  }
  if (landform === 'caldera') {
    return -Math.max(0, 0.22 - Math.abs(radial - 0.35) * 0.58) + noise(x * 1.8, z * 1.8, 0.5) * 0.1;
  }
  if (landform === 'canopy-clearing') {
    return Math.max(0, 0.16 - radial * 0.28) + noise(x * 2.4, z * 2.4, 0.2) * 0.06;
  }
  if (landform === 'mesa') {
    return Math.max(0, 0.2 - radial * 0.24) + noise(x * 1.6, z * 1.6, 0.3) * 0.08;
  }
  if (landform === 'fault-plateau') {
    return Math.max(0, 0.21 - radial * 0.27) + Math.abs(noise(x * 1.4, z * 1.4, 0.4)) * 0.08;
  }
  if (landform === 'sterile-basin') {
    return Math.max(0, 0.14 - radial * 0.22) + noise(x * 1.1, z * 1.1, 0.2) * 0.05;
  }
  return Math.max(0, 0.18 - radial * 0.24) + noise(x * 1.8, z * 1.8, 0.2) * 0.07;
}

function normalize(value: number, min: number, max: number) {
  if (max <= min) return 0;
  return THREE.MathUtils.clamp((value - min) / (max - min), 0, 1);
}
