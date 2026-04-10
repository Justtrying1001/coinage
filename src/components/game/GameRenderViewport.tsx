'use client';

import { useEffect, useRef } from 'react';
import { CoinageRenderApp } from '@/game/app/CoinageRenderApp';
import type { RenderMode } from '@/game/render/types';

interface GameRenderViewportProps {
  mode: RenderMode;
}

export function GameRenderViewport({ mode }: GameRenderViewportProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<CoinageRenderApp | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const app = new CoinageRenderApp(root, {
      seed: 78231,
      galaxyWidth: 18000,
      galaxyHeight: 12000,
      planetCount: 560,
      initialMode: 'galaxy2d',
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

  return <div ref={rootRef} className="render-root" aria-label="Coinage rendering viewport" />;
}
