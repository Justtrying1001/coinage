import * as THREE from 'three';
import type { PlanetArchetype, PlanetVisualProfile } from '@/game/render/types';
import { SeededRng } from '@/game/world/rng';

export interface PlanetBeautyUniformBundle {
  uniforms: Record<string, THREE.IUniform>;
  bloom: {
    strength: number;
    radius: number;
    threshold: number;
  };
}

interface PlanetSurfacePreset {
  type: 1 | 2 | 3;
  amplitude: number;
  sharpness: number;
  offset: number;
  period: number;
  persistence: number;
  lacunarity: number;
  octaves: number;
  undulation: number;
  ambientIntensity: number;
  diffuseIntensity: number;
  specularIntensity: number;
  shininess: number;
  bumpStrength: number;
  bumpOffset: number;
  colors: [string, string, string, string, string];
  transitions: [number, number, number, number];
  blends: [number, number, number, number];
  bloom: PlanetBeautyUniformBundle['bloom'];
}

const PRESETS: Record<PlanetArchetype, PlanetSurfacePreset> = {
  oceanic: {
    type: 2, amplitude: 0.055, sharpness: 2.0, offset: -0.01, period: 0.73, persistence: 0.49, lacunarity: 1.8, octaves: 9, undulation: 0.02,
    ambientIntensity: 0.03, diffuseIntensity: 1.0, specularIntensity: 2.1, shininess: 22,
    bumpStrength: 0.75, bumpOffset: 0.003,
    colors: ['#092a66', '#0d4d80', '#2d7f7a', '#7ca8a4', '#d8eef9'],
    transitions: [0.07, 0.2, 0.34, 1.02],
    blends: [0.14, 0.13, 0.1, 0.14],
    bloom: { strength: 0.14, radius: 0.45, threshold: 0.0 },
  },
  terrestrial: {
    type: 2, amplitude: 0.085, sharpness: 2.55, offset: -0.01, period: 0.58, persistence: 0.484, lacunarity: 1.8, octaves: 10, undulation: 0.03,
    ambientIntensity: 0.02, diffuseIntensity: 1.0, specularIntensity: 1.95, shininess: 10,
    bumpStrength: 1.0, bumpOffset: 0.003,
    colors: ['#04356d', '#148759', '#9e845f', '#2e4e1e', '#2f2f2f'],
    transitions: [0.071, 0.215, 0.372, 1.2],
    blends: [0.152, 0.152, 0.104, 0.168],
    bloom: { strength: 0.16, radius: 0.5, threshold: 0.0 },
  },
  arid: {
    type: 2, amplitude: 0.1, sharpness: 2.8, offset: -0.01, period: 0.52, persistence: 0.5, lacunarity: 1.95, octaves: 10, undulation: 0.02,
    ambientIntensity: 0.025, diffuseIntensity: 1.0, specularIntensity: 0.6, shininess: 8,
    bumpStrength: 1.05, bumpOffset: 0.0035,
    colors: ['#4a2a16', '#8e5f31', '#c19458', '#6a5138', '#d6bd97'],
    transitions: [0.08, 0.21, 0.35, 1.15],
    blends: [0.12, 0.14, 0.14, 0.2],
    bloom: { strength: 0.08, radius: 0.4, threshold: 0.0 },
  },
  frozen: {
    type: 2, amplitude: 0.07, sharpness: 2.1, offset: -0.008, period: 0.66, persistence: 0.46, lacunarity: 1.72, octaves: 9, undulation: 0.02,
    ambientIntensity: 0.03, diffuseIntensity: 1.04, specularIntensity: 1.5, shininess: 18,
    bumpStrength: 0.76, bumpOffset: 0.003,
    colors: ['#123b67', '#4b7fa9', '#a8cbe3', '#e7f1f9', '#ffffff'],
    transitions: [0.07, 0.2, 0.32, 1.0],
    blends: [0.11, 0.1, 0.1, 0.12],
    bloom: { strength: 0.12, radius: 0.45, threshold: 0.0 },
  },
  volcanic: {
    type: 3, amplitude: 0.12, sharpness: 2.75, offset: -0.014, period: 0.5, persistence: 0.53, lacunarity: 2.0, octaves: 10, undulation: 0.025,
    ambientIntensity: 0.02, diffuseIntensity: 1.0, specularIntensity: 0.75, shininess: 10,
    bumpStrength: 1.05, bumpOffset: 0.0038,
    colors: ['#181015', '#42282b', '#6a3b33', '#262022', '#f07b2d'],
    transitions: [0.08, 0.21, 0.36, 0.72],
    blends: [0.1, 0.12, 0.1, 0.08],
    bloom: { strength: 0.12, radius: 0.35, threshold: 0.0 },
  },
  mineral: {
    type: 2, amplitude: 0.092, sharpness: 2.45, offset: -0.01, period: 0.57, persistence: 0.5, lacunarity: 1.86, octaves: 9, undulation: 0.02,
    ambientIntensity: 0.025, diffuseIntensity: 1.0, specularIntensity: 1.35, shininess: 16,
    bumpStrength: 0.9, bumpOffset: 0.0033,
    colors: ['#273f55', '#637b82', '#948c76', '#6f6b63', '#d4cdbb'],
    transitions: [0.08, 0.21, 0.35, 1.02],
    blends: [0.11, 0.12, 0.11, 0.15],
    bloom: { strength: 0.09, radius: 0.38, threshold: 0.0 },
  },
  barren: {
    type: 2, amplitude: 0.088, sharpness: 2.6, offset: -0.012, period: 0.51, persistence: 0.5, lacunarity: 1.92, octaves: 10, undulation: 0.02,
    ambientIntensity: 0.022, diffuseIntensity: 0.98, specularIntensity: 0.35, shininess: 7,
    bumpStrength: 0.95, bumpOffset: 0.0035,
    colors: ['#30241c', '#665240', '#8c735e', '#5c4f47', '#beaf9d'],
    transitions: [0.08, 0.22, 0.38, 1.14],
    blends: [0.12, 0.13, 0.13, 0.2],
    bloom: { strength: 0.06, radius: 0.35, threshold: 0.0 },
  },
};

