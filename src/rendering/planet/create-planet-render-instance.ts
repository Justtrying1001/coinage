import * as THREE from 'three';

import { createPlanetViewProfile } from '@/domain/world/generate-planet-visual-profile';
import type { PlanetRenderInput, PlanetRenderInstance } from './types';
import { buildDisplacedSphereGeometry, OCEAN_FAMILIES } from './build-displaced-sphere';

function toColor(v: [number, number, number]): THREE.Color {
  return new THREE.Color(v[0], v[1], v[2]);
}

// ═══════════════════════════════════════════════════════════════════════════
// VERTEX SHADERS
// ═══════════════════════════════════════════════════════════════════════════

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

const SIMPLE_VERTEX_SHADER = `
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

// ═══════════════════════════════════════════════════════════════════════════
// PLANET VIEW — Surface fragment shader (uses terrain vertex attributes)
// Simple altitude-based color ramp, no over-mixing
// ═══════════════════════════════════════════════════════════════════════════

const SURFACE_FRAGMENT_PLANET = `
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

  float sat(float x) { return clamp(x, 0.0, 1.0); }

  void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 L = normalize(vec3(0.5, 0.35, 0.8));

    // --- Altitude color ramp (SIMPLE — deep → mid → high) ---
    vec3 land = mix(uColorDeep, uColorMid, sat(vHeight * 1.5));
    land = mix(land, uColorHigh, sat(vMountainMask));

    // --- Ocean color ---
    vec3 ocean = mix(uOceanColor * 1.1, uOceanColor * 0.6, vOceanDepth);

    // --- Coast sand band ---
    vec3 coast = mix(uAccentColor, land, smoothstep(0.2, 0.8, vCoastMask));

    // --- Solid albedo ---
    vec3 solidAlbedo = mix(ocean, land, vLandMask);
    solidAlbedo = mix(solidAlbedo, coast, vCoastMask * 0.6);

    // --- Gas giant albedo (banded) ---
    vec3 gasBands = mix(uColorDeep, uColorMid, sat(vBandMask));
    gasBands = mix(gasBands, uColorHigh, sat(vThermalMask * 0.4));
    vec3 gasAlbedo = gasBands;

    // --- Pick solid vs gaseous ---
    vec3 albedo = mix(solidAlbedo, gasAlbedo, sat(uSurfaceModel));

    // --- Emissive (lava for volcanic) ---
    albedo += uAccentColor * uEmissive * vThermalMask * 0.6;

    // --- Lighting ---
    float NdL = max(dot(N, L), 0.0);
    float diffuse = NdL * 0.65 + 0.35; // wrapped diffuse

    // Fake AO — valleys darker, peaks lighter
    float ao = 1.0 - vOceanDepth * 0.2 - vErosionMask * 0.08 + vMountainMask * 0.06;
    ao = clamp(ao, 0.6, 1.1);

    // Specular (low for land, moderate for gas)
    vec3 H = normalize(L + V);
    float spec = pow(max(dot(N, H), 0.0), 40.0) * 0.08;
    spec *= mix(1.0, 0.15, sat(uSurfaceModel)); // reduce for gas giants

    // Rim light
    float rim = pow(1.0 - sat(dot(N, V)), 3.0);
    vec3 rimColor = vec3(0.05, 0.08, 0.14) * rim * 0.4;

    vec3 color = albedo * diffuse * ao + vec3(1.0) * spec + rimColor;
    color *= uLightingBoost;

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
  }
