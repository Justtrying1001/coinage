import type { BuildingType } from '@/game/city/data/cityBuildings';
import type { CityLayoutTemplate } from '@/game/city/data/cityLayout';
import type { CitySlotDefinition, CitySlotId } from '@/game/city/data/citySlots';
import type { CityTheme, CityThemeId } from '@/game/city/themes/cityThemePresets';

export interface PlacedBuilding {
  slotId: CitySlotId;
  buildingType: BuildingType;
  level: number;
}

export type CityInteractionTarget =
  | { type: 'none' }
  | { type: 'slot'; slotId: CitySlotId }
  | { type: 'building'; slotId: CitySlotId };

export interface CityViewModel {
  cityId: string;
  planetId: string;
  cityTheme: CityTheme;
  cityThemeId: CityThemeId;
  layout: CityLayoutTemplate;
  placedBuildings: Record<CitySlotId, PlacedBuilding | undefined>;
  selectableSlots: CitySlotId[];
  selectedTarget: CityInteractionTarget;
}

export function createCityViewModel(input: {
  cityId: string;
  planetId: string;
  theme: CityTheme;
  layout: CityLayoutTemplate;
}): CityViewModel {
  const placed = Object.fromEntries(input.layout.slots.map((slot) => [slot.id, undefined])) as Record<CitySlotId, PlacedBuilding | undefined>;
  placed['slot-hq-core'] = { slotId: 'slot-hq-core', buildingType: 'hq', level: 1 };

  return {
    cityId: input.cityId,
    planetId: input.planetId,
    cityTheme: input.theme,
    cityThemeId: input.theme.id,
    layout: input.layout,
    placedBuildings: placed,
    selectableSlots: input.layout.slots.filter((slot) => !slot.startsLocked).map((slot) => slot.id),
    selectedTarget: { type: 'none' },
  };
}

export function getSlotById(layout: CityLayoutTemplate, slotId: CitySlotId): CitySlotDefinition {
  const found = layout.slots.find((slot) => slot.id === slotId);
  if (!found) {
    throw new Error(`Unknown city slot id: ${slotId}`);
  }
  return found;
}
