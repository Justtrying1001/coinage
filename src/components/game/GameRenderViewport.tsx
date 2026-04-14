'use client';

import { useEffect, useRef } from 'react';
import { CoinageRenderApp } from '@/game/app/CoinageRenderApp';
import type { RenderMode, SelectedPlanetRef } from '@/game/render/types';

interface GameRenderViewportProps {
  mode: RenderMode;
  selectedPlanet: SelectedPlanetRef;
  onSelectedPlanetChange: (planet: SelectedPlanetRef) => void;
}

export function GameRenderViewport({ mode, selectedPlanet, onSelectedPlanetChange }: GameRenderViewportProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<CoinageRenderApp | null>(null);
  const initialSelectedRef = useRef<SelectedPlanetRef>(selectedPlanet);
  const onSelectedChangeRef = useRef(onSelectedPlanetChange);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const app = new CoinageRenderApp(root, {
      seed: 78231,
      galaxyWidth: 12000,
      galaxyHeight: 8000,
      planetCount: 560,
      initialMode: 'galaxy2d',
      initialSelectedPlanet: initialSelectedRef.current,
      onSelectedPlanetChange: (planet) => onSelectedChangeRef.current(planet),
    });

    app.mount();
    appRef.current = app;

    return () => {
      app.destroy();
      appRef.current = null;
    };
  }, []);

  useEffect(() => {
    appRef.current?.setMode(mode);
  }, [mode]);

  useEffect(() => {
    onSelectedChangeRef.current = onSelectedPlanetChange;
  }, [onSelectedPlanetChange]);

  useEffect(() => {
    appRef.current?.setSelectedPlanet(selectedPlanet);
  }, [selectedPlanet]);

  return <div ref={rootRef} className="render-root" aria-label="Coinage rendering viewport" />;
}
