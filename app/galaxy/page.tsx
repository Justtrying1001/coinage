import GalaxyView from '@/ui/galaxy/GalaxyView';
import { WORLD_SEED } from '@/domain/world/world.constants';

export default function GalaxyPage() {
  return (
    <main className="h-dvh w-screen overflow-hidden bg-slate-950 text-slate-100">
      <GalaxyView worldSeed={WORLD_SEED} />
    </main>
  );
}
