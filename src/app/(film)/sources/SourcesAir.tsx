'use client';
// Wind around a planet. A globe of dots turns and breathes with the film, and lines of air part around it,
// and around the pointer too. Tangled and grey by the title; as you read they calm down and turn clean blue,
// the globe leaves, and the reading falls with them. Behind the text, on the film's one clock. Under reduced
// motion it holds still and only follows the scroll.
import { gsap } from 'gsap';
import { useRef } from 'react';
import { prefersReducedMotion } from '@/engine';
import { usePage } from '@/engine/next';
import { story } from '@/story/state';

const SMOG = [150, 146, 134];
const CLEAN = [127, 184, 232];
const EMBER = [232, 121, 43];
const STEP = 14; // pixels between points along a line
const SUN = [-0.68, 0.3, 0.67]; // from the left and in front, so the globe is lit as Earth is in the film
const INDIA = -78; // degrees of turn that face the globe's start toward the film's last view

const mix = (a: number[], b: number[], k: number) => a.map((c, i) => Math.round(c + (b[i] - c) * k));
const ease = (k: number) => { const c = Math.min(Math.max(k, 0), 1); return c * c * (3 - 2 * c); };

export function SourcesAir() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reading = useRef<HTMLSpanElement>(null);

  usePage(() => {
    // Below the first screen, text scrolls under the header, which then needs a solid edge.
    const html = document.documentElement;
    const top = document.querySelector('.page__top');
    const header = new IntersectionObserver(([e]) => html.classList.toggle('past-hero', !e.isIntersecting), { rootMargin: '-96px 0px 0px 0px' });
    if (top) header.observe(top);

    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return () => header.disconnect();

    let w = 0;
    let h = 0;
    const size = () => {
      const dpr = Math.min(devicePixelRatio, 1.5);
      w = innerWidth;
      h = innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();

    const count = w < 768 ? 26 : 54;
    // Which lines fade first as the air clears. Spread out, so the survivors stay evenly spaced.
    const rank = Array.from({ length: count }, (_, i) => (i * 17) % count);
    const beads = Array.from({ length: w < 768 ? 22 : 54 }, () => ({
      line: Math.floor(Math.random() * count),
      at: Math.random(),
      speed: 0.0005 + Math.random() * 0.0011,
      size: 0.8 + Math.random() ** 2 * 1.7,
    }));

    // The globe's land, read once from the Earth texture the film already has, as dots on the sphere.
    const land: number[] = [];
    const map = new Image();
    map.src = '/textures/earth/phone/earth_day_2048.jpg';
    map.onload = () => {
      const small = document.createElement('canvas');
      small.width = 360;
      small.height = 180;
      const read = small.getContext('2d', { willReadFrequently: true });
      if (!read) return;
      read.drawImage(map, 0, 0, 360, 180);
      const px = read.getImageData(0, 0, 360, 180).data;
      const gap = w < 768 ? 3.2 : 2.3;
      for (let lat = -82; lat <= 82; lat += gap) {
        const ring = Math.cos((lat * Math.PI) / 180);
        const n = Math.max(1, Math.round((360 / gap) * ring));
        for (let i = 0; i < n; i++) {
          const lon = -180 + (i * 360) / n;
          const at = (Math.min(179, Math.floor(90 - lat)) * 360 + Math.min(359, Math.floor(lon + 180))) * 4;
          // Ocean in this texture is blue and dark. Land, ice and desert are not.
          if (px[at + 2] > px[at] * 1.25 && px[at + 2] > px[at + 1] * 1.05 && px[at] < 90) continue;
          const l = (lon * Math.PI) / 180;
          land.push(ring * Math.sin(l), Math.sin((lat * Math.PI) / 180), ring * Math.cos(l));
        }
      }
      if (prefersReducedMotion()) draw(0);
    };

    const pointer = { x: -1e4, y: -1e4, ex: -1e4, ey: -1e4 };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      if (pointer.x < -1e3) { pointer.ex = e.clientX; pointer.ey = e.clientY; }
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    };

    const draw = (t: number) => {
      const range = html.scrollHeight - h;
      const read = range > 0 ? Math.min(scrollY / range, 1) : 0;
      const calm = ease(read / 0.7);
      const wild = 1 - calm;
      const breath = story.breath;
      const hero = 1 - ease(scrollY / (h * 0.85)); // the planet belongs to the first screen

      const R = (w < 768 ? w * 0.34 : h * 0.3) * hero * (1 + breath * 0.022);
      const cx = w < 768 ? w * 0.68 : w * 0.76;
      const cy = (w < 768 ? h * 0.56 : h * 0.5) - scrollY * 0.3;
      const R2 = R * R;
      pointer.ex += (pointer.x - pointer.ex) * 0.12;
      pointer.ey += (pointer.y - pointer.ey) * 0.12;
      const P2 = 46 * 46;

      // One point of a line of wind: the wave, then pushed clear of the planet and the pointer.
      let px = 0;
      let py = 0;
      const rest = (line: number) => ((line + 0.5) / count) * h * 1.2 - h * 0.1;
      const place = (x: number, line: number) => {
        const y0 = rest(line);
        const j = line;
        let y = y0
          + Math.sin(x * 0.0031 + t * 0.2 + j * 0.61) * (10 + wild * 26)
          + Math.sin(x * 0.0083 - t * 0.28 + j * 1.7) * wild * 22
          + Math.sin(x * 0.021 + t * 0.43 + j * 2.9) * wild * wild * 12
          + (y0 - h / 2) * breath * 0.014;
        let dx = x - cx;
        let dy = y - cy;
        if (R2 > 1) {
          // A line keeps to its own side of the planet, or the wave would throw it across the disc.
          const side = y0 >= cy ? 1 : -1;
          dy += (Math.max(dy * side, 8) * side - dy) * (1 - ease((Math.abs(dx) - R * 0.9) / (R * 0.7)));
        }
        let s = R2 > 1 ? Math.sqrt(1 + R2 / (dx * dx + dy * dy + 1)) : 1;
        px = cx + dx * s;
        y = cy + dy * s;
        dx = px - pointer.ex;
        dy = y - pointer.ey;
        s = Math.sqrt(1 + P2 / (dx * dx + dy * dy + 1));
        px = pointer.ex + dx * s;
        py = pointer.ey + dy * s;
      };

      ctx.clearRect(0, 0, w, h);
      const shown = count * (1 - read * 0.66);
      const base = mix(SMOG, CLEAN, ease(read / 0.55));
      const hot = mix(EMBER, base, ease(read / 0.3));
      ctx.lineWidth = 1;
      for (let j = 0; j < count; j++) {
        const on = Math.min(Math.max(shown - rank[j], 0), 1);
        if (on <= 0) continue;
        const c = j % 9 === 4 ? hot : base;
        ctx.strokeStyle = `rgb(${c[0]} ${c[1]} ${c[2]} / ${on * (0.12 + hero * 0.3 + wild * 0.06)})`;
        // Finer steps where a line bends round the planet, so the curve stays a curve.
        const hugs = R > 2 && Math.abs(rest(j) - cy) < R * 1.5;
        ctx.beginPath();
        for (let x = -60; x <= w + 60; x += hugs && Math.abs(x - cx) < R * 1.3 ? 3 : STEP) {
          place(x, j);
          if (x === -60) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      // What the air carries: specks riding the lines, some still burning near the top of the page.
      beads.forEach((b, i) => {
        if (shown - rank[b.line] <= 0) return;
        b.at = (b.at + b.speed * (1 + breath * 0.3) * gsap.ticker.deltaRatio()) % 1;
        place(b.at * (w + 120) - 60, b.line);
        const c = i % 4 === 0 ? hot : base;
        ctx.fillStyle = `rgb(${c[0]} ${c[1]} ${c[2]} / ${0.45 + hero * 0.35})`;
        ctx.beginPath();
        ctx.arc(px, py, b.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // The planet: its land in dots, bright by day. A few still burn on the night side.
      if (R > 2 && land.length) {
        const turn = ((INDIA + t * 2.2) * Math.PI) / 180 + read * 2;
        const cos = Math.cos(turn);
        const sin = Math.sin(turn);
        const size = w < 768 ? 1.5 : 1.8;
        const glowing: number[] = [];
        ctx.fillStyle = 'rgb(176 212 240)';
        for (let i = 0; i < land.length; i += 3) {
          const x = land[i] * cos + land[i + 2] * sin;
          const z = land[i + 2] * cos - land[i] * sin;
          if (z < 0.04) continue;
          const y = land[i + 1];
          const lit = x * SUN[0] + y * SUN[1] + z * SUN[2];
          const sx = cx + x * R;
          const sy = cy - y * R;
          if (lit < 0.08 && i % 33 === 0) glowing.push(sx, sy);
          ctx.globalAlpha = hero * Math.min(z * 2.2, 1) * (0.14 + Math.max(lit, 0) * 0.86);
          ctx.fillRect(sx, sy, size, size);
        }
        ctx.fillStyle = 'rgb(232 121 43)';
        ctx.globalAlpha = hero * 0.9;
        for (let i = 0; i < glowing.length; i += 2) ctx.fillRect(glowing[i], glowing[i + 1], size, size);
        ctx.globalAlpha = 1;
      }

      // The planet's edge: thin air, lit from the left, as in the film.
      if (R > 2) {
        const glow = ctx.createRadialGradient(cx - R * 0.08, cy - R * 0.04, R * 0.92, cx, cy, R * 1.16);
        glow.addColorStop(0, 'rgb(127 184 232 / 0)');
        glow.addColorStop(0.28, `rgb(127 184 232 / ${0.34 * hero})`);
        glow.addColorStop(1, 'rgb(127 184 232 / 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, R * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // The film's reading, falling to the WHO guideline as the air clears.
      if (reading.current) {
        const value = String(Math.round(150 - 145 * calm));
        if (reading.current.textContent !== value) reading.current.textContent = value;
      }
    };

    const still = prefersReducedMotion();
    const redraw = () => draw(0);
    const tick = () => { if (!document.hidden) draw(gsap.ticker.time); };
    const onSize = () => { size(); if (still) redraw(); };
    addEventListener('resize', onSize);
    if (still) {
      addEventListener('scroll', redraw, { passive: true });
      redraw();
    } else {
      addEventListener('pointermove', onMove, { passive: true });
      gsap.ticker.add(tick);
    }
    return () => {
      gsap.ticker.remove(tick);
      removeEventListener('resize', onSize);
      removeEventListener('scroll', redraw);
      removeEventListener('pointermove', onMove);
      header.disconnect();
      html.classList.remove('past-hero');
    };
  });

  return (
    <>
      <canvas ref={ref} className="page__air" aria-hidden="true" />
      <p className="page__reading" title="An illustrative value, not a live measurement. WHO annual guideline: 5 µg/m³.">
        PM2.5 <span ref={reading}>150</span> <span className="hud__dim">µg/m³, illustrative</span>
      </p>
    </>
  );
}
