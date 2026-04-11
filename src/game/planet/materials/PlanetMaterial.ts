import * as THREE from 'three';
import type { GradientStop } from '@/game/planet/types';

const MAX_STOPS = 6;

export function createPlanetMaterial(
  elevationGradient: GradientStop[],
  depthGradient: GradientStop[],
  minElevation: number,
  maxElevation: number,
  blendDepth: number,
  roughness: number,
  metalness: number,
  vegetationDensity: number,
  wetness: number,
) {
  const normalizedElevation = normalizeStops(elevationGradient, [1, 1, 1]);
  const normalizedDepth = normalizeStops(depthGradient, [0, 0, 0.5]);

  return new THREE.ShaderMaterial({
    uniforms: {
      uMinMax: { value: new THREE.Vector2(minElevation, maxElevation) },
      uElevationSize: { value: elevationGradient.length },
      uDepthSize: { value: depthGradient.length },
      uElevationAnchors: { value: normalizedElevation.map((s) => s.anchor) },
      uElevationColors: { value: normalizedElevation.map((s) => new THREE.Vector3(...s.color)) },
      uDepthAnchors: { value: normalizedDepth.map((s) => s.anchor) },
      uDepthColors: { value: normalizedDepth.map((s) => new THREE.Vector3(...s.color)) },
      uRoughness: { value: roughness },
      uMetalness: { value: metalness },
      uVegetationDensity: { value: vegetationDensity },
      uWetness: { value: wetness },
      uLightDirection: { value: new THREE.Vector3(0.85, 0.35, 0.55).normalize() },
      uBlendDepth: { value: Math.max(0.001, blendDepth) },
    },
    vertexShader: `
      attribute float aElevation;
      varying float vElevation;
      varying vec3 vNormalW;
      varying vec3 vPositionW;
      void main() {
        vElevation = aElevation;
        vec4 world = modelMatrix * vec4(position, 1.0);
        vPositionW = world.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      precision highp float;
      const int MAX_STOPS = ${MAX_STOPS};
      uniform vec2 uMinMax;
      uniform int uElevationSize;
      uniform int uDepthSize;
      uniform float uElevationAnchors[MAX_STOPS];
      uniform vec3 uElevationColors[MAX_STOPS];
      uniform float uDepthAnchors[MAX_STOPS];
      uniform vec3 uDepthColors[MAX_STOPS];
      uniform float uRoughness;
      uniform float uMetalness;
      uniform float uVegetationDensity;
      uniform float uWetness;
      uniform vec3 uLightDirection;
      uniform float uBlendDepth;
      varying float vElevation;
      varying vec3 vNormalW;
      varying vec3 vPositionW;

      float invLerp(float a, float b, float v){
        if(abs(b-a)<0.000001) return 0.0;
        return clamp((v-a)/(b-a), 0.0, 1.0);
      }

      vec3 gradientColor(float v, int size, float anchors[MAX_STOPS], vec3 colors[MAX_STOPS]) {
        if(size <= 1) return colors[0];
        if(v <= anchors[0]) return colors[0];
        for (int i=1;i<MAX_STOPS;i++) {
          if(i >= size) break;
          if(v <= anchors[i]) {
            float t = smoothstep(anchors[i-1], anchors[i], v);
            return mix(colors[i-1], colors[i], t);
          }
        }
        return colors[size - 1];
      }

      float hash31(vec3 p) {
        return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
      }

      float noise3(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        vec3 u = f * f * (3.0 - 2.0 * f);

        return mix(
          mix(
            mix(hash31(i + vec3(0.0, 0.0, 0.0)), hash31(i + vec3(1.0, 0.0, 0.0)), u.x),
            mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), u.x),
            u.y
          ),
          mix(
            mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), u.x),
            mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), u.x),
            u.y
          ),
          u.z
        );
      }

      float fbm(vec3 p) {
        float sum = 0.0;
        float amp = 0.5;
        float freq = 1.0;
        for (int i = 0; i < 3; i++) {
          sum += noise3(p * freq) * amp;
          freq *= 2.1;
          amp *= 0.5;
        }
        return sum;
      }

      void main() {
        float seaLevel = 1.0;
        vec3 N = normalize(vNormalW);
        vec3 up = normalize(vPositionW);
        float slope = clamp(1.0 - dot(N, up), 0.0, 1.0);

        float depthN = invLerp(uMinMax.x, seaLevel, vElevation);
        float elevN = invLerp(seaLevel, uMinMax.y, vElevation);

        float macro = fbm(vPositionW * 2.8 + vec3(5.2, 1.4, 3.7));
        float micro = fbm(vPositionW * 10.0 + vec3(vElevation * 3.0));
        float breakup = mix(macro, micro, 0.5);

        float coastMask = smoothstep(seaLevel - uBlendDepth * 0.6, seaLevel + uBlendDepth * 1.2, vElevation);
        float waterMask = 1.0 - smoothstep(seaLevel - uBlendDepth * 0.35, seaLevel + uBlendDepth * 0.9, vElevation);

        float landDetail = (breakup - 0.5) * (0.08 + slope * 0.1);
        float depthDetail = (macro - 0.5) * 0.07;

        vec3 depthBase = gradientColor(clamp(depthN + depthDetail, 0.0, 1.0), uDepthSize, uDepthAnchors, uDepthColors);
        vec3 landBase = gradientColor(clamp(elevN + landDetail, 0.0, 1.0), uElevationSize, uElevationAnchors, uElevationColors);

        float beachBand = 1.0 - smoothstep(0.02, 0.09, elevN);
        float uplandMask = smoothstep(0.32, 0.74, elevN);
        float peakMask = smoothstep(0.72, 0.96, elevN);

        vec3 coastTint = mix(landBase * 1.06, depthBase * 1.05, 0.35);
        vec3 terrain = landBase;
        float vegetationMask = uVegetationDensity
          * smoothstep(0.02, 0.6, elevN)
          * (1.0 - smoothstep(0.24, 0.72, slope))
          * (1.0 - peakMask);
        vec3 canopyTint = vec3(0.15, 0.37, 0.14);
        terrain = mix(terrain, terrain * 0.92, slope * 0.35);
        terrain = mix(terrain, mix(terrain, canopyTint, 0.6), vegetationMask);
        terrain = mix(terrain, terrain * 1.08, uplandMask * 0.35);
        terrain = mix(terrain, terrain * 1.14, peakMask * (0.45 + slope * 0.3));
        terrain = mix(terrain, coastTint, beachBand * 0.5);

        vec3 water = depthBase * (0.76 + depthN * 0.3 + uWetness * 0.08);
        vec3 base = mix(water, terrain, coastMask);

        vec3 L = normalize(-uLightDirection);
        vec3 LFill = normalize(vec3(-L.x * 0.45, 0.82, -L.z * 0.45));
        vec3 V = normalize(cameraPosition - vPositionW);
        vec3 H = normalize(L + V);
        vec3 HFill = normalize(LFill + V);

        float ndotl = dot(N, L);
        float keyDiffuse = clamp((ndotl + 0.3) / 1.3, 0.0, 1.0);
        float fillDiffuse = clamp(dot(N, LFill) * 0.5 + 0.5, 0.0, 1.0);
        float hemi = dot(N, up) * 0.5 + 0.5;
        float ndoth = max(dot(N, H), 0.0);
        float ndothFill = max(dot(N, HFill), 0.0);
        float fresnel = pow(clamp(1.0 - max(dot(N, V), 0.0), 0.0, 1.0), 2.1);
        float shininess = mix(16.0, 96.0, 1.0 - clamp(uRoughness, 0.0, 1.0));

        float waterSpec = (pow(ndoth, 72.0) * 0.85 + pow(ndothFill, 42.0) * 0.35) * waterMask * (0.03 + (1.0 - uRoughness) * 0.14 + fresnel * 0.22);
        float landSpec = (pow(ndoth, shininess) * 0.8 + pow(ndothFill, shininess * 0.6) * 0.2) * (1.0 - waterMask) * (0.01 + uMetalness * 0.14);

        float reliefContrast = slope * (0.3 + uplandMask * 0.35) + peakMask * 0.18;
        float lightTerm = 0.22 + keyDiffuse * 0.7 + fillDiffuse * 0.2;
        lightTerm *= 1.0 + reliefContrast * (0.15 + (1.0 - keyDiffuse) * 0.18);
        lightTerm += hemi * 0.08 + fresnel * 0.04;

        vec3 color = base * lightTerm;
        color += vec3(waterSpec + landSpec);

        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
}

function normalizeStops(stops: GradientStop[], fallbackColor: [number, number, number]) {
  const list = [...stops].sort((a, b) => a.anchor - b.anchor).slice(0, MAX_STOPS);
  while (list.length < MAX_STOPS) {
    list.push({ anchor: 1, color: fallbackColor });
  }
  return list;
}
