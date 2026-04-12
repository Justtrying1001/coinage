import type { BuildingType } from '@/game/city/data/cityBuildings';

export type CitySlotId =
  | 'slot-hq-core'
  | 'slot-econ-west'
  | 'slot-econ-east'
  | 'slot-utility-north'
  | 'slot-utility-south'
  | 'slot-mixed-northwest'
  | 'slot-mixed-southeast'
  | 'slot-future-northeast';

export type CitySlotCategory = 'hq' | 'economic' | 'utility' | 'mixed' | 'future';

export interface CitySlotDefinition {
  id: CitySlotId;
  position: { x: number; y: number; z: number };
  rotationY: number;
  category: CitySlotCategory;
  allowedBuildings: BuildingType[];
  scale?: number;
  unlockAtLevel?: number;
  startsLocked?: boolean;
}
