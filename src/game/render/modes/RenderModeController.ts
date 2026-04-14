import type { PlanetSettlementTelemetry, RenderMode, SelectedPlanetRef } from '@/game/render/types';

export interface ModeContext {
  host: HTMLDivElement;
  onSelectPlanet: (planet: SelectedPlanetRef) => void;
  onRequestMode: (mode: RenderMode) => void;
  onPlanetTelemetry: (planetId: string, telemetry: PlanetSettlementTelemetry) => void;
}

export interface RenderModeController {
  readonly id: RenderMode;
  mount(): void;
  resize(width: number, height: number): void;
  update(deltaMs: number): void;
  destroy(): void;
}
