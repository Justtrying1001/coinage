export type CityThemeId = 'frozen' | 'neutral';

export interface CityTheme {
  id: CityThemeId;
  displayName: string;
  clearColor: number;
  skyTopColor: number;
  skyBottomColor: number;
  horizonGlowColor: number;
  fogColor: number;
  fogNear: number;
  fogFar: number;
  terrainLowColor: number;
  terrainMidColor: number;
  terrainHighColor: number;
  terrainRockColor: number;
  terrainSpecularColor: number;
  groundShadowColor: number;
  padColor: number;
  padTrimColor: number;
  metalColor: number;
  foundationColor: number;
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
    clearColor: 0x02060d,
    skyTopColor: 0x07182d,
    skyBottomColor: 0x1f3f62,
    horizonGlowColor: 0x95c3ea,
    fogColor: 0x17334e,
    fogNear: 26,
    fogFar: 112,
    terrainLowColor: 0x4c6277,
    terrainMidColor: 0x7f9ab0,
    terrainHighColor: 0xc5d9ea,
    terrainRockColor: 0x637589,
    terrainSpecularColor: 0xe8f7ff,
    groundShadowColor: 0x4e6175,
    padColor: 0x70889f,
    padTrimColor: 0xbcd8ee,
    metalColor: 0x8da1b5,
    foundationColor: 0x4f6579,
    emissiveAccent: 0x8de3ff,
    ambientLightColor: 0x8cbbe6,
    ambientLightIntensity: 0.72,
    directionalLightColor: 0xe0f0ff,
    directionalLightIntensity: 1.46,
    rimLightColor: 0x5eb4e8,
    rimLightIntensity: 0.54,
    accentColor: 0x76d7ff,
  },
  neutral: {
    id: 'neutral',
    displayName: 'Standard Colony',
    clearColor: 0x080e17,
    skyTopColor: 0x121d2c,
    skyBottomColor: 0x354960,
    horizonGlowColor: 0x7ca2c6,
    fogColor: 0x24374d,
    fogNear: 30,
    fogFar: 118,
    terrainLowColor: 0x5c6975,
    terrainMidColor: 0x7e8f9f,
    terrainHighColor: 0xb4c2cf,
    terrainRockColor: 0x5f6973,
    terrainSpecularColor: 0xd9e9f7,
    groundShadowColor: 0x5b6979,
    padColor: 0x657382,
    padTrimColor: 0xb9c8d8,
    metalColor: 0x7f8fa0,
    foundationColor: 0x4a5865,
    emissiveAccent: 0x8fd1ff,
    ambientLightColor: 0xb8cad8,
    ambientLightIntensity: 0.68,
    directionalLightColor: 0xecf5ff,
    directionalLightIntensity: 1.22,
    rimLightColor: 0x69b2e2,
    rimLightIntensity: 0.4,
    accentColor: 0x78b8df,
  },
};
