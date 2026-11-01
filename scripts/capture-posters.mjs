// Renders the DOM posters from the real scene, with no text over it. Used as the first paint, under
// the canvas, and as Earth for visitors without WebGL. Needs the site running: node scripts/capture-posters.mjs [url]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';

const url = process.argv[2] ?? 'http://127.0.0.1:3000/';
mkdirSync('public/posters', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
for (const [name, width, height] of [['earth-wide', 1920, 1200], ['earth-tall', 800, 1733]]) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(url);
  await page.waitForFunction(() => document.documentElement.classList.contains('gl-on'), null, { timeout: 30000 });
  await page.waitForFunction(() => document.documentElement.classList.contains('is-loaded'), null, { timeout: 30000 });
  await page.addStyleTag({ content: '.stage,.hud,.frame,#loader{visibility:hidden!important}' });
  await page.waitForTimeout(2200);
  const png = await page.screenshot({ type: 'png' });
  await sharp(png).webp({ quality: 80 }).toFile(`public/posters/${name}.webp`);
  await page.close();
  console.log(name);
}
await browser.close();
