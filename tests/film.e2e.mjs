// End-to-end proof of the film's behavior. Needs a production build on :4400 (npm run prod).
// Run: node tests/film.e2e.mjs
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://127.0.0.1:4400';
const GPU = ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'];
let passed = 0;
const check = (name, fn) => Promise.resolve().then(fn).then(() => { passed++; console.log(`  ok  ${name}`); });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: GPU });

const open = async (url = '/', opts = {}) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  const page = await ctx.newPage();
  const errors = [];
  const requests = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('request', (r) => requests.push(r.url()));
  await page.goto(BASE + url);
  await page.waitForFunction(() => document.documentElement.classList.contains('is-loaded'), null, { timeout: 30000 });
  return { ctx, page, errors, requests };
};
const scrollTo = async (page, screens) => {
  await page.evaluate((s) => window.scrollTo(0, s * innerHeight), screens);
  await page.waitForTimeout(1000);
};
const liveGl = (page) => page.waitForFunction(() => document.documentElement.classList.contains('gl-on'), null, { timeout: 30000 });
const titleOffset = (page, id) => page.$eval(`#${id} .line__in`, (el) => {
  const r = el.getBoundingClientRect();
  const p = el.parentElement.getBoundingClientRect();
  return Math.round(r.top - p.top);
});

try {
  const a = await open();
  await liveGl(a.page);
  await a.page.waitForTimeout(2200);

  await check('the name is on screen and is the only h1', async () => {
    assert.equal(await a.page.locator('h1').count(), 1);
    assert.equal((await a.page.locator('h1').innerText()).trim(), 'AIR POLLUTION');
    assert.ok(await a.page.locator('h1').isVisible());
  });

  await check('your chapter lines are in the page, verbatim', async () => {
    const text = (await a.page.locator('#film').evaluate((el) => el.textContent)).replace(/\s+/g, ' ');
    for (const line of [
      'A WORLD', 'THAT COULD', 'BREATHE.', 'Once, the air around us was a symbol of life.',
      'THE AIR', 'BEGAN', 'TO CHANGE.', 'OUR PROGRESS', 'LEFT A TRACE.',
      'WE POLLUTE...', '...IS THE AIR', 'WE BREATHE.',
      'WHAT KIND', 'OF WORLD ARE WE', 'LEAVING BEHIND?',
      'THE FUTURE', 'IS NOT WRITTEN', 'IN SMOKE.',
      'AIR POLLUTION', 'IS A GLOBAL', 'CHALLENGE.', 'PROTECT THE AIR.', 'PROTECT LIFE.', 'THE NEXT BREATH IS OURS.',
    ]) assert.ok(text.includes(line), `missing: ${line}`);
  });

  await check('the canvas is live and sized to the window', async () => {
    const c = await a.page.$eval('#gl canvas', (el) => [el.clientWidth, el.clientHeight]);
    assert.deepEqual(c, [1440, 900]);
  });

  await check('scrolling reveals chapter 2, and scrolling back restores chapter 1', async () => {
    assert.ok(Math.abs(await titleOffset(a.page, 'ch-1')) < 12);
    await scrollTo(a.page, 5.5);
    assert.ok(Math.abs(await titleOffset(a.page, 'ch-2')) < 12, 'chapter 2 title settled');
    assert.equal(await a.page.$eval('#ch-1 .stage__in', (el) => getComputedStyle(el).visibility), 'hidden', 'chapter 1 has left');
    await scrollTo(a.page, 0);
    assert.ok(Math.abs(await titleOffset(a.page, 'ch-1')) < 12, 'chapter 1 title back');
    assert.equal(await a.page.$eval('#ch-1 .stage__in', (el) => getComputedStyle(el).visibility), 'visible');
    assert.ok((await titleOffset(a.page, 'ch-2')) > 50, 'chapter 2 title hidden again');
  });

  await check('the PM2.5 reading rises with the story and falls back', async () => {
    const read = () => a.page.locator('.hud__right span span').first().innerText().then(Number);
    assert.equal(await read(), 2);
    await scrollTo(a.page, 8);
    assert.ok((await read()) > 20);
    await scrollTo(a.page, 0);
    assert.equal(await read(), 2);
  });

  await check('chapter ticks are real links that travel there', async () => {
    await a.page.getByRole('link', { name: /Chapter 3/ }).click();
    await a.page.waitForFunction(() => Math.abs(document.getElementById('ch-3').getBoundingClientRect().top) < 4, null, { timeout: 6000 });
    await a.page.waitForTimeout(700);
    assert.equal(await a.page.getByRole('link', { name: /Chapter 3/ }).getAttribute('aria-current'), 'true');
    assert.match(await a.page.locator('.hud__now').innerText(), /^03 /);
    await scrollTo(a.page, 0);
  });

  await check('Pause stops the breath and Resume restarts it', async () => {
    const count = () => a.page.locator('.hud__breaths span').last().innerText().then(Number);
    const button = a.page.getByRole('button', { name: 'Pause' });
    await button.click();
    assert.equal(await a.page.getByRole('button', { name: 'Resume' }).getAttribute('aria-pressed'), 'true');
    const held = await count();
    await a.page.waitForTimeout(5600);
    assert.equal(await count(), held, 'no new breaths while paused');
    await a.page.getByRole('button', { name: 'Resume' }).click();
    await a.page.waitForTimeout(5600);
    assert.ok((await count()) > held, 'breathing again');
  });

  await check('chapter 3: over the approved picture, each source label appears on screen in turn', async () => {
    if (await a.page.locator('#ch-3 .art img').count() === 0) return; // with no picture, the labels stay a stack
    assert.ok(await a.page.evaluate(() => document.documentElement.classList.contains('pins')));
    for (const [screens, anchor] of [[10.4, 0], [11.35, 1], [12.3, 2], [13.2, 3]]) {
      await scrollTo(a.page, screens);
      const shown = await a.page.$$eval('#ch-3 [data-anchor]', (els) => els.filter((e) => getComputedStyle(e).visibility === 'visible').map((e) => {
        const r = e.getBoundingClientRect();
        return { a: Number(e.dataset.anchor), inside: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight };
      }));
      assert.deepEqual(shown, [{ a: anchor, inside: true }], `at ${screens} screens`);
    }
    const title = await a.page.$eval('#ch-3 .title .line:last-child', (e) => e.getBoundingClientRect().bottom);
    const label = await a.page.$eval('#ch-3 [data-anchor="3"]', (e) => e.getBoundingClientRect().top);
    assert.ok(label >= title - 1, 'labels stay clear of the title');
    await scrollTo(a.page, 0);
  });

  await check('the link to chapter 7 lands on its title, not on the flash before it', async () => {
    await a.page.getByRole('link', { name: /Chapter 7/ }).click();
    await a.page.waitForFunction(() => Math.abs(scrollY / innerHeight - 35.3) < 0.2, null, { timeout: 8000 });
    await a.page.waitForTimeout(700);
    assert.equal(await a.page.locator('#ch-7 .line__in').first().evaluate((el) => getComputedStyle(el).transform), 'matrix(1, 0, 0, 1, 0, 0)');
    assert.ok(await a.page.locator('#ch-7 .protect').isVisible());
  });

  await check('the finale draws Earth again, in space', async () => {
    await scrollTo(a.page, 36);
    assert.equal(await a.page.evaluate(() => document.documentElement.classList.contains('gl-on')), true);
    const poster = await a.page.$eval('#ch-7 .art img', (el) => getComputedStyle(el.closest('picture') ?? el).opacity);
    assert.equal(poster, '0', 'the still poster steps aside for the live planet');
  });

  await check('the final call to action goes to a real page', async () => {
    await scrollTo(a.page, 36);
    const cta = a.page.getByRole('link', { name: /THE NEXT BREATH IS OURS/ });
    assert.ok(await cta.isVisible());
    await cta.click();
    await a.page.waitForURL('**/sources#act', { timeout: 8000 });
    await a.page.getByRole('heading', { name: 'What you can do' }).waitFor();
    assert.equal(await a.page.locator('#gl').count(), 0, 'canvas released on leaving');
  });

  await check('leaving the film clears the desktop label mode', async () => {
    assert.equal(await a.page.evaluate(() => document.documentElement.classList.contains('pins')), false);
  });

  await check('going back rebuilds the film', async () => {
    await a.page.goBack();
    await a.page.waitForFunction(() => location.pathname === '/');
    await liveGl(a.page);
    await a.page.waitForTimeout(1500);
    assert.equal(await a.page.locator('#gl canvas').count(), 1);
    await a.page.evaluate(() => window.scrollTo(0, 0));
    await a.page.waitForTimeout(1000);
    assert.ok(Math.abs(await titleOffset(a.page, 'ch-1')) < 12);
  });

  await check('no errors in the whole session', () => assert.deepEqual(a.errors, []));
  await a.ctx.close();

  // Phones keep the labels as a readable stack, all visible together.
  const ph = await open('/', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  await liveGl(ph.page);
  await ph.page.waitForTimeout(1000);
  await check('phone: labels stay a stack, and nothing overflows', async () => {
    assert.equal(await ph.page.evaluate(() => document.documentElement.classList.contains('pins')), false);
    await scrollTo(ph.page, 11);
    const seen = await ph.page.$$eval('#ch-3 [data-anchor]', (els) => els.map((e) => {
      const r = e.getBoundingClientRect();
      return getComputedStyle(e).visibility === 'visible' && r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight;
    }));
    assert.deepEqual(seen, [true, true, true, true]);
    assert.equal(await ph.page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(ph.errors, []);
  });
  await ph.ctx.close();

  // Reduced motion: complete, still, and no WebGL work at all.
  const r = await open('/', { reducedMotion: 'reduce' });
  await r.page.waitForTimeout(1500);
  await check('reduced motion: no canvas, no textures, no smooth scroll', async () => {
    assert.equal(await r.page.locator('#gl').count(), 0);
    assert.ok(!r.requests.some((u) => u.includes('/textures/')), 'textures must not load');
    assert.equal(await r.page.evaluate(() => document.documentElement.classList.contains('lenis')), false);
  });
  await check('reduced motion: every chapter is visible as a normal page', async () => {
    for (let i = 1; i <= 7; i++) {
      await r.page.locator(`#ch-${i} .title`).first().scrollIntoViewIfNeeded();
      assert.ok(await r.page.locator(`#ch-${i} .title`).first().isVisible(), `chapter ${i}`);
      assert.ok(Math.abs(await titleOffset(r.page, `ch-${i}`)) < 12, `chapter ${i} title not masked`);
    }
    assert.ok(await r.page.getByText('...IS THE AIR').isVisible());
    assert.ok(await r.page.getByText('WE POLLUTE...').isVisible());
    assert.equal(await r.page.getByRole('button', { name: 'Pause' }).isVisible(), false, 'nothing moves, so nothing to pause');
  });
  await check('reduced motion: the Earth poster loads', async () => {
    await r.page.evaluate(() => window.scrollTo(0, 0));
    await r.page.waitForFunction(() => document.querySelector('#ch-1 .art img')?.naturalWidth > 0);
  });
  await r.ctx.close();

  // No WebGL: the film still reads, scroll animation included.
  const noGlBrowser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--disable-webgl', '--disable-webgl2', '--disable-3d-apis'] });
  const ng = await (await noGlBrowser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const ngErrors = [];
  ng.on('pageerror', (e) => ngErrors.push(String(e)));
  await ng.goto(BASE);
  await ng.waitForFunction(() => document.documentElement.classList.contains('is-loaded'), null, { timeout: 30000 });
  await ng.waitForTimeout(1800);
  await check('no WebGL: falls back to designed art with working scroll', async () => {
    assert.equal(await ng.locator('#gl').count(), 0);
    assert.equal(await ng.evaluate(() => document.documentElement.classList.contains('gl-on')), false);
    assert.ok(await ng.evaluate(() => document.querySelector('#ch-1 .art img').naturalWidth > 0), 'poster shown');
    await scrollTo(ng, 5.5);
    assert.ok(Math.abs(await titleOffset(ng, 'ch-2')) < 12);
    const bg = await ng.$eval('#ch-2 .art', (el) => getComputedStyle(el).backgroundImage);
    assert.match(bg, /gradient/);
    assert.equal(await ng.$eval('#ch-2 .art', (el) => getComputedStyle(el).visibility), 'visible');
    assert.deepEqual(ngErrors, []);
  });
  await noGlBrowser.close();

  // Without JavaScript, the crawler's view.
  const noJs = await (await browser.newContext({ javaScriptEnabled: false })).newPage();
  await noJs.goto(BASE);
  await check('no JavaScript: all seven chapters are present and readable', async () => {
    assert.equal(await noJs.locator('#loader').isVisible(), false);
    assert.equal(await noJs.locator('.chapter').count(), 7);
    assert.ok(await noJs.getByText('LEAVING BEHIND?').isVisible());
  });

  await check('production has no studio', async () => {
    for (const path of ['/studio', '/api/studio/state']) assert.equal((await fetch(BASE + path)).status, 404, path);
    assert.equal((await fetch(`${BASE}/api/studio/assets?scene=atmosphere&kind=image`, { method: 'POST', headers: { origin: BASE }, body: 'x' })).status, 404);
  });

  console.log(`\n${passed} checks passed`);
} finally {
  await browser.close();
}
