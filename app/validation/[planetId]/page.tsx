import PlanetValidationView from '@/ui/planet/PlanetValidationView';
import { WORLD_SEED } from '@/domain/world/world.constants';

interface ValidationPageProps {
  params: Promise<{ planetId: string }>;
  searchParams: Promise<{ mode?: 'galaxy' | 'planet' }>;
}

export default async function ValidationPage({ params, searchParams }: ValidationPageProps) {
  const { planetId } = await params;
  const { mode } = await searchParams;

  return <PlanetValidationView worldSeed={WORLD_SEED} planetId={planetId} mode={mode === 'galaxy' ? 'galaxy' : 'planet'} />;
}
