import * as THREE from 'three';
import type { CityTerrainInput } from '@/game/render/modes/terrain/CityTerrainTypes';
import type { CityTerrainMaterialMode } from '@/game/render/modes/terrain/CityTerrainEngine';

export function createCityTerrainMaterial(input: CityTerrainInput, farField = false, materialMode: CityTerrainMaterialMode = 'heightBlend') {
  const mat = new THREE.MeshStandardMaterial({
    color: input.palettes.low,
    roughness: THREE.MathUtils.clamp(input.material.roughness + (farField ? 0.12 : 0), 0.1, 1),
    metalness: THREE.MathUtils.clamp(input.material.metalness * (farField ? 0.45 : 1), 0, 0.7),
  });

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uLow = { value: input.palettes.low };
    shader.uniforms.uHigh = { value: input.palettes.high };
    shader.uniforms.uCliff = { value: input.palettes.cliff };
    shader.uniforms.uAccent = { value: input.palettes.accent };
    shader.uniforms.uFogTint = { value: input.palettes.fog };
    shader.uniforms.uFarField = { value: farField ? 1 : 0 };

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
        attribute float aBuildMask;
        attribute float aTransitionMask;
        attribute float aBackgroundMask;
        varying float vHeight01;
        varying float vSlope;
        varying float vCliff;
        varying float vWetness;
        varying float vShoreline;
        varying float vFrozen;
        varying float vThermal;
        varying float vMineralized;
        varying float vVegetation;
        varying float vBuildMask;
        varying float vTransitionMask;
        varying float vBackgroundMask;
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
        vBuildMask = aBuildMask;
        vTransitionMask = aTransitionMask;
        vBackgroundMask = aBackgroundMask;
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
        varying float vHeight01;
        varying float vSlope;
        varying float vCliff;
        varying float vWetness;
        varying float vShoreline;
        varying float vFrozen;
        varying float vThermal;
        varying float vMineralized;
        varying float vVegetation;
        varying float vBuildMask;
        varying float vTransitionMask;
        varying float vBackgroundMask;
      `,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec3 baseColor = mix(uLow, uHigh, smoothstep(0.15, 0.86, vHeight01));

        if (${materialMode === 'standard' ? 1 : 0} == 0) {
          baseColor = mix(baseColor, uCliff, vCliff * 0.68);
          baseColor = mix(baseColor, uAccent, vVegetation * 0.27 + vMineralized * 0.22);
          baseColor *= mix(vec3(1.0), vec3(0.9, 0.95, 1.02), vWetness * 0.15);
          baseColor *= mix(vec3(1.0), vec3(0.86, 0.93, 1.04), vFrozen * 0.24);
          baseColor *= mix(vec3(1.0), vec3(1.08, 0.89, 0.74), vThermal * 0.18);
          baseColor = mix(baseColor, baseColor * vec3(1.06, 1.04, 0.95), vShoreline * 0.2);
        }

        vec3 buildTint = mix(baseColor, baseColor * vec3(1.03, 1.04, 1.03), vBuildMask * 0.65);
        vec3 transitionTint = mix(buildTint, buildTint * vec3(0.98, 0.98, 0.96), vTransitionMask * 0.26);
        vec3 backgroundTint = mix(transitionTint, transitionTint * vec3(0.94, 0.95, 1.02), vBackgroundMask * 0.36);

        if (uFarField == 1) {
          backgroundTint = mix(backgroundTint, uFogTint, 0.26);
        }

        diffuseColor.rgb = backgroundTint;
      `,
      )
      .replace(
        'float roughnessFactor = roughness;',
        `float roughnessFactor = roughness;
        roughnessFactor = clamp(roughnessFactor + vCliff * 0.2 + vBackgroundMask * 0.08 - vBuildMask * 0.12, 0.07, 1.0);`,
      )
      .replace(
        'float metalnessFactor = metalness;',
        `float metalnessFactor = metalness;
        metalnessFactor = clamp(metalnessFactor + vMineralized * 0.22 - vBuildMask * 0.08, 0.0, 0.8);`,
      );
  };

  mat.needsUpdate = true;
  return mat;
}
