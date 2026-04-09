import type { City, Faction } from '@/domain/world/types';
import { ActionButton, ViewShell } from '@/ui/shared/view-shell';

export function CityView({ city, faction, onBackToFaction, onBackToMap }: { city: City; faction: Faction | null; onBackToFaction: () => void; onBackToMap: () => void }) {
  return (
    <ViewShell
      title="Vue Ville"
      subtitle="Surface de micro-gestion : ressources, bâtiments, production, défense."
      actions={
        <div className="flex items-center gap-2">
          <ActionButton variant="ghost" onClick={onBackToFaction}>Retour Vue Faction</ActionButton>
          <ActionButton variant="ghost" onClick={onBackToMap}>Retour Vue Map</ActionButton>
        </div>
      }
    >
      <div className="grid h-full grid-cols-[1.2fr_1fr_1fr] gap-4 p-4">
        <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Capitale urbaine</p>
          <h2 className="text-2xl font-semibold">{city.name}</h2>
          <p className="text-sm text-slate-300">Faction: {faction ? `${faction.name} (${faction.tokenSymbol})` : 'Neutre'}</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded border border-slate-800 p-2">Population: {city.population.toLocaleString('fr-FR')}</div>
            <div className="rounded border border-slate-800 p-2">Défense: {city.defense}</div>
            <div className="rounded border border-slate-800 p-2">Moral: {city.morale}</div>
            <div className="rounded border border-slate-800 p-2">Gouverneur: {city.owner}</div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <h3 className="text-lg font-semibold">Ressources</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>Food: {city.resources.food}</li>
            <li>Ore: {city.resources.ore}</li>
            <li>Energy: {city.resources.energy}</li>
            <li>Credits: {city.resources.credits}</li>
          </ul>
          <h4 className="mt-5 text-sm font-semibold text-slate-200">Bâtiments (prototype)</h4>
          <ul className="mt-2 space-y-1 text-sm text-slate-300">
            <li>• Command Core — Niveau 8</li>
            <li>• Foundry — Niveau 6</li>
            <li>• Dockyard — Niveau 5</li>
          </ul>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <h3 className="text-lg font-semibold">Production & recrutement</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-200">
            {city.productionQueue.map((queueItem) => (
              <li key={queueItem.id} className="rounded border border-slate-800 p-2">
                <p className="font-medium">{queueItem.label}</p>
                <p className="text-slate-400">{queueItem.turnsRemaining} tours restants</p>
              </li>
            ))}
          </ul>
          <h4 className="mt-5 text-sm font-semibold text-slate-200">État de siège</h4>
          <p className="mt-2 text-sm text-slate-300">Aucun siège en cours. Garnison en alerte modérée.</p>
        </section>
      </div>
    </ViewShell>
  );
}
