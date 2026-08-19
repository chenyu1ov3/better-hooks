import type { MetadataRoute } from 'next';
import { absoluteUrl } from '../lib/site';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  const site = new URL(absoluteUrl('/'));
  const allowedPath = site.pathname.endsWith('/') ? site.pathname : `${site.pathname}/`;

  return {
    rules: {
      userAgent: '*',
      allow: allowedPath,
    },
    sitemap: absoluteUrl('/sitemap.xml'),
    host: site.origin,
  };
}
