import * as THREE from 'three';
import type { CityTerrainInput } from '@/game/render/modes/terrain/CityTerrainTypes';
import type { CityTerrainMaterialMode } from '@/game/render/modes/terrain/CityTerrainEngine';

export function createCityTerrainMaterial(input: CityTerrainInput, farField = false, materialMode: CityTerrainMaterialMode = 'heightBlend') {
  const mat = new THREE.MeshStandardMaterial({
    color: input.palettes.low,
    roughness: THREE.MathUtils.clamp(input.material.roughness + (farField ? 0.08 : 0), 0.08, 1),
    metalness: THREE.MathUtils.clamp(input.material.metalness * (farField ? 0.5 : 1), 0, 0.6),
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
        varying float vHeight01;
        varying float vSlope;
        varying float vCliff;
        varying float vWetness;
        varying float vShoreline;
        varying float vFrozen;
        varying float vThermal;
        varying float vMineralized;
        varying float vVegetation;
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
      `,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec3 baseColor = mix(uLow, uHigh, smoothstep(0.16, 0.88, vHeight01));
        if (${materialMode === 'standard' ? 1 : 0} == 1) {
          diffuseColor.rgb = baseColor;
          return;
        }
        baseColor = mix(baseColor, uCliff, vCliff * 0.72);
        baseColor = mix(baseColor, uAccent, vVegetation * 0.34 + vMineralized * 0.28);

        vec3 wetTint = vec3(0.88, 0.94, 1.02);
        vec3 frostTint = vec3(0.86, 0.93, 1.04);
        vec3 heatTint = vec3(1.06, 0.88, 0.74);

        baseColor *= mix(vec3(1.0), wetTint, vWetness * 0.18);
        baseColor *= mix(vec3(1.0), frostTint, vFrozen * 0.25);
        baseColor *= mix(vec3(1.0), heatTint, vThermal * 0.2);
        baseColor = mix(baseColor, baseColor * vec3(1.08, 1.04, 0.92), vShoreline * 0.26);

        if (uFarField == 1) {
          baseColor = mix(baseColor, uFogTint, 0.4);
        }

        diffuseColor.rgb = baseColor;
      `,
      )
      .replace(
        'float roughnessFactor = roughness;',
        `float roughnessFactor = roughness;
        roughnessFactor = clamp(roughnessFactor + vCliff * 0.18 + vMineralized * 0.06 - vWetness * 0.12, 0.05, 1.0);`,
      )
      .replace(
        'float metalnessFactor = metalness;',
        `float metalnessFactor = metalness;
        metalnessFactor = clamp(metalnessFactor + vMineralized * 0.24 - vWetness * 0.03, 0.0, 0.8);`,
      );
  };

  mat.needsUpdate = true;
  return mat;
}
