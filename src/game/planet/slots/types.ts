export type PlanetSlotState = 'empty';

export interface PlanetSettlementSlot {
  id: string;
  index: number;
  position: [number, number, number];
  normal: [number, number, number];
  elevation: number;
  slope: number;
  habitability: number;
  latitude: number;
  longitude: number;
  state: PlanetSlotState;
}
