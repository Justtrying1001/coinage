import * as THREE from 'three';
import type { PlanetArchetype, PlanetVisualProfile } from '@/game/render/types';

export interface PlanetBeautyUniformBundle {
  uniforms: Record<string, THREE.IUniform>;
  atmosphereInnerColor: THREE.Color;
  atmosphereOuterColor: THREE.Color;
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
}

const PRESETS: Record<PlanetArchetype, ArchetypePreset> = {
  oceanic: { elevationShift: -0.07, ocean: new THREE.Color('#06304e'), lowland: new THREE.Color('#2e7b67'), upland: new THREE.Color('#4e9e84'), mountain: new THREE.Color('#8eb8a5'), peak: new THREE.Color('#d8ebe4'), lava: new THREE.Color('#8e3928'), specularity: 0.7, fresnelTint: new THREE.Color('#8fd9ff') },
  terrestrial: { elevationShift: 0, ocean: new THREE.Color('#0d3b7d'), lowland: new THREE.Color('#3d8b4d'), upland: new THREE.Color('#809f59'), mountain: new THREE.Color('#8d7f6d'), peak: new THREE.Color('#d8d5ce'), lava: new THREE.Color('#a14224'), specularity: 0.35, fresnelTint: new THREE.Color('#93c9ff') },
  arid: { elevationShift: 0.09, ocean: new THREE.Color('#1b2d41'), lowland: new THREE.Color('#9a7948'), upland: new THREE.Color('#b99156'), mountain: new THREE.Color('#8f643f'), peak: new THREE.Color('#d8c29d'), lava: new THREE.Color('#9f4c1f'), specularity: 0.12, fresnelTint: new THREE.Color('#e6bc8a') },
  frozen: { elevationShift: -0.03, ocean: new THREE.Color('#123d65'), lowland: new THREE.Color('#6ba4bf'), upland: new THREE.Color('#b7d7e6'), mountain: new THREE.Color('#e3edf3'), peak: new THREE.Color('#fcffff'), lava: new THREE.Color('#7b9cb7'), specularity: 0.45, fresnelTint: new THREE.Color('#b9edff') },
  volcanic: { elevationShift: 0.08, ocean: new THREE.Color('#311d1f'), lowland: new THREE.Color('#523033'), upland: new THREE.Color('#6a3f37'), mountain: new THREE.Color('#3a2d31'), peak: new THREE.Color('#b59688'), lava: new THREE.Color('#ff6f2d'), specularity: 0.22, fresnelTint: new THREE.Color('#ff9a55') },
  mineral: { elevationShift: 0.05, ocean: new THREE.Color('#173548'), lowland: new THREE.Color('#58706f'), upland: new THREE.Color('#8f8f7f'), mountain: new THREE.Color('#70706f'), peak: new THREE.Color('#cbc6b9'), lava: new THREE.Color('#da7f4e'), specularity: 0.56, fresnelTint: new THREE.Color('#bce0e3') },
  barren: { elevationShift: 0.06, ocean: new THREE.Color('#21252a'), lowland: new THREE.Color('#746455'), upland: new THREE.Color('#8f7a66'), mountain: new THREE.Color('#67574c'), peak: new THREE.Color('#c7b8aa'), lava: new THREE.Color('#8b5f4d'), specularity: 0.16, fresnelTint: new THREE.Color('#dfc8b2') },
};

