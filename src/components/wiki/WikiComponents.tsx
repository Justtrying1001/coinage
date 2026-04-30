import Link from 'next/link';
import type { WikiPage, WikiStatus } from '@/lib/wikiNav';

export function WikiStatusBadge({ status }: { status: WikiStatus }) {
  return <span className={`wiki-status wiki-status--${status.toLowerCase().replace(/\s+/g, '-')}`}>{status}</span>;
}

export function WikiBreadcrumb({ category, title }: { category: string; title: string }) {
  return <nav className="wiki-breadcrumb"><Link href="/wiki">Wiki</Link><span>/</span><span>{category}</span><span>/</span><span>{title}</span></nav>;
}

export function WikiCategoryCard({ title, description, href }: { title: string; description: string; href: string }) {
  return <Link href={href} className="wiki-card"><h3>{title}</h3><p>{description}</p></Link>;
}

export function WikiRelatedPages({ links }: { links: string[] }) {
  return <section className="wiki-section"><h3>Related pages</h3><div className="wiki-inline-links">{links.map((l) => <Link key={l} href={l}>{l.replace('/wiki/', '')}</Link>)}</div></section>;
}

export function WikiTableOfContents({ items }: { items: { depth: number; label: string }[] }) {
  return <section className="wiki-toc"><h3>On this page</h3><ul>{items.map((i) => <li key={i.label} className={`depth-${i.depth}`}><a href={`#${i.label.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}`}>{i.label}</a></li>)}</ul></section>;
}

export function WikiPrevNext({ pages, index }: { pages: WikiPage[]; index: number }) {
  const prev = pages[index - 1];
  const next = pages[index + 1];
  return <div className="wiki-prevnext">{prev ? <Link href={prev.publicPath}>← {prev.title}</Link> : <span />} {next ? <Link href={next.publicPath}>{next.title} →</Link> : <span />}</div>;
}

export function WikiCallout({ children }: { children: React.ReactNode }) { return <div className="wiki-callout">{children}</div>; }
