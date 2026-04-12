import * as THREE from 'three';
import type { GradientStop, PlanetSurfaceMode } from '@/game/planet/types';

const MAX_STOPS = 6;

export function createPlanetMaterial(
  elevationGradient: GradientStop[],
  depthGradient: GradientStop[],
  minElevation: number,
  maxElevation: number,
  blendDepth: number,
  seaLevel: number,
  surfaceMode: PlanetSurfaceMode,
  roughness: number,
  metalness: number,
  vegetationDensity: number,
  wetness: number,
  canopyTint: [number, number, number],
  slopeDarkening: number,
  basinDarkening: number,
  uplandLift: number,
  peakLift: number,
  shadowTint: [number, number, number],
  shadowTintStrength: number,
  coastTintStrength: number,
  shallowSurfaceBrightness: number,
  debugMode = 0,
) {
  const normalizedElevation = normalizeStops(elevationGradient, [1, 1, 1]);
  const normalizedDepth = normalizeStops(depthGradient, [0, 0, 0]);

  return new THREE.ShaderMaterial({
    uniforms: {
      uMinMax: { value: new THREE.Vector2(minElevation, maxElevation) },
      uElevationSize: { value: normalizedElevation.size },
      uDepthSize: { value: normalizedDepth.size },
      uElevationAnchors: { value: normalizedElevation.stops.map((s) => s.anchor) },
      uElevationColors: { value: normalizedElevation.stops.map((s) => new THREE.Vector3(...s.color)) },
      uDepthAnchors: { value: normalizedDepth.stops.map((s) => s.anchor) },
      uDepthColors: { value: normalizedDepth.stops.map((s) => new THREE.Vector3(...s.color)) },
      uRoughness: { value: roughness },
      uMetalness: { value: metalness },
      uVegetationDensity: { value: vegetationDensity },
      uWetness: { value: wetness },
      uCanopyTint: { value: new THREE.Vector3(...canopyTint) },
      uSlopeDarkening: { value: slopeDarkening },
      uBasinDarkening: { value: basinDarkening },
      uUplandLift: { value: uplandLift },
      uPeakLift: { value: peakLift },
      uShadowTint: { value: new THREE.Vector3(...shadowTint) },
      uShadowTintStrength: { value: shadowTintStrength },
      uCoastTintStrength: { value: coastTintStrength },
      uShallowSurfaceBrightness: { value: shallowSurfaceBrightness },
      uLightDirection: { value: new THREE.Vector3(0.85, 0.35, 0.55).normalize() },
      uBlendDepth: { value: Math.max(0.001, blendDepth) },
      uSeaLevel: { value: seaLevel },
      uSurfaceMode: { value: surfaceMode === 'ice' ? 1 : surfaceMode === 'lava' ? 2 : 0 },
      uDebugMode: { value: debugMode },
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
      uniform vec3 uCanopyTint;
      uniform float uSlopeDarkening;
      uniform float uBasinDarkening;
      uniform float uUplandLift;
      uniform float uPeakLift;
      uniform vec3 uShadowTint;
      uniform float uShadowTintStrength;
      uniform float uCoastTintStrength;
      uniform float uShallowSurfaceBrightness;
      uniform vec3 uLightDirection;
      uniform float uBlendDepth;
      uniform float uSeaLevel;
      uniform int uSurfaceMode;
      uniform int uDebugMode;
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
        vec3 N = normalize(vNormalW);
        vec3 up = normalize(vPositionW);
        float slope = clamp(1.0 - dot(N, up), 0.0, 1.0);

        float depthN = invLerp(uMinMax.x, uSeaLevel, vElevation);
        float elevN = invLerp(uSeaLevel, uMinMax.y, vElevation);

        float macro = fbm(vPositionW * 2.6 + vec3(5.2, 1.4, 3.7));
        float micro = fbm(vPositionW * 7.5 + vec3(vElevation * 1.2));
        float breakup = mix(macro, micro, 0.32);

        float submergedMask = 1.0 - smoothstep(uSeaLevel - uBlendDepth * 0.35, uSeaLevel + uBlendDepth * 0.12, vElevation);
        float coastMask = smoothstep(uSeaLevel - uBlendDepth * 0.08, uSeaLevel + uBlendDepth * 0.5, vElevation)
          * (1.0 - smoothstep(uSeaLevel + uBlendDepth * 0.5, uSeaLevel + uBlendDepth * 1.8, vElevation));
        float landMask = smoothstep(uSeaLevel + uBlendDepth * 0.05, uSeaLevel + uBlendDepth * 0.9, vElevation);

        float landDetail = (breakup - 0.5) * (0.065 + slope * 0.12);
        float depthDetail = (macro - 0.5) * 0.06;

        vec3 depthBase = gradientColor(clamp(depthN + depthDetail, 0.0, 1.0), uDepthSize, uDepthAnchors, uDepthColors);
        vec3 landBase = gradientColor(clamp(elevN + landDetail, 0.0, 1.0), uElevationSize, uElevationAnchors, uElevationColors);

        float basinMask = smoothstep(0.0, 0.24, depthN) * submergedMask;
        float lowlandMask = smoothstep(0.04, 0.3, elevN) * (1.0 - smoothstep(0.46, 0.7, elevN));
        float uplandMask = smoothstep(0.32, 0.74, elevN);
        float peakMask = smoothstep(0.68, 0.96, elevN);

        vec3 terrain = landBase;
        float vegetationNoise = smoothstep(0.34, 0.72, breakup);
        float vegetationMask = uVegetationDensity
          * smoothstep(0.02, 0.6, elevN)
          * (1.0 - smoothstep(0.24, 0.72, slope))
          * vegetationNoise
          * (1.0 - peakMask);
        terrain = mix(terrain, terrain * (1.0 - (0.12 + breakup * 0.12)), slope * uSlopeDarkening);
        terrain = mix(terrain, mix(terrain, uCanopyTint, 0.66), vegetationMask);
        terrain = mix(terrain, terrain * (1.0 - uBasinDarkening), lowlandMask * (0.26 + uWetness * 0.24));
        terrain = mix(terrain, terrain * (1.0 + uUplandLift), uplandMask * 0.6);
        terrain = mix(terrain, terrain * (1.0 + uPeakLift), peakMask * (0.5 + slope * 0.28));

        vec3 coastTint = mix(terrain * 1.02, terrain * 1.12, 0.55) + vec3(0.012, 0.012, 0.01);
        terrain = mix(terrain, coastTint, coastMask * uCoastTintStrength * (0.8 + uWetness * 0.2));

        vec3 water = depthBase * (0.75 + depthN * (0.22 + uShallowSurfaceBrightness) + uWetness * 0.05);
        water = mix(water, water * (1.0 - uBasinDarkening), basinMask * (0.32 + slope * 0.2));

        vec3 ice = mix(vec3(0.48, 0.62, 0.72), vec3(0.86, 0.93, 0.98), clamp(depthN + macro * 0.1, 0.0, 1.0));
        ice = mix(ice, vec3(0.34, 0.46, 0.58), smoothstep(0.06, 0.34, depthN) * 0.38);
        ice = mix(ice, ice * 1.1, (1.0 - basinMask) * 0.18);

        vec3 basalt = mix(vec3(0.04, 0.04, 0.05), vec3(0.16, 0.13, 0.11), clamp(depthN + macro * 0.16, 0.0, 1.0));
        basalt = mix(basalt, basalt * 0.78, basinMask * 0.52);
        vec3 lavaGlow = mix(vec3(0.26, 0.1, 0.03), vec3(0.82, 0.31, 0.08), smoothstep(0.76, 1.0, breakup) * smoothstep(0.42, 1.0, depthN));
        vec3 lava = mix(basalt, lavaGlow, 0.08 + smoothstep(0.84, 1.0, breakup) * 0.16);

        vec3 lowSurface = water;
        if (uSurfaceMode == 1) {
          lowSurface = ice;
        } else if (uSurfaceMode == 2) {
          lowSurface = lava;
        }
        vec3 base = mix(lowSurface, terrain, landMask);

        if (uDebugMode == 1) {
          gl_FragColor = vec4(normalize(vNormalW) * 0.5 + 0.5, 1.0);
          return;
        }
        if (uDebugMode == 2) {
          float mono = clamp(elevN, 0.0, 1.0);
          gl_FragColor = vec4(vec3(mono), 1.0);
          return;
        }
        if (uDebugMode == 3) {
          float mono = clamp(invLerp(0.0, 1.0, vElevation - 1.0), 0.0, 1.0);
          gl_FragColor = vec4(vec3(mono), 1.0);
          return;
        }

        vec3 L = normalize(-uLightDirection);
        vec3 LFill = normalize(vec3(-L.x * 0.45, 0.82, -L.z * 0.45));
        vec3 V = normalize(cameraPosition - vPositionW);
        vec3 H = normalize(L + V);
        vec3 HFill = normalize(LFill + V);

        float ndotl = dot(N, L);
        float keyDiffuse = clamp(ndotl * 0.85 + 0.38, 0.0, 1.0);
        float fillDiffuse = clamp(dot(N, LFill) * 0.4 + 0.5, 0.0, 1.0);
        float hemi = dot(N, up) * 0.5 + 0.5;
        float ndoth = max(dot(N, H), 0.0);
        float ndothFill = max(dot(N, HFill), 0.0);
        float fresnel = pow(clamp(1.0 - max(dot(N, V), 0.0), 0.0, 1.0), 2.1);
        float shininess = mix(16.0, 96.0, 1.0 - clamp(uRoughness, 0.0, 1.0));

        float waterSpec = (pow(ndoth, 72.0) * 0.82 + pow(ndothFill, 42.0) * 0.32) * submergedMask * (0.02 + (1.0 - uRoughness) * 0.12 + fresnel * 0.18);
        if (uSurfaceMode == 1) {
          waterSpec *= 0.45;
        } else if (uSurfaceMode == 2) {
          waterSpec *= 0.22;
        }
        float landSpec = (pow(ndoth, shininess) * 0.72 + pow(ndothFill, shininess * 0.56) * 0.18) * (1.0 - submergedMask) * (0.008 + uMetalness * 0.1);

        float reliefContrast = slope * (0.4 + uSlopeDarkening * 0.7 + uplandMask * (0.24 + uUplandLift * 0.5)) + peakMask * (0.08 + uPeakLift * 0.44);
        float lightTerm = 0.18 + keyDiffuse * 0.68 + fillDiffuse * 0.16;
        lightTerm *= 1.0 + reliefContrast * (0.24 + (1.0 - keyDiffuse) * 0.2);
        lightTerm += hemi * 0.06 + fresnel * 0.035;

        vec3 color = base * lightTerm;
        float shadowMask = clamp((1.0 - keyDiffuse) * (0.7 + slope * 0.8), 0.0, 1.0);
        color = mix(color, color * uShadowTint, shadowMask * uShadowTintStrength);
        color += vec3(waterSpec + landSpec);

        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
}

function normalizeStops(stops: GradientStop[], fallbackColor: [number, number, number]) {
  const sorted = [...stops].sort((a, b) => a.anchor - b.anchor).slice(0, MAX_STOPS);
  const size = Math.max(1, sorted.length);
  const normalized = size > 0 ? sorted : [{ anchor: 1, color: fallbackColor }];

  while (normalized.length < MAX_STOPS) {
    normalized.push({ anchor: 1, color: fallbackColor });
  }

  return { stops: normalized, size };
}
