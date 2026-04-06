import Link from 'next/link';

interface GalaxyHudProps {
  planetCount: number;
}

export default function GalaxyHud({ planetCount }: GalaxyHudProps) {
  return (
    <>
      <div className="pointer-events-none absolute left-4 top-4 z-10 max-w-sm rounded-md bg-slate-950/55 px-3 py-2 text-xs text-slate-200 shadow-lg shadow-slate-950/40 backdrop-blur-sm">
        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-300/90">Coinage Galaxy Map</p>
        <p className="mt-1 text-slate-100/90">
          <span className="font-semibold">Pan:</span> WASD / Arrow Keys / drag
        </p>
        <p className="mt-1 text-slate-100/90">
          <span className="font-semibold">Planet View:</span> double-click a planet
        </p>
        <p className="mt-1 text-slate-100/90">
          <span className="font-semibold">Planets:</span> {planetCount}
        </p>
      </div>
      <div className="pointer-events-auto absolute left-4 top-20 z-10">
        <Link
          href="/"
          className="inline-flex items-center rounded-md border border-slate-600/70 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-slate-400 hover:bg-slate-800/80"
        >
          Back
        </Link>
      </div>
    </>
  );
}
