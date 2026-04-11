import * as THREE from 'three';
import type { GradientStop, PlanetGenerationConfig } from '@/game/planet/types';

const MAX_STOPS = 6;

export function createPlanetMaterial(
  elevationGradient: GradientStop[],
  depthGradient: GradientStop[],
  minElevation: number,
  maxElevation: number,
  blendDepth: number,
  climate: PlanetGenerationConfig['climate'],
  material: PlanetGenerationConfig['material'],
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
      uRoughness: { value: material.roughness },
      uMetalness: { value: material.metalness },
      uSpecularStrength: { value: material.specularStrength },
      uRoughnessVariance: { value: material.roughnessVariance },
      uMetalnessVariance: { value: material.metalnessVariance },
      uClimate: { value: new THREE.Vector3(climate.temperatureBias, climate.moistureBias, climate.transitionSharpness) },
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
      uniform float uSpecularStrength;
      uniform float uRoughnessVariance;
      uniform float uMetalnessVariance;
      uniform vec3 uClimate; // x temperature, y moisture, z transition sharpness
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
        float blendWidth = mix(uBlendDepth * 1.3, uBlendDepth * 0.7, uClimate.z);
        vec3 depthColor = gradientColor(invLerp(uMinMax.x, seaLevel, vElevation), uDepthSize, uDepthAnchors, uDepthColors);
        vec3 landColor = gradientColor(invLerp(seaLevel, uMinMax.y, vElevation), uElevationSize, uElevationAnchors, uElevationColors);
        float landMask = smoothstep(seaLevel - blendWidth, seaLevel + blendWidth, vElevation);
        vec3 base = mix(depthColor, landColor, landMask);

        vec3 N = normalize(vNormalW);
        vec3 radial = normalize(vPositionW);
        vec3 L = normalize(-uLightDirection);
        vec3 V = normalize(cameraPosition - vPositionW);
        vec3 H = normalize(V + L);

        float latitude = abs(radial.y);
        float elevation01 = invLerp(uMinMax.x, uMinMax.y, vElevation);
        float slope = 1.0 - clamp(dot(N, radial), 0.0, 1.0);

        float coldness = clamp(latitude * 0.8 + elevation01 * 0.25 + (1.0 - uClimate.x) * 0.4, 0.0, 1.0);
        float heat = clamp((1.0 - latitude) * uClimate.x + (1.0 - elevation01) * 0.2, 0.0, 1.0);
        float coastal = 1.0 - smoothstep(0.02, 0.18, abs(vElevation - seaLevel));
        float moisture = clamp(uClimate.y * 0.62 + coastal * 0.48 + (1.0 - slope) * 0.1 - heat * 0.22, 0.0, 1.0);

        vec3 warmTint = vec3(1.08, 0.93, 0.84);
        vec3 coldTint = vec3(0.82, 0.93, 1.1);
        vec3 dryTint = vec3(1.09, 0.97, 0.86);
        base = mix(base, base * coldTint, coldness * 0.26);
        base = mix(base, base * warmTint, heat * 0.22);
        base = mix(base, base * dryTint, (1.0 - moisture) * 0.2);

        float dynamicRoughness = clamp(
          uRoughness
          + slope * uRoughnessVariance
          + (1.0 - moisture) * uRoughnessVariance * 0.7
          - coastal * 0.16
          - coldness * 0.08,
          0.04,
          0.98
        );

        float dynamicMetalness = clamp(
          uMetalness
          + (1.0 - dynamicRoughness) * uMetalnessVariance
          + heat * uMetalnessVariance * 0.55
          - moisture * uMetalnessVariance * 0.5,
          0.0,
          0.95
        );

        float diffuse = max(dot(N, L), 0.0);
        float specPower = mix(8.0, 96.0, 1.0 - dynamicRoughness);
        float spec = pow(max(dot(N, H), 0.0), specPower) * (0.16 + dynamicMetalness * 0.72) * uSpecularStrength;
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.0);

        vec3 lighting = base * (0.18 + diffuse * 0.9);
        vec3 highlights = mix(vec3(0.045), base, dynamicMetalness * 0.45) * (spec + fresnel * 0.04 * uSpecularStrength);

        gl_FragColor = vec4(lighting + highlights, 1.0);
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
