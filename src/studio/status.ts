// Pure helpers shared by server and client.
import type { AssetKind, SceneState, SceneStatus } from './types.ts';

const pad = (n: number) => String(n).padStart(3, '0');

export const assetFileName = (scene: string, kind: AssetKind, version: number, ext: string) =>
  `${scene}__${kind}__v${pad(version)}.${ext}`;

export const nextVersion = (s: SceneState, kind: AssetKind) =>
  s.assets.filter((a) => a.kind === kind).reduce((v, a) => Math.max(v, a.version), 0) + 1;

export function sceneStatus(s: SceneState, required: AssetKind[]): SceneStatus {
  if (!s.assets.length) return 'not-started';
  if (s.assets.some((a) => a.status === 'review')) return 'in-review';
  const accepted = (k: AssetKind) => s.assets.some((a) => a.kind === k && a.status === 'accepted');
  const kinds: AssetKind[] = ['image', 'video'];
  const needed = required.length ? required : kinds.filter((k) => s.assets.some((a) => a.kind === k));
  if (needed.every(accepted)) return 'approved';
  if (kinds.some(accepted)) return 'partly-approved';
  return 'needs-revision';
}

export const STATUS_LABEL: Record<SceneStatus, string> = {
  'not-started': 'Not started',
  'in-review': 'In review',
  'needs-revision': 'Needs revision',
  'partly-approved': 'Partly approved',
  approved: 'Approved',
};
