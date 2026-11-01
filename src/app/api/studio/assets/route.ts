import type { ReadableStream as WebStream } from 'node:stream/web';
import { guard, isKind, json } from '@/studio/api';
import { isSceneId } from '@/studio/manifest';
import { receiveUpload, UploadError } from '@/studio/upload';

// Raw body so large videos stream to disk instead of being buffered in memory.
export async function POST(req: Request) {
  const blocked = guard(req);
  if (blocked) return blocked;
  const url = new URL(req.url);
  const scene = url.searchParams.get('scene');
  const kind = url.searchParams.get('kind');
  if (!isSceneId(scene)) return json({ error: 'Unknown scene.' }, 400);
  if (!isKind(kind)) return json({ error: 'Kind must be image or video.' }, 400);
  if (!req.body) return json({ error: 'No file received.' }, 400);
  let name = 'upload';
  try { name = decodeURIComponent(req.headers.get('x-file-name') ?? 'upload'); } catch {}
  try {
    const asset = await receiveUpload(req.body as unknown as WebStream<Uint8Array>, scene, kind, name);
    return json({ asset }, 201);
  } catch (e) {
    if (e instanceof UploadError) return json({ error: e.message }, e.status);
    console.error(e);
    return json({ error: 'The upload failed. Nothing was saved.' }, 500);
  }
}
