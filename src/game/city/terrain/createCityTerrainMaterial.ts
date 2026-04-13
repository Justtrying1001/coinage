import { Color, MeshStandardMaterial } from 'three';
import type { CityBiomeContext } from '@/game/city/runtime/CityBiomeContext';

export function createCityTerrainMaterial(context: CityBiomeContext): MeshStandardMaterial {
  const { planetGenerationConfig, planetProfile } = context;
  const wetness = planetGenerationConfig.material.wetness;
  const dryness = 1 - wetness;
  const volcanic = planetGenerationConfig.surfaceMode === 'lava';

  const lowColor = new Color().fromArray(planetGenerationConfig.depthGradient[0]?.color ?? [0.2, 0.23, 0.25]);
  const highColor = new Color().fromArray(planetGenerationConfig.elevationGradient[planetGenerationConfig.elevationGradient.length - 1]?.color ?? [0.75, 0.76, 0.74]);
  const vegetationTint = new Color().fromArray(planetGenerationConfig.material.canopyTint);

  const material = new MeshStandardMaterial({
    color: lowColor.clone().lerp(highColor, 0.42),
    roughness: Math.min(0.98, planetGenerationConfig.material.roughness + 0.08),
    metalness: Math.max(0.02, planetGenerationConfig.material.metalness * 0.5),
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uLowColor = { value: lowColor };
    shader.uniforms.uHighColor = { value: highColor };
    shader.uniforms.uVegetationTint = { value: vegetationTint };
    shader.uniforms.uWetness = { value: wetness };
    shader.uniforms.uDryness = { value: dryness };
    shader.uniforms.uVolcanic = { value: volcanic ? 1 : 0 };
    shader.uniforms.uEmissiveStrength = { value: planetGenerationConfig.material.emissiveStrength };
    shader.uniforms.uRelief = { value: planetProfile.reliefStrength };

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWorldPos;\nvarying vec3 vWorldNormal;')
      .replace(
        '#include <worldpos_vertex>',
        '#include <worldpos_vertex>\nvWorldPos = worldPosition.xyz;\nvWorldNormal = normalize(mat3(modelMatrix) * normal);',
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec3 vWorldPos;\nvarying vec3 vWorldNormal;\nuniform vec3 uLowColor;\nuniform vec3 uHighColor;\nuniform vec3 uVegetationTint;\nuniform float uWetness;\nuniform float uDryness;\nuniform float uVolcanic;\nuniform float uEmissiveStrength;\nuniform float uRelief;\n\nfloat hash31(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7))) * 43758.5453); }\nfloat noise3(vec3 p){ vec3 i=floor(p); vec3 f=fract(p); f=f*f*(3.0-2.0*f);\nfloat n000=hash31(i+vec3(0,0,0)); float n100=hash31(i+vec3(1,0,0));\nfloat n010=hash31(i+vec3(0,1,0)); float n110=hash31(i+vec3(1,1,0));\nfloat n001=hash31(i+vec3(0,0,1)); float n101=hash31(i+vec3(1,0,1));\nfloat n011=hash31(i+vec3(0,1,1)); float n111=hash31(i+vec3(1,1,1));\nfloat nx00=mix(n000,n100,f.x); float nx10=mix(n010,n110,f.x);\nfloat nx01=mix(n001,n101,f.x); float nx11=mix(n011,n111,f.x);\nfloat nxy0=mix(nx00,nx10,f.y); float nxy1=mix(nx01,nx11,f.y);\nreturn mix(nxy0,nxy1,f.z); }\nfloat fbm(vec3 p){ float a=0.5; float f=1.0; float v=0.0; for(int i=0;i<4;i++){ v += a * noise3(p*f); f *= 2.03; a *= 0.5; } return v; }\nvec3 triplanarNoise(vec3 p, vec3 n){ vec3 w = pow(abs(n), vec3(6.0)); w /= max(dot(w, vec3(1.0)), 0.0001);\nfloat x = fbm(vec3(p.yz, p.x) * 0.12); float y = fbm(vec3(p.xz, p.y) * 0.12); float z = fbm(vec3(p.xy, p.z) * 0.12);\nreturn vec3(x*w.x + y*w.y + z*w.z); }',
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float slope = 1.0 - clamp(vWorldNormal.y * 0.5 + 0.5, 0.0, 1.0);
        float elev01 = clamp((vWorldPos.y + 6.0) / 18.0, 0.0, 1.0);
        float macro = fbm(vWorldPos * 0.06 + vec3(17.2, 6.8, 2.4));
        float breakup = triplanarNoise(vWorldPos, normalize(vWorldNormal)).r;
        float moistureBand = clamp(uWetness * (1.0 - slope) + (1.0 - elev01) * 0.4, 0.0, 1.0);

        vec3 bedrock = mix(uLowColor * (0.8 + macro * 0.25), uHighColor, elev01);
        vec3 soil = mix(bedrock, uLowColor * 0.8, moistureBand * 0.55);
        vec3 canopy = mix(soil, uVegetationTint, (1.0 - slope) * 0.4 * (1.0 - uDryness));
        vec3 steepRock = mix(bedrock * 0.65, uHighColor * 0.6, breakup);
        vec3 col = mix(canopy, steepRock, smoothstep(0.28, 0.66, slope));
        col *= 0.88 + breakup * 0.18;

        diffuseColor.rgb = mix(diffuseColor.rgb, col, 0.9);
        totalEmissiveRadiance += uVolcanic * vec3(1.0, 0.28, 0.08) * pow(max(0.0, 1.0 - slope), 3.0) * uEmissiveStrength * (0.2 + macro * 0.3) * uRelief;`,
      );
  };

  return material;
}
