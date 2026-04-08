import * as THREE from 'three';

import { createPlanetViewProfile } from '@/domain/world/generate-planet-visual-profile';
import type { PlanetRenderInput, PlanetRenderInstance } from './types';
import { buildDisplacedSphereGeometry } from './build-displaced-sphere';
import {
  SURFACE_FRAGMENT_SHADER_PLANET,
  SURFACE_VERTEX_SHADER_PLANET,
} from './surface/surface-shader-assembly';
import { getFamilyGradients } from './core/planet-core-xeno';

function toColor(value: [number, number, number]): THREE.Color {
  return new THREE.Color(value[0], value[1], value[2]);
}

function createSurfaceLayer(
  planetRadius: number,
  render: PlanetRenderInput['planet']['render'],
  segments: number,
): THREE.Mesh {
  const built = buildDisplacedSphereGeometry({
    radius: planetRadius,
    segments,
    seed: render.surface.noiseSeed,
    oceanLevel: render.surface.oceanLevel,
    reliefAmplitude: render.surface.reliefAmplitude,
    family: render.family,
  });

  const gradients = getFamilyGradients(render.family);
  const maxStops = 6;
  const landStops = [...gradients.land];
  const depthStops = [...gradients.depth];
  while (landStops.length < maxStops) landStops.push({ anchor: 1, color: landStops[landStops.length - 1].color });
  while (depthStops.length < maxStops) depthStops.push({ anchor: 1, color: depthStops[depthStops.length - 1].color });

  const material = new THREE.ShaderMaterial({
    vertexShader: SURFACE_VERTEX_SHADER_PLANET,
    fragmentShader: SURFACE_FRAGMENT_SHADER_PLANET,
    uniforms: {
      uMinMax: { value: new THREE.Vector2(built.minMax.min, built.minMax.max) },
      uSeaLevel: { value: 1.0 },
      uLightDirection: { value: new THREE.Vector3(0.38, 0.76, 0.52).normalize() },
      uLandGradientSize: { value: gradients.land.length },
      uDepthGradientSize: { value: gradients.depth.length },
      uLandGradient: { value: landStops.map((s) => ({ anchor: s.anchor, color: toColor(s.color) })) },
      uDepthGradient: { value: depthStops.map((s) => ({ anchor: s.anchor, color: toColor(s.color) })) },
    },
  });

  const mesh = new THREE.Mesh(built.geometry, material);
  mesh.name = 'surface';
  mesh.userData.rotationSpeed = render.surfaceModel === 'gaseous' ? 0.01 : 0.016;
  return mesh;
}

