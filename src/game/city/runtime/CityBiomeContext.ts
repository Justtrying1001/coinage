import type { PlanetGenerationConfig } from '@/game/planet/types';
import type { PlanetVisualProfile } from '@/game/render/types';

export interface SettlementSurfaceData {
  settlementId: string;
  radialUp: [number, number, number];
  normal: [number, number, number];
  latitude: number;
  longitude: number;
  elevation: number;
  habitability: number;
}

export interface CityBiomeContext {
  settlement: SettlementSurfaceData;
  planetProfile: PlanetVisualProfile;
  planetGenerationConfig: PlanetGenerationConfig;
}
