'use client';

import { useMemo } from 'react';
import type { WorldModel } from '@/domain/world/types';
import { useMapCamera } from '@/ui/hooks/use-map-camera';
import { WorldMapRenderer } from '@/ui/renderer/world-map/world-map-renderer';
import { ActionButton, ViewShell } from '@/ui/shared/view-shell';

export function MapView({
  world,
  selectedSectorId,
  onSelectSector,
  onEnterFactionView,
}: {
  world: WorldModel;
  selectedSectorId: string | null;
  onSelectSector: (sectorId: string) => void;
  onEnterFactionView: () => void;
}) {
  const camera = useMapCamera({ initialZoom: 1 });

  const selectedSector = useMemo(
    () => world.sectors.find((sector) => sector.id === selectedSectorId) ?? null,
    [selectedSectorId, world.sectors],
  );

  return (
    <ViewShell
      title="Vue Map"
      subtitle="Lecture stratégique globale des clusters, secteurs, frontières et points de conflit."
      actions={
        <div className="flex items-center gap-2">
          <ActionButton variant="ghost" onClick={camera.zoomOut}>Zoom -</ActionButton>
          <span className="text-sm text-slate-300">{Math.round(camera.zoom * 100)}%</span>
          <ActionButton variant="ghost" onClick={camera.zoomIn}>Zoom +</ActionButton>
          <ActionButton variant="ghost" onClick={camera.recenter}>Recentrer</ActionButton>
          <ActionButton onClick={onEnterFactionView} disabled={!selectedSector}>Ouvrir Vue Faction</ActionButton>
        </div>
      }
    >
      <div className="relative h-full overflow-hidden">
        <WorldMapRenderer
          world={world}
          factions={world.factions}
          selectedSectorId={selectedSectorId}
          zoom={camera.zoom}
          offset={camera.offset}
          cursor={camera.cursor}
          onSelectSector={onSelectSector}
          onWheel={camera.onWheel}
          onPointerDown={camera.onPointerDown}
          onPointerMove={camera.onPointerMove}
          onPointerUp={camera.onPointerUp}
        />

        <aside className="pointer-events-none absolute right-4 top-4 w-[290px] space-y-3">
          <section className="rounded-xl border border-slate-700/60 bg-slate-950/70 p-4 shadow-xl backdrop-blur">
            <h2 className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Légende</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-slate-300">
              <li>• Neutre : graphite</li>
              <li>• Contrôlé : couleur faction</li>
              <li>• Principal : anneau d’ancrage</li>
              <li>• Contesté : pulse d’alerte</li>
            </ul>
          </section>

          <section className="rounded-xl border border-slate-700/60 bg-slate-950/70 p-4 shadow-xl backdrop-blur">
            <h2 className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Inspecteur secteur</h2>
            {!selectedSector ? (
              <p className="mt-2 text-sm text-slate-400">Sélectionnez un territoire pour ouvrir sa télémétrie.</p>
            ) : (
              <div className="mt-2 space-y-1.5 text-sm text-slate-200">
                <p className="text-base font-semibold">{selectedSector.name}</p>
                <p>État : {selectedSector.controlState}</p>
                <p>Valeur stratégique : {selectedSector.strategicValue}</p>
                <p>Slots : {selectedSector.citySlots.length}</p>
              </div>
            )}
          </section>
        </aside>
      </div>
    </ViewShell>
  );
}
