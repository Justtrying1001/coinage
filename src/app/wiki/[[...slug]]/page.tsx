import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getWikiLanding, getWikiPage, parseRoute, toToc } from '@/lib/wiki';
import { wikiPages } from '@/lib/wikiNav';
import { WikiBreadcrumb, WikiCallout, WikiCategoryCard, WikiPrevNext, WikiRelatedPages, WikiStatusBadge, WikiTableOfContents } from '@/components/wiki/WikiComponents';

function renderMarkdown(md: string) {
  return md.split('\n').map((line, i) => {
    if (line.startsWith('# ')) return <h1 key={i}>{line.slice(2)}</h1>;
    if (line.startsWith('## ')) return <h2 key={i}>{line.slice(3)}</h2>;
    if (line.startsWith('### ')) return <h3 key={i}>{line.slice(4)}</h3>;
    if (line.startsWith('> ')) return <WikiCallout key={i}>{line.slice(2)}</WikiCallout>;
    if (line.startsWith('- ')) return <li key={i}>{line.slice(2)}</li>;
    if (!line.trim()) return <br key={i} />;
    return <p key={i}>{line}</p>;
  });
}

export default async function WikiPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const route = parseRoute(slug);

  if (!route.page) {
    const { categories } = await getWikiLanding(route.lang);
    return <main className="wiki-shell"><section className="wiki-hero"><p>Knowledge Protocol</p><h1>Coinage Wiki</h1><p>Authoritative documentation for game systems, runtime state, and roadmap clarity.</p></section>
      <section><h2>Start here</h2><div className="wiki-grid">{[
        ['/wiki/getting-started/beginner-guide', 'Beginner Guide'], ['/wiki/getting-started/core-loop', 'Core Loop'], ['/wiki/resources-economy/resources', 'Resources'], ['/wiki/buildings', 'Buildings'], ['/wiki/units', 'Units'], ['/wiki/research', 'Research'], ['/wiki/combat/overview', 'Combat']
      ].map(([href, label]) => <WikiCategoryCard key={href} href={href} title={label} description="Jump directly to a curated entry point." />)}</div></section>
      <section><h2>Core Systems</h2><div className="wiki-grid">{categories.slice(0, 6).map((c) => <WikiCategoryCard key={c.slug} href={`/wiki/${c.slug}${c.featured ? `/${c.featured}` : ''}`} title={c.title} description={c.description} />)}</div></section>
      <section><h2>Current Runtime Systems</h2><div className="wiki-inline-links">{wikiPages.filter((p) => p.status === 'Implemented').map((p) => <Link key={p.publicPath} href={p.publicPath}>{p.title}</Link>)}</div></section>
      <section><h2>Planned Systems</h2><div className="wiki-inline-links">{wikiPages.filter((p) => p.status === 'Planned' || p.status === 'Design in progress').map((p) => <Link key={p.publicPath} href={p.publicPath}>{p.title}</Link>)}</div></section>
    </main>;
  }

  const resolved = await getWikiPage(route.page, route.lang);
  if (!resolved) notFound();
  const { page, content, isFallback } = resolved;
  const categoryPages = wikiPages.filter((p) => p.categorySlug === page.categorySlug);
  const currentIndex = categoryPages.findIndex((p) => p.publicPath === page.publicPath);

  return <main className="wiki-shell wiki-detail"><WikiBreadcrumb category={page.categorySlug} title={page.title} />
    <div className="wiki-layout">
      <aside className="wiki-sidebar">{categoryPages.map((p) => <Link key={p.publicPath} href={p.publicPath}>{p.title}</Link>)}</aside>
      <article className="wiki-article">
        <h1>{page.title}</h1><p>{page.description}</p><WikiStatusBadge status={page.status} />
        {isFallback && <WikiCallout>Translation pending: displaying available source language.</WikiCallout>}
        <WikiTableOfContents items={toToc(content)} />
        <div className="wiki-md">{renderMarkdown(content)}</div>
        <WikiRelatedPages links={page.related} />
        <WikiPrevNext pages={categoryPages} index={currentIndex} />
      </article>
    </div>
  </main>;
}
