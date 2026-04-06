'use client';

import { useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';

import { getGalaxyPlanetManifest } from '@/domain/world/build-galaxy-planet-manifest';
import type { PlanetVisualProfile } from '@/domain/world/planet-visual.types';
import { GALAXY_LAYOUT_RUNTIME_CONFIG } from '@/domain/world/world.constants';
import { createPlanetRenderInstance } from '@/rendering/planet/create-planet-render-instance';
import type { PlanetRenderInstance } from '@/rendering/planet/types';

interface GalaxyViewProps {
  worldSeed: string;
}

interface PlanetRenderData {
  id: string;
  x: number;
  y: number;
  profile: PlanetVisualProfile;
}

const FIELD_RADIUS = GALAXY_LAYOUT_RUNTIME_CONFIG.fieldRadius ?? 84;
const MOVE_SPEED = Math.max(24, FIELD_RADIUS * 0.18);
const BASE_VIEW_HEIGHT = Math.min(380, Math.max(140, FIELD_RADIUS * 0.58));
const FIXED_CAMERA_ZOOM = 2.85;
const KEYBOARD_ACCELERATION = 15;
const KEYBOARD_DECELERATION = 13;
const CAMERA_FOLLOW_DAMPING = 16;
const DRAG_PAN_FACTOR = 0.0135 * BASE_VIEW_HEIGHT;

export default function GalaxyView({ worldSeed }: GalaxyViewProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const planetData = useMemo<PlanetRenderData[]>(() => {
    return getGalaxyPlanetManifest(worldSeed);
  }, [worldSeed]);

  useEffect(() => {
    const mount = mountRef.current;

    if (!mount) {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#020617');
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
    const centralRegionTarget = planetData.reduce(
      (acc, planet) => {
        acc.x += planet.x;
        acc.y += planet.y;
        return acc;
      },
      { x: 0, y: 0 },
    );
    if (planetData.length > 0) {
      centralRegionTarget.x /= planetData.length;
      centralRegionTarget.y /= planetData.length;
    }

    camera.position.set(centralRegionTarget.x, centralRegionTarget.y, 60);
    camera.zoom = FIXED_CAMERA_ZOOM;
    camera.updateProjectionMatrix();
    camera.lookAt(camera.position.x, camera.position.y, 0);
    const cameraTarget = new THREE.Vector2(camera.position.x, camera.position.y);
    const keyboardVelocity = new THREE.Vector2(0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.6;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight('#b7d1ff', 1.9));

    const keyLight = new THREE.DirectionalLight('#ffffff', 2.1);
    keyLight.position.set(20, 26, 44);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight('#b6ccff', 1.25);
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
      instance.object.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          node.userData.planetId = planet.id;
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
      renderer.domElement.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) {
        return;
      }

      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;

      cameraTarget.x -= (dx / Math.max(1, mount.clientHeight)) * DRAG_PAN_FACTOR;
      cameraTarget.y += (dy / Math.max(1, mount.clientHeight)) * DRAG_PAN_FACTOR;
    };

    const onPointerUp = (event: PointerEvent) => {
      dragging = false;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId);
      }
    };

    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
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
    renderer.domElement.addEventListener('contextmenu', onContextMenu);

    let previousTime = performance.now();
    let disposed = false;
    let frameId = 0;

    const animate = (time: number) => {
      if (disposed) {
        return;
      }

      const delta = Math.min(0.05, (time - previousTime) / 1000);
      previousTime = time;

      let moveX = 0;
      let moveY = 0;

      if (keyState.ArrowLeft || keyState.a) moveX -= 1;
      if (keyState.ArrowRight || keyState.d) moveX += 1;
      if (keyState.ArrowUp || keyState.w) moveY += 1;
      if (keyState.ArrowDown || keyState.s) moveY -= 1;

      const length = Math.hypot(moveX, moveY) || 1;
      const desiredKeyboardVelocityX = moveX === 0 ? 0 : (moveX / length) * MOVE_SPEED;
      const desiredKeyboardVelocityY = moveY === 0 ? 0 : (moveY / length) * MOVE_SPEED;
      const keyboardResponse = 1 - Math.exp(-(moveX === 0 && moveY === 0 ? KEYBOARD_DECELERATION : KEYBOARD_ACCELERATION) * delta);
      keyboardVelocity.x += (desiredKeyboardVelocityX - keyboardVelocity.x) * keyboardResponse;
      keyboardVelocity.y += (desiredKeyboardVelocityY - keyboardVelocity.y) * keyboardResponse;
      cameraTarget.x += keyboardVelocity.x * delta;
      cameraTarget.y += keyboardVelocity.y * delta;

      const verticalHalfSpan = (camera.top - camera.bottom) / (2 * camera.zoom);
      const horizontalHalfSpan = (camera.right - camera.left) / (2 * camera.zoom);
      const clampedXRadius = Math.max(0, FIELD_RADIUS - horizontalHalfSpan * 0.4);
      const clampedYRadius = Math.max(0, FIELD_RADIUS - verticalHalfSpan * 0.4);
      cameraTarget.x = Math.max(-clampedXRadius, Math.min(clampedXRadius, cameraTarget.x));
      cameraTarget.y = Math.max(-clampedYRadius, Math.min(clampedYRadius, cameraTarget.y));

      const followFactor = 1 - Math.exp(-CAMERA_FOLLOW_DAMPING * delta);
      camera.position.x += (cameraTarget.x - camera.position.x) * followFactor;
      camera.position.y += (cameraTarget.y - camera.position.y) * followFactor;

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);

      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('dblclick', onDoubleClick);
      renderer.domElement.removeEventListener('contextmenu', onContextMenu);

      for (const instance of instances) {
        instance.dispose();
      }

      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [planetData, router]);

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
        <p className="mt-1 text-slate-100/90">
          <span className="font-semibold">Planets:</span> {planetData.length}
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
