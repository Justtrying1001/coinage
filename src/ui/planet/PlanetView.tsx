'use client';

import { useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

import { resolvePlanetIdentity } from '@/domain/world/resolve-planet-identity';
import { createPlanetRenderInstance, updatePlanetLayerAnimation } from '@/rendering/planet/create-planet-render-instance';
import { PLANET_RENDER_PHOTOMETRY } from '@/rendering/planet/render-photometry';

interface PlanetViewProps {
  worldSeed: string;
  planetId: string;
}

export default function PlanetView({ worldSeed, planetId }: PlanetViewProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const resolved = useMemo(() => resolvePlanetIdentity(worldSeed, planetId), [planetId, worldSeed]);

  useEffect(() => {
    if (!resolved) {
      return;
    }

    const mount = mountRef.current;
    if (!mount) {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#030712');

    const camera = new THREE.PerspectiveCamera(34, mount.clientWidth / Math.max(1, mount.clientHeight), 0.1, 1200);
    camera.position.set(0, 0.22, 4.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = PLANET_RENDER_PHOTOMETRY.outputColorSpace;
    renderer.toneMapping = PLANET_RENDER_PHOTOMETRY.toneMapping;
    renderer.toneMappingExposure = PLANET_RENDER_PHOTOMETRY.planetExposure;
    mount.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const iblEnvironment = pmremGenerator.fromScene(new RoomEnvironment(), 0.035).texture;
    scene.environment = iblEnvironment;

    const ambientLight = new THREE.AmbientLight('#bcd1ff', 0.45);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight('#e8f2ff', '#111827', 0.6);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight('#ffffff', 1.6);
    keyLight.position.set(15, 8, 22);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight('#9db4ff', 0.55);
    fillLight.position.set(-18, -12, 16);
    scene.add(fillLight);

    const planetInstance = createPlanetRenderInstance({
      planet: resolved.planet,
      x: 0,
      y: 0,
      z: 0,
      options: { viewMode: 'planet' },
    });

    scene.add(planetInstance.object);

    const framingBounds = new THREE.Box3().setFromObject(planetInstance.object);
    const framingSphere = framingBounds.getBoundingSphere(new THREE.Sphere());
    const framingCenter = framingSphere.center.clone();
    const framingRadius = Number.isFinite(framingSphere.radius) && framingSphere.radius > 0 ? framingSphere.radius : 1;
    const framingMargin = 1.18;

    const baseViewDirection = camera.position.clone().sub(framingCenter).normalize();
    if (!Number.isFinite(baseViewDirection.lengthSq()) || baseViewDirection.lengthSq() < 1e-6) {
      baseViewDirection.set(0, 0.045, 1).normalize();
    }

    const computeFitDistance = (radius: number, perspectiveCamera: THREE.PerspectiveCamera): number => {
      const verticalFov = THREE.MathUtils.degToRad(perspectiveCamera.fov);
      const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * perspectiveCamera.aspect);
      const verticalDistance = radius / Math.sin(Math.max(0.01, verticalFov / 2));
      const horizontalDistance = radius / Math.sin(Math.max(0.01, horizontalFov / 2));
      return Math.max(verticalDistance, horizontalDistance);
    };

    const baseFitDistance = computeFitDistance(framingRadius, camera);
    const initialDistance = baseFitDistance * framingMargin;
    const minDistance = Math.max(framingRadius * 1.05, baseFitDistance * 0.68);
    const maxDistance = Math.max(baseFitDistance * 7.5, minDistance * 2.5);

    camera.near = Math.max(0.01, framingRadius * 0.03);
    camera.far = Math.max(1200, maxDistance * 6);
    camera.updateProjectionMatrix();
    camera.position.copy(framingCenter).addScaledVector(baseViewDirection, initialDistance);
    camera.lookAt(framingCenter);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = minDistance;
    controls.maxDistance = maxDistance;
    controls.minPolarAngle = 0.01;
    controls.maxPolarAngle = Math.PI - 0.01;
    controls.target.copy(framingCenter);
    controls.autoRotate = false;
    controls.update();

    const onResize = () => {
      if (!mountRef.current) {
        return;
      }

      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      camera.aspect = width / Math.max(1, height);
      const resizedFitDistance = computeFitDistance(framingRadius, camera);
      const resizedMinDistance = Math.max(framingRadius * 1.05, resizedFitDistance * 0.68);
      const resizedMaxDistance = Math.max(resizedFitDistance * 7.5, resizedMinDistance * 2.5);

      controls.minDistance = resizedMinDistance;
      controls.maxDistance = resizedMaxDistance;

      const offset = camera.position.clone().sub(controls.target);
      if (offset.lengthSq() <= 1e-6) {
        offset.copy(baseViewDirection);
      } else {
        offset.normalize();
      }
      const currentDistance = camera.position.distanceTo(controls.target);
      const nextDistance = Math.min(resizedMaxDistance, Math.max(currentDistance, resizedFitDistance * framingMargin));
      camera.position.copy(controls.target).addScaledVector(offset, nextDistance);

      camera.near = Math.max(0.01, framingRadius * 0.03);
      camera.far = Math.max(1200, resizedMaxDistance * 6);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      controls.update();
    };

    window.addEventListener('resize', onResize);

    let disposed = false;
    const animate = () => {
      if (disposed) {
        return;
      }

      const delta = Math.min(0.05, animationClock.getDelta());
      updatePlanetLayerAnimation(planetInstance.object, delta);
      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };


    const animationClock = new THREE.Clock();
    const raf = requestAnimationFrame(animate);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      planetInstance.dispose();

      pmremGenerator.dispose();
      iblEnvironment.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [resolved]);

  if (!resolved) {
    return (
      <section className="flex min-h-dvh w-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
        <div className="w-full max-w-lg rounded-lg border border-slate-700/70 bg-slate-900/70 p-6">
          <h1 className="text-lg font-semibold">Planète introuvable</h1>
          <p className="mt-2 text-sm text-slate-300">
            Aucun résultat pour <span className="font-mono">{planetId}</span> dans la galaxie actuelle.
          </p>
          <Link
            href="/galaxy"
            className="mt-4 inline-flex items-center rounded-md border border-slate-500/80 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-slate-300 hover:bg-slate-700"
          >
            Retour à la galaxie
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-dvh w-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute left-4 top-4 z-10 max-w-sm rounded-md bg-slate-950/65 px-3 py-2 text-xs text-slate-200 shadow-lg shadow-slate-950/40 backdrop-blur-sm">
        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-300/90">Planet View</p>
        <p className="mt-1 text-slate-100/90">
          <span className="font-semibold">ID:</span> {resolved.planetId}
        </p>
        <p className="mt-1 text-slate-100/90">
          <span className="font-semibold">Seed:</span> {resolved.planetSeed}
        </p>
        <p className="mt-1 text-slate-100/90">
          <span className="font-semibold">Inspecter:</span> glisser pour orbiter, molette pour zoom
        </p>
      </div>
      <div className="pointer-events-auto absolute left-4 top-28 z-10">
        <Link
          href="/galaxy"
          className="inline-flex items-center rounded-md border border-slate-600/70 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-slate-400 hover:bg-slate-800/80"
        >
          Retour galaxie
        </Link>
      </div>
      <div ref={mountRef} className="h-full w-full" />
    </section>
  );
}
