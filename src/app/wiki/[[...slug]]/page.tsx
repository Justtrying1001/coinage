import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getWikiLanding, parseWikiRoute, resolveWikiPage } from '@/lib/wiki';

function badgeColor(status: string){
  if(status==='Implemented') return '#22c55e';
  if(status==='Partially implemented') return '#eab308';
  if(status==='Planned') return '#60a5fa';
  if(status==='Design in progress') return '#a78bfa';
  return '#94a3b8';
}

export default async function WikiPage({ params }: { params: Promise<{slug?: string[]}> }) {
  const { slug } = await params;
  const route = parseWikiRoute(slug);

  if (route.isLanding) {
    const { categories, pages } = await getWikiLanding(route.lang);
    return <main className="wiki"><h1>Coinage Wiki</h1><p>Player knowledge base for the current runtime and planned systems.</p>
      <section><h2>Start here</h2><div className="cards">{['getting-started/overview','getting-started/beginner-guide','resources-economy/resources','combat/overview'].map((s)=><Link key={s} className="card" href={`/wiki/${route.lang}/${s}`}>{s}</Link>)}</div></section>
      <section><h2>Categories</h2><div className="cards">{categories.map((c)=><div key={c.slug} className="card"><h3>{c.title}</h3><p>{c.description}</p><p>{c.pages.length} pages</p><Link href={`/wiki/${route.lang}/${c.slug}/${c.pages[0]?.slug}`}>Open</Link></div>)}</div></section>
      <section><h2>Current runtime systems</h2><ul>{pages.filter(p=>p.status==='Implemented').slice(0,12).map(p=><li key={p.fullSlug}><Link href={`/wiki/${route.lang}/${p.fullSlug}`}>{p.title}</Link></li>)}</ul></section>
      <section><h2>Planned systems</h2><ul>{pages.filter(p=>p.status==='Planned' || p.status==='Design in progress').slice(0,12).map(p=><li key={p.fullSlug}><Link href={`/wiki/${route.lang}/${p.fullSlug}`}>{p.title}</Link></li>)}</ul></section>
    </main>;
  }

  const page = await resolveWikiPage(route.lang, route.pageSlug ?? []);
  if (!page) notFound();
  const href = `/wiki/${route.lang}/${page.fullSlug}`;
  return <main className="wiki wiki-detail">
    <nav><Link href={`/wiki/${route.lang}`}>Wiki</Link> / {page.category.title} / {page.title}</nav>
    <div className="layout">
      <aside>{page.category.pages.map(p=><Link key={p.slug||'index'} href={`/wiki/${route.lang}/${page.category.slug}${p.slug?`/${p.slug}`:''}`}>{p.title}</Link>)}</aside>
      <article>
        <h1>{page.title}</h1>
        <p>{page.description}</p>
        <span className="badge" style={{background:badgeColor(page.status)}}>{page.status}</span>
        <pre>{page.content}</pre>
        <p>Related systems: {page.related.map((r)=><Link key={r} href={`/wiki/${route.lang}/${r}`}>{r}</Link>)}</p>
        <p><Link href={href.replace('/fr/','/en/')}>Switch EN/FR</Link></p>
      </article>
    </div>
  </main>;
}
