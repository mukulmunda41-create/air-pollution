// The film's text, server-rendered: crawlers, screen readers, reduced motion and no-WebGL all get
// the whole story. Lines are broken by hand for each title card, so the markup holds the poster.
/* eslint-disable @next/next/no-img-element -- fallback art: art-directed <picture>, and approved plates sized by CSS cover */
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { chapters, copy, type Chapter, type Fact } from '@/content/copy';
import { sources } from '@/content/sources';
import type { PlateAsset } from '@/scene/Plate';

function Title({ lines, as: Tag = 'h2', breathes = true }: { lines: readonly string[]; as?: 'h2' | 'h3' | 'p'; breathes?: boolean }) {
  return (
    <Tag className="title" data-breathes={breathes || undefined}>
      {lines.map((l) => (
        <span className="line" key={l}><span className="line__in">{l}</span></span>
      ))}
    </Tag>
  );
}

function FactLine({ fact }: { fact: Fact }) {
  return (
    <p className="fact" data-block>
      {fact.text}{' '}
      <Link href={`/sources#${fact.source}`} aria-label={`${sources[fact.source].label}: ${sources[fact.source].title}`}>{sources[fact.source].label}</Link>
    </p>
  );
}

// Fallback art. `live` chapters are hidden once the canvas is drawing them.
function Art({ chapter, plate }: { chapter: Chapter; plate?: PlateAsset }) {
  const live = chapter.built || !!plate;
  const still = plate?.image ?? plate?.poster;
  const isEarth = chapter.n === 1 || chapter.n === 7;
  return (
    <div className={`art art--${chapter.n}${live ? ' art--live' : ''}`} aria-hidden="true">
      {still ? (
        <img src={still} alt="" width={1920} height={1080} decoding="async" loading="lazy" />
      ) : isEarth ? (
        <picture>
          <source media="(max-width: 767px)" srcSet="/posters/earth-tall.webp" />
          <img
            src="/posters/earth-wide.webp"
            alt=""
            width={1920}
            height={1080}
            decoding="async"
            fetchPriority={chapter.n === 1 ? 'high' : 'auto'}
            loading={chapter.n === 1 ? 'eager' : 'lazy'}
            data-critical={chapter.n === 1 ? '' : undefined}
          />
        </picture>
      ) : null}
    </div>
  );
}

function Section({ chapter, plate, children }: { chapter: Chapter; plate?: PlateAsset; children: React.ReactNode }) {
  return (
    <section id={chapter.id} className="chapter" style={{ '--len': chapter.len } as CSSProperties} aria-label={`Chapter ${chapter.n}: ${chapter.name}`}>
      <Art chapter={chapter} plate={plate} />
      <div className="stage">
        <div className="stage__in">{children}</div>
      </div>
    </section>
  );
}

export function Chapters({ plates }: { plates: Record<string, PlateAsset> }) {
  const [one, two, three, four, five, six, seven] = chapters;
  return (
    <div id="film">
      <Section chapter={one} plate={plates[one.scene]}>
        <Title lines={copy.one.title} />
        <p className="voice" data-block>{copy.one.voice}</p>
      </Section>

      <Section chapter={two} plate={plates[two.scene]}>
        <Title lines={copy.two.title} />
        <p className="voice" data-block>{copy.two.voice}</p>
        <div className="facts">
          {copy.two.facts.map((f) => <FactLine key={f.text} fact={f} />)}
        </div>
      </Section>

      <Section chapter={three} plate={plates[three.scene]}>
        <Title lines={copy.three.title} />
        <ul className="labels">
          {copy.three.sources.map((s, i) => (
            <li key={s.name} data-block data-anchor={i}>
              <span className="label__name">{s.name}</span>
              <span className="label__text">{s.text}</span>{' '}
              <Link className="cite" href={`/sources#${s.source}`} aria-label={`${sources[s.source].label}: ${sources[s.source].title}`}>{sources[s.source].label}</Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section chapter={four} plate={plates[four.scene]}>
        <ol className="gauge" aria-label="The path of a fine particle" data-block>
          {copy.four.path.map((p) => <li key={p}>{p}</li>)}
        </ol>
        <div className="turn">
          <div data-turn-a><Title lines={copy.four.titleA} /></div>
          <div data-turn-b><Title lines={copy.four.titleB} as="p" /></div>
        </div>
        <div className="facts">
          {copy.four.facts.map((f) => <FactLine key={f.text} fact={f} />)}
          <p className="slate" data-block>{copy.four.note}</p>
        </div>
      </Section>

      <Section chapter={five} plate={plates[five.scene]}>
        <Title lines={copy.five.title} />
        <FactLine fact={copy.five.fact} />
      </Section>

      <Section chapter={six} plate={plates[six.scene]}>
        <Title lines={copy.six.title} />
        <ul className="solutions" aria-label="What reduces air pollution, according to WHO">
          {copy.six.solutions.map((s) => <li key={s} data-block>{s}</li>)}
        </ul>
        <div className="facts">
          {copy.six.facts.map((f) => <FactLine key={f.text} fact={f} />)}
        </div>
      </Section>

      <Section chapter={seven} plate={plates[seven.scene]}>
        <Title lines={copy.seven.title} />
        <div className="finale" data-block>
          <p className="protect">
            {copy.seven.protect.map((l) => <span key={l}>{l}</span>)}
          </p>
          <Link className="cta" href={copy.seven.ctaHref}>
            {copy.seven.cta}
            <span className="cta__arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </Section>
    </div>
  );
}
