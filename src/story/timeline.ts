// The master timeline. One ScrollTrigger over #film scrubs one GSAP timeline whose unit is one
// screen of scroll, so positions below read as "how many screens into the film".
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { chapters } from '@/content/copy';
import { glSupported } from '@/engine/env';
import { story } from './state';

gsap.registerPlugin(ScrollTrigger);

const SWELL = 'sine.inOut'; // the motion verb: slow swell, slow release

// Where each chapter starts, in screens. A chapter's stage is stuck for len - 1 of its len screens.
export const starts = chapters.reduce<number[]>((acc, c, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + chapters[i - 1].len);
  return acc;
}, []);
const total = starts[starts.length - 1] + chapters[chapters.length - 1].len - 1;

const THREE_AT = starts[2];

// When each source label is on screen, as the camera passes what it names.
const PIN_AT = [10.0, 10.95, 11.9, 12.85];
const PIN_HOLD = 0.7;

// Chapter 4 opens on the way in: the nose, then the windpipe. Only then the picture of the lungs.
const AIRWAY = 4;
const LUNGS = starts[3] + AIRWAY;

// The atmosphere plate waits for the cloud punch-through. Any earlier and it would cover the Earth dive.
const PLATE_AT: Record<string, number> = {
  atmosphere: 5.9,
  'polluted-city': starts[2] - 0.8, // into the atmosphere's last frames, with no empty haze between them
  'human-lungs': LUNGS - 0.3, // out of the dark at the end of the airway
  'child-city': starts[4] - 0.9, // already there as the lungs shrink into the chest
  'future-city': starts[5] - 0.8, // comes in over the child's last frame, which it matches: the air clears in one shot
};

// A clip need not run straight through. [start, video position, length], from the chapter's start.
// The turn: push in to the deepest point of the lung, hold there, then pull back out on one clip.
const PLATE_MOVES: Record<string, [number, number, number][]> = {
  'human-lungs': [[AIRWAY, 1, 1.9], [AIRWAY + 2.25, 0, 1.9]],
  // Holds on its first frame while the lungs shrink into the chest, then reaches its last frame
  // just as the next plate starts to cover it.
  'child-city': [[0, 1, 2.2]],
  // The air clears as the title rises, and is clean before the text leaves.
  'future-city': [[-0.4, 1, 3.0]],
};

// How far into a clip the film starts. The city clip has a hard cut at 1.46 s of 7.9, and its better shot comes after it.
const PLATE_FROM: Record<string, number> = { 'polluted-city': 0.195 };

// How far into a clip the film scrubs. The atmosphere clip is at its haziest at 4.4 of 7.9 s, then
// clears again, which would undo the story. Revisit this if that clip is ever replaced.
const PLATE_END: Record<string, number> = { atmosphere: 0.56 };

// Text that waits for its picture, from the chapter's start. Everything else arrives at 0.1.
const TEXT_AT: Record<string, number> = { 'earth-ending': 3.4 };

// The camera starts to rise off the street, once the air is clean and the text has gone.
const LIFT = starts[6] - 0.9;

