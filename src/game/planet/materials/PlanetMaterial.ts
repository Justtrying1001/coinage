import * as THREE from 'three';
import type { GradientStop, PlanetGenerationConfig } from '@/game/planet/types';

const MAX_STOPS = 6;

export function createPlanetMaterial(
  config: PlanetGenerationConfig,
  minElevation: number,
  maxElevation: number,
) {
  const normalizedElevation = normalizeStops(config.elevationGradient, [1, 1, 1]);
  const normalizedDepth = normalizeStops(config.depthGradient, [0, 0, 0.5]);
  const { palette, climate, response } = config.material;

  return new THREE.ShaderMaterial({
    uniforms: {
      uSeed: { value: config.seed / 4294967295 },
      uMinMax: { value: new THREE.Vector2(minElevation, maxElevation) },
      uElevationSize: { value: config.elevationGradient.length },
      uDepthSize: { value: config.depthGradient.length },
      uElevationAnchors: { value: normalizedElevation.map((s) => s.anchor) },
      uElevationColors: { value: normalizedElevation.map((s) => new THREE.Vector3(...s.color)) },
      uDepthAnchors: { value: normalizedDepth.map((s) => s.anchor) },
      uDepthColors: { value: normalizedDepth.map((s) => new THREE.Vector3(...s.color)) },
      uBlendDepth: { value: Math.max(0.001, config.blendDepth) },
      uBaseRoughness: { value: config.material.roughness },
      uBaseMetalness: { value: config.material.metalness },
      uWaterDeep: { value: new THREE.Vector3(...palette.waterDeep) },
      uWaterShallow: { value: new THREE.Vector3(...palette.waterShallow) },
      uHumidLow: { value: new THREE.Vector3(...palette.humidLow) },
      uDryLow: { value: new THREE.Vector3(...palette.dryLow) },
      uTemperateHigh: { value: new THREE.Vector3(...palette.temperateHigh) },
      uRocky: { value: new THREE.Vector3(...palette.rocky) },
      uPeak: { value: new THREE.Vector3(...palette.peak) },
      uSpecial: { value: new THREE.Vector3(...palette.special) },
      uMoistureScale: { value: climate.moistureScale },
      uMoistureWarp: { value: climate.moistureWarp },
      uMoistureBias: { value: climate.moistureBias },
      uTemperatureBias: { value: climate.temperatureBias },
      uTemperatureNoiseScale: { value: climate.temperatureNoiseScale },
      uLatitudeInfluence: { value: climate.latitudeInfluence },
      uRidgeScale: { value: climate.ridgeScale },
      uBasinScale: { value: climate.basinScale },
      uWaterRoughness: { value: response.waterRoughness },
      uWaterMetalness: { value: response.waterMetalness },
      uIceBoost: { value: response.iceBoost },
      uWetBoost: { value: response.wetBoost },
      uRidgeBoost: { value: response.ridgeBoost },
      uBasinBoost: { value: response.basinBoost },
      uLavaBoost: { value: response.lavaBoost },
      uSpecularStrength: { value: response.specularStrength },
      uFillLightDirection: { value: new THREE.Vector3(-0.45, 0.2, 0.87).normalize() },
      uLightDirection: { value: new THREE.Vector3(0.7, 0.45, 0.55).normalize() },
    },
    vertexShader: `
      attribute float aElevation;
      varying float vElevation;
      varying vec3 vNormalW;
      varying vec3 vPositionW;
      varying vec3 vPlanetNormal;
      void main() {
        vElevation = aElevation;
        vec4 world = modelMatrix * vec4(position, 1.0);
        vPositionW = world.xyz;
        vPlanetNormal = normalize(world.xyz);
        vNormalW = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      precision highp float;
      const int MAX_STOPS = ${MAX_STOPS};
      uniform float uSeed;
      uniform vec2 uMinMax;
      uniform int uElevationSize;
      uniform int uDepthSize;
      uniform float uElevationAnchors[MAX_STOPS];
      uniform vec3 uElevationColors[MAX_STOPS];
      uniform float uDepthAnchors[MAX_STOPS];
      uniform vec3 uDepthColors[MAX_STOPS];
      uniform float uBlendDepth;
      uniform float uBaseRoughness;
      uniform float uBaseMetalness;
      uniform vec3 uWaterDeep;
      uniform vec3 uWaterShallow;
      uniform vec3 uHumidLow;
      uniform vec3 uDryLow;
      uniform vec3 uTemperateHigh;
      uniform vec3 uRocky;
      uniform vec3 uPeak;
      uniform vec3 uSpecial;
      uniform float uMoistureScale;
      uniform float uMoistureWarp;
      uniform float uMoistureBias;
      uniform float uTemperatureBias;
      uniform float uTemperatureNoiseScale;
      uniform float uLatitudeInfluence;
      uniform float uRidgeScale;
      uniform float uBasinScale;
      uniform float uWaterRoughness;
      uniform float uWaterMetalness;
      uniform float uIceBoost;
      uniform float uWetBoost;
      uniform float uRidgeBoost;
      uniform float uBasinBoost;
      uniform float uLavaBoost;
      uniform float uSpecularStrength;
      uniform vec3 uLightDirection;
      uniform vec3 uFillLightDirection;
      varying float vElevation;
      varying vec3 vNormalW;
      varying vec3 vPositionW;
      varying vec3 vPlanetNormal;

      float hash13(vec3 p3) {
        p3 = fract(p3 * 0.1031);
        p3 += dot(p3, p3.zyx + 31.32);
        return fract((p3.x + p3.y) * p3.z);
      }

      float noise3(vec3 p){
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);

        float n000 = hash13(i + vec3(0.0,0.0,0.0));
        float n100 = hash13(i + vec3(1.0,0.0,0.0));
        float n010 = hash13(i + vec3(0.0,1.0,0.0));
        float n110 = hash13(i + vec3(1.0,1.0,0.0));
        float n001 = hash13(i + vec3(0.0,0.0,1.0));
        float n101 = hash13(i + vec3(1.0,0.0,1.0));
        float n011 = hash13(i + vec3(0.0,1.0,1.0));
        float n111 = hash13(i + vec3(1.0,1.0,1.0));

        float nx00 = mix(n000, n100, f.x);
        float nx10 = mix(n010, n110, f.x);
        float nx01 = mix(n001, n101, f.x);
        float nx11 = mix(n011, n111, f.x);
        float nxy0 = mix(nx00, nx10, f.y);
        float nxy1 = mix(nx01, nx11, f.y);
        return mix(nxy0, nxy1, f.z);
      }

      float fbm(vec3 p) {
        float sum = 0.0;
        float amp = 0.55;
        float freq = 1.0;
        for (int i = 0; i < 4; i++) {
          sum += noise3(p * freq) * amp;
          freq *= 2.0;
          amp *= 0.5;
        }
        return sum;
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
        float elevationNorm = invLerp(uMinMax.x, uMinMax.y, vElevation);
        float landNorm = invLerp(seaLevel, uMinMax.y, vElevation);
        float depthNorm = invLerp(uMinMax.x, seaLevel, vElevation);

        vec3 warpedNormal = vPlanetNormal + vec3(
          fbm(vPlanetNormal.zxy * 2.1 + uSeed * 113.0),
          fbm(vPlanetNormal.yzx * 2.3 + uSeed * 71.0),
          fbm(vPlanetNormal.xyz * 2.0 + uSeed * 41.0)
        ) * uMoistureWarp;

        float moisture = clamp(fbm(warpedNormal * uMoistureScale + vec3(5.3, 2.1, 7.4) + uSeed * 97.0) + uMoistureBias, 0.0, 1.0);
        float latitude = 1.0 - abs(vPlanetNormal.y);
        float tempNoise = fbm(vPlanetNormal * uTemperatureNoiseScale + vec3(13.0, 3.0, 2.0) + uSeed * 53.0);
        float temperature = clamp(mix(tempNoise, latitude, uLatitudeInfluence) + uTemperatureBias, 0.0, 1.0);

        float slope = clamp(1.0 - dot(normalize(vNormalW), normalize(vPlanetNormal)), 0.0, 1.0);
        float ridge = pow(fbm(vPlanetNormal * uRidgeScale + vec3(2.0, 11.0, 17.0) + uSeed * 89.0), 1.35);
        float basin = 1.0 - pow(fbm(vPlanetNormal * uBasinScale + vec3(7.0, 19.0, 4.0) + uSeed * 67.0), 1.6);

        vec3 coastBlend = mix(gradientColor(depthNorm, uDepthSize, uDepthAnchors, uDepthColors), gradientColor(landNorm, uElevationSize, uElevationAnchors, uElevationColors), smoothstep(seaLevel - uBlendDepth, seaLevel + uBlendDepth, vElevation));

        vec3 waterColor = mix(uWaterDeep, uWaterShallow, smoothstep(0.02, 1.0, depthNorm));
        vec3 lowland = mix(uDryLow, uHumidLow, moisture);
        vec3 upland = mix(uTemperateHigh, uRocky, smoothstep(0.15, 0.72, slope + ridge * 0.4));
        vec3 peakColor = mix(uPeak, uSpecial, smoothstep(0.6, 1.0, ridge * (1.0 - moisture)));

        float coastMask = 1.0 - smoothstep(0.0, 0.08, abs(vElevation - seaLevel));
        float waterMask = 1.0 - smoothstep(seaLevel - uBlendDepth * 1.2, seaLevel + uBlendDepth * 0.4, vElevation);
        float highMask = smoothstep(0.35, 0.85, landNorm + slope * 0.5);
        float peakMask = smoothstep(0.74, 0.98, landNorm + ridge * 0.22);
        float aridMask = smoothstep(0.55, 0.95, temperature) * (1.0 - moisture);
        float icyMask = smoothstep(0.56, 0.9, 1.0 - temperature) * smoothstep(0.32, 0.88, landNorm + moisture * 0.3);
        float basinMask = smoothstep(0.35, 0.9, basin) * smoothstep(0.15, 0.75, landNorm);
        float lavaMask = smoothstep(0.68, 0.98, ridge * (temperature + uLavaBoost));

        vec3 biomeColor = lowland;
        biomeColor = mix(biomeColor, upland, highMask);
        biomeColor = mix(biomeColor, peakColor, peakMask);
        biomeColor = mix(biomeColor, mix(uDryLow, uSpecial, 0.4), aridMask * (1.0 - highMask));
        biomeColor = mix(biomeColor, mix(uPeak, uWaterShallow, 0.45), icyMask);
        biomeColor = mix(biomeColor, mix(uRocky, uSpecial, 0.35), basinMask * 0.4);
        biomeColor = mix(biomeColor, uSpecial, lavaMask * 0.7);

        vec3 base = mix(biomeColor, waterColor, waterMask);
        base = mix(base, coastBlend, coastMask * 0.45);

        float roughness = clamp(
          mix(uBaseRoughness, uWaterRoughness, waterMask)
          - moisture * uWetBoost
          + slope * uRidgeBoost
          - basinMask * uBasinBoost
          - icyMask * uIceBoost
          - lavaMask * 0.18,
          0.04,
          0.96
        );
        float metalness = clamp(mix(uBaseMetalness, uWaterMetalness, waterMask) + lavaMask * 0.16, 0.0, 0.6);

        vec3 N = normalize(vNormalW);
        vec3 L = normalize(-uLightDirection);
        vec3 L2 = normalize(-uFillLightDirection);
        vec3 V = normalize(cameraPosition - vPositionW);
        vec3 H = normalize(V + L);
        vec3 H2 = normalize(V + L2);

        float key = max(dot(N, L), 0.0);
        float fill = max(dot(N, L2), 0.0);
        float ambient = 0.16 + (0.22 * (N.y * 0.5 + 0.5));
        float rim = pow(1.0 - max(dot(N, V), 0.0), 2.5) * 0.12;

        float specPower = mix(14.0, 120.0, 1.0 - roughness);
        float spec = pow(max(dot(N, H), 0.0), specPower) + pow(max(dot(N, H2), 0.0), specPower * 0.66) * 0.5;
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 4.0);

        vec3 color = base * (ambient + key * 0.92 + fill * 0.35 + rim);
        color += vec3(spec * (uSpecularStrength + metalness * 0.65 + waterMask * 0.3));
        color += base * fresnel * (0.04 + waterMask * 0.08 + icyMask * 0.06);

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
