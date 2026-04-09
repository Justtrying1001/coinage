import type { City, Faction, WorldSector } from '@/domain/world/types';
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
  return (
    <ViewShell
      title="Vue Faction"
      subtitle="Couche locale d’un secteur : slots de ville, occupation et actions tactiques."
      actions={<ActionButton variant="ghost" onClick={onBackToMap}>Retour à la Map</ActionButton>}
    >
      <div className="grid h-full grid-cols-[1fr_340px]">
        <section className="space-y-6 overflow-y-auto p-6">
          <header className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Secteur local</p>
            <h2 className="text-xl font-semibold">{sector.name}</h2>
            <p className="mt-1 text-sm text-slate-300">Statut territorial: {sector.controlState}</p>
            {faction ? <p className="text-sm text-slate-300">Faction dominante: {faction.name} ({faction.tokenSymbol})</p> : null}
          </header>

          <div className="grid gap-4 md:grid-cols-2">
            {sector.citySlots.map((slot) => {
              const slotCity = cities.find((city) => city.slotId === slot.id) ?? null;
              return (
                <article key={slot.id} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{slot.label}</p>
                  <p className="mt-2 text-sm">Terrain: {slot.terrain}</p>
                  <p className="text-sm">Type: {slot.isCapitalSlot ? 'Slot principal' : 'Slot standard'}</p>
                  {slotCity ? (
                    <div className="mt-3 space-y-1 text-sm">
                      <p className="font-medium">Ville: {slotCity.name}</p>
                      <p>Population: {slotCity.population.toLocaleString('fr-FR')}</p>
                      <ActionButton onClick={() => onOpenCity(slotCity.id)}>Entrer en Vue Ville</ActionButton>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-400">Slot libre — installable selon règles d’expansion.</p>
                  )}
                </article>
              );
            })}
          </div>
        </section>
        <aside className="space-y-4 border-l border-slate-800 p-4">
          <section className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
            <h3 className="text-sm font-semibold">Informations territoriales</h3>
            <ul className="mt-2 space-y-2 text-sm text-slate-300">
              <li>Valeur stratégique: {sector.strategicValue}</li>
              <li>Slots occupés: {cities.length}/{sector.citySlots.length}</li>
              <li>Rôle: {sector.homelandFactionId ? 'Territoire principal' : 'Territoire d’expansion'}</li>
            </ul>
          </section>
          <section className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
            <h3 className="text-sm font-semibold">Actions locales</h3>
            <ul className="mt-2 space-y-2 text-sm text-slate-300">
              <li>• Reconnaissance secteur</li>
              <li>• Déploiement défensif</li>
              <li>• Revendiquer slot libre</li>
            </ul>
          </section>
        </aside>
      </div>
    </ViewShell>
  );
}
