import { promises as fs } from 'node:fs';
import path from 'node:path';

const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

export async function GET(_: Request, context: { params: Promise<{ file: string }> }) {
  const { file } = await context.params;
  const safeFile = path.basename(file);
  const assetPath = path.join(process.cwd(), 'assets', safeFile);

  try {
    const content = await fs.readFile(assetPath);
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
