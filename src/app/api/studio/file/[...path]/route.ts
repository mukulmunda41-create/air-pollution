// Studio previews, with Range support so videos can seek. Works whether or not Next serves files
// added to public/ after startup.
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { guard } from '@/studio/api';
import { resolveInRoot } from '@/studio/manifest';

const TYPES: Record<string, string> = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif',
  '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm',
};

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const blocked = guard(req);
  if (blocked) return blocked;
  const parts = (await params).path;
  const full = resolveInRoot(parts.join('/'));
  const type = TYPES[path.extname(parts[parts.length - 1]).toLowerCase()];
  if (!full || !type) return new Response('Not found', { status: 404 });

  let size: number;
  try {
    const s = await stat(full);
    if (!s.isFile()) return new Response('Not found', { status: 404 });
    size = s.size;
  } catch {
    return new Response('Not found', { status: 404 });
  }

  const headers: Record<string, string> = { 'content-type': type, 'accept-ranges': 'bytes', 'x-content-type-options': 'nosniff' };
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get('range') ?? '');
  if (range && (range[1] || range[2])) {
    const start = range[1] ? Number(range[1]) : Math.max(size - Number(range[2]), 0);
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start >= size || start > end) return new Response(null, { status: 416, headers: { 'content-range': `bytes */${size}` } });
    headers['content-range'] = `bytes ${start}-${end}/${size}`;
    headers['content-length'] = String(end - start + 1);
    return new Response(Readable.toWeb(createReadStream(full, { start, end })) as ReadableStream, { status: 206, headers });
  }
  headers['content-length'] = String(size);
  return new Response(Readable.toWeb(createReadStream(full)) as ReadableStream, { headers });
}
