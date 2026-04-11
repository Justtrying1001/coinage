import * as THREE from 'three';
import type { PlanetArchetype, PlanetVisualProfile } from '@/game/render/types';

export interface PlanetBeautyUniformBundle {
  uniforms: Record<string, THREE.IUniform>;
  atmosphereInnerColor: THREE.Color;
  atmosphereOuterColor: THREE.Color;
  atmosphereScale: number;
  atmosphereOpacity: number;
  atmospherePower: number;
}

interface ArchetypePreset {
  elevationShift: number;
  ocean: THREE.Color;
  lowland: THREE.Color;
  upland: THREE.Color;
  mountain: THREE.Color;
  peak: THREE.Color;
  lava: THREE.Color;
  specularity: number;
  fresnelTint: THREE.Color;
  terrainShape: [number, number, number, number];
  reliefMix: [number, number, number, number];
  bands0: [number, number, number, number];
  bands1: [number, number, number, number];
  atmosphereScale: number;
  atmosphereOpacity: number;
  atmospherePower: number;
}

const PRESETS: Record<PlanetArchetype, ArchetypePreset> = {
  oceanic: {
    elevationShift: -0.06,
    ocean: new THREE.Color('#06304e'),
    lowland: new THREE.Color('#2e7b67'),
    upland: new THREE.Color('#4e9e84'),
    mountain: new THREE.Color('#8eb8a5'),
    peak: new THREE.Color('#d8ebe4'),
    lava: new THREE.Color('#8e3928'),
    specularity: 0.76,
    fresnelTint: new THREE.Color('#8fd9ff'),
    terrainShape: [0.26, 0.18, 0.22, 0.14],
    reliefMix: [1.08, 0.32, 0.08, 0.18],
    bands0: [0.6, 0.66, 0.75, 0.86],
    bands1: [0.94, 0.12, 0.18, 0.02],
    atmosphereScale: 1.04,
    atmosphereOpacity: 0.2,
    atmospherePower: 3.0,
  },
  terrestrial: {
    elevationShift: 0,
    ocean: new THREE.Color('#0d3b7d'),
    lowland: new THREE.Color('#3d8b4d'),
    upland: new THREE.Color('#809f59'),
    mountain: new THREE.Color('#8d7f6d'),
    peak: new THREE.Color('#d8d5ce'),
    lava: new THREE.Color('#a14224'),
    specularity: 0.34,
    fresnelTint: new THREE.Color('#93c9ff'),
    terrainShape: [0.54, 0.42, 0.46, 0.24],
    reliefMix: [1.25, 0.62, 0.14, 0.34],
    bands0: [0.43, 0.5, 0.66, 0.8],
    bands1: [0.91, 0.2, 0.26, 0.03],
    atmosphereScale: 1.033,
    atmosphereOpacity: 0.17,
    atmospherePower: 3.2,
  },
  arid: {
    elevationShift: 0.08,
    ocean: new THREE.Color('#1b2d41'),
    lowland: new THREE.Color('#9a7948'),
    upland: new THREE.Color('#b99156'),
    mountain: new THREE.Color('#8f643f'),
    peak: new THREE.Color('#d8c29d'),
    lava: new THREE.Color('#9f4c1f'),
    specularity: 0.1,
    fresnelTint: new THREE.Color('#e6bc8a'),
    terrainShape: [0.66, 0.68, 0.42, 0.62],
    reliefMix: [1.18, 0.82, 0.1, 0.28],
    bands0: [0.22, 0.28, 0.57, 0.79],
    bands1: [0.9, 0.82, 0.08, 0.02],
    atmosphereScale: 1.024,
    atmosphereOpacity: 0.12,
    atmospherePower: 3.4,
  },
  frozen: {
    elevationShift: -0.03,
    ocean: new THREE.Color('#123d65'),
    lowland: new THREE.Color('#6ba4bf'),
    upland: new THREE.Color('#b7d7e6'),
    mountain: new THREE.Color('#e3edf3'),
    peak: new THREE.Color('#fcffff'),
    lava: new THREE.Color('#7b9cb7'),
    specularity: 0.44,
    fresnelTint: new THREE.Color('#b9edff'),
    terrainShape: [0.4, 0.28, 0.34, 0.2],
    reliefMix: [1.06, 0.45, 0.09, 0.2],
    bands0: [0.48, 0.55, 0.7, 0.82],
    bands1: [0.9, 0.16, 0.84, 0.02],
    atmosphereScale: 1.038,
    atmosphereOpacity: 0.18,
    atmospherePower: 3.3,
  },
  volcanic: {
    elevationShift: 0.1,
    ocean: new THREE.Color('#311d1f'),
    lowland: new THREE.Color('#523033'),
    upland: new THREE.Color('#6a3f37'),
    mountain: new THREE.Color('#3a2d31'),
    peak: new THREE.Color('#b59688'),
    lava: new THREE.Color('#ff6f2d'),
    specularity: 0.24,
    fresnelTint: new THREE.Color('#ff9a55'),
    terrainShape: [0.74, 0.6, 0.82, 0.56],
    reliefMix: [1.32, 0.96, 0.16, 0.52],
    bands0: [0.12, 0.19, 0.43, 0.73],
    bands1: [0.88, 0.44, 0.04, 0.64],
    atmosphereScale: 1.02,
    atmosphereOpacity: 0.13,
    atmospherePower: 3.6,
  },
  mineral: {
    elevationShift: 0.05,
    ocean: new THREE.Color('#173548'),
    lowland: new THREE.Color('#58706f'),
    upland: new THREE.Color('#8f8f7f'),
    mountain: new THREE.Color('#70706f'),
    peak: new THREE.Color('#cbc6b9'),
    lava: new THREE.Color('#da7f4e'),
    specularity: 0.58,
    fresnelTint: new THREE.Color('#bce0e3'),
    terrainShape: [0.58, 0.46, 0.56, 0.32],
    reliefMix: [1.22, 0.72, 0.13, 0.38],
    bands0: [0.26, 0.32, 0.58, 0.8],
    bands1: [0.91, 0.46, 0.08, 0.05],
    atmosphereScale: 1.026,
    atmosphereOpacity: 0.11,
    atmospherePower: 3.5,
  },
  barren: {
    elevationShift: 0.07,
    ocean: new THREE.Color('#21252a'),
    lowland: new THREE.Color('#746455'),
    upland: new THREE.Color('#8f7a66'),
    mountain: new THREE.Color('#67574c'),
    peak: new THREE.Color('#c7b8aa'),
    lava: new THREE.Color('#8b5f4d'),
    specularity: 0.14,
    fresnelTint: new THREE.Color('#dfc8b2'),
    terrainShape: [0.62, 0.52, 0.44, 0.5],
    reliefMix: [1.16, 0.76, 0.11, 0.3],
    bands0: [0.18, 0.24, 0.52, 0.78],
    bands1: [0.89, 0.62, 0.05, 0.02],
    atmosphereScale: 1.018,
    atmosphereOpacity: 0.09,
    atmospherePower: 3.8,
  },
};

