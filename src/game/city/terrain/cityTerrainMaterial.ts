import { Color, ShaderMaterial, Vector2, Vector3 } from 'three';
import type { CityBiomeContext } from '@/game/city/terrain/CityBiomeContext';

function pickColorStops(context: CityBiomeContext) {
  const elevationStops = context.planetGenerationConfig.elevationGradient;
  const depthStops = context.planetGenerationConfig.depthGradient;

  const landLow = elevationStops[0]?.color ?? [0.3, 0.35, 0.4];
  const landHigh = elevationStops[elevationStops.length - 1]?.color ?? [0.86, 0.87, 0.88];
  const depthLow = depthStops[0]?.color ?? [0.1, 0.15, 0.2];
  const depthHigh = depthStops[depthStops.length - 1]?.color ?? [0.28, 0.4, 0.55];

  return {
    landLow: new Color().setRGB(landLow[0], landLow[1], landLow[2]),
    landHigh: new Color().setRGB(landHigh[0], landHigh[1], landHigh[2]),
    depthLow: new Color().setRGB(depthLow[0], depthLow[1], depthLow[2]),
    depthHigh: new Color().setRGB(depthHigh[0], depthHigh[1], depthHigh[2]),
  };
}

export function createCityTerrainMaterial(context: CityBiomeContext, minElevation: number, maxElevation: number) {
  const colors = pickColorStops(context);

  // This is a transitional city terrain shader that already consumes planet generation
  // signals (surface level/mode, wetness, vegetation, emissive strength, gradients).
  // It intentionally adapts PlanetMaterial concepts without duplicating the full sphere shader.
  return new ShaderMaterial({
    uniforms: {
      uMinMax: { value: new Vector2(minElevation, maxElevation) },
      uSurfaceLevel01: { value: context.planetGenerationConfig.surfaceLevel01 },
      uLandLow: { value: new Vector3(colors.landLow.r, colors.landLow.g, colors.landLow.b) },
      uLandHigh: { value: new Vector3(colors.landHigh.r, colors.landHigh.g, colors.landHigh.b) },
      uDepthLow: { value: new Vector3(colors.depthLow.r, colors.depthLow.g, colors.depthLow.b) },
      uDepthHigh: { value: new Vector3(colors.depthHigh.r, colors.depthHigh.g, colors.depthHigh.b) },
      uWetness: { value: context.planetGenerationConfig.material.wetness },
      uVegetation: { value: context.planetGenerationConfig.material.vegetationDensity },
      uSurfaceMode: { value: context.planetGenerationConfig.surfaceMode === 'ice' ? 1 : context.planetGenerationConfig.surfaceMode === 'lava' ? 2 : 0 },
      uEmissiveStrength: { value: context.planetGenerationConfig.material.emissiveStrength },
      uCanopyTint: { value: new Vector3(...context.planetGenerationConfig.material.canopyTint) },
    },
    vertexShader: `
      attribute float aElevation;
      varying float vElevation;
      varying vec3 vNormalW;
      varying vec3 vWorld;
      void main() {
        vElevation = aElevation;
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform vec2 uMinMax;
      uniform float uSurfaceLevel01;
      uniform vec3 uLandLow;
      uniform vec3 uLandHigh;
      uniform vec3 uDepthLow;
      uniform vec3 uDepthHigh;
      uniform float uWetness;
      uniform float uVegetation;
      uniform int uSurfaceMode;
      uniform float uEmissiveStrength;
      uniform vec3 uCanopyTint;
      varying float vElevation;
      varying vec3 vNormalW;
      varying vec3 vWorld;

      float saturate(float v) { return clamp(v, 0.0, 1.0); }

      void main() {
        float elevation01 = saturate((vElevation - uMinMax.x) / max(0.0001, uMinMax.y - uMinMax.x));
        float depthN = saturate(elevation01 / max(0.0001, uSurfaceLevel01));
        float landN = saturate((elevation01 - uSurfaceLevel01) / max(0.0001, 1.0 - uSurfaceLevel01));

        vec3 lowSurface = mix(uDepthLow, uDepthHigh, depthN);
        if (uSurfaceMode == 1) {
          lowSurface = mix(vec3(0.28, 0.38, 0.48), vec3(0.86, 0.93, 0.99), depthN);
        } else if (uSurfaceMode == 2) {
          vec3 basalt = mix(vec3(0.03, 0.03, 0.04), vec3(0.2, 0.14, 0.1), depthN);
          vec3 lava = mix(vec3(0.46, 0.16, 0.06), vec3(0.98, 0.42, 0.12), depthN);
          lowSurface = mix(basalt, lava, 0.35 + uEmissiveStrength * 0.3);
        }

        vec3 land = mix(uLandLow, uLandHigh, landN);
        float vegMask = uVegetation * smoothstep(0.12, 0.7, landN) * (1.0 - smoothstep(0.35, 0.75, abs(vNormalW.x) + abs(vNormalW.z)));
        land = mix(land, mix(land, uCanopyTint, 0.62), vegMask);

        float edgeBlend = smoothstep(uSurfaceLevel01 - 0.03, uSurfaceLevel01 + 0.03, elevation01);
        vec3 baseColor = mix(lowSurface, land, edgeBlend);

        vec3 N = normalize(vNormalW);
        vec3 L = normalize(vec3(0.7, 1.0, 0.5));
        float diffuse = max(dot(N, L), 0.0);
        float hemi = N.y * 0.5 + 0.5;
        float light = 0.28 + diffuse * 0.6 + hemi * 0.22;

        vec3 color = baseColor * light;
        if (uSurfaceMode == 2) {
          color += vec3(0.18, 0.05, 0.02) * (0.18 + uEmissiveStrength * 0.35) * (1.0 - edgeBlend);
        }

        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
}