export const planetBeautyVertexShader = `
precision highp float;
uniform float uSeed; uniform float uRadius; uniform float uDisplacementScale; uniform float uReliefSharpness; uniform float uOceanLevel; uniform float uMacroBias; uniform float uContinentScale; uniform float uRidgeScale; uniform float uCraterScale; uniform float uRidgeWeight; uniform float uCraterWeight; uniform float uPolarWeight; uniform float uElevationShift;
varying vec3 vWorldPos; varying vec3 vBaseNormal; varying vec3 vUnitPos; varying float vHeight01; varying float vDetail;
float hash(float n){return fract(sin(n)*43758.5453123);} 
float noise(vec3 x){vec3 p=floor(x);vec3 f=fract(x);f=f*f*(3.0-2.0*f);float n=p.x+p.y*57.0+p.z*113.0+uSeed*0.173;return mix(mix(mix(hash(n),hash(n+1.0),f.x),mix(hash(n+57.0),hash(n+58.0),f.x),f.y),mix(mix(hash(n+113.0),hash(n+114.0),f.x),mix(hash(n+170.0),hash(n+171.0),f.x),f.y),f.z);} 
float fbm(vec3 p,int oct){float v=0.0;float a=0.5;float f=1.0;for(int i=0;i<7;i++){if(i>=oct)break;v+=noise(p*f)*a;f*=2.03;a*=0.5;}return v;}
float ridge(float n){n=abs(n*2.0-1.0);return 1.0-n;} 
float crater(vec3 p){float c=fbm(p*uCraterScale,3);c=smoothstep(0.64,0.88,c);return c*c;}
float terrainHeight(vec3 unitPos,out float detail){float continent=fbm(unitPos*(uContinentScale*1.2+0.45),5);float macro=fbm(unitPos*(uContinentScale*0.55+0.2),3);float ridges=ridge(fbm(unitPos*(uRidgeScale*0.9+1.6),4));float micro=fbm(unitPos*(uRidgeScale*2.2+5.0),3);float craterField=crater(unitPos+vec3(0.0,uSeed*0.031,0.0));float polar=smoothstep(0.56,0.98,abs(unitPos.y));float base=continent*0.64+macro*0.36+uMacroBias;float relief=(ridges-0.5)*uRidgeWeight*0.42+(micro-0.5)*0.18;float craterCut=craterField*uCraterWeight*0.33;float polarLift=polar*uPolarWeight*0.14;float h=base+relief-craterCut+polarLift+uElevationShift;h=pow(clamp(h,0.0,1.0),mix(1.25,0.65,clamp(uReliefSharpness*0.45,0.0,1.0)));detail=micro;return clamp(h,0.0,1.0);} 
void main(){vec3 unitPos=normalize(position);float detail=0.0;float h=terrainHeight(unitPos,detail);float signedHeight=(h-uOceanLevel)*2.0;float displacement=signedHeight*uDisplacementScale;vec3 displacedPos=unitPos*(uRadius+displacement);vec4 world=modelMatrix*vec4(displacedPos,1.0);vWorldPos=world.xyz;vUnitPos=unitPos;vBaseNormal=normalize(mat3(modelMatrix)*unitPos);vHeight01=h;vDetail=detail;gl_Position=projectionMatrix*viewMatrix*world;}
`;

