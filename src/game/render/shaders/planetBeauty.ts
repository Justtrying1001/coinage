import * as THREE from 'three';
import type { PlanetArchetype, PlanetVisualProfile } from '@/game/render/types';
import { SeededRng } from '@/game/world/rng';

export interface PlanetBeautyUniformBundle {
  uniforms: Record<string, THREE.IUniform>;
  atmosphere: {
    color: THREE.Color;
    opacity: number;
    particleCount: number;
    minPointSize: number;
    maxPointSize: number;
    thickness: number;
    density: number;
    scale: number;
    speed: number;
  };
  bloom: {
    strength: number;
    radius: number;
    threshold: number;
  };
}

interface ArchetypePreset {
  type: 1 | 2 | 3;
  amplitude: number;
  sharpness: number;
  offset: number;
  period: number;
  persistence: number;
  lacunarity: number;
  octaves: number;
  bumpStrength: number;
  bumpOffset: number;
  ambientIntensity: number;
  diffuseIntensity: number;
  specularIntensity: number;
  shininess: number;
  colors: [string, string, string, string, string];
  transitions: [number, number, number, number];
  blends: [number, number, number, number];
  atmosphere: PlanetBeautyUniformBundle['atmosphere'];
  bloom: PlanetBeautyUniformBundle['bloom'];
}