export const planetBeautyVertexShader = `
precision highp float;
uniform float uSeed; uniform float uRadius; uniform float uDisplacementScale; uniform float uReliefSharpness; uniform float uOceanLevel; uniform float uMacroBias; uniform float uContinentScale; uniform float uRidgeScale; uniform float uCraterScale; uniform float uRidgeWeight; uniform float uCraterWeight; uniform float uPolarWeight; uniform float uElevationShift;
uniform vec4 uTerrainShape; uniform vec4 uReliefMix;
varying vec3 vWorldPos; varying vec3 vBaseNormal; varying vec3 vUnitPos; varying float vHeight01; varying float vMacro; varying float vMicro;
float hash(float n){return fract(sin(n)*43758.5453123);} 
float noise(vec3 x){vec3 p=floor(x);vec3 f=fract(x);f=f*f*(3.0-2.0*f);float n=p.x+p.y*57.0+p.z*113.0+uSeed*0.173;return mix(mix(mix(hash(n),hash(n+1.0),f.x),mix(hash(n+57.0),hash(n+58.0),f.x),f.y),mix(mix(hash(n+113.0),hash(n+114.0),f.x),mix(hash(n+170.0),hash(n+171.0),f.x),f.y),f.z);} 
float fbm(vec3 p,int oct){float v=0.0;float a=0.5;float f=1.0;for(int i=0;i<7;i++){if(i>=oct)break;v+=noise(p*f)*a;f*=2.03;a*=0.5;}return v;}
float ridge(float n){n=abs(n*2.0-1.0);return 1.0-n;} 
float signedHeight(vec3 unitPos,out float macroMask,out float microDetail){
  vec3 seedOffset=vec3(uSeed*0.13,-uSeed*0.07,uSeed*0.11);
  float macroA=fbm(unitPos*(uContinentScale*0.95+0.35)+seedOffset,5);
  float macroB=fbm(unitPos*(uContinentScale*1.9+1.1)-seedOffset,4);
  float continental=(macroA-0.5)*1.25+(macroB-0.5)*0.75+uMacroBias*0.9;

  float basinNoise=fbm(unitPos*(uContinentScale*0.55+0.2)-seedOffset*0.35,3)-0.5;
  float basin=continental-basinNoise*0.32;

  float plateau=fbm(unitPos*(uRidgeScale*0.52+1.2)+seedOffset*1.3)-0.5;
  float ridges=ridge(fbm(unitPos*(uRidgeScale*1.18+2.1)-seedOffset*1.7,4))-0.5;
  float crack=ridge(fbm(unitPos*(uRidgeScale*2.3+4.5)+vec3(0.0,uSeed*0.061,0.0),3))-0.5;
  float craters=smoothstep(0.56,0.9,fbm(unitPos*(uCraterScale*1.2+1.3)+seedOffset*2.0,4));

  float erosion=(fbm(unitPos*(uCraterScale*1.9+4.3)-seedOffset*1.5,3)-0.5)*uTerrainShape.w;
  float meso=mix(plateau,ridges,uTerrainShape.z) + crack*uTerrainShape.y*0.45 - craters*uCraterWeight*0.42;

  float polar=smoothstep(0.5,0.98,abs(unitPos.y));

  float s=basin*uReliefMix.x + meso*uReliefMix.y + erosion*0.32 + polar*uPolarWeight*0.24 + uElevationShift;
  s += (uRidgeWeight-0.35)*0.16;
  s = mix(s*1.15,s,pow(clamp(uReliefSharpness*0.45,0.0,1.0),1.2));

  macroMask=clamp(0.5+s*0.7,0.0,1.0);
  microDetail=fbm(unitPos*(uRidgeScale*3.2+8.0)+seedOffset*2.3,3)-0.5;
  return clamp(s,-1.0,1.0);
}
void main(){
  vec3 unitPos=normalize(position);
  float macroMask=0.0;
  float microDetail=0.0;
  float signedH=signedHeight(unitPos,macroMask,microDetail);
  float h=clamp(signedH*0.5+0.5,0.0,1.0);
  float displacement=(h-uOceanLevel)*uDisplacementScale*1.8;
  vec3 displacedPos=unitPos*(uRadius+displacement);
  vec4 world=modelMatrix*vec4(displacedPos,1.0);
  vWorldPos=world.xyz;
  vUnitPos=unitPos;
  vBaseNormal=normalize(mat3(modelMatrix)*unitPos);
  vHeight01=h;
  vMacro=macroMask;
  vMicro=microDetail;
  gl_Position=projectionMatrix*viewMatrix*world;
}
`;

