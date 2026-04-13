import * as THREE from 'three';
import { planetProfileFromSeed } from '@/game/world/galaxyGenerator';
import { createPlanetGenerationConfig } from '@/game/planet/presets/archetypes';
import type { GradientStop } from '@/game/planet/types';
import type { CityTerrainInput } from '@/game/render/modes/terrain/CityTerrainTypes';

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function colorAt(stops: GradientStop[], t: number) {
  if (stops.length === 0) return new THREE.Color('#888888');
  if (stops.length === 1) return new THREE.Color(stops[0].color[0], stops[0].color[1], stops[0].color[2]);
  const clamped = clamp(t, 0, 1);
  let prev = stops[0];
  for (let i = 1; i < stops.length; i += 1) {
    const next = stops[i];
    if (clamped <= next.anchor) {
      const local = clamp((clamped - prev.anchor) / ((next.anchor - prev.anchor) || 1), 0, 1);
      return new THREE.Color(
        lerp(prev.color[0], next.color[0], local),
        lerp(prev.color[1], next.color[1], local),
        lerp(prev.color[2], next.color[2], local),
      );
    }
    prev = next;
  }
  return new THREE.Color(prev.color[0], prev.color[1], prev.color[2]);
}

export function createCityTerrainInput(seed: number): CityTerrainInput {
  const visual = planetProfileFromSeed(seed);
  const planet = createPlanetGenerationConfig(seed, visual);

  const low = colorAt(planet.elevationGradient, 0.12);
  const high = colorAt(planet.elevationGradient, 0.78);
  const cliff = colorAt(planet.elevationGradient, 0.52).clone().multiplyScalar(0.8);
  const accent = new THREE.Color(...planet.material.canopyTint);
  const fog = colorAt(planet.depthGradient, 0.72).lerp(new THREE.Color(0.7, 0.75, 0.8), 0.35);
  const sky = fog.clone().lerp(new THREE.Color(0.45, 0.55, 0.65), 0.22);
  const water = colorAt(planet.depthGradient, 0.44);

  const frozen = visual.archetype === 'frozen' ? 1 : clamp((0.45 - planet.material.wetness) + visual.polarWeight, 0, 1);
  const thermal = visual.archetype === 'volcanic' ? clamp(0.55 + visual.emissiveIntensity * 2.4, 0, 1) : clamp(visual.emissiveIntensity * 1.5, 0, 1);
  const minerality = clamp(visual.metalness * 1.7 + (visual.archetype === 'mineral' ? 0.45 : 0), 0, 1);
  const theta = ((seed >>> 8) % 360) * (Math.PI / 180);
  const coastDirX = Math.cos(theta);
  const coastDirZ = Math.sin(theta);
  const coastBias = clamp((visual.oceanLevel - 0.34) * 0.9 + (visual.archetype === 'oceanic' ? 0.24 : 0), -0.2, 0.55);

  return {
    seed,
    archetype: visual.archetype,
    visual,
    planet,
    palettes: { low, high, cliff, accent, fog, sky, water },
    climate: {
      humidity: clamp(planet.material.wetness, 0, 1),
      oceanLevel: clamp(visual.oceanLevel, 0, 1),
      frozen,
      thermal,
      minerality,
      vegetation: clamp(planet.material.vegetationDensity, 0, 1),
    },
    shape: {
      reliefStrength: visual.reliefStrength,
      reliefSharpness: visual.reliefSharpness,
      continentScale: visual.continentScale,
      ridgeScale: visual.ridgeScale,
      craterScale: visual.craterScale,
      macroBias: visual.macroBias,
      ridgeWeight: visual.ridgeWeight,
      craterWeight: visual.craterWeight,
      polarWeight: visual.polarWeight,
      emissiveIntensity: visual.emissiveIntensity,
    },
    material: {
      roughness: planet.material.roughness,
      metalness: planet.material.metalness,
      wetness: planet.material.wetness,
      microReliefStrength: planet.material.microReliefStrength,
      microReliefScale: planet.material.microReliefScale,
      microNormalStrength: planet.material.microNormalStrength,
      microAlbedoBreakup: planet.material.microAlbedoBreakup,
    },
    local: {
      originX: (((seed >>> 2) & 1023) / 1023) * 18 - 9,
      originZ: (((seed >>> 12) & 1023) / 1023) * 18 - 9,
      coastDirX,
      coastDirZ,
      coastBias,
      playableRadiusX: 0.38 + (((seed >>> 22) & 255) / 255) * 0.08,
      playableRadiusZ: 0.3 + (((seed >>> 26) & 63) / 63) * 0.08,
      playableOffsetX: coastDirX * -0.12,
      playableOffsetZ: coastDirZ * -0.12,
    },
  };
}
