'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { site } from '@/content/copy';

export function Header() {
  const path = usePathname();
  // The film's <h1> is the site's name. Inner pages title themselves.
  const Mark = path === '/' ? 'h1' : 'p';
  return (
    <header className="frame">
      <Mark className="wordmark" data-wordmark>
        <Link href="/">{site.name}</Link>
      </Mark>
      <nav className="frame__nav" aria-label="Main">
        <Link className="draw" href="/sources#act">What you can do</Link>
        <Link className="draw" href="/sources" aria-current={path === '/sources' ? 'page' : undefined}>Sources</Link>
      </nav>
    </header>
  );
}
