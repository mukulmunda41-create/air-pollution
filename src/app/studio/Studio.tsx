'use client';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { SceneView, StudioView } from '@/studio/api';
import { FIELD_LABELS, FIELD_ORDER, renderPrompt } from '@/studio/render-prompt';
import { assetFileName, STATUS_LABEL } from '@/studio/status';
import type { Asset, AssetKind, PromptRev, SceneStatus } from '@/studio/types';

const fileUrl = (rel: string) => `/api/studio/file/${rel.split('/').map(encodeURIComponent).join('/')}`;
const when = (iso?: string) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '');
const size = (b: number) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`);

const statusTone: Record<SceneStatus, string> = {
  'not-started': 'text-muted',
  'in-review': 'text-air',
  'needs-revision': 'text-reject',
  'partly-approved': 'text-accept',
  approved: 'text-accept',
};
const assetTone: Record<Asset['status'], string> = {
  review: 'text-air',
  accepted: 'text-accept',
  rejected: 'text-reject',
  superseded: 'text-muted',
};
const assetLabel: Record<Asset['status'], string> = { review: 'In review', accepted: 'Accepted', rejected: 'Rejected', superseded: 'Replaced' };

const btn = 'inline-flex min-h-10 items-center justify-center gap-2 border border-line px-4 py-2 text-sm transition-colors hover:border-ink hover:bg-ink hover:text-void disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink';
const label = 'font-instrument text-[0.6875rem] text-muted';

function CopyButton({ text, children }: { text: string; children: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={btn}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1800);
      }}
    >
      {done ? 'Copied' : children}
    </button>
  );
}

function Changes({ rev }: { rev: PromptRev }) {
  if (!rev.changes?.length && !rev.summary) return null;
  return (
    <section aria-label={`What changed in prompt revision ${rev.rev}`} className="grid gap-3 border border-line p-4">
      <h4 className="text-base font-semibold">What changed in revision {rev.rev}</h4>
      {rev.feedback && <p className="text-sm">Your note: <q className="font-voice text-base italic">{rev.feedback}</q></p>}
      {rev.summary && <p className="text-sm text-muted">{rev.summary}</p>}
      {!!rev.unmatched?.length && (
        <p className="text-sm text-reject">
          Kept word for word, because no built-in rule recognized it. For a proper rewrite, ask Claude Code in chat: “revise {rev.kind} prompt”.
        </p>
      )}
      <ul className="grid gap-3">
        {rev.changes?.map((c, i) => {
          const added = c.after.startsWith(c.before) ? c.after.slice(c.before.length).trim() : null;
          return (
            <li key={i} className="grid gap-1 border-t border-line pt-3 text-sm">
              <span className={label}>{FIELD_LABELS[c.field]}</span>
              <p className="text-muted">{c.why}</p>
              {added ? (
                <p>Added: <ins className="text-accept no-underline">{added}</ins></p>
              ) : (
                <>
                  <p className="text-muted">Before: <del>{c.before}</del></p>
                  <p>After: <ins className="text-accept no-underline">{c.after}</ins></p>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Preview({ asset }: { asset: Asset }) {
  const src = fileUrl(asset.file);
  return asset.kind === 'image' ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={`Version ${asset.version}: ${asset.originalName}`} className="block max-h-[60vh] w-full bg-black object-contain" />
  ) : (
    <video src={src} controls muted playsInline preload="metadata" aria-label={`Version ${asset.version}: ${asset.originalName}`} className="block max-h-[60vh] w-full bg-black" />
  );
}

function Dropzone({ scene, kind, onDone, onError }: { scene: string; kind: AssetKind; onDone: () => void; onError: (m: string) => void }) {
  const [over, setOver] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const send = useCallback((file: File) => {
    setProgress(0);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/studio/assets?scene=${scene}&kind=${kind}`);
    xhr.setRequestHeader('x-file-name', encodeURIComponent(file.name));
    xhr.upload.onprogress = (e) => e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      setProgress(null);
      if (xhr.status === 201) onDone();
      else {
        try { onError(JSON.parse(xhr.responseText).error ?? 'The upload failed.'); } catch { onError('The upload failed.'); }
      }
    };
    xhr.onerror = () => { setProgress(null); onError('The upload failed. Is the dev server still running?'); };
    xhr.send(file);
  }, [scene, kind, onDone, onError]);

  return (
    <div
      data-testid="dropzone"
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const file = e.dataTransfer.files[0];
        if (file) send(file);
      }}
      className={`grid place-items-center gap-3 border border-dashed p-8 text-center transition-colors ${over ? 'border-ink bg-panel' : 'border-line'}`}
    >
      {progress !== null ? (
        <p role="status">Uploading: {progress}%</p>
      ) : (
        <>
          <p>Drop the {kind} here</p>
          <input
            ref={input}
            type="file"
            aria-label={`Choose ${kind} file`}
            accept={kind === 'image' ? 'image/png,image/jpeg,image/webp,image/avif' : 'video/mp4,video/quicktime,video/webm'}
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) send(file);
              e.target.value = '';
            }}
          />
          <button type="button" className={btn} onClick={() => input.current?.click()}>Choose a file</button>
        </>
      )}
    </div>
  );
}

