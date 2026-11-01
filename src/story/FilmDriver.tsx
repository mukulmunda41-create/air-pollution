'use client';
// Builds the master timeline for the film page, and animates the title intro after the loader.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ease, isTouch, prefersReducedMotion } from '@/engine';
import { loaderWasLate } from '@/engine/loader';
import { usePage } from '@/engine/next';
import { chapters } from '@/content/copy';
import { story } from './state';
import { buildTimeline } from './timeline';

const CHAPTER_EVENT = 'film:chapter';

export function FilmDriver({ plateScenes }: { plateScenes: string[] }) {
  usePage(({ intro }) => {
    if (prefersReducedMotion()) return;

    buildTimeline(plateScenes, (i) => {
      document.dispatchEvent(new CustomEvent(CHAPTER_EVENT, { detail: i }));
    });

    // Title card intro. Uses the inner span so it never fights the scrubbed exit on the stage.
    const first = document.getElementById('ch-1');
    if (first && !loaderWasLate()) {
      const lines = first.querySelectorAll('.line__in');
      const blocks = first.querySelectorAll('[data-block]');
      gsap.set(lines, { yPercent: 112 });
      gsap.set(blocks, { autoAlpha: 0 });
      intro.to(lines, { yPercent: 0, duration: 1.5, stagger: 0.09, ease: ease.out }, 0.1);
      intro.to(blocks, { autoAlpha: 1, duration: 1.2, ease: 'sine.out' }, 0.7);
    }

    // The wordmark and the active title physically breathe through the width axis.
    // Quantized: text only re-lays out when the value really changes, about 12 times a second at most.
    const touch = isTouch();
    let last = 0;
    const tick = () => {
      const wide = Math.round((62 + (story.breath + 1) * 1.6) * 4) / 4;
      if (wide === last) return;
      last = wide;
      const active = document.getElementById(chapters[story.chapter]?.id ?? '');
      document.querySelectorAll<HTMLElement>('[data-wordmark]').forEach((el) => {
        el.style.fontStretch = `${wide}%`;
      });
      if (!touch && active) active.querySelectorAll<HTMLElement>('[data-breathes]').forEach((el) => {
        el.style.fontStretch = `${wide}%`;
      });
    };
    gsap.ticker.add(tick);
    requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => {
      gsap.ticker.remove(tick);
      document.documentElement.classList.remove('pins');
    };
  });
  return null;
}

export { CHAPTER_EVENT };
