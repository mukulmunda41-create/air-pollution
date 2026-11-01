'use client';
import { Engine } from '@/engine/next';
import { setupMotion } from '@/story/setup';

export function Motion() {
  return <Engine setup={setupMotion} />;
}
