import { Cursor } from '@/components/Cursor';
import { Header } from '@/components/Header';
import { Motion } from '@/components/Motion';
import { site } from '@/content/copy';
import './film.css';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CreativeWork',
  name: site.name,
  description: site.description,
  url: site.url,
  about: 'Air pollution',
};

export default function FilmLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <div id="curtain" aria-hidden="true"><div className="curtain__panel" /></div>
      <div id="loader" role="status" aria-label="Loading">
        <span className="loader__word" aria-hidden="true">{site.name}</span>
        <div className="loader__meta" data-loader-out>
          <span>Breathe in</span>
          <span data-loader-count>000</span>
        </div>
        <div className="loader__bar" data-loader-bar data-loader-out />
      </div>
      <Header />
      <main id="main" tabIndex={-1}>{children}</main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <Cursor />
      <Motion />
    </>
  );
}
