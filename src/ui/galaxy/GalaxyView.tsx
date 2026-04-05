'use client';

import { useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';

import { buildGalaxyPlanetManifest } from '@/domain/world/build-galaxy-planet-manifest';
import type { PlanetVisualProfile } from '@/domain/world/planet-visual.types';
import { deriveSeed } from '@/domain/world/seeded-rng';
import { GALAXY_LAYOUT_RUNTIME_CONFIG } from '@/domain/world/world.constants';
import { createPlanetRenderInstance } from '@/rendering/planet/create-planet-render-instance';
import type { PlanetRenderInstance } from '@/rendering/planet/types';

interface GalaxyViewProps {
  worldSeed: string;
}

interface PlanetRenderData {
  id: string;
  planetSeed: string;
  x: number;
  y: number;
  radius: number;
  profile: PlanetVisualProfile;
}

const FIELD_RADIUS = GALAXY_LAYOUT_RUNTIME_CONFIG.fieldRadius ?? 84;
const MOVE_SPEED = 24;
const BASE_VIEW_HEIGHT = 90;
const GALAXY_BACKGROUND_Z = -180;
const BACKDROP_TEXTURE_CACHE = new Map<string, THREE.CanvasTexture>();

function createStarField(seed: string): THREE.Group {
  const group = new THREE.Group();
  const count = 1600;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  let state = deriveSeed(seed, 'starfield');
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };

  for (let i = 0; i < count; i += 1) {
    const radius = Math.pow(random(), 0.78) * 230 + 20;
    const theta = random() * Math.PI * 2;
    const phi = Math.acos((random() * 2 - 1) * 0.6);

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi) - 120;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const warmth = random();
    const brightness = 0.52 + random() * 0.42;
    colors[i * 3] = brightness;
    colors[i * 3 + 1] = brightness * (warmth > 0.72 ? 0.92 : 0.98);
    colors[i * 3 + 2] = Math.min(1, brightness + 0.12);
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.5,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.82,
  });

  const primary = new THREE.Points(geometry, material);
  group.add(primary);

  const accentGeometry = new THREE.BufferGeometry();
  const accentCount = 280;
  const accentPositions = new Float32Array(accentCount * 3);
  for (let i = 0; i < accentCount; i += 1) {
    const angle = random() * Math.PI * 2;
    const distance = 45 + Math.pow(random(), 0.45) * 210;
    accentPositions[i * 3] = Math.cos(angle) * distance;
    accentPositions[i * 3 + 1] = Math.sin(angle) * distance * 0.72;
    accentPositions[i * 3 + 2] = -130 + random() * 36;
  }
  accentGeometry.setAttribute('position', new THREE.BufferAttribute(accentPositions, 3));
  const accentMaterial = new THREE.PointsMaterial({
    color: '#cfe8ff',
    size: 1.1,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  group.add(new THREE.Points(accentGeometry, accentMaterial));

  return group;
}

function createBackdrop(seed: string): THREE.Mesh {
  let texture = BACKDROP_TEXTURE_CACHE.get(seed);
  if (!texture) {
    const textureSize = 896;
    const canvas = document.createElement('canvas');
    canvas.width = textureSize;
    canvas.height = textureSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return new THREE.Mesh();
    }

    const gradient = ctx.createRadialGradient(
      textureSize * 0.5,
      textureSize * 0.5,
      textureSize * 0.06,
      textureSize * 0.5,
      textureSize * 0.5,
      textureSize * 0.86,
    );
    gradient.addColorStop(0, '#070f1f');
    gradient.addColorStop(0.45, '#040913');
    gradient.addColorStop(1, '#010308');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, textureSize, textureSize);

    let state = deriveSeed(seed, 'nebulae');
    const random = () => {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
    };

    for (let i = 0; i < 5; i += 1) {
      const cx = textureSize * (0.2 + random() * 0.6);
      const cy = textureSize * (0.22 + random() * 0.56);
      const radius = textureSize * (0.24 + random() * 0.2);
      const nebula = ctx.createRadialGradient(cx, cy, radius * 0.03, cx, cy, radius);
      const hue = 198 + Math.floor(random() * 34);
      const alpha = 0.02 + random() * 0.016;
      nebula.addColorStop(0, `hsla(${hue}, 55%, 62%, ${alpha})`);
      nebula.addColorStop(0.62, `hsla(${hue + 8}, 44%, 49%, ${alpha * 0.42})`);
      nebula.addColorStop(1, `hsla(${hue + 12}, 38%, 44%, 0)`);
      ctx.fillStyle = nebula;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    }

    const dither = ctx.getImageData(0, 0, textureSize, textureSize);
    for (let i = 0; i < dither.data.length; i += 4) {
      const noise = Math.floor((random() - 0.5) * 8);
      dither.data[i] = Math.min(255, Math.max(0, dither.data[i] + noise));
      dither.data[i + 1] = Math.min(255, Math.max(0, dither.data[i + 1] + noise));
      dither.data[i + 2] = Math.min(255, Math.max(0, dither.data[i + 2] + noise));
    }
    ctx.putImageData(dither, 0, 0);

    for (let i = 0; i < 520; i += 1) {
      const x = random() * textureSize;
      const y = random() * textureSize;
      const size = random() < 0.12 ? 1.6 : 0.8;
      const alpha = random() < 0.18 ? 0.2 + random() * 0.2 : 0.04 + random() * 0.08;
      const hue = 200 + Math.floor(random() * 28);
      ctx.fillStyle = `hsla(${hue}, 32%, ${72 + random() * 18}%, ${alpha})`;
      ctx.fillRect(x, y, size, size);
    }

    texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    BACKDROP_TEXTURE_CACHE.set(seed, texture);
  }

  const geometry = new THREE.PlaneGeometry(520, 340);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: false,
    depthTest: false,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = GALAXY_BACKGROUND_Z;
  mesh.renderOrder = -100;
  return mesh;
}

