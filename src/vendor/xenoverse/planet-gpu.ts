import * as THREE from 'three';

import type { CanonicalPlanet } from '@/domain/world/planet-visual.types';
import { getFamilyGradients } from '@/rendering/planet/core/planet-core-xeno';
import {
  SURFACE_FRAGMENT_SHADER_PLANET,
  SURFACE_VERTEX_SHADER_PLANET,
} from '@/rendering/planet/surface/surface-shader-assembly';
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

export interface XenoversePlanetGpuOptions {
  renderer: THREE.WebGLRenderer;
  forceBasicMaterial?: boolean;
  wireframe?: boolean;
  preferCompute?: boolean;
}

export interface XenoversePlanetGpuInstance {
  object: THREE.Group;
  dispose: () => void;
}

/**
 * Vendor-port path aligned with XenoverseUp face-based planet assembly.
 * NOTE: current stack does not include the original GPU compute + readback stage.
 */
export function createXenoversePlanetGpuInstance(
  planet: CanonicalPlanet,
  options: XenoversePlanetGpuOptions,
): XenoversePlanetGpuInstance {
  const resolution = 140;
  const minMax = new MinMax();
  const group = new THREE.Group();
  const disposeTargets: Array<THREE.BufferGeometry | THREE.Material> = [];

  const gradients = getFamilyGradients(planet.render.family);
  const landStops = [...gradients.land];
  const depthStops = [...gradients.depth];
  while (landStops.length < 6) landStops.push({ anchor: 1, color: landStops[landStops.length - 1].color });
  while (depthStops.length < 6) depthStops.push({ anchor: 1, color: depthStops[depthStops.length - 1].color });

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

    const material: THREE.Material = options.forceBasicMaterial
      ? new THREE.MeshBasicMaterial({
        color: '#4df9ff',
        wireframe: Boolean(options.wireframe),
      })
      : new THREE.ShaderMaterial({
        vertexShader: SURFACE_VERTEX_SHADER_PLANET,
        fragmentShader: SURFACE_FRAGMENT_SHADER_PLANET,
        wireframe: Boolean(options.wireframe),
        uniforms: {
          uMinMax: { value: new THREE.Vector2(0, 1) },
          uSeaLevel: { value: 0.0 },
          uLightDirection: { value: new THREE.Vector3(0.38, 0.76, 0.52).normalize() },
          uLandGradientSize: { value: gradients.land.length },
          uDepthGradientSize: { value: gradients.depth.length },
          uLandAnchors: { value: landStops.map((s) => s.anchor) },
          uDepthAnchors: { value: depthStops.map((s) => s.anchor) },
          uLandColors: { value: landStops.map((s) => toColor(s.color)) },
          uDepthColors: { value: depthStops.map((s) => toColor(s.color)) },
        },
      });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'xenoverse-face';
    mesh.userData.rotationSpeed = planet.render.surfaceModel === 'gaseous' ? 0.01 : 0.016;
    group.add(mesh);
    disposeTargets.push(geometry, material);
  }

  const [min, max] = minMax.toPair();
  group.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    if (!(node.material instanceof THREE.ShaderMaterial)) return;
    node.material.uniforms.uMinMax.value.set(min, max > min ? max : min + 0.2);
  });

  if (planet.render.atmosphere.enabled) {
    const atmoGeom = new THREE.SphereGeometry(
      planet.render.renderRadius * (1 + Math.max(0.05, planet.render.atmosphere.thickness + 0.028)),
      120,
      120,
    );
    const atmoMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uAtmosphereColor: { value: toColor(planet.render.atmosphere.color) },
        uDensity: { value: Math.max(0.08, Math.min(0.28, planet.render.atmosphere.density * 0.36)) },
        uRimStrength: { value: Math.max(0.14, Math.min(0.42, planet.render.atmosphere.rimStrength * 0.42)) },
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
        varying vec3 vNormalW;
        varying vec3 vWorldPos;
        uniform vec3 uAtmosphereColor;
        uniform float uDensity;
        uniform float uRimStrength;
        uniform vec3 uLightDirection;
        void main() {
          vec3 normal = normalize(vNormalW);
          vec3 viewDir = normalize(cameraPosition - vWorldPos);
          float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.1);
          float sun = max(dot(normal, normalize(uLightDirection)), 0.0);
          float alpha = clamp(fresnel * uRimStrength * (0.28 + sun * 0.18) * uDensity, 0.0, 0.18);
          gl_FragColor = vec4(uAtmosphereColor, alpha);
        }
      `,
    });
    const atmo = new THREE.Mesh(atmoGeom, atmoMat);
    atmo.name = 'xenoverse-atmosphere';
    group.add(atmo);
    disposeTargets.push(atmoGeom, atmoMat);
  }

  if (process.env.NODE_ENV !== 'production') {
    let computeFaces = 0;
    group.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      if (node.name !== 'xenoverse-face') return;
      const uv = node.geometry.getAttribute('uv');
      if (!uv || uv.count === 0) return;
      const marker = uv.getY(0);
      if (marker > 0.5) computeFaces += 1;
    });
    console.info('[XenoversePlanetGpu] Face build summary', {
      planetId: planet.identity.planetId,
      computeFaces,
      totalFaces: FACE_DIRECTIONS.length,
    });
  }

  return {
    object: group,
    dispose: () => {
      for (const target of disposeTargets) target.dispose();
    },
  };
}
