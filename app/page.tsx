import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100">
      <section className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center shadow-lg shadow-slate-950/40">
        <h1 className="text-3xl font-semibold">Coinage</h1>
        <Link
          href="/galaxy"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-slate-100 px-5 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-white"
        >
          Enter Coinage
        </Link>
      </section>
    </main>
  );
}
