// Film probe: real-GPU frame rates and frames at chosen scroll positions.
//   node scripts/probe.mjs [url] [outDir] [width] [height] [dpr] [screens...]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const [url = 'http://127.0.0.1:3000/', out = '.shots/probe', w = '1440', h = '900', dpr = '2', ...rest] = process.argv.slice(2);
const screens = rest.length ? rest.map(Number) : [0, 1.5, 3, 4, 5, 5.6, 6, 6.5, 7.2, 8];
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
});
const phone = +w < 768;
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +dpr, hasTouch: phone, isMobile: phone });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
page.on('requestfailed', (r) => errors.push(`failed: ${r.url()}`));
page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()}: ${r.url()}`); });

await page.goto(url);
await page.waitForFunction(() => document.documentElement.classList.contains('is-loaded'), null, { timeout: 30000 });
await page.waitForFunction(() => document.documentElement.classList.contains('gl-on'), null, { timeout: 30000 }).catch(() => errors.push('gl-on never set'));
await page.waitForTimeout(2200);

const info = await page.evaluate(() => {
  const c = document.createElement('canvas').getContext('webgl2');
  const d = c?.getExtension('WEBGL_debug_renderer_info');
  const main = document.querySelector('#gl canvas');
  return { gpu: d ? c.getParameter(d.UNMASKED_RENDERER_WEBGL) : null, canvas: main && [main.width, main.height] };
});
console.log(info);

const fps = () => page.evaluate(() => new Promise((res) => {
  let n = 0; const t0 = performance.now();
  const f = () => { n++; if (performance.now() - t0 > 1500) res(+(n / 1.5).toFixed(1)); else requestAnimationFrame(f); };
  requestAnimationFrame(f);
}));

for (const s of screens) {
  await page.evaluate((y) => window.scrollTo(0, y * innerHeight), s);
  await page.waitForTimeout(900);
  const rate = await fps();
  const name = `${out}/s${String(s).replace('.', '_')}.jpg`;
  await page.screenshot({ path: name, type: 'jpeg', quality: 82 });
  console.log(`screen ${s}: ${rate} fps`);
}
console.log(errors.length ? { errors: [...new Set(errors)] } : 'no errors');
await browser.close();
