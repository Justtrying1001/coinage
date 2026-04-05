'use client';

import { useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { resolvePlanetIdentity } from '@/domain/world/resolve-planet-identity';
import { createPlanetRenderInstance } from '@/rendering/planet/create-planet-render-instance';

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
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    mount.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight('#ffffff', 1.18);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight('#f4f7ff', '#d9e1f0', 0.52);
    scene.add(hemiLight);

    const frontLight = new THREE.DirectionalLight('#ffffff', 0.3);
    frontLight.position.set(4, 1.4, 4.2);
    scene.add(frontLight);

    const backLight = new THREE.DirectionalLight('#ffffff', 0.3);
    backLight.position.set(-4, -1.2, -4.2);
    scene.add(backLight);

    const topLight = new THREE.DirectionalLight('#ffffff', 0.2);
    topLight.position.set(0, 5, 0);
    scene.add(topLight);

    const planetInstance = createPlanetRenderInstance({
      profile: resolved.profile,
      x: 0,
      y: 0,
      z: 0,
      options: { lod: 'planet' },
    });

    scene.add(planetInstance.object);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2.8;
    controls.maxDistance = 7.8;
    controls.minPolarAngle = 0.01;
    controls.maxPolarAngle = Math.PI - 0.01;
    controls.target.set(0, 0, 0);
    controls.autoRotate = false;
    controls.update();

    const onResize = () => {
      if (!mountRef.current) {
        return;
      }

      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', onResize);

    let disposed = false;
    const animate = () => {
      if (disposed) {
        return;
      }

      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    const raf = requestAnimationFrame(animate);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      planetInstance.dispose();
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
