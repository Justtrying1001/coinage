import Link from 'next/link';

export function LandingHero() {
  return (
    <main className="landing-root">
      <div className="landing-ocean-grid" aria-hidden="true" />
      <div className="landing-vignette" aria-hidden="true" />
      <section className="landing-content">
        <p className="landing-kicker">Coinage // Strategic Command Layer</p>
        <h1>Command the digital ocean.</h1>
        <p className="landing-subtitle">
          Enter the first operational map build. Scan factions, track slots, and establish your first foothold.
        </p>
        <Link className="landing-cta" href="/game">
          Start Coinage
        </Link>
        <Link className="landing-cta" href="/wiki">
          Open Wiki
        </Link>
      </section>
    </main>
  );
}
