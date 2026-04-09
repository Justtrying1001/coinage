'use client';

import { useCallback, useMemo, useState } from 'react';

interface DragState {
  active: boolean;
  x: number;
  y: number;
}

export function useMapCamera({
  minZoom = 0.55,
  maxZoom = 2.2,
  initialZoom = 1,
}: {
  minZoom?: number;
  maxZoom?: number;
  initialZoom?: number;
} = {}) {
  const [zoom, setZoom] = useState(initialZoom);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState<DragState>({ active: false, x: 0, y: 0 });

  const clampZoom = useCallback((value: number) => Math.min(maxZoom, Math.max(minZoom, Number(value.toFixed(3)))), [maxZoom, minZoom]);

  const zoomIn = useCallback(() => setZoom((current) => clampZoom(current + 0.12)), [clampZoom]);
  const zoomOut = useCallback(() => setZoom((current) => clampZoom(current - 0.12)), [clampZoom]);
  const recenter = useCallback(() => {
    setZoom(initialZoom);
    setOffset({ x: 0, y: 0 });
  }, [initialZoom]);

  const onWheel = useCallback(
    (event: WheelEvent) => {
      event.preventDefault();
      const direction = event.deltaY > 0 ? -0.08 : 0.08;
      setZoom((current) => clampZoom(current + direction));
    },
    [clampZoom],
  );

  const onPointerDown = useCallback((event: PointerEvent) => {
    setDrag({ active: true, x: event.clientX, y: event.clientY });
  }, []);

  const onPointerMove = useCallback((event: PointerEvent) => {
    setDrag((current) => {
      if (!current.active) return current;
      const deltaX = event.clientX - current.x;
      const deltaY = event.clientY - current.y;
      setOffset((prev) => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
      return { active: true, x: event.clientX, y: event.clientY };
    });
  }, []);

  const onPointerUp = useCallback(() => {
    setDrag((current) => (current.active ? { ...current, active: false } : current));
  }, []);

  const cursor = useMemo(() => (drag.active ? 'grabbing' : 'grab'), [drag.active]);

  return {
    zoom,
    offset,
    cursor,
    zoomIn,
    zoomOut,
    recenter,
    setZoom,
    setOffset,
    onWheel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}
