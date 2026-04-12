export interface BuildingVisualState {
  moduleCount: number;
  verticalScale: number;
}

export function getBuildingVisualState(level: number): BuildingVisualState {
  const clamped = Math.max(1, level);
  return {
    moduleCount: Math.min(4, Math.floor((clamped - 1) / 2)),
    verticalScale: 1 + Math.min(0.42, (clamped - 1) * 0.08),
  };
}