export function buildTimeline(plateScenes: string[], onChapter: (i: number) => void) {
  // ponytail: decided once per page load, so crossing 900 px by resizing keeps the first layout.
  const pins = innerWidth >= 900 && glSupported() && plateScenes.includes('polluted-city');
  document.documentElement.classList.toggle('pins', pins);

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: '#film',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: () => {
        const t = tl.time();
        story.time = t;
        let i = 0;
        for (let c = 0; c < starts.length; c++) if (t >= starts[c] - 0.5) i = c;
        if (i !== story.chapter) { story.chapter = i; onChapter(i); }
      },
    },
  });

  // Keep the timeline exactly as long as the scroll range.
  tl.to({}, { duration: total }, 0);

  // Chapter 1 to 2: approach, then the dive through the limb and cloud deck.
  tl.to(story, { camT: 1, duration: 7.4, ease: SWELL }, 0);
  tl.to(story, { spin: 0.42, duration: 7.4, ease: SWELL }, 0);
  tl.to(story, { stars: 0, duration: 1.4, ease: SWELL }, 4.6);
  tl.to(story, { clouds: 1, duration: 0.9, ease: SWELL }, 5.5);
  tl.to(story, { sky: 1, duration: 0.9, ease: SWELL }, 5.8);
  tl.to(story, { earth: 0, duration: 0.2 }, 6.7);
  tl.to(story, { skyZ: 90, duration: 3.4, ease: 'none' }, 5.6);

  // The air turns. A single value, so sky, cloud, particle and HUD can never disagree.
  tl.to(story, { air: 0.14, reading: 8, duration: 2, ease: SWELL }, 4);
  tl.to(story, { air: 0.72, reading: 35, duration: 2.6, ease: SWELL }, 6);
  tl.to(story, { particles: 1, duration: 2.2, ease: SWELL }, 6);
  tl.to(story, { hero: 1, duration: 0.9, ease: SWELL }, 7.6);
  tl.to(story, { reading: 150, air: 1, duration: 2, ease: SWELL }, THREE_AT - 0.4);

  // Chapter 2 to 3: out through the bottom of the cloud deck, over the city.
  tl.to(story, { clouds: 0.16, duration: 1.3, ease: SWELL }, 8.1);
  tl.to(story, { skyZ: 150, duration: starts[3] - THREE_AT, ease: 'none' }, THREE_AT);

  // Chapter 3 to 4: nothing outside the body follows us in.
  tl.to(story, { hero: 0, duration: 0.4, ease: SWELL }, starts[3] - 1.1); // gone before it could cross the next picture
  tl.to(story, { clouds: 0, particles: 0.3, duration: 0.7, ease: SWELL }, starts[3] - 0.7);
  tl.to(story, { sky: 0, duration: 0.5, ease: SWELL }, starts[3] - 0.5); // the body is dark, and the lungs need true black

  // The way in: the child breathes in, then down the windpipe. Each clip ends in black, so each simply follows the last.
  if (plateScenes.includes('nose')) {
    // The clip holds its silhouette for its first 3.3 s of 7.9, then shows skin. So the film stops there and
    // finishes the move itself, closing on the dark of the head until nothing else is left.
    const plate = (story.plates.nose = { o: 0, p: 0, c: 0, s: 0, l: 0, z: 0 });
    tl.to(plate, { o: 1, duration: 0.45, ease: SWELL }, starts[3] - 0.5);
    tl.to(plate, { p: 0.42, duration: 1.35, ease: 'none' }, starts[3] + 0.1);
    tl.to(plate, { z: 1, duration: 0.4, ease: 'power2.in' }, starts[3] + 1.2);
    tl.to(plate, { o: 0, duration: 0.1 }, starts[3] + 1.55);
  }
  if (plateScenes.includes('windpipe')) {
    const plate = (story.plates.windpipe = { o: 0, p: 0, c: 0, s: 0, l: 0, z: 0 });
    tl.to(plate, { o: 1, duration: 0.3, ease: SWELL }, starts[3] + 1.6);
    tl.to(plate, { p: 1, duration: AIRWAY - 1.95, ease: 'none' }, starts[3] + 1.75);
    tl.to(plate, { o: 0, duration: 0.15 }, LUNGS - 0.25);
  }
  // The depth gauge follows the particle down.
  const stops = [starts[3] + 0.2, starts[3] + 1.9, starts[3] + 2.9, LUNGS + 1.3];
  document.querySelectorAll('#ch-4 .gauge li').forEach((li, n) => {
    gsap.set(li, { '--on': 0 });
    tl.to(li, { '--on': 1, duration: 0.3, ease: SWELL }, stops[n]);
    if (n < stops.length - 1) tl.to(li, { '--on': 0, duration: 0.3, ease: SWELL }, stops[n + 1]);
  });

  tl.to(story, { reading: 5, air: 0.05, duration: 3, ease: SWELL }, starts[5] + 0.2);

  // Chapter 6 to 7: the exhale, the dive played back. Behind the picture, still opaque, the camera goes
  // back to the dive's last frame in clean daylight, where the 3D sun sits close to the photographed one.
  tl.to(story, { sky: 1, day: 1, particles: 0, duration: 0.01 }, LIFT - 0.1);
  tl.to(story, { clouds: 0.6, duration: 0.8, ease: SWELL }, LIFT + 0.6);
  tl.to(story, { skyZ: 100, duration: 2.4, ease: 'none' }, starts[6]);
  tl.to(story, { camT: 0, spin: 0.95, duration: 4.6, ease: SWELL }, starts[6] + 0.1);
  tl.to(story, { earth: 1, duration: 0.2 }, starts[6] + 0.5);
  // Cloud goes first. Dim cloud over a sky already turning black reads as mud, not as height.
  tl.to(story, { clouds: 0, duration: 0.7, ease: SWELL }, starts[6] + 0.7);
  tl.to(story, { day: 0, duration: 1.0, ease: SWELL }, starts[6] + 1.0);
  tl.to(story, { sky: 0, duration: 0.9, ease: SWELL }, starts[6] + 1.2);
  tl.to(story, { stars: 1, duration: 1.4, ease: SWELL }, starts[6] + 1.5);
  tl.to(story, { air: 0, duration: 2, ease: SWELL }, starts[6] + 1);
  tl.to(story, { pull: 1, duration: 2.2, ease: SWELL }, starts[6] + 2.9);
  // Looking into the sun whites out the frame, and that hides the swap from the picture to the 3D sky.
  const flash = document.querySelector(`#${chapters[6].id} .art`);
  if (flash) {
    gsap.set(flash, { '--bloom': 0 });
    tl.to(flash, { '--bloom': 0.92, duration: 0.65, ease: SWELL }, LIFT + 0.25);
    tl.to(flash, { '--bloom': 0, duration: 0.55, ease: SWELL }, LIFT + 0.9);
    gsap.set('.frame, .hud', { '--flip': 0 });
    tl.to('.frame, .hud', { '--flip': 1, duration: 0.5, ease: SWELL }, LIFT + 0.25);
    tl.to('.frame, .hud', { '--flip': 0, duration: 0.5, ease: SWELL }, starts[6] + 1.15);
  }

  // Text. Scrubbed, on the same timeline as the picture, so they cannot drift apart.
  chapters.forEach((c, i) => {
    const root = document.getElementById(c.id);
    if (!root) return;
    const lines = root.querySelectorAll('.line__in');
    const blocks = root.querySelectorAll(pins ? '[data-block]:not([data-anchor])' : '[data-block]');
    const start = starts[i];
    const exit = start + c.len - 1.55;
    const enter = start + (TEXT_AT[c.scene] ?? 0.1);
    if (i > 0) {
      // Set first: a staggered fromTo in a later timeline slot only pre-renders its first target.
      gsap.set(lines, { yPercent: 112 });
      if (blocks.length) gsap.set(blocks, { autoAlpha: 0, y: 18 });
      tl.to(lines, { yPercent: 0, duration: 0.6, stagger: 0.08, ease: 'sine.out' }, enter);
      if (blocks.length) tl.to(blocks, { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.14, ease: 'sine.out' }, enter + 0.4);
    }
    if (pins) {
      root.querySelectorAll('[data-anchor]').forEach((el, n) => {
        gsap.set(el, { autoAlpha: 0 });
        tl.to(el, { autoAlpha: 1, duration: 0.3, ease: 'sine.out' }, PIN_AT[n]);
        tl.to(el, { autoAlpha: 0, duration: 0.3, ease: 'sine.in' }, PIN_AT[n] + PIN_HOLD);
      });
    }
    // Chapter 4 splits its sentence around the turn: A leaves, B arrives.
    const a = root.querySelector('[data-turn-a]');
    const b = root.querySelector('[data-turn-b]');
    if (a && b) {
      tl.to(a, { autoAlpha: 0, duration: 0.5, ease: SWELL }, LUNGS + 1.9);
      tl.fromTo(b, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: SWELL }, LUNGS + 2.2);
    }
    if (i < chapters.length - 1) {
      tl.to(root.querySelector('.stage__in'), { autoAlpha: 0, y: -28, duration: 0.5, ease: 'sine.in' }, exit);
    }
    // DOM art crossfades in over whatever is behind it. Its fixed layer never slides with the page.
    const art = root.querySelector('.art');
    if (art && i > 0) {
      tl.fromTo(art, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.7, ease: SWELL }, start - 0.7);
      if (i < chapters.length - 1) {
        // Once the text has gone, the picture gets to breathe without the darkening behind it.
        gsap.set(art, { '--scrim-o': 1 });
        tl.to(art, { '--scrim-o': 0, duration: 0.5, ease: 'sine.inOut' }, exit + 0.1);
        tl.to(art, { autoAlpha: 0, duration: 0.7, ease: SWELL }, start + c.len - 0.7);
      }
    } else if (art) {
      tl.to(art, { autoAlpha: 0, duration: 0.6, ease: SWELL }, start + c.len - 0.6);
    }
    // Approved plates: fade with the chapter, video progress follows scroll.
    if (plateScenes.includes(c.scene)) {
      const plate = (story.plates[c.scene] = { o: 0, p: PLATE_FROM[c.scene] ?? 0, c: 0, s: 0, l: 0, z: 0 });
      // With no clips for the way in, the lungs are there from the start, not a black screen.
      const at = c.scene === 'human-lungs' && !plateScenes.includes('windpipe') ? start - 0.3 : PLATE_AT[c.scene] ?? start - 0.3;
      tl.to(plate, { o: 1, duration: 0.7, ease: SWELL }, at);
      const moves = PLATE_MOVES[c.scene];
      if (moves) moves.forEach(([t, p, d]) => tl.to(plate, { p, duration: d, ease: 'none' }, start + t));
      else tl.to(plate, { p: PLATE_END[c.scene] ?? 1, duration: start + c.len - at, ease: 'none' }, at);
      // The cloud that hid the swap thins out, so you emerge into the picture.
      tl.to(plate, { c: 1, duration: 0.9, ease: SWELL }, at + 0.7);
      if (c.scene === 'human-lungs') {
        // The film's turn: the lungs we were inside shrink into the child's chest, and hold there a moment.
        tl.to(plate, { s: 1, duration: 1.0, ease: SWELL }, LUNGS + 4.0);
        tl.to(plate, { o: 0, duration: 0.45, ease: SWELL }, LUNGS + 4.95);
      } else if (c.scene === 'future-city') {
        // The street falls away below. It goes at the height of the flash, so nobody sees it go.
        tl.to(plate, { l: 1, duration: 1.2, ease: SWELL }, LIFT);
        tl.to(plate, { o: 0, duration: 0.2 }, LIFT + 1.0);
      } else if (i < chapters.length - 1) {
        // Waits to be fully covered by the picture after it, so nothing dips to black between them.
        const covered = (c.scene === 'child-city' && plateScenes.includes('future-city')) || (c.scene === 'polluted-city' && plateScenes.includes('nose'));
        tl.to(plate, { o: 0, duration: 0.7, ease: SWELL }, start + c.len - (covered ? 0 : 0.7));
      }
    }
  });

  return tl;
}
