// End-to-end proof of the studio. Boots its own dev server against a THROWAWAY assets folder, so real
// uploads are never touched. Run: npm run test:studio
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';

const PORT = 4411;
const BASE = `http://127.0.0.1:${PORT}`;
const root = mkdtempSync(path.join(os.tmpdir(), 'air-pollution-e2e-'));
const assets = path.join(root, 'assets');
const fixtures = path.join(root, 'fixtures');
execFileSync('mkdir', ['-p', fixtures]);

// Real media made with ffmpeg, so probing and transcoding run for real.
const ff = (...args) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args]);
ff('-f', 'lavfi', '-i', 'color=c=#334455:s=1920x1080', '-frames:v', '1', path.join(fixtures, 'first.png'));
ff('-f', 'lavfi', '-i', 'color=c=#556677:s=1920x1080', '-frames:v', '1', path.join(fixtures, 'second.png'));
ff('-f', 'lavfi', '-i', 'color=c=#778899:s=1920x1080', '-frames:v', '1', path.join(fixtures, 'third.png'));
ff('-f', 'lavfi', '-i', 'testsrc=d=2:s=1280x720:r=24', '-pix_fmt', 'yuv420p', path.join(fixtures, 'clip.mp4'));
writeFileSync(path.join(fixtures, 'fake.png'), 'this is not an image at all');

const server = spawn('npx', ['next', 'dev', '-H', '127.0.0.1', '-p', String(PORT)], {
  cwd: process.cwd(),
  env: { ...process.env, ASSETS_ROOT: assets },
  stdio: 'ignore',
  detached: true,
});
const stop = () => { try { process.kill(-server.pid); } catch {} };
process.on('exit', stop);

let passed = 0;
const check = (name, fn) => Promise.resolve().then(fn).then(() => { passed++; console.log(`  ok  ${name}`); });
const manifest = () => JSON.parse(readFileSync(path.join(assets, 'manifest.json'), 'utf8'));
const scene = (id) => manifest().scenes[id];

for (let i = 0; i < 120; i++) {
  try { if ((await fetch(`${BASE}/api/studio/state`)).ok) break; } catch {}
  await new Promise((r) => setTimeout(r, 500));
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] });
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e)));

