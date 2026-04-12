export type CityThemeId = 'frozen' | 'neutral';

export interface CityTheme {
  id: CityThemeId;
  displayName: string;
  clearColor: number;
  horizonColor: number;
  fogColor: number;
  fogNear: number;
  fogFar: number;
  terrainLowColor: number;
  terrainMidColor: number;
  terrainHighColor: number;
  terrainShadowColor: number;
  terrainSpecularColor: number;
  padColor: number;
  padTrimColor: number;
  foundationColor: number;
  metalColor: number;
  emissiveAccent: number;
  ambientLightColor: number;
  ambientLightIntensity: number;
  directionalLightColor: number;
  directionalLightIntensity: number;
  rimLightColor: number;
  rimLightIntensity: number;
  accentColor: number;
  cameraDistance: number;
  cameraHeight: number;
  cameraLookAtY: number;
}

export const CITY_THEME_PRESETS: Record<CityThemeId, CityTheme> = {
  frozen: {
    id: 'frozen',
    displayName: 'Frozen Colony',
    clearColor: 0x040a12,
    horizonColor: 0x1c3048,
    fogColor: 0x1f3346,
    fogNear: 18,
    fogFar: 90,
    terrainLowColor: 0x5f748a,
    terrainMidColor: 0x93adc3,
    terrainHighColor: 0xddeefe,
    terrainShadowColor: 0x415262,
    terrainSpecularColor: 0xcbe8ff,
    padColor: 0x7f99ad,
    padTrimColor: 0xe8f5ff,
    foundationColor: 0x657d92,
    metalColor: 0x8ea5b7,
    emissiveAccent: 0x9ce8ff,
    ambientLightColor: 0x88b8df,
    ambientLightIntensity: 0.66,
    directionalLightColor: 0xe4f4ff,
    directionalLightIntensity: 1.42,
    rimLightColor: 0x78c9ff,
    rimLightIntensity: 0.52,
    accentColor: 0x8adfff,
    cameraDistance: 30,
    cameraHeight: 17,
    cameraLookAtY: 2.4,
  },
  neutral: {
    id: 'neutral',
    displayName: 'Standard Colony',
    clearColor: 0x070d16,
    horizonColor: 0x1f2731,
    fogColor: 0x273442,
    fogNear: 22,
    fogFar: 98,
    terrainLowColor: 0x566373,
    terrainMidColor: 0x7f90a1,
    terrainHighColor: 0xbbc9d7,
    terrainShadowColor: 0x3f4954,
    terrainSpecularColor: 0xa9bbcd,
    padColor: 0x8394a4,
    padTrimColor: 0xd8e8f7,
    foundationColor: 0x60707f,
    metalColor: 0x90a0b1,
    emissiveAccent: 0x8fd1ff,
    ambientLightColor: 0xb8cad8,
    ambientLightIntensity: 0.62,
    directionalLightColor: 0xecf5ff,
    directionalLightIntensity: 1.22,
    rimLightColor: 0x69b2e2,
    rimLightIntensity: 0.34,
    accentColor: 0x8dbbe0,
    cameraDistance: 29,
    cameraHeight: 16,
    cameraLookAtY: 2.25,
  },
};
