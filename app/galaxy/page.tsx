import GalaxyView from '@/ui/galaxy/GalaxyView';

const WORLD_SEED = 'coinage-mvp-seed';

export default function GalaxyPage() {
  return (
    <main className="h-dvh w-screen overflow-hidden bg-slate-950 text-slate-100">
      <GalaxyView worldSeed={WORLD_SEED} />
    </main>
  );
}
