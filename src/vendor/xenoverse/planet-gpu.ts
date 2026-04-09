import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import type { CanonicalPlanet } from '@/domain/world/planet-visual.types';
import { createNoiseContract, sampleNoiseContractElevation } from '@/rendering/planet/core/xenoverse-noise';
import { createPlanetSurfaceGradients, validateGradientReadability } from '@/rendering/planet/core/planet-surface-gradients';
import { isValidElevationRange, resolveSeaLevelFromRange } from '@/rendering/planet/shading-contract';
import { SURFACE_FRAGMENT_SHADER_PLANET, SURFACE_VERTEX_SHADER_PLANET } from '@/rendering/planet/surface/surface-shader-assembly';
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

interface FaceBuildResult {
  geometry: THREE.BufferGeometry;
  localUp: THREE.Vector3;
  axisA: THREE.Vector3;
  axisB: THREE.Vector3;
}

function buildFaceBasis(localUp: THREE.Vector3): { axisA: THREE.Vector3; axisB: THREE.Vector3 } {
  const axisA = new THREE.Vector3(localUp.y, localUp.z, localUp.x);
  const axisB = new THREE.Vector3().crossVectors(localUp, axisA);
  return { axisA, axisB };
}

function buildFaceBorderKey(localUp: THREE.Vector3, axisA: THREE.Vector3, axisB: THREE.Vector3, x: number, y: number, resolution: number): string {
  const px = x / (resolution - 1);
  const py = y / (resolution - 1);
  const pointOnCube = new THREE.Vector3()
    .copy(localUp)
    .addScaledVector(axisA, (px - 0.5) * 2)
    .addScaledVector(axisB, (py - 0.5) * 2)
    .normalize();
  return `${Math.round(pointOnCube.x * 1e6)}:${Math.round(pointOnCube.y * 1e6)}:${Math.round(pointOnCube.z * 1e6)}`;
}

function harmonizeFaceBorders(faces: FaceBuildResult[], resolution: number): void {
  type BorderVertexRef = {
    unit: THREE.Vector3;
    positionAttr: THREE.BufferAttribute;
    elevationAttr: THREE.BufferAttribute | null;
    vertexIndex: number;
    elevation: number;
    radius: number;
  };

  const borderMap = new Map<string, BorderVertexRef[]>();
  const vertex = new THREE.Vector3();

  for (const face of faces) {
    const positionAttr = face.geometry.getAttribute('position') as THREE.BufferAttribute;
    const elevationRaw = face.geometry.getAttribute('aUnscaledElevation');
    const elevationAttr = elevationRaw && elevationRaw instanceof THREE.BufferAttribute ? elevationRaw : null;

    for (let y = 0; y < resolution; y += 1) {
      for (let x = 0; x < resolution; x += 1) {
        if (x !== 0 && y !== 0 && x !== resolution - 1 && y !== resolution - 1) continue;
        const vertexIndex = x + y * resolution;
        vertex.set(positionAttr.getX(vertexIndex), positionAttr.getY(vertexIndex), positionAttr.getZ(vertexIndex));
        const radius = vertex.length();
        if (radius <= 0) continue;
        const unit = vertex.clone().multiplyScalar(1 / radius);
        const elevation = elevationAttr ? elevationAttr.getX(vertexIndex) : 0;

        const key = buildFaceBorderKey(face.localUp, face.axisA, face.axisB, x, y, resolution);
        const refs = borderMap.get(key) ?? [];
        refs.push({
          unit,
          positionAttr,
          elevationAttr,
          vertexIndex,
          elevation,
          radius,
        });
        borderMap.set(key, refs);
      }
    }
  }

  for (const refs of borderMap.values()) {
    if (refs.length <= 1) continue;
    const avgRadius = refs.reduce((sum, ref) => sum + ref.radius, 0) / refs.length;
    const avgElevation = refs.reduce((sum, ref) => sum + ref.elevation, 0) / refs.length;
    for (const ref of refs) {
      ref.positionAttr.setXYZ(
        ref.vertexIndex,
        ref.unit.x * avgRadius,
        ref.unit.y * avgRadius,
        ref.unit.z * avgRadius,
      );
      if (ref.elevationAttr) ref.elevationAttr.setX(ref.vertexIndex, avgElevation);
      ref.positionAttr.needsUpdate = true;
      if (ref.elevationAttr) ref.elevationAttr.needsUpdate = true;
    }
  }
}

