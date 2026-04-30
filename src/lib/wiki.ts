import { promises as fs } from 'node:fs';
import path from 'node:path';

const WIKI_ROOT = path.join(process.cwd(), 'docs', 'wiki');

export type WikiLang = 'fr' | 'en';

export type WikiPage = {
  slug: string[];
  lang: WikiLang;
  title: string;
  content: string;
  relativePath: string;
};

function normalizeSlug(slug?: string[]): string[] {
  if (!slug || slug.length === 0) return ['README'];
  return slug;
}

export function resolveWikiPath(lang: WikiLang, slug?: string[]): { filePath: string; relativePath: string } {
  const normalized = normalizeSlug(slug);
  const base = lang === 'fr' ? WIKI_ROOT : path.join(WIKI_ROOT, 'en');
  const relativePath = `${normalized.join('/')}.md`;
  return { filePath: path.join(base, relativePath), relativePath };
}

function titleFromMarkdown(markdown: string, fallback: string): string {
  const firstHeading = markdown.split('\n').find((line) => line.startsWith('# '));
  return firstHeading ? firstHeading.replace(/^#\s+/, '').trim() : fallback;
}

export async function loadWikiPage(lang: WikiLang, slug?: string[]): Promise<WikiPage | null> {
  const { filePath, relativePath } = resolveWikiPath(lang, slug);
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const title = titleFromMarkdown(content, relativePath);
    return { slug: normalizeSlug(slug), lang, title, content, relativePath };
  } catch {
    return null;
  }
}

export async function listWikiFiles(lang: WikiLang): Promise<string[]> {
  const base = lang === 'fr' ? WIKI_ROOT : path.join(WIKI_ROOT, 'en');
  const out: string[] = [];

  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile() && entry.name.endsWith('.md')) out.push(path.relative(base, full));
    }
  }

  await walk(base);
  return out.sort();
}
