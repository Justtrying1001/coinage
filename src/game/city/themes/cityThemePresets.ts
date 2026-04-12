export type CityThemeId = 'frozen' | 'neutral';

export interface CityTheme {
  id: CityThemeId;
  displayName: string;
  clearColor: number;
  fogColor: number;
  fogNear: number;
  fogFar: number;
  groundColor: number;
  padColor: number;
  padEdgeColor: number;
  ambientLightColor: number;
  ambientLightIntensity: number;
  directionalLightColor: number;
  directionalLightIntensity: number;
  accentColor: number;
}

export const CITY_THEME_PRESETS: Record<CityThemeId, CityTheme> = {
  frozen: {
    id: 'frozen',
    displayName: 'Frozen Colony',
    clearColor: 0x060d16,
    fogColor: 0x112237,
    fogNear: 20,
    fogFar: 88,
    groundColor: 0x7f95ad,
    padColor: 0xa2bbcf,
    padEdgeColor: 0xd2e8ff,
    ambientLightColor: 0x8fc6ff,
    ambientLightIntensity: 0.92,
    directionalLightColor: 0xd8eeff,
    directionalLightIntensity: 1.35,
    accentColor: 0x79d5ff,
  },
  neutral: {
    id: 'neutral',
    displayName: 'Standard Colony',
    clearColor: 0x0a1018,
    fogColor: 0x17263a,
    fogNear: 26,
    fogFar: 96,
    groundColor: 0x68778a,
    padColor: 0x8fa0b5,
    padEdgeColor: 0xbfd1e8,
    ambientLightColor: 0xc1d0df,
    ambientLightIntensity: 0.78,
    directionalLightColor: 0xe6f1ff,
    directionalLightIntensity: 1.12,
    accentColor: 0x78b8df,
  },
};
