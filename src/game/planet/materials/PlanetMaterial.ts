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

      void main() {
        float seaLevel = 1.0;
        vec3 base;
        if (vElevation < seaLevel - uBlendDepth) {
          float d = invLerp(uMinMax.x, seaLevel, vElevation);
          base = gradientColor(d, uDepthSize, uDepthAnchors, uDepthColors);
        } else if (vElevation > seaLevel + uBlendDepth) {
          float e = invLerp(seaLevel, uMinMax.y, vElevation);
          base = gradientColor(e, uElevationSize, uElevationAnchors, uElevationColors);
        } else {
          float d = invLerp(uMinMax.x, seaLevel, vElevation);
          float e = invLerp(seaLevel, uMinMax.y, vElevation);
          float t = smoothstep(seaLevel - uBlendDepth, seaLevel + uBlendDepth, vElevation);
          base = mix(
            gradientColor(d, uDepthSize, uDepthAnchors, uDepthColors),
            gradientColor(e, uElevationSize, uElevationAnchors, uElevationColors),
            t
          );
        }

        vec3 N = normalize(vNormalW);
        vec3 L = normalize(-uLightDirection);
        vec3 V = normalize(cameraPosition - vPositionW);
        vec3 H = normalize(V - L);

        float diffuse = max(dot(N, -L), 0.0);
        float spec = pow(max(dot(N, H), 0.0), mix(10.0, 80.0, 1.0 - uRoughness));
        vec3 color = base * (0.2 + diffuse * 0.9) + vec3(spec * (0.08 + uMetalness * 0.6));

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
