'use client';
// The film's instrument strip. Updates the DOM directly from the driver: never a React render on scroll.
import { gsap } from 'gsap';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { prefersReducedMotion } from '@/engine';
import { usePage } from '@/engine/next';
import { chapters } from '@/content/copy';
import { CHAPTER_EVENT } from '@/story/FilmDriver';
import { story } from '@/story/state';

// What each chapter's reading settles at, for when no timeline is there to drive it.
const READINGS = [2, 35, 150, 150, 150, 5, 5];

export function Hud() {
  const reading = useRef<HTMLSpanElement>(null);
  const breaths = useRef<HTMLSpanElement>(null);
  const now = useRef<HTMLSpanElement>(null);
  const [paused, setPaused] = useState(false);

  usePage(() => {
    const ticks = [...document.querySelectorAll<HTMLElement>('.tick')];
    const mark = (i: number) => {
      ticks.forEach((t, n) => t.setAttribute('aria-current', String(n === i)));
      if (now.current) now.current.textContent = `${String(i + 1).padStart(2, '0')} ${chapters[i].name}`;
    };
    const onChapter = (e: Event) => mark((e as CustomEvent<number>).detail);
    document.addEventListener(CHAPTER_EVENT, onChapter);
    if (prefersReducedMotion()) {
      const seen = new IntersectionObserver((entries) => {
        entries.filter((e) => e.isIntersecting).forEach((e) => {
          const i = chapters.findIndex((c) => c.id === e.target.id);
          mark(i);
          if (reading.current) reading.current.textContent = String(READINGS[i]);
        });
      }, { rootMargin: '-50% 0px -50% 0px' });
      chapters.forEach((c) => { const el = document.getElementById(c.id); if (el) seen.observe(el); });
      return () => {
        seen.disconnect();
        document.removeEventListener(CHAPTER_EVENT, onChapter);
      };
    }

    let lastReading = -1, lastBreaths = -1;
    const tick = () => {
      const r = Math.round(story.reading);
      if (r !== lastReading && reading.current) { reading.current.textContent = String(r); lastReading = r; }
      if (story.breaths !== lastBreaths && breaths.current) { breaths.current.textContent = String(story.breaths); lastBreaths = story.breaths; }
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      document.removeEventListener(CHAPTER_EVENT, onChapter);
    };
  });

  const toggle = () => {
    story.paused = !story.paused;
    setPaused(story.paused);
  };

  return (
    <aside className="hud" aria-label="Film controls and readings">
      <div className="hud__left">
        <nav aria-label="Chapters">
          <ol className="ticks">
            {chapters.map((c, i) => (
              <li key={c.id}>
                <Link className="tick" href={`#${c.id}`} aria-current={i === 0 ? 'true' : 'false'} aria-label={`Chapter ${c.n}: ${c.name}`}>
                  <span className="tick__name" aria-hidden="true">{String(c.n).padStart(2, '0')} {c.name}</span>
                </Link>
              </li>
            ))}
          </ol>
        </nav>
        <span className="hud__now" ref={now}>01 {chapters[0].name}</span>
      </div>
      <div className="hud__right">
        <span title="An illustrative value for this scene, not a live measurement. WHO annual guideline: 5 µg/m³.">
          PM2.5 <span ref={reading}>2</span> <span className="hud__dim">µg/m³<span className="hud__reading-note"><span className="hud__comma">,</span> illustrative</span></span>
        </span>
        <span className="hud__breaths">
          <span className="hud__dim">Breaths here</span> <span ref={breaths}>0</span>
        </span>
        <button type="button" className="hud__pause" onClick={toggle} aria-pressed={paused}>
          {paused ? 'Resume' : 'Pause'}
        </button>
      </div>
    </aside>
  );
}
