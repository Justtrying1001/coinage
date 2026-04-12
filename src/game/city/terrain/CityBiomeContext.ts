import { Vector3 } from 'three';
import { createPlanetGenerationConfig } from '@/game/planet/presets/archetypes';
import type { PlanetGenerationConfig } from '@/game/planet/types';
import type { SettlementSlot } from '@/game/planet/runtime/SettlementSlots';
import type { PlanetVisualProfile } from '@/game/render/types';
import { planetProfileFromSeed } from '@/game/world/galaxyGenerator';

export interface CitySettlementSurfaceData {
  id: string;
  position: [number, number, number];
  normal: [number, number, number];
  elevation: number;
  latitude: number;
  longitude: number;
  habitability: number;
}

export interface CityBiomeContext {
  planetId: string;
  planetSeed: number;
  settlementId: string | null;
  planetProfile: PlanetVisualProfile;
  planetGenerationConfig: PlanetGenerationConfig;
  settlementSurfacePosition: [number, number, number];
  settlementSurfaceNormal: [number, number, number];
  settlementElevation: number;
  settlementLatLong: { latitude: number; longitude: number };
  settlementHabitability: number;
  archetype: PlanetVisualProfile['archetype'];
}

export interface CityEntryPayload {
  settlementId: string;
  settlementSurface: CitySettlementSurfaceData;
  planetProfile: PlanetVisualProfile;
  planetGenerationConfig: PlanetGenerationConfig;
}

export function toCitySettlementSurfaceData(slot: SettlementSlot): CitySettlementSurfaceData {
  return {
    id: slot.id,
    position: slot.position.toArray() as [number, number, number],
    normal: slot.normal.toArray() as [number, number, number],
    elevation: slot.elevation,
    latitude: slot.latitude,
    longitude: slot.longitude,
    habitability: slot.habitability,
  };
}

export function createCityBiomeContext(input: {
  planetId: string;
  planetSeed: number;
  settlementId?: string | null;
  entry?: CityEntryPayload | null;
}): CityBiomeContext {
  const profile = input.entry?.planetProfile ?? planetProfileFromSeed(input.planetSeed);
  const config = input.entry?.planetGenerationConfig ?? createPlanetGenerationConfig(input.planetSeed, profile);

  const fallbackNormal = new Vector3(0.35, 0.88, 0.28).normalize();
  const fallbackRadius = 1;
  const fallbackPosition = fallbackNormal.clone().multiplyScalar(fallbackRadius);

  const position = input.entry?.settlementSurface.position ?? (fallbackPosition.toArray() as [number, number, number]);
  const normal = input.entry?.settlementSurface.normal ?? (fallbackNormal.toArray() as [number, number, number]);
  const elevation = input.entry?.settlementSurface.elevation ?? 1;
  const latitude = input.entry?.settlementSurface.latitude ?? 28;
  const longitude = input.entry?.settlementSurface.longitude ?? 17;
  const habitability = input.entry?.settlementSurface.habitability ?? 0.5;

  return {
    planetId: input.planetId,
    planetSeed: input.planetSeed,
    settlementId: input.settlementId ?? input.entry?.settlementId ?? null,
    planetProfile: profile,
    planetGenerationConfig: config,
    settlementSurfacePosition: position,
    settlementSurfaceNormal: normal,
    settlementElevation: elevation,
    settlementLatLong: { latitude, longitude },
    settlementHabitability: habitability,
    archetype: profile.archetype,
  };
}
