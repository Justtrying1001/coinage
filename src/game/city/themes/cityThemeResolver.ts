import type { PlanetArchetype } from '@/game/render/types';
import type { CityTheme } from '@/game/city/themes/cityThemePresets';
import { CITY_THEME_PRESETS } from '@/game/city/themes/cityThemePresets';

export function resolveCityTheme(archetype: PlanetArchetype): CityTheme {
  return CITY_THEME_PRESETS[archetype];
}