const noiseFunctions = `
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x,289.0);} 
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314*r;}
float simplex3(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod(i,289.0);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=1.0/7.0;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float fractal3(vec3 v,float period,float persistence,float lacunarity,int octaves){
  float n=0.0;
  float a=1.0;
  float maxAmp=0.0;
  float p=period;
  for(int i=0;i<12;i++){
    if(i>=octaves) break;
    n+=a*simplex3(v/p);
    a*=persistence;
    maxAmp+=a;
    p/=lacunarity;
  }
  return n/max(maxAmp,0.0001);
}
float terrainHeight(int type,vec3 v,float amplitude,float sharpness,float offset,float period,float persistence,float lacunarity,int octaves,float undulation){
  float h=0.0;
  if(type==1){
    h=amplitude*simplex3(v/period);
  } else if(type==2){
    h=amplitude*fractal3(v,period,persistence,lacunarity,octaves);
    h=amplitude*pow(max(0.0,(h+1.0)/2.0),sharpness);
  } else {
    h=fractal3(v,period,persistence,lacunarity,octaves);
    h=amplitude*pow(max(0.0,1.0-abs(h)),sharpness);
  }
  if(undulation>0.0){
    h += simplex3(v * (1.2 / max(period, 0.0001))) * undulation;
  }
  return max(0.0,h+offset);
}`;

