import type { RenderMode, SelectedPlanetRef } from '@/game/render/types';
import type { CityEntryPayload } from '@/game/city/terrain/CityBiomeContext';

export interface ModeContext {
  host: HTMLDivElement;
  onSelectPlanet: (planet: SelectedPlanetRef) => void;
  onRequestMode: (mode: RenderMode) => void;
  onEnterCity: (payload: CityEntryPayload) => void;
}

export interface RenderModeController {
  readonly id: RenderMode;
  mount(): void;
  resize(width: number, height: number): void;
  update(deltaMs: number): void;
  destroy(): void;
}
