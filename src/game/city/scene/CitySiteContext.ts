import { Matrix4, Vector3 } from 'three';
import type { PlanetVisualProfile } from '@/game/render/types';
import { planetProfileFromSeed } from '@/game/world/galaxyGenerator';
import { SeededRng } from '@/game/world/rng';

export interface CityBiomePalette {
  terrainLow: number;
  terrainMid: number;
  terrainHigh: number;
  rock: number;
  fog: number;
  sky: number;
  haze: number;
  emissiveAccent: number;
}

export interface CitySiteContext {
  settlementId: string;
  planetSeed: number;
  planetProfile: PlanetVisualProfile;
  biome: CityBiomePalette;
  localMatrix: Matrix4;
  localOffset: Vector3;
  siteSeed: number;
}

export function createCitySiteContext(planetSeed: number, settlementId: string | null): CitySiteContext {
  const settlementKey = settlementId ?? 'city-core';
  const hashedSettlement = hashString(settlementKey);
  const siteSeed = (planetSeed ^ hashedSettlement ^ 0x6a09e667) >>> 0;
  const profile = planetProfileFromSeed(planetSeed);
  const rng = new SeededRng(siteSeed);

  const localOffset = new Vector3(rng.range(-320, 320), 0, rng.range(-320, 320));
  const yaw = rng.range(-Math.PI, Math.PI);
  const localMatrix = new Matrix4().makeRotationY(yaw).setPosition(localOffset);

  return {
    settlementId: settlementKey,
    planetSeed,
    planetProfile: profile,
    biome: paletteForArchetype(profile.archetype),
    localMatrix,
    localOffset,
    siteSeed,
  };
}

function paletteForArchetype(archetype: PlanetVisualProfile['archetype']): CityBiomePalette {
  if (archetype === 'frozen') {
    return {
      terrainLow: 0x6f8597,
      terrainMid: 0x90a9bc,
      terrainHigh: 0xd9e8f7,
      rock: 0x495968,
      fog: 0x9dc2df,
      sky: 0x0f1a25,
      haze: 0xb7d9f2,
      emissiveAccent: 0x9be3ff,
    };
  }

  if (archetype === 'volcanic') {
    return {
      terrainLow: 0x533a34,
      terrainMid: 0x796058,
      terrainHigh: 0x9a867f,
      rock: 0x2f2521,
      fog: 0x8d6b66,
      sky: 0x140f11,
      haze: 0xb09084,
      emissiveAccent: 0xffa16f,
    };
  }

  return {
    terrainLow: 0x5f715f,
    terrainMid: 0x7e8e7c,
    terrainHigh: 0xaebba8,
    rock: 0x404d42,
    fog: 0x95aa96,
    sky: 0x0f1711,
    haze: 0xb7c8b5,
    emissiveAccent: 0x9cd5a0,
  };
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
