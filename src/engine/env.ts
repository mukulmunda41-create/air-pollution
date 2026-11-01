export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isTouch = () => matchMedia('(hover: none), (pointer: coarse)').matches;
export const isMobile = () => matchMedia('(max-width: 767px)').matches;

// False under reduced motion, Save-Data, or without WebGL: the DOM art then carries the film.
export function glSupported() {
  if (prefersReducedMotion()) return false;
  if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return false;
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
}

// Shared easing vocabulary. Use these names everywhere; never invent per-component curves.
export const ease = {
  out: 'expo.out', // the one timed intro
  inOut: 'expo.inOut', // curtains, page transitions
  soft: 'power3.out', // small UI
  breath: 'sine.inOut', // anything scrubbed: slow swell, slow release
} as const;