export const planetBeautyVertexShader = `
precision highp float;
attribute vec3 tangent;
uniform int type;
uniform float radius;
uniform float amplitude;
uniform float sharpness;
uniform float offset;
uniform float period;
uniform float persistence;
uniform float lacunarity;
uniform int octaves;
uniform float undulation;
varying vec3 fragPosition;
varying vec3 fragNormal;
varying vec3 fragTangent;
varying vec3 fragBitangent;
${noiseFunctions}
void main(){
  float h=terrainHeight(type,position,amplitude,sharpness,offset,period,persistence,lacunarity,octaves,undulation);
  vec3 pos=position*(radius+h);
  gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0);
  fragPosition=position;
  fragNormal=normal;
  fragTangent=tangent;
  fragBitangent=cross(normal,tangent);
}`;

export const planetBeautyFragmentShader = `
precision highp float;
uniform int type;
uniform float radius;
uniform float amplitude;
uniform float sharpness;
uniform float offset;
uniform float period;
uniform float persistence;
uniform float lacunarity;
uniform int octaves;
uniform float undulation;
uniform vec3 color1;
uniform vec3 color2;
uniform vec3 color3;
uniform vec3 color4;
uniform vec3 color5;
uniform float transition2;
uniform float transition3;
uniform float transition4;
uniform float transition5;
uniform float blend12;
uniform float blend23;
uniform float blend34;
uniform float blend45;
uniform float bumpStrength;
uniform float bumpOffset;
uniform float ambientIntensity;
uniform float diffuseIntensity;
uniform float specularIntensity;
uniform float shininess;
uniform vec3 lightDirection;
uniform vec3 lightColor;
uniform float uDebugView;
varying vec3 fragPosition;
varying vec3 fragNormal;
varying vec3 fragTangent;
varying vec3 fragBitangent;
${noiseFunctions}
void main(){
  float h=terrainHeight(type,fragPosition,amplitude,sharpness,offset,period,persistence,lacunarity,octaves,undulation);
  vec3 dx=bumpOffset*fragTangent;
  vec3 dy=bumpOffset*fragBitangent;
  float hdx=terrainHeight(type,fragPosition+dx,amplitude,sharpness,offset,period,persistence,lacunarity,octaves,undulation);
  float hdy=terrainHeight(type,fragPosition+dy,amplitude,sharpness,offset,period,persistence,lacunarity,octaves,undulation);
  vec3 pos=fragPosition*(radius+h);
  vec3 posDx=(fragPosition+dx)*(radius+hdx);
  vec3 posDy=(fragPosition+dy)*(radius+hdy);
  vec3 bumpNormal=normalize(cross(posDx-pos,posDy-pos));
  vec3 N=normalize(mix(fragNormal,bumpNormal,bumpStrength));
  vec3 L=normalize(-lightDirection);
  vec3 V=normalize(cameraPosition-pos);
  vec3 R=normalize(reflect(L,N));
  float diffuse=diffuseIntensity*max(0.0,dot(N,-L));
  float specFalloff=clamp((transition3-h)/max(transition3,0.0001),0.0,1.0);
  float specular=max(0.0,specFalloff*specularIntensity*pow(max(dot(V,R),0.0),shininess));
  float light=ambientIntensity+diffuse+specular;
  vec3 c12=mix(color1,color2,smoothstep(transition2-blend12,transition2+blend12,h));
  vec3 c123=mix(c12,color3,smoothstep(transition3-blend23,transition3+blend23,h));
  vec3 c1234=mix(c123,color4,smoothstep(transition4-blend34,transition4+blend34,h));
  vec3 finalColor=mix(c1234,color5,smoothstep(transition5-blend45,transition5+blend45,h));
  if (uDebugView > 0.5 && uDebugView < 1.5) { gl_FragColor = vec4(vec3(clamp(h / max(amplitude,0.001), 0.0, 1.0)), 1.0); return; }
  if (uDebugView > 1.5) { float slope = 1.0 - max(dot(N, normalize(fragNormal)), 0.0); gl_FragColor = vec4(vec3(slope * 2.0), 1.0); return; }
  gl_FragColor=vec4(light*finalColor*lightColor,1.0);
}`;

