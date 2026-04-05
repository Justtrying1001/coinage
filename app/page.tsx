import { publicEnv } from '@/lib/env';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center p-8">
      <section className="w-full rounded-xl border border-slate-800 bg-slate-900/60 p-8 shadow-lg shadow-slate-950/40">
        <h1 className="text-2xl font-semibold">Coinage MVP bootstrapped</h1>
        <p className="mt-3 text-slate-300">
          Next.js + Tailwind + Prisma baseline is running.
        </p>
        <dl className="mt-6 grid gap-3 text-sm text-slate-400 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-800 p-3">
            <dt className="font-medium text-slate-200">WORLD_SEED</dt>
            <dd className="mt-1 break-all">{publicEnv.NEXT_PUBLIC_WORLD_SEED}</dd>
          </div>
          <div className="rounded-lg border border-slate-800 p-3">
            <dt className="font-medium text-slate-200">WORLD_PLANET_COUNT</dt>
            <dd className="mt-1">{publicEnv.NEXT_PUBLIC_WORLD_PLANET_COUNT}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
