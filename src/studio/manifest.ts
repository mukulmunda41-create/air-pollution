// The asset library on disk: public/assets/manifest.json, written atomically and one change at a
// time, so two quick clicks can never lose a version. Server only.
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { sceneById } from '@/content/scenes';
import { assetsRoot, manifestPath } from './approved';
import type { AssetKind, Manifest, PromptRev, SceneState } from './types';

// Route handlers can load as separate module instances in dev, so the queue lives on globalThis.
const shared = globalThis as unknown as { __studioQueue?: Promise<unknown> };

export async function readManifest(): Promise<Manifest> {
  try {
    return JSON.parse(await readFile(manifestPath(), 'utf8')) as Manifest;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return { version: 1, updatedAt: new Date().toISOString(), scenes: {} };
    throw e; // a corrupt manifest must stop the studio, not silently start over and hide your history
  }
}

async function writeManifest(m: Manifest) {
  m.updatedAt = new Date().toISOString();
  await mkdir(assetsRoot(), { recursive: true });
  const tmp = `${manifestPath()}.${process.pid}.tmp`;
  await writeFile(tmp, `${JSON.stringify(m, null, 2)}\n`);
  await rename(tmp, manifestPath());
}

/** Serialized read, change, write. Whatever fn returns is passed through. */
export function mutate<T>(fn: (m: Manifest) => T | Promise<T>): Promise<T> {
  const run = (shared.__studioQueue ?? Promise.resolve()).then(async () => {
    const m = await readManifest();
    const out = await fn(m);
    await writeManifest(m);
    return out;
  });
  shared.__studioQueue = run.catch(() => {});
  return run;
}

const seedRev = (id: string, kind: AssetKind): PromptRev => ({
  rev: 1,
  kind,
  fields: { ...sceneById[id][kind] },
  createdAt: new Date().toISOString(),
  author: 'director',
  trigger: 'seed',
});

/** A scene's record, seeded from the prompt library on first use. Editing the library never rewrites history. */
export function sceneState(m: Manifest, id: string): SceneState {
  return (m.scenes[id] ??= { id, prompts: { image: [seedRev(id, 'image')], video: [seedRev(id, 'video')] }, assets: [] });
}

export const latestRev = (s: SceneState, kind: AssetKind) => s.prompts[kind][s.prompts[kind].length - 1];

export const isSceneId = (id: string | null): id is string => !!id && Object.hasOwn(sceneById, id);

/** Resolve a stored relative path inside the assets root, refusing anything that escapes it. */
export function resolveInRoot(rel: string) {
  const root = path.resolve(assetsRoot());
  const full = path.resolve(root, rel);
  if (full !== root && !full.startsWith(root + path.sep)) return null;
  return full;
}