export function createPlanetBeautyUniforms(profile: PlanetVisualProfile, seed: number): PlanetBeautyUniformBundle {
  const preset = PRESETS[profile.archetype];
  const rng = new SeededRng(seed ^ 0x51ed270b);

  const hueNudge = rng.range(-0.025, 0.025) + (profile.hueDrift / 360) * 0.12;
  const satNudge = rng.range(-0.05, 0.05);
  const lightNudge = rng.range(-0.04, 0.04);

  const shifted = preset.colors.map((hex) => {
    const color = new THREE.Color(hex);
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    const shiftedHue = (hsl.h + hueNudge + (profile.baseHue - 180) / 720 + 1) % 1;
    const shiftedSat = clamp(hsl.s + satNudge + (profile.landSaturation - 50) / 320, 0, 1);
    const shiftedLight = clamp(hsl.l + lightNudge + (profile.landLightness - 50) / 360, 0, 1);
    return new THREE.Color().setHSL(shiftedHue, shiftedSat, shiftedLight);
  }) as [THREE.Color, THREE.Color, THREE.Color, THREE.Color, THREE.Color];

  const amplitudeJitter = rng.range(-0.008, 0.008);
  const periodJitter = rng.range(-0.04, 0.04);
  const transitionJitter = rng.range(-0.018, 0.018);

  return {
    uniforms: {
      type: { value: preset.type },
      radius: { value: 1.0 },
      amplitude: { value: clamp(preset.amplitude + amplitudeJitter + (profile.reliefStrength - 0.12) * 0.04, 0.03, 0.16) },
      sharpness: { value: clamp(preset.sharpness + (profile.reliefSharpness - 1.4) * 0.2, 1.15, 3.3) },
      offset: { value: preset.offset + rng.range(-0.004, 0.004) },
      period: { value: clamp(preset.period + periodJitter + (profile.continentScale - 2.2) * 0.025, 0.35, 0.95) },
      persistence: { value: clamp(preset.persistence + rng.range(-0.02, 0.02), 0.38, 0.62) },
      lacunarity: { value: clamp(preset.lacunarity + rng.range(-0.07, 0.07), 1.55, 2.2) },
      octaves: { value: preset.octaves },
      undulation: { value: clamp(preset.undulation + rng.range(-0.01, 0.01), 0.0, 0.06) },
      bumpStrength: { value: clamp(preset.bumpStrength + (profile.ridgeWeight - 0.28) * 0.12, 0.5, 1.25) },
      bumpOffset: { value: preset.bumpOffset },
      ambientIntensity: { value: preset.ambientIntensity },
      diffuseIntensity: { value: preset.diffuseIntensity },
      specularIntensity: { value: clamp(preset.specularIntensity + (profile.metalness - 0.08) * 0.9, 0.2, 2.5) },
      shininess: { value: clamp(preset.shininess + (profile.metalness - 0.08) * 14, 6, 32) },
      lightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
      lightColor: { value: new THREE.Color(0xffffff).multiplyScalar(clamp(profile.lightIntensity, 0.9, 1.8)) },
      color1: { value: shifted[0] },
      color2: { value: shifted[1] },
      color3: { value: shifted[2] },
      color4: { value: shifted[3] },
      color5: { value: shifted[4] },
      transition2: { value: clamp(preset.transitions[0] + transitionJitter + (profile.oceanLevel - 0.4) * 0.03, 0.02, 0.25) },
      transition3: { value: clamp(preset.transitions[1] + transitionJitter, 0.08, 0.34) },
      transition4: { value: clamp(preset.transitions[2] + transitionJitter, 0.2, 0.5) },
      transition5: { value: clamp(preset.transitions[3] + transitionJitter * 2, 0.65, 1.3) },
      blend12: { value: preset.blends[0] },
      blend23: { value: preset.blends[1] },
      blend34: { value: preset.blends[2] },
      blend45: { value: preset.blends[3] },
      uDebugView: { value: 0 },
    },
    bloom: preset.bloom,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
