'use client';

import { useState } from 'react';
import { PixiGameViewport } from '@/components/game/PixiGameViewport';
import { GameRenderViewport } from '@/components/game/GameRenderViewport';
import type { RenderMode } from '@/game/render/types';

export function GameShell() {
  const [renderer, setRenderer] = useState<'legacy' | 'new'>('legacy');
  const [mode, setMode] = useState<RenderMode>('galaxy2d');

  return (
    <main className="game-root">
      <header className="game-header">
        <div>
          <p className="game-overline">Map View // World Seed Active</p>
          <h1>Coinage</h1>
        </div>
        <div className="game-render-switches">
          <button type="button" className={renderer === 'legacy' ? 'is-active' : ''} onClick={() => setRenderer('legacy')}>
            Legacy Pixi
          </button>
          <button type="button" className={renderer === 'new' ? 'is-active' : ''} onClick={() => setRenderer('new')}>
            New Render
          </button>
          {renderer === 'new' ? (
            <>
              <button type="button" className={mode === 'galaxy2d' ? 'is-active' : ''} onClick={() => setMode('galaxy2d')}>
                Galaxy 2D
              </button>
              <button type="button" className={mode === 'planet3d' ? 'is-active' : ''} onClick={() => setMode('planet3d')}>
                Planet 3D
              </button>
            </>
          ) : null}
        </div>
      </header>
      <section className="game-canvas-shell">{renderer === 'legacy' ? <PixiGameViewport /> : <GameRenderViewport mode={mode} />}</section>
    </main>
  );
}
