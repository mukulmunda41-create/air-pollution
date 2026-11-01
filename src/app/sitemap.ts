import type { MetadataRoute } from 'next';
import { site } from '@/content/copy';

export default function sitemap(): MetadataRoute.Sitemap {
  return ['/', '/sources'].map((path) => ({ url: `${site.url}${path}` }));
}
