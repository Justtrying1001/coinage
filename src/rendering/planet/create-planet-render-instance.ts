import * as THREE from 'three';

import { createPlanetViewProfile } from '@/domain/world/generate-planet-visual-profile';
import type { PlanetRenderInput, PlanetRenderInstance } from './types';
import { buildDisplacedSphereGeometry } from './build-displaced-sphere';
import {
  SURFACE_FRAGMENT_SHADER_PLANET,
  SURFACE_VERTEX_SHADER_PLANET,
} from './surface/surface-shader-assembly';
import { getFamilyGradients } from './core/planet-core-xeno';
import { resolveSeaLevelFromRange } from './shading-contract';
import { updatePlanetLayerAnimation, updatePlanetLighting } from './update-planet-runtime';

function toColor(value: [number, number, number]): THREE.Color {
  return new THREE.Color(value[0], value[1], value[2]);
}

function createSurfaceLayer(
  planetRadius: number,
  render: PlanetRenderInput['planet']['render'],
  segments: number,
  debug: PlanetRenderInput['options']['debug'] | undefined,
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
  const minElevation = Number.isFinite(built.minMax.min) ? built.minMax.min : 0.85;
  const maxElevation = Number.isFinite(built.minMax.max) ? built.minMax.max : 1.15;
  const safeMinMax =
    maxElevation > minElevation
      ? new THREE.Vector2(minElevation, maxElevation)
      : new THREE.Vector2(minElevation, minElevation + 0.2);

  if (process.env.NODE_ENV !== 'production' && Math.abs(maxElevation - minElevation) < 1e-5) {
    console.warn('[PlanetView] Degenerate elevation range, applying fallback min/max window', {
      minElevation,
      maxElevation,
      planetId: render.planetId,
      family: render.family,
    });
  }

  const { seaLevel } = resolveSeaLevelFromRange(safeMinMax.x, safeMinMax.y, render.surface.oceanLevel);

  if (process.env.NODE_ENV !== 'production') {
    if (seaLevel < safeMinMax.x || seaLevel > safeMinMax.y) {
      console.warn('[PlanetView] Sea level outside elevation range', {
        planetId: render.planetId,
        seaLevel,
        min: safeMinMax.x,
        max: safeMinMax.y,
      });
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    const elevationAttr = built.geometry.getAttribute('aUnscaledElevation');
    if (!elevationAttr || elevationAttr.count === 0) {
      console.warn('[PlanetView] Missing elevation attribute on surface geometry');
    }
  }
  const maxStops = 6;
  const landStops = [...gradients.land];
  const depthStops = [...gradients.depth];
  while (landStops.length < maxStops) landStops.push({ anchor: 1, color: landStops[landStops.length - 1].color });
  while (depthStops.length < maxStops) depthStops.push({ anchor: 1, color: depthStops[depthStops.length - 1].color });

  const material: THREE.Material = debug?.forceBasicMaterial
    ? new THREE.MeshBasicMaterial({
      color: '#52f7ff',
      wireframe: Boolean(debug?.wireframe),
    })
    : new THREE.ShaderMaterial({
      vertexShader: SURFACE_VERTEX_SHADER_PLANET,
      fragmentShader: SURFACE_FRAGMENT_SHADER_PLANET,
      wireframe: Boolean(debug?.wireframe),
      uniforms: {
        uMinMax: { value: safeMinMax },
        uSeaLevel: { value: seaLevel },
        uLightDirection: { value: new THREE.Vector3(0.38, 0.76, 0.52).normalize() },
        uAmbientStrength: { value: 0.34 },
        uLandGradientSize: { value: gradients.land.length },
        uDepthGradientSize: { value: gradients.depth.length },
        uLandAnchors: { value: landStops.map((s) => s.anchor) },
        uDepthAnchors: { value: depthStops.map((s) => s.anchor) },
        uLandColors: { value: landStops.map((s) => toColor(s.color)) },
        uDepthColors: { value: depthStops.map((s) => toColor(s.color)) },
      },
    });

  const mesh = new THREE.Mesh(built.geometry, material);
  mesh.name = 'surface';
  mesh.userData.rotationSpeed = render.surfaceModel === 'gaseous' ? 0.01 : 0.016;
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
      uDensity: { value: Math.max(0.08, Math.min(0.28, render.atmosphere.density * 0.36)) },
      uRimStrength: { value: Math.max(0.14, Math.min(0.42, render.atmosphere.rimStrength * 0.42)) },
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
        float alpha = clamp(fresnel * uRimStrength * (0.28 + sun * 0.18) * uDensity, 0.0, 0.18);
        gl_FragColor = vec4(uAtmosphereColor, alpha);
      }
    `,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'atmosphere';
  mesh.userData.rotationSpeed = 0;
  return mesh;
}

function shouldRenderLayer(
  layer: 'surface' | 'atmosphere',
  debug: NonNullable<PlanetRenderInput['options']['debug']> | undefined,
): boolean {
  if (!debug) return true;
  const toggles = {
    surface: debug.surfaceOnly,
    atmosphere: debug.atmosphereOnly,
  };

  const enabledExclusive = Object.values(toggles).some(Boolean);
  if (!enabledExclusive) return true;
  return Boolean(toggles[layer]);
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
    options.debug,
  );
  group.add(surface);

  const disposeTargets: Array<THREE.BufferGeometry | THREE.Material | THREE.Material[]> = [surface.geometry, surface.material];

  if (view.enableAtmosphere && planet.render.atmosphere.enabled && shouldRenderLayer('atmosphere', options.debug)) {
    const atmosphere = createAtmosphereLayer(planet.render.renderRadius, planet.render, Math.max(72, Math.floor(view.atmosphereSegments)));
    group.add(atmosphere);
    disposeTargets.push(atmosphere.geometry, atmosphere.material);
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
