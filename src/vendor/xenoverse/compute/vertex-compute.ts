import * as THREE from 'three';

import type { XenoverseNoiseContract } from '@/rendering/planet/core/xenoverse-noise';

const COMPUTE_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const COMPUTE_FRAGMENT_SHADER = `
  precision highp float;

  varying vec2 vUv;

  #define MAX_LAYERS 8

  uniform vec3 uLocalUp;
  uniform vec3 uAxisA;
  uniform vec3 uAxisB;
  uniform float uRadius;
  uniform float uReliefAmplitude;
  uniform float uSeed;
  uniform float uLayerCount;
  uniform float uStrength[MAX_LAYERS];
  uniform float uRoughness[MAX_LAYERS];
  uniform float uBaseRoughness[MAX_LAYERS];
  uniform float uPersistence[MAX_LAYERS];
  uniform float uMinValue[MAX_LAYERS];
  uniform float uLayerSteps[MAX_LAYERS];
  uniform float uUseMask[MAX_LAYERS];
  uniform float uFilterType[MAX_LAYERS];
  uniform float uEnabled[MAX_LAYERS];
  uniform vec3 uCenter[MAX_LAYERS];

  float hash31(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7)) + uSeed * 0.00000137) * 43758.5453123);
  }

  float valueNoise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);

    float n000 = hash31(i + vec3(0,0,0));
    float n100 = hash31(i + vec3(1,0,0));
    float n010 = hash31(i + vec3(0,1,0));
    float n110 = hash31(i + vec3(1,1,0));
    float n001 = hash31(i + vec3(0,0,1));
    float n101 = hash31(i + vec3(1,0,1));
    float n011 = hash31(i + vec3(0,1,1));
    float n111 = hash31(i + vec3(1,1,1));

    float nx00 = mix(n000, n100, u.x);
    float nx10 = mix(n010, n110, u.x);
    float nx01 = mix(n001, n101, u.x);
    float nx11 = mix(n011, n111, u.x);
    float nxy0 = mix(nx00, nx10, u.y);
    float nxy1 = mix(nx01, nx11, u.y);
    return mix(nxy0, nxy1, u.z);
  }

  float evalLayer(vec3 p, int idx) {
    float noise = 0.0;
    float frequency = uBaseRoughness[idx];
    float amplitude = 1.0;
    float weight = 1.0;
    int steps = int(uLayerSteps[idx]);

    for (int i = 0; i < 8; i++) {
      if (i >= steps) break;
      float v = valueNoise3(p * frequency + uCenter[idx] + vec3(float(i) * 0.0137));
      if (uFilterType[idx] > 0.5) {
        float ridge = 1.0 - abs(v * 2.0 - 1.0);
        ridge *= ridge;
        ridge *= weight;
        weight = clamp(ridge * 1.9, 0.0, 1.0);
        noise += ridge * amplitude;
      } else {
        noise += v * amplitude;
      }
      frequency *= uRoughness[idx];
      amplitude *= uPersistence[idx];
    }

    return (noise - uMinValue[idx]) * uStrength[idx];
  }

  void main() {
    vec3 pointOnCube = normalize(uLocalUp + (vUv.x - 0.5) * 2.0 * uAxisA + (vUv.y - 0.5) * 2.0 * uAxisB);

    float first = 1.0;
    if (uLayerCount > 0.5 && uEnabled[0] > 0.5) {
      first = max(0.0, evalLayer(pointOnCube, 0));
    }

    float elevation = 0.0;
    bool captured = false;
    for (int i = 0; i < MAX_LAYERS; i++) {
      if (float(i) >= uLayerCount) break;
      if (uEnabled[i] < 0.5) continue;

      float v = evalLayer(pointOnCube, i);
      if (uUseMask[i] > 0.5) v *= first;
      elevation += captured ? max(0.0, v) : v;
      captured = true;
    }

    float scaled = max(0.0, elevation) * uReliefAmplitude;
    vec3 displaced = pointOnCube * (uRadius * (1.0 + scaled));
    gl_FragColor = vec4(displaced, elevation);
  }
`;

export interface ComputeFaceInput {
  renderer: THREE.WebGLRenderer;
  localUp: THREE.Vector3;
  axisA: THREE.Vector3;
  axisB: THREE.Vector3;
  resolution: number;
  radius: number;
  contract: XenoverseNoiseContract;
}

export interface ComputeFaceOutput {
  positions: Float32Array;
  elevations: Float32Array;
  usedCompute: boolean;
}