function toColor(value: [number, number, number]): THREE.Color {
  return new THREE.Color(value[0], value[1], value[2]);
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
  const noiseContract = createNoiseContract({
    family: planet.render.family,
    seed: planet.render.surface.noiseSeed,
    reliefAmplitude: planet.render.surface.reliefAmplitude,
  });

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

  // Keep face-path build for runtime diagnostics/compute observability.
  let usedComputeFaces = 0;
  let usedCpuFaces = 0;
  const fallbackReasons: string[] = [];
  const builtFaces: FaceBuildResult[] = [];

  for (const faceDir of FACE_DIRECTIONS) {
    const localUp = faceDir.clone();
    const { axisA, axisB } = buildFaceBasis(localUp);
    const faceGeometry = buildTerrainFaceGeometry({
      localUp,
      resolution,
      radius: planet.render.renderRadius,
      seed: planet.render.surface.noiseSeed,
      reliefAmplitude: planet.render.surface.reliefAmplitude,
      family: planet.render.family,
      minMax,
      renderer: options.renderer,
      preferCompute: options.preferCompute ?? true,
    });

    const computeInfo = faceGeometry.userData.computeInfo as { usedCompute: boolean; fallbackReason?: string } | undefined;
    if (computeInfo?.usedCompute) usedComputeFaces += 1;
    else {
      usedCpuFaces += 1;
      if (computeInfo?.fallbackReason) fallbackReasons.push(computeInfo.fallbackReason);
    }

    builtFaces.push({ geometry: faceGeometry, localUp, axisA, axisB });
  }

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

  // Final visible mesh: face-based Xenoverse geometry with border harmonization.
  harmonizeFaceBorders(builtFaces, resolution);

  const merged = BufferGeometryUtils.mergeGeometries(builtFaces.map((face) => face.geometry), false);
  if (!merged) {
    throw new Error('Failed to merge Xenoverse face geometries');
  }
  const renderGeometry = BufferGeometryUtils.mergeVertices(merged, 5e-4);
  merged.dispose();
  renderGeometry.computeVertexNormals();

  const position = renderGeometry.getAttribute('position');
  const elevationRaw = renderGeometry.getAttribute('aUnscaledElevation');
  let elevationAttr = elevationRaw && elevationRaw instanceof THREE.BufferAttribute ? elevationRaw : null;
  if (!elevationAttr) {
    const reconstructed = new Float32Array(position.count);
    const samplePoint = new THREE.Vector3();
    for (let i = 0; i < position.count; i += 1) {
      samplePoint.set(position.getX(i), position.getY(i), position.getZ(i)).normalize();
      reconstructed[i] = sampleNoiseContractElevation(noiseContract, samplePoint).unscaledElevation;
    }
    elevationAttr = new THREE.BufferAttribute(reconstructed, 1);
    renderGeometry.setAttribute('aUnscaledElevation', elevationAttr);
  }

  const landAnchors = landStops.map((s) => s.anchor);
  const depthAnchors = depthStops.map((s) => s.anchor);
  const landColors = landStops.map((s) => toColor(s.color));
  const depthColors = depthStops.map((s) => toColor(s.color));

  const surfaceMaterial: THREE.Material = options.forceBasicMaterial
    ? new THREE.MeshBasicMaterial({ color: '#4df9ff', wireframe: Boolean(options.wireframe) })
    : new THREE.ShaderMaterial({
      vertexShader: SURFACE_VERTEX_SHADER_PLANET,
      fragmentShader: SURFACE_FRAGMENT_SHADER_PLANET,
      wireframe: Boolean(options.wireframe),
      uniforms: {
        uMinMax: { value: new THREE.Vector2(min, safeMax) },
        uSeaLevel: { value: seaLevel },
        uLightDirection: { value: new THREE.Vector3(0.38, 0.76, 0.52).normalize() },
        uAmbientStrength: { value: 0.34 },
        uLandGradientSize: { value: landStops.length },
        uDepthGradientSize: { value: depthStops.length },
        uLandAnchors: { value: landAnchors },
        uDepthAnchors: { value: depthAnchors },
        uLandColors: { value: landColors },
        uDepthColors: { value: depthColors },
      },
    });

  const surface = new THREE.Mesh(renderGeometry, surfaceMaterial);
  surface.name = 'xenoverse-surface';
  surface.userData.rotationSpeed = planet.render.surfaceModel === 'gaseous' ? 0.01 : 0.016;
  group.add(surface);

  disposeTargets.push(renderGeometry, surfaceMaterial);
  builtFaces.forEach((face) => face.geometry.dispose());

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
