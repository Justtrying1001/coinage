import PlanetView from '@/ui/planet/PlanetView';
import { WORLD_SEED } from '@/domain/world/world.constants';

interface PlanetPageProps {
  params: Promise<{ planetId: string }>;
}

export default async function PlanetPage({ params }: PlanetPageProps) {
  const { planetId } = await params;

  return <PlanetView worldSeed={WORLD_SEED} planetId={planetId} />;
}
