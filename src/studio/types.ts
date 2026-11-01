// The asset manifest's shape. Plain data: this is what lives in public/assets/manifest.json.
export type AssetKind = 'image' | 'video';

// Your 12 required prompt parts, plus color grade and visual effects.
export type PromptFields = {
  scene: string;
  style: string;
  cameraAngle: string;
  cameraMove: string;
  lighting: string;
  composition: string;
  environment: string;
  palette: string;
  grade: string;
  vfx: string;
  aspect: string;
  duration: string;
  negative: string;
  continuity: string;
};
export type FieldName = keyof PromptFields;

export type Change = { field: FieldName; before: string; after: string; why: string };

export type PromptRev = {
  rev: number;
  kind: AssetKind;
  fields: PromptFields;
  createdAt: string;
  author: 'director' | 'engine' | 'claude';
  trigger: 'seed' | 'reject' | 'regenerate' | 'alternate' | 'chat';
  basedOn?: number;
  feedback?: string; // the words that caused this revision, verbatim
  assetId?: string; // the rejected asset that caused it
  summary?: string;
  changes?: Change[];
  applied?: Record<string, number>; // how many times each rule has fired in this lineage
  unmatched?: string[]; // feedback no rule recognized: kept verbatim, flagged for a chat rewrite
};

export type AssetStatus = 'review' | 'accepted' | 'rejected' | 'superseded';

export type WebFiles = { image?: string; imagePhone?: string; video?: string; videoPhone?: string; poster?: string };

export type Asset = {
  id: string;
  kind: AssetKind;
  version: number;
  file: string; // relative to the assets root
  originalName: string;
  bytes: number;
  mime: string;
  width?: number;
  height?: number;
  durationSec?: number;
  promptRev: number; // which prompt revision this was generated from
  status: AssetStatus;
  feedback?: string;
  uploadedAt: string;
  reviewedAt?: string;
  web?: WebFiles; // optimized copies written on Accept
};

export type SceneState = {
  id: string;
  prompts: { image: PromptRev[]; video: PromptRev[] };
  assets: Asset[];
};

export type Manifest = {
  version: 1;
  updatedAt: string;
  scenes: Record<string, SceneState>;
};

export type SceneStatus = 'not-started' | 'in-review' | 'needs-revision' | 'partly-approved' | 'approved';
