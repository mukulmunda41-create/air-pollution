'use client';
// Three.js stays out of the first paint: the canvas chunk loads once the loader hands over, and never
// loads under reduced motion, Save-Data, or without WebGL. The DOM art carries the film then.
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { glSupported } from '@/engine/env';
import type { PlateAsset } from './Plate';

const Stage = dynamic(() => import('./Stage'), { ssr: false });

export function StageLoader({ plates }: { plates: Record<string, PlateAsset> }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!glSupported()) return;
    const start = () => setOn(true);
    if (document.documentElement.classList.contains('is-loaded')) {
      const id = setTimeout(start, 0);
      return () => clearTimeout(id);
    }
    document.addEventListener('loader:done', start, { once: true });
    return () => document.removeEventListener('loader:done', start);
  }, []);
  if (!on) return null;
  return (
    <div id="gl" aria-hidden="true">
      <Stage plates={plates} />
    </div>
  );
}
