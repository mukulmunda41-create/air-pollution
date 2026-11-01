# AIR POLLUTION: design system

## Brief

- Subject: air pollution and its impact on Earth, health and the future.
- Audience: teachers, classmates and anyone they share it with. A school project held to the bar of
  a premium environmental documentary.
- Job: make visitors feel the story, understand the problem, and remember the message.
- Constraints from the owner: the name is exactly AIR POLLUTION. Next.js, R3F, drei, GSAP
  ScrollTrigger, Lenis, Tailwind. Seven chapters with fixed typography lines. Media is generated
  by hand outside the system, reviewed in `/studio`, and never accepted automatically.

## Concepts considered

| Concept | Anchor | Signature | O / F / Fe / P |
|---|---|---|---|
| **A. One breath** | Air pollution reaches you through breathing, and you cannot opt out | The turn: hold at the alveolus, pull back out through a child's chest | 5 / 5 / 3 / 2 |
| B. The witness | PM2.5 is a real, tracked physical object | One particle stays centered at every scale | 4 / 4 / 3 / 2 |
| C. The reading | Air quality is reported as a number | A PM2.5 value sets the whole palette | 3 / 4 / 5 / 3 |

Picked A: the seven chapters already form a palindrome, in from space and out to space. From B: the
ember hero particle as the visual thread. From C: the air reading as the one driver variable.

## Concept Card

```
Idea:        You are breathed in from space to the bottom of a lung, and breathed back out.
Metaphor:    The respiratory cycle. Scroll is the breath. Chapters 1 to 4 inhale, 5 to 7 exhale.
Signature:   The turn. "THE AIR WE POLLUTE..." holds at the alveolus. The camera pulls back out of
             the airway and through a chest to reveal the child standing in the haze, on
             "...IS THE AIR WE BREATHE."
Emotion:     Calm awe. A planet slowly breathing.
Motion verb: Inhale and exhale. Slow swell, slow release, nothing snaps.
Screenshot:  Earth's crescent with its blue limb, the title card set beside it.
```

## One driver

`src/story/state.ts` holds a plain mutable `story` object. The master ScrollTrigger timeline writes
to it and every visual reads from it, so they always agree and scrolling causes no React renders.
- `air` (0 clean, 1 choked) sets atmosphere color, cloud color, particle density, sky grade.
- `reading` is the HUD's PM2.5 number, labelled illustrative.
- `breath` is the idle input: a 5 s cycle (12 breaths per minute, inhale 2 s, exhale 3 s) on the GSAP
  ticker. It moves the camera a few millimetres, swells the atmosphere and widens the wordmark.
  It pauses with the visible Pause control and stays at zero under reduced motion.

## Art direction

**Palette** (brief-specified, so the near-black plus single accent reads as intent, not default)
| Role | Hex | Source |
|---|---|---|
| void (ground) | `#030507` | space |
| ink | `#EEF2F4` | starlight on cloud |
| muted | `#9AA4AB` | high thin haze, AA on void |
| air | `#7FB8E8` | Rayleigh scatter at the limb |
| smog | `#8C8A80` | particulate haze |
| ember | `#E8792B` | stack fire, hero particle, focus ring only |

**Type follows film roles**
- Title card: Archivo variable, condensed caps. Width axis breathes on the wordmark and active title.
- Narrator: Newsreader italic. The voice-over.
- Instruments: Martian Mono, small, tabular. HUD and data only, never decoration.

**Shape:** zero radius. Nothing in this film is a card.

**Motion language:** `sine.inOut` for anything scrubbed, `expo.out` only for the one timed intro.
Text rises out of a mask and settles. No fade-up on every section, no bounce.

**Hover treatments:** primary CTA floods upward like an inhale with its arrow travelling. Nav links
draw an underline. Chapter ticks swell and reveal their name. Utility links change color.

## Composition plan (a different family per chapter)

```
01 Poster              02 Statement            03 Pinned labels
+------------------+   +------------------+    +------------------+
|AIR POLLUTION  nav|   |AIR POLLUTION  nav|    |OUR PROGRESS   nav|
|            ___   |   |                  |    |LEFT A TRACE      |
|A WORLD    /   \  |   |THE AIR           |    | [stacks]  [power]|
|THAT COULD| 3D  | |   |BEGAN             |    |                  |
|BREATHE.   \___/  |   |TO CHANGE.   99%..|    | [dust]   [traffic]|
|narrator          |   |            hair..|    |                  |
|ticks  PM2.5 breaths|  |ticks  PM2.5     |    |ticks  PM2.5      |
+------------------+   +------------------+    +------------------+

04 Depth gauge         05 One line             06 Emerging list      07 Finale
+------------------+   +------------------+    +----------------+    +----------------+
|nose      THE AIR |   |                  |    |THE FUTURE IS   |    |  AIR POLLUTION |
|trachea   WE      |   |   WHAT KIND OF   |    |NOT WRITTEN     |    |  IS A GLOBAL   |
|bronchi   POLLUTE |   |   WORLD ARE WE   |    |IN SMOKE.       |    |  CHALLENGE.    |
|alveoli   ...     |   |   LEAVING BEHIND?|    |solutions list  |    |protect line    |
|why it matters    |   |      700,000     |    |real results    |    |THE NEXT BREATH |
+------------------+   +------------------+    +----------------+    +----------------+
```

Phone (390 px): Earth moves to the upper half and the title sits below it. Labels stack. The turn
stays. Hover-only behavior has tap or focus equivalents.

## Genericness test

"Would a generic model land here?" A generic build goes Earth, particles, gray city, green city,
with fade-up text over each. What changed because of the test:
- The structure is a palindrome with a single turning point, not a linear slideshow.
- The airway you fly through turns out to belong to the child: a match cut, not a scene change.
- Type has film roles, and the wordmark physically breathes through a variable width axis.
- A single `air` value drives everything, so the picture and the HUD cannot disagree.
- Fallback art stays in the DOM, so the film still reads with no WebGL.

## Idle state

The concept moves at rest: slow Earth rotation, cloud drift, breath on the camera and atmosphere. It
pauses off screen, respects the Pause control, and is off under reduced motion.

## Fixed decisions

- Studio is local only and returns 404 in production.
- The child in Chapter 5 is seen from behind, with no identifiable face, and is not shown in distress.
- Every health or policy figure on the site needs a primary source listed on `/sources`.
- Earth textures: Solar System Scope (CC BY 4.0), based on NASA imagery, via the three.js examples.
