// Turns prompt fields into the text you paste. Labels stay in, because they help Flow, Veo, Runway
// and Kling weight each part. The negative prompt is also copyable alone for tools with its own box.
import type { FieldName, PromptFields } from './types.ts';

export const FIELD_LABELS: Record<FieldName, string> = {
  scene: 'Scene',
  style: 'Visual style',
  cameraAngle: 'Camera angle',
  cameraMove: 'Camera movement',
  lighting: 'Lighting',
  composition: 'Composition',
  environment: 'Environment',
  palette: 'Color palette',
  grade: 'Color grade',
  vfx: 'Visual effects',
  aspect: 'Aspect ratio',
  duration: 'Duration',
  negative: 'Negative prompt',
  continuity: 'Continuity',
};

export const FIELD_ORDER = Object.keys(FIELD_LABELS) as FieldName[];

export const renderPrompt = (fields: PromptFields) =>
  FIELD_ORDER.map((f) => `${FIELD_LABELS[f]}: ${fields[f]}`).join('\n\n');
