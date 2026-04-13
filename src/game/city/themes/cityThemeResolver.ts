import type { PlanetArchetype } from '@/game/render/types';
import type { CityTheme } from '@/game/city/themes/cityThemePresets';
import { CITY_THEME_PRESETS } from '@/game/city/themes/cityThemePresets';

const THEME_BY_ARCHETYPE: Partial<Record<PlanetArchetype, keyof typeof CITY_THEME_PRESETS>> = {
  frozen: 'frozen',
  arid: 'arid',
  volcanic: 'volcanic',
  mineral: 'mineral',
  terrestrial: 'terrestrial',
  oceanic: 'oceanic',
  barren: 'barren',
  jungle: 'jungle',
};

export function resolveCityTheme(archetype: PlanetArchetype): CityTheme {
  const themeId = THEME_BY_ARCHETYPE[archetype] ?? 'neutral';
  return CITY_THEME_PRESETS[themeId];
}
