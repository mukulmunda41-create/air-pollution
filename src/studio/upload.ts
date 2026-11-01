// Takes an uploaded stream, checks what it really is, and files it under the naming convention.
// Trust boundary: the client's filename and type are never used to decide anything. Server only.
import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, open, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream as WebStream } from 'node:stream/web';
import { promisify } from 'node:util';
import sharp from 'sharp';
import { assetsRoot } from './approved';
import { latestRev, mutate, sceneState } from './manifest';
import { assetFileName } from './status';
import type { Asset, AssetKind } from './types';

const run = promisify(execFile);
export const LIMIT = { image: 30 * 1024 * 1024, video: 500 * 1024 * 1024 } as const;

export class UploadError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

type Sniffed = { kind: AssetKind; ext: string; mime: string };

// Magic bytes, so a renamed file cannot pass for something it is not.
export function sniff(b: Buffer): Sniffed | null {
  if (b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { kind: 'image', ext: 'png', mime: 'image/png' };
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { kind: 'image', ext: 'jpg', mime: 'image/jpeg' };
  if (b.length >= 12 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') return { kind: 'image', ext: 'webp', mime: 'image/webp' };
  if (b.length >= 12 && b.toString('latin1', 4, 8) === 'ftyp') {
    const brand = b.toString('latin1', 8, 12);
    if (brand === 'avif' || brand === 'avis') return { kind: 'image', ext: 'avif', mime: 'image/avif' };
    if (brand.startsWith('qt')) return { kind: 'video', ext: 'mov', mime: 'video/quicktime' };
    return { kind: 'video', ext: 'mp4', mime: 'video/mp4' };
  }
  if (b.length >= 4 && b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return { kind: 'video', ext: 'webm', mime: 'video/webm' };
  return null;
}

async function probe(file: string, kind: AssetKind) {
  if (kind === 'image') {
    const m = await sharp(file).metadata();
    return { width: m.width, height: m.height };
  }
  const { stdout } = await run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:format=duration', '-of', 'json', file]);
  const j = JSON.parse(stdout);
  if (!j.streams?.[0]) throw new Error('no video stream');
  return { width: j.streams[0].width, height: j.streams[0].height, durationSec: Number(j.format?.duration) || undefined };
}

export async function receiveUpload(body: WebStream<Uint8Array>, scene: string, kind: AssetKind, originalName: string): Promise<Asset> {
  const incoming = path.join(assetsRoot(), '.incoming');
  await mkdir(incoming, { recursive: true });
  const tmp = path.join(incoming, randomUUID());
  let bytes = 0;
  const counter = new Transform({
    transform(chunk, _enc, cb) {
      bytes += chunk.length;
      if (bytes > LIMIT[kind]) cb(new UploadError(`That file is over the ${LIMIT[kind] / 1024 / 1024} MB limit for this type.`, 413));
      else cb(null, chunk);
    },
  });
  try {
    await pipeline(Readable.fromWeb(body), counter, createWriteStream(tmp));
    if (!bytes) throw new UploadError('That file is empty.');

    const head = Buffer.alloc(32);
    const fh = await open(tmp, 'r');
    await fh.read(head, 0, 32, 0);
    await fh.close();
    const type = sniff(head);
    if (!type) throw new UploadError('That is not a supported file. Use PNG, JPG, WebP or AVIF for images, and MP4, MOV or WebM for videos.', 415);
    if (type.kind !== kind) throw new UploadError(`That is a ${type.kind} file. This slot takes a ${kind}.`, 415);

    let meta;
    try {
      meta = await probe(tmp, kind);
    } catch {
      throw new UploadError(`That ${kind} could not be read. It may be damaged.`, 415);
    }

    return await mutate(async (m) => {
      const s = sceneState(m, scene);
      const version = s.assets.filter((a) => a.kind === kind).reduce((v, a) => Math.max(v, a.version), 0) + 1;
      const file = `${scene}/${assetFileName(scene, kind, version, type.ext)}`;
      await mkdir(path.join(assetsRoot(), scene), { recursive: true });
      await rename(tmp, path.join(assetsRoot(), file));
      const asset: Asset = {
        id: randomUUID(),
        kind,
        version,
        file,
        originalName: originalName.slice(0, 200),
        bytes,
        mime: type.mime,
        ...meta,
        promptRev: latestRev(s, kind).rev,
        status: 'review', // never accepted automatically: only your click changes this
        uploadedAt: new Date().toISOString(),
      };
      s.assets.push(asset);
      return asset;
    });
  } catch (e) {
    await rm(tmp, { force: true });
    throw e;
  }
}
