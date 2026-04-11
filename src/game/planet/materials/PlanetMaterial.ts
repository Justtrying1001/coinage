import * as THREE from 'three';
import type { GradientStop, PlanetSurfaceSignalConfig } from '@/game/planet/types';

const MAX_STOPS = 6;

export interface PlanetMaterialParams {
  elevationGradient: GradientStop[];
  depthGradient: GradientStop[];
  minElevation: number;
  maxElevation: number;
  blendDepth: number;
  roughness: number;
  metalness: number;
  vegetatedRoughness: number;
  rockRoughness: number;
  peakRoughness: number;
  waterRoughness: number;
  vegetatedMetalness: number;
  rockMetalness: number;
  peakMetalness: number;
  waterMetalness: number;
  surfaceSignals: PlanetSurfaceSignalConfig;
}

export function createPlanetMaterial(params: PlanetMaterialParams) {
  const normalizedElevation = normalizeStops(params.elevationGradient, [1, 1, 1]);
  const normalizedDepth = normalizeStops(params.depthGradient, [0, 0, 0.5]);

  return new THREE.ShaderMaterial({
    uniforms: {
      uMinMax: { value: new THREE.Vector2(params.minElevation, params.maxElevation) },
      uElevationSize: { value: params.elevationGradient.length },
      uDepthSize: { value: params.depthGradient.length },
      uElevationAnchors: { value: normalizedElevation.map((s) => s.anchor) },
      uElevationColors: { value: normalizedElevation.map((s) => new THREE.Vector3(...s.color)) },
      uDepthAnchors: { value: normalizedDepth.map((s) => s.anchor) },
      uDepthColors: { value: normalizedDepth.map((s) => new THREE.Vector3(...s.color)) },
      uRoughness: { value: params.roughness },
      uMetalness: { value: params.metalness },
      uLightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
      uBlendDepth: { value: Math.max(0.001, params.blendDepth) },
      uSignal: { value: new THREE.Vector4(params.surfaceSignals.moisture, params.surfaceSignals.temperature, params.surfaceSignals.biomeBlend, params.surfaceSignals.shoreline) },
      uSignalB: { value: new THREE.Vector4(params.surfaceSignals.slopeRock, params.surfaceSignals.peakStart, params.surfaceSignals.humidityNoise, params.surfaceSignals.activityBias) },
      uSignalC: { value: new THREE.Vector4(params.surfaceSignals.wetnessBoost, params.surfaceSignals.specularBias, 0, 0) },
      uAccentColor: { value: new THREE.Vector3(...params.surfaceSignals.accentColor) },
      uZoneRoughness: { value: new THREE.Vector4(params.waterRoughness, params.vegetatedRoughness, params.rockRoughness, params.peakRoughness) },
      uZoneMetalness: { value: new THREE.Vector4(params.waterMetalness, params.vegetatedMetalness, params.rockMetalness, params.peakMetalness) },
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
      uniform vec4 uSignal;
      uniform vec4 uSignalB;
      uniform vec4 uSignalC;
      uniform vec3 uAccentColor;
      uniform vec4 uZoneRoughness;
      uniform vec4 uZoneMetalness;
      varying float vElevation;
      varying vec3 vNormalW;
      varying vec3 vPositionW;

      float hash31(vec3 p) {
        p = fract(p * 0.1031);
        p += dot(p, p.yzx + 33.33);
        return fract((p.x + p.y) * p.z);
      }

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
        float d = invLerp(uMinMax.x, seaLevel, vElevation);
        float e = invLerp(seaLevel, uMinMax.y, vElevation);
        float shoreMix = smoothstep(seaLevel - uBlendDepth, seaLevel + uBlendDepth, vElevation);

        vec3 depthColor = gradientColor(d, uDepthSize, uDepthAnchors, uDepthColors);
        vec3 landColor = gradientColor(e, uElevationSize, uElevationAnchors, uElevationColors);

        vec3 radial = normalize(vPositionW);
        vec3 N = normalize(vNormalW);
        float slope = clamp(1.0 - dot(N, radial), 0.0, 1.0);
        float latitude = abs(radial.y);
        float noise = hash31(radial * 17.0 + vec3(e * 7.0, d * 11.0, slope * 5.0));

        float humidity = clamp(uSignal.x + (1.0 - latitude) * 0.26 + (noise - 0.5) * uSignalB.z, 0.0, 1.0);
        float temperature = clamp(uSignal.y + (1.0 - latitude) * 0.3 - e * 0.24, 0.0, 1.0);
        float canopy = smoothstep(0.35, 0.95, humidity) * smoothstep(0.25, 0.95, temperature);
        float rockExposure = smoothstep(uSignalB.x - 0.07, uSignalB.x + 0.08, slope + e * 0.22);
        float peakMask = smoothstep(uSignalB.y - 0.08, uSignalB.y + 0.06, e + latitude * 0.16);
        float activityMask = smoothstep(0.62, 0.96, noise + uSignalB.w * 0.35 + slope * 0.4);

        vec3 vegetatedColor = mix(landColor, landColor * (0.75 + humidity * 0.35), canopy * uSignal.z);
        vec3 rockColor = mix(vegetatedColor, mix(landColor * 0.8, uAccentColor, 0.28), rockExposure);
        vec3 peakColor = mix(rockColor, mix(rockColor * 1.14, uAccentColor * 0.86, activityMask * 0.35), peakMask);
        vec3 base = mix(depthColor, peakColor, shoreMix);

        float zoneVegetated = (1.0 - rockExposure) * (1.0 - peakMask) * shoreMix;
        float zoneRock = rockExposure * (1.0 - peakMask) * shoreMix;
        float zonePeak = peakMask * shoreMix;
        float zoneWater = 1.0 - shoreMix;

        float roughness = uZoneRoughness.x * zoneWater + uZoneRoughness.y * zoneVegetated + uZoneRoughness.z * zoneRock + uZoneRoughness.w * zonePeak;
        float metalness = uZoneMetalness.x * zoneWater + uZoneMetalness.y * zoneVegetated + uZoneMetalness.z * zoneRock + uZoneMetalness.w * zonePeak;
        roughness = clamp(mix(roughness, uRoughness, 0.22) - humidity * uSignalC.x * zoneVegetated, 0.04, 0.98);
        metalness = clamp(mix(metalness, uMetalness, 0.24), 0.0, 0.75);

        vec3 L = normalize(-uLightDirection);
        vec3 V = normalize(cameraPosition - vPositionW);
        vec3 H = normalize(V - L);

        float diffuse = max(dot(N, -L), 0.0);
        float spec = pow(max(dot(N, H), 0.0), mix(10.0, 84.0, 1.0 - roughness));
        float wetShine = zoneWater + zoneVegetated * humidity * uSignalC.x;
        vec3 color = base * (0.2 + diffuse * 0.9) + vec3(spec * (0.04 + metalness * 0.55 + wetShine * uSignalC.y));

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
