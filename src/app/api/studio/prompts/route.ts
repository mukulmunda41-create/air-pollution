import { guard, isKind, json, regeneratePrompt } from '@/studio/api';
import { isSceneId } from '@/studio/manifest';

export async function POST(req: Request) {
  const blocked = guard(req);
  if (blocked) return blocked;
  let body: { scene?: string; kind?: string; note?: string };
  try { body = await req.json(); } catch { return json({ error: 'Bad request.' }, 400); }
  if (!isSceneId(body.scene ?? null)) return json({ error: 'Unknown scene.' }, 400);
  if (!isKind(body.kind)) return json({ error: 'Kind must be image or video.' }, 400);
  try {
    return json({ rev: await regeneratePrompt(body.scene!, body.kind, (body.note ?? '').trim().slice(0, 4000)) });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'That failed.' }, 400);
  }
}
