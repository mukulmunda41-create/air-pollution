// The built-in reviser: your feedback in, a changed prompt and the reason for each change out.
// Pure and deterministic, no network. For a stronger rewrite, ask Claude Code in chat.
import type { Change, FieldName, PromptFields } from './types.ts';

type Edit = {
  field: FieldName;
  add: string[]; // one wording per escalation level; repeated complaints step through these
  remove?: RegExp; // wording that contradicts the fix
};

type Rule = {
  id: string;
  label: string;
  test: RegExp;
  edits: Edit[];
  negative: string;
};

const RULES: Rule[] = [
  {
    id: 'smoke',
    label: 'Smoke and haze looked artificial',
    test: /\b(smoke|smog|haze|plume|fog|steam|emission|mist)s?\b/i,
    edits: [
      {
        field: 'vfx',
        add: [
          'Smoke must behave as a real fluid: soft volumetric density, wind-sheared edges, slowly dissolving into the air with no visible outline.',
          'Reference real aerial footage of power station plumes: uneven density, rising heat shimmer, flattening under an inversion, and never a uniform texture.',
          'Reduce smoke as a subject: thin, distant, mostly dissolved into general haze, so the tool has less to get wrong.',
        ],
        remove: /cartoon puffs/i,
      },
    ],
    negative: 'CG smoke, cartoon puffs, cotton-wool smoke, painted fog, particle-sprite smoke',
  },
  {
    id: 'camera-speed',
    label: 'Camera moved too fast',
    test: /\b(camera|movement|motion|move|moving|pan|dolly|zoom|push)\b.*\b(fast|quick|rapid|rushed|hurried|speed|too much)\b|\b(fast|quick|rapid|rushed|hurried)\b.*\b(camera|movement|motion|move|moving|pan|dolly|zoom|push)\b|\btoo fast\b/i,
    edits: [
      {
        field: 'cameraMove',
        add: [
          'Slow the move to half this speed: no more than 5% of frame travel across the whole clip, at a constant velocity with no acceleration.',
          'Barely perceptible move: under 2% of frame travel across the whole clip. If in doubt, stay still.',
          'Locked-off tripod shot. No camera movement at all: the only motion comes from the environment.',
        ],
      },
    ],
    negative: 'fast camera, rapid push-in, accelerating camera, whip pan, crash zoom',
  },
  {
    id: 'camera-shake',
    label: 'Camera felt unstable',
    test: /\b(shak\w*|jitter\w*|wobbl\w*|unstable|handheld|jerky|bumpy)\b/i,
    edits: [
      {
        field: 'cameraMove',
        add: [
          'Perfectly stable: mounted on a heavy fluid head and dolly with no vibration.',
          'Use a motion-controlled rig: mathematically smooth path with zero jitter.',
          'Locked-off tripod shot with no movement.',
        ],
      },
    ],
    negative: 'camera shake, handheld wobble, jitter, micro-vibration',
  },
  {
    id: 'lighting',
    label: 'Lighting felt unrealistic',
    test: /\b(light|lighting|lit|shadow|exposure|sun|sunlight|bright|dark|overexposed|underexposed)\w*\b/i,
    edits: [
      {
        field: 'lighting',
        add: [
          'Physically motivated light only: one clear natural source, shadows that agree with it, and soft bounce from the ground and haze. No invisible fill.',
          'Match a real location photograph at this time of day: natural falloff, true contact shadows, and highlights that roll off rather than clip.',
          'Simplify the light: overcast natural daylight or one soft source, with low contrast, so nothing can read as artificial.',
        ],
      },
    ],
    negative: 'studio lighting, artificial rim light, mismatched shadows, HDR look, floating light sources',
  },
  {
    id: 'realism',
    label: 'Looked artificial rather than natural',
    test: /\b(artificial|fake|cgi|cg|plastic|game|rendered?|synthetic|unreal|unrealistic|realistic|natural|ai[- ]?look\w*)\b/i,
    edits: [
      {
        field: 'style',
        add: [
          'Must read as an unretouched photograph from a documentary shoot: imperfect surfaces, real wear, uneven weathering, optical softness at frame edges, natural grain.',
          'Shot on location on medium-format film stock with real lens imperfections. No element may look computer generated.',
          'Prioritize believability over beauty: an ordinary, slightly flawed real frame, as if pulled from raw documentary footage.',
        ],
        remove: /CGI plastic look/i,
      },
    ],
    negative: 'CGI, 3D render, plastic surfaces, video game graphics, AI sheen, over-smooth textures, uncanny perfection',
  },
  {
    id: 'cinematic',
    label: 'Not cinematic enough',
    test: /\b(cinematic|film|filmic|movie|flat|boring|dull|premium|epic|dramatic)\b/i,
    edits: [
      {
        field: 'grade',
        add: [
          'Stronger film emulation: gentle halation in highlights, deeper blacks, and a tighter color separation between warm light and cool shadow.',
          'Match a 65 mm theatrical print: rich tonal depth, restrained palette, and a clear subject separation by value.',
          'Reduce to two dominant hues plus one small accent for a much more graphic, deliberate frame.',
        ],
      },
    ],
    negative: 'flat digital look, video look, smartphone footage',
  },
  {
    id: 'composition',
    label: 'Framing needs to change',
    test: /\b(compos\w*|fram\w*|crop\w*|center\w*|centre\w*|off[- ]?center|cluttered|busy|empty|space|too close|too far|small|big|large)\b/i,
    edits: [
      {
        field: 'composition',
        add: [
          'Simplify the frame: one clear subject, one clear lead-in, and a calm, empty third of frame reserved for text.',
          'Strict compositional grid: subject on a third-line intersection, with nothing competing within two subject-widths of it.',
          'Pare back to a single element against open space, poster-like.',
        ],
      },
    ],
    negative: 'cluttered frame, competing subjects, tangents at the frame edge',
  },
  {
    id: 'color',
    label: 'Color was off',
    test: /\b(colou?r\w*|saturat\w*|orange|blue|teal|yellow|green|tint|grade|grading|contrast)\b/i,
    edits: [
      {
        field: 'grade',
        add: [
          'Pull overall saturation down about 20%, keep neutrals truly neutral, and let only the light source carry a warm tint.',
          'Near-monochrome grade with a single small warm accent. Colors are read by the value, not by the hue.',
          'Match the film palette strictly: deep black, atmospheric blue, pollution gray, and orange only as the smallest highlight.',
        ],
      },
    ],
    negative: 'oversaturated color, orange and teal cliche, color cast across the whole frame',
  },
  {
    id: 'artifacts',
    label: 'Visible AI artifacts',
    test: /\b(artifact\w*|morph\w*|warp\w*|glitch\w*|distort\w*|melt\w*|flicker\w*|deform\w*|blur\w*|garbled|weird|strange)\b/i,
    edits: [
      {
        field: 'continuity',
        add: [
          'Geometry must stay rigid across every frame: buildings, roads and structures do not change shape or position.',
          'Reduce moving elements to one or two, and keep all others completely static, so the model has less to invent per frame.',
          'Generate the shortest usable clip and hold on a nearly static frame. Stillness beats motion artifacts.',
        ],
      },
    ],
    negative: 'morphing, warping, melting geometry, temporal flicker, shape drift, boiling textures',
  },
  {
    id: 'people',
    label: 'Figure or anatomy issue',
    test: /\b(face|hand|hands|finger\w*|child|kid|person|people|body|anatomy|limb\w*|head|hair|arm|leg)s?\b/i,
    edits: [
      {
        field: 'scene',
        add: [
          'The figure stays entirely turned away from the camera with no face visible, natural proportions, simple still posture and arms relaxed at the sides.',
          'Make the figure smaller in frame and further from the camera, with no detail required in hands or face.',
          'Reduce the figure to a soft, simple silhouette in the haze, with no surface detail at all.',
        ],
      },
    ],
    negative: 'visible face, extra fingers, malformed hands, distorted proportions, multiple heads',
  },
  {
    id: 'pacing',
    label: 'Pacing or duration was off',
    test: /\b(too long|too short|pacing|duration|length|slow|timing|rushed)\b/i,
    edits: [
      {
        field: 'duration',
        add: [
          'Exactly 8 seconds with even pacing: the change spreads across the whole clip and is never concentrated in one moment.',
          'Exactly 8 seconds. Nothing starts or stops abruptly, with the first and last second nearly still.',
          'Exactly 6 seconds if the tool holds quality better at that length, with even pacing.',
        ],
      },
    ],
    negative: 'sudden changes, abrupt starts or stops, time-lapse speed',
  },
  {
    id: 'text',
    label: 'Unwanted text or logos',
    test: /\b(text|letter\w*|logo\w*|sign|signs|signage|watermark\w*|word\w*|brand\w*)\b/i,
    edits: [
      {
        field: 'environment',
        add: [
          'Every surface free of writing: blank storefronts, unlabeled vehicles, no signs, no billboards.',
          'Remove all objects that normally carry text: no shops, billboards, road signs, or number plates in frame.',
          'Keep the frame away from streets and storefronts entirely, showing only forms too distant to carry lettering.',
        ],
      },
    ],
    negative: 'gibberish text, fake letters, billboards, street signs, number plates, storefront writing',
  },
  {
    id: 'continuity',
    label: 'Did not match neighboring scenes',
    test: /\b(continuity|match\w*|consistent|inconsistent|different from|previous|next scene|same)\b/i,
    edits: [
      {
        field: 'continuity',
        add: [
          'Attach the previously approved asset as an image reference, and keep sun direction, horizon height and color temperature identical to it.',
          'Use first-frame mode with the last frame of the previous approved clip, so the shot starts where the last one ended.',
          'Reuse the same seed and reference image if the tool allows it, changing only one thing at a time.',
        ],
      },
    ],
    negative: 'mismatched lighting direction, different horizon height, different color temperature',
  },
];

