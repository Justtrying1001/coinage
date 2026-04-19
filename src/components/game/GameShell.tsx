'use client';

import { useMemo, useState } from 'react';
import { GameRenderViewport } from '@/components/game/GameRenderViewport';
import type { RenderMode, SelectedPlanetRef } from '@/game/render/types';
import { generateGalaxyData, selectPrimaryPlanet } from '@/game/world/galaxyGenerator';

export function GameShell() {
  const initialSelectedPlanet = useMemo<SelectedPlanetRef>(() => {
    const galaxy = generateGalaxyData({ seed: 78231, width: 12000, height: 8000, nodeCount: 560 });
    return selectPrimaryPlanet(galaxy);
  }, []);

  const [mode, setMode] = useState<RenderMode>('galaxy2d');
  const [selectedPlanet, setSelectedPlanet] = useState<SelectedPlanetRef>(initialSelectedPlanet);
  const modeButtons: Array<{ mode: RenderMode; label: string; glyph: string }> = [
    { mode: 'galaxy2d', label: 'Galaxy', glyph: 'GX' },
    { mode: 'planet3d', label: 'Planet', glyph: 'PL' },
    { mode: 'city3d', label: 'City', glyph: 'CT' },
  ];

  return (
    <main className="game-root">
      {mode !== 'city3d' ? (
        <header className="game-shared-hud">
          <div className="city-stitch__hud-frame game-shared-hud__frame">
            <section className="city-stitch__hud-segment city-stitch__hud-segment--switch">
              {modeButtons.map((entry) => (
                <button
                  key={entry.mode}
                  type="button"
                  className={`city-stitch__top-btn${mode === entry.mode ? ' is-active' : ''}`}
                  onClick={() => setMode(entry.mode)}
                  aria-label={`Open ${entry.label} view`}
                >
                  <span className="city-stitch__top-btn-glyph">{entry.glyph}</span>
                  <span className="city-stitch__top-btn-label">{entry.label}</span>
                </button>
              ))}
            </section>
            <section className="city-stitch__hud-segment city-stitch__hud-segment--brand">
              <p className="city-stitch__overline">Sector command</p>
              <p className="city-stitch__logo">COINAGE</p>
              <p className="city-stitch__hud-muted">Exploration shell</p>
            </section>
            <section className="city-stitch__hud-segment city-stitch__hud-segment--context">
              <p className="city-stitch__overline">Local context</p>
              <p className="city-stitch__hud-context-title">{mode === 'galaxy2d' ? 'Galaxy scan' : 'Planet survey'}</p>
              <p className="city-stitch__hud-muted">Planet {selectedPlanet.id} · Seed {selectedPlanet.seed}</p>
            </section>
            <section className="city-stitch__hud-segment city-stitch__hud-segment--resources game-shared-hud__placeholder">
              <p className="city-stitch__queue-line">Resource telemetry available in city view.</p>
            </section>
            <section className="city-stitch__hud-segment city-stitch__hud-segment--queue game-shared-hud__placeholder">
              <p className="city-stitch__queue-title">Primary activity</p>
              <p className="city-stitch__queue-line">{mode === 'galaxy2d' ? 'Navigation sweep active' : 'Terrain rendering active'}</p>
            </section>
          </div>
        </header>
      ) : null}
      <section className="game-canvas-shell">
        <GameRenderViewport mode={mode} selectedPlanet={selectedPlanet} onSelectedPlanetChange={setSelectedPlanet} />
      </section>
    </main>
  );
}
