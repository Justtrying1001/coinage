'use client';

import { ThreeGameViewport } from '@/components/game/ThreeGameViewport';

export function GameShell() {
  return (
    <main className="game-root">
      <header className="game-header">
        <div>
          <p className="game-overline">Map View // World Seed Active</p>
          <h1>Coinage</h1>
        </div>
      </header>
      <section className="game-canvas-shell">
        <ThreeGameViewport />
      </section>
    </main>
  );
}
