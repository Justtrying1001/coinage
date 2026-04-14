'use client';

import { useMemo, useState } from 'react';
import { GameRenderViewport } from '@/components/game/GameRenderViewport';
import type { RenderMode, SelectedPlanetRef } from '@/game/render/types';
import { generateGalaxyData, selectPrimaryPlanet } from '@/game/world/galaxyGenerator';

export function GameShell() {
  const initialSelectedPlanet = useMemo<SelectedPlanetRef>(() => {
    const galaxy = generateGalaxyData({ seed: 78231, width: 6200, height: 4200, nodeCount: 560 });
    return selectPrimaryPlanet(galaxy);
  }, []);

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
          <button type="button" className={mode === 'galaxy2d' ? 'is-active' : ''} onClick={() => setMode('galaxy2d')}>
            Galaxy 2D
          </button>
          <button type="button" className={mode === 'planet3d' ? 'is-active' : ''} onClick={() => setMode('planet3d')}>
            Planet 3D
          </button>
          <button type="button" className={mode === 'city3d' ? 'is-active' : ''} onClick={() => setMode('city3d')}>
            City Foundation
          </button>
        </div>
      </header>
      <section className="game-canvas-shell">
        <GameRenderViewport mode={mode} selectedPlanet={selectedPlanet} onSelectedPlanetChange={setSelectedPlanet} />
      </section>
    </main>
  );
}
