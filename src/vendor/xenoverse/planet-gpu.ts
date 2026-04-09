import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import type { CanonicalPlanet } from '@/domain/world/planet-visual.types';
import { getFamilyXenoLayers, sampleXenoElevation } from '@/rendering/planet/core/planet-core-xeno';
import { createPlanetSurfaceGradients, validateGradientReadability } from '@/rendering/planet/core/planet-surface-gradients';
import { isValidElevationRange, resolveSeaLevelFromRange } from '@/rendering/planet/shading-contract';
import { MinMax } from './min-max';
import { buildTerrainFaceGeometry } from './terrain-face';

const FACE_DIRECTIONS: THREE.Vector3[] = [
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(-1, 0, 0),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, -1, 0),
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(0, 0, -1),
];

function toColor(value: [number, number, number]): THREE.Color {
  return new THREE.Color(value[0], value[1], value[2]);
}

function sampleGradient(t: number, anchors: number[], colors: THREE.Color[]): THREE.Color {
  const clamped = THREE.MathUtils.clamp(t, 0, 1);
  let color = colors[0]?.clone() ?? new THREE.Color(1, 0, 1);
  for (let i = 1; i < anchors.length; i += 1) {
    if (clamped <= anchors[i]!) {
      const a = anchors[i - 1] ?? 0;
      const b = anchors[i] ?? 1;
      const blend = THREE.MathUtils.smoothstep(clamped, a, b);
      return colors[i - 1]!.clone().lerp(colors[i]!, blend);
    }
    color = colors[i]!.clone();
  }
  return color;
}

export interface XenoversePlanetGpuOptions {
  renderer: THREE.WebGLRenderer;
  forceBasicMaterial?: boolean;
  wireframe?: boolean;
  preferCompute?: boolean;
  resolution?: number;
}

export interface XenoverseBuildDiagnostics {
  usedComputeFaces: number;
  usedCpuFaces: number;
  fallbackReasons: string[];
  elevationRange: { min: number; max: number };
  seaLevel: number;
  normalizedSeaLevel: number;
}

export interface XenoversePlanetGpuInstance {
  object: THREE.Group;
  diagnostics: XenoverseBuildDiagnostics;
  dispose: () => void;
}