try {
  await page.goto(`${BASE}/studio`);
  await page.getByRole('button', { name: /The invisible enemy/ }).click();

  await check('every required part is on screen', async () => {
    for (const name of ['Scene', 'Visual style', 'Camera angle', 'Camera movement', 'Lighting', 'Composition', 'Environment', 'Color palette', 'Aspect ratio', 'Duration', 'Negative prompt', 'Continuity']) {
      assert.ok(await page.getByTestId('prompt-text').getByText(name, { exact: true }).count(), `missing ${name}`);
    }
    await page.getByText('Choose a file').waitFor();
    await page.getByRole('tab', { name: /video/i }).waitFor();
  });

  await check('Copy prompt really copies the text', async () => {
    await page.getByRole('button', { name: 'Copy prompt' }).click();
    const text = await page.evaluate(() => navigator.clipboard.readText());
    assert.match(text, /^Scene: /);
    assert.match(text, /Negative prompt: /);
  });

  await check('upload by file input', async () => {
    await page.getByLabel('Choose image file').setInputFiles(path.join(fixtures, 'first.png'));
    await page.getByRole('heading', { name: 'Review version 1' }).waitFor();
    const a = scene('atmosphere').assets[0];
    assert.equal(a.version, 1);
    assert.equal(a.file, 'atmosphere/atmosphere__image__v001.png');
    assert.equal(a.status, 'review', 'an upload must wait for review');
    assert.equal(a.width, 1920);
    assert.ok(existsSync(path.join(assets, a.file)));
  });

  await check('preview shows the real file', async () => {
    const img = page.getByRole('img', { name: /Version 1/ });
    await img.waitFor();
    await page.waitForFunction(() => document.querySelector('main img')?.naturalWidth === 1920);
  });

  await check('a refresh loses nothing', async () => {
    await page.reload();
    await page.getByRole('button', { name: /The invisible enemy/ }).click();
    await page.getByRole('heading', { name: 'Review version 1' }).waitFor();
    assert.equal(await page.getByTestId('viewing-status').innerText(), 'In review');
  });

  const original = scene('atmosphere').prompts.image[0].fields.vfx;

  await check('Reject asks for feedback first', async () => {
    await page.getByRole('button', { name: 'Reject', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'Reject and revise prompt' }).isDisabled(), true);
  });

  await check('Reject preserves everything and revises the prompt', async () => {
    const before = readdirSync(path.join(assets, 'atmosphere')).length;
    await page.getByLabel(/What is wrong with it/).fill('The smoke looks artificial. Camera movement is too fast. The environment needs more realistic lighting. Make the scene cinematic and natural.');
    await page.getByRole('button', { name: 'Reject and revise prompt' }).click();
    await page.getByRole('heading', { name: 'What changed in revision 2' }).waitFor();
    const s = scene('atmosphere');
    assert.equal(s.assets[0].status, 'rejected');
    assert.match(s.assets[0].feedback, /smoke looks artificial/);
    assert.ok(existsSync(path.join(assets, s.assets[0].file)), 'rejected file must stay on disk');
    assert.equal(readdirSync(path.join(assets, 'atmosphere')).length, before);
    assert.equal(s.prompts.image.length, 2);
    assert.equal(s.prompts.image[0].fields.vfx, original, 'the original prompt must not change');
    assert.notEqual(s.prompts.image[1].fields.vfx, original);
    assert.notEqual(s.prompts.image[1].fields.lighting, s.prompts.image[0].fields.lighting);
    assert.ok(s.prompts.image[1].changes.length >= 5);
    assert.ok(await page.getByText('Your note:').count());
    assert.ok(await page.getByText(/Camera moved too fast/).count(), 'explains what changed');
  });

  await check('rejecting does not accept anything, and the film stays clean', async () => {
    assert.ok(!scene('atmosphere').assets.some((a) => a.status === 'accepted'));
    const html = await (await fetch(`${BASE}/`)).text();
    assert.ok(!html.includes('atmosphere__image__v001'), 'a rejected file must never reach the film');
  });

  await check('upload by drag and drop', async () => {
    const data = readFileSync(path.join(fixtures, 'second.png')).toString('base64');
    const drop = await page.evaluateHandle((b64) => {
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const dt = new DataTransfer();
      dt.items.add(new File([bytes], 'second.png', { type: 'image/png' }));
      return dt;
    }, data);
    await page.getByTestId('dropzone').dispatchEvent('drop', { dataTransfer: drop });
    await page.getByRole('heading', { name: 'Review version 2' }).waitFor();
    const a = scene('atmosphere').assets[1];
    assert.equal(a.file, 'atmosphere/atmosphere__image__v002.png');
    assert.equal(a.promptRev, 2, 'tied to the revision it was generated from');
    assert.equal(a.status, 'review');
  });

  await check('a second round of the same complaint escalates', async () => {
    await page.getByRole('button', { name: 'Reject', exact: true }).click();
    await page.getByLabel(/What is wrong with it/).fill('Camera is still too fast.');
    await page.getByRole('button', { name: 'Reject and revise prompt' }).click();
    await page.getByRole('heading', { name: 'What changed in revision 3' }).waitFor();
    assert.match(scene('atmosphere').prompts.image[2].fields.cameraMove, /2% of frame/);
    assert.ok(await page.getByText(/second note on this/).count());
  });

  await check('every revision stays viewable', async () => {
    await page.getByRole('combobox').selectOption('1');
    await page.getByRole('combobox').selectOption('3');
    assert.equal(await page.getByRole('combobox').locator('option').count(), 3);
  });

  await check('Regenerate with no note gives a genuinely different take', async () => {
    const before = scene('atmosphere').prompts.image.length;
    await page.getByRole('button', { name: 'Regenerate prompt' }).click();
    await page.getByRole('heading', { name: `What changed in revision ${before + 1}` }).waitFor();
    const list = scene('atmosphere').prompts.image;
    assert.equal(list.length, before + 1);
    assert.equal(list[before].trigger, 'alternate');
    assert.notDeepEqual(list[before].fields, list[before - 1].fields);
  });

  await check('third cycle, then Accept', async () => {
    await page.getByLabel('Choose image file').setInputFiles(path.join(fixtures, 'third.png'));
    await page.getByRole('heading', { name: 'Review version 3' }).waitFor();
    assert.ok(await page.getByRole('button', { name: 'Reject', exact: true }).isEnabled());
    await page.getByRole('button', { name: 'Accept', exact: true }).click();
    await page.getByRole('button', { name: 'Continue to next scene' }).waitFor({ timeout: 60000 });
    const a = scene('atmosphere').assets[2];
    assert.equal(a.status, 'accepted');
    assert.ok(existsSync(path.join(assets, a.web.image)), 'web copy written');
    assert.ok(existsSync(path.join(assets, a.web.imagePhone)), 'phone copy written');
    assert.equal(await page.getByTestId('viewing-status').innerText(), 'Accepted');
  });

  await check('the film now uses the accepted asset, and nothing else', async () => {
    const html = await (await fetch(`${BASE}/`)).text();
    assert.ok(html.includes('atmosphere__image__v003'), 'accepted asset reaches the film');
    assert.ok(!html.includes('atmosphere__image__v001'));
    assert.ok(!html.includes('atmosphere__image__v002'));
  });

  await check('a missing file never reaches the film', async () => {
    const a = scene('atmosphere').assets[2];
    const web = path.join(assets, a.web.image);
    const orig = path.join(assets, a.file);
    const phone = path.join(assets, a.web.imagePhone);
    const keep = [web, orig, phone].map((p) => [p, readFileSync(p)]);
    keep.forEach(([p]) => rmSync(p));
    const html = await (await fetch(`${BASE}/`)).text();
    assert.ok(!html.includes('atmosphere__image__v003'));
    keep.forEach(([p, b]) => writeFileSync(p, b));
  });

  await check('Continue goes to the next scene', async () => {
    await page.getByRole('button', { name: 'Continue to next scene' }).click();
    await page.getByRole('heading', { name: 'The cost of progress' }).waitFor();
  });

  await check('video upload, preview and scrub-ready copies', async () => {
    await page.getByRole('tab', { name: /video/i }).click();
    await page.getByLabel('Choose video file').setInputFiles(path.join(fixtures, 'clip.mp4'));
    await page.getByRole('heading', { name: 'Review version 1' }).waitFor();
    await page.waitForFunction(() => document.querySelector('main video')?.readyState >= 1);
    const a0 = scene('polluted-city').assets[0];
    assert.equal(a0.width, 1280);
    assert.ok(Math.abs(a0.durationSec - 2) < 0.2);
    await page.getByRole('button', { name: 'Accept', exact: true }).click();
    await page.getByRole('button', { name: 'Continue to next scene' }).waitFor({ timeout: 120000 });
    const a = scene('polluted-city').assets[0];
    for (const f of [a.web.video, a.web.videoPhone, a.web.poster]) assert.ok(statSync(path.join(assets, f)).size > 0, f);
    const keyframes = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-skip_frame', 'nokey', '-show_entries', 'frame=pict_type', '-of', 'csv=p=0', path.join(assets, a.web.video)]).toString().trim().split('\n').length;
    assert.ok(keyframes >= 8, `scrub copy needs frequent keyframes, got ${keyframes} in 48 frames`);
    assert.equal(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=codec_type', '-of', 'csv=p=0', path.join(assets, a.web.video)]).toString().trim(), '', 'no audio track');
  });

  await check('a file route serves video ranges so seeking works', async () => {
    const a = scene('polluted-city').assets[0];
    const url = `${BASE}/api/studio/file/${a.file}`;
    const res = await fetch(url, { headers: { range: 'bytes=0-99' } });
    assert.equal(res.status, 206);
    assert.equal(res.headers.get('content-range')?.startsWith('bytes 0-99/'), true);
    assert.equal((await res.arrayBuffer()).byteLength, 100);
  });

  await check('replacing an accepted asset keeps the old one live until the new one is accepted', async () => {
    await page.getByRole('button', { name: /The invisible enemy/ }).click();
    await page.getByRole('tab', { name: /image/i }).click();
    await page.getByLabel('Choose image file').setInputFiles(path.join(fixtures, 'first.png'));
    await page.getByRole('heading', { name: 'Review version 4' }).waitFor();
    let html = await (await fetch(`${BASE}/`)).text();
    assert.ok(html.includes('atmosphere__image__v003'), 'old one still live');
    await page.getByRole('button', { name: 'Accept', exact: true }).click();
    await page.getByTestId('viewing-status').getByText('Accepted').waitFor({ timeout: 60000 });
    const s = scene('atmosphere');
    assert.equal(s.assets[2].status, 'superseded');
    assert.equal(s.assets[3].status, 'accepted');
    assert.ok(existsSync(path.join(assets, s.assets[2].file)), 'replaced file still on disk');
    html = await (await fetch(`${BASE}/`)).text();
    assert.ok(html.includes('atmosphere__image__v004'));
  });

  await check('version history lists every version with its status', async () => {
    const history = page.getByRole('region', { name: 'Version history' });
    assert.equal(await history.getByRole('listitem').count(), 4);
    await history.getByRole('button', { name: /v001/ }).click();
    await page.getByRole('heading', { name: 'Review version 1' }).waitFor();
    assert.equal(await page.getByTestId('viewing-status').innerText(), 'Rejected');
  });

  // Trust boundary.
  const post = (url, init = {}) => fetch(`${BASE}${url}`, { method: 'POST', ...init, headers: { origin: BASE, ...(init.headers ?? {}) } });

  await check('a file pretending to be an image is refused and nothing is saved', async () => {
    const n = scene('human-lungs')?.assets.length ?? 0;
    const res = await post('/api/studio/assets?scene=human-lungs&kind=image', { body: readFileSync(path.join(fixtures, 'fake.png')) });
    assert.equal(res.status, 415);
    assert.equal(scene('human-lungs')?.assets.length ?? 0, n);
    assert.deepEqual(readdirSync(path.join(assets, '.incoming')), [], 'temp file cleaned up');
  });

  await check('a video in the image slot is refused', async () => {
    const res = await post('/api/studio/assets?scene=human-lungs&kind=image', { body: readFileSync(path.join(fixtures, 'clip.mp4')) });
    assert.equal(res.status, 415);
  });

  await check('unknown scenes and path tricks are refused', async () => {
    assert.equal((await post('/api/studio/assets?scene=../../etc&kind=image', { body: 'x' })).status, 400);
    assert.equal((await post('/api/studio/assets?scene=constructor&kind=image', { body: 'x' })).status, 400);
    const bad = await fetch(`${BASE}/api/studio/file/..%2F..%2F..%2Fetc%2Fpasswd.png`);
    assert.equal(bad.status, 404);
    const manifestFile = await fetch(`${BASE}/api/studio/file/manifest.json`);
    assert.equal(manifestFile.status, 404);
  });

  await check('a filename cannot choose where a file lands', async () => {
    const res = await post('/api/studio/assets?scene=human-lungs&kind=image', {
      headers: { 'x-file-name': encodeURIComponent('../../../evil.png') },
      body: readFileSync(path.join(fixtures, 'first.png')),
    });
    assert.equal(res.status, 201);
    const { asset } = await res.json();
    assert.equal(asset.file, 'human-lungs/human-lungs__image__v001.png');
    assert.ok(!existsSync(path.join(root, 'evil.png')));
  });

  await check('requests from other sites are refused', async () => {
    const res = await fetch(`${BASE}/api/studio/assets/x`, { method: 'POST', headers: { origin: 'https://evil.example', 'content-type': 'application/json' }, body: '{"action":"accept"}' });
    assert.equal(res.status, 403);
    const none = await fetch(`${BASE}/api/studio/assets/x`, { method: 'POST', body: '{"action":"accept"}' });
    assert.equal(none.status, 403);
  });

  await check('nothing was ever accepted except by clicking Accept', async () => {
    const m = manifest();
    const accepted = Object.values(m.scenes).flatMap((s) => s.assets).filter((a) => a.status === 'accepted').map((a) => a.file);
    assert.deepEqual(accepted.sort(), ['atmosphere/atmosphere__image__v004.png', 'polluted-city/polluted-city__video__v001.mp4']);
    assert.equal(scene('human-lungs').assets[0].status, 'review', 'an API upload still waits for review');
  });

  await check('no page errors', () => assert.deepEqual(pageErrors, []));

  console.log(`\n${passed} checks passed`);
} finally {
  await browser.close();
  stop();
  rmSync(root, { recursive: true, force: true });
}