export const planetBeautyFragmentShader = `
precision highp float;
uniform float uSeed; uniform float uTime; uniform float uOceanLevel; uniform float uSpecularity; uniform float uDebugView; uniform vec3 uLightDir; uniform vec3 uAmbientColor; uniform vec3 uLightColor; uniform vec3 uOceanColor; uniform vec3 uLowColor; uniform vec3 uUplandColor; uniform vec3 uMountainColor; uniform vec3 uPeakColor; uniform vec3 uLavaColor; uniform vec3 uFresnelTint;
uniform float uReliefSharpness; uniform float uMacroBias; uniform float uContinentScale; uniform float uRidgeScale; uniform float uCraterScale; uniform float uRidgeWeight; uniform float uCraterWeight; uniform float uPolarWeight; uniform float uElevationShift;
uniform vec4 uTerrainShape; uniform vec4 uReliefMix; uniform vec4 uBands0; uniform vec4 uBands1;
varying vec3 vWorldPos; varying vec3 vBaseNormal; varying vec3 vUnitPos; varying float vHeight01; varying float vMacro; varying float vMicro;
float hash(float n){return fract(sin(n)*43758.5453123);} 
float noise(vec3 x){vec3 p=floor(x);vec3 f=fract(x);f=f*f*(3.0-2.0*f);float n=p.x+p.y*57.0+p.z*113.0+uSeed*0.173;return mix(mix(mix(hash(n),hash(n+1.0),f.x),mix(hash(n+57.0),hash(n+58.0),f.x),f.y),mix(mix(hash(n+113.0),hash(n+114.0),f.x),mix(hash(n+170.0),hash(n+171.0),f.x),f.y),f.z);} 
float fbm(vec3 p,int oct){float v=0.0;float a=0.5;float f=1.0;for(int i=0;i<7;i++){if(i>=oct)break;v+=noise(p*f)*a;f*=2.03;a*=0.5;}return v;}
float ridge(float n){n=abs(n*2.0-1.0);return 1.0-n;}
float signedHeight(vec3 unitPos,out float microDetail){
  vec3 seedOffset=vec3(uSeed*0.13,-uSeed*0.07,uSeed*0.11);
  float macroA=fbm(unitPos*(uContinentScale*0.95+0.35)+seedOffset,5);
  float macroB=fbm(unitPos*(uContinentScale*1.9+1.1)-seedOffset,4);
  float continental=(macroA-0.5)*1.25+(macroB-0.5)*0.75+uMacroBias*0.9;
  float basinNoise=fbm(unitPos*(uContinentScale*0.55+0.2)-seedOffset*0.35,3)-0.5;
  float basin=continental-basinNoise*0.32;

  float plateau=fbm(unitPos*(uRidgeScale*0.52+1.2)+seedOffset*1.3)-0.5;
  float ridges=ridge(fbm(unitPos*(uRidgeScale*1.18+2.1)-seedOffset*1.7,4))-0.5;
  float crack=ridge(fbm(unitPos*(uRidgeScale*2.3+4.5)+vec3(0.0,uSeed*0.061,0.0),3))-0.5;
  float craters=smoothstep(0.56,0.9,fbm(unitPos*(uCraterScale*1.2+1.3)+seedOffset*2.0,4));
  float erosion=(fbm(unitPos*(uCraterScale*1.9+4.3)-seedOffset*1.5,3)-0.5)*uTerrainShape.w;

  float meso=mix(plateau,ridges,uTerrainShape.z)+crack*uTerrainShape.y*0.45-craters*uCraterWeight*0.42;
  float polar=smoothstep(0.5,0.98,abs(unitPos.y));

  float s=basin*uReliefMix.x + meso*uReliefMix.y + erosion*0.32 + polar*uPolarWeight*0.24 + uElevationShift;
  s += (uRidgeWeight-0.35)*0.16;
  s = mix(s*1.15,s,pow(clamp(uReliefSharpness*0.45,0.0,1.0),1.2));
  microDetail=fbm(unitPos*(uRidgeScale*3.2+8.0)+seedOffset*2.3,3)-0.5;
  return clamp(s,-1.0,1.0);
}
vec3 sampleNormal(vec3 unitPos){
  float micro=0.0;
  float center=signedHeight(unitPos,micro);
  vec3 axis=abs(unitPos.y)>0.92?vec3(1.0,0.0,0.0):vec3(0.0,1.0,0.0);
  vec3 tangent=normalize(cross(axis,unitPos));
  vec3 bitangent=normalize(cross(unitPos,tangent));
  float eps=0.008;

  float microT=0.0;
  float microB=0.0;
  float ht=signedHeight(normalize(unitPos+tangent*eps),microT);
  float hb=signedHeight(normalize(unitPos+bitangent*eps),microB);
  vec3 grad=tangent*(ht-center)+bitangent*(hb-center);

  float c=noise(unitPos*72.0+uSeed*0.01);
  float nx=noise((unitPos+tangent*0.01)*72.0+uSeed*0.01)-c;
  float ny=noise((unitPos+bitangent*0.01)*72.0+uSeed*0.01)-c;
  vec3 microN=normalize(vBaseNormal - tangent*nx*1.8 - bitangent*ny*1.8);

  vec3 macroN=normalize(vBaseNormal-grad*(2.6+uReliefMix.y*1.5));
  return normalize(mix(macroN,microN,0.16+uReliefMix.z*0.16));
}
void main(){
  vec3 N=sampleNormal(vUnitPos);
  vec3 V=normalize(cameraPosition-vWorldPos);
  vec3 L=normalize(uLightDir);
  vec3 H=normalize(L+V);

  float h=clamp(vHeight01,0.0,1.0);
  float oceanBand=smoothstep(uBands0.x-0.05,uBands0.x+0.02,h);
  float shore=smoothstep(uBands0.x,uBands0.y,h);
  float mid=smoothstep(uBands0.y,uBands0.z,h);
  float high=smoothstep(uBands0.z,uBands0.w,h);
  float peak=smoothstep(uBands1.x-0.05,uBands1.x+0.03,h+vMicro*0.07);

  vec3 base=uOceanColor;
  base=mix(base,uLowColor,shore);
  base=mix(base,mix(uUplandColor,uLowColor,0.25),mid);
  base=mix(base,uMountainColor,high);
  base=mix(base,uPeakColor,peak);

  float wetness=(1.0-shore)*(1.0-high);
  float coastNoise=fbm(vUnitPos*13.0+vec3(0.0,uSeed*0.12,0.0),3);
  base=mix(base,uOceanColor*1.18,wetness*0.46*coastNoise);

  float dryness=uBands1.y;
  float dustMask=(mid*(1.0-shore)+high*0.3)*(0.35+dryness*0.65);
  base=mix(base,mix(uLowColor,uMountainColor,0.65),dustMask*0.22);

  float iceBias=uBands1.z;
  float polar=smoothstep(0.52,0.96,abs(vUnitPos.y));
  float iceMask=clamp((high*0.45+polar*0.75)*iceBias,0.0,1.0);
  base=mix(base,uPeakColor,iceMask*0.38);

  float lavaIntensity=uBands1.w;
  float lavaNoise=ridge(fbm(vUnitPos*24.0+vec3(0.0,uTime*0.03,0.0),4));
  float lavaMask=smoothstep(0.66,0.9,h)*smoothstep(0.52,0.9,lavaNoise)*lavaIntensity;
  base=mix(base,uLavaColor,lavaMask*0.48);

  float diffuse=max(dot(N,L),0.0);
  float wrapDiffuse=clamp(dot(N,L)*0.56+0.44,0.0,1.0);
  float terminator=pow(clamp(1.0-max(dot(N,L),0.0),0.0,1.0),1.8);
  float spec=pow(max(dot(N,H),0.0),mix(16.0,72.0,uSpecularity))*(0.08+uSpecularity*0.45);
  float fresnel=pow(1.0-max(dot(N,V),0.0),3.2);

  vec3 lit=base*(uAmbientColor+uLightColor*(diffuse*0.92+wrapDiffuse*0.24));
  lit*=1.0-terminator*0.18;
  lit+=spec*mix(vec3(1.0),base,0.3);
  lit+=uFresnelTint*fresnel*0.16;

  if(uDebugView>0.5&&uDebugView<1.5){gl_FragColor=vec4(vec3(h),1.0);return;}
  if(uDebugView>1.5){float slope=1.0-max(dot(N,normalize(vBaseNormal)),0.0);gl_FragColor=vec4(vec3(slope*2.4),1.0);return;}
  gl_FragColor=vec4(lit,1.0);
}
`;

