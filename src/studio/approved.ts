// What the public film may show: the newest accepted asset per scene, only if its file is on disk.
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { PlateAsset } from '@/scene/Plate';
import type { Asset, Manifest } from './types';

export const assetsRoot = () => process.env.ASSETS_ROOT ?? path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', 'assets');
export const manifestPath = () => path.join(assetsRoot(), 'manifest.json');

const publicUrl = (file?: string) => {
  if (!file || !existsSync(/*turbopackIgnore: true*/ path.join(assetsRoot(), file))) return undefined;
  return `/assets/${file.split('/').map(encodeURIComponent).join('/')}`;
};

const newestAccepted = (assets: Asset[], kind: Asset['kind']) =>
  assets.filter((a) => a.kind === kind && a.status === 'accepted').sort((a, b) => b.version - a.version)[0];

export async function approvedPlates(): Promise<Record<string, PlateAsset>> {
  let manifest: Manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath(), 'utf8'));
  } catch {
    return {}; // no manifest yet: every chapter uses its built-in art
  }
  const plates: Record<string, PlateAsset> = {};
  for (const [id, scene] of Object.entries(manifest.scenes)) {
    const image = newestAccepted(scene.assets, 'image');
    const video = newestAccepted(scene.assets, 'video');
    const plate: PlateAsset = {
      image: publicUrl(image?.web?.image) ?? publicUrl(image?.file),
      imagePhone: publicUrl(image?.web?.imagePhone),
      video: publicUrl(video?.web?.video) ?? publicUrl(video?.file),
      videoPhone: publicUrl(video?.web?.videoPhone),
      poster: publicUrl(video?.web?.poster),
    };
    // JSON props: drop empties so the client never sees an undefined path.
    const clean = Object.fromEntries(Object.entries(plate).filter(([, v]) => v));
    if (Object.keys(clean).length) plates[id] = clean;
  }
  return plates;
}