function KindPanel({ scene, kind, onChange, onError, onNext, hasNext }: {
  scene: SceneView; kind: AssetKind; onChange: () => void; onError: (m: string) => void; onNext: () => void; hasNext: boolean;
}) {
  const revs = scene.state.prompts[kind];
  const assets = useMemo(() => scene.state.assets.filter((a) => a.kind === kind).sort((a, b) => b.version - a.version), [scene, kind]);
  // A picked revision only holds until a new one arrives: then you see what changed.
  const [picked, setPicked] = useState<{ rev: number; at: number } | null>(null);
  const latest = revs[revs.length - 1];
  const shownRev = (picked?.at === revs.length && revs.find((r) => r.rev === picked.rev)) || latest;
  const [viewId, setViewId] = useState<string | null>(null);
  const viewing = assets.find((a) => a.id === viewId) ?? assets[0];
  const [rejecting, setRejecting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [justAccepted, setJustAccepted] = useState(false);

  const post = async (url: string, body: object, work: string) => {
    setBusy(work);
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const j = await res.json();
      if (!res.ok) { onError(j.error ?? 'That failed.'); return null; }
      if (j.warning) onError(j.warning);
      return j;
    } catch {
      onError('That failed. Is the dev server still running?');
      return null;
    } finally {
      setBusy(null);
    }
  };

  const text = renderPrompt(shownRev.fields);
  const delivery = scene.delivery[kind];
  const nextVersion = scene.next[kind];

  return (
    <div className="grid gap-6">
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 border-y border-line py-4 text-sm sm:grid-cols-2">
        <div><dt className={label}>Format</dt><dd>{delivery.spec}</dd></div>
        <div><dt className={label}>Name your download</dt><dd className="font-instrument text-xs">{delivery.filename}</dd></div>
        <div>
          <dt className={label}>Saved as</dt>
          <dd className="font-instrument text-xs break-all">/public/assets/{scene.id}/{assetFileName(scene.id, kind, nextVersion, kind === 'image' ? 'png' : 'mp4')}</dd>
        </div>
        <div><dt className={label}>Used in the film</dt><dd>{scene.use}</dd></div>
      </dl>

      <section aria-label={`${kind} prompt`} className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">{kind === 'image' ? 'Image' : 'Video'} prompt</h3>
          <label className="flex items-center gap-2 text-sm">
            <span className={label}>Revision</span>
            <select
              value={shownRev.rev}
              onChange={(e) => setPicked({ rev: Number(e.target.value), at: revs.length })}
              className="min-h-10 border border-line bg-void px-2"
            >
              {revs.map((r) => (
                <option key={r.rev} value={r.rev}>
                  {r.rev}{r.rev === latest.rev ? ' (latest)' : ''}{r.trigger === 'seed' ? ' (original)' : ''}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <CopyButton text={text}>Copy prompt</CopyButton>
          <CopyButton text={shownRev.fields.negative}>Copy negative only</CopyButton>
        </div>

        <Changes rev={shownRev} />

        <div className="grid gap-3" data-testid="prompt-text">
          {FIELD_ORDER.map((f) => (
            <div key={f} className="grid gap-1">
              <span className={label}>{FIELD_LABELS[f]}</span>
              <p className="text-sm leading-relaxed">{shownRev.fields[f]}</p>
            </div>
          ))}
        </div>

        <form
          className="grid gap-2 border-t border-line pt-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const j = await post('/api/studio/prompts', { scene: scene.id, kind, note }, 'regenerate');
            if (j) { setNote(''); onChange(); }
          }}
        >
          <label className="grid gap-1 text-sm">
            <span>Regenerate prompt</span>
            <span className={label}>Optional note. With no note you get a different take on the shot.</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="border border-line bg-void p-2 text-sm" />
          </label>
          <div><button type="submit" className={btn} disabled={!!busy}>{busy === 'regenerate' ? 'Working' : 'Regenerate prompt'}</button></div>
        </form>
      </section>

      <section aria-label={`Upload ${kind}`} className="grid gap-3">
        <h3 className="text-lg font-semibold">Upload</h3>
        <Dropzone scene={scene.id} kind={kind} onDone={() => { setViewId(null); setRejecting(false); setJustAccepted(false); onChange(); }} onError={onError} />
        <p className={label}>Generated from the latest prompt, revision {latest.rev}. Uploading a new file keeps every earlier version, and an accepted one stays live until a new one is accepted.</p>
      </section>

      {viewing && (
        <section aria-label="Review" className="grid gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="text-lg font-semibold">Review version {viewing.version}</h3>
            <span className={`font-instrument text-xs ${assetTone[viewing.status]}`} data-testid="viewing-status">{assetLabel[viewing.status]}</span>
          </div>
          <Preview key={viewing.id} asset={viewing} />
          <p className={label}>
            {viewing.originalName}, {size(viewing.bytes)}
            {viewing.width ? `, ${viewing.width}x${viewing.height}` : ''}
            {viewing.durationSec ? `, ${viewing.durationSec.toFixed(1)} s` : ''}, from prompt revision {viewing.promptRev}
          </p>
          {viewing.feedback && <p className="text-sm">Rejected because: <q className="font-voice text-base italic">{viewing.feedback}</q></p>}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={btn}
              disabled={!!busy || viewing.status === 'accepted'}
              onClick={async () => {
                const j = await post(`/api/studio/assets/${viewing.id}`, { action: 'accept' }, 'accept');
                if (j) { setRejecting(false); setJustAccepted(true); onChange(); }
              }}
            >
              {busy === 'accept' ? 'Accepting, making web copies' : 'Accept'}
            </button>
            <button
              type="button"
              className={btn}
              disabled={!!busy || viewing.status === 'rejected' || viewing.status === 'superseded'}
              aria-expanded={rejecting}
              onClick={() => setRejecting((r) => !r)}
            >
              Reject
            </button>
            {justAccepted && hasNext && <button type="button" className={btn} onClick={onNext}>Continue to next scene</button>}
          </div>

          {rejecting && (
            <form
              className="grid gap-2 border border-line p-4"
              onSubmit={async (e) => {
                e.preventDefault();
                const j = await post(`/api/studio/assets/${viewing.id}`, { action: 'reject', feedback }, 'reject');
                if (j) { setRejecting(false); setFeedback(''); setJustAccepted(false); onChange(); }
              }}
            >
              <label className="grid gap-1 text-sm">
                <span>What is wrong with it?</span>
                <span className={label}>Be specific. The original prompt and this file are kept either way.</span>
                <textarea required autoFocus value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3} className="border border-line bg-void p-2 text-sm" />
              </label>
              <div><button type="submit" className={btn} disabled={!!busy || !feedback.trim()}>{busy === 'reject' ? 'Working' : 'Reject and revise prompt'}</button></div>
            </form>
          )}
        </section>
      )}

      {assets.length > 0 && (
        <section aria-label="Version history" className="grid gap-2">
          <h3 className="text-lg font-semibold">Version history</h3>
          <ol className="grid">
            {assets.map((a) => (
              <li key={a.id} className="border-t border-line">
                <button type="button" onClick={() => { setViewId(a.id); setRejecting(false); }} className="grid min-h-11 w-full grid-cols-[3rem_6rem_1fr] items-center gap-3 py-2 text-left text-sm hover:bg-panel" aria-current={viewing?.id === a.id}>
                  <span className="font-instrument text-xs">v{String(a.version).padStart(3, '0')}</span>
                  <span className={`font-instrument text-xs ${assetTone[a.status]}`}>{assetLabel[a.status]}</span>
                  <span className="truncate text-muted">{when(a.reviewedAt ?? a.uploadedAt)}{a.feedback ? `: ${a.feedback}` : ''}</span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

export function Studio({ initial }: { initial: StudioView }) {
  const [view, setView] = useState(initial);
  const [selected, setSelected] = useState(() => initial.scenes.find((s) => s.required.length && s.status !== 'approved')?.id ?? initial.scenes[0].id);
  const [kind, setKind] = useState<AssetKind>('image');
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    const res = await fetch('/api/studio/state', { cache: 'no-store' });
    if (res.ok) { setView(await res.json()); setError(''); }
  }, []);

  const index = view.scenes.findIndex((s) => s.id === selected);
  const scene = view.scenes[index];
  const required = view.scenes.filter((s) => s.required.length);
  const approved = required.filter((s) => s.status === 'approved').length;

  return (
    <div className="grid min-h-dvh grid-cols-[minmax(0,1fr)] grid-rows-[auto_1fr] font-display">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line px-4 py-3 md:px-8">
        <h1 className="text-xl font-semibold [font-stretch:62%]">AIR POLLUTION: creative studio</h1>
        <p className="font-instrument text-[0.6875rem] text-muted" data-testid="overall">{approved} of {required.length} required scenes approved</p>
        {/* A full load on purpose: the film's engine boots once per page load. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a className="text-sm underline underline-offset-4" href="/">Open the film</a>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] md:grid-cols-[18rem_minmax(0,1fr)]">
        <nav aria-label="Scenes" className="border-b border-line md:border-r md:border-b-0">
          <ol className="flex overflow-x-auto md:block">
            {view.scenes.map((s) => (
              <li key={s.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => { setSelected(s.id); setError(''); }}
                  aria-current={s.id === selected}
                  className={`grid min-h-14 w-full gap-1 border-b border-line px-4 py-3 text-left hover:bg-panel ${s.id === selected ? 'bg-panel' : ''}`}
                >
                  <span className="text-sm"><span className="font-instrument text-xs text-muted">{String(s.chapter).padStart(2, '0')}</span> {s.title}</span>
                  <span className={`font-instrument text-[0.6875rem] ${statusTone[s.status]}`}>{STATUS_LABEL[s.status]}{s.required.length ? '' : ' (optional)'}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <main className="mx-auto grid w-full max-w-4xl grid-cols-[minmax(0,1fr)] content-start gap-6 px-4 py-6 md:px-8">
          <div className="grid gap-2">
            <p className={label}>Scene {scene.id}</p>
            <h2 className="text-4xl font-semibold leading-none [font-stretch:62%]">{scene.title}</h2>
            <p>{scene.description}</p>
            <p className="font-voice text-lg italic leading-snug text-ink/90">{scene.direction}</p>
          </div>

          {error && <p role="alert" className="border border-reject p-3 text-sm text-reject">{error}</p>}

          <div role="tablist" aria-label="Asset type" className="flex gap-2">
            {(['image', 'video'] as const).map((k) => {
              const accepted = scene.state.assets.some((a) => a.kind === k && a.status === 'accepted');
              return (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={kind === k}
                  onClick={() => setKind(k)}
                  className={`${btn} capitalize ${kind === k ? 'border-ink' : ''}`}
                >
                  {k}{accepted ? ': accepted' : ''}
                </button>
              );
            })}
          </div>

          <KindPanel
            key={`${scene.id}-${kind}`}
            scene={scene}
            kind={kind}
            onChange={refresh}
            onError={setError}
            hasNext={index < view.scenes.length - 1}
            onNext={() => { setSelected(view.scenes[index + 1].id); setKind('image'); scrollTo({ top: 0 }); }}
          />

          <details className="border-t border-line pt-4">
            <summary className="cursor-pointer text-sm">3D asset brief</summary>
            <p className="mt-2 text-sm leading-relaxed">{scene.asset3d}</p>
          </details>
        </main>
      </div>
    </div>
  );
}
