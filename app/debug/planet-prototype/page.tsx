import PlanetPrototypePanel from '@/ui/prototype/planet/PlanetPrototypePanel';

export default function PlanetPrototypePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl p-6">
        <h1 className="text-2xl font-semibold">Coinage Planet Prototype</h1>
        <p className="mt-2 text-sm text-slate-300">
          One-planet rendering validation only. This page intentionally does not include galaxy navigation,
          movement, or gameplay systems.
        </p>
      </div>

      <PlanetPrototypePanel />
    </main>
  );
}
