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
        float breakup = sin(vWorldXZ.x * 0.043 + vWorldXZ.y * 0.027) * 0.5 + cos(vWorldXZ.x * 0.018 - vWorldXZ.y * 0.051) * 0.5;
        breakup = breakup * 0.5 + 0.5;

        vec3 baseColor = mix(uLow, uHigh, smoothstep(0.14, 0.9, vHeight01 + (breakup - 0.5) * 0.04));

        if (${materialMode === 'standard' ? 1 : 0} == 0) {
          baseColor = mix(baseColor, uCliff, vCliff * 0.64);
          baseColor = mix(baseColor, uAccent, vVegetation * 0.28 + vMineralized * 0.2);
          baseColor *= mix(vec3(1.0), vec3(0.9, 0.95, 1.02), vWetness * 0.17);
          baseColor *= mix(vec3(1.0), vec3(0.86, 0.93, 1.04), vFrozen * 0.24);
          baseColor *= mix(vec3(1.0), vec3(1.08, 0.89, 0.74), vThermal * 0.17);
          baseColor = mix(baseColor, baseColor * vec3(1.08, 1.05, 0.95), vShoreline * 0.18);
        }

        vec3 zoned = baseColor;
        zoned = mix(zoned, zoned * vec3(1.03, 1.03, 1.02), vBuildMask * 0.45);
        zoned = mix(zoned, zoned * vec3(0.985, 0.985, 0.97), vTransitionMask * 0.18);
        zoned = mix(zoned, zoned * vec3(0.95, 0.96, 1.02), vBackgroundMask * 0.26);
        zoned = mix(zoned, zoned * vec3(0.98, 1.0, 1.04), smoothstep(0.65, 1.0, vDepthMask) * 0.12);

        if (uFarField == 1) {
          zoned = mix(zoned, uFogTint, 0.2);
        }

        diffuseColor.rgb = zoned;
      `,
      )
      .replace(
        'float roughnessFactor = roughness;',
        `float roughnessFactor = roughness;
        roughnessFactor = clamp(roughnessFactor + vCliff * 0.22 + vBackgroundMask * 0.06 - vBuildMask * 0.08, 0.07, 1.0);`,
      )
      .replace(
        'float metalnessFactor = metalness;',
        `float metalnessFactor = metalness;
        metalnessFactor = clamp(metalnessFactor + vMineralized * 0.22 - vBuildMask * 0.05, 0.0, 0.8);`,
      );
  };

  mat.needsUpdate = true;
  return mat;
}
