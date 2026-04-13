import type { RenderMode, SelectedPlanetRef } from '@/game/render/types';

import type { CityBiomeContext } from '@/game/city/runtime/CityBiomeContext';

export interface ModeContext {
  host: HTMLDivElement;
  onSelectPlanet: (planet: SelectedPlanetRef) => void;
  onRequestMode: (mode: RenderMode) => void;
  onEnterCity: (settlementId: string, context?: CityBiomeContext) => void;
}

export interface RenderModeController {
  readonly id: RenderMode;
  mount(): void;
  resize(width: number, height: number): void;
  update(deltaMs: number): void;
  destroy(): void;
}
