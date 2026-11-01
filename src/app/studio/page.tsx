import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { studioState } from '@/studio/api';
import { Studio } from './Studio';

export const metadata: Metadata = {
  title: 'Creative studio',
  description: 'Local tool for reviewing the film’s generated media.',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default async function StudioPage() {
  // The studio writes to disk, so it exists only on your machine in development.
  if (process.env.NODE_ENV === 'production') notFound();
  return <Studio initial={await studioState()} />;
}
