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
      uLightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
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
      uniform vec3 uLightDirection;
      uniform float uBlendDepth;
      varying float vElevation;
      varying vec3 vNormalW;
      varying vec3 vPositionW;

      float invLerp(float a, float b, float v){
        if(abs(b-a)<0.000001) return 0.0;
        return clamp((v-a)/(b-a), 0.0, 1.0);
      }

      float hash31(vec3 p) {
        return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
      }

      float valueNoise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        vec3 u = f * f * (3.0 - 2.0 * f);

        float n000 = hash31(i + vec3(0.0, 0.0, 0.0));
        float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
        float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
        float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
        float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
        float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
        float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
        float n111 = hash31(i + vec3(1.0, 1.0, 1.0));

        float nx00 = mix(n000, n100, u.x);
        float nx10 = mix(n010, n110, u.x);
        float nx01 = mix(n001, n101, u.x);
        float nx11 = mix(n011, n111, u.x);

        float nxy0 = mix(nx00, nx10, u.y);
        float nxy1 = mix(nx01, nx11, u.y);

        return mix(nxy0, nxy1, u.z);
      }

      float detailNoise(vec3 p) {
        float n = 0.0;
        float amp = 0.58;
        float freq = 3.5;
        for (int i = 0; i < 3; i++) {
          n += (valueNoise(p * freq) * 2.0 - 1.0) * amp;
          freq *= 2.15;
          amp *= 0.52;
        }
        return n;
      }

      vec3 gradientColor(float v, int size, float anchors[MAX_STOPS], vec3 colors[MAX_STOPS]) {
        if(size <= 1) return colors[0];
        if(v <= anchors[0]) return colors[0];
        for (int i=1;i<MAX_STOPS;i++) {
          if(i >= size) break;
          if(v <= anchors[i]) {
            float t = invLerp(anchors[i-1], anchors[i], v);
            t = clamp((t - 0.5) * 1.12 + 0.5, 0.0, 1.0);
            return mix(colors[i-1], colors[i], t);
          }
        }
        return colors[size - 1];
      }

      void main() {
        float seaLevel = 1.0;
        vec3 unitPos = normalize(vPositionW);
        float hNorm = invLerp(uMinMax.x, uMinMax.y, vElevation);
        float noise = detailNoise(unitPos * 6.0 + vec3(hNorm * 3.0));
        float detailAmount = 0.018 + (1.0 - uRoughness) * 0.02;

        vec3 base;
        if (vElevation < seaLevel - uBlendDepth) {
          float d = invLerp(uMinMax.x, seaLevel, vElevation);
          d = clamp(d + noise * detailAmount * 0.75, 0.0, 1.0);
          base = gradientColor(d, uDepthSize, uDepthAnchors, uDepthColors);
        } else if (vElevation > seaLevel + uBlendDepth) {
          float e = invLerp(seaLevel, uMinMax.y, vElevation);
          e = clamp(e + noise * detailAmount, 0.0, 1.0);
          base = gradientColor(e, uElevationSize, uElevationAnchors, uElevationColors);
        } else {
          float d = invLerp(uMinMax.x, seaLevel, vElevation);
          float e = invLerp(seaLevel, uMinMax.y, vElevation);
          d = clamp(d + noise * detailAmount * 0.6, 0.0, 1.0);
          e = clamp(e + noise * detailAmount * 0.6, 0.0, 1.0);
          float t = smoothstep(seaLevel - uBlendDepth, seaLevel + uBlendDepth, vElevation);
          base = mix(
            gradientColor(d, uDepthSize, uDepthAnchors, uDepthColors),
            gradientColor(e, uElevationSize, uElevationAnchors, uElevationColors),
            t
          );
        }

        vec3 N = normalize(vNormalW);
        vec3 L = normalize(uLightDirection);
        vec3 V = normalize(cameraPosition - vPositionW);
        vec3 H = normalize(L + V);

        float diffuse = max(dot(N, L), 0.0);
        float ndv = max(dot(N, V), 0.0);
        float shininess = mix(28.0, 130.0, 1.0 - uRoughness);
        float spec = pow(max(dot(N, H), 0.0), shininess) * (0.18 + uMetalness * 0.7);

        float slope = clamp(1.0 - dot(N, unitPos), 0.0, 1.0);
        float peakMask = smoothstep(0.68, 1.0, hNorm);
        float basinMask = 1.0 - smoothstep(0.2, 0.55, hNorm);

        float ambient = mix(0.21, 0.31, basinMask * 0.45 + peakMask * 0.35);
        float ridgeContrast = 1.0 + slope * 0.22 + peakMask * 0.12;
        float fresnel = pow(1.0 - ndv, 2.0) * 0.07;

        vec3 lit = base * (ambient + diffuse * 0.92) * ridgeContrast;
        vec3 color = lit + vec3(spec + fresnel);

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
