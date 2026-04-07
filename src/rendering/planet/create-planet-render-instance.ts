import * as THREE from 'three';

import { createPlanetViewProfile } from '@/domain/world/generate-planet-visual-profile';
import type { PlanetRenderInput, PlanetRenderInstance } from './types';
import { buildDisplacedSphereGeometry, OCEAN_FAMILIES } from './build-displaced-sphere';

function toColor(value: [number, number, number]): THREE.Color {
  return new THREE.Color(value[0], value[1], value[2]);
}

const SURFACE_VERTEX_SHADER = `
  attribute float aHeight;
  attribute float aLandMask;
  attribute float aMountainMask;
  attribute float aCoastMask;
  attribute float aOceanDepth;
  attribute float aContinentMask;
  attribute float aHumidityMask;
  attribute float aTemperatureMask;
  attribute float aErosionMask;
  attribute float aCraterMask;
  attribute float aThermalMask;
  attribute float aBandMask;

  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vUnitPos;
  varying float vHeight;
  varying float vLandMask;
  varying float vMountainMask;
  varying float vCoastMask;
  varying float vOceanDepth;
  varying float vContinentMask;
  varying float vHumidityMask;
  varying float vTemperatureMask;
  varying float vErosionMask;
  varying float vCraterMask;
  varying float vThermalMask;
  varying float vBandMask;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vUnitPos = normalize(position);

    vHeight = aHeight;
    vLandMask = aLandMask;
    vMountainMask = aMountainMask;
    vCoastMask = aCoastMask;
    vOceanDepth = aOceanDepth;
    vContinentMask = aContinentMask;
    vHumidityMask = aHumidityMask;
    vTemperatureMask = aTemperatureMask;
    vErosionMask = aErosionMask;
    vCraterMask = aCraterMask;
    vThermalMask = aThermalMask;
    vBandMask = aBandMask;

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

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

const SURFACE_FRAGMENT_SHADER_GALAXY = `
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying float vHeight;
  varying float vLandMask;
  varying float vMountainMask;
  varying float vCoastMask;
  varying float vOceanDepth;
  varying float vBandMask;

  uniform vec3 uColorDeep;
  uniform vec3 uColorMid;
  uniform vec3 uColorHigh;
  uniform vec3 uOceanColor;
  uniform vec3 uAccentColor;
  uniform float uSurfaceModel;
  uniform float uLightingBoost;
  uniform float uShadingContrast;

  float sat(float x) { return clamp(x, 0.0, 1.0); }

  void main() {
    vec3 normal = normalize(vWorldNormal);

    vec3 land = mix(uColorDeep, uColorMid, sat(vHeight * 1.35 + 0.2));
    land = mix(land, uColorHigh, sat(vMountainMask * 0.55));
    land = mix(land, uAccentColor, vCoastMask * 0.25);

    vec3 ocean = mix(uOceanColor * 1.35, uOceanColor * 0.88, sat(vOceanDepth * 0.9));
    vec3 coast = mix(ocean * 1.08, land, smoothstep(0.25, 0.85, vCoastMask));

    vec3 albedo = mix(ocean, land, vLandMask);
    albedo = mix(albedo, coast, vCoastMask);

    vec3 gas = mix(uColorDeep, uColorMid, sat(vBandMask));
    gas = mix(gas, uColorHigh, sat(vBandMask * 0.45));
    albedo = mix(albedo, gas, sat(uSurfaceModel));

    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float softShading = (normal.y * 0.5 + 0.5) * uShadingContrast;
    float rim = pow(1.0 - sat(dot(normal, viewDir)), 2.2) * 0.12;
    float specular = pow(max(dot(normal, normalize(vec3(0.35, 0.75, 0.25))), 0.0), 10.0) * 0.08;
    float tonal = 1.08 + softShading + rim + specular;
    vec3 color = albedo * tonal + albedo * 0.05;
    color = clamp(color * uLightingBoost, vec3(0.27), vec3(1.0));

    gl_FragColor = vec4(color, 1.0);
  }
