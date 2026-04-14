import * as THREE from 'three';
import type { CityTerrainInput } from '@/game/render/modes/terrain/CityTerrainTypes';
import type { CityTerrainMaterialMode } from '@/game/render/modes/terrain/CityTerrainEngine';

export function createCityTerrainMaterial(input: CityTerrainInput, farField = false, materialMode: CityTerrainMaterialMode = 'heightBlend') {
  const mat = new THREE.MeshStandardMaterial({
    color: input.palettes.low,
    roughness: THREE.MathUtils.clamp(input.material.roughness + (farField ? 0.1 : 0), 0.08, 1),
    metalness: THREE.MathUtils.clamp(input.material.metalness * (farField ? 0.4 : 1), 0, 0.7),
  });

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uLow = { value: input.palettes.low };
    shader.uniforms.uHigh = { value: input.palettes.high };
    shader.uniforms.uCliff = { value: input.palettes.cliff };
    shader.uniforms.uAccent = { value: input.palettes.accent };
    shader.uniforms.uFogTint = { value: input.palettes.fog };
    shader.uniforms.uFarField = { value: farField ? 1 : 0 };
    shader.uniforms.uSaturationBoost = { value: farField ? 1.02 : 1.12 };

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
        attribute float aDepthMask;
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
        varying float vDepthMask;
        varying vec2 vWorldXZ;
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
        vDepthMask = aDepthMask;
        vWorldXZ = transformed.xz;
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
        uniform float uSaturationBoost;
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
        varying float vDepthMask;
        varying vec2 vWorldXZ;
      `,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float breakup = sin(vWorldXZ.x * 0.039 + vWorldXZ.y * 0.024) * 0.5 + cos(vWorldXZ.x * 0.017 - vWorldXZ.y * 0.048) * 0.5;
        breakup = breakup * 0.5 + 0.5;

        float heightMix = smoothstep(0.08, 0.92, vHeight01 + (breakup - 0.5) * 0.06);
        vec3 baseColor = mix(uLow, uHigh, heightMix);

        if (${materialMode === 'standard' ? 1 : 0} == 0) {
          baseColor = mix(baseColor, uCliff, smoothstep(0.24, 0.88, vCliff) * 0.72);
          baseColor = mix(baseColor, uAccent, clamp(vVegetation * 0.42 + vMineralized * 0.24, 0.0, 0.56));
          baseColor *= mix(vec3(1.0), vec3(0.86, 0.94, 1.06), vWetness * 0.24);
          baseColor *= mix(vec3(1.0), vec3(0.82, 0.9, 1.08), vFrozen * 0.34);
          baseColor *= mix(vec3(1.0), vec3(1.12, 0.86, 0.7), vThermal * 0.22);
          baseColor = mix(baseColor, baseColor * vec3(1.1, 1.08, 0.96), vShoreline * 0.22);
        }

        vec3 zoned = baseColor;
        float softBuild = smoothstep(0.3, 0.9, vBuildMask);
        zoned = mix(zoned, zoned * vec3(1.02, 1.02, 1.015), softBuild * 0.24);
        zoned = mix(zoned, zoned * vec3(0.96, 0.97, 1.03), vBackgroundMask * 0.16);
        zoned = mix(zoned, zoned * vec3(0.98, 0.99, 1.04), smoothstep(0.5, 1.0, vDepthMask) * 0.09);

        float luminance = dot(zoned, vec3(0.2126, 0.7152, 0.0722));
        zoned = mix(vec3(luminance), zoned, uSaturationBoost);

        if (uFarField == 1) {
          zoned = mix(zoned, uFogTint, 0.28);
        }

        diffuseColor.rgb = zoned;
      `,
      )
      .replace(
        'float roughnessFactor = roughness;',
        `float roughnessFactor = roughness;
        roughnessFactor = clamp(roughnessFactor + vCliff * 0.24 + vBackgroundMask * 0.1 - vBuildMask * 0.06 - vShoreline * 0.08, 0.05, 1.0);`,
      )
      .replace(
        'float metalnessFactor = metalness;',
        `float metalnessFactor = metalness;
        metalnessFactor = clamp(metalnessFactor + vMineralized * 0.24 - vBuildMask * 0.04 + vThermal * 0.06, 0.0, 0.82);`,
      );
  };

  mat.needsUpdate = true;
  return mat;
}