const PRESETS: Record<PlanetArchetype, ArchetypePreset> = {
  terrestrial: {
    type: 2, amplitude: 0.08, sharpness: 2.4, offset: -0.008, period: 0.58, persistence: 0.5, lacunarity: 1.84, octaves: 9,
    bumpStrength: 0.85, bumpOffset: 0.004,
    ambientIntensity: 0.06, diffuseIntensity: 1.0, specularIntensity: 1.2, shininess: 18,
    colors: ['#0f3570', '#1f6b58', '#7a8e49', '#4f5e38', '#d9d8ce'],
    transitions: [0.06, 0.19, 0.33, 1.1],
    blends: [0.11, 0.12, 0.12, 0.16],
    atmosphere: { color: new THREE.Color('#a8cfff'), opacity: 0.24, particleCount: 3000, minPointSize: 40, maxPointSize: 88, thickness: 0.12, density: 0.15, scale: 0.42, speed: 0.04 },
    bloom: { strength: 0.18, radius: 0.5, threshold: 0.0 },
  },
  oceanic: {
    type: 2, amplitude: 0.05, sharpness: 2.0, offset: -0.011, period: 0.76, persistence: 0.48, lacunarity: 1.8, octaves: 8,
    bumpStrength: 0.62, bumpOffset: 0.003,
    ambientIntensity: 0.07, diffuseIntensity: 1.04, specularIntensity: 2.0, shininess: 28,
    colors: ['#0a2f6f', '#0f567e', '#3d8c78', '#9db9b0', '#edf7ff'],
    transitions: [0.05, 0.16, 0.29, 0.8],
    blends: [0.14, 0.12, 0.1, 0.12],
    atmosphere: { color: new THREE.Color('#9ad6ff'), opacity: 0.28, particleCount: 3400, minPointSize: 42, maxPointSize: 94, thickness: 0.13, density: 0.2, scale: 0.45, speed: 0.05 },
    bloom: { strength: 0.22, radius: 0.55, threshold: 0.0 },
  },
  arid: {
    type: 2, amplitude: 0.1, sharpness: 2.9, offset: -0.01, period: 0.52, persistence: 0.5, lacunarity: 1.95, octaves: 10,
    bumpStrength: 1.0, bumpOffset: 0.004,
    ambientIntensity: 0.05, diffuseIntensity: 1.0, specularIntensity: 0.55, shininess: 10,
    colors: ['#4a2d1a', '#9a6e3f', '#c6985a', '#7c5d3f', '#ead5b0'],
    transitions: [0.08, 0.21, 0.36, 1.18],
    blends: [0.12, 0.14, 0.13, 0.2],
    atmosphere: { color: new THREE.Color('#f0bf88'), opacity: 0.15, particleCount: 2400, minPointSize: 34, maxPointSize: 72, thickness: 0.09, density: 0.06, scale: 0.38, speed: 0.03 },
    bloom: { strength: 0.12, radius: 0.45, threshold: 0.0 },
  },
  frozen: {
    type: 2, amplitude: 0.07, sharpness: 2.1, offset: -0.005, period: 0.65, persistence: 0.45, lacunarity: 1.72, octaves: 9,
    bumpStrength: 0.74, bumpOffset: 0.003,
    ambientIntensity: 0.07, diffuseIntensity: 1.08, specularIntensity: 1.45, shininess: 22,
    colors: ['#17406e', '#4f87ad', '#b6d5ea', '#eaf4fb', '#ffffff'],
    transitions: [0.07, 0.19, 0.31, 0.95],
    blends: [0.12, 0.1, 0.1, 0.12],
    atmosphere: { color: new THREE.Color('#d6f1ff'), opacity: 0.22, particleCount: 3200, minPointSize: 40, maxPointSize: 86, thickness: 0.12, density: 0.16, scale: 0.44, speed: 0.045 },
    bloom: { strength: 0.2, radius: 0.5, threshold: 0.0 },
  },
  volcanic: {
    type: 3, amplitude: 0.12, sharpness: 2.8, offset: -0.014, period: 0.5, persistence: 0.53, lacunarity: 2.0, octaves: 10,
    bumpStrength: 1.05, bumpOffset: 0.004,
    ambientIntensity: 0.04, diffuseIntensity: 1.0, specularIntensity: 0.82, shininess: 14,
    colors: ['#1e1418', '#4b2d2f', '#6f3e34', '#2b2224', '#f1772e'],
    transitions: [0.07, 0.2, 0.37, 0.72],
    blends: [0.1, 0.12, 0.1, 0.08],
    atmosphere: { color: new THREE.Color('#ff9a60'), opacity: 0.14, particleCount: 2200, minPointSize: 34, maxPointSize: 70, thickness: 0.08, density: 0.08, scale: 0.35, speed: 0.035 },
    bloom: { strength: 0.26, radius: 0.6, threshold: 0.0 },
  },
  mineral: {
    type: 2, amplitude: 0.09, sharpness: 2.5, offset: -0.009, period: 0.55, persistence: 0.5, lacunarity: 1.86, octaves: 9,
    bumpStrength: 0.88, bumpOffset: 0.004,
    ambientIntensity: 0.055, diffuseIntensity: 1.0, specularIntensity: 1.62, shininess: 24,
    colors: ['#2a4056', '#637c82', '#9a9480', '#77746a', '#d8d1bf'],
    transitions: [0.08, 0.21, 0.35, 1.03],
    blends: [0.11, 0.13, 0.11, 0.15],
    atmosphere: { color: new THREE.Color('#c9dfe8'), opacity: 0.13, particleCount: 2200, minPointSize: 32, maxPointSize: 68, thickness: 0.08, density: 0.06, scale: 0.36, speed: 0.03 },
    bloom: { strength: 0.15, radius: 0.45, threshold: 0.0 },
  },
  barren: {
    type: 2, amplitude: 0.085, sharpness: 2.6, offset: -0.012, period: 0.5, persistence: 0.5, lacunarity: 1.92, octaves: 10,
    bumpStrength: 0.92, bumpOffset: 0.004,
    ambientIntensity: 0.05, diffuseIntensity: 0.96, specularIntensity: 0.35, shininess: 8,
    colors: ['#322820', '#695444', '#8d745f', '#5f5047', '#c7b7a3'],
    transitions: [0.08, 0.22, 0.38, 1.15],
    blends: [0.12, 0.13, 0.14, 0.2],
    atmosphere: { color: new THREE.Color('#d7bda0'), opacity: 0.1, particleCount: 1800, minPointSize: 28, maxPointSize: 62, thickness: 0.07, density: 0.03, scale: 0.34, speed: 0.028 },
    bloom: { strength: 0.1, radius: 0.42, threshold: 0.0 },
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
    maxAmp+=a;
    a*=persistence;
    p/=lacunarity;
  }
  return n/max(maxAmp,0.0001);
}
float terrainHeight(int type,vec3 v,float amplitude,float sharpness,float offset,float period,float persistence,float lacunarity,int octaves,float seedOffset){
  float h=0.0;
  vec3 seeded=v+vec3(seedOffset,seedOffset*0.51,-seedOffset*0.33);
  if(type==1){
    h=amplitude*simplex3(seeded/period);
  } else if(type==2){
    h=fractal3(seeded,period,persistence,lacunarity,octaves);
    h=amplitude*pow(max(0.0,(h+1.0)/2.0),sharpness);
  } else {
    h=fractal3(seeded,period,persistence,lacunarity,octaves);
    h=amplitude*pow(max(0.0,1.0-abs(h)),sharpness);
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
uniform float seedOffset;
varying vec3 fragPosition;
varying vec3 fragNormal;
varying vec3 fragTangent;
varying vec3 fragBitangent;
varying float vHeight;
${noiseFunctions}
void main(){
  float h=terrainHeight(type,position,amplitude,sharpness,offset,period,persistence,lacunarity,octaves,seedOffset);
  vec3 pos=position*(radius+h);
  gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0);
  fragPosition=position;
  fragNormal=normal;
  fragTangent=tangent;
  fragBitangent=cross(normal,tangent);
  vHeight=h;
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
uniform float seedOffset;
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
varying float vHeight;
${noiseFunctions}
void main(){
  float h=terrainHeight(type,fragPosition,amplitude,sharpness,offset,period,persistence,lacunarity,octaves,seedOffset);
  vec3 dx=bumpOffset*fragTangent;
  vec3 dy=bumpOffset*fragBitangent;
  float hdx=terrainHeight(type,fragPosition+dx,amplitude,sharpness,offset,period,persistence,lacunarity,octaves,seedOffset);
  float hdy=terrainHeight(type,fragPosition+dy,amplitude,sharpness,offset,period,persistence,lacunarity,octaves,seedOffset);
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

export const atmosphereVertexShader = `
precision highp float;
attribute float size;
varying vec3 fragPosition;
void main(){
  gl_PointSize=size;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
  fragPosition=(modelMatrix*vec4(position,1.0)).xyz;
}`;

export const atmosphereFragmentShader = `
precision highp float;
uniform float time;
uniform float speed;
uniform float opacity;
uniform float density;
uniform float scale;
uniform vec3 lightDirection;
uniform vec3 color;
uniform sampler2D pointTexture;
varying vec3 fragPosition;
${noiseFunctions}
void main(){
  vec3 r=normalize(fragPosition);
  vec3 l=normalize(lightDirection);
  float light=max(0.05,dot(r,l));
  float n=simplex3(vec3(time*speed)+fragPosition/scale);
  float alpha=opacity*clamp(n+density,0.0,1.0);
  gl_FragColor=vec4(light*color,alpha)*texture2D(pointTexture,gl_PointCoord);
}`;

export function createPlanetBeautyUniforms(profile: PlanetVisualProfile, seed: number): PlanetBeautyUniformBundle {
  const preset = PRESETS[profile.archetype];
  const rng = new SeededRng(seed ^ 0x51ed270b);
  const hueShift = (profile.baseHue - 180) / 360;
  const seedJitter = () => rng.range(-0.06, 0.06);

  const shifted = preset.colors.map((hex) => {
    const color = new THREE.Color(hex);
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    hsl.h = (hsl.h + hueShift + profile.hueDrift / 720 + seedJitter()) % 1;
    hsl.s = clamp(hsl.s * (0.82 + profile.landSaturation / 210), 0, 1);
    hsl.l = clamp(hsl.l + (profile.landLightness - 50) / 300 + seedJitter() * 0.12, 0, 1);
    return new THREE.Color().setHSL(hsl.h < 0 ? hsl.h + 1 : hsl.h, hsl.s, hsl.l);
  }) as [THREE.Color, THREE.Color, THREE.Color, THREE.Color, THREE.Color];

  const atmosphereColor = preset.atmosphere.color.clone().offsetHSL(
    (profile.accentHue - profile.baseHue) / 720,
    (profile.oceanSaturation - 50) / 500,
    (profile.atmosphereLightness - 70) / 300,
  );

  return {
    uniforms: {
      type: { value: preset.type },
      radius: { value: 1.0 },
      amplitude: { value: clamp(preset.amplitude + profile.reliefStrength * 0.18 + seedJitter() * 0.02, 0.03, 0.16) },
      sharpness: { value: clamp(preset.sharpness + (profile.reliefSharpness - 1.4) * 0.55, 1.2, 3.3) },
      offset: { value: preset.offset + profile.macroBias * 0.06 + seedJitter() * 0.01 },
      period: { value: clamp(preset.period + (profile.continentScale - 2.2) * 0.09, 0.35, 0.95) },
      persistence: { value: clamp(preset.persistence + seedJitter() * 0.03, 0.38, 0.62) },
      lacunarity: { value: clamp(preset.lacunarity + (profile.ridgeScale - 8) * 0.01 + seedJitter() * 0.08, 1.55, 2.2) },
      octaves: { value: preset.octaves },
      bumpStrength: { value: clamp(preset.bumpStrength + profile.ridgeWeight * 0.4 - profile.roughness * 0.2, 0.45, 1.3) },
      bumpOffset: { value: clamp(preset.bumpOffset + profile.craterWeight * 0.004, 0.002, 0.008) },
      ambientIntensity: { value: preset.ambientIntensity },
      diffuseIntensity: { value: preset.diffuseIntensity },
      specularIntensity: { value: clamp(preset.specularIntensity + profile.metalness * 1.8 - profile.roughness * 0.6, 0.2, 2.6) },
      shininess: { value: clamp(preset.shininess + profile.metalness * 30, 6, 40) },
      lightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
      lightColor: { value: new THREE.Color('#fff8ef').multiplyScalar(clamp(profile.lightIntensity, 0.8, 2.0)) },
      color1: { value: shifted[0] },
      color2: { value: shifted[1] },
      color3: { value: shifted[2] },
      color4: { value: shifted[3] },
      color5: { value: shifted[4] },
      transition2: { value: preset.transitions[0] + profile.oceanLevel * 0.08 },
      transition3: { value: preset.transitions[1] + profile.humidityStrength * 0.05 },
      transition4: { value: preset.transitions[2] + profile.polarWeight * 0.08 },
      transition5: { value: preset.transitions[3] },
      blend12: { value: preset.blends[0] },
      blend23: { value: preset.blends[1] },
      blend34: { value: preset.blends[2] },
      blend45: { value: preset.blends[3] },
      seedOffset: { value: (seed % 100000) / 1000 },
      uDebugView: { value: 0 },
    },
    atmosphere: {
      ...preset.atmosphere,
      color: atmosphereColor,
      opacity: clamp(preset.atmosphere.opacity + profile.humidityStrength * 0.12, 0.06, 0.3),
      density: clamp(preset.atmosphere.density + profile.polarWeight * 0.08, 0.0, 0.35),
    },
    bloom: preset.bloom,
  };
}

export function createAtmosphereSpriteTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture();

  const gradient = ctx.createRadialGradient(64, 64, 6, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,255,255,1.0)');
  gradient.addColorStop(0.3, 'rgba(255,255,255,0.58)');
  gradient.addColorStop(1, 'rgba(255,255,255,0.0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
