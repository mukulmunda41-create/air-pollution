// Global motion: runs once on the client, before the first page initializes.
import { gsap } from 'gsap';
import { ease, onPage, scrollToTarget, setLoaderExit, setLoaderFormat, setTransition } from '@/engine';
import { startBreath } from './breath';

export function setupMotion() {
  startBreath();
  setLoaderFormat((p) => String(Math.round(p)).padStart(3, '0'));

  // The mega wordmark settles into the corner wordmark: first frame of the site is the name.
  setLoaderExit((root) => {
    const big = root.querySelector<HTMLElement>('.loader__word');
    const small = document.querySelector<HTMLElement>('[data-wordmark] a');
    const tl = gsap.timeline();
    tl.to(root.querySelectorAll('[data-loader-out]'), { autoAlpha: 0, duration: 0.3, ease: 'sine.out' }, 0);
    if (big && small) {
      const a = big.getBoundingClientRect();
      const b = small.getBoundingClientRect();
      const s = b.height / a.height;
      tl.to(big, {
        x: b.left - a.left,
        y: b.top - a.top,
        scale: s,
        transformOrigin: '0 0',
        duration: 0.8,
        ease: ease.inOut,
      }, 0);
    }
    tl.to(root, { backgroundColor: 'rgba(3,5,7,0)', duration: 0.6, ease: 'sine.inOut' }, 0.2);
    return tl;
  });

  // A slow exhale of haze: the curtain rises with a soft leading edge, never a hard wipe.
  setTransition({
    leave: (c) => gsap.timeline()
      .set(c, { autoAlpha: 1 })
      .fromTo(c.querySelector('.curtain__panel'), { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: ease.inOut }),
    enter: (c) => gsap.timeline()
      .to(c.querySelector('.curtain__panel'), { yPercent: -110, duration: 0.9, ease: ease.inOut })
      .set(c, { autoAlpha: 0 }),
  });

  // The router resets scroll on navigation, so honor a #hash once the new page is ready.
  onPage(() => {
    if (location.hash) requestAnimationFrame(() => scrollToTarget(location.hash));
  });
}
