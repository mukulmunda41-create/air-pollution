import type { Metadata } from 'next';
import Link from 'next/link';
import { act } from '@/content/copy';
import { sourceList } from '@/content/sources';
import { SourcesAir } from './SourcesAir';

export const metadata: Metadata = {
  title: 'What you can do, and our sources',
  description: 'What you can do about air pollution yourself, what to ask of others, and the primary sources behind every figure in the film.',
};

export default function Sources() {
  return (
    <article className="page">
      <SourcesAir />
      <header className="page__top">
        <h1 className="page__title">The next<br />breath is ours</h1>
        <p className="page__intro voice" style={{ maxWidth: '34ch' }}>{act.intro}</p>
      </header>

      <section id="act">
        <h2 data-reveal="up">What you can do</h2>
        <div className="page__body">
          <div data-reveal="up">
            <h3>Yourself</h3>
            <ul className="plain inline-links">
              {act.yourself.map((a) => typeof a === 'string' ? <li key={a}>{a}</li> : (
                <li key={a.link}>{a.before}<a href={a.href} target="_blank" rel="noopener noreferrer">{a.link}</a>{a.after}</li>
              ))}
            </ul>
          </div>
          <div data-reveal="up">
            <h3>Together</h3>
            <ul className="plain">{act.together.map((a) => <li key={a}>{a}</li>)}</ul>
          </div>
        </div>
      </section>

      <section id="sources">
        <h2 data-reveal="up">Sources</h2>
        <ol className="page__body" style={{ listStyle: 'none', padding: 0, gap: 0 }}>
          {sourceList.map((s) => (
            <li key={s.id} id={s.id} className="ref" data-reveal="up">
              <a href={s.href} target="_blank" rel="noopener noreferrer">{s.title}</a>
              <small>{s.publisher}, {s.date}. Used for: {s.used}</small>
            </li>
          ))}
        </ol>
      </section>

      <section id="credits">
        <h2 data-reveal="up">Credits</h2>
        <div className="page__body inline-links" data-reveal="up">
          <p>
            A school project. Earth textures from{' '}
            <a href="https://www.solarsystemscope.com/textures/" target="_blank" rel="noopener noreferrer">Solar System Scope</a>
            , licensed under{' '}
            <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>
            , based on NASA imagery, resized and merged by the three.js project. Type is Archivo, Newsreader and Martian Mono.
          </p>
          <p>The city, the street, the child and the views inside the body are illustrations made with generative AI tools, then directed and reviewed for this project. They do not show real people or real places.</p>
          <p>The PM2.5 readings in the film are illustrative values for each scene, not live measurements. The breath counter assumes 12 breaths a minute.</p>
        </div>
      </section>

      <p className="page__end"><Link className="back-link" href="/">Back to the film</Link></p>
    </article>
  );
}
