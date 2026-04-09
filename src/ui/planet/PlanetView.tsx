'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { resolvePlanetIdentity } from '@/domain/world/resolve-planet-identity';
import { updatePlanetLayerAnimation, updatePlanetLighting } from '@/rendering/planet/update-planet-runtime';
import { PLANET_RENDER_PHOTOMETRY } from '@/rendering/planet/render-photometry';
import { createXenoversePlanetGpuInstance } from '@/vendor/xenoverse/planet-gpu';

interface PlanetViewProps {
  worldSeed: string;
  planetId: string;
}

export default function PlanetView({ worldSeed, planetId }: PlanetViewProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [pipelineInfo, setPipelineInfo] = useState<string>('initialisation…');

  const resolved = useMemo(() => resolvePlanetIdentity(worldSeed, planetId), [planetId, worldSeed]);

  useEffect(() => {
    if (!resolved) {
      return;
    }

    const mount = mountRef.current;
    if (!mount) {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const runtimeDebugEnabled = searchParams.get('debugRender') === '1';
    const forceBasicMaterial = searchParams.get('debugBasic') === '1';
    const wireframe = searchParams.get('wireframe') === '1';

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#030308');

    const camera = new THREE.PerspectiveCamera(34, mount.clientWidth / Math.max(1, mount.clientHeight), 0.1, 1200);
    camera.position.set(0, 0.22, 4.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = PLANET_RENDER_PHOTOMETRY.toneMapping;
    renderer.toneMappingExposure = PLANET_RENDER_PHOTOMETRY.planetExposure;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight('#dbe8ff', 0.62));
    const keyLight = new THREE.DirectionalLight('#ffffff', 1.9);
    keyLight.position.set(13, 9, 16);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight('#9ec1ff', 0.56);
    fillLight.position.set(-11, -6, 12);
    scene.add(fillLight);

    const planetInstance = createXenoversePlanetGpuInstance(resolved.planet, {
      renderer,
      forceBasicMaterial,
      wireframe,
      preferCompute: true,
    });

    scene.add(planetInstance.object);

    const runtimeLabel = planetInstance.diagnostics.usedCpuFaces === 0
      ? `GPU compute (${planetInstance.diagnostics.usedComputeFaces}/6 faces)`
      : `CPU fallback (${planetInstance.diagnostics.usedCpuFaces}/6 faces)${planetInstance.diagnostics.fallbackReasons.length ? ` — ${planetInstance.diagnostics.fallbackReasons.join(', ')}` : ''}`;
    setPipelineInfo(runtimeLabel);

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

    if (runtimeDebugEnabled && process.env.NODE_ENV !== 'production') {
      camera.updateMatrixWorld();
      const frustum = new THREE.Frustum();
      const projectionView = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      frustum.setFromProjectionMatrix(projectionView);

      const meshDiagnostics: Array<Record<string, unknown>> = [];
      let computeFaceCount = 0;
      planetInstance.object.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return;
        const geometry = node.geometry;
        const position = geometry.getAttribute('position');
        const bounds = new THREE.Box3().setFromObject(node);
        const sphere = bounds.getBoundingSphere(new THREE.Sphere());
        const uv = geometry.getAttribute('uv');
        const computeMarker = uv && uv.count > 0 ? uv.getY(0) : 0;
        if (node.name === 'xenoverse-face' && computeMarker > 0.5) computeFaceCount += 1;
        const mat = node.material;
        const uniforms =
          mat instanceof THREE.ShaderMaterial
            ? {
              uMinMax: mat.uniforms.uMinMax?.value?.toArray?.(),
              uSeaLevel: mat.uniforms.uSeaLevel?.value,
              uLandGradientSize: mat.uniforms.uLandGradientSize?.value,
              uDepthGradientSize: mat.uniforms.uDepthGradientSize?.value,
            }
            : null;

        meshDiagnostics.push({
          name: node.name,
          vertexCount: position?.count ?? 0,
          boundsMin: bounds.min.toArray(),
          boundsMax: bounds.max.toArray(),
          sphereRadius: sphere.radius,
          distanceToCamera: camera.position.distanceTo(sphere.center),
          inFrustum: frustum.intersectsSphere(sphere),
          material: mat.type,
          uniforms,
          computeMarker,
        });
      });

      console.info('[PlanetView:runtime-debug]', {
        planetId: resolved.planetId,
        meshes: meshDiagnostics.length,
        computeFaceCount,
        buildDiagnostics: planetInstance.diagnostics,
        forceBasicMaterial,
        wireframe,
        meshDiagnostics,
      });
    }

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
      updatePlanetLighting(planetInstance.object, keyLight.position.clone().normalize());
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
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Points) {
          child.geometry?.dispose();
          const mat = child.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else if (mat) mat.dispose();
        }
      });

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
          <span className="font-semibold">Renderer:</span> Xenoverse Detailed (canonique)
        </p>
        <p className="mt-1 text-slate-100/90">
          <span className="font-semibold">Pipeline:</span> {pipelineInfo}
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
