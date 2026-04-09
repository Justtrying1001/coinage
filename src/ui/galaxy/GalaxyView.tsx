'use client';

import { useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';

import { getGalaxyPlanetManifest } from '@/domain/world/build-galaxy-planet-manifest';
import { GALAXY_LAYOUT_RUNTIME_CONFIG } from '@/domain/world/world.constants';
import { PLANET_RENDER_PHOTOMETRY } from '@/rendering/planet/render-photometry';
import { createPlanetProxyInstance } from '@/rendering/planet/create-planet-proxy-instance';
import { createNebulaBackground, createStarfield } from '@/rendering/space/create-starfield';
import { computeGalaxyVisualRadius } from './planet-visual-scale';

const GalaxyHud = dynamic(() => import('./GalaxyHud'), {
  ssr: false,
  loading: () => null,
});

interface GalaxyViewProps {
  worldSeed: string;
}

const FIELD_RADIUS = GALAXY_LAYOUT_RUNTIME_CONFIG.fieldRadius ?? 120;
const MOVE_SPEED = 18;
const IS_DEV = process.env.NODE_ENV !== 'production';

interface GalaxyProxyInstance {
  object: THREE.Mesh;
  planetId: string;
  radius: number;
  dispose: () => void;
}

function createGalaxyPlanetProxy(
  entry: ReturnType<typeof getGalaxyPlanetManifest>[number],
): GalaxyProxyInstance {
  const radius = computeGalaxyVisualRadius(entry.planet.render.scale);
  const geometry = new THREE.SphereGeometry(radius, 20, 20);
  const surfaceColor = new THREE.Color(...entry.planet.visualDNA.colorMid);
  const accentColor = new THREE.Color(...entry.planet.visualDNA.accentColor);
  const material = new THREE.MeshStandardMaterial({
    color: surfaceColor.lerp(accentColor, 0.16),
    roughness: 0.62,
    metalness: 0.05,
    emissive: accentColor.multiplyScalar(0.06),
    emissiveIntensity: 0.28,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'galaxy-planet-proxy';
  mesh.position.set(entry.x, entry.y, 0);
  mesh.userData.planetId = entry.id;

  return {
    object: mesh,
    planetId: entry.id,
    radius,
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };
}

export default function GalaxyView({ worldSeed }: GalaxyViewProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const manifest = useMemo(() => getGalaxyPlanetManifest(worldSeed), [worldSeed]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const runtimeDebugEnabled = searchParams.get('debugRender') === '1';
    const forceBasicMaterial = searchParams.get('debugBasic') === '1';
    const wireframe = searchParams.get('wireframe') === '1';

    const scene = new THREE.Scene();
    const nebulaBackground = createNebulaBackground(1200);
    const starfield = createStarfield(3000, 760);
    scene.add(nebulaBackground);
    scene.add(starfield);

    const width = mount.clientWidth;
    const height = mount.clientHeight;
    const aspect = width / Math.max(1, height);
    const frustumHeight = FIELD_RADIUS * 2.2;
    const frustumWidth = frustumHeight * aspect;
    const camera = new THREE.OrthographicCamera(
      -frustumWidth / 2,
      frustumWidth / 2,
      frustumHeight / 2,
      -frustumHeight / 2,
      0.1,
      2500,
    );
    camera.position.set(centerX, centerY, 120);
    camera.lookAt(centerX, centerY, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = PLANET_RENDER_PHOTOMETRY.outputColorSpace;
    renderer.toneMapping = PLANET_RENDER_PHOTOMETRY.toneMapping;
    renderer.toneMappingExposure = PLANET_RENDER_PHOTOMETRY.galaxyExposure;
    mount.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    scene.add(new THREE.AmbientLight('#9db7df', 0.45));
    const keyLight = new THREE.DirectionalLight('#ffffff', 1.25);
    keyLight.position.set(24, 14, 28);
    scene.add(keyLight);

    const group = new THREE.Group();
    const instances = manifest.map((entry) => createPlanetProxyInstance(entry.planet, {
      x: entry.x,
      y: entry.y,
      z: 0,
    }));
    for (const instance of instances) {
      group.add(instance.object);
    }
    scene.add(group);

    const interactiveMeshes: THREE.Mesh[] = [];
    group.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        interactiveMeshes.push(node);
      }
    });
    if (runtimeDebugEnabled && process.env.NODE_ENV !== 'production') {
      camera.updateMatrixWorld();
      const frustum = new THREE.Frustum();
      const projectionView = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      frustum.setFromProjectionMatrix(projectionView);

      const diagnostics = instances.slice(0, 24).map((instance) => {
        const box = new THREE.Box3().setFromObject(instance.object);
        const sphere = box.getBoundingSphere(new THREE.Sphere());
        return {
          planetId: instance.object.userData.planetId as string,
          position: instance.object.position.toArray(),
          sphereRadius: sphere.radius,
          distanceToCamera: camera.position.distanceTo(sphere.center),
          inFrustum: frustum.intersectsSphere(sphere),
        };
      });

      const inFrustumCount = diagnostics.filter((entry) => entry.inFrustum).length;
      console.info('[GalaxyView:runtime-debug]', {
        planetCount: instances.length,
        meshCount: interactiveMeshes.length,
        forceBasicMaterial,
        wireframe,
        camera: {
          left: camera.left,
          right: camera.right,
          top: camera.top,
          bottom: camera.bottom,
          near: camera.near,
          far: camera.far,
          position: camera.position.toArray(),
        },
        inFrustumSampleCount: inFrustumCount,
        diagnosticsSample: diagnostics,
      });
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

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key in keyState) keyState[event.key] = true;
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key in keyState) keyState[event.key] = false;
    };
    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      renderer.domElement.style.cursor = 'grabbing';
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      const unitX = (camera.right - camera.left) / (camera.zoom * Math.max(1, mount.clientWidth));
      const unitY = (camera.top - camera.bottom) / (camera.zoom * Math.max(1, mount.clientHeight));
      camera.position.x -= dx * unitX;
      camera.position.y += dy * unitY;
    };
    const onPointerUp = (event: PointerEvent) => {
      dragging = false;
      renderer.domElement.style.cursor = 'grab';
      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId);
      }
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
      const first = raycaster.intersectObjects(interactiveMeshes, false)[0];
      const planetId = first?.object.userData.planetId as string | undefined;
      if (planetId) {
        router.push(`/planet/${planetId}`);
      }
    };
    const onResize = () => {
      if (!mountRef.current) return;
      const nextWidth = mountRef.current.clientWidth;
      const nextHeight = mountRef.current.clientHeight;
      const nextAspect = nextWidth / Math.max(1, nextHeight);
      const nextHalfHeight = frustumHeight / 2;
      const nextHalfWidth = nextHalfHeight * nextAspect;
      camera.left = -nextHalfWidth;
      camera.right = nextHalfWidth;
      camera.top = nextHalfHeight;
      camera.bottom = -nextHalfHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, nextHeight);
      composer.setSize(nextWidth, nextHeight);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('resize', onResize);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('dblclick', onDoubleClick);
    renderer.domElement.style.cursor = 'grab';

    let disposed = false;
    let previous = performance.now();
    const animate = (time: number) => {
      if (disposed) return;
      const delta = Math.min(0.05, (time - previous) / 1000);
      previous = time;

      let moveX = 0;
      let moveY = 0;
      if (keyState.ArrowLeft || keyState.a) moveX -= 1;
      if (keyState.ArrowRight || keyState.d) moveX += 1;
      if (keyState.ArrowUp || keyState.w) moveY += 1;
      if (keyState.ArrowDown || keyState.s) moveY -= 1;
      const length = Math.hypot(moveX, moveY) || 1;
      camera.position.x += ((moveX / length) * MOVE_SPEED * delta) || 0;
      camera.position.y += ((moveY / length) * MOVE_SPEED * delta) || 0;
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -FIELD_RADIUS, FIELD_RADIUS);
      camera.position.y = THREE.MathUtils.clamp(camera.position.y, -FIELD_RADIUS, FIELD_RADIUS);

      for (const instance of instances) {
        const speed = typeof instance.object.userData.rotationSpeed === 'number' ? instance.object.userData.rotationSpeed : 0;
        instance.object.rotation.y += speed * delta;
      }
      composer.render();
      requestAnimationFrame(animate);
    };
    const raf = requestAnimationFrame(animate);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('dblclick', onDoubleClick);

      for (const instance of instances) instance.dispose();
      scene.traverse((node) => {
        if (node instanceof THREE.Mesh || node instanceof THREE.Points) {
          node.geometry?.dispose();
          const material = node.material;
          if (Array.isArray(material)) material.forEach((m) => m.dispose());
          else material?.dispose();
        }
      });

      composer.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [manifest, router]);

  return (
    <section className="relative h-full w-full overflow-hidden">
      <GalaxyHud planetCount={manifest.length} />
      <div ref={mountRef} className="h-full w-full" />
    </section>
  );
}