function createCloudLayer(
  name: 'clouds-low' | 'clouds-high',
  planetRadius: number,
  render: PlanetRenderInput['planet']['render'],
  segments: number,
  scaleFactor: number,
  speedFactor: number,
): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(planetRadius * scaleFactor, segments, segments);

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uCloudColor: { value: toColor(render.clouds.color) },
      uCoverage: { value: Math.min(0.92, Math.max(0.18, render.clouds.coverage)) },
      uOpacity: { value: name === 'clouds-low' ? 0.22 : 0.12 },
      uSeed: { value: render.clouds.noiseSeed + (name === 'clouds-low' ? 0 : 921) },
      uTime: { value: 0 },
      uSpeed: { value: speedFactor },
      uBanding: { value: render.surface.bandingStrength },
      uLightDirection: { value: new THREE.Vector3(0.38, 0.76, 0.52).normalize() },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      varying vec3 vNormalW;
      varying vec3 vUnitPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vUnitPos = normalize(position);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      varying vec3 vWorldPos;
      varying vec3 vNormalW;
      varying vec3 vUnitPos;

      uniform vec3 uCloudColor;
      uniform float uCoverage;
      uniform float uOpacity;
      uniform float uSeed;
      uniform float uTime;
      uniform float uSpeed;
      uniform float uBanding;
      uniform vec3 uLightDirection;

      float hash(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7))) * 43758.5453); }
      float noise(vec3 p){
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f*f*(3.0-2.0*f);
        float n000 = hash(i + vec3(0,0,0));
        float n100 = hash(i + vec3(1,0,0));
        float n010 = hash(i + vec3(0,1,0));
        float n110 = hash(i + vec3(1,1,0));
        float n001 = hash(i + vec3(0,0,1));
        float n101 = hash(i + vec3(1,0,1));
        float n011 = hash(i + vec3(0,1,1));
        float n111 = hash(i + vec3(1,1,1));
        float nx00 = mix(n000, n100, f.x);
        float nx10 = mix(n010, n110, f.x);
        float nx01 = mix(n001, n101, f.x);
        float nx11 = mix(n011, n111, f.x);
        float nxy0 = mix(nx00, nx10, f.y);
        float nxy1 = mix(nx01, nx11, f.y);
        return mix(nxy0, nxy1, f.z);
      }

      void main() {
        float bands = sin((vUnitPos.y + uSeed * 0.0001) * (12.0 + uBanding * 24.0)) * 0.5 + 0.5;
        vec3 flow = vec3(uTime * uSpeed, 0.0, -uTime * uSpeed * 0.7);
        vec3 p = vUnitPos * (5.4 + uBanding * 4.0) + flow + uSeed * 0.0001;
        float macro = noise(p);
        float detail = noise(p * 2.0 + vec3(1.3, -0.7, 2.1));
        float n = macro * 0.72 + detail * 0.28;
        n = mix(n, n * 0.9 + bands * 0.1, uBanding * 0.4);

        float alpha = smoothstep(1.0 - uCoverage, 1.0, n) * uOpacity;
        vec3 normal = normalize(vNormalW);
        float light = max(dot(normal, normalize(uLightDirection)), 0.0);
        float rim = pow(1.0 - max(dot(normal, normalize(cameraPosition - vWorldPos)), 0.0), 3.4) * 0.12;
        vec3 col = uCloudColor * (0.26 + light * 0.56 + rim);
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.userData.rotationSpeed = Math.max(0.0025, render.clouds.speed * speedFactor * 0.5);
  return mesh;
}

function createAtmosphereLayer(
  planetRadius: number,
  render: PlanetRenderInput['planet']['render'],
  segments: number,
): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(planetRadius * (1 + Math.max(0.05, render.atmosphere.thickness + 0.028)), segments, segments);

  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uAtmosphereColor: { value: toColor(render.atmosphere.color) },
      uDensity: { value: Math.max(0.12, Math.min(0.46, render.atmosphere.density * 0.55)) },
      uRimStrength: { value: Math.max(0.2, Math.min(0.58, render.atmosphere.rimStrength * 0.6)) },
      uLightDirection: { value: new THREE.Vector3(0.38, 0.76, 0.52).normalize() },
    },
    vertexShader: `
      varying vec3 vNormalW;
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      varying vec3 vNormalW;
      varying vec3 vWorldPos;

      uniform vec3 uAtmosphereColor;
      uniform float uDensity;
      uniform float uRimStrength;
      uniform vec3 uLightDirection;

      void main() {
        vec3 normal = normalize(vNormalW);
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.1);
        float sun = max(dot(normal, normalize(uLightDirection)), 0.0);
        float alpha = clamp(fresnel * uRimStrength * (0.38 + sun * 0.24) * uDensity, 0.0, 0.32);
        gl_FragColor = vec4(uAtmosphereColor, alpha);
      }
    `,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'atmosphere';
  mesh.userData.rotationSpeed = 0;
  return mesh;
}

function createRingLayer(render: PlanetRenderInput['planet']['render'], segments: number): THREE.Mesh {
  const geometry = new THREE.RingGeometry(render.rings.innerRadius, render.rings.outerRadius, segments, 1);
  const material = new THREE.MeshBasicMaterial({
    color: toColor(render.rings.color),
    transparent: true,
    opacity: Math.min(0.35, render.rings.opacity * 0.6),
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const ring = new THREE.Mesh(geometry, material);
  ring.name = 'rings';
  ring.rotation.x = Math.PI / 2 + render.rings.tilt;
  ring.userData.rotationSpeed = 0.008;
  return ring;
}

function shouldRenderLayer(
  layer: 'surface' | 'clouds' | 'atmosphere' | 'rings',
  debug: NonNullable<PlanetRenderInput['options']['debug']> | undefined,
): boolean {
  if (!debug) return true;
  const toggles = {
    surface: debug.surfaceOnly,
    clouds: debug.cloudsOnly,
    atmosphere: debug.atmosphereOnly,
    rings: debug.ringsOnly,
  };

  const enabledExclusive = Object.values(toggles).some(Boolean);
  if (!enabledExclusive) return true;
  return Boolean(toggles[layer]);
}

export function updatePlanetLighting(object: THREE.Object3D, lightDirection: THREE.Vector3): void {
  const dir = lightDirection.clone().normalize();
  object.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    const material = node.material;
    if (material instanceof THREE.ShaderMaterial && material.uniforms.uLightDirection) {
      material.uniforms.uLightDirection.value.copy(dir);
    }
  });
}

