import { Archivo, Martian_Mono, Newsreader } from 'next/font/google';

// Title card and body. The width axis is what lets the wordmark breathe.
export const display = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-display', display: 'swap' });

// The narrator.
export const voice = Newsreader({ subsets: ['latin'], style: 'italic', axes: ['opsz'], variable: '--font-voice', display: 'swap' });

// Instruments: HUD and data only.
export const mono = Martian_Mono({ subsets: ['latin'], variable: '--font-instrument', display: 'swap', preload: false });
