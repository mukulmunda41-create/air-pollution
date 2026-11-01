// The idle input: one breath every 5 s (12 a minute), inhale 2 s, exhale 3 s, on the GSAP ticker.
// Under reduced motion it never starts, so breath stays 0 and the film holds still.
import { gsap } from 'gsap';
import { isTouch, prefersReducedMotion } from '@/engine';
import { story } from './state';

const CYCLE = 5;
const INHALE = 2 / CYCLE;

// Asymmetric cosine: rises over the inhale, falls over the exhale.
export function breathAt(t: number) {
  const f = ((t % CYCLE) + CYCLE) % CYCLE / CYCLE;
  const phase = f < INHALE ? f / INHALE : 1 + (f - INHALE) / (1 - INHALE);
  return -Math.cos(phase * Math.PI);
}

let started = false;

export function startBreath() {
  if (started || prefersReducedMotion()) return;
  started = true;
  const touch = isTouch();
  const aim = { x: 0, y: 0 };
  if (!touch) {
    addEventListener('pointermove', (e) => {
      aim.x = e.clientX / innerWidth - 0.5;
      aim.y = e.clientY / innerHeight - 0.5;
    }, { passive: true });
  }
  gsap.ticker.add(() => {
    const r = gsap.ticker.deltaRatio();
    const k = 1 - Math.pow(0.95, r);
    story.pointer.x += (aim.x - story.pointer.x) * k;
    story.pointer.y += (aim.y - story.pointer.y) * k;
    if (story.paused || document.hidden) return;
    story.t += gsap.ticker.deltaRatio(60) / 60;
    story.breath = breathAt(story.t);
    story.breaths = Math.floor(story.t / CYCLE);
  });
}
