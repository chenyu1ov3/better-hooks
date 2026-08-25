import type { MetadataRoute } from 'next';
import { absoluteUrl, siteConfig } from '../lib/site';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  const sitePath = new URL(absoluteUrl('/')).pathname;
  const startUrl = sitePath.endsWith('/') ? sitePath : `${sitePath}/`;
  const iconUrl = new URL(absoluteUrl('/better-hooks-mark.svg')).pathname;

  return {
    id: startUrl,
    name: siteConfig.name,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: startUrl,
    scope: startUrl,
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#18181b',
    lang: 'en',
    dir: 'ltr',
    categories: ['developer tools', 'utilities'],
    icons: [
      {
        src: iconUrl,
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
