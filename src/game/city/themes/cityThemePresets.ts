export type CityThemeId = 'frozen' | 'neutral';

export interface CityTheme {
  id: CityThemeId;
  displayName: string;
  clearColor: number;
  fogColor: number;
  fogNear: number;
  fogFar: number;
  groundColor: number;
  groundShadowColor: number;
  padColor: number;
  padTrimColor: number;
  metalColor: number;
  emissiveAccent: number;
  ambientLightColor: number;
  ambientLightIntensity: number;
  directionalLightColor: number;
  directionalLightIntensity: number;
  rimLightColor: number;
  rimLightIntensity: number;
  accentColor: number;
}

export const CITY_THEME_PRESETS: Record<CityThemeId, CityTheme> = {
  frozen: {
    id: 'frozen',
    displayName: 'Frozen Colony',
    clearColor: 0x030910,
    fogColor: 0x112233,
    fogNear: 24,
    fogFar: 94,
    groundColor: 0x8ea5b8,
    groundShadowColor: 0x4e6175,
    padColor: 0xb9cfde,
    padTrimColor: 0xe6f4ff,
    metalColor: 0x8a9bad,
    emissiveAccent: 0x8de3ff,
    ambientLightColor: 0x88b8df,
    ambientLightIntensity: 0.76,
    directionalLightColor: 0xe0f0ff,
    directionalLightIntensity: 1.52,
    rimLightColor: 0x5eb4e8,
    rimLightIntensity: 0.46,
    accentColor: 0x76d7ff,
  },
  neutral: {
    id: 'neutral',
    displayName: 'Standard Colony',
    clearColor: 0x090f17,
    fogColor: 0x1a2a3d,
    fogNear: 28,
    fogFar: 105,
    groundColor: 0x7f8e9d,
    groundShadowColor: 0x5b6979,
    padColor: 0x9fb0c0,
    padTrimColor: 0xdce9f5,
    metalColor: 0x8593a3,
    emissiveAccent: 0x8fd1ff,
    ambientLightColor: 0xb8cad8,
    ambientLightIntensity: 0.7,
    directionalLightColor: 0xecf5ff,
    directionalLightIntensity: 1.3,
    rimLightColor: 0x69b2e2,
    rimLightIntensity: 0.34,
    accentColor: 0x78b8df,
  },
};