export function createXenoversePlanetGpuInstance(
  planet: CanonicalPlanet,
  options: XenoversePlanetGpuOptions,
): XenoversePlanetGpuInstance {
  const resolution = options.resolution ?? 140;
  const minMax = new MinMax();
  const group = new THREE.Group();
  const disposeTargets: Array<THREE.BufferGeometry | THREE.Material> = [];

  const gradients = createPlanetSurfaceGradients(planet);
  const landStops = [...gradients.land];
  const depthStops = [...gradients.depth];
  while (landStops.length < 6) landStops.push({ anchor: 1, color: landStops[landStops.length - 1].color });
  while (depthStops.length < 6) depthStops.push({ anchor: 1, color: depthStops[depthStops.length - 1].color });

  if (process.env.NODE_ENV !== 'production') {
    const readabilityIssues = validateGradientReadability(landStops, depthStops);
    if (readabilityIssues.length > 0) {
      console.warn('[XenoversePlanetGpu] Gradient readability warnings', {
        planetId: planet.identity.planetId,
        readabilityIssues,
      });
    }
  }

  let usedComputeFaces = 0;
  let usedCpuFaces = 0;
  const fallbackReasons: string[] = [];
  const faceGeometries: THREE.BufferGeometry[] = [];

  for (const faceDir of FACE_DIRECTIONS) {
    const geometry = buildTerrainFaceGeometry({
      localUp: faceDir,
      resolution,
      radius: planet.render.renderRadius,
      seed: planet.render.surface.noiseSeed,
      oceanLevel: planet.render.surface.oceanLevel,
      reliefAmplitude: planet.render.surface.reliefAmplitude,
      family: planet.render.family,
      minMax,
      renderer: options.renderer,
      preferCompute: options.preferCompute ?? true,
    });

    const computeInfo = geometry.userData.computeInfo as { usedCompute: boolean; fallbackReason?: string } | undefined;
    if (computeInfo?.usedCompute) usedComputeFaces += 1;
    else {
      usedCpuFaces += 1;
      if (computeInfo?.fallbackReason) fallbackReasons.push(computeInfo.fallbackReason);
    }

    faceGeometries.push(geometry);
  }

  const merged = BufferGeometryUtils.mergeGeometries(faceGeometries, false);
  if (!merged) {
    throw new Error('Failed to merge Xenoverse face geometries');
  }
  const welded = BufferGeometryUtils.mergeVertices(merged, 1e-4);
  welded.computeVertexNormals();

  const [min, max] = minMax.toPair();
  const safeMax = max > min ? max : min + 0.2;
  const { seaLevel, normalizedSeaLevel } = resolveSeaLevelFromRange(min, safeMax, planet.render.surface.oceanLevel);

  if (process.env.NODE_ENV !== 'production' && !isValidElevationRange(min, safeMax)) {
    console.warn('[XenoversePlanetGpu] Invalid elevation range, fallback applied', {
      planetId: planet.identity.planetId,
      min,
      max: safeMax,
    });
  }

  const landAnchors = landStops.map((s) => s.anchor);
  const depthAnchors = depthStops.map((s) => s.anchor);
  const landColors = landStops.map((s) => toColor(s.color));
  const depthColors = depthStops.map((s) => toColor(s.color));

  const position = welded.getAttribute('position');
  if (position && position.count > 0) {
    const layers = getFamilyXenoLayers(planet.render.family);
    const colors = new Float32Array(position.count * 3);
    const point = new THREE.Vector3();

    for (let i = 0; i < position.count; i += 1) {
      point.set(position.getX(i), position.getY(i), position.getZ(i)).normalize();
      const sample = sampleXenoElevation({
        seed: planet.render.surface.noiseSeed,
        radius: planet.render.renderRadius,
        reliefAmplitude: planet.render.surface.reliefAmplitude,
        oceanLevel: planet.render.surface.oceanLevel,
        layers,
      }, point);
      const e = sample.unscaledElevation;

      const color =
        e > seaLevel
          ? sampleGradient((e - seaLevel) / Math.max(1e-4, safeMax - seaLevel), landAnchors, landColors)
          : sampleGradient((e - min) / Math.max(1e-4, seaLevel - min), depthAnchors, depthColors);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    welded.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }

  const surfaceMaterial: THREE.Material = options.forceBasicMaterial
    ? new THREE.MeshBasicMaterial({ color: '#4df9ff', wireframe: Boolean(options.wireframe) })
    : new THREE.MeshStandardMaterial({
      vertexColors: true,
      wireframe: Boolean(options.wireframe),
      roughness: 0.52,
      metalness: 0.08,
      emissive: toColor(planet.render.surface.accentColor).multiplyScalar(0.04),
    });

  const surface = new THREE.Mesh(welded, surfaceMaterial);
  surface.name = 'xenoverse-surface';
  surface.userData.rotationSpeed = planet.render.surfaceModel === 'gaseous' ? 0.01 : 0.016;
  group.add(surface);
  disposeTargets.push(welded, surfaceMaterial);
  faceGeometries.forEach((g) => g.dispose());

  const seamFill = new THREE.Mesh(
    new THREE.SphereGeometry(planet.render.renderRadius * 0.996, 96, 96),
    new THREE.MeshStandardMaterial({
      color: toColor(planet.render.surface.colorMid),
      roughness: 0.62,
      metalness: 0.03,
    }),
  );
  seamFill.name = 'xenoverse-seam-fill';
  group.add(seamFill);
  disposeTargets.push(seamFill.geometry, seamFill.material);

  if (planet.render.atmosphere.enabled) {
    const atmoGeom = new THREE.SphereGeometry(
      planet.render.renderRadius * (1 + Math.max(0.05, planet.render.atmosphere.thickness + 0.028)),
      112,
      112,
    );
    const atmoMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uAtmosphereColor: { value: toColor(planet.render.atmosphere.color) },
        uDensity: { value: Math.max(0.08, Math.min(0.28, planet.render.atmosphere.density * 0.32)) },
        uRimStrength: { value: Math.max(0.14, Math.min(0.42, planet.render.atmosphere.rimStrength * 0.38)) },
        uLightDirection: { value: new THREE.Vector3(0.38, 0.76, 0.52).normalize() },
      },
      vertexShader: `
        varying vec3 vNormalW;
        varying vec3 vWorldPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          vNormalW = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec3 vNormalW;
        varying vec3 vWorldPos;
        uniform vec3 uAtmosphereColor;
        uniform float uDensity;
        uniform float uRimStrength;
        uniform vec3 uLightDirection;
        void main() {
          vec3 normal = normalize(vNormalW);
          vec3 viewDir = normalize(cameraPosition - vWorldPos);
          float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.2);
          float sun = max(dot(normal, normalize(uLightDirection)), 0.0);
          float alpha = clamp(fresnel * uRimStrength * (0.22 + sun * 0.16) * uDensity, 0.0, 0.14);
          gl_FragColor = vec4(uAtmosphereColor, alpha);
        }
      `,
    });
    const atmo = new THREE.Mesh(atmoGeom, atmoMat);
    atmo.name = 'xenoverse-atmosphere';
    group.add(atmo);
    disposeTargets.push(atmoGeom, atmoMat);
  }

  const diagnostics: XenoverseBuildDiagnostics = {
    usedComputeFaces,
    usedCpuFaces,
    fallbackReasons: [...new Set(fallbackReasons)],
    elevationRange: { min, max: safeMax },
    seaLevel,
    normalizedSeaLevel,
  };

  if (process.env.NODE_ENV !== 'production') {
    console.info('[XenoversePlanetGpu] Face build summary', {
      planetId: planet.identity.planetId,
      ...diagnostics,
      totalFaces: FACE_DIRECTIONS.length,
    });
  }

  return {
    object: group,
    diagnostics,
    dispose: () => {
      for (const target of disposeTargets) target.dispose();
    },
  };
}