`;

// ═══════════════════════════════════════════════════════════════════════════
// GALAXY VIEW — Surface fragment shader (NO terrain attributes, simple noise)
// ═══════════════════════════════════════════════════════════════════════════

const SURFACE_FRAGMENT_GALAXY = `
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vUnitPos;

  uniform vec3 uColorDeep;
  uniform vec3 uColorMid;
  uniform vec3 uColorHigh;
  uniform vec3 uOceanColor;
  uniform vec3 uAccentColor;
  uniform float uSurfaceModel;
  uniform float uSeed;
  uniform float uLightingBoost;

  float sat(float x) { return clamp(x, 0.0, 1.0); }

  // Simple 3D value noise for galaxy view
  float hash31(vec3 p) {
    p = fract(p * vec3(443.897, 441.423, 437.195));
    p += dot(p, p.yzx + 19.19);
    return fract((p.x + p.y) * p.z);
  }

  float vnoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash31(i);
    float b = hash31(i + vec3(1,0,0));
    float c = hash31(i + vec3(0,1,0));
    float d = hash31(i + vec3(1,1,0));
    float e = hash31(i + vec3(0,0,1));
    float f2 = hash31(i + vec3(1,0,1));
    float g = hash31(i + vec3(0,1,1));
    float h = hash31(i + vec3(1,1,1));
    return mix(mix(mix(a,b,f.x), mix(c,d,f.x), f.y),
               mix(mix(e,f2,f.x), mix(g,h,f.x), f.y), f.z);
  }

  float fbm2(vec3 p) {
    return vnoise(p) * 0.6 + vnoise(p * 2.03) * 0.3 + vnoise(p * 4.01) * 0.1;
  }

  void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 L = normalize(vec3(0.5, 0.35, 0.8));
    vec3 p = vUnitPos + vec3(uSeed * 1.7e-7, uSeed * 2.3e-7, uSeed * 2.9e-7);

    // --- Solid planets: continents via low-freq noise ---
    float continent = smoothstep(0.38, 0.58, fbm2(p * 1.8));
    float mountains = smoothstep(0.55, 0.82, fbm2(p * 5.0)) * continent;

    vec3 land = mix(uColorDeep, uColorMid, continent);
    land = mix(land, uColorHigh, mountains * 0.6);
    vec3 ocean = uOceanColor;
    vec3 solidColor = mix(ocean, land, continent);

    // --- Gas giants: horizontal bands ---
    float bands = smoothstep(0.3, 0.7, sin(p.y * 14.0 + fbm2(p * 3.0) * 0.8) * 0.5 + 0.5);
    vec3 gasColor = mix(uColorDeep, uColorMid, bands);
    gasColor = mix(gasColor, uColorHigh, bands * 0.4);

    vec3 albedo = mix(solidColor, gasColor, sat(uSurfaceModel));

    // --- Simple shading ---
    float NdL = max(dot(N, L), 0.0);
    float diffuse = NdL * 0.6 + 0.4;
    float rim = pow(1.0 - sat(dot(N, V)), 2.5) * 0.1;

    vec3 color = albedo * diffuse + vec3(rim);
    color *= uLightingBoost;

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
  }
`;

// ═══════════════════════════════════════════════════════════════════════════
// OCEAN — smooth sphere, dark, reflective
// ═══════════════════════════════════════════════════════════════════════════

const OCEAN_FRAGMENT = `
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vUnitPos;

  uniform vec3 uOceanColor;
  uniform vec3 uDeepColor;
  uniform float uLightingBoost;

  void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 L = normalize(vec3(0.5, 0.35, 0.8));

    float NdL = max(dot(N, L), 0.0);
    float diffuse = NdL * 0.65 + 0.35;

    float depth = abs(vUnitPos.y) * 0.3;
    vec3 color = mix(uOceanColor, uDeepColor, depth);

    // Specular highlight (sun on water)
    vec3 H = normalize(L + V);
    float spec = pow(max(dot(N, H), 0.0), 80.0) * 0.4;

    // Fresnel
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 4.0) * 0.08;

    color = color * diffuse + vec3(1.0) * spec + uOceanColor * fresnel;
    color *= uLightingBoost;

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
  }
`;

// ═══════════════════════════════════════════════════════════════════════════
// CLOUDS — soft voiles, low frequency, semi-transparent
// ═══════════════════════════════════════════════════════════════════════════

const CLOUD_FRAGMENT = `
  varying vec3 vWorldNormal;
  varying vec3 vUnitPos;

  uniform vec3 uCloudColor;
  uniform float uCoverage;
  uniform float uOpacity;
  uniform float uBanding;
  uniform float uSurfaceModel;
  uniform float uSeed;
  uniform float uLightingBoost;

  float hash(vec3 p) {
    p = fract(p * vec3(443.897, 441.423, 437.195));
    p += dot(p, p.yzx + 19.19);
    return fract((p.x + p.y) * p.z);
  }

  float noise(vec3 x) {
    vec3 i = floor(x); vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),
                   mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
                   mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
  }

  float fbm(vec3 p) {
    return noise(p) * 0.55 + noise(p * 2.0) * 0.3 + noise(p * 4.0) * 0.15;
  }

  void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 L = normalize(vec3(0.5, 0.35, 0.8));
    vec3 sv = vec3(uSeed * 1.7e-7, uSeed * 2.3e-7, uSeed * 2.9e-7);

    float macro = fbm((vUnitPos + sv) * mix(3.5, 2.5, uSurfaceModel));
    float jets = sin((vUnitPos.y + uSeed * 1.1e-7) * (10.0 + uBanding * 14.0)) * 0.5 + 0.5;
    float field = mix(macro, jets * 0.6 + macro * 0.4, uSurfaceModel);

    float threshold = 1.0 - uCoverage;
    float mask = smoothstep(threshold - 0.12, threshold + 0.08, field);

    float NdL = max(dot(N, L), 0.0);
    float wrapped = NdL * 0.5 + 0.5;
    float alpha = clamp(mask * uOpacity * 0.65, 0.0, 0.70);

    gl_FragColor = vec4(uCloudColor * wrapped * uLightingBoost, alpha);
  }
