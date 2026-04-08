import * as THREE from 'three';

import { createPlanetViewProfile } from '@/domain/world/generate-planet-visual-profile';
import type { PlanetRenderInput, PlanetRenderInstance } from './types';
import { buildDisplacedSphereGeometry, OCEAN_FAMILIES } from './build-displaced-sphere';
import {
  SURFACE_FRAGMENT_SHADER_GALAXY,
  SURFACE_VERTEX_SHADER_GALAXY,
  SURFACE_VERTEX_SHADER_PLANET,
  getSurfacePlanetFragmentShader,
} from './surface/surface-shader-assembly';

function toColor(value: [number, number, number]): THREE.Color {
  return new THREE.Color(value[0], value[1], value[2]);
}

const SURFACE_FRAGMENT_SHADER_PLANET = getSurfacePlanetFragmentShader();

const FAMILY_INDEX: Record<PlanetRenderInput['planet']['render']['family'], number> = {
  'terrestrial-lush': 0,
  oceanic: 1,
  'desert-arid': 2,
  'ice-frozen': 3,
  'volcanic-infernal': 4,
  'barren-rocky': 5,
  'toxic-alien': 6,
  'gas-giant': 7,
  'ringed-giant': 8,
};

const SHARED_SPHERE_VERTEX_SHADER = `
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vUnitPos;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vUnitPos = normalize(position);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;
const OCEAN_FRAGMENT_SHADER = `
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vUnitPos;

  uniform vec3 uOceanColor;
  uniform vec3 uOceanDeepColor;
  uniform float uShadingContrast;
  uniform float uLightingBoost;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float latDepth = smoothstep(0.0, 1.0, abs(vUnitPos.y));
    float radialDepth = smoothstep(0.15, 0.95, length(vUnitPos.xz));
    float depthVar = clamp(latDepth * 0.32 + radialDepth * 0.38, 0.0, 1.0);
    vec3 color = mix(uOceanColor * 1.22, uOceanDeepColor * 0.92, depthVar);
    float hemisphere = (normal.y * 0.5 + 0.5) * uShadingContrast;
    float fresnel = pow(1.0 - clamp(dot(normal, viewDir), 0.0, 1.0), 3.0) * 0.12;
    float specular = pow(max(dot(normal, normalize(vec3(0.28, 0.86, 0.22))), 0.0), 18.0) * 0.09;
    color *= (1.04 + hemisphere);
    color += vec3(0.08, 0.10, 0.12) * (fresnel + specular);
    color *= uLightingBoost;

    gl_FragColor = vec4(clamp(color, vec3(0.3), vec3(1.0)), 1.0);
  }
`;

const RING_VERTEX_SHADER = `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying vec3 vNormalW;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const RING_FRAGMENT_SHADER = `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying vec3 vNormalW;

  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uSeed;
  uniform float uShadingContrast;

  void main() {
    float radial = vUv.x;
    float band1 = sin(radial * 14.0 + uSeed * 0.0001) * 0.5 + 0.5;
    float band2 = sin(radial * 32.0 + uSeed * 0.00017) * 0.5 + 0.5;
    float grain = band1 * 0.54 + band2 * 0.46;
    float edgeFade = smoothstep(0.0, 0.08, radial) * smoothstep(1.0, 0.92, radial);
    float gap = 1.0 - smoothstep(0.44, 0.46, radial) * (1.0 - smoothstep(0.48, 0.50, radial)) * 0.6;
    float radialGlow = 0.78 + smoothstep(0.15, 0.72, radial) * 0.34 + (1.0 - smoothstep(0.78, 1.0, radial)) * 0.18;

    vec3 normal = normalize(vNormalW);
    float hemisphere = (normal.y * 0.5 + 0.5) * uShadingContrast;

    float alpha = edgeFade * gap * grain * uOpacity * 1.12;
    vec3 color = uColor * 1.12 * (0.86 + grain * 0.45) * radialGlow * (1.0 + hemisphere);

    gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.85));
  }
`;

