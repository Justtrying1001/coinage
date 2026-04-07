'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { resolvePlanetIdentity } from '@/domain/world/resolve-planet-identity';
import { createPlanetRenderInstance, updatePlanetLayerAnimation } from '@/rendering/planet/create-planet-render-instance';
import { PLANET_RENDER_PHOTOMETRY } from '@/rendering/planet/render-photometry';

interface PlanetValidationViewProps {
  worldSeed: string;
  planetId: string;
  mode: 'galaxy' | 'planet';
}

export default function PlanetValidationView({ worldSeed, planetId, mode }: PlanetValidationViewProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const resolved = useMemo(() => resolvePlanetIdentity(worldSeed, planetId), [planetId, worldSeed]);

  useEffect(() => {
    if (!resolved || !mountRef.current) return;

    const mount = mountRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#050914');

    const camera = new THREE.PerspectiveCamera(34, mount.clientWidth / Math.max(1, mount.clientHeight), 0.1, 1200);
    camera.position.set(0, 0.2, mode === 'galaxy' ? 7.4 : 4.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = PLANET_RENDER_PHOTOMETRY.outputColorSpace;
    renderer.toneMapping = PLANET_RENDER_PHOTOMETRY.toneMapping;
    renderer.toneMappingExposure = mode === 'galaxy' ? PLANET_RENDER_PHOTOMETRY.galaxyExposure : PLANET_RENDER_PHOTOMETRY.planetExposure;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight('#bcd1ff', 0.5));
    const keyLight = new THREE.DirectionalLight('#ffffff', 1.65);
    keyLight.position.set(15, 8, 22);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight('#9db4ff', 0.52);
    fillLight.position.set(-18, -12, 16);
    scene.add(fillLight);

    const planetInstance = createPlanetRenderInstance({
      planet: resolved.planet,
      x: 0,
      y: 0,
      z: 0,
      options: { viewMode: mode },
    });

    scene.add(planetInstance.object);

    const framingBounds = new THREE.Box3().setFromObject(planetInstance.object);
    const sphere = framingBounds.getBoundingSphere(new THREE.Sphere());
    const radius = Number.isFinite(sphere.radius) && sphere.radius > 0 ? sphere.radius : 1;
    const center = sphere.center;

    const fitDistance = radius / Math.sin(THREE.MathUtils.degToRad(camera.fov * 0.5));
    camera.position.set(0, mode === 'galaxy' ? radius * 0.1 : radius * 0.14, fitDistance * (mode === 'galaxy' ? 1.55 : 1.15));
    camera.lookAt(center);

    let disposed = false;
    const clock = new THREE.Clock();

    const animate = () => {
      if (disposed) return;
      const dt = Math.min(0.05, clock.getDelta());
      updatePlanetLayerAnimation(planetInstance.object, dt, false);
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    const raf = requestAnimationFrame(animate);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      planetInstance.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [mode, resolved]);

  return <div ref={mountRef} className="h-dvh w-screen bg-slate-950" data-testid="validation-canvas" />;
}
