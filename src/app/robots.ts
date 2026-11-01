import type { MetadataRoute } from 'next';
import { site } from '@/content/copy';

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/', disallow: ['/studio', '/api/'] }, sitemap: `${site.url}/sitemap.xml` };
}
