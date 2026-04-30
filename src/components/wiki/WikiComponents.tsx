import Link from 'next/link';
import type { WikiPage, WikiStatus } from '@/lib/wikiNav';

export const WikiLayout = ({ left, main, right }: { left: React.ReactNode; main: React.ReactNode; right: React.ReactNode }) => (
  <div className="wiki-layout-premium"><aside>{left}</aside><article>{main}</article><nav>{right}</nav></div>
);
export const WikiLanding = ({ children }: { children: React.ReactNode }) => <main className="wiki-shell wiki-landing">{children}</main>;
export const WikiPageHeader = ({ title, description, status, tags }: { title: string; description: string; status: WikiStatus; tags: string[] }) => <header className="wiki-page-header-premium"><h1>{title}</h1><p>{description}</p><div className="wiki-meta"><WikiStatusBadge status={status} />{tags.map((t) => <span key={t} className="wiki-tag">{t}</span>)}</div></header>;
export const WikiSidebar = ({ pages, current }: { pages: WikiPage[]; current: string }) => <div className="wiki-sidebar-premium">{pages.map((p) => <Link key={p.publicPath} href={p.publicPath} className={p.publicPath === current ? 'active' : ''}>{p.title}</Link>)}</div>;

export function WikiStatusBadge({ status }: { status: WikiStatus }) { return <span className={`wiki-status wiki-status--${status.toLowerCase().replace(/\s+/g, '-')}`}>{status}</span>; }
export function WikiBreadcrumb({ category, title }: { category: string; title: string }) { return <nav className="wiki-breadcrumb"><Link href="/wiki">Wiki</Link><span>/</span><span>{category}</span><span>/</span><span>{title}</span></nav>; }
export function WikiCategoryCard({ title, description, href }: { title: string; description: string; href: string }) { return <Link href={href} className="wiki-card premium"><h3>{title}</h3><p>{description}</p></Link>; }
export const WikiSystemCard = WikiCategoryCard;
export const WikiTableOfContents = ({ items }: { items: { depth: number; label: string }[] }) => <section className="wiki-toc"><h3>On this page</h3><ul>{items.map((i) => <li key={i.label} className={`depth-${i.depth}`}><a href={`#${i.label.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}`}>{i.label}</a></li>)}</ul></section>;
export function WikiRelatedPages({ links }: { links: string[] }) { return <section className="wiki-section"><h3>Related pages</h3><div className="wiki-inline-links">{links.map((l) => <Link key={l} href={l}>{l.replace('/wiki/', '')}</Link>)}</div></section>; }
export function WikiPrevNext({ pages, index }: { pages: WikiPage[]; index: number }) { const prev = pages[index - 1]; const next = pages[index + 1]; return <div className="wiki-prevnext">{prev ? <Link href={prev.publicPath}>← {prev.title}</Link> : <span />} {next ? <Link href={next.publicPath}>{next.title} →</Link> : <span />}</div>; }
export function WikiCallout({ children }: { children: React.ReactNode }) { return <div className="wiki-callout">{children}</div>; }
export const WikiCategoryCardAlias = WikiCategoryCard;
