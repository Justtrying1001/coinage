import * as THREE from 'three';
import type { CityTerrainInput } from '@/game/render/modes/terrain/CityTerrainTypes';

export type CityRenderViewMode = 'normal' | 'build' | 'flat';

interface CityTerrainMaterial extends THREE.MeshStandardMaterial {
  userData: THREE.MeshStandardMaterial['userData'] & {
    setViewMode?: (next: CityRenderViewMode) => void;
  };
}

export function createCityTerrainMaterial(input: CityTerrainInput, farField = false, initialMode: CityRenderViewMode = 'normal') {
  const mat = new THREE.MeshStandardMaterial({
    color: input.palettes.low,
    roughness: THREE.MathUtils.clamp(input.material.roughness + (farField ? 0.08 : 0), 0.08, 1),
    metalness: THREE.MathUtils.clamp(input.material.metalness * (farField ? 0.5 : 1), 0, 0.6),
  }) as CityTerrainMaterial;

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uLow = { value: input.palettes.low };
    shader.uniforms.uHigh = { value: input.palettes.high };
    shader.uniforms.uCliff = { value: input.palettes.cliff };
    shader.uniforms.uAccent = { value: input.palettes.accent };
    shader.uniforms.uFogTint = { value: input.palettes.fog };
    shader.uniforms.uFarField = { value: farField ? 1 : 0 };
    shader.uniforms.uViewMode = { value: initialMode === 'normal' ? 0 : initialMode === 'build' ? 1 : 2 };

    mat.userData.setViewMode = (next: CityRenderViewMode) => {
      shader.uniforms.uViewMode.value = next === 'normal' ? 0 : next === 'build' ? 1 : 2;
    };

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        attribute float aHeight01;
        attribute float aSlope;
        attribute float aCliff;
        attribute float aWetness;
        attribute float aShoreline;
        attribute float aFrozen;
        attribute float aThermal;
        attribute float aMineralized;
        attribute float aVegetation;
        attribute float aBuildable;
        attribute float aBlocked;
        attribute float aExpansion;
        attribute float aRisk;
        varying float vHeight01;
        varying float vSlope;
        varying float vCliff;
        varying float vWetness;
        varying float vShoreline;
        varying float vFrozen;
        varying float vThermal;
        varying float vMineralized;
        varying float vVegetation;
        varying float vBuildable;
        varying float vBlocked;
        varying float vExpansion;
        varying float vRisk;
        varying vec3 vWorldPos;
      `,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vHeight01 = aHeight01;
        vSlope = aSlope;
        vCliff = aCliff;
        vWetness = aWetness;
        vShoreline = aShoreline;
        vFrozen = aFrozen;
        vThermal = aThermal;
        vMineralized = aMineralized;
        vVegetation = aVegetation;
        vBuildable = aBuildable;
        vBlocked = aBlocked;
        vExpansion = aExpansion;
        vRisk = aRisk;
      `,
      )
      .replace(
        '#include <worldpos_vertex>',
        `#include <worldpos_vertex>
        vWorldPos = worldPosition.xyz;
      `,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform vec3 uLow;
        uniform vec3 uHigh;
        uniform vec3 uCliff;
        uniform vec3 uAccent;
        uniform vec3 uFogTint;
        uniform int uFarField;
        uniform int uViewMode;
        varying float vHeight01;
        varying float vSlope;
        varying float vCliff;
        varying float vWetness;
        varying float vShoreline;
        varying float vFrozen;
        varying float vThermal;
        varying float vMineralized;
        varying float vVegetation;
        varying float vBuildable;
        varying float vBlocked;
        varying float vExpansion;
        varying float vRisk;
        varying vec3 vWorldPos;
      `,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec3 baseColor = mix(uLow, uHigh, smoothstep(0.14, 0.88, vHeight01));
        baseColor = mix(baseColor, uCliff, vCliff * 0.7);
        baseColor = mix(baseColor, uAccent, vVegetation * 0.3 + vMineralized * 0.24);

        vec3 wetTint = vec3(0.88, 0.94, 1.02);
        vec3 frostTint = vec3(0.85, 0.92, 1.03);
        vec3 heatTint = vec3(1.06, 0.88, 0.74);

        baseColor *= mix(vec3(1.0), wetTint, vWetness * 0.16);
        baseColor *= mix(vec3(1.0), frostTint, vFrozen * 0.24);
        baseColor *= mix(vec3(1.0), heatTint, vThermal * 0.2);
        baseColor = mix(baseColor, baseColor * vec3(1.09, 1.04, 0.92), vShoreline * 0.24);

        if (uFarField == 1) {
          baseColor = mix(baseColor, uFogTint, 0.18);
        }

        if (uViewMode > 0) {
          vec3 buildableColor = vec3(0.23, 0.63, 0.34);
          vec3 blockedColor = vec3(0.72, 0.24, 0.2);
          vec3 expansionColor = vec3(0.69, 0.57, 0.24);
          vec3 riskColor = vec3(0.77, 0.48, 0.16);
          vec3 utility = mix(vec3(0.18, 0.22, 0.25), buildableColor, vBuildable);
          utility = mix(utility, expansionColor, vExpansion * 0.72);
          utility = mix(utility, blockedColor, vBlocked);
          utility = mix(utility, riskColor, vRisk * 0.45);

          float gridCell = 4.5;
          vec2 g = abs(fract(vWorldPos.xz / gridCell) - 0.5);
          float line = smoothstep(0.49, 0.5, max(g.x, g.y));
          float gridMask = (uViewMode == 1 ? 0.8 : 0.95) * line;

          baseColor = mix(baseColor * (uViewMode == 1 ? 0.65 : 0.42), utility, uViewMode == 1 ? 0.62 : 0.88);
          baseColor = mix(baseColor, vec3(0.9, 0.94, 0.96), gridMask * 0.55);
        }

        diffuseColor.rgb = baseColor;
      `,
      )
      .replace(
        'float roughnessFactor = roughness;',
        `float roughnessFactor = roughness;
        roughnessFactor = clamp(roughnessFactor + vCliff * 0.18 + vMineralized * 0.06 - vWetness * 0.12, 0.05, 1.0);
        if (uViewMode == 2) roughnessFactor = max(roughnessFactor, 0.82);`,
      )
      .replace(
        'float metalnessFactor = metalness;',
        `float metalnessFactor = metalness;
        metalnessFactor = clamp(metalnessFactor + vMineralized * 0.24 - vWetness * 0.03, 0.0, 0.8);
        if (uViewMode > 0) metalnessFactor *= 0.42;`,
      );
  };

  mat.needsUpdate = true;
  return mat;
}
