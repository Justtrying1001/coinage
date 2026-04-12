import * as THREE from 'three';
import type { GradientStop, PlanetSurfaceMode } from '@/game/planet/types';
import type { PlanetArchetype } from '@/game/render/types';

const MAX_STOPS = 6;

export function createPlanetMaterial(
  elevationGradient: GradientStop[],
  depthGradient: GradientStop[],
  minElevation: number,
  maxElevation: number,
  blendDepth: number,
  seaLevel: number,
  surfaceLevel01: number,
  surfaceMode: PlanetSurfaceMode,
  archetype: PlanetArchetype,
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
  microReliefStrength: number,
  microReliefScale: number,
  microNormalStrength: number,
  microAlbedoBreakup: number,
  hotspotCoverage: number,
  hotspotIntensity: number,
  fissureScale: number,
  fissureSharpness: number,
  lavaAccentStrength: number,
  emissiveStrength: number,
  basaltContrast: number,
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
      uSurfaceLevel01: { value: surfaceLevel01 },
      uSurfaceMode: { value: surfaceMode === 'ice' ? 1 : surfaceMode === 'lava' ? 2 : 0 },
      uDryArchetype: { value: archetype === 'arid' || archetype === 'barren' ? 1 : 0 },
      uJungleArchetype: { value: archetype === 'jungle' ? 1 : 0 },
      uMicroReliefStrength: { value: microReliefStrength },
      uMicroReliefScale: { value: microReliefScale },
      uMicroNormalStrength: { value: microNormalStrength },
      uMicroAlbedoBreakup: { value: microAlbedoBreakup },
      uHotspotCoverage: { value: hotspotCoverage },
      uHotspotIntensity: { value: hotspotIntensity },
      uFissureScale: { value: fissureScale },
      uFissureSharpness: { value: fissureSharpness },
      uLavaAccentStrength: { value: lavaAccentStrength },
      uEmissiveStrength: { value: emissiveStrength },
      uBasaltContrast: { value: basaltContrast },
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
      uniform float uSurfaceLevel01;
      uniform int uSurfaceMode;
      uniform int uDryArchetype;
      uniform int uJungleArchetype;
      uniform float uMicroReliefStrength;
      uniform float uMicroReliefScale;
      uniform float uMicroNormalStrength;
      uniform float uMicroAlbedoBreakup;
      uniform float uHotspotCoverage;
      uniform float uHotspotIntensity;
      uniform float uFissureScale;
      uniform float uFissureSharpness;
      uniform float uLavaAccentStrength;
      uniform float uEmissiveStrength;
      uniform float uBasaltContrast;
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
        vec3 NGeo = normalize(vNormalW);
        vec3 N = NGeo;
        vec3 up = normalize(vPositionW);
        float geoSlope = clamp(1.0 - dot(NGeo, up), 0.0, 1.0);
        float eps = 0.045;
        vec3 microP = vPositionW * uMicroReliefScale + vec3(vElevation * 1.73);
        float microA = noise3(microP);
        float microX = noise3(microP + vec3(eps, 0.0, 0.0));
        float microY = noise3(microP + vec3(0.0, eps, 0.0));
        float microZ = noise3(microP + vec3(0.0, 0.0, eps));
        vec3 microGrad = vec3(microX - microA, microY - microA, microZ - microA) / eps;
        float dryMask = float(uDryArchetype);
        float microReliefWeight = clamp(uMicroReliefStrength, 0.0, 1.0);
        float microNormalWeight = (0.18 + dryMask * 0.28) * (0.35 + microReliefWeight * 0.9);
        N = normalize(N + microGrad * uMicroNormalStrength * microNormalWeight);
        float slope = clamp(1.0 - dot(N, up), 0.0, 1.0);
        float reliefSupport = smoothstep(0.1, 0.48, max(geoSlope, slope * 0.82));

        float elev01 = invLerp(uMinMax.x, uMinMax.y, vElevation);
        float depthN = invLerp(0.0, max(0.001, uSurfaceLevel01), elev01);
        float elevN = invLerp(uSurfaceLevel01, 1.0, elev01);

        float macro = fbm(vPositionW * 2.6 + vec3(5.2, 1.4, 3.7));
        float micro = fbm(vPositionW * 7.5 + vec3(vElevation * 1.2));
        float breakup = mix(macro, micro, 0.32);

        float edge = uBlendDepth * 6.0;
        float submergedMask = 1.0 - smoothstep(uSurfaceLevel01 - edge * 0.35, uSurfaceLevel01 + edge * 0.12, elev01);
        float coastMask = smoothstep(uSurfaceLevel01 - edge * 0.08, uSurfaceLevel01 + edge * 0.5, elev01)
          * (1.0 - smoothstep(uSurfaceLevel01 + edge * 0.5, uSurfaceLevel01 + edge * 1.8, elev01));
        float landMask = smoothstep(uSurfaceLevel01 + edge * 0.05, uSurfaceLevel01 + edge * 0.9, elev01);

        float landDetail = (breakup - 0.5) * (0.016 + reliefSupport * 0.046) * (0.45 + microReliefWeight * 0.9);
        float depthDetail = (macro - 0.5) * 0.03;

        vec3 depthBase = gradientColor(clamp(depthN + depthDetail, 0.0, 1.0), uDepthSize, uDepthAnchors, uDepthColors);
        vec3 landBase = gradientColor(clamp(elevN + landDetail, 0.0, 1.0), uElevationSize, uElevationAnchors, uElevationColors);

        float basinMask = smoothstep(0.0, 0.24, depthN) * submergedMask;
        float lowlandMask = smoothstep(0.04, 0.3, elevN) * (1.0 - smoothstep(0.46, 0.7, elevN)) * (0.5 + reliefSupport * 0.5);
        float uplandMask = smoothstep(0.36, 0.76, elevN) * smoothstep(0.2, 0.68, reliefSupport);
        float peakMask = smoothstep(0.72, 0.97, elevN) * smoothstep(0.34, 0.76, reliefSupport);

        vec3 terrain = landBase;
        float microBreakup = (microA - 0.5) * uMicroAlbedoBreakup * (0.28 + dryMask * 0.52) * (0.35 + microReliefWeight * 0.8);
        terrain *= 1.0 + microBreakup * 0.32;
        float hueNoise = noise3(microP * 0.7 + vec3(13.1, 4.9, 9.7)) - 0.5;
        vec3 dryHueShift = vec3(1.04, 0.99, 0.95);
        terrain = mix(terrain, terrain * dryHueShift, dryMask * abs(hueNoise) * 0.08);
        float vegetationNoise = smoothstep(0.34, 0.72, breakup);
        float vegetationMask = uVegetationDensity
          * smoothstep(0.02, 0.6, elevN)
          * (1.0 - smoothstep(0.24, 0.72, slope))
          * vegetationNoise
          * (1.0 - peakMask);
        terrain = mix(terrain, terrain * (1.0 - (0.08 + breakup * 0.08)), reliefSupport * uSlopeDarkening);
        terrain = mix(terrain, mix(terrain, uCanopyTint, 0.66), vegetationMask);
        if (uJungleArchetype == 1) {
          float jungleCanopyMask = uWetness
            * smoothstep(0.02, 0.58, elevN)
            * (1.0 - smoothstep(0.22, 0.62, slope))
            * smoothstep(0.28, 0.82, breakup)
            * (1.0 - peakMask);
          vec3 deepCanopy = mix(uCanopyTint * vec3(0.62, 0.86, 0.66), vec3(0.05, 0.2, 0.09), 0.46);
          terrain = mix(terrain, mix(terrain * vec3(0.72, 0.88, 0.74), deepCanopy, 0.72), jungleCanopyMask * 0.9);
          terrain = mix(terrain, terrain * vec3(0.94, 1.03, 0.95), coastMask * uWetness * 0.22);
        }
        terrain = mix(terrain, terrain * (1.0 - uBasinDarkening), lowlandMask * (0.22 + uWetness * 0.16));
        terrain = mix(terrain, terrain * (1.0 + uUplandLift * 0.45), uplandMask * (0.2 + reliefSupport * 0.24));
        terrain = mix(terrain, terrain * (1.0 + uPeakLift * 0.32), peakMask * (0.14 + reliefSupport * 0.18));
        if (uSurfaceMode == 1) {
          terrain = mix(terrain, terrain * 0.84, lowlandMask * 0.28);
          terrain = mix(terrain, terrain * 0.92, peakMask * 0.55);
        }

        vec3 coastTint = mix(terrain * 1.02, terrain * 1.12, 0.55) + vec3(0.012, 0.012, 0.01);
        terrain = mix(terrain, coastTint, coastMask * uCoastTintStrength * (0.8 + uWetness * 0.2));

        vec3 water = depthBase * (0.75 + depthN * (0.22 + uShallowSurfaceBrightness) + uWetness * 0.05);
        water = mix(water, water * (1.0 - uBasinDarkening), basinMask * (0.32 + slope * 0.2));

        vec3 ice = mix(vec3(0.24, 0.34, 0.43), vec3(0.84, 0.92, 0.97), clamp(depthN + macro * 0.08, 0.0, 1.0));
        ice = mix(ice, vec3(0.4, 0.53, 0.66), smoothstep(0.05, 0.44, depthN) * 0.55);
        ice = mix(ice, ice * 1.06, (1.0 - basinMask) * 0.08);

        vec3 basalt = mix(vec3(0.03, 0.03, 0.04), vec3(0.18, 0.14, 0.11), clamp(depthN + macro * 0.12, 0.0, 1.0));
        basalt = mix(basalt, basalt * (0.72 - uBasaltContrast * 0.25), basinMask * (0.42 + uBasaltContrast * 0.25));
        float fissureNoise = pow(clamp(1.0 - abs(fbm(vPositionW * uFissureScale) * 2.0 - 1.0), 0.0, 1.0), max(1.2, uFissureSharpness));
        float hotspotNoise = smoothstep(1.0 - uHotspotCoverage, 1.0, fbm(vPositionW * (uFissureScale * 0.6) + vec3(11.3, 5.6, 2.1)));
        float basinFloorMask = submergedMask * smoothstep(0.02, 0.5, depthN);
        float calderaField = fbm(vPositionW * 3.2 + vec3(19.4, 7.1, 3.3));
        float calderaMask = landMask
          * (1.0 - smoothstep(0.16, 0.62, elevN))
          * (1.0 - smoothstep(0.52, 0.86, reliefSupport))
          * smoothstep(0.62, 0.86, calderaField);
        float fissureBandMask = landMask
          * (0.2 + lowlandMask * 0.8)
          * smoothstep(0.56, 0.86, hotspotNoise);
        float lavaSeaMask = basinFloorMask * (0.24 + uLavaAccentStrength * 0.42);
        float calderaLavaMask = calderaMask * (0.1 + uHotspotIntensity * 0.3);
        float fissureLavaMask = fissureNoise * fissureBandMask * (0.05 + uLavaAccentStrength * 0.22);
        float lavaMask = clamp(lavaSeaMask + calderaLavaMask + fissureLavaMask, 0.0, 0.9);
        vec3 lavaGlow = mix(vec3(0.4, 0.12, 0.03), vec3(0.96, 0.36, 0.08), clamp(fissureNoise * 0.45 + hotspotNoise, 0.0, 1.0));
        vec3 lava = mix(basalt, lavaGlow, lavaMask);
        if (uSurfaceMode == 2) {
          float volcanicLandMask = landMask * (0.34 + reliefSupport * 0.66);
          vec3 basaltLand = mix(vec3(0.03, 0.03, 0.04), vec3(0.16, 0.12, 0.1), clamp(elevN + macro * 0.1, 0.0, 1.0));
          float ashField = smoothstep(0.26, 0.72, breakup) * volcanicLandMask;
          terrain = mix(terrain, basaltLand, 0.62 + uBasaltContrast * 0.22);
          terrain = mix(terrain, terrain * 0.78, ashField * 0.45);
          float burntMask = fissureNoise * fissureBandMask * 0.5 + calderaMask * 0.3;
          terrain = mix(terrain, terrain * 0.62, clamp(burntMask, 0.0, 0.55));
          float emberMask = fissureNoise * hotspotNoise * fissureBandMask * (0.03 + uLavaAccentStrength * 0.05);
          terrain = mix(terrain, mix(terrain, vec3(0.82, 0.27, 0.08), 0.32), emberMask);
        }

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

        float reliefContrast = reliefSupport * (slope * (0.18 + uSlopeDarkening * 0.32 + uplandMask * (0.08 + uUplandLift * 0.22)) + peakMask * (0.03 + uPeakLift * 0.18));
        float lightTerm = 0.18 + keyDiffuse * 0.68 + fillDiffuse * 0.16;
        lightTerm *= 1.0 + reliefContrast * (0.1 + (1.0 - keyDiffuse) * 0.08);
        lightTerm += hemi * 0.06 + fresnel * 0.035;

        vec3 color = base * lightTerm;
        float shadowMask = clamp((1.0 - keyDiffuse) * (0.55 + reliefSupport * 0.45 + slope * 0.35), 0.0, 1.0);
        color = mix(color, color * uShadowTint, shadowMask * uShadowTintStrength);
        color += vec3(waterSpec + landSpec);
        if (uJungleArchetype == 1) {
          float humidHaze = fresnel * (0.02 + uWetness * 0.05) * (0.4 + hemi * 0.6);
          color += vec3(0.04, 0.08, 0.05) * humidHaze;
        }
        if (uSurfaceMode == 2) {
          color += lavaGlow * lavaMask * uEmissiveStrength * 0.36;
        }

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