export default function GalaxyView({ worldSeed }: GalaxyViewProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const planetData = useMemo<PlanetRenderData[]>(() => {
    return buildGalaxyPlanetManifest(worldSeed);
  }, [worldSeed]);

  useEffect(() => {
    const mount = mountRef.current;

    if (!mount) {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = null;
    const width = mount.clientWidth;
    const height = mount.clientHeight;
    const aspect = width / Math.max(1, height);
    const viewHeight = BASE_VIEW_HEIGHT;
    const viewWidth = viewHeight * aspect;
    const camera = new THREE.OrthographicCamera(
      -viewWidth / 2,
      viewWidth / 2,
      viewHeight / 2,
      -viewHeight / 2,
      0.1,
      600,
    );
    camera.position.set(0, 0, 60);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const backdrop = createBackdrop(worldSeed);
    scene.add(backdrop);

    const stars = createStarField(worldSeed);
    scene.add(stars);

    scene.add(new THREE.AmbientLight('#9fc5ff', 0.45));

    const keyLight = new THREE.DirectionalLight('#ffffff', 1.05);
    keyLight.position.set(20, 26, 44);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight('#90b5ff', 0.26);
    fillLight.position.set(-24, -12, 32);
    scene.add(fillLight);

    const planetGroup = new THREE.Group();
    const instances: PlanetRenderInstance[] = [];
    const interactivePlanetMeshes: THREE.Mesh[] = [];

    for (const planet of planetData) {
      const instance = createPlanetRenderInstance({
        profile: planet.profile,
        x: planet.x,
        y: planet.y,
        z: 0,
        options: { lod: 'galaxy' },
      });
      instance.object.userData.planetId = planet.id;
      instance.object.userData.planetSeed = planet.planetSeed;
      instance.object.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          node.userData.planetId = planet.id;
          node.userData.planetSeed = planet.planetSeed;
          interactivePlanetMeshes.push(node);
        }
      });
      instances.push(instance);
      planetGroup.add(instance.object);
    }

    scene.add(planetGroup);

    const keyState: Record<string, boolean> = {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
      w: false,
      a: false,
      s: false,
      d: false,
    };

    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key in keyState) {
        keyState[event.key] = true;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key in keyState) {
        keyState[event.key] = false;
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) {
        return;
      }

      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;

      camera.position.x -= dx * 0.04;
      camera.position.y += dy * 0.04;
    };

    const onPointerUp = () => {
      dragging = false;
    };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const onDoubleClick = (event: MouseEvent) => {
      const bounds = renderer.domElement.getBoundingClientRect();
      if (bounds.width <= 0 || bounds.height <= 0) {
        return;
      }

      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const intersections = raycaster.intersectObjects(interactivePlanetMeshes, false);
      const firstHit = intersections[0];
      if (!firstHit) {
        return;
      }

      const planetId = firstHit.object.userData.planetId as string | undefined;
      if (!planetId) {
        return;
      }

      router.push(`/planet/${planetId}`);
    };

    const onResize = () => {
      if (!mountRef.current) {
        return;
      }

      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      const aspect = width / Math.max(1, height);
      const frustumHalfHeight = BASE_VIEW_HEIGHT / 2;
      const frustumHalfWidth = frustumHalfHeight * aspect;
      camera.left = -frustumHalfWidth;
      camera.right = frustumHalfWidth;
      camera.top = frustumHalfHeight;
      camera.bottom = -frustumHalfHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('resize', onResize);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('dblclick', onDoubleClick);
    renderer.domElement.addEventListener('contextmenu', (event: MouseEvent) => event.preventDefault());
    renderer.domElement.addEventListener('wheel', (event: WheelEvent) => event.preventDefault(), { passive: false });

    let previousTime = performance.now();
    let frame = 0;

    const animate = (time: number) => {
      const delta = Math.min(0.05, (time - previousTime) / 1000);
      previousTime = time;

      let moveX = 0;
      let moveY = 0;

      if (keyState.ArrowLeft || keyState.a) moveX -= 1;
      if (keyState.ArrowRight || keyState.d) moveX += 1;
      if (keyState.ArrowUp || keyState.w) moveY += 1;
      if (keyState.ArrowDown || keyState.s) moveY -= 1;

      const length = Math.hypot(moveX, moveY) || 1;
      if (moveX !== 0 || moveY !== 0) {
        camera.position.x += (moveX / length) * MOVE_SPEED * delta;
        camera.position.y += (moveY / length) * MOVE_SPEED * delta;
      }

      camera.position.x = Math.max(-FIELD_RADIUS, Math.min(FIELD_RADIUS, camera.position.x));
      camera.position.y = Math.max(-FIELD_RADIUS, Math.min(FIELD_RADIUS, camera.position.y));

      if (frame % 3 === 0) {
        stars.rotation.z += 0.00004;
      }
      frame += 1;

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    const raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);

      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('dblclick', onDoubleClick);

      for (const instance of instances) {
        instance.dispose();
      }

      stars.traverse((node: THREE.Object3D) => {
        if (node instanceof THREE.Points) {
          node.geometry.dispose();
          if (Array.isArray(node.material)) {
            for (const mat of node.material) {
              mat.dispose();
            }
          } else {
            node.material.dispose();
          }
        }
      });

      const backdropMaterial = backdrop.material;
      if (!Array.isArray(backdropMaterial)) {
        const mapTexture = (backdropMaterial as THREE.MeshBasicMaterial).map;
        if (mapTexture && !Array.from(BACKDROP_TEXTURE_CACHE.values()).includes(mapTexture as THREE.CanvasTexture)) {
          mapTexture.dispose();
        }
      }
      if (Array.isArray(backdropMaterial)) {
        for (const mat of backdropMaterial) {
          mat.dispose();
        }
      } else {
        backdropMaterial.dispose();
      }
      backdrop.geometry.dispose();

      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [planetData, router, worldSeed]);

  return (
    <section className="relative h-full w-full overflow-hidden">
      <div className="pointer-events-none absolute left-4 top-4 z-10 max-w-sm rounded-md bg-slate-950/55 px-3 py-2 text-xs text-slate-200 shadow-lg shadow-slate-950/40 backdrop-blur-sm">
        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-300/90">Coinage Galaxy Map</p>
        <p className="mt-1 text-slate-100/90">
          <span className="font-semibold">Pan:</span> WASD / Arrow Keys / drag
        </p>
        <p className="mt-1 text-slate-100/90">
          <span className="font-semibold">Planet View:</span> double-click a planet
        </p>
      </div>
      <div className="pointer-events-auto absolute left-4 top-20 z-10">
        <Link
          href="/"
          className="inline-flex items-center rounded-md border border-slate-600/70 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-slate-400 hover:bg-slate-800/80"
        >
          Back
        </Link>
      </div>
      <div ref={mountRef} className="h-full w-full" />
    </section>
  );
}
