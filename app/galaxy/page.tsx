import GalaxyView from '@/ui/galaxy/GalaxyView';

const WORLD_SEED = 'coinage-mvp-seed';

export default function GalaxyPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl p-6">
        <h1 className="text-2xl font-semibold">Coinage Galaxy View (MVP Foundation)</h1>
        <p className="mt-2 text-sm text-slate-300">
          Stylized deterministic galaxy map with many procedurally varied planets. This view intentionally excludes
          gameplay flows in this slice.
        </p>
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 pb-10">
        <GalaxyView worldSeed={WORLD_SEED} />
      </div>
    </main>
  );
}