const splitSentences = (s: string) =>
  s.split(/(?<=[.!?\n])\s+/).map((x) => x.trim()).filter(Boolean);

const appendOnce = (base: string, extra: string) =>
  base.toLowerCase().includes(extra.toLowerCase()) ? base : `${base} ${extra}`.trim();

export type Revision = {
  fields: PromptFields;
  changes: Change[];
  applied: Record<string, number>;
  unmatched: string[];
  summary: string;
};

export function revise(
  current: PromptFields,
  feedback: string,
  priorApplied: Record<string, number> = {},
): Revision {
  const fields: PromptFields = { ...current };
  const applied = { ...priorApplied };
  const changes: Change[] = [];
  const unmatched: string[] = [];
  const firedThisTime = new Map<string, string>();

  for (const sentence of splitSentences(feedback)) {
    const hits = RULES.filter((r) => r.test.test(sentence));
    if (!hits.length) unmatched.push(sentence);
    for (const r of hits) if (!firedThisTime.has(r.id)) firedThisTime.set(r.id, sentence);
  }

  for (const [id, sentence] of firedThisTime) {
    const rule = RULES.find((r) => r.id === id)!;
    const level = Math.min(applied[id] ?? 0, 2);
    applied[id] = (applied[id] ?? 0) + 1;
    const escalation = level === 0 ? '' : ` This is the ${level === 1 ? 'second' : 'third or later'} note on this, so the fix is stronger.`;

    for (const edit of rule.edits) {
      const before = fields[edit.field];
      let after = edit.remove ? before.replace(edit.remove, '').replace(/\s{2,}/g, ' ').trim() : before;
      after = appendOnce(after, edit.add[level]);
      fields[edit.field] = after;
      changes.push({ field: edit.field, before, after, why: `${rule.label}: “${sentence}”${escalation}` });
    }
    const before = fields.negative;
    const after = appendOnce(before, `, ${rule.negative}`).replace(/ ,/g, ',');
    fields.negative = after;
    changes.push({ field: 'negative', before, after, why: `Added so the tool actively avoids it: “${sentence}”` });
  }

  // Anything no rule understood is still your direction, so it goes in word for word.
  if (unmatched.length) {
    const before = fields.scene;
    const note = `Director's note: ${unmatched.join(' ')}`;
    const after = appendOnce(before, note);
    fields.scene = after;
    changes.push({
      field: 'scene',
      before,
      after,
      why: 'No built-in rule recognized this, so it is kept word for word. For a proper rewrite, ask Claude Code in chat.',
    });
  }

  const names = [...firedThisTime.keys()].map((id) => RULES.find((r) => r.id === id)!.label.toLowerCase());
  const summary = names.length
    ? `Addressed: ${names.join('; ')}.${unmatched.length ? ` ${unmatched.length} note kept verbatim.` : ''}`
    : 'No built-in rule matched, so your note was added word for word. Ask Claude Code in chat for a proper rewrite.';

  return { fields, changes, applied, unmatched, summary };
}

// Apply an authored alternate take. Every differing field is reported as a change.
export function applyAlternate(current: PromptFields, patch: Partial<PromptFields>, label: string, why: string): { fields: PromptFields; changes: Change[]; summary: string } {
  const fields: PromptFields = { ...current };
  const changes: Change[] = [];
  for (const [k, v] of Object.entries(patch) as [FieldName, string][]) {
    if (fields[k] === v) continue;
    changes.push({ field: k, before: fields[k], after: v, why: `Alternate take "${label}": ${why}` });
    fields[k] = v;
  }
  return { fields, changes, summary: `Alternate take: ${label}. ${why}` };
}