`;

// ═══════════════════════════════════════════════════════════════════════════
// ATMOSPHERE — Fresnel rim glow
// ═══════════════════════════════════════════════════════════════════════════

const ATMOSPHERE_FRAGMENT = `
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;

  uniform vec3 uColor;
  uniform float uDensity;
  uniform float uRim;

  void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 L = normalize(vec3(0.5, 0.35, 0.8));

    float rim = pow(1.0 - max(dot(N, V), 0.0), 2.2);
    float day = max(dot(N, L), 0.0);

    vec3 dayColor = uColor * 1.1;
    vec3 duskColor = mix(uColor * 0.7, vec3(1.0, 0.54, 0.3), 0.2);
    vec3 color = mix(dayColor, duskColor, pow(1.0 - day, 2.0));

    float alpha = clamp(rim * (0.3 + uRim * 0.7) + day * uDensity * 0.12, 0.0, 0.85);
    gl_FragColor = vec4(color, alpha);
  }
`;

// ═══════════════════════════════════════════════════════════════════════════
// RINGS — proper UV radial mapping, low frequency bands
// ═══════════════════════════════════════════════════════════════════════════

const RING_VERTEX = `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying vec3 vNormalW;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const RING_FRAGMENT = `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying vec3 vNormalW;

  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uSeed;

  void main() {
    float radial = vUv.x; // 0=inner, 1=outer (remapped UV)

    float band1 = sin(radial * 14.0 + uSeed * 0.0001) * 0.5 + 0.5;
    float band2 = sin(radial * 32.0 + uSeed * 0.00017) * 0.5 + 0.5;
    float grain = band1 * 0.6 + band2 * 0.4;

    float edgeFade = smoothstep(0.0, 0.08, radial) * smoothstep(1.0, 0.92, radial);
    float gap = 1.0 - smoothstep(0.44, 0.46, radial) * (1.0 - smoothstep(0.48, 0.50, radial)) * 0.6;

    vec3 L = normalize(vec3(0.5, 0.35, 0.8));
    vec3 N = normalize(vNormalW);
    float NdL = max(dot(N, L), 0.0);

    float alpha = edgeFade * gap * grain * uOpacity;
    vec3 color = uColor * (0.6 + grain * 0.4) * (NdL * 0.4 + 0.6);

    gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.85));
  }
`;

// ═══════════════════════════════════════════════════════════════════════════
// LAYER CREATION
// ═══════════════════════════════════════════════════════════════════════════

