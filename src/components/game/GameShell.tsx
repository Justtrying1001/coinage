'use client';

import { useMemo, useState } from 'react';
import { PixiGameViewport } from '@/components/game/PixiGameViewport';
import { GameRenderViewport } from '@/components/game/GameRenderViewport';
import type { RenderMode, SelectedPlanetRef } from '@/game/render/types';
import { generateGalaxyData, selectPrimaryPlanet } from '@/game/world/galaxyGenerator';

export function GameShell() {
  const initialSelectedPlanet = useMemo<SelectedPlanetRef>(() => {
    const galaxy = generateGalaxyData({ seed: 78231, width: 18000, height: 12000, nodeCount: 560 });
    return selectPrimaryPlanet(galaxy);
  }, []);

  // Transitional validation toggle: new renderer is default, legacy Pixi remains as temporary fallback.
  const [renderer, setRenderer] = useState<'legacy' | 'new'>('new');
  const [mode, setMode] = useState<RenderMode>('galaxy2d');
  const [selectedPlanet, setSelectedPlanet] = useState<SelectedPlanetRef>(initialSelectedPlanet);

  return (
    <main className="game-root">
      <header className="game-header">
        <div>
          <p className="game-overline">Map View // World Seed Active</p>
          <h1>Coinage</h1>
        </div>
        <div className="game-render-switches">
          <button type="button" className={renderer === 'legacy' ? 'is-active' : ''} onClick={() => setRenderer('legacy')}>
            Legacy Pixi (Fallback)
          </button>
          <button type="button" className={renderer === 'new' ? 'is-active' : ''} onClick={() => setRenderer('new')}>
            New Renderer
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
      <section className="game-canvas-shell">
        {renderer === 'legacy' ? (
          <PixiGameViewport />
        ) : (
          <GameRenderViewport mode={mode} selectedPlanet={selectedPlanet} onSelectedPlanetChange={setSelectedPlanet} />
        )}
      </section>
    </main>
  );
}
