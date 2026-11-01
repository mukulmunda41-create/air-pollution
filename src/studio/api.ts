// Shared route handler plumbing. The studio writes to disk, so it only exists in development, only
// on this machine, and only for requests from its own page. Server only.
import { sceneById, scenes } from '@/content/scenes';
import { latestRev, mutate, readManifest, sceneState } from './manifest';
import { applyAlternate, revise } from './revise';
import { nextVersion, sceneStatus } from './status';
import type { AssetKind, Manifest, PromptRev } from './types';

const LOOPBACK = /^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/;

export function guard(req: Request): Response | null {
  if (process.env.NODE_ENV === 'production') return new Response('Not found', { status: 404 });
  const host = req.headers.get('host') ?? '';
  if (!LOOPBACK.test(host)) return json({ error: 'The studio only answers on this machine.' }, 403);
  if (req.method !== 'GET') {
    const origin = req.headers.get('origin');
    let same = false;
    try { same = !!origin && new URL(origin).host === host; } catch {}
    if (!same) return json({ error: 'Cross-origin request refused.' }, 403);
  }
  return null;
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export const isKind = (k: string | null | undefined): k is AssetKind => k === 'image' || k === 'video';

export function viewState(m: Manifest) {
  // A plain copy of each scene, so a read never writes seed data into the stored manifest.
  const scratch = structuredClone(m);
  return {
    updatedAt: m.updatedAt,
    scenes: scenes.map((seed) => {
      const state = sceneState(scratch, seed.id);
      return {
        id: seed.id,
        chapter: seed.chapter,
        title: seed.title,
        description: seed.description,
        direction: seed.direction,
        use: seed.use,
        required: seed.required,
        delivery: seed.delivery,
        asset3d: seed.asset3d,
        state,
        status: sceneStatus(state, seed.required),
        next: { image: nextVersion(state, 'image'), video: nextVersion(state, 'video') },
      };
    }),
  };
}
export type StudioView = ReturnType<typeof viewState>;
export type SceneView = StudioView['scenes'][number];

export const studioState = async () => viewState(await readManifest());

/** Reject: keep the asset and the old prompt, write a new revision that answers the feedback. */
export function rejectAsset(assetId: string, feedback: string) {
  return mutate((m) => {
    for (const scene of Object.values(m.scenes)) {
      const asset = scene.assets.find((a) => a.id === assetId);
      if (!asset) continue;
      if (asset.status !== 'review' && asset.status !== 'accepted') throw new Error('Only an asset in review or accepted can be rejected.');
      asset.status = 'rejected';
      asset.feedback = feedback;
      asset.reviewedAt = new Date().toISOString();
      const list = scene.prompts[asset.kind];
      const current = latestRev(scene, asset.kind);
      const r = revise(current.fields, feedback, current.applied);
      const rev: PromptRev = {
        rev: current.rev + 1,
        kind: asset.kind,
        fields: r.fields,
        createdAt: new Date().toISOString(),
        author: 'engine',
        trigger: 'reject',
        basedOn: current.rev,
        feedback,
        assetId,
        summary: r.summary,
        changes: r.changes,
        applied: r.applied,
        unmatched: r.unmatched,
      };
      list.push(rev);
      return { asset, rev };
    }
    throw new Error('Asset not found.');
  });
}

/** Regenerate: a note goes through the reviser. No note switches to the next authored alternate. */
export function regeneratePrompt(sceneId: string, kind: AssetKind, note: string) {
  return mutate((m) => {
    const scene = sceneState(m, sceneId);
    const seed = sceneById[sceneId];
    const list = scene.prompts[kind];
    const current = latestRev(scene, kind);
    const base = { rev: current.rev + 1, kind, createdAt: new Date().toISOString(), author: 'engine' as const, basedOn: current.rev };

    if (note) {
      const r = revise(current.fields, note, current.applied);
      const rev: PromptRev = { ...base, trigger: 'regenerate', fields: r.fields, feedback: note, summary: r.summary, changes: r.changes, applied: r.applied, unmatched: r.unmatched };
      list.push(rev);
      return rev;
    }

    // Take the next alternate that would actually change something, so the button never reissues the same prompt.
    const used = list.filter((p) => p.trigger === 'alternate').length;
    for (let i = 0; i < seed.alternates.length; i++) {
      const alt = seed.alternates[(used + i) % seed.alternates.length];
      const a = applyAlternate(current.fields, alt[kind], alt.label, alt.why);
      if (a.changes.length) {
        const rev: PromptRev = { ...base, trigger: 'alternate', fields: a.fields, summary: a.summary, changes: a.changes, applied: current.applied };
        list.push(rev);
        return rev;
      }
    }
    throw new Error('Every alternate take is already in this prompt. Add a note saying what should change.');
  });
}
