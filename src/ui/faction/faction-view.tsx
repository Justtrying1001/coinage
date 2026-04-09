'use client';

import { useMemo, useState } from 'react';
import type { City, Faction, WorldSector } from '@/domain/world/types';
import { useFactionCamera } from '@/ui/hooks/use-faction-camera';
import { FactionMapRenderer } from '@/ui/renderer/faction-map/faction-map-renderer';
import { ActionButton, ViewShell } from '@/ui/shared/view-shell';

export function FactionView({
  sector,
  faction,
  cities,
  onBackToMap,
  onOpenCity,
}: {
  sector: WorldSector;
  faction: Faction | null;
  cities: City[];
  onBackToMap: () => void;
  onOpenCity: (cityId: string) => void;
}) {
  const camera = useFactionCamera();
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(sector.citySlots[0]?.id ?? null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(cities[0]?.id ?? null);

  const selectedSlot = useMemo(() => sector.citySlots.find((slot) => slot.id === selectedSlotId) ?? null, [sector.citySlots, selectedSlotId]);
  const selectedCity = useMemo(() => cities.find((city) => city.id === selectedCityId) ?? null, [cities, selectedCityId]);

  return (
    <ViewShell
      title="Vue Faction"
      subtitle="Couche locale d’un secteur : slots, occupation, ancrages urbains et contrôle tactique."
      actions={
        <div className="flex items-center gap-2">
          <ActionButton variant="ghost" onClick={camera.zoomOut}>Zoom -</ActionButton>
          <span className="text-sm text-slate-300">{Math.round(camera.zoom * 100)}%</span>
          <ActionButton variant="ghost" onClick={camera.zoomIn}>Zoom +</ActionButton>
          <ActionButton variant="ghost" onClick={camera.recenter}>Recentrer</ActionButton>
          <ActionButton variant="ghost" onClick={onBackToMap}>Retour à la Map</ActionButton>
        </div>
      }
    >
      <div className="relative h-full overflow-hidden">
        <FactionMapRenderer
          sector={sector}
          cities={cities}
          faction={faction}
          selectedSlotId={selectedSlotId}
          selectedCityId={selectedCityId}
          zoom={camera.zoom}
          offset={camera.offset}
          cursor={camera.cursor}
          onSelectSlot={(slotId) => {
            setSelectedSlotId(slotId);
            const slotCity = cities.find((entry) => entry.slotId === slotId) ?? null;
            setSelectedCityId(slotCity?.id ?? null);
          }}
          onOpenCity={(cityId) => {
            setSelectedCityId(cityId);
            onOpenCity(cityId);
          }}
          onWheel={camera.onWheel}
          onPointerDown={camera.onPointerDown}
          onPointerMove={camera.onPointerMove}
          onPointerUp={camera.onPointerUp}
        />

        <aside className="pointer-events-none absolute right-4 top-4 w-[320px] space-y-3">
          <section className="rounded-xl border border-slate-700/60 bg-slate-950/70 p-4 shadow-xl backdrop-blur">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Zone {sector.name}</p>
            <p className="mt-2 text-sm text-slate-300">Statut : {sector.controlState}</p>
            <p className="text-sm text-slate-300">Faction : {faction ? `${faction.name} (${faction.tokenSymbol})` : 'Neutre'}</p>
            <p className="text-sm text-slate-300">Occupation : {cities.length}/{sector.citySlots.length}</p>
          </section>

          <section className="rounded-xl border border-slate-700/60 bg-slate-950/70 p-4 shadow-xl backdrop-blur">
            <h3 className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Inspecteur local</h3>
            {selectedSlot ? (
              <div className="mt-2 space-y-1.5 text-sm text-slate-200">
                <p className="font-semibold">{selectedSlot.label}</p>
                <p>Terrain : {selectedSlot.terrain}</p>
                <p>Type : {selectedSlot.isCapitalSlot ? 'Principal' : 'Standard'}</p>
                {selectedCity ? <p>Ville : {selectedCity.name}</p> : <p className="text-slate-400">Slot libre</p>}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-400">Sélectionnez un slot dans la zone.</p>
            )}
          </section>
        </aside>
      </div>
    </ViewShell>
  );
}
