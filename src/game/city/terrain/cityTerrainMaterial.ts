import { Color, ShaderMaterial, Vector3 } from 'three';
import type { CityTheme } from '@/game/city/themes/cityThemePresets';

export function createCityTerrainMaterial(theme: CityTheme) {
  return new ShaderMaterial({
    uniforms: {
      uLowColor: { value: new Color(theme.terrainLowColor) },
      uMidColor: { value: new Color(theme.terrainMidColor) },
      uHighColor: { value: new Color(theme.terrainHighColor) },
      uFogColor: { value: new Color(theme.fogColor) },
      uWaterColor: { value: new Color(theme.waterColor) },
      uReliefSharpness: { value: theme.reliefSharpness },
      uMoisture: { value: theme.moisture },
      uLightDir: { value: new Vector3(0.7, 0.82, 0.26).normalize() },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      varying vec3 vNormalW;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform vec3 uLowColor;
      uniform vec3 uMidColor;
      uniform vec3 uHighColor;
      uniform vec3 uFogColor;
      uniform vec3 uWaterColor;
      uniform float uReliefSharpness;
      uniform float uMoisture;
      uniform vec3 uLightDir;
      varying vec3 vWorldPos;
      varying vec3 vNormalW;

      float hash31(vec3 p) {
        return fract(sin(dot(p, vec3(157.1, 211.7, 437.1))) * 43758.5453);
      }

      void main() {
        float h = clamp((vWorldPos.y + 3.0) / 7.2, 0.0, 1.0);
        float strata = smoothstep(0.1, 0.5, h);
        vec3 terrain = mix(uLowColor, uMidColor, strata);
        terrain = mix(terrain, uHighColor, smoothstep(0.55, 1.0, h));

        float breakup = hash31(vWorldPos * (0.22 + uReliefSharpness * 0.06)) - 0.5;
        terrain *= 1.0 + breakup * 0.12;

        float moistureMask = smoothstep(0.0, 0.42, 1.0 - h) * uMoisture;
        terrain = mix(terrain, mix(terrain, uWaterColor, 0.42), moistureMask * 0.55);

        vec3 N = normalize(vNormalW);
        float key = max(dot(N, normalize(uLightDir)), 0.0);
        float rim = pow(1.0 - max(dot(N, vec3(0.0, 1.0, 0.0)), 0.0), 1.4) * 0.25;
        vec3 lit = terrain * (0.55 + key * 0.85) + rim;

        float fogFactor = smoothstep(35.0, 120.0, length(vWorldPos.xz));
        vec3 color = mix(lit, uFogColor, fogFactor * 0.7);

        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
}