`;

const SURFACE_FRAGMENT_SHADER_PLANET = `
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vUnitPos;
  varying float vHeight;
  varying float vLandMask;
  varying float vMountainMask;
  varying float vCoastMask;
  varying float vOceanDepth;
  varying float vContinentMask;
  varying float vHumidityMask;
  varying float vTemperatureMask;
  varying float vErosionMask;
  varying float vCraterMask;
  varying float vThermalMask;
  varying float vBandMask;

  uniform vec3 uColorDeep;
  uniform vec3 uColorMid;
  uniform vec3 uColorHigh;
  uniform vec3 uOceanColor;
  uniform vec3 uAccentColor;
  uniform float uEmissive;
  uniform float uSurfaceModel;
  uniform float uLightingBoost;
  uniform float uShadingContrast;

  float sat(float x) { return clamp(x, 0.0, 1.0); }

  void main() {
    vec3 normal = normalize(vWorldNormal);
    float continent = sat(vContinentMask * 0.82 + vLandMask * 0.18 - vErosionMask * 0.08);
    float humidity = sat(vHumidityMask * 0.84 + 0.16);
    float temperature = sat(vTemperatureMask * 0.8 + 0.2);
    float heightNorm = sat(vHeight * 1.08 + vMountainMask * 0.22);

    vec3 oceanEdge = uOceanColor * vec3(1.45, 1.38, 1.30);
    vec3 oceanDeep = uOceanColor * vec3(0.78, 0.84, 0.94);
    float oceanT = sat(vOceanDepth * 0.92 + (1.0 - continent) * 0.18);
    float oceanVariation = sin(vUnitPos.x * 10.0 + vUnitPos.z * 8.0 + vOceanDepth * 3.2) * 0.03;
    vec3 oceanColor = mix(oceanEdge, oceanDeep, oceanT + oceanVariation);

    float coastMask = smoothstep(0.18, 0.76, vCoastMask);
    float coastBlend = smoothstep(0.0, 0.12, coastMask);
    float plainsMask = smoothstep(0.18, 0.5, heightNorm);
    float plateauMask = smoothstep(0.42, 0.74, heightNorm);
    float mountainPeak = smoothstep(0.68, 0.94, heightNorm + vMountainMask * 0.42);

    vec3 coast = mix(oceanColor * 1.14, uColorMid * 1.08, coastBlend);
    vec3 plains = mix(uColorDeep * 1.08, uColorMid * 1.18, humidity * 0.55);
    vec3 plateau = mix(plains, uColorHigh * 1.08, plateauMask * 0.72 + continent * 0.18);
    vec3 mountain = mix(plateau, uColorHigh * 1.18 + vec3(0.05), mountainPeak);

    float biomeHot = smoothstep(0.62, 0.9, temperature);
    float biomeCold = smoothstep(0.08, 0.34, 1.0 - temperature);
    float biomeDry = smoothstep(0.52, 0.9, 1.0 - humidity);
    vec3 biomeTint = mix(vec3(0.96, 1.02, 0.98), vec3(1.05, 0.98, 0.92), biomeHot * biomeDry);
    biomeTint = mix(biomeTint, vec3(0.94, 0.98, 1.06), biomeCold * (0.45 + humidity * 0.25));

    vec3 landBase = mix(plains, plateau, plainsMask);
    landBase = mix(landBase, mountain, sat(vMountainMask * 0.82 + mountainPeak * 0.52));
    landBase *= biomeTint;
    landBase = mix(landBase, coast, coastMask * 0.66);

    vec3 solidAlbedo = mix(oceanColor, landBase, vLandMask);
    solidAlbedo = mix(solidAlbedo, coast, coastMask);

    vec3 gasBands = mix(uColorDeep * 1.05, uColorMid * 1.1, sat(vBandMask * 0.92));
    gasBands = mix(gasBands, uColorHigh * 1.15, sat(vThermalMask * 0.48 + vTemperatureMask * 0.26));
    vec3 gasStorms = mix(gasBands, uAccentColor * 1.08, sat(vThermalMask * 0.7));
    vec3 gaseousAlbedo = mix(gasBands, gasStorms, sat(vBandMask * 0.56 + vThermalMask * 0.42));

    vec3 albedo = mix(solidAlbedo, gaseousAlbedo, sat(uSurfaceModel));

    float reliefShade = (heightNorm * 0.13) + (vMountainMask * 0.12) - (vOceanDepth * 0.02);
    float hemisphere = (normal.y * 0.5 + 0.5) * uShadingContrast;
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float rim = pow(1.0 - sat(dot(normal, viewDir)), 2.4) * 0.1;
    float specular = pow(max(dot(normal, normalize(vec3(0.34, 0.77, 0.18))), 0.0), 12.0) * 0.07;
    float tonal = clamp(1.08 + hemisphere + reliefShade + rim + specular, 0.98, 1.34);

    vec3 color = albedo * tonal;
    color += uAccentColor * (uEmissive * (vThermalMask * 0.65 + vBandMask * 0.16));
    color = clamp(color * uLightingBoost, vec3(0.24), vec3(1.0));
    gl_FragColor = vec4(color, 1.0);
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
    float depthVar = abs(vUnitPos.y) * 0.25;
    vec3 color = mix(uOceanColor, uOceanDeepColor, depthVar);
    float hemisphere = (normal.y * 0.5 + 0.5 - 0.5) * uShadingContrast;
    color *= (1.0 + hemisphere);
    color *= uLightingBoost;

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
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

    float alpha = edgeFade * gap * grain * uOpacity;
    vec3 color = uColor * (0.82 + grain * 0.42) * radialGlow * (1.0 + hemisphere);

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
  const geometry = buildDisplacedSphereGeometry({
    radius: planetRadius,
    segments: highQuality ? segments : Math.max(12, Math.floor(segments)),
    seed: render.surface.noiseSeed,
    moistureSeed: render.surface.moistureSeed,
    thermalSeed: render.surface.thermalSeed,
    oceanLevel: render.surface.oceanLevel,
    reliefAmplitude: highQuality ? render.surface.reliefAmplitude : render.surface.reliefAmplitude * 0.85,
    bandingStrength: render.surface.bandingStrength,
    family: render.family,
    surfaceModel: render.surfaceModel,
  });

  const material = new THREE.ShaderMaterial({
    vertexShader: SURFACE_VERTEX_SHADER,
    fragmentShader: highQuality ? SURFACE_FRAGMENT_SHADER_PLANET : SURFACE_FRAGMENT_SHADER_GALAXY,
    uniforms: {
      uColorDeep: { value: toColor(render.surface.colorDeep) },
      uColorMid: { value: toColor(render.surface.colorMid) },
      uColorHigh: { value: toColor(render.surface.colorHigh) },
      uOceanColor: { value: toColor(render.surface.oceanColor) },
      uAccentColor: { value: toColor(render.surface.accentColor) },
      uEmissive: { value: render.surface.emissiveIntensity },
      uSurfaceModel: { value: render.surfaceModel === 'gaseous' ? 1 : 0 },
      uLightingBoost: { value: lightingBoost },
      uShadingContrast: { value: shadingContrast },
    },
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'surface';
  mesh.userData.rotationSpeed = render.surfaceModel === 'gaseous' ? render.clouds.speed * 0.3 : 0;
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
      uOpacity: { value: render.rings.opacity },
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

  const renderClouds = view.enableClouds && planet.render.clouds.enabled && shouldRenderLayer('clouds', options.debug);
  const renderAtmosphere = view.enableAtmosphere && planet.render.atmosphere.enabled && shouldRenderLayer('atmosphere', options.debug);

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
