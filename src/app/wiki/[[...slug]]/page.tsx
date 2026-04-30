import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cleanWikiMarkdown, getWikiLanding, getWikiPage, parseRoute, slugifyHeading, toToc } from '@/lib/wiki';
import { wikiPages } from '@/lib/wikiNav';
import { WikiBreadcrumb, WikiCallout, WikiCategoryCard, WikiPrevNext, WikiRelatedPages, WikiStatusBadge, WikiTableOfContents } from '@/components/wiki/WikiComponents';

export default async function WikiPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const route = parseRoute(slug);

  if (!route.page) {
    const { categories } = await getWikiLanding(route.lang);
    const startCards = [
      { href: '/wiki/getting-started/beginner-guide', title: 'Beginner Guide', description: 'Learn your first city loop, resource flow, and early priorities.' },
      { href: '/wiki/getting-started/core-loop', title: 'Core Loop', description: 'Understand how production, construction, training, and expansion connect.' },
      { href: '/wiki/resources-economy/resources', title: 'Resources', description: 'Track the economy behind cities, queues, and progression.' },
      { href: '/wiki/buildings', title: 'Buildings', description: 'Explore what each structure unlocks or improves.' },
    ];

    return <main className="wiki-shell"><section className="wiki-hero-premium"><p className="kicker">Knowledge Protocol</p><h1>Coinage Wiki</h1><p>Authoritative game systems reference covering the current runtime and in-progress design pillars.</p><div className="wiki-cta-row"><Link href="/wiki/getting-started/beginner-guide">Start the Beginner Guide</Link><Link href="/wiki/buildings">Browse Buildings</Link><Link href="/wiki/combat/overview">Explore Combat</Link></div><div className="wiki-pill-row"><span>Runtime systems</span><span>Planned systems</span><span>Docs-backed</span></div></section>
      <section className="wiki-section"><h2>Start here</h2><div className="wiki-grid">{startCards.map((c) => <WikiCategoryCard key={c.href} {...c} />)}</div></section>
      <section className="wiki-section"><h2>Core systems</h2><div className="wiki-grid">{categories.slice(0, 9).map((c) => <WikiCategoryCard key={c.slug} href={`/wiki/${c.slug}${c.featured ? `/${c.featured}` : ''}`} title={c.title} description={c.description} />)}</div></section>
      <section className="wiki-section wiki-columns"><div><h2>Implemented / Partial</h2><div className="wiki-inline-links">{wikiPages.filter((p) => p.status === 'Implemented' || p.status === 'Partially implemented').map((p) => <Link key={p.publicPath} href={p.publicPath}>{p.title}</Link>)}</div></div><div><h2>Planned / In progress</h2><div className="wiki-inline-links">{wikiPages.filter((p) => p.status === 'Planned' || p.status === 'Design in progress').map((p) => <Link key={p.publicPath} href={p.publicPath}>{p.title}</Link>)}</div></div></section>
      <section className="wiki-section"><h2>Popular reference</h2><div className="wiki-inline-links">{['/wiki/buildings/mine','/wiki/buildings/quarry','/wiki/buildings/refinery','/wiki/buildings/warehouse','/wiki/buildings/research-lab','/wiki/buildings/space-dock','/wiki/combat/overview'].map((href) => <Link key={href} href={href}>{href.split('/').pop()?.replace(/-/g, ' ')}</Link>)}</div></section>
    </main>;
  }

  const resolved = await getWikiPage(route.page, route.lang);
  if (!resolved) notFound();
  const { page, content, isFallback } = resolved;
  const categoryPages = wikiPages.filter((p) => p.categorySlug === page.categorySlug).sort((a, b) => a.order - b.order);
  const currentIndex = categoryPages.findIndex((p) => p.publicPath === page.publicPath);
  const cleanContent = cleanWikiMarkdown(content);
  const toc = toToc(cleanContent);

  return <main className="wiki-shell wiki-detail"><WikiBreadcrumb category={page.category} title={page.title} />
    <div className="wiki-layout">
      <aside className="wiki-sidebar">{categoryPages.map((p) => <Link key={p.publicPath} href={p.publicPath} className={p.publicPath === page.publicPath ? 'active' : ''}>{p.title}</Link>)}</aside>
      <article className="wiki-article"><header className="wiki-page-header"><h1>{page.title}</h1><p>{page.description}</p><div className="wiki-meta"><WikiStatusBadge status={page.status} />{page.tags.map((t) => <span key={t} className="wiki-tag">{t}</span>)}</div></header>
        {isFallback && <WikiCallout>Translation pending: displaying available source language.</WikiCallout>}
        <div className="wiki-md"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{ h2: ({ children }) => <h2 id={slugifyHeading(String(children))}>{children}</h2>, h3: ({ children }) => <h3 id={slugifyHeading(String(children))}>{children}</h3> }}>{cleanContent}</ReactMarkdown></div>
        <WikiRelatedPages links={page.related} />
        <WikiPrevNext pages={categoryPages} index={currentIndex} />
      </article>
      <WikiTableOfContents items={toc} />
    </div>
  </main>;
}