function createSurfaceLayer(
  planetRadius: number,
  render: PlanetRenderInput['planet']['render'],
  segments: number,
  lightingBoost: number,
  shadingContrast: number,
  highQuality: boolean,
): THREE.Mesh {
  const geometry = highQuality
    ? buildDisplacedSphereGeometry({
      radius: planetRadius,
      segments,
      seed: render.surface.noiseSeed,
      moistureSeed: render.surface.moistureSeed,
      thermalSeed: render.surface.thermalSeed,
      oceanLevel: render.surface.oceanLevel,
      reliefAmplitude: render.surface.reliefAmplitude,
      bandingStrength: render.surface.bandingStrength,
      family: render.family,
      surfaceModel: render.surfaceModel,
    })
    : new THREE.SphereGeometry(planetRadius, Math.max(12, Math.floor(segments)), Math.max(12, Math.floor(segments)));

  const material = new THREE.ShaderMaterial({
    vertexShader: highQuality ? SURFACE_VERTEX_SHADER_PLANET : SURFACE_VERTEX_SHADER_GALAXY,
    fragmentShader: highQuality ? SURFACE_FRAGMENT_SHADER_PLANET : SURFACE_FRAGMENT_SHADER_GALAXY,
    uniforms: {
      uColorDeep: { value: toColor(render.surface.colorDeep) },
      uColorMid: { value: toColor(render.surface.colorMid) },
      uColorHigh: { value: toColor(render.surface.colorHigh) },
      uOceanColor: { value: toColor(render.surface.oceanColor) },
      uAccentColor: { value: toColor(render.surface.accentColor) },
      uEmissive: { value: render.surface.emissiveIntensity },
      uSurfaceModel: { value: render.surfaceModel === 'gaseous' ? 1 : 0 },
      uSeed: { value: render.surface.noiseSeed },
      uRoughness: { value: render.surface.roughness },
      uSpecularStrength: { value: render.surface.specularStrength },
      uBandingStrength: { value: render.surface.bandingStrength },
      uBandSeed: { value: render.surface.bandSeed },
      uFamilyType: { value: FAMILY_INDEX[render.family] ?? 0 },
      uLightingBoost: { value: lightingBoost },
      uShadingContrast: { value: shadingContrast },
    },
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'surface';
  mesh.userData.rotationSpeed = 0;
  return mesh;
}

function createOceanLayer(
  planetRadius: number,
  render: PlanetRenderInput['planet']['render'],
  segments: number,
  lightingBoost: number,
  shadingContrast: number,
  highQuality: boolean,
): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(planetRadius, segments, segments);

  const material = new THREE.ShaderMaterial({
    vertexShader: SHARED_SPHERE_VERTEX_SHADER,
    fragmentShader: OCEAN_FRAGMENT_SHADER,
    uniforms: {
      uOceanColor: { value: toColor(render.surface.oceanColor) },
      uOceanDeepColor: { value: toColor(render.surface.colorDeep) },
      uShadingContrast: { value: shadingContrast * (highQuality ? 0.86 : 0.72) },
      uLightingBoost: { value: lightingBoost },
    },
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'ocean';
  mesh.userData.rotationSpeed = 0;
  return mesh;
}

function createRingLayer(
  render: PlanetRenderInput['planet']['render'],
  segments: number,
  shadingContrast: number,
  highQuality: boolean,
): THREE.Mesh {
  const geometry = new THREE.RingGeometry(render.rings.innerRadius, render.rings.outerRadius, segments, 1);
  const pos = geometry.attributes.position;
  const uvs = geometry.attributes.uv;
  const innerR = render.rings.innerRadius;
  const outerR = render.rings.outerRadius;
  const rangeR = Math.max(0.001, outerR - innerR);
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const r = Math.sqrt(x * x + y * y);
    const radialT = Math.max(0, Math.min(1, (r - innerR) / rangeR));
    const angle = Math.atan2(y, x);
    uvs.setXY(i, radialT, angle / (2 * Math.PI) + 0.5);
  }
  uvs.needsUpdate = true;
  const material = new THREE.ShaderMaterial({
    vertexShader: RING_VERTEX_SHADER,
    fragmentShader: RING_FRAGMENT_SHADER,
    uniforms: {
      uColor: { value: toColor(render.rings.color) },
      uOpacity: { value: Math.min(0.94, render.rings.opacity * 1.32) },
      uSeed: { value: render.rings.noiseSeed },
      uShadingContrast: { value: shadingContrast * (highQuality ? 0.56 : 0.48) },
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const ring = new THREE.Mesh(geometry, material);
  ring.name = 'rings';
  ring.rotation.x = Math.PI / 2 + render.rings.tilt;
  ring.userData.rotationSpeed = 0.01;
  return ring;
}

function shouldRenderLayer(
  layer: 'surface' | 'clouds' | 'atmosphere' | 'rings',
  debug: NonNullable<PlanetRenderInput['options']['debug']> | undefined,
): boolean {
  if (!debug) return true;
  const toggles = {
    surface: debug.surfaceOnly,
    clouds: debug.cloudsOnly,
    atmosphere: debug.atmosphereOnly,
    rings: debug.ringsOnly,
  };

  const enabledExclusive = Object.values(toggles).some(Boolean);
  if (!enabledExclusive) return true;
  return Boolean(toggles[layer]);
}

export function updatePlanetLayerAnimation(object: THREE.Object3D, deltaSeconds: number, freezeRotation = false): void {
  if (freezeRotation) return;

  object.traverse((node) => {
    const speed = typeof node.userData.rotationSpeed === 'number' ? node.userData.rotationSpeed : 0;
    if (speed !== 0 && node instanceof THREE.Mesh) {
      node.rotation.y += speed * deltaSeconds;
    }
  });
}

export function createPlanetRenderInstance(input: PlanetRenderInput): PlanetRenderInstance {
  const { planet, x, y, z, options } = input;
  const view = createPlanetViewProfile(options.viewMode);
  const highQuality = options.viewMode === 'planet';
  if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined' && (window as { __COINAGE_PIPELINE_TRACE?: boolean }).__COINAGE_PIPELINE_TRACE) {
    console.info('[PlanetPipelineTrace]', {
      stage: 'createPlanetRenderInstance',
      planetId: planet.identity.planetId,
      family: planet.render.family,
      surfaceModel: planet.render.surfaceModel,
      viewMode: options.viewMode,
      meshSegments: view.meshSegments,
      noiseSeed: planet.render.surface.noiseSeed,
    });
  }

  const group = new THREE.Group();
  group.position.set(x, y, z);
  const galaxySegments = options.viewMode === 'galaxy'
    ? Math.max(12, Math.min(16, Math.round(12 + planet.render.scale.normalizedRadius * 4)))
    : view.meshSegments;
  const ringSegments = options.viewMode === 'galaxy' ? 64 : view.ringSegments;

  const disposeTargets: Array<THREE.BufferGeometry | THREE.Material | THREE.Material[]> = [];

  if (shouldRenderLayer('surface', options.debug)) {
    const hasVisibleOcean = view.enableOceanLayer && OCEAN_FAMILIES.includes(planet.render.family);
    if (hasVisibleOcean) {
      const ocean = createOceanLayer(
        planet.render.renderRadius,
        planet.render,
        galaxySegments,
        view.lightingBoost,
        view.shadingContrast,
        highQuality,
      );
      group.add(ocean);
      disposeTargets.push(ocean.geometry, ocean.material);
    }

    const surface = createSurfaceLayer(
      planet.render.renderRadius,
      planet.render,
      galaxySegments,
      view.lightingBoost,
      view.shadingContrast,
      highQuality,
    );
    group.add(surface);
    disposeTargets.push(surface.geometry, surface.material);
  }

  const renderClouds = false;
  const renderAtmosphere = false;

  if (view.enableRings && planet.render.rings.enabled && shouldRenderLayer('rings', options.debug)) {
    const rings = createRingLayer(planet.render, ringSegments, view.shadingContrast, highQuality);
    group.add(rings);
    disposeTargets.push(rings.geometry, rings.material);
  }

  group.rotation.z = planet.visualDNA.rotation.axialTilt;

  const debugSnapshot = {
    planetId: planet.identity.planetId,
    seed: planet.identity.planetSeed,
    family: planet.identity.family,
    radiusClass: planet.identity.radiusClass,
    physicalRadius: planet.generated.physicalRadius,
    renderRadiusBase: planet.render.scale.renderRadiusBase,
    finalMeshScale:
      options.viewMode === 'galaxy' ? planet.render.scale.galaxyViewScaleMultiplier : planet.render.scale.planetViewScaleMultiplier,
    atmosphereThickness: renderAtmosphere ? planet.render.atmosphere.thickness : 0,
    cloudCoverage: renderClouds ? planet.render.clouds.coverage : 0,
    hasRings: planet.render.rings.enabled,
    paletteId: planet.visualDNA.paletteId,
    activeNoiseFamilies: planet.render.debug.activeNoiseFamilies,
    currentViewMode: view.viewMode,
    currentLOD: view.lod,
  };

  return {
    object: group,
    debugSnapshot,
    dispose: () => {
      for (const target of disposeTargets) {
        if (Array.isArray(target)) {
          for (const mat of target) mat.dispose();
        } else {
          target.dispose();
        }
      }
    },
  };
}