export function updatePlanetLayerAnimation(object: THREE.Object3D, deltaSeconds: number, freezeRotation = false): void {
  if (freezeRotation) return;

  object.traverse((node) => {
    const speed = typeof node.userData.rotationSpeed === 'number' ? node.userData.rotationSpeed : 0;
    if (speed !== 0 && node instanceof THREE.Mesh) {
      node.rotation.y += speed * deltaSeconds;
    }
    if (node instanceof THREE.Mesh && node.material instanceof THREE.ShaderMaterial) {
      const timeUniform = node.material.uniforms.uTime;
      if (timeUniform) timeUniform.value += deltaSeconds;
    }
  });
}

export function createPlanetRenderInstance(input: PlanetRenderInput): PlanetRenderInstance {
  const { planet, x, y, z, options } = input;
  const view = createPlanetViewProfile(options.viewMode);

  const group = new THREE.Group();
  group.position.set(x, y, z);

  const surface = createSurfaceLayer(
    planet.render.renderRadius,
    planet.render,
    view.meshSegments,
  );
  group.add(surface);

  const disposeTargets: Array<THREE.BufferGeometry | THREE.Material | THREE.Material[]> = [surface.geometry, surface.material];

  if (view.enableClouds && planet.render.clouds.enabled && shouldRenderLayer('clouds', options.debug)) {
    const lowClouds = createCloudLayer('clouds-low', planet.render.renderRadius, planet.render, Math.max(56, Math.floor(view.cloudSegments)), 1.02, 0.016);
    const highClouds = createCloudLayer('clouds-high', planet.render.renderRadius, planet.render, Math.max(44, Math.floor(view.cloudSegments * 0.6)), 1.035, 0.022);
    group.add(lowClouds);
    group.add(highClouds);
    disposeTargets.push(lowClouds.geometry, lowClouds.material, highClouds.geometry, highClouds.material);
  }

  if (view.enableAtmosphere && planet.render.atmosphere.enabled && shouldRenderLayer('atmosphere', options.debug)) {
    const atmosphere = createAtmosphereLayer(planet.render.renderRadius, planet.render, Math.max(72, Math.floor(view.atmosphereSegments)));
    group.add(atmosphere);
    disposeTargets.push(atmosphere.geometry, atmosphere.material);
  }

  if (view.enableRings && planet.render.rings.enabled && shouldRenderLayer('rings', options.debug)) {
    const rings = createRingLayer(planet.render, view.ringSegments);
    group.add(rings);
    disposeTargets.push(rings.geometry, rings.material);
  }

  group.rotation.z = planet.visualDNA.rotation.axialTilt;

  return {
    object: group,
    debugSnapshot: {
      planetId: planet.identity.planetId,
      seed: planet.identity.planetSeed,
      family: planet.identity.family,
      radiusClass: planet.identity.radiusClass,
      physicalRadius: planet.generated.physicalRadius,
      renderRadiusBase: planet.render.scale.renderRadiusBase,
      finalMeshScale:
        options.viewMode === 'galaxy' ? planet.render.scale.galaxyViewScaleMultiplier : planet.render.scale.planetViewScaleMultiplier,
      atmosphereThickness: planet.render.atmosphere.thickness,
      cloudCoverage: planet.render.clouds.coverage,
      hasRings: planet.render.rings.enabled,
      paletteId: planet.visualDNA.paletteId,
      activeNoiseFamilies: planet.render.debug.activeNoiseFamilies,
      currentViewMode: view.viewMode,
      currentLOD: view.lod,
    },
    dispose: () => {
      for (const target of disposeTargets) {
        if (Array.isArray(target)) target.forEach((m) => m.dispose());
        else target.dispose();
      }
    },
  };
}
