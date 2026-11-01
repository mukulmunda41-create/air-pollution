import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Nothing here',
  description: 'This page does not exist. The film is one breath away.',
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main id="main" className="grid min-h-dvh content-end gap-6 p-[var(--gutter)] font-display">
      <a className="skip-link" href="#main">Skip to content</a>
      <p className="font-instrument text-[0.6875rem] text-muted">404</p>
      <h1 className="text-[length:var(--t-title)] leading-[0.9] font-semibold text-nowrap [font-stretch:62%]">THERE IS NOTHING<br />TO BREATHE HERE.</h1>
      <p className="font-voice text-[length:var(--t-l)] italic">This page does not exist.</p>
      <p>
        <Link className="back-link" href="/">Back to the film</Link>
      </p>
    </main>
  );
}