function createSurfaceLayer(
  radius: number,
  render: PlanetRenderInput['planet']['render'],
  segments: number,
  lightingBoost: number,
  highQuality: boolean,
): THREE.Mesh {
  const geometry = highQuality
    ? buildDisplacedSphereGeometry({
        radius,
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
    : new THREE.SphereGeometry(radius, segments, segments);

  const material = new THREE.ShaderMaterial({
    vertexShader: highQuality ? SURFACE_VERTEX_SHADER : SIMPLE_VERTEX_SHADER,
    fragmentShader: highQuality ? SURFACE_FRAGMENT_PLANET : SURFACE_FRAGMENT_GALAXY,
    uniforms: {
      uColorDeep: { value: toColor(render.surface.colorDeep) },
      uColorMid: { value: toColor(render.surface.colorMid) },
      uColorHigh: { value: toColor(render.surface.colorHigh) },
      uOceanColor: { value: toColor(render.surface.oceanColor) },
      uAccentColor: { value: toColor(render.surface.accentColor) },
      uEmissive: { value: render.surface.emissiveIntensity },
      uSurfaceModel: { value: render.surfaceModel === 'gaseous' ? 1 : 0 },
      uSeed: { value: render.surface.noiseSeed },
      uLightingBoost: { value: lightingBoost },
    },
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'surface';
  mesh.userData.rotationSpeed = render.surfaceModel === 'gaseous' ? render.clouds.speed * 0.3 : 0;
  return mesh;
}

function createOceanLayer(
  radius: number,
  render: PlanetRenderInput['planet']['render'],
  segments: number,
  lightingBoost: number,
): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(radius, segments, segments);
  const material = new THREE.ShaderMaterial({
    vertexShader: SIMPLE_VERTEX_SHADER,
    fragmentShader: OCEAN_FRAGMENT,
    uniforms: {
      uOceanColor: { value: toColor(render.surface.oceanColor) },
      uDeepColor: { value: toColor(render.surface.colorDeep) },
      uLightingBoost: { value: lightingBoost },
    },
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'ocean';
  mesh.userData.rotationSpeed = 0;
  return mesh;
}

function createCloudLayer(
  radius: number,
  render: PlanetRenderInput['planet']['render'],
  segments: number,
  lightingBoost: number,
): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(radius * 1.02, segments, segments);
  const material = new THREE.ShaderMaterial({
    vertexShader: SIMPLE_VERTEX_SHADER,
    fragmentShader: CLOUD_FRAGMENT,
    uniforms: {
      uCloudColor: { value: toColor(render.clouds.color) },
      uCoverage: { value: render.clouds.coverage },
      uOpacity: { value: render.clouds.opacity },
      uBanding: { value: render.clouds.stormBanding },
      uSurfaceModel: { value: render.surfaceModel === 'gaseous' ? 1 : 0 },
      uSeed: { value: render.clouds.noiseSeed },
      uLightingBoost: { value: lightingBoost },
    },
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'clouds';
  mesh.userData.rotationSpeed = render.clouds.speed;
  return mesh;
}

function createAtmosphereLayer(
  radius: number,
  render: PlanetRenderInput['planet']['render'],
  segments: number,
): THREE.Mesh {
  const atmRadius = radius * (1.03 + render.atmosphere.thickness);
  const geometry = new THREE.SphereGeometry(atmRadius, segments, segments);
  const material = new THREE.ShaderMaterial({
    vertexShader: SIMPLE_VERTEX_SHADER,
    fragmentShader: ATMOSPHERE_FRAGMENT,
    uniforms: {
      uColor: { value: toColor(render.atmosphere.color) },
      uDensity: { value: render.atmosphere.density },
      uRim: { value: render.atmosphere.rimStrength },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'atmosphere';
  mesh.userData.rotationSpeed = 0;
  return mesh;
}

function createRingLayer(
  render: PlanetRenderInput['planet']['render'],
  segments: number,
): THREE.Mesh {
  const geometry = new THREE.RingGeometry(render.rings.innerRadius, render.rings.outerRadius, segments, 1);

  // Remap UVs: U = radial position (0=inner, 1=outer)
  const pos = geometry.attributes.position;
  const uvs = geometry.attributes.uv;
  const innerR = render.rings.innerRadius;
  const outerR = render.rings.outerRadius;
  const rangeR = Math.max(0.001, outerR - innerR);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const r = Math.sqrt(x * x + y * y);
    uvs.setXY(i, Math.max(0, Math.min(1, (r - innerR) / rangeR)), Math.atan2(y, x) / (2 * Math.PI) + 0.5);
  }
  uvs.needsUpdate = true;

  const material = new THREE.ShaderMaterial({
    vertexShader: RING_VERTEX,
    fragmentShader: RING_FRAGMENT,
    uniforms: {
      uColor: { value: toColor(render.rings.color) },
      uOpacity: { value: render.rings.opacity },
      uSeed: { value: render.rings.noiseSeed },
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

// ═══════════════════════════════════════════════════════════════════════════
// DEBUG LAYER TOGGLE
// ═══════════════════════════════════════════════════════════════════════════

function shouldRenderLayer(
  layer: 'surface' | 'clouds' | 'atmosphere' | 'rings',
  debug: NonNullable<PlanetRenderInput['options']['debug']> | undefined,
): boolean {
  if (!debug) return true;
  const toggles = { surface: debug.surfaceOnly, clouds: debug.cloudsOnly, atmosphere: debug.atmosphereOnly, rings: debug.ringsOnly };
  const enabledExclusive = Object.values(toggles).some(Boolean);
  if (!enabledExclusive) return true;
  return Boolean(toggles[layer]);
}

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATION
// ═══════════════════════════════════════════════════════════════════════════

export function updatePlanetLayerAnimation(object: THREE.Object3D, deltaSeconds: number, freezeRotation = false): void {
  if (freezeRotation) return;
  object.traverse((node) => {
    const speed = typeof node.userData.rotationSpeed === 'number' ? node.userData.rotationSpeed : 0;
    if (speed !== 0 && node instanceof THREE.Mesh) {
      node.rotation.y += speed * deltaSeconds;
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════

export function createPlanetRenderInstance(input: PlanetRenderInput): PlanetRenderInstance {
  const { planet, x, y, z, options } = input;
  const view = createPlanetViewProfile(options.viewMode);
  const highQuality = options.viewMode === 'planet';
  const r = planet.render;

  const group = new THREE.Group();
  group.position.set(x, y, z);

  const segments = highQuality ? view.meshSegments : Math.max(12, view.meshSegments);
  const disposeTargets: Array<THREE.BufferGeometry | THREE.Material> = [];

  // --- OCEAN (planet view only, families with water) ---
  const hasVisibleOcean = view.enableOceanLayer && OCEAN_FAMILIES.includes(r.family);
  if (hasVisibleOcean && shouldRenderLayer('surface', options.debug)) {
    const ocean = createOceanLayer(r.renderRadius, r, segments, view.lightingBoost);
    group.add(ocean);
    disposeTargets.push(ocean.geometry, ocean.material as THREE.Material);
  }

  // --- SURFACE ---
  if (shouldRenderLayer('surface', options.debug)) {
    const surface = createSurfaceLayer(r.renderRadius, r, segments, view.lightingBoost, highQuality);
    group.add(surface);
    disposeTargets.push(surface.geometry, surface.material as THREE.Material);
  }

  // --- CLOUDS (planet view only) ---
  if (view.enableClouds && r.clouds.enabled && shouldRenderLayer('clouds', options.debug)) {
    const clouds = createCloudLayer(r.renderRadius, r, view.cloudSegments, view.lightingBoost);
    group.add(clouds);
    disposeTargets.push(clouds.geometry, clouds.material as THREE.Material);
  }

  // --- ATMOSPHERE (planet view only) ---
  if (view.enableAtmosphere && r.atmosphere.enabled && shouldRenderLayer('atmosphere', options.debug)) {
    const atm = createAtmosphereLayer(r.renderRadius, r, view.atmosphereSegments);
    group.add(atm);
    disposeTargets.push(atm.geometry, atm.material as THREE.Material);
  }

  // --- RINGS ---
  if (view.enableRings && r.rings.enabled && shouldRenderLayer('rings', options.debug)) {
    const rings = createRingLayer(r, view.ringSegments);
    group.add(rings);
    disposeTargets.push(rings.geometry, rings.material as THREE.Material);
  }

  group.rotation.z = planet.visualDNA.rotation.axialTilt;

  // --- Interactive tagging ---
  group.userData.planetId = planet.identity.planetId;
  group.traverse((node) => {
    if (node instanceof THREE.Mesh) {
      node.userData.planetId = planet.identity.planetId;
    }
  });

  const debugSnapshot = {
    planetId: planet.identity.planetId,
    seed: planet.identity.planetSeed,
    family: planet.identity.family,
    radiusClass: planet.identity.radiusClass,
    physicalRadius: planet.generated.physicalRadius,
    renderRadiusBase: r.scale.renderRadiusBase,
    finalMeshScale: highQuality ? r.scale.planetViewScaleMultiplier : r.scale.galaxyViewScaleMultiplier,
    atmosphereThickness: r.atmosphere.enabled ? r.atmosphere.thickness : 0,
    cloudCoverage: r.clouds.enabled ? r.clouds.coverage : 0,
    hasRings: r.rings.enabled,
    paletteId: planet.visualDNA.paletteId,
    activeNoiseFamilies: r.debug.activeNoiseFamilies,
    currentViewMode: view.viewMode,
    currentLOD: view.lod,
  };

  return {
    object: group,
    debugSnapshot,
    dispose: () => {
      for (const t of disposeTargets) t.dispose();
    },
  };
}
