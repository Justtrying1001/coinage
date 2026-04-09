'use client';

import { useEffect, useRef } from 'react';
import { CoinageGameApp } from '@/game/app/CoinageGameApp';

export function PixiGameViewport() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    const app = new CoinageGameApp(root, { seed: 78231, worldWidth: 22000, worldHeight: 14000 });
    app.mount();

    return () => {
      app.destroy();
    };
  }, []);

  return <div ref={rootRef} className="pixi-root" aria-label="Coinage map viewport" />;
}
