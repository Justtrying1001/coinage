import { promises as fs } from 'node:fs';
import path from 'node:path';
import { allWikiPages, findWikiPageBySlug, wikiCategories } from '@/lib/wikiNav';

const WIKI_ROOT = path.join(process.cwd(), 'docs', 'wiki');
export type WikiLang = 'fr' | 'en';

export async function loadWikiDoc(lang: WikiLang, relativePath: string) {
  const base = lang === 'fr' ? WIKI_ROOT : path.join(WIKI_ROOT, 'en');
  const filePath = path.join(base, relativePath);
  try { return await fs.readFile(filePath, 'utf8'); } catch { return null; }
}

export async function getWikiLanding(lang: WikiLang){
  const pages = await Promise.all(allWikiPages.map(async (p)=>({ ...p, exists: Boolean(await loadWikiDoc(lang, lang==='fr'?p.sourcePathFr:p.sourcePathEn)) })));
  return { categories: wikiCategories, pages };
}

export async function resolveWikiPage(lang: WikiLang, slugParts: string[]){
  const page = findWikiPageBySlug(slugParts);
  if (!page) return null;
  const content = await loadWikiDoc(lang, lang==='fr'?page.sourcePathFr:page.sourcePathEn);
  if (!content) return null;
  return { ...page, content };
}

export function parseWikiRoute(slug?: string[]): { lang: WikiLang; pageSlug: string[] | null; isLanding: boolean } {
  if (!slug?.length) return { lang: 'fr', pageSlug: null, isLanding: true };
  if (slug[0] === 'en' || slug[0] === 'fr') {
    const lang = slug[0] as WikiLang;
    if (slug.length === 1) return { lang, pageSlug: null, isLanding: true };
    return { lang, pageSlug: slug.slice(1), isLanding: false };
  }
  return { lang: 'fr', pageSlug: slug, isLanding: false };
}
