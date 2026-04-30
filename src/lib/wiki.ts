import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pageByPath, wikiCategories, wikiPages, type WikiLang, type WikiPage } from '@/lib/wikiNav';

const ROOT = path.join(process.cwd(), 'docs', 'wiki');

export async function loadDoc(page: WikiPage, lang: WikiLang) {
  const tryPaths = [path.join(ROOT, lang === 'en' ? 'en' : '', page.internalPath), path.join(ROOT, page.internalPath)];
  for (const p of tryPaths) {
    try {
      const content = await fs.readFile(p, 'utf8');
      return { content, isFallback: !p.includes('/en/') && lang === 'en' };
    } catch {}
  }
  return null;
}

export async function getWikiPage(pathParts: string[], lang: WikiLang) {
  const page = pageByPath.get(pathParts.join('/'));
  if (!page) return null;
  const loaded = await loadDoc(page, lang);
  if (!loaded) return null;
  return { page, ...loaded };
}

export async function getWikiLanding(lang: WikiLang) {
  const entries = await Promise.all(wikiPages.map(async (page) => ({ page, loaded: await loadDoc(page, lang) })));
  return {
    categories: wikiCategories.map((c) => ({ ...c, pages: entries.filter((e) => e.page.categorySlug === c.slug).map((e) => ({ ...e.page, available: Boolean(e.loaded) })) })),
  };
}

export const parseRoute = (slug?: string[]) => {
  if (!slug?.length) return { lang: 'en' as WikiLang, page: null as string[] | null };
  if (slug[0] === 'fr' || slug[0] === 'en') return { lang: slug[0] as WikiLang, page: slug.slice(1).length ? slug.slice(1) : null };
  return { lang: 'en' as WikiLang, page: slug };
};

export function toToc(markdown: string) {
  return markdown.split('\n').filter((l) => l.startsWith('## ')).map((l) => l.slice(3).trim());
}
