import { promises as fs } from 'node:fs';
import path from 'node:path';

const MIME_BY_EXT: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

export async function GET(_: Request, context: { params: Promise<{ file: string }> }) {
  const { file } = await context.params;
  const safeFile = path.basename(file);
  const lookupPaths = [path.join(process.cwd(), 'assets', safeFile), path.join(process.cwd(), 'assets', 'building', safeFile), path.join(process.cwd(), 'assets', 'troups', safeFile)];

  try {
    let content: Buffer | null = null;
    for (const candidate of lookupPaths) {
      try {
        content = await fs.readFile(candidate);
        break;
      } catch {
        continue;
      }
    }
    if (!content) return new Response('Not found', { status: 404 });

    const ext = path.extname(safeFile).toLowerCase();
    const contentType = MIME_BY_EXT[ext] ?? 'application/octet-stream';
    return new Response(content, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
