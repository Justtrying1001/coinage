import Link from 'next/link';
import { notFound } from 'next/navigation';
import { listWikiFiles, loadWikiPage, type WikiLang } from '@/lib/wiki';

type Params = { slug?: string[] };

function getLangAndPath(slug?: string[]): { lang: WikiLang; docSlug: string[] } {
  if (!slug || slug.length === 0) return { lang: 'fr', docSlug: ['README'] };
  if (slug[0] === 'en') {
    const rest = slug.slice(1);
    return { lang: 'en', docSlug: rest.length ? rest : ['README'] };
  }
  if (slug[0] === 'fr') {
    const rest = slug.slice(1);
    return { lang: 'fr', docSlug: rest.length ? rest : ['README'] };
  }
  return { lang: 'fr', docSlug: slug };
}

export default async function WikiPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const { lang, docSlug } = getLangAndPath(slug);
  const page = await loadWikiPage(lang, docSlug);
  if (!page) notFound();

  const files = await listWikiFiles(lang);
  const navPrefix = lang === 'fr' ? '/wiki/fr/' : '/wiki/en/';
  const switchLangHref = lang === 'fr' ? `/wiki/en/${docSlug.join('/')}` : `/wiki/fr/${docSlug.join('/')}`;

  return (
    <main style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem', padding: '1.5rem' }}>
      <aside>
        <h2>Coinage Wiki ({lang.toUpperCase()})</h2>
        <p><Link href={switchLangHref}>Switch to {lang === 'fr' ? 'EN' : 'FR'}</Link></p>
        <ul style={{ maxHeight: '75vh', overflow: 'auto', paddingLeft: '1rem' }}>
          {files.map((file) => {
            const href = `${navPrefix}${file.replace(/\.md$/, '')}`;
            return <li key={file}><Link href={href}>{file}</Link></li>;
          })}
        </ul>
      </aside>
      <article>
        <h1>{page.title}</h1>
        <pre style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{page.content}</pre>
      </article>
    </main>
  );
}
