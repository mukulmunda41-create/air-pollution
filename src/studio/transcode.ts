// On Accept, make web-ready copies with local ffmpeg and sharp. The original stays untouched.
// Scrub copies carry a keyframe every 6 frames, so setting currentTime from scroll stays smooth.
import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import sharp from 'sharp';
import { assetsRoot } from './approved';
import type { Asset, WebFiles } from './types';

const run = promisify(execFile);

const scrub = (input: string, output: string, height: number, crf: number) =>
  run('ffmpeg', [
    '-y', '-loglevel', 'error', '-i', input, '-an',
    '-vf', `scale=-2:'min(${height},ih)'`,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', String(crf),
    '-g', '6', '-keyint_min', '6', '-sc_threshold', '0',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', output,
  ], { maxBuffer: 1024 * 1024 });

export async function makeWebFiles(asset: Asset): Promise<WebFiles> {
  const root = assetsRoot();
  const input = path.join(root, asset.file);
  const dir = path.dirname(asset.file);
  const base = path.basename(asset.file, path.extname(asset.file));
  const rel = (name: string) => path.posix.join(dir.split(path.sep).join('/'), 'web', name);
  await mkdir(path.join(root, dir, 'web'), { recursive: true });

  if (asset.kind === 'image') {
    const image = rel(`${base}__1920.webp`);
    const imagePhone = rel(`${base}__960.webp`);
    await sharp(input).resize({ width: 1920, withoutEnlargement: true }).webp({ quality: 80 }).toFile(path.join(root, image));
    await sharp(input).resize({ width: 960, withoutEnlargement: true }).webp({ quality: 76 }).toFile(path.join(root, imagePhone));
    return { image, imagePhone };
  }

  const video = rel(`${base}__720.mp4`);
  const videoPhone = rel(`${base}__480.mp4`);
  const poster = rel(`${base}__poster.webp`);
  await scrub(input, path.join(root, video), 720, 23);
  await scrub(input, path.join(root, videoPhone), 480, 26);
  const { stdout } = await run('ffmpeg', ['-loglevel', 'error', '-i', input, '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'], { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 });
  await writeFile(path.join(root, poster), await sharp(stdout as unknown as Buffer).resize({ width: 1920, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer());
  return { video, videoPhone, poster };
}
