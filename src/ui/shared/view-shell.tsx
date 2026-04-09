import type { ReactNode } from 'react';

export function ViewShell({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex h-dvh flex-col bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800/80 bg-slate-900/80 px-6 py-4 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/80">Coinage Command Layer</p>
            <h1 className="text-2xl font-semibold">{title}</h1>
            {subtitle ? <p className="text-sm text-slate-300">{subtitle}</p> : null}
          </div>
          {actions}
        </div>
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}

export function ActionButton({ children, onClick, variant = 'primary', disabled = false }: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'ghost'; disabled?: boolean }) {
  const base = 'rounded-md px-3 py-2 text-sm font-medium transition';
  const tone =
    variant === 'primary'
      ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300 disabled:bg-slate-700 disabled:text-slate-300'
      : 'border border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800 disabled:text-slate-500';

  return (
    <button type="button" className={`${base} ${tone}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