export const planetBeautyFragmentShader = `
precision highp float;
uniform float uSeed; uniform float uTime; uniform float uOceanLevel; uniform float uSpecularity; uniform int uDebugView; uniform vec3 uLightDir; uniform vec3 uAmbientColor; uniform vec3 uLightColor; uniform vec3 uOceanColor; uniform vec3 uLowColor; uniform vec3 uUplandColor; uniform vec3 uMountainColor; uniform vec3 uPeakColor; uniform vec3 uLavaColor; uniform vec3 uFresnelTint;
varying vec3 vWorldPos; varying vec3 vBaseNormal; varying vec3 vUnitPos; varying float vHeight01; varying float vDetail;
float hash(float n){return fract(sin(n)*43758.5453123);} 
float noise(vec3 x){vec3 p=floor(x);vec3 f=fract(x);f=f*f*(3.0-2.0*f);float n=p.x+p.y*57.0+p.z*113.0+uSeed*0.173;return mix(mix(mix(hash(n),hash(n+1.0),f.x),mix(hash(n+57.0),hash(n+58.0),f.x),f.y),mix(mix(hash(n+113.0),hash(n+114.0),f.x),mix(hash(n+170.0),hash(n+171.0),f.x),f.y),f.z);} 
vec3 sampleNormal(vec3 unitPos){float eps=0.002;float c=noise(unitPos*42.0+uSeed*0.01);float x=noise((unitPos+vec3(eps,0.0,0.0))*42.0+uSeed*0.01)-c;float y=noise((unitPos+vec3(0.0,eps,0.0))*42.0+uSeed*0.01)-c;float z=noise((unitPos+vec3(0.0,0.0,eps))*42.0+uSeed*0.01)-c;vec3 bump=normalize(vec3(-x,-y,0.04-z));return normalize(vBaseNormal+bump*0.16);} 
void main(){vec3 N=sampleNormal(vUnitPos);vec3 V=normalize(cameraPosition-vWorldPos);vec3 L=normalize(uLightDir);vec3 H=normalize(L+V);float h=clamp(vHeight01,0.0,1.0);float shore=smoothstep(uOceanLevel-0.02,uOceanLevel+0.03,h);float upland=smoothstep(uOceanLevel+0.06,0.68,h);float mountain=smoothstep(0.62,0.82,h);float peaks=smoothstep(0.81,0.96,h+(vDetail-0.5)*0.08);vec3 base=uOceanColor;base=mix(base,uLowColor,shore);base=mix(base,uUplandColor,upland);base=mix(base,uMountainColor,mountain);base=mix(base,uPeakColor,peaks);float lavaMask=smoothstep(0.62,0.88,abs(noise(vUnitPos*18.0+vec3(0.0,uTime*0.04,0.0))-0.5))*mountain;base=mix(base,uLavaColor,lavaMask*0.28);float diffuse=max(dot(N,L),0.0);float wrapDiffuse=max(dot(N,L)*0.5+0.5,0.0);float spec=pow(max(dot(N,H),0.0),mix(14.0,60.0,uSpecularity))*(0.16+uSpecularity*0.64);float fresnel=pow(1.0-max(dot(N,V),0.0),2.7);vec3 lit=base*(uAmbientColor+uLightColor*(diffuse*0.86+wrapDiffuse*0.22));lit+=spec*mix(vec3(1.0),base,0.28);lit+=uFresnelTint*fresnel*0.28;if(uDebugView==1){gl_FragColor=vec4(vec3(h),1.0);return;}if(uDebugView==2){float slope=1.0-max(dot(N,normalize(vBaseNormal)),0.0);gl_FragColor=vec4(vec3(slope*3.0),1.0);return;}gl_FragColor=vec4(lit,1.0);} 
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
  const atmosphereInnerColor = atmosphereOuterColor.clone().lerp(new THREE.Color('#ffffff'), 0.42);

  return {
    uniforms: {
      uTime: { value: 0 },
      uSeed: { value: seed / 97.0 },
      uRadius: { value: 1.0 },
      uDisplacementScale: { value: clamp(profile.reliefStrength * 0.28 + 0.03, 0.02, 0.11) },
      uReliefSharpness: { value: profile.reliefSharpness },
      uOceanLevel: { value: clamp(profile.oceanLevel * 0.75 + 0.18 + preset.elevationShift, 0.1, 0.84) },
      uMacroBias: { value: profile.macroBias * 0.32 },
      uContinentScale: { value: clamp(profile.continentScale * 0.66, 0.5, 2.8) },
      uRidgeScale: { value: clamp(profile.ridgeScale * 0.22, 1.4, 4.2) },
      uCraterScale: { value: clamp(profile.craterScale * 0.2, 0.7, 2.8) },
      uRidgeWeight: { value: clamp(profile.ridgeWeight, 0.08, 0.74) },
      uCraterWeight: { value: clamp(profile.craterWeight, 0.05, 0.55) },
      uPolarWeight: { value: clamp(profile.polarWeight, 0.02, 0.58) },
      uElevationShift: { value: preset.elevationShift },
      uSpecularity: { value: clamp(preset.specularity + profile.metalness * 0.6 - profile.roughness * 0.35, 0.04, 0.92) },
      uLightDir: { value: new THREE.Vector3(1.8, 0.9, 1.5).normalize() },
      uAmbientColor: { value: new THREE.Color('#2b3850') },
      uLightColor: { value: new THREE.Color('#fff1db').multiplyScalar(clamp(profile.lightIntensity, 0.8, 1.8)) },
      uOceanColor: { value: oceanColor },
      uLowColor: { value: lowColor },
      uUplandColor: { value: uplandColor },
      uMountainColor: { value: mountainColor },
      uPeakColor: { value: peakColor },
      uLavaColor: { value: lavaColor },
      uFresnelTint: { value: atmosphereOuterColor.clone().lerp(preset.fresnelTint, 0.35) },
      uDebugView: { value: 0 },
    },
    atmosphereInnerColor,
    atmosphereOuterColor,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
