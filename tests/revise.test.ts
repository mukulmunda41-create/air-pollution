import assert from 'node:assert/strict';
import { test } from 'node:test';
import { scenes } from '../src/content/scenes.ts';
import { applyAlternate, revise } from '../src/studio/revise.ts';
import { FIELD_ORDER, renderPrompt } from '../src/studio/render-prompt.ts';

const seed = scenes.find((s) => s.id === 'polluted-city')!.video;
const OWNER_EXAMPLE =
  'The smoke looks artificial. Camera movement is too fast. The environment needs more realistic lighting. Make the scene cinematic and natural.';

test("your example feedback changes the exact fields it complains about", () => {
  const r = revise(seed, OWNER_EXAMPLE);
  assert.notEqual(r.fields.vfx, seed.vfx, 'smoke must change the VFX field');
  assert.notEqual(r.fields.cameraMove, seed.cameraMove, 'speed must change the camera move');
  assert.notEqual(r.fields.lighting, seed.lighting, 'lighting must change');
  assert.notEqual(r.fields.grade, seed.grade, 'cinematic must change the grade');
  assert.notEqual(r.fields.style, seed.style, 'natural must change the style');
  assert.match(r.fields.negative, /CG smoke/);
  assert.match(r.fields.negative, /fast camera/);
  assert.equal(r.unmatched.length, 0);
});

test('every change says what changed and why, quoting your words', () => {
  const r = revise(seed, OWNER_EXAMPLE);
  assert.ok(r.changes.length >= 5);
  for (const c of r.changes) {
    assert.notEqual(c.before, c.after);
    assert.ok(c.why.length > 0);
  }
  assert.ok(r.changes.some((c) => c.why.includes('Camera movement is too fast')));
  assert.match(r.summary, /smoke/i);
});

test('the original prompt is not mutated', () => {
  const copy = JSON.stringify(seed);
  revise(seed, OWNER_EXAMPLE);
  assert.equal(JSON.stringify(seed), copy);
});

test('a repeated complaint escalates instead of repeating itself', () => {
  const a = revise(seed, 'Camera is too fast.');
  const b = revise(a.fields, 'Camera is still too fast.', a.applied);
  const c = revise(b.fields, 'Camera is too fast again.', b.applied);
  assert.match(a.fields.cameraMove, /5% of frame/);
  assert.match(b.fields.cameraMove, /2% of frame/);
  assert.match(c.fields.cameraMove, /Locked-off/);
  assert.equal(c.applied['camera-speed'], 3);
  // Unlimited cycles: the top level holds, and repeats never duplicate wording.
  const d = revise(c.fields, 'Too fast.', c.applied);
  assert.equal(d.fields.cameraMove.match(/Locked-off/g)?.length, 1);
});

test('feedback no rule understands is kept word for word and flagged', () => {
  const r = revise(seed, 'Add a stray dog near the kerb.');
  assert.deepEqual(r.unmatched, ['Add a stray dog near the kerb.']);
  assert.match(r.fields.scene, /Director's note: Add a stray dog near the kerb\./);
  assert.match(r.summary, /Claude Code/);
});

test('every scene has both prompts with every field filled, and at least two alternates that change something', () => {
  assert.equal(scenes.length, 9);
  for (const s of scenes) {
    for (const fields of [s.image, s.video]) {
      for (const f of FIELD_ORDER) assert.ok(fields[f]?.trim(), `${s.id}.${f} is empty`);
      const text = renderPrompt(fields);
      assert.match(text, /Negative prompt:/);
      assert.ok(!/[—–]/.test(text), `${s.id} has a dash`);
    }
    assert.ok(s.alternates.length >= 2);
    for (const alt of s.alternates) {
      assert.ok(applyAlternate(s.image, alt.image, alt.label, alt.why).changes.length > 0, `${s.id} ${alt.label} image`);
      assert.ok(applyAlternate(s.video, alt.video, alt.label, alt.why).changes.length > 0, `${s.id} ${alt.label} video`);
    }
  }
});

test('the child scene protects the child', () => {
  const child = scenes.find((s) => s.id === 'child-city')!;
  for (const fields of [child.image, child.video]) {
    assert.match(fields.scene, /from behind/);
    assert.match(fields.negative, /visible face/);
    assert.match(fields.negative, /distress/);
  }
});
