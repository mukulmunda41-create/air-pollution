import type { Metadata, Viewport } from 'next';
import { site } from '@/content/copy';
import { display, mono, voice } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name}: a film you scroll`, template: `%s | ${site.name}` },
  description: site.description,
  alternates: { canonical: './' },
  openGraph: { type: 'website', siteName: site.name, title: site.name, description: site.description, images: ['/og.png'] },
  twitter: { card: 'summary_large_image', title: site.name, description: site.description, images: ['/og.png'] },
};

export const viewport: Viewport = { themeColor: '#030507', colorScheme: 'dark' };

// Runs before first paint: hidden-until-revealed styles only apply when JS and motion are on.
const flags = `var h=document.documentElement.classList;h.add('js');if(!matchMedia('(prefers-reduced-motion: reduce)').matches){h.add('motion');try{if(!(navigator.connection||{}).saveData&&document.createElement('canvas').getContext('webgl2'))h.add('gl')}catch(e){}}if(location.pathname!=='/')h.add('no-loader')`;

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${display.variable} ${voice.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: flags }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
