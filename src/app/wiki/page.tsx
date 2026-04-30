import Link from 'next/link';

export default function WikiLandingPage() {
  return (
    <main className="landing-root" style={{ padding: '3rem' }}>
      <h1>Coinage Wiki</h1>
      <p>Use the in-repo wiki for the complete FR/EN documentation.</p>
      <ul>
        <li><Link href="/docs/wiki/README.md">Wiki FR index</Link></li>
        <li><Link href="/docs/wiki/en/README.md">Wiki EN index</Link></li>
      </ul>
    </main>
  );
}