function applyHueShift(color: THREE.Color, hueDegrees: number, saturationBoost: number, lightnessBias: number) {
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  hsl.h = ((hsl.h * 360 + hueDegrees) % 360 + 360) % 360 / 360;
  hsl.s = clamp(hsl.s * saturationBoost, 0, 1);
  hsl.l = clamp(hsl.l + lightnessBias, 0, 1);
  return new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l);
}

export function createPlanetBeautyUniforms(profile: PlanetVisualProfile, seed: number): PlanetBeautyUniformBundle {
  const preset = PRESETS[profile.archetype];
  const hueInfluence = (profile.baseHue - 180) * 0.15;
  const accentInfluence = (profile.accentHue - profile.baseHue) * 0.1;
  const saturationBoost = 0.84 + profile.landSaturation / 220;
  const lightnessBias = (profile.landLightness - 48) / 320;

  const oceanColor = applyHueShift(preset.ocean, hueInfluence * 0.7, 0.8 + profile.oceanSaturation / 220, (profile.oceanLightness - 40) / 380);
  const lowColor = applyHueShift(preset.lowland, hueInfluence, saturationBoost, lightnessBias);
  const uplandColor = applyHueShift(preset.upland, hueInfluence + accentInfluence * 0.5, saturationBoost * 0.95, lightnessBias * 0.75);
  const mountainColor = applyHueShift(preset.mountain, accentInfluence * 0.45, 0.9 + profile.landSaturation / 260, lightnessBias * 0.5);
  const peakColor = applyHueShift(preset.peak, accentInfluence * 0.25, 0.72 + profile.landSaturation / 350, lightnessBias * 0.3);
  const lavaColor = applyHueShift(preset.lava, profile.hueDrift * 0.9, 1.05, profile.emissiveIntensity * 0.24);

  const atmosphereOuterColor = applyHueShift(preset.fresnelTint, hueInfluence * 0.4, 0.8 + profile.oceanSaturation / 300, (profile.atmosphereLightness - 72) / 250);
  const atmosphereInnerColor = atmosphereOuterColor.clone().lerp(new THREE.Color('#ffffff'), 0.28);

  const oceanLevel = clamp(profile.oceanLevel * 0.75 + 0.18, 0.08, 0.86);

  return {
    uniforms: {
      uTime: { value: 0 },
      uSeed: { value: seed / 97.0 },
      uRadius: { value: 1.0 },
      uDisplacementScale: { value: clamp(profile.reliefStrength * 0.32 + 0.04, 0.03, 0.14) },
      uReliefSharpness: { value: profile.reliefSharpness },
      uOceanLevel: { value: oceanLevel },
      uMacroBias: { value: profile.macroBias * 0.34 },
      uContinentScale: { value: clamp(profile.continentScale * 0.68, 0.45, 2.9) },
      uRidgeScale: { value: clamp(profile.ridgeScale * 0.24, 1.2, 4.4) },
      uCraterScale: { value: clamp(profile.craterScale * 0.21, 0.75, 3.0) },
      uRidgeWeight: { value: clamp(profile.ridgeWeight, 0.08, 0.8) },
      uCraterWeight: { value: clamp(profile.craterWeight, 0.04, 0.62) },
      uPolarWeight: { value: clamp(profile.polarWeight, 0.01, 0.64) },
      uElevationShift: { value: preset.elevationShift },
      uSpecularity: { value: clamp(preset.specularity + profile.metalness * 0.54 - profile.roughness * 0.3, 0.04, 0.92) },
      uLightDir: { value: new THREE.Vector3(1.8, 0.9, 1.5).normalize() },
      uAmbientColor: { value: new THREE.Color('#26344d') },
      uLightColor: { value: new THREE.Color('#fff1db').multiplyScalar(clamp(profile.lightIntensity, 0.8, 1.8)) },
      uOceanColor: { value: oceanColor },
      uLowColor: { value: lowColor },
      uUplandColor: { value: uplandColor },
      uMountainColor: { value: mountainColor },
      uPeakColor: { value: peakColor },
      uLavaColor: { value: lavaColor },
      uFresnelTint: { value: atmosphereOuterColor.clone().lerp(preset.fresnelTint, 0.3) },
      uTerrainShape: { value: new THREE.Vector4(...preset.terrainShape) },
      uReliefMix: { value: new THREE.Vector4(...preset.reliefMix) },
      uBands0: { value: new THREE.Vector4(...preset.bands0) },
      uBands1: {
        value: new THREE.Vector4(
          preset.bands1[0],
          clamp(preset.bands1[1] + profile.humidityStrength * 0.2 - profile.oceanLevel * 0.12, 0, 1),
          clamp(preset.bands1[2] + profile.polarWeight * 0.36, 0, 1),
          clamp(preset.bands1[3] + profile.emissiveIntensity * 2.4, 0, 1),
        ),
      },
      uDebugView: { value: 0 },
    },
    atmosphereInnerColor,
    atmosphereOuterColor,
    atmosphereScale: preset.atmosphereScale,
    atmosphereOpacity: preset.atmosphereOpacity,
    atmospherePower: preset.atmospherePower,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
