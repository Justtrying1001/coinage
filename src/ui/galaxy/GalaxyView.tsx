'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { generateGalaxyLayout } from '@/domain/world/generate-galaxy-layout';
import { generatePlanetVisualProfile } from '@/domain/world/generate-planet-visual-profile';
import type { PlanetVisualProfile } from '@/domain/world/planet-visual.types';
import { deriveSeed } from '@/domain/world/seeded-rng';
import { mapProfileToRenderStyle } from '@/ui/galaxy/render/map-profile-to-render';

interface GalaxyViewProps {
  worldSeed: string;
}

interface PlanetRenderData {
  id: string;
  x: number;
  y: number;
  z: number;
  profile: PlanetVisualProfile;
}

const FIELD_RADIUS = 70;
const CAMERA_Z = 34;
const MOVE_SPEED = 24;

function createGeometryVariants(): THREE.IcosahedronGeometry[] {
  const variants: THREE.IcosahedronGeometry[] = [];

  for (let i = 0; i < 8; i += 1) {
    const geometry = new THREE.IcosahedronGeometry(1, 4);
    const positions = geometry.attributes.position;

    for (let j = 0; j < positions.count; j += 1) {
      const vertex = new THREE.Vector3(positions.getX(j), positions.getY(j), positions.getZ(j));
      const n = vertex.clone().normalize();

      const macro = Math.sin(n.x * (1.5 + i * 0.2) + n.y * 1.2 + n.z * 0.8 + i * 13.17);
      const micro = Math.sin(n.x * 3.7 + n.y * 4.1 + n.z * 5.3 + i * 7.7);

      const scale = 1 + macro * 0.08 + micro * 0.02;
      vertex.multiplyScalar(scale);
      positions.setXYZ(j, vertex.x, vertex.y, vertex.z);
    }

    geometry.computeVertexNormals();
    positions.needsUpdate = true;
    variants.push(geometry);
  }

  return variants;
}

function createStarField(seed: string): THREE.Points {
  const count = 2400;
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
    const radius = Math.pow(random(), 0.65) * 240 + 15;
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi) - 85;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const brightness = 0.6 + random() * 0.4;
    colors[i * 3] = brightness;
    colors[i * 3 + 1] = brightness;
    colors[i * 3 + 2] = Math.min(1, brightness + 0.08);
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.7,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
  });

  return new THREE.Points(geometry, material);
}

export default function GalaxyView({ worldSeed }: GalaxyViewProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const planetData = useMemo<PlanetRenderData[]>(() => {
    return generateGalaxyLayout(worldSeed, {
      planetCount: 110,
      fieldRadius: FIELD_RADIUS,
      minSpacing: 7.4,
      depthRange: 10,
    }).map((planet) => ({
      ...planet,
      profile: generatePlanetVisualProfile({ worldSeed, planetSeed: planet.planetSeed }),
    }));
  }, [worldSeed]);

  useEffect(() => {
    const mount = mountRef.current;

    if (!mount) {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#020617');
    scene.fog = new THREE.FogExp2('#030712', 0.016);

    const camera = new THREE.PerspectiveCamera(54, mount.clientWidth / mount.clientHeight, 0.1, 600);
    camera.position.set(0, 0, CAMERA_Z);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const stars = createStarField(worldSeed);
    scene.add(stars);

    scene.add(new THREE.AmbientLight('#93c5fd', 0.36));

    const keyLight = new THREE.DirectionalLight('#ffffff', 1.15);
    keyLight.position.set(24, 28, 40);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight('#67e8f9', 0.3);
    fillLight.position.set(-20, -18, 20);
    scene.add(fillLight);

    const geometryVariants = createGeometryVariants();
    const planetGroup = new THREE.Group();
    const atmosphereGeometry = new THREE.SphereGeometry(1, 24, 24);

    const disposables: THREE.Material[] = [];

    for (const planet of planetData) {
      const style = mapProfileToRenderStyle(planet.profile);
      const variantIndex = deriveSeed(planet.profile.seeds.planetSeed, 'geo') % geometryVariants.length;
      const geometry = geometryVariants[variantIndex] ?? geometryVariants[0];

      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(style.baseColor),
        roughness: style.roughness,
        metalness: style.metalness,
        emissive: new THREE.Color(style.emissiveColor),
        emissiveIntensity: style.emissiveIntensity,
      });

      disposables.push(material);

      const mesh = new THREE.Mesh(geometry, material);
      const sizeScale = planet.profile.shape.radius * 0.8;
      mesh.scale.setScalar(sizeScale);
      mesh.position.set(planet.x, planet.y, planet.z);
      planetGroup.add(mesh);

      if (planet.profile.atmosphere.enabled && planet.profile.atmosphere.intensity > 0.2) {
        const atmoMaterial = new THREE.MeshBasicMaterial({
          color: new THREE.Color(style.atmosphereColor),
          transparent: true,
          opacity: Math.min(0.2, planet.profile.atmosphere.intensity * 0.26),
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        disposables.push(atmoMaterial);

        const atmo = new THREE.Mesh(atmosphereGeometry, atmoMaterial);
        atmo.scale.setScalar(sizeScale * 1.16);
        atmo.position.copy(mesh.position);
        planetGroup.add(atmo);
      }
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

    const onResize = () => {
      if (!mountRef.current) {
        return;
      }

      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('resize', onResize);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('contextmenu', (event) => event.preventDefault());
    renderer.domElement.addEventListener('wheel', (event) => event.preventDefault(), { passive: false });

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

      if (frame % 2 === 0) {
        stars.rotation.z += 0.00008;
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

      atmosphereGeometry.dispose();
      for (const geometry of geometryVariants) {
        geometry.dispose();
      }

      for (const material of disposables) {
        material.dispose();
      }

      const starsGeometry = stars.geometry;
      const starsMaterial = stars.material;
      starsGeometry.dispose();
      (starsMaterial as THREE.Material).dispose();

      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [planetData, worldSeed]);

  return (
    <section className="space-y-3">
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-xs text-slate-300">
        <p>
          Controls: <span className="font-semibold text-slate-100">WASD / Arrow Keys</span> to move, drag to pan.
          Zoom is intentionally disabled for MVP map framing.
        </p>
      </div>
      <div ref={mountRef} className="h-[72vh] w-full rounded-xl border border-slate-800" />
    </section>
  );
}
