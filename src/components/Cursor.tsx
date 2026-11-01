'use client';
// The pointer is one more particle in the film's air: an ember that sheds dust as it moves, dirtier where
// the air is dirtier, with a ring that breathes with the film and opens over anything you can press.
// Mouse only, and absent under reduced motion. The native cursor stays until this one has really moved.
import { gsap } from 'gsap';
import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '@/engine';
import { story } from '@/story/state';

const MAX = 90;
const SPACING = 9; // pixels of travel per puff of dust

type Mote = { x: number; y: number; vx: number; vy: number; r: number; age: number; life: number; ember: boolean };

export function Cursor() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    const ctx = canvas.current?.getContext('2d');
    if (!el || !ctx || !canvas.current || prefersReducedMotion() || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const html = document.documentElement;

    const size = () => {
      const dpr = Math.min(devicePixelRatio, 1.5);
      canvas.current!.width = innerWidth * dpr;
      canvas.current!.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();

    const dust: Mote[] = [];
    const at = { x: 0, y: 0 };
    const eased = { x: 0, y: 0 };
    let scale = 1;
    let over = false;
    let down = false;
    let travelled = 0;
    let moved = false;

    const shed = (x: number, y: number) => {
      // Clean air leaves almost nothing behind. Choked air leaves a trail.
      const count = 2 + Math.round(story.air * 3);
      for (let i = 0; i < count; i++) {
        if (dust.length >= MAX) dust.shift();
        dust.push({
          x: x + (Math.random() - 0.5) * 10,
          y: y + (Math.random() - 0.5) * 10,
          vx: (Math.random() - 0.5) * 0.35,
          vy: -0.12 - Math.random() * 0.35,
          r: 0.8 + Math.random() ** 2 * 2.4,
          age: 0,
          life: 60 + Math.random() * 70,
          ember: Math.random() < 0.05 + story.air * 0.1,
        });
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      if (!moved) {
        moved = true;
        eased.x = e.clientX;
        eased.y = e.clientY;
        html.classList.add('has-cursor');
      } else {
        travelled += Math.hypot(e.clientX - at.x, e.clientY - at.y);
        if (travelled > SPACING) {
          travelled = 0;
          shed(e.clientX, e.clientY);
        }
      }
      at.x = e.clientX;
      at.y = e.clientY;
      el.classList.add('is-on');
      const target = e.target instanceof Element ? e.target : null;
      over = !!target?.closest('a, button, [role="button"], summary');
      el.classList.toggle('is-over', over);
    };
    const onLeave = () => el.classList.remove('is-on');
    const onDown = () => { down = true; };
    const onUp = () => { down = false; };

    let drew = false;
    const tick = () => {
      if (document.hidden) return;
      const step = gsap.ticker.deltaRatio();
      const follow = 1 - Math.pow(0.8, step);
      eased.x += (at.x - eased.x) * follow;
      eased.y += (at.y - eased.y) * follow;
      const goal = (over ? 1.7 : 1) * (down ? 0.8 : 1) * (1 + story.breath * 0.1);
      scale += (goal - scale) * follow;
      if (dot.current) dot.current.style.transform = `translate3d(${at.x}px, ${at.y}px, 0)`;
      if (ring.current) ring.current.style.transform = `translate3d(${eased.x}px, ${eased.y}px, 0) scale(${scale})`;

      if (!dust.length && !drew) return;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      drew = dust.length > 0;
      const grey = 170 - story.air * 40;
      for (let i = dust.length - 1; i >= 0; i--) {
        const m = dust[i];
        m.age += step;
        if (m.age >= m.life) { dust.splice(i, 1); continue; }
        m.x += m.vx * step;
        m.y += m.vy * step;
        const k = 1 - m.age / m.life;
        ctx.globalAlpha = k * 0.85;
        ctx.fillStyle = m.ember ? '#e8792b' : `rgb(${grey + 40} ${grey + 30} ${grey + 22 - story.air * 30})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r * (0.6 + k * 0.4), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    addEventListener('pointermove', onMove, { passive: true });
    addEventListener('pointerdown', onDown, { passive: true });
    addEventListener('pointerup', onUp, { passive: true });
    addEventListener('resize', size);
    html.addEventListener('mouseleave', onLeave);
    gsap.ticker.add(tick);
    return () => {
      removeEventListener('pointermove', onMove);
      removeEventListener('pointerdown', onDown);
      removeEventListener('pointerup', onUp);
      removeEventListener('resize', size);
      html.removeEventListener('mouseleave', onLeave);
      gsap.ticker.remove(tick);
      html.classList.remove('has-cursor');
    };
  }, []);

  return (
    <div className="cursor" ref={root} aria-hidden="true">
      <canvas ref={canvas} />
      <div className="cursor__ring" ref={ring} />
      <div className="cursor__dot" ref={dot} />
    </div>
  );
}
