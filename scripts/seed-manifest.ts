// Creates the asset library: one folder per scene, and manifest.json holding every scene's original
// prompts. Safe to re-run: it never overwrites an existing manifest. Run: node scripts/seed-manifest.ts
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { scenes } from '../src/content/scenes.ts';

const root = 'public/assets';
for (const s of scenes) {
  mkdirSync(`${root}/${s.id}`, { recursive: true });
  writeFileSync(`${root}/${s.id}/.gitkeep`, '');
}
const file = `${root}/manifest.json`;
if (existsSync(file)) {
  console.log('manifest.json already exists, left as it is');
} else {
  const now = new Date().toISOString();
  const rev = (kind: 'image' | 'video', fields: object) => ({ rev: 1, kind, fields, createdAt: now, author: 'director', trigger: 'seed' });
  writeFileSync(file, `${JSON.stringify({
    version: 1,
    updatedAt: now,
    scenes: Object.fromEntries(scenes.map((s) => [s.id, { id: s.id, prompts: { image: [rev('image', s.image)], video: [rev('video', s.video)] }, assets: [] }])),
  }, null, 2)}\n`);
  console.log('wrote', file);
}
