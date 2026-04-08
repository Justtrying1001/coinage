'use client';

import { useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';

import type { GalaxyPlanetManifestItem } from '@/domain/world/build-galaxy-planet-manifest';
import { getGalaxyPlanetManifest } from '@/domain/world/build-galaxy-planet-manifest';
import { GALAXY_LAYOUT_RUNTIME_CONFIG } from '@/domain/world/world.constants';
import { createPlanetRenderInstance, updatePlanetLayerAnimation } from '@/rendering/planet/create-planet-render-instance';
import { PLANET_RENDER_PHOTOMETRY } from '@/rendering/planet/render-photometry';
import { createNebulaBackground, createStarfield } from '@/rendering/space/create-starfield';
import { computeGalaxyVisualRadius } from './planet-visual-scale';

const GalaxyHud = dynamic(() => import('./GalaxyHud'), {
  ssr: false,
  loading: () => null,
});

interface GalaxyViewProps {
  worldSeed: string;
}

const FIELD_RADIUS = GALAXY_LAYOUT_RUNTIME_CONFIG.fieldRadius ?? 84;
const MOVE_SPEED = Math.max(24, FIELD_RADIUS * 0.18);
const BASE_VIEW_HEIGHT = Math.min(380, Math.max(140, FIELD_RADIUS * 0.58));
const FIXED_CAMERA_ZOOM = 3.25;
const KEYBOARD_ACCELERATION = 15;
const KEYBOARD_DECELERATION = 13;
const CAMERA_FOLLOW_DAMPING = 16;
const DRAG_PAN_SENSITIVITY = 1.18;
const DRAG_DIRECT_RESPONSE = 0.58;

function getWorldUnitsPerPixel(camera: THREE.OrthographicCamera, viewportWidth: number, viewportHeight: number) {
  const safeWidth = Math.max(1, viewportWidth);
  const safeHeight = Math.max(1, viewportHeight);
  return {
    x: (camera.right - camera.left) / (camera.zoom * safeWidth),
    y: (camera.top - camera.bottom) / (camera.zoom * safeHeight),
  };
}

function getManifestCenter(planets: GalaxyPlanetManifestItem[]): THREE.Vector2 {
  if (planets.length === 0) {
    return new THREE.Vector2(0, 0);
  }

  const sum = planets.reduce(
    (acc, planet) => {
      acc.x += planet.x;
      acc.y += planet.y;
      return acc;
    },
    { x: 0, y: 0 },
  );

  return new THREE.Vector2(sum.x / planets.length, sum.y / planets.length);
}

export default function GalaxyView({ worldSeed }: GalaxyViewProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const planetManifest = useMemo(() => getGalaxyPlanetManifest(worldSeed), [worldSeed]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return;
    }

    const scene = new THREE.Scene();
    const nebulaBackground = createNebulaBackground(1200);
    const starfield = createStarfield(3000, 1000);
    scene.add(nebulaBackground);
    scene.add(starfield);
    scene.add(new THREE.AmbientLight('#c5d7ff', 2.2));

    const width = mount.clientWidth;
    const height = mount.clientHeight;
    const aspect = width / Math.max(1, height);
    const viewHeight = BASE_VIEW_HEIGHT;
    const viewWidth = viewHeight * aspect;
    const camera = new THREE.OrthographicCamera(-viewWidth / 2, viewWidth / 2, viewHeight / 2, -viewHeight / 2, 0.1, 600);

    const center = getManifestCenter(planetManifest);
    camera.position.set(center.x, center.y, 60);
    camera.zoom = FIXED_CAMERA_ZOOM;
    camera.updateProjectionMatrix();
    camera.lookAt(camera.position.x, camera.position.y, 0);

    const cameraTarget = new THREE.Vector2(camera.position.x, camera.position.y);
    const keyboardVelocity = new THREE.Vector2(0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = PLANET_RENDER_PHOTOMETRY.outputColorSpace;
    renderer.toneMapping = PLANET_RENDER_PHOTOMETRY.toneMapping;
    renderer.toneMappingExposure = PLANET_RENDER_PHOTOMETRY.galaxyExposure;
    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.style.cursor = 'grab';
    mount.appendChild(renderer.domElement);

    const planetGroup = new THREE.Group();
    scene.add(planetGroup);

    const interactivePlanetMeshes: THREE.Mesh[] = [];
    const planetInstances = planetManifest.map((planet) => {
      const visualRadius = computeGalaxyVisualRadius(planet.planet.render.scale);
      const instance = createPlanetRenderInstance({
        planet: planet.planet,
        x: planet.x,
        y: planet.y,
        z: 0,
        options: { viewMode: 'galaxy' },
      });

      const visualScale = visualRadius / Math.max(0.0001, planet.planet.render.renderRadius);
      instance.object.scale.setScalar(visualScale);
      instance.object.userData.planetId = planet.id;

      instance.object.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          node.userData.planetId = planet.id;
          interactivePlanetMeshes.push(node);
        }
      });

      planetGroup.add(instance.object);
      return { planetId: planet.id, instance };
    });

    if (process.env.NODE_ENV !== 'production') {
      const representedIds = new Set(planetInstances.map(({ planetId }) => planetId));
      if (representedIds.size !== planetManifest.length) {
        console.error('[GalaxyView] manifest/representation mismatch', {
          manifestCount: planetManifest.length,
          representedCount: representedIds.size,
        });
      }
    }

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

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

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
      renderer.domElement.style.cursor = 'grabbing';
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) {
        return;
      }

      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;

      const unitsPerPixel = getWorldUnitsPerPixel(camera, mount.clientWidth, mount.clientHeight);
      const dragDeltaX = dx * unitsPerPixel.x * DRAG_PAN_SENSITIVITY;
      const dragDeltaY = dy * unitsPerPixel.y * DRAG_PAN_SENSITIVITY;
      cameraTarget.x -= dragDeltaX;
      cameraTarget.y += dragDeltaY;
      camera.position.x += (cameraTarget.x - camera.position.x) * DRAG_DIRECT_RESPONSE;
      camera.position.y += (cameraTarget.y - camera.position.y) * DRAG_DIRECT_RESPONSE;
    };

    const onPointerUp = (event: PointerEvent) => {
      dragging = false;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId);
      }
      renderer.domElement.style.cursor = 'grab';
    };

    const onDoubleClick = (event: MouseEvent) => {
      const bounds = renderer.domElement.getBoundingClientRect();
      if (bounds.width <= 0 || bounds.height <= 0) {
        return;
      }

      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const firstHit = raycaster.intersectObjects(interactivePlanetMeshes, false)[0];
      const planetId = firstHit?.object.userData.planetId as string | undefined;
      if (!planetId) {
        return;
      }

      router.push(`/planet/${planetId}`);
    };

    const onResize = () => {
      if (!mountRef.current) {
        return;
      }

      const currentWidth = mountRef.current.clientWidth;
      const currentHeight = mountRef.current.clientHeight;
      const currentAspect = currentWidth / Math.max(1, currentHeight);
      const frustumHalfHeight = BASE_VIEW_HEIGHT / 2;
      const frustumHalfWidth = frustumHalfHeight * currentAspect;

      camera.left = -frustumHalfWidth;
      camera.right = frustumHalfWidth;
      camera.top = frustumHalfHeight;
      camera.bottom = -frustumHalfHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentWidth, currentHeight);
    };

    const onContextMenu = (event: MouseEvent) => event.preventDefault();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('resize', onResize);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('dblclick', onDoubleClick);
    renderer.domElement.addEventListener('contextmenu', onContextMenu);

    let frameId: number | null = null;
    let previousFrameTime = performance.now();

    const renderFrame = (time: number) => {
      const delta = Math.min(0.05, (time - previousFrameTime) / 1000);
      previousFrameTime = time;

      let moveX = 0;
      let moveY = 0;
      if (keyState.ArrowLeft || keyState.a) moveX -= 1;
      if (keyState.ArrowRight || keyState.d) moveX += 1;
      if (keyState.ArrowUp || keyState.w) moveY += 1;
      if (keyState.ArrowDown || keyState.s) moveY -= 1;

      const moveLength = Math.hypot(moveX, moveY) || 1;
      const targetVelocityX = moveX === 0 ? 0 : (moveX / moveLength) * MOVE_SPEED;
      const targetVelocityY = moveY === 0 ? 0 : (moveY / moveLength) * MOVE_SPEED;
      const keyboardResponse =
        1 - Math.exp(-(moveX === 0 && moveY === 0 ? KEYBOARD_DECELERATION : KEYBOARD_ACCELERATION) * delta);

      keyboardVelocity.x += (targetVelocityX - keyboardVelocity.x) * keyboardResponse;
      keyboardVelocity.y += (targetVelocityY - keyboardVelocity.y) * keyboardResponse;
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

      for (const { instance } of planetInstances) {
        updatePlanetLayerAnimation(instance.object, delta);
      }

      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(renderFrame);
    };

    frameId = window.requestAnimationFrame(renderFrame);

    return () => {
      if (frameId != null) {
        cancelAnimationFrame(frameId);
      }

      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('dblclick', onDoubleClick);
      renderer.domElement.removeEventListener('contextmenu', onContextMenu);

      interactivePlanetMeshes.length = 0;
      for (const { instance } of planetInstances) {
        instance.dispose();
      }

      (nebulaBackground.geometry as THREE.BufferGeometry).dispose();
      (nebulaBackground.material as THREE.Material).dispose();
      (starfield.geometry as THREE.BufferGeometry).dispose();
      (starfield.material as THREE.Material).dispose();

      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [planetManifest, router]);

  return (
    <section className="relative h-full w-full overflow-hidden">
      <GalaxyHud planetCount={planetManifest.length} />
      <div ref={mountRef} className="h-full w-full" />
    </section>
  );
}
