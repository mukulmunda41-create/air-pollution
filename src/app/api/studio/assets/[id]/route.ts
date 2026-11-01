import { guard, json, rejectAsset } from '@/studio/api';
import { mutate, readManifest } from '@/studio/manifest';
import { makeWebFiles } from '@/studio/transcode';
import type { WebFiles } from '@/studio/types';

// The only way an asset becomes accepted: a POST from your click in the studio.
async function accept(id: string) {
  const m = await readManifest();
  const asset = Object.values(m.scenes).flatMap((s) => s.assets).find((a) => a.id === id);
  if (!asset) return json({ error: 'Asset not found.' }, 404);

  // Transcode outside the queue: it can take a while, and other clicks should not wait on it.
  let web: WebFiles | undefined;
  let warning: string | undefined;
  try {
    web = await makeWebFiles(asset);
  } catch (e) {
    console.error(e);
    warning = 'Accepted, but web-ready copies could not be made, so the film will use the original file. Check that ffmpeg is installed.';
  }

  const updated = await mutate((fresh) => {
    for (const scene of Object.values(fresh.scenes)) {
      const target = scene.assets.find((a) => a.id === id);
      if (!target) continue;
      for (const other of scene.assets) {
        if (other.kind === target.kind && other.status === 'accepted') other.status = 'superseded';
      }
      target.status = 'accepted';
      target.reviewedAt = new Date().toISOString();
      if (web) target.web = web;
      return target;
    }
    throw new Error('Asset not found.');
  });
  return json({ asset: updated, warning });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const blocked = guard(req);
  if (blocked) return blocked;
  const { id } = await params;
  let body: { action?: string; feedback?: string };
  try { body = await req.json(); } catch { return json({ error: 'Bad request.' }, 400); }

  try {
    if (body.action === 'accept') return await accept(id);
    if (body.action === 'reject') {
      const feedback = (body.feedback ?? '').trim().slice(0, 4000);
      if (!feedback) return json({ error: 'Say what is wrong, so the next prompt can fix it.' }, 400);
      return json(await rejectAsset(id, feedback));
    }
    return json({ error: 'Unknown action.' }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'That failed.' }, 400);
  }
}
