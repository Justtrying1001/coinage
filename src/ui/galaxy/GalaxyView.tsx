'use client';

import { useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import { getGalaxyPlanetManifest } from '@/domain/world/build-galaxy-planet-manifest';
import type { CanonicalPlanet } from '@/domain/world/planet-visual.types';
import { GALAXY_LAYOUT_RUNTIME_CONFIG } from '@/domain/world/world.constants';
import { updatePlanetLayerAnimation } from '@/rendering/planet/create-planet-render-instance';
import { createPlanetGalaxyRenderInstance } from '@/rendering/planet/planet-galaxy-renderer';
import { PLANET_LIGHT_DIRECTION, PLANET_RENDER_PHOTOMETRY } from '@/rendering/planet/render-photometry';
import type { PlanetRenderInstance } from '@/rendering/planet/types';
import { createNebulaBackground, createStarfield } from '@/rendering/space/create-starfield';
import { computeGalaxyVisualRadius } from './planet-visual-scale';

const GalaxyHud = dynamic(() => import('./GalaxyHud'), {
  ssr: false,
  loading: () => null,
});

interface GalaxyViewProps {
  worldSeed: string;
}

interface PlanetRenderData {
  id: string;
  x: number;
  y: number;
  radius: number;
  planet: CanonicalPlanet;
}

interface GalaxyPerfCounters {
  totalPlanets: number;
  instantiatedPlanets: number;
  meshCount: number;
  atmosphereCount: number;
  meanPlanetInstantiationMs: number;
  renderCalls: number;
  renderTriangles: number;
  memoryGeometries: number;
  memoryTextures: number;
  frameIdleAvgMs: number;
  frameInteractionAvgMs: number;
  frameBatchAvgMs: number;
  framesIdle: number;
  framesInteraction: number;
  framesBatch: number;
  renderLoopMode: 'active' | 'idle';
  workerQueueDepth: number;
  workerJobsSent: number;
  workerJobsCompleted: number;
  workerJobsFallback: number;
  workerJobAvgMs: number;
  geometryBuildAvgMs: number;
  workerQueueDepthMax: number;
}

interface GalaxyPerfStore {
  marks: Partial<Record<string, number>>;
  measures: Partial<Record<string, number>>;
  counters: GalaxyPerfCounters;
}

declare global {
  interface Window {
    __galaxyPerf?: GalaxyPerfStore;
  }
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
const PLANET_BATCH_SIZE = 24;
const INITIAL_BATCH_CAP = 72;
const PERF_LOG_PREFIX = '[GalaxyPerf]';

function createDefaultCounters(totalPlanets = 0): GalaxyPerfCounters {
  return {
    totalPlanets,
    instantiatedPlanets: 0,
    meshCount: 0,
    atmosphereCount: 0,
    meanPlanetInstantiationMs: 0,
    renderCalls: 0,
    renderTriangles: 0,
    memoryGeometries: 0,
    memoryTextures: 0,
    frameIdleAvgMs: 0,
    frameInteractionAvgMs: 0,
    frameBatchAvgMs: 0,
    framesIdle: 0,
    framesInteraction: 0,
    framesBatch: 0,
    renderLoopMode: 'idle',
    workerQueueDepth: 0,
    workerJobsSent: 0,
    workerJobsCompleted: 0,
    workerJobsFallback: 0,
    workerJobAvgMs: 0,
    geometryBuildAvgMs: 0,
    workerQueueDepthMax: 0,
  };
}

function shouldLogPerf(): boolean {
  return process.env.NODE_ENV !== 'production';
}

function initPerfStore(totalPlanets: number): GalaxyPerfStore | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const store: GalaxyPerfStore = {
    marks: {},
    measures: {},
    counters: createDefaultCounters(totalPlanets),
  };

  window.__galaxyPerf = store;
  return store;
}

function markPerf(store: GalaxyPerfStore | null, name: string): number {
  const now = performance.now();
  performance.mark(name);
  if (store) {
    store.marks[name] = now;
  }
  return now;
}

function measurePerf(
  store: GalaxyPerfStore | null,
  measureName: string,
  startMark: string,
  endMark: string,
): number | null {
  const start = store?.marks[startMark];
  const end = store?.marks[endMark];
  if (start == null || end == null) {
    return null;
  }

  const duration = end - start;
  try {
    performance.measure(measureName, startMark, endMark);
  } catch {
    // Marks can be unavailable during quick remounts; keep runtime resilient.
  }

  if (store) {
    store.measures[measureName] = duration;
  }

  return duration;
}

function getWorldUnitsPerPixel(camera: THREE.OrthographicCamera, viewportWidth: number, viewportHeight: number) {
  const safeWidth = Math.max(1, viewportWidth);
  const safeHeight = Math.max(1, viewportHeight);
  return {
    x: (camera.right - camera.left) / (camera.zoom * safeWidth),
    y: (camera.top - camera.bottom) / (camera.zoom * safeHeight),
  };
}

function isPlanetInsideInitialViewport(
  planet: PlanetRenderData,
  cameraOrigin: THREE.Vector2,
  camera: THREE.OrthographicCamera,
): boolean {
  const halfWidth = (camera.right - camera.left) / (2 * camera.zoom);
  const halfHeight = (camera.top - camera.bottom) / (2 * camera.zoom);
  const marginMultiplier = 1.12;

  return (
    Math.abs(planet.x - cameraOrigin.x) <= halfWidth * marginMultiplier &&
    Math.abs(planet.y - cameraOrigin.y) <= halfHeight * marginMultiplier
  );
}

function distanceSq(planet: PlanetRenderData, origin: THREE.Vector2): number {
  const dx = planet.x - origin.x;
  const dy = planet.y - origin.y;
  return dx * dx + dy * dy;
}

function prioritizePlanets(
  planets: PlanetRenderData[],
  cameraOrigin: THREE.Vector2,
  camera: THREE.OrthographicCamera,
): { queue: PlanetRenderData[]; prioritizedCount: number } {
  const visible: PlanetRenderData[] = [];
  const deferred: PlanetRenderData[] = [];

  for (const planet of planets) {
    if (isPlanetInsideInitialViewport(planet, cameraOrigin, camera)) {
      visible.push(planet);
    } else {
      deferred.push(planet);
    }
  }

  visible.sort((a, b) => distanceSq(a, cameraOrigin) - distanceSq(b, cameraOrigin));
  deferred.sort((a, b) => distanceSq(a, cameraOrigin) - distanceSq(b, cameraOrigin));

  return {
    queue: [...visible, ...deferred],
    prioritizedCount: visible.length,
  };
}

export default function GalaxyView({ worldSeed }: GalaxyViewProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const planetData = useMemo<PlanetRenderData[]>(() => {
    if (typeof performance !== 'undefined') {
      performance.mark('galaxy:manifest:start');
    }

    const manifest = getGalaxyPlanetManifest(worldSeed);

    if (typeof performance !== 'undefined') {
      performance.mark('galaxy:manifest:end');
      try {
        performance.measure('galaxy:manifest', 'galaxy:manifest:start', 'galaxy:manifest:end');
      } catch {
        // Avoid hard-failing when marks are not available in rapid remounts.
      }
    }

    return manifest;
  }, [worldSeed]);

  useEffect(() => {
    const mount = mountRef.current;

    if (!mount) {
      return;
    }

    const perfStore = initPerfStore(planetData.length);
    markPerf(perfStore, 'galaxy:mount:start');

    markPerf(perfStore, 'galaxy:manifest:start');
    markPerf(perfStore, 'galaxy:manifest:end');
    measurePerf(perfStore, 'galaxy:manifest', 'galaxy:manifest:start', 'galaxy:manifest:end');

    markPerf(perfStore, 'galaxy:scene:init:start');

    const scene = new THREE.Scene();
    const nebulaBackground = createNebulaBackground(1200);
    const starfield = createStarfield(3000, 1000);
    scene.add(nebulaBackground);
    scene.add(starfield);
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
    renderer.outputColorSpace = PLANET_RENDER_PHOTOMETRY.outputColorSpace;
    renderer.toneMapping = PLANET_RENDER_PHOTOMETRY.toneMapping;
    renderer.toneMappingExposure = PLANET_RENDER_PHOTOMETRY.galaxyExposure;
    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.style.cursor = 'grab';
    mount.appendChild(renderer.domElement);
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(mount.clientWidth, mount.clientHeight),
      0.12,
      0.4,
      0.88,
    );
    composer.addPass(bloomPass);

    scene.add(new THREE.AmbientLight('#b7d1ff', 1.9));

    const keyLight = new THREE.DirectionalLight('#ffffff', 2.1);
    keyLight.position.copy(PLANET_LIGHT_DIRECTION).multiplyScalar(52);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight('#b6ccff', 1.25);
    fillLight.position.copy(PLANET_LIGHT_DIRECTION).multiplyScalar(-34).add(new THREE.Vector3(0, 6, 8));
    scene.add(fillLight);

    const planetGroup = new THREE.Group();
    const instances: PlanetRenderInstance[] = [];
    const interactivePlanetObjects: THREE.Object3D[] = [];
    const instantiatedPlanetIds = new Set<string>();

    scene.add(planetGroup);
    markPerf(perfStore, 'galaxy:scene:init:end');
    measurePerf(perfStore, 'galaxy:scene:init', 'galaxy:scene:init:start', 'galaxy:scene:init:end');

    const { queue: prioritizedQueue, prioritizedCount } = prioritizePlanets(
      planetData,
      cameraTarget,
      camera,
    );
    const initialBatchTarget = Math.min(
      planetData.length,
      Math.max(PLANET_BATCH_SIZE, Math.min(INITIAL_BATCH_CAP, prioritizedCount || PLANET_BATCH_SIZE)),
    );

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
        invalidateRender();
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key in keyState) {
        keyState[event.key] = false;
        invalidateRender();
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
      renderer.domElement.style.cursor = 'grabbing';
      invalidateRender();
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
      invalidateRender();
    };

    const onPointerUp = (event: PointerEvent) => {
      dragging = false;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId);
      }
      renderer.domElement.style.cursor = 'grab';
      invalidateRender();
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

      const intersections = raycaster.intersectObjects(interactivePlanetObjects, false);
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
      composer.setSize(currentWidth, currentHeight);
      invalidateRender();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('resize', onResize);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('dblclick', onDoubleClick);
    renderer.domElement.addEventListener('contextmenu', onContextMenu);

    const workerConcurrency = Math.min(
      4,
      Math.max(2, Math.floor((navigator.hardwareConcurrency || 4) / 2)),
    );
    
    const MAX_PENDING_PLANET_JOBS = workerConcurrency * 6;
    let queueIndex = 0;
    let completedPlanetCount = 0;
    let pendingPlanetJobs = 0;
    let totalInstantiationMs = 0;
    let totalWorkerJobMs = 0;
    let totalGeometryBuildMs = 0;
    let hasMarkedFirstPlanet = false;
    let hasMarkedInitialBatch = false;
    let batchPumpScheduled = false;
    let disposed = false;
    let renderFrameId: number | null = null;
    let renderScheduled = false;
    let renderInvalidated = true;
    let isBatching = prioritizedQueue.length > 0;
    let previousFrameTime = performance.now();
    let pendingForcedFrames = 0;

    let idleFrameDurationSum = 0;
    let interactionFrameDurationSum = 0;
    let batchFrameDurationSum = 0;

    const updatePerfCounters = () => {
      if (!perfStore) {
        return;
      }

      const renderInfo = renderer.info.render;
      const memoryInfo = renderer.info.memory;

      perfStore.counters.instantiatedPlanets = completedPlanetCount;
      perfStore.counters.renderCalls = renderInfo.calls;
      perfStore.counters.renderTriangles = renderInfo.triangles;
      perfStore.counters.memoryGeometries = memoryInfo.geometries;
      perfStore.counters.memoryTextures = memoryInfo.textures;
      perfStore.counters.meanPlanetInstantiationMs =
        completedPlanetCount > 0 ? totalInstantiationMs / completedPlanetCount : 0;
      perfStore.counters.renderLoopMode = renderScheduled ? 'active' : 'idle';
      perfStore.counters.workerQueueDepth = pendingPlanetJobs;
      perfStore.counters.workerQueueDepthMax = Math.max(
        perfStore.counters.workerQueueDepthMax,
        perfStore.counters.workerQueueDepth,
      );
      perfStore.counters.workerJobAvgMs =
        perfStore.counters.workerJobsCompleted > 0
          ? totalWorkerJobMs / perfStore.counters.workerJobsCompleted
          : 0;
      perfStore.counters.geometryBuildAvgMs =
        completedPlanetCount > 0 ? totalGeometryBuildMs / completedPlanetCount : 0;
    };

    const hasKeyboardInput = () =>
      keyState.ArrowUp ||
      keyState.ArrowDown ||
      keyState.ArrowLeft ||
      keyState.ArrowRight ||
      keyState.w ||
      keyState.a ||
      keyState.s ||
      keyState.d;

    const hasCameraMotion = () => {
      const distanceToTarget = Math.hypot(cameraTarget.x - camera.position.x, cameraTarget.y - camera.position.y);
      return distanceToTarget > 0.02 || Math.hypot(keyboardVelocity.x, keyboardVelocity.y) > 0.02;
    };

    const shouldContinueRendering = () => {
      return renderInvalidated || isBatching || dragging || hasKeyboardInput() || hasCameraMotion() || pendingForcedFrames > 0;
    };

    const scheduleRender = () => {
      if (renderScheduled || disposed) {
        return;
      }

      renderScheduled = true;
      renderFrameId = window.requestAnimationFrame(renderFrame);
    };

    const invalidateRender = (forcedFrames = 2) => {
      renderInvalidated = true;
      pendingForcedFrames = Math.max(pendingForcedFrames, forcedFrames);
      scheduleRender();
    };

    const recordFrameCost = (frameDurationMs: number) => {
      if (!perfStore) {
        return;
      }

      if (isBatching) {
        perfStore.counters.framesBatch += 1;
        batchFrameDurationSum += frameDurationMs;
        perfStore.counters.frameBatchAvgMs = batchFrameDurationSum / perfStore.counters.framesBatch;
        return;
      }

      if (dragging || hasKeyboardInput() || hasCameraMotion()) {
        perfStore.counters.framesInteraction += 1;
        interactionFrameDurationSum += frameDurationMs;
        perfStore.counters.frameInteractionAvgMs =
          interactionFrameDurationSum / perfStore.counters.framesInteraction;
        return;
      }

      perfStore.counters.framesIdle += 1;
      idleFrameDurationSum += frameDurationMs;
      perfStore.counters.frameIdleAvgMs = idleFrameDurationSum / perfStore.counters.framesIdle;
    };

    const instantiatePlanet = async (planet: PlanetRenderData) => {
      if (instantiatedPlanetIds.has(planet.id)) {
        return;
      }

      const visualRadius = computeGalaxyVisualRadius(planet.planet.render.scale);
      if (perfStore) {
        perfStore.counters.workerJobsCompleted += 1;
      }

      const startedAt = performance.now();
      const instance = createPlanetGalaxyRenderInstance({
        planet: planet.planet,
        x: planet.x,
        y: planet.y,
        z: 0,
        options: { viewMode: 'galaxy' },
      });
      const visualScale = visualRadius / Math.max(0.0001, planet.planet.render.renderRadius);
      instance.object.scale.setScalar(visualScale);
      const geometryBuildMs = performance.now() - startedAt;
      totalGeometryBuildMs += geometryBuildMs;
      totalInstantiationMs += geometryBuildMs;

      instance.object.userData.planetId = planet.id;
      let localMeshCount = 0;
      let localAtmosphereCount = 0;
      instance.object.traverse((node) => {
        if (node instanceof THREE.Mesh || node instanceof THREE.Sprite) {
          node.userData.planetId = planet.id;
          interactivePlanetObjects.push(node);
          if (node instanceof THREE.Mesh) {
            localMeshCount += 1;
            const nodeMaterial = node.material as THREE.Material | THREE.Material[];
            const hasShaderMaterial = Array.isArray(nodeMaterial)
              ? nodeMaterial.some((material) => material.type === 'ShaderMaterial')
              : nodeMaterial.type === 'ShaderMaterial';
            if (hasShaderMaterial) {
              localAtmosphereCount += 1;
            }
          }
        }
      });

      instances.push(instance);
      instantiatedPlanetIds.add(planet.id);
      planetGroup.add(instance.object);

      if (perfStore) {
        perfStore.counters.meshCount += localMeshCount;
        perfStore.counters.atmosphereCount += localAtmosphereCount;
      }

      completedPlanetCount += 1;
      pendingPlanetJobs = Math.max(0, pendingPlanetJobs - 1);

      if (!hasMarkedFirstPlanet && completedPlanetCount > 0) {
        hasMarkedFirstPlanet = true;
        markPerf(perfStore, 'galaxy:first-planet-visible');
        measurePerf(
          perfStore,
          'galaxy:time-to-first-planet',
          'galaxy:mount:start',
          'galaxy:first-planet-visible',
        );

        if (shouldLogPerf()) {
          const timeToFirstPlanet = perfStore?.measures['galaxy:time-to-first-planet'] ?? 0;
          console.info(`${PERF_LOG_PREFIX} first planet visible in ${timeToFirstPlanet.toFixed(1)}ms`);
        }
      }

      if (!hasMarkedInitialBatch && completedPlanetCount >= initialBatchTarget) {
        hasMarkedInitialBatch = true;
        markPerf(perfStore, 'galaxy:initial-batch-visible');
        measurePerf(
          perfStore,
          'galaxy:time-to-initial-batch',
          'galaxy:mount:start',
          'galaxy:initial-batch-visible',
        );

        if (shouldLogPerf()) {
          const timeToInitialBatch = perfStore?.measures['galaxy:time-to-initial-batch'] ?? 0;
          console.info(
            `${PERF_LOG_PREFIX} initial batch (${initialBatchTarget}/${planetData.length}) visible in ${timeToInitialBatch.toFixed(1)}ms`,
          );
        }
      }

      updatePerfCounters();
      invalidateRender(3);

      if (completedPlanetCount >= planetData.length && queueIndex >= prioritizedQueue.length) {
        isBatching = false;
        markPerf(perfStore, 'galaxy:all-visible');
        measurePerf(perfStore, 'galaxy:time-to-all-visible', 'galaxy:mount:start', 'galaxy:all-visible');

        if (shouldLogPerf()) {
          const summary = {
            manifestMs: Number((perfStore?.measures['galaxy:manifest'] ?? 0).toFixed(1)),
            sceneInitMs: Number((perfStore?.measures['galaxy:scene:init'] ?? 0).toFixed(1)),
            firstPlanetMs: Number((perfStore?.measures['galaxy:time-to-first-planet'] ?? 0).toFixed(1)),
            initialBatchMs: Number((perfStore?.measures['galaxy:time-to-initial-batch'] ?? 0).toFixed(1)),
            allVisibleMs: Number((perfStore?.measures['galaxy:time-to-all-visible'] ?? 0).toFixed(1)),
            avgInstantiationMs: Number((perfStore?.counters.meanPlanetInstantiationMs ?? 0).toFixed(2)),
            avgWorkerMs: Number((perfStore?.counters.workerJobAvgMs ?? 0).toFixed(2)),
            avgGeometryBuildMs: Number((perfStore?.counters.geometryBuildAvgMs ?? 0).toFixed(2)),
            counters: perfStore?.counters,
          };
          console.info(`${PERF_LOG_PREFIX} complete`, summary);
        }
      } else {
        scheduleNextBatch();
      }
    };

    const runBatch = () => {
      batchPumpScheduled = false;
      let createdInThisSlice = 0;
      while (queueIndex < prioritizedQueue.length && createdInThisSlice < PLANET_BATCH_SIZE) {
        if (pendingPlanetJobs >= MAX_PENDING_PLANET_JOBS) {
          break;
        }

        const planet = prioritizedQueue[queueIndex];
        if (!planet) {
          break;
        }

        queueIndex += 1;
        pendingPlanetJobs += 1;
        if (perfStore) {
          perfStore.counters.workerJobsSent += 1;
        }
        void instantiatePlanet(planet).catch((error) => {
          pendingPlanetJobs = Math.max(0, pendingPlanetJobs - 1);
          if (process.env.NODE_ENV !== 'production') {
            console.warn(`${PERF_LOG_PREFIX} planet job failed`, error);
          }
          scheduleNextBatch();
        });
        createdInThisSlice += 1;
      }

      if (queueIndex < prioritizedQueue.length || pendingPlanetJobs > 0) {
        if (queueIndex < prioritizedQueue.length && pendingPlanetJobs < MAX_PENDING_PLANET_JOBS) {
          scheduleNextBatch();
        }
        return;
      }
    };

    const scheduleNextBatch = () => {
      if (batchPumpScheduled || disposed) {
        return;
      }

      if (queueIndex >= prioritizedQueue.length) {
        return;
      }
      batchPumpScheduled = true;
      queueMicrotask(runBatch);
    };

    scheduleNextBatch();

    const renderFrame = (time: number) => {
      if (disposed) {
        return;
      }
      renderScheduled = false;

      const frameStartedAt = performance.now();
      const delta = Math.min(0.05, (time - previousFrameTime) / 1000);
      previousFrameTime = time;

      let moveX = 0;
      let moveY = 0;

      if (keyState.ArrowLeft || keyState.a) moveX -= 1;
      if (keyState.ArrowRight || keyState.d) moveX += 1;
      if (keyState.ArrowUp || keyState.w) moveY += 1;
      if (keyState.ArrowDown || keyState.s) moveY -= 1;

      const length = Math.hypot(moveX, moveY) || 1;
      const desiredKeyboardVelocityX = moveX === 0 ? 0 : (moveX / length) * MOVE_SPEED;
      const desiredKeyboardVelocityY = moveY === 0 ? 0 : (moveY / length) * MOVE_SPEED;
      const keyboardResponse =
        1 - Math.exp(-(moveX === 0 && moveY === 0 ? KEYBOARD_DECELERATION : KEYBOARD_ACCELERATION) * delta);
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

      for (const instance of instances) {
        updatePlanetLayerAnimation(instance.object, delta);
      }

      composer.render();
      renderInvalidated = false;
      if (pendingForcedFrames > 0) {
        pendingForcedFrames -= 1;
      }
      recordFrameCost(performance.now() - frameStartedAt);
      updatePerfCounters();

      if (shouldContinueRendering()) {
        scheduleRender();
      }
    };
    scheduleRender();

    return () => {
      disposed = true;
      if (renderFrameId != null) {
        cancelAnimationFrame(renderFrameId);
      }


      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('dblclick', onDoubleClick);
      renderer.domElement.removeEventListener('contextmenu', onContextMenu);

      interactivePlanetObjects.length = 0;
      for (const instance of instances) {
        instance.dispose();
      }
      (nebulaBackground.geometry as THREE.BufferGeometry).dispose();
      (nebulaBackground.material as THREE.Material).dispose();
      (starfield.geometry as THREE.BufferGeometry).dispose();
      (starfield.material as THREE.Material).dispose();

      composer.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [planetData, router]);

  return (
    <section className="relative h-full w-full overflow-hidden">
      <GalaxyHud planetCount={planetData.length} />
      <div ref={mountRef} className="h-full w-full" />
    </section>
  );
}
