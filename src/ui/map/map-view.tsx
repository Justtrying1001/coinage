'use client';

import { useMemo, useState } from 'react';
import type { WorldModel, WorldSector } from '@/domain/world/types';
import { ActionButton, ViewShell } from '@/ui/shared/view-shell';

const stateTone: Record<WorldSector['controlState'], string> = {
  neutral: 'bg-slate-700 border-slate-500',
  controlled: 'bg-emerald-700 border-emerald-400',
  homeland: 'bg-cyan-700 border-cyan-300',
  contested: 'bg-rose-700 border-rose-300',
};

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
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

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
          <ActionButton variant="ghost" onClick={() => setZoom((value) => Math.max(0.7, Number((value - 0.1).toFixed(2))))}>
            Zoom -
          </ActionButton>
          <span className="text-sm text-slate-300">{Math.round(zoom * 100)}%</span>
          <ActionButton variant="ghost" onClick={() => setZoom((value) => Math.min(1.6, Number((value + 0.1).toFixed(2))))}>
            Zoom +
          </ActionButton>
          <ActionButton variant="ghost" onClick={() => setOffset({ x: 0, y: 0 })}>
            Recentrer
          </ActionButton>
          <ActionButton onClick={onEnterFactionView} disabled={!selectedSector}>
            Ouvrir Vue Faction
          </ActionButton>
        </div>
      }
    >
      <div className="grid h-full grid-cols-[1fr_320px]">
        <div className="relative overflow-hidden border-r border-slate-800">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.2),transparent_36%),radial-gradient(circle_at_80%_80%,rgba(217,70,239,0.12),transparent_35%),linear-gradient(180deg,#040814_0%,#020617_100%)]" />
          <div
            className="absolute inset-0"
            onMouseMove={(event) => {
              if (event.buttons !== 1) return;
              setOffset((prev) => ({ x: prev.x + event.movementX, y: prev.y + event.movementY }));
            }}
          >
            <div
              className="relative h-full w-full"
              style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`, transformOrigin: 'center' }}
            >
              {world.clusters.map((cluster) => (
                <div
                  key={cluster.id}
                  className="absolute rounded-full border border-slate-700/70 bg-slate-900/30 px-3 py-1 text-xs text-slate-300"
                  style={{ left: cluster.center.x + 620, top: cluster.center.y + 320 }}
                >
                  {cluster.label}
                </div>
              ))}
              {world.sectors.map((sector) => {
                const isSelected = selectedSectorId === sector.id;
                return (
                  <button
                    key={sector.id}
                    type="button"
                    className={`absolute h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 p-2 text-left text-xs transition hover:scale-105 ${stateTone[sector.controlState]} ${
                      isSelected ? 'ring-2 ring-white/90' : 'ring-0'
                    }`}
                    style={{ left: sector.position.x + 620, top: sector.position.y + 320 }}
                    onClick={() => onSelectSector(sector.id)}
                  >
                    <p className="font-semibold leading-tight">{sector.name}</p>
                    <p className="mt-1 text-[11px] opacity-90">Slots: {sector.citySlots.length}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <aside className="space-y-4 overflow-y-auto p-4">
          <section className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
            <h2 className="text-sm font-semibold">Légende territoire</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li>• Neutre: non revendiqué</li>
              <li>• Contrôlé: capturé par une faction</li>
              <li>• Principal: secteur d’ancrage du token</li>
              <li>• Contesté: conflit actif</li>
            </ul>
          </section>
          <section className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
            <h2 className="text-sm font-semibold">Inspecteur secteur</h2>
            {!selectedSector ? (
              <p className="mt-2 text-sm text-slate-400">Sélectionnez un secteur depuis la carte.</p>
            ) : (
              <div className="mt-2 space-y-2 text-sm text-slate-200">
                <p className="font-medium">{selectedSector.name}</p>
                <p>État: {selectedSector.controlState}</p>
                <p>Valeur stratégique: {selectedSector.strategicValue}</p>
                <p>Slots: {selectedSector.citySlots.length}</p>
              </div>
            )}
          </section>
        </aside>
      </div>
    </ViewShell>
  );
}