export function runVertexComputeFace(input: ComputeFaceInput): ComputeFaceOutput {
  const { renderer, localUp, axisA, axisB, resolution, radius, contract } = input;
  const layers = contract.filters;
  const gl = renderer.getContext();
  const supportsFloatReadback = renderer.capabilities.isWebGL2 && gl instanceof WebGL2RenderingContext;
  if (!supportsFloatReadback) {
    throw new Error('WebGL2 float readback unavailable');
  }

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      vertexShader: COMPUTE_VERTEX_SHADER,
      fragmentShader: COMPUTE_FRAGMENT_SHADER,
      uniforms: {
        uLocalUp: { value: localUp },
        uAxisA: { value: axisA },
        uAxisB: { value: axisB },
        uRadius: { value: radius },
        uReliefAmplitude: { value: contract.reliefAmplitude },
        uSeed: { value: contract.seed },
        uLayerCount: { value: Math.min(layers.length, 8) },
        uStrength: { value: Array.from({ length: 8 }, (_, i) => layers[i]?.strength ?? 0) },
        uRoughness: { value: Array.from({ length: 8 }, (_, i) => layers[i]?.roughness ?? 1) },
        uBaseRoughness: { value: Array.from({ length: 8 }, (_, i) => layers[i]?.baseRoughness ?? 1) },
        uPersistence: { value: Array.from({ length: 8 }, (_, i) => layers[i]?.persistence ?? 0.5) },
        uMinValue: { value: Array.from({ length: 8 }, (_, i) => layers[i]?.minValue ?? 0) },
        uLayerSteps: { value: Array.from({ length: 8 }, (_, i) => layers[i]?.layerCount ?? 0) },
        uUseMask: { value: Array.from({ length: 8 }, (_, i) => (layers[i]?.useFirstLayerAsMask ? 1 : 0)) },
        uFilterType: { value: Array.from({ length: 8 }, (_, i) => (layers[i]?.filterType === 'ridged' ? 1 : 0)) },
        uEnabled: { value: Array.from({ length: 8 }, (_, i) => (layers[i]?.enabled ? 1 : 0)) },
        uCenter: { value: Array.from({ length: 8 }, (_, i) => new THREE.Vector3(...(layers[i]?.center ?? [0, 0, 0]))) },
      },
      depthWrite: false,
      depthTest: false,
    }),
  );
  scene.add(quad);

  const target = new THREE.WebGLRenderTarget(resolution, resolution, {
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    depthBuffer: false,
    stencilBuffer: false,
  });

  const previousTarget = renderer.getRenderTarget();
  renderer.setRenderTarget(target);
  renderer.render(scene, camera);

  const pixels = new Float32Array(resolution * resolution * 4);
  renderer.readRenderTargetPixels(target, 0, 0, resolution, resolution, pixels);
  renderer.setRenderTarget(previousTarget);

  const positions = new Float32Array(resolution * resolution * 3);
  const elevations = new Float32Array(resolution * resolution);
  let invalidSamples = 0;
  let minRadius = Number.POSITIVE_INFINITY;
  let maxRadius = 0;
  for (let i = 0; i < resolution * resolution; i += 1) {
    const x = pixels[i * 4];
    const y = pixels[i * 4 + 1];
    const z = pixels[i * 4 + 2];
    const elevation = pixels[i * 4 + 3];
    const valid = Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z) && Number.isFinite(elevation);
    if (!valid) {
      invalidSamples += 1;
      continue;
    }
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    elevations[i] = elevation;

    const radiusSample = Math.hypot(x, y, z);
    minRadius = Math.min(minRadius, radiusSample);
    maxRadius = Math.max(maxRadius, radiusSample);
  }

  quad.geometry.dispose();
  (quad.material as THREE.Material).dispose();
  target.dispose();

  const invalidRatio = invalidSamples / Math.max(1, resolution * resolution);
  const suspiciousRadius = !Number.isFinite(minRadius)
    || !Number.isFinite(maxRadius)
    || minRadius <= 0
    || maxRadius <= 0
    || maxRadius > radius * 8;
  if (invalidRatio > 0.0001 || suspiciousRadius) {
    throw new Error(
      `compute-readback-invalid invalidRatio=${invalidRatio.toFixed(4)} minRadius=${minRadius} maxRadius=${maxRadius}`,
    );
  }

  return { positions, elevations, usedCompute: true };
}
